// @ts-ignore
import DatabaseLib from "better-sqlite3";
const Database = DatabaseLib as any;

const DB_PATH = process.env.COST_DB_PATH || "/home/agent/shipyard-ai/data/costs.db";

export interface CostRecord {
  prdId: string; model: string; tokensIn: number; tokensOut: number;
  costUsd: number; durationMs: number; timestamp: string;
  phase: "plan" | "build" | "verify" | "ship"; success: boolean;
}

let db: any = null;

function getDb(): any {
  if (!db) {
    db = new Database(DB_PATH);
    db.exec(`CREATE TABLE IF NOT EXISTS costs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prd_id TEXT NOT NULL, model TEXT, tokens_in INTEGER, tokens_out INTEGER,
      cost_usd REAL, duration_ms INTEGER,
      timestamp TEXT DEFAULT (datetime('now')),
      phase TEXT, success INTEGER);
      CREATE INDEX IF NOT EXISTS idx_prd ON costs(prd_id);
      CREATE INDEX IF NOT EXISTS idx_date ON costs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_model ON costs(model);
    `);
  }
  return db;
}

export function logCost(record: CostRecord): void {
  const stmt = getDb().prepare(
    `INSERT INTO costs (prd_id,model,tokens_in,tokens_out,cost_usd,duration_ms,phase,success) VALUES (?,?,?,?,?,?,?,?)`
  );
  stmt.run(record.prdId, record.model, record.tokensIn, record.tokensOut,
    record.costUsd, record.durationMs, record.phase, record.success ? 1 : 0);
}

export function getSummary() {
  const row = getDb().prepare(
    `SELECT COALESCE(SUM(cost_usd),0) as total_cost, COUNT(*) as total_runs,
     COALESCE(AVG(duration_ms),0) as avg_duration, COALESCE(AVG(success),0) as success_rate FROM costs`
  ).get();
  return { totalCost: row.total_cost, totalRuns: row.total_runs,
    avgDuration: row.avg_duration, successRate: row.success_rate };
}

export function closeDb(): void { if (db) { db.close(); db = null; } }
