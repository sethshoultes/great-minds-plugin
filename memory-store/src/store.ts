/**
 * Core vector store — SQLite + embeddings for Great Minds agency memory.
 */

import Database from 'better-sqlite3';
import path from 'node:path';
import {
  type EmbeddingProvider,
  TfIdfEmbeddings,
  contentHash,
  createEmbeddingProvider,
} from './embeddings.js';

// ── Types ──────────────────────────────────────────────────────────────────

export const MEMORY_TYPES = [
  'learning',
  'decision',
  'qa-finding',
  'board-review',
  'retrospective',
  'architecture',
] as const;

export type MemoryType = (typeof MEMORY_TYPES)[number];

export interface Memory {
  id: number;
  type: MemoryType;
  agent: string;
  project: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface MemoryWithScore extends Memory {
  score: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function embeddingToBuffer(embedding: Float64Array): Buffer {
  return Buffer.from(embedding.buffer, embedding.byteOffset, embedding.byteLength);
}

function bufferToEmbedding(buf: Buffer): Float64Array {
  const ab = new ArrayBuffer(buf.byteLength);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.byteLength; i++) {
    view[i] = buf[i];
  }
  return new Float64Array(ab);
}

function cosineSimilarity(a: Float64Array, b: Float64Array): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// ── MemoryStore class ──────────────────────────────────────────────────────

export class MemoryStore {
  private db: Database.Database;
  private embedder: EmbeddingProvider;

