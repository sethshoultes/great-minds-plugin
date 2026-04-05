/**
 * Embedding generation for the memory store.
 * Uses OpenAI text-embedding-3-small when API key is available.
 * Falls back to TF-IDF for basic similarity search when offline.
 */

import crypto from 'node:crypto';

// ── Types ──────────────────────────────────────────────────────────────────

export interface EmbeddingProvider {
  embed(text: string): Promise<Float64Array>;
  dimensions: number;
  name: string;
}

// ── Content hashing ────────────────────────────────────────────────────────

export function contentHash(text: string): string {
  return crypto.createHash('sha256').update(text.trim()).digest('hex');
}

// ── OpenAI provider ────────────────────────────────────────────────────────

export class OpenAIEmbeddings implements EmbeddingProvider {
  name = 'openai';
  dimensions = 1536; // text-embedding-3-small
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async embed(text: string): Promise<Float64Array> {
    // Dynamic import to avoid requiring openai when using TF-IDF fallback
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: this.apiKey });

    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.trim(),
    });

    return new Float64Array(response.data[0].embedding);
  }
}

// ── TF-IDF fallback provider ───────────────────────────────────────────────

/**
 * Simple TF-IDF embedding that works entirely offline.
 * Not as good as neural embeddings but provides basic semantic search.
 * Uses a fixed vocabulary built from all stored content.
 */
export class TfIdfEmbeddings implements EmbeddingProvider {
  name = 'tfidf';
  dimensions = 512;
  private vocabulary: Map<string, number> = new Map();
  private idf: Map<string, number> = new Map();
  private documentCount = 0;

  /**
   * Build vocabulary from existing documents.
   * Call this after loading content from the database.
   */
  buildVocabulary(documents: string[]): void {
    this.documentCount = documents.length || 1;
    const docFreq = new Map<string, number>();

    // Count document frequency for each term
    for (const doc of documents) {
      const terms = this.tokenize(doc);
      const unique = new Set(terms);
      for (const term of unique) {
        docFreq.set(term, (docFreq.get(term) || 0) + 1);
      }
    }

    // Build vocabulary (top terms by document frequency)
    const sorted = [...docFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.dimensions);

    this.vocabulary.clear();
    this.idf.clear();

    for (let i = 0; i < sorted.length; i++) {
      const [term, freq] = sorted[i];
      this.vocabulary.set(term, i);
      this.idf.set(term, Math.log(this.documentCount / (freq + 1)));
    }
  }

  async embed(text: string): Promise<Float64Array> {
    const vector = new Float64Array(this.dimensions);
    const terms = this.tokenize(text);
    const termCounts = new Map<string, number>();

    for (const term of terms) {
      termCounts.set(term, (termCounts.get(term) || 0) + 1);
    }

    const maxFreq = Math.max(...termCounts.values(), 1);

    for (const [term, count] of termCounts) {
      const idx = this.vocabulary.get(term);
      if (idx !== undefined) {
        const tf = 0.5 + 0.5 * (count / maxFreq); // augmented TF
        const idf = this.idf.get(term) || 0;
        vector[idx] = tf * idf;
      }
    }

    // Normalize
    let norm = 0;
    for (let i = 0; i < vector.length; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
  }
}

// ── Factory ────────────────────────────────────────────────────────────────

export function createEmbeddingProvider(): EmbeddingProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    return new OpenAIEmbeddings(apiKey);
  }
  console.warn('[memory-store] No OPENAI_API_KEY found, using TF-IDF fallback');
  return new TfIdfEmbeddings();
}

// ── Stop words ─────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her',
  'was', 'one', 'our', 'out', 'has', 'had', 'how', 'its', 'may', 'who',
  'did', 'get', 'got', 'him', 'his', 'she', 'use', 'way', 'this', 'that',
  'with', 'have', 'from', 'they', 'been', 'said', 'each', 'will', 'than',
  'them', 'then', 'into', 'more', 'make', 'when', 'what', 'just', 'also',
  'some', 'very', 'about', 'which', 'there', 'their', 'would', 'could',
  'should', 'these', 'other', 'being', 'after', 'before', 'does', 'doing',
]);
