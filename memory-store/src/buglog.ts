/**
 * Bug Memory (buglog) — Structured bug tracking that prevents re-discovering the same bugs.
 * Stores bug entries in SQLite for cross-session persistence.
 */

import Database from 'better-sqlite3';
import path from 'node:path';

// ── Types ──────────────────────────────────────────────────────────────────

export interface BugEntry {
  id: number;
  bug: string;           // What broke
  cause: string;         // Root cause
  fix: string;           // Exact fix applied
  file: string;          // File that was fixed
  platform: string;      // macOS, Linux, both
  discoveredBy: string;  // Margaret, manual, etc.
  project: string;
  timestamp: string;
}

export type NewBugEntry = Omit<BugEntry, 'id' | 'timestamp'>;

// ── BugLog class ───────────────────────────────────────────────────────────

export class BugLog {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const resolvedPath = dbPath || path.join(process.cwd(), 'memory.db');
    this.db = new Database(resolvedPath);
    this.db.pragma('journal_mode = WAL');
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS buglog (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bug TEXT NOT NULL,
        cause TEXT NOT NULL DEFAULT '',
        fix TEXT NOT NULL DEFAULT '',
        file TEXT NOT NULL DEFAULT '',
        platform TEXT NOT NULL DEFAULT 'both',
        discovered_by TEXT NOT NULL DEFAULT 'manual',
        project TEXT NOT NULL DEFAULT '',
        timestamp TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_buglog_file ON buglog(file);
      CREATE INDEX IF NOT EXISTS idx_buglog_project ON buglog(project);
      CREATE INDEX IF NOT EXISTS idx_buglog_platform ON buglog(platform);
    `);
  }

  // ── CRUD ───────────────────────────────────────────────────────────────

  addBug(entry: NewBugEntry): number {
    const result = this.db.prepare(`
      INSERT INTO buglog (bug, cause, fix, file, platform, discovered_by, project)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry.bug,
      entry.cause || '',
      entry.fix || '',
      entry.file || '',
      entry.platform || 'both',
      entry.discoveredBy || 'manual',
      entry.project || '',
    );
    return result.lastInsertRowid as number;
  }

  searchBugs(query: string): BugEntry[] {
    const pattern = `%${query}%`;
    return this.db.prepare(`
      SELECT id, bug, cause, fix, file, platform,
             discovered_by as discoveredBy, project, timestamp
      FROM buglog
      WHERE bug LIKE ? OR cause LIKE ? OR fix LIKE ? OR file LIKE ?
      ORDER BY timestamp DESC
    `).all(pattern, pattern, pattern, pattern) as BugEntry[];
  }

  /**
   * Check if any files being modified have known bugs.
   * Returns matching bugs for the given file paths.
   */
  checkBeforeBuild(files: string[]): BugEntry[] {
    if (files.length === 0) return [];

    const placeholders = files.map(() => '?').join(', ');

    // Check exact file matches
    const exactMatches = this.db.prepare(`
      SELECT id, bug, cause, fix, file, platform,
             discovered_by as discoveredBy, project, timestamp
      FROM buglog
      WHERE file IN (${placeholders})
      ORDER BY timestamp DESC
    `).all(...files) as BugEntry[];

    // Also check partial matches (e.g., file path contains the queried filename)
    const partialMatches: BugEntry[] = [];
    for (const f of files) {
      const basename = f.split('/').pop() || f;
      const results = this.db.prepare(`
        SELECT id, bug, cause, fix, file, platform,
               discovered_by as discoveredBy, project, timestamp
        FROM buglog
        WHERE file LIKE ? AND file NOT IN (${placeholders})
        ORDER BY timestamp DESC
      `).all(`%${basename}%`, ...files) as BugEntry[];
      partialMatches.push(...results);
    }

    // Deduplicate by id
    const seen = new Set(exactMatches.map(b => b.id));
    for (const b of partialMatches) {
      if (!seen.has(b.id)) {
        exactMatches.push(b);
        seen.add(b.id);
      }
    }

    return exactMatches;
  }

  getAll(): BugEntry[] {
    return this.db.prepare(`
      SELECT id, bug, cause, fix, file, platform,
             discovered_by as discoveredBy, project, timestamp
      FROM buglog
      ORDER BY timestamp DESC
    `).all() as BugEntry[];
  }

  getById(id: number): BugEntry | undefined {
    return this.db.prepare(`
      SELECT id, bug, cause, fix, file, platform,
             discovered_by as discoveredBy, project, timestamp
      FROM buglog
      WHERE id = ?
    `).get(id) as BugEntry | undefined;
  }

  count(): number {
    const row = this.db.prepare('SELECT COUNT(*) as count FROM buglog').get() as { count: number };
    return row.count;
  }

  close(): void {
    this.db.close();
  }
}

