// Great Minds Daemon — Health monitoring
// Replaces heartbeat.sh, git-monitor.sh, and memory-maintain.sh

import { execSync } from "child_process";
import { readFileSync, writeFileSync, statSync, existsSync } from "fs";
import { resolve } from "path";
import {
  SITES, GIT_REPOS, GITHUB_REPOS, MEMORY_FILE,
  MEMORY_STORE_DIR, REPO_PATH, PRDS_DIR,
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

// ─── Intake Interfaces ─────────────────────────────────────────

interface IntakeIssue {
  repo: string;
  number: number;
  title: string;
  body: string;
  labels: string[];
  author: string;
  createdAt: string;
  url: string;
}

interface IntakeState {
  convertedIssues: string[];  // Format: "{repo}#{number}"
}

const INTAKE_STATE_FILE = resolve(REPO_PATH, ".github-intake-state.json");

function sanitizeRepoSlug(repo: string): string {
  return repo.replace(/[^a-zA-Z0-9-]/g, "-");
}

// ─── Intake State Management ─────────────────────────────────────

function loadIntakeState(): IntakeState {
  try {
    if (existsSync(INTAKE_STATE_FILE)) {
      const content = readFileSync(INTAKE_STATE_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    log(`INTAKE: Error loading state file, starting fresh: ${err}`);
  }
  return { convertedIssues: [] };
}

function saveIntakeState(state: IntakeState): void {
  try {
    writeFileSync(INTAKE_STATE_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    log(`INTAKE ERROR: Failed to save state file: ${err}`);
  }
}

function isIssueAlreadyConverted(state: IntakeState, repo: string, number: number): boolean {
  const key = `${repo}#${number}`;
  return state.convertedIssues.includes(key);
}

function markIssueConverted(state: IntakeState, repo: string, number: number): void {
  const key = `${repo}#${number}`;
  if (!state.convertedIssues.includes(key)) {
    state.convertedIssues.push(key);
  }
}

// ─── Intake Polling ─────────────────────────────────────────

export async function pollGitHubIssuesWithLabels(): Promise<IntakeIssue[]> {
  log("INTAKE: Polling GitHub for p0/p1 issues");

  const fetchRepo = async (repo: string): Promise<IntakeIssue[]> => {
    try {
      // Note: gh CLI --label uses OR logic by default when multiple labels specified
      const output = execSync(
        `gh issue list --repo "${repo}" --state open --label p0,p1 --json number,title,body,labels,author,createdAt,url 2>&1`,
        { encoding: "utf-8", timeout: 15_000 }
      );
      const parsed = JSON.parse(output || "[]");
      return parsed.map((issue: any) => ({
        repo,
        number: issue.number,
        title: issue.title,
        body: issue.body || "",
        labels: issue.labels?.map((l: any) => l.name) || [],
        author: issue.author?.login || "unknown",
        createdAt: issue.createdAt,
        url: issue.url,
      }));
    } catch (err) {
      const errMsg = String(err);
      if (errMsg.includes("auth") || errMsg.includes("login") || errMsg.includes("401")) {
        log("INTAKE ERROR: gh CLI not authenticated. Run 'gh auth login' to configure.");
        throw new Error("gh CLI not authenticated");
      }
      log(`INTAKE: Error fetching ${repo}: ${errMsg}`);
      return [];
    }
  };

  const results = await Promise.all(GITHUB_REPOS.map(fetchRepo));
  const issues = results.flat();
  log(`INTAKE: Found ${issues.length} p0/p1 issue(s) across ${GITHUB_REPOS.length} repos`);
  return issues;
}

// ─── Intake PRD Conversion ─────────────────────────────────────

function convertIssueToPRD(issue: IntakeIssue): string {
  const repoSlug = sanitizeRepoSlug(issue.repo);
  const filename = `github-issue-${repoSlug}-${issue.number}.md`;
  const filepath = resolve(PRDS_DIR, filename);

  const prdContent = `# PRD: ${issue.title}

> Auto-generated from GitHub issue ${issue.repo}#${issue.number}
> ${issue.url}

## Metadata
- **Repo:** ${issue.repo}
- **Issue:** #${issue.number}
- **Author:** ${issue.author}
- **Labels:** ${issue.labels.join(", ")}
- **Created:** ${issue.createdAt}

## Problem
${issue.body}

## Success Criteria
- Issue ${issue.repo}#${issue.number} requirements are met
- All tests pass
`;

  writeFileSync(filepath, prdContent);
  log(`INTAKE: Created PRD ${filename}`);
  return filename;
}

// ─── Intake Orchestration ─────────────────────────────────────

export async function processIntake(): Promise<number> {
  log("INTAKE: Starting intake processing");
  const state = loadIntakeState();

  let issues: IntakeIssue[];
  try {
    issues = await pollGitHubIssuesWithLabels();
  } catch (err) {
    log(`INTAKE ERROR: Failed to poll issues: ${err}`);
    return 0;
  }

  let convertedCount = 0;
  for (const issue of issues) {
    if (isIssueAlreadyConverted(state, issue.repo, issue.number)) {
      log(`INTAKE: Skipping already-converted issue ${issue.repo}#${issue.number}`);
      continue;
    }

    try {
      convertIssueToPRD(issue);
      markIssueConverted(state, issue.repo, issue.number);
      convertedCount++;
    } catch (err) {
      log(`INTAKE ERROR: Failed to convert ${issue.repo}#${issue.number}: ${err}`);
    }
  }

  if (convertedCount > 0) {
    saveIntakeState(state);
    log(`INTAKE: Converted ${convertedCount} issue(s) to PRDs`);
  } else {
    log("INTAKE: No new issues to convert");
  }

  return convertedCount;
}

// ─── Legacy GitHub Polling ─────────────────────────────────────

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
