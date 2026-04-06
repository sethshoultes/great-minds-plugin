/**
 * Token Ledger — Tracks token usage per agent call.
 * Stores entries in SQLite for lifetime cost tracking.
 */

import Database from 'better-sqlite3';
import path from 'node:path';

// ── Types ──────────────────────────────────────────────────────────────────

export interface TokenEntry {
  timestamp: string;
  agent: string;
  project: string;
  phase: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
}

export interface TokenSummary {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  entries: number;
}

// ── Cost Estimation ────────────────────────────────────────────────────────

/** Rough cost per token (Claude Sonnet 4 pricing as baseline) */
const INPUT_COST_PER_TOKEN = 3.0 / 1_000_000;   // $3 per 1M input tokens
const OUTPUT_COST_PER_TOKEN = 15.0 / 1_000_000;  // $15 per 1M output tokens

export function estimateCost(inputTokens: number, outputTokens: number): number {
  return inputTokens * INPUT_COST_PER_TOKEN + outputTokens * OUTPUT_COST_PER_TOKEN;
}

// ── TokenLedger class ──────────────────────────────────────────────────────

export class TokenLedger {
  private db: Database.Database;
  private sessionId: string;

  constructor(dbPath?: string) {
    const resolvedPath = dbPath || path.join(process.cwd(), 'memory.db');
    this.db = new Database(resolvedPath);
    this.db.pragma('journal_mode = WAL');
    this.sessionId = new Date().toISOString().replace(/[:.]/g, '-');
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS token_ledger (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        agent TEXT NOT NULL,
        project TEXT NOT NULL DEFAULT '',
        phase TEXT NOT NULL DEFAULT '',
        input_tokens INTEGER NOT NULL DEFAULT 0,
        output_tokens INTEGER NOT NULL DEFAULT 0,
        estimated_cost REAL NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_ledger_session ON token_ledger(session_id);
      CREATE INDEX IF NOT EXISTS idx_ledger_agent ON token_ledger(agent);
      CREATE INDEX IF NOT EXISTS idx_ledger_project ON token_ledger(project);
    `);
  }

  // ── Logging ────────────────────────────────────────────────────────────

  logUsage(entry: TokenEntry): number {
    const result = this.db.prepare(`
      INSERT INTO token_ledger (session_id, timestamp, agent, project, phase, input_tokens, output_tokens, estimated_cost)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      this.sessionId,
      entry.timestamp || new Date().toISOString(),
      entry.agent,
      entry.project || '',
      entry.phase || '',
      entry.inputTokens,
      entry.outputTokens,
      entry.estimatedCost || estimateCost(entry.inputTokens, entry.outputTokens),
    );
    return result.lastInsertRowid as number;
  }

  // ── Queries ────────────────────────────────────────────────────────────

  getSessionTotal(): TokenSummary {
    const row = this.db.prepare(`
      SELECT
        COALESCE(SUM(input_tokens), 0) as totalInputTokens,
        COALESCE(SUM(output_tokens), 0) as totalOutputTokens,
        COALESCE(SUM(estimated_cost), 0) as totalCost,
        COUNT(*) as entries
      FROM token_ledger
      WHERE session_id = ?
    `).get(this.sessionId) as TokenSummary;
    return row;
  }

  getProjectTotal(project: string): TokenSummary {
    const row = this.db.prepare(`
      SELECT
        COALESCE(SUM(input_tokens), 0) as totalInputTokens,
        COALESCE(SUM(output_tokens), 0) as totalOutputTokens,
        COALESCE(SUM(estimated_cost), 0) as totalCost,
        COUNT(*) as entries
      FROM token_ledger
      WHERE project = ?
    `).get(project) as TokenSummary;
    return row;
  }

  getAgentTotal(agent: string): TokenSummary {
    const row = this.db.prepare(`
      SELECT
        COALESCE(SUM(input_tokens), 0) as totalInputTokens,
        COALESCE(SUM(output_tokens), 0) as totalOutputTokens,
        COALESCE(SUM(estimated_cost), 0) as totalCost,
        COUNT(*) as entries
      FROM token_ledger
      WHERE agent = ?
    `).get(agent) as TokenSummary;
    return row;
  }

  getLifetimeTotal(): TokenSummary {
    const row = this.db.prepare(`
      SELECT
        COALESCE(SUM(input_tokens), 0) as totalInputTokens,
        COALESCE(SUM(output_tokens), 0) as totalOutputTokens,
        COALESCE(SUM(estimated_cost), 0) as totalCost,
        COUNT(*) as entries
      FROM token_ledger
    `).get() as TokenSummary;
    return row;
  }

  /** Get top agents by cost */
  getTopAgents(limit = 10): Array<{ agent: string } & TokenSummary> {
    return this.db.prepare(`
      SELECT
        agent,
        COALESCE(SUM(input_tokens), 0) as totalInputTokens,
        COALESCE(SUM(output_tokens), 0) as totalOutputTokens,
        COALESCE(SUM(estimated_cost), 0) as totalCost,
        COUNT(*) as entries
      FROM token_ledger
      GROUP BY agent
      ORDER BY totalCost DESC
      LIMIT ?
    `).all(limit) as Array<{ agent: string } & TokenSummary>;
  }

  /** Get top projects by cost */
  getTopProjects(limit = 10): Array<{ project: string } & TokenSummary> {
    return this.db.prepare(`
      SELECT
        project,
        COALESCE(SUM(input_tokens), 0) as totalInputTokens,
        COALESCE(SUM(output_tokens), 0) as totalOutputTokens,
        COALESCE(SUM(estimated_cost), 0) as totalCost,
        COUNT(*) as entries
      FROM token_ledger
      WHERE project != ''
      GROUP BY project
      ORDER BY totalCost DESC
      LIMIT ?
    `).all(limit) as Array<{ project: string } & TokenSummary>;
  }

  /** Get recent entries */
  getRecent(limit = 20): Array<TokenEntry & { id: number; session_id: string }> {
    return this.db.prepare(`
      SELECT id, session_id, timestamp, agent, project, phase,
             input_tokens as inputTokens, output_tokens as outputTokens,
             estimated_cost as estimatedCost
      FROM token_ledger
      ORDER BY id DESC
      LIMIT ?
    `).all(limit) as Array<TokenEntry & { id: number; session_id: string }>;
  }

  close(): void {
    this.db.close();
  }
}