  constructor(dbPath?: string, embedder?: EmbeddingProvider) {
    const resolvedPath = dbPath || path.join(process.cwd(), 'memory.db');
    this.db = new Database(resolvedPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    this.embedder = embedder || createEmbeddingProvider();
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        agent TEXT NOT NULL DEFAULT '',
        project TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL,
        embedding BLOB,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
      CREATE INDEX IF NOT EXISTS idx_memories_agent ON memories(agent);
      CREATE INDEX IF NOT EXISTS idx_memories_project ON memories(project);

      CREATE TABLE IF NOT EXISTS embeddings_cache (
        content_hash TEXT PRIMARY KEY,
        embedding BLOB NOT NULL
      );
    `);
  }

  /**
   * Rebuild TF-IDF vocabulary from all stored content.
   * Only needed when using the TF-IDF fallback.
   */
  async rebuildTfIdfVocabulary(): Promise<void> {
    if (!(this.embedder instanceof TfIdfEmbeddings)) return;

    const rows = this.db.prepare('SELECT content FROM memories').all() as { content: string }[];
    this.embedder.buildVocabulary(rows.map((r) => r.content));

    // Re-embed everything with updated vocabulary
    const allRows = this.db.prepare('SELECT id, content FROM memories').all() as {
      id: number;
      content: string;
    }[];

    const update = this.db.prepare('UPDATE memories SET embedding = ? WHERE id = ?');
    const upsertCache = this.db.prepare(
      'INSERT OR REPLACE INTO embeddings_cache (content_hash, embedding) VALUES (?, ?)'
    );

    for (const row of allRows) {
      const embedding = await this.embedder.embed(row.content);
      const buf = embeddingToBuffer(embedding);
      update.run(buf, row.id);
      upsertCache.run(contentHash(row.content), buf);
    }
  }

  /**
   * Get a cached embedding or generate a new one.
   */
  private async getEmbedding(text: string): Promise<Float64Array> {
    const hash = contentHash(text);
    const cached = this.db
      .prepare('SELECT embedding FROM embeddings_cache WHERE content_hash = ?')
      .get(hash) as { embedding: Buffer } | undefined;

    if (cached) {
      return bufferToEmbedding(cached.embedding);
    }

    const embedding = await this.embedder.embed(text);
    const buf = embeddingToBuffer(embedding);
    this.db
      .prepare('INSERT OR REPLACE INTO embeddings_cache (content_hash, embedding) VALUES (?, ?)')
      .run(hash, buf);

    return embedding;
  }

  // ── CRUD ───────────────────────────────────────────────────────────────

  async add(
    type: MemoryType,
    agent: string,
    project: string,
    content: string
  ): Promise<number> {
    // For TF-IDF, rebuild vocabulary to include new content
    if (this.embedder instanceof TfIdfEmbeddings) {
      const existing = this.db.prepare('SELECT content FROM memories').all() as {
        content: string;
      }[];
      this.embedder.buildVocabulary([...existing.map((r) => r.content), content]);
    }

    const embedding = await this.getEmbedding(content);
    const buf = embeddingToBuffer(embedding);

    const result = this.db
      .prepare(
        `INSERT INTO memories (type, agent, project, content, embedding)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(type, agent || '', project || '', content, buf);

    return result.lastInsertRowid as number;
  }

  async search(query: string, limit = 5): Promise<MemoryWithScore[]> {
    // For TF-IDF, ensure vocabulary is up to date
    if (this.embedder instanceof TfIdfEmbeddings) {
      const docs = this.db.prepare('SELECT content FROM memories').all() as {
        content: string;
      }[];
      this.embedder.buildVocabulary(docs.map((r) => r.content));
    }

    const queryEmbedding = await this.embedder.embed(query);

    const rows = this.db
      .prepare('SELECT id, type, agent, project, content, embedding, created_at, updated_at FROM memories WHERE embedding IS NOT NULL')
      .all() as (Memory & { embedding: Buffer })[];

    const scored: MemoryWithScore[] = rows.map((row) => {
      const rowEmbedding = bufferToEmbedding(row.embedding);
      const score = cosineSimilarity(queryEmbedding, rowEmbedding);
      const { embedding: _, ...rest } = row;
      return { ...rest, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  listByType(type: MemoryType): Memory[] {
    return this.db
      .prepare(
        'SELECT id, type, agent, project, content, created_at, updated_at FROM memories WHERE type = ? ORDER BY created_at DESC'
      )
      .all(type) as Memory[];
  }

  listByAgent(agent: string): Memory[] {
    return this.db
      .prepare(
        'SELECT id, type, agent, project, content, created_at, updated_at FROM memories WHERE agent = ? ORDER BY created_at DESC'
      )
      .all(agent) as Memory[];
  }

  listByProject(project: string): Memory[] {
    return this.db
      .prepare(
        'SELECT id, type, agent, project, content, created_at, updated_at FROM memories WHERE project = ? ORDER BY created_at DESC'
      )
      .all(project) as Memory[];
  }

  getById(id: number): Memory | undefined {
    return this.db
      .prepare(
        'SELECT id, type, agent, project, content, created_at, updated_at FROM memories WHERE id = ?'
      )
      .get(id) as Memory | undefined;
  }

  remove(id: number): boolean {
    const result = this.db.prepare('DELETE FROM memories WHERE id = ?').run(id);
    return result.changes > 0;
  }

  count(): number {
    const row = this.db.prepare('SELECT COUNT(*) as count FROM memories').get() as {
      count: number;
    };
    return row.count;
  }

  stats(): { total: number; byType: Record<string, number>; byAgent: Record<string, number> } {
    const total = this.count();

    const typeRows = this.db
      .prepare('SELECT type, COUNT(*) as count FROM memories GROUP BY type')
      .all() as { type: string; count: number }[];
    const byType: Record<string, number> = {};
    for (const r of typeRows) byType[r.type] = r.count;

    const agentRows = this.db
      .prepare("SELECT agent, COUNT(*) as count FROM memories WHERE agent != '' GROUP BY agent")
      .all() as { agent: string; count: number }[];
    const byAgent: Record<string, number> = {};
    for (const r of agentRows) byAgent[r.agent] = r.count;

    return { total, byType, byAgent };
  }

  // ── Maintenance methods ──────────────────────────────────────────────────

  /**
   * Return all memories with their embeddings for similarity calculations.
   */
  private allWithEmbeddings(): (Memory & { embedding: Buffer })[] {
    return this.db
      .prepare(
        'SELECT id, type, agent, project, content, embedding, created_at, updated_at FROM memories WHERE embedding IS NOT NULL'
      )
      .all() as (Memory & { embedding: Buffer })[];
  }

  /**
   * Find pairs of memories with cosine similarity above the threshold.
   */
  findDuplicates(threshold: number): Array<{ a: Memory; b: Memory; similarity: number }> {
    const rows = this.allWithEmbeddings();
    const pairs: Array<{ a: Memory; b: Memory; similarity: number }> = [];

    for (let i = 0; i < rows.length; i++) {
      const embA = bufferToEmbedding(rows[i].embedding);
      for (let j = i + 1; j < rows.length; j++) {
        const embB = bufferToEmbedding(rows[j].embedding);
        const sim = cosineSimilarity(embA, embB);
        if (sim >= threshold) {
          const { embedding: _a, ...a } = rows[i];
          const { embedding: _b, ...b } = rows[j];
          pairs.push({ a, b, similarity: sim });
        }
      }
    }

    return pairs;
  }

  /**
   * Remove the older memory from each duplicate pair (similarity >= threshold).
   * Returns the number of memories removed.
   */
  removeDuplicates(threshold: number): { removed: number; pairs: string[] } {
    const dupes = this.findDuplicates(threshold);
    const removedIds = new Set<number>();
    const pairDescs: string[] = [];

    for (const { a, b, similarity } of dupes) {
      // Keep the newer one, remove the older one
      const older = new Date(a.created_at) < new Date(b.created_at) ? a : b;
      const newer = older === a ? b : a;

      if (removedIds.has(older.id)) continue; // already removed

      this.remove(older.id);
      removedIds.add(older.id);
      pairDescs.push(
        `#${older.id} ≈ #${newer.id} (${(similarity * 100).toFixed(1)}%) — removed #${older.id}`
      );
    }

    return { removed: removedIds.size, pairs: pairDescs };
  }

  /**
   * Remove low-value memories: board reviews that are just "all green" or
   * QA findings that are just "PASS" with no substantive content.
   */
  pruneLowValue(): { removed: number; descriptions: string[] } {
    const lowValuePatterns = [
      /^(all\s+green|everything\s+(looks?\s+)?good|no\s+issues?\s+found|all\s+clear)/i,
      /^(PASS|✅\s*PASS|all\s+tests?\s+pass(ed|ing)?)/i,
      /^(no\s+action\s+needed|nothing\s+to\s+report)/i,
    ];

    const candidates = this.db
      .prepare(
        "SELECT id, type, content FROM memories WHERE type IN ('board-review', 'qa-finding')"
      )
      .all() as Pick<Memory, 'id' | 'type' | 'content'>[];

    const descriptions: string[] = [];
    let removed = 0;

    for (const mem of candidates) {
      const trimmed = mem.content.trim();
      // Short entries that match low-value patterns
      const isLowValue =
        trimmed.length < 200 &&
        lowValuePatterns.some((p) => p.test(trimmed));

      if (isLowValue) {
        this.remove(mem.id);
        removed++;
        descriptions.push(`#${mem.id} [${mem.type}]: "${trimmed.substring(0, 80)}..."`);
      }
    }

    return { removed, descriptions };
  }

  /**
   * Replace N memories with a single consolidated memory.
   */
  async consolidateCluster(
    ids: number[],
    mergedContent: string,
    type?: MemoryType,
    agent?: string,
    project?: string
  ): Promise<number> {
    // Determine type/agent/project from first existing memory if not provided
    const first = this.getById(ids[0]);
    const memType = type || (first?.type as MemoryType) || 'learning';
    const memAgent = agent || first?.agent || '';
    const memProject = project || first?.project || '';

    // Remove old memories
    for (const id of ids) {
      this.remove(id);
    }

    // Add the consolidated memory
    const newId = await this.add(memType, memAgent, memProject, mergedContent);
    return newId;
  }

  /**
   * Find clusters of similar memories (within same type) above a similarity threshold.
   */
  findClusters(
    threshold: number
  ): Array<{ type: string; ids: number[]; contents: string[] }> {
    const rows = this.allWithEmbeddings();

    // Group by type
    const byType = new Map<string, (Memory & { embedding: Buffer })[]>();
    for (const row of rows) {
      const group = byType.get(row.type) || [];
      group.push(row);
      byType.set(row.type, group);
    }

    const clusters: Array<{ type: string; ids: number[]; contents: string[] }> = [];

    for (const [type, members] of byType) {
      const used = new Set<number>();

      for (let i = 0; i < members.length; i++) {
        if (used.has(members[i].id)) continue;

        const cluster = [i];
        const embA = bufferToEmbedding(members[i].embedding);

        for (let j = i + 1; j < members.length; j++) {
          if (used.has(members[j].id)) continue;
          const embB = bufferToEmbedding(members[j].embedding);
          if (cosineSimilarity(embA, embB) >= threshold) {
            cluster.push(j);
          }
        }

        if (cluster.length >= 2) {
          const ids = cluster.map((idx) => members[idx].id);
          const contents = cluster.map((idx) => members[idx].content);
          ids.forEach((id) => used.add(id));
          clusters.push({ type, ids, contents });
        }
      }
    }

    return clusters;
  }

  /**
   * Ensure the score column exists, then calculate and store relevance scores.
   * Score = weighted combination of recency, uniqueness, and content length.
   */
  scoreMemories(): { scored: number } {
    // Add score column if it doesn't exist
    try {
      this.db.exec('ALTER TABLE memories ADD COLUMN score REAL DEFAULT 0');
    } catch {
      // Column already exists
    }

    const rows = this.allWithEmbeddings();
    if (rows.length === 0) return { scored: 0 };

    const now = Date.now();
    const update = this.db.prepare('UPDATE memories SET score = ? WHERE id = ?');

    // Pre-calculate all pairwise similarities for uniqueness scoring
    const embeddings = rows.map((r) => bufferToEmbedding(r.embedding));

    const transaction = this.db.transaction(() => {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        // Recency: exponential decay, half-life = 30 days
        const ageMs = now - new Date(row.created_at).getTime();
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        const recency = Math.exp(-ageDays / 30);

        // Uniqueness: 1 - average similarity to other memories
        let totalSim = 0;
        for (let j = 0; j < rows.length; j++) {
          if (i === j) continue;
          totalSim += cosineSimilarity(embeddings[i], embeddings[j]);
        }
        const avgSim = rows.length > 1 ? totalSim / (rows.length - 1) : 0;
        const uniqueness = 1 - avgSim;

        // Content richness: longer content is generally more valuable (log scale)
        const richness = Math.min(1, Math.log(row.content.length + 1) / Math.log(2000));

        // Weighted score
        const score = recency * 0.4 + uniqueness * 0.4 + richness * 0.2;
        update.run(score, row.id);
      }
    });

    transaction();
    return { scored: rows.length };
  }

  /**
   * Remove memories below a given score percentile.
   * E.g., percentile=10 removes the bottom 10%.
   */
  pruneByScore(percentile: number): { removed: number; threshold: number } {
    // Ensure scores exist
    this.scoreMemories();

    const rows = this.db
      .prepare('SELECT id, score FROM memories ORDER BY score ASC')
      .all() as { id: number; score: number }[];

    if (rows.length === 0) return { removed: 0, threshold: 0 };

    const cutoffIndex = Math.floor(rows.length * (percentile / 100));
    if (cutoffIndex === 0) return { removed: 0, threshold: rows[0].score };

    const threshold = rows[cutoffIndex - 1].score;
    let removed = 0;

    for (let i = 0; i < cutoffIndex; i++) {
      this.remove(rows[i].id);
      removed++;
    }

    return { removed, threshold };
  }

  close(): void {
    this.db.close();
  }
}