// ── Pre-populate known bugs ────────────────────────────────────────────────

export function seedKnownBugs(buglog: BugLog): number {
  const knownBugs: NewBugEntry[] = [
    {
      bug: 'grep -oP doesn\'t work on macOS',
      cause: 'macOS uses BSD grep which lacks -P (Perl regex) flag',
      fix: 'Use grep | sed instead of grep -oP, or install GNU grep via Homebrew',
      file: '',
      platform: 'macOS',
      discoveredBy: 'manual',
      project: 'great-minds',
    },
    {
      bug: 'timeout command doesn\'t exist on macOS',
      cause: 'timeout is a GNU coreutils command, not available on macOS by default',
      fix: 'Check with `command -v timeout` first, or use gtimeout from coreutils, or skip',
      file: '',
      platform: 'macOS',
      discoveredBy: 'manual',
      project: 'great-minds',
    },
    {
      bug: 'tmux send-keys doesn\'t work with Claude Code input buffer',
      cause: 'Claude Code\'s input buffer rejects pasted/injected prompts',
      fix: 'Use the Agent tool instead of tmux send-keys. 0 successes with tmux approach.',
      file: '',
      platform: 'both',
      discoveredBy: 'manual',
      project: 'great-minds',
    },
    {
      bug: 'claude -p drops steps on complex multi-step prompts',
      cause: 'The -p flag processes prompts differently, silently dropping later steps',
      fix: 'Use claude -p for single-step only, or use the Agent SDK daemon for multi-step',
      file: '',
      platform: 'both',
      discoveredBy: 'manual',
      project: 'great-minds',
    },
    {
      bug: 'PLUGIN_PATH hardcoded to Mac path on Linux',
      cause: 'Path was hardcoded as /Users/sethshoultes/... which doesn\'t exist on Linux',
      fix: 'Use environment variables or auto-detection for paths',
      file: 'daemon/src/config.ts',
      platform: 'Linux',
      discoveredBy: 'manual',
      project: 'great-minds-plugin',
    },
    {
      bug: 'worktree cleanup destroys uncommitted work',
      cause: 'git worktree remove --force deletes all uncommitted changes',
      fix: 'Check for uncommitted changes before cleanup, warn or commit first',
      file: '',
      platform: 'both',
      discoveredBy: 'manual',
      project: 'great-minds',
    },
    {
      bug: 'memory.db gitignored but needs to persist',
      cause: 'memory.db was in .gitignore so it was lost on fresh clones',
      fix: 'Keep memory.db gitignored but document that it\'s created on first run; seed with known data',
      file: 'memory-store/memory.db',
      platform: 'both',
      discoveredBy: 'manual',
      project: 'great-minds-plugin',
    },
    {
      bug: 'chokidar callback uses `path` but variable is `filePath`',
      cause: 'Variable name mismatch between callback parameter and usage',
      fix: 'Rename the callback parameter to match usage, or vice versa',
      file: 'daemon/src/daemon.ts',
      platform: 'both',
      discoveredBy: 'Margaret Hamilton',
      project: 'great-minds-plugin',
    },
  ];

  let added = 0;
  for (const bug of knownBugs) {
    // Check if this bug already exists (by exact bug text)
    const existing = buglog.searchBugs(bug.bug);
    const alreadyExists = existing.some(e => e.bug === bug.bug);
    if (!alreadyExists) {
      buglog.addBug(bug);
      added++;
    }
  }

  return added;
}
