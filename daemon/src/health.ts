// Great Minds Daemon — Health monitoring
// Replaces heartbeat.sh, git-monitor.sh, and memory-maintain.sh

import { execSync } from "child_process";
import { readFileSync, statSync, existsSync } from "fs";
import { resolve } from "path";
import {
  SITES, GIT_REPOS, GITHUB_REPOS, MEMORY_FILE,
  MEMORY_STORE_DIR, REPO_PATH,
} from "./config.js";
import { log, logError } from "./logger.js";

// ─── Site Health Checks ─────────────────────────────────────

interface SiteStatus {
  name: string;
  url: string;
  status: number | "error";
  ok: boolean;
}

export async function checkSites(): Promise<SiteStatus[]> {
  const results: SiteStatus[] = [];

  for (const site of SITES) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      const resp = await fetch(site.url, { signal: controller.signal });
      clearTimeout(timeout);
      results.push({ ...site, status: resp.status, ok: resp.ok });
    } catch (err) {
      results.push({ ...site, status: "error", ok: false });
    }
  }

  return results;
}

// ─── Git Status Checks ─────────────────────────────────────

interface GitStatus {
  name: string;
  dirty: number;
  unpushed: number;
}

export function checkGitRepos(): GitStatus[] {
  const results: GitStatus[] = [];

  for (const repo of GIT_REPOS) {
    try {
      statSync(`${repo.path}/.git`);
    } catch {
      continue; // Not a git repo or doesn't exist
    }

    try {
      const dirtyOutput = execSync(`git -C "${repo.path}" status --short 2>/dev/null`, { encoding: "utf-8" });
      const dirty = dirtyOutput.trim().split("\n").filter(Boolean).length;

      let unpushed = 0;
      try {
        const unpushedOutput = execSync(
          `git -C "${repo.path}" log --oneline @{u}..HEAD 2>/dev/null`,
          { encoding: "utf-8" },
        );
        unpushed = unpushedOutput.trim().split("\n").filter(Boolean).length;
      } catch {
        // No upstream or other git error — fine
      }

      results.push({ name: repo.name, dirty, unpushed });
    } catch {
      results.push({ name: repo.name, dirty: -1, unpushed: -1 });
    }
  }

  return results;
}

// ─── Memory Check ───────────────────────────────────────────

export function checkMemory(): { lines: number; bloated: boolean } {
  try {
    const content = readFileSync(MEMORY_FILE, "utf-8");
    const lines = content.split("\n").length;
    return { lines, bloated: lines > 100 };
  } catch {
    return { lines: 0, bloated: false };
  }
}

// ─── GitHub Issue Polling ───────────────────────────────────

interface GitHubIssue {
  repo: string;
  number: number;
  title: string;
  createdAt: string;
}

export function pollGitHubIssues(sinceMinutes = 10): GitHubIssue[] {
  const issues: GitHubIssue[] = [];
  const since = new Date(Date.now() - sinceMinutes * 60_000).toISOString();

  for (const repo of GITHUB_REPOS) {
    try {
      const output = execSync(
        `gh issue list --repo "${repo}" --state open --json number,title,createdAt --jq '[.[] | select(.createdAt > "${since}")]' 2>/dev/null`,
        { encoding: "utf-8", timeout: 15_000 },
      );
      const parsed = JSON.parse(output || "[]");
      for (const issue of parsed) {
        issues.push({
          repo,
          number: issue.number,
          title: issue.title,
          createdAt: issue.createdAt,
        });
      }
    } catch {
      // gh CLI not available or rate-limited — skip
    }
  }

  return issues;
}

// ─── Memory Store Maintenance ───────────────────────────────

export function runMemoryMaintenance(): void {
  log("MEMORY: Running maintenance");
  try {
    // Verify memory store exists — if not, install it
    if (!existsSync(resolve(MEMORY_STORE_DIR, "src/cli.ts"))) {
      log("MEMORY: Memory store not found — installing from great-minds");
      execSync(`cp -r /home/agent/great-minds/memory-store "${MEMORY_STORE_DIR}" && cd "${MEMORY_STORE_DIR}" && npm install 2>&1`, {
        encoding: "utf-8",
        timeout: 120_000,
      });
    }
    execSync(`cd "${MEMORY_STORE_DIR}" && npx tsx src/cli.ts maintain 2>&1`, {
      encoding: "utf-8",
      timeout: 120_000,
      cwd: MEMORY_STORE_DIR,
    });
    log("MEMORY: Maintenance complete");
  } catch (err) {
    logError("Memory maintenance failed", err);
  }
}

// ─── Git Auto-Commit ────────────────────────────────────────

export function gitAutoCommit(): void {
  for (const repo of GIT_REPOS) {
    try {
      statSync(`${repo.path}/.git`);
      const dirty = execSync(`git -C "${repo.path}" status --short 2>/dev/null`, { encoding: "utf-8" }).trim();
      if (dirty) {
        const fileCount = dirty.split("\n").length;
        log(`GIT: ${repo.name} has ${fileCount} dirty files — auto-committing`);
        execSync(
          `cd "${repo.path}" && git add -A && git commit -m "daemon: auto-commit ${fileCount} files" 2>&1`,
          { encoding: "utf-8", timeout: 30_000 },
        );
        // Push if we have an upstream
        try {
          execSync(`cd "${repo.path}" && git push 2>&1`, { encoding: "utf-8", timeout: 30_000 });
          log(`GIT: ${repo.name} pushed`);
        } catch {
          log(`GIT: ${repo.name} push failed (no upstream or auth issue)`);
        }
      }
    } catch {
      // skip
    }
  }
}

// ─── Full Heartbeat ─────────────────────────────────────────

export async function runHeartbeat(): Promise<string[]> {
  log("HEARTBEAT: Running health checks");
  const problems: string[] = [];

  // Site checks
  const sites = await checkSites();
  for (const site of sites) {
    if (!site.ok) {
      problems.push(`${site.name} down (${site.status})`);
      log(`HEARTBEAT: ${site.name} — ${site.status}`);
    }
  }

  // Git checks
  const repos = checkGitRepos();
  for (const repo of repos) {
    if (repo.dirty > 10) {
      problems.push(`${repo.name} very dirty (${repo.dirty} files)`);
    }
    if (repo.dirty > 0) {
      log(`HEARTBEAT: ${repo.name} — ${repo.dirty} dirty, ${repo.unpushed} unpushed`);
    }
  }

  // Memory check
  const mem = checkMemory();
  if (mem.bloated) {
    problems.push(`MEMORY.md bloated (${mem.lines} lines)`);
  }
  log(`HEARTBEAT: memory ${mem.lines} lines`);

  if (problems.length === 0) {
    log("HEARTBEAT: All clear");
  } else {
    log(`HEARTBEAT: ${problems.length} problem(s): ${problems.join(", ")}`);
  }

  return problems;
}
