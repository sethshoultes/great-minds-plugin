#!/usr/bin/env npx tsx
// Great Minds Daemon — Main event loop
// Replaces ALL cron scripts with a single persistent process.
//
// Watches for:
//   1. New PRDs in prds/ (chokidar file watcher)
//   2. New GitHub issues (poll every 5 min)
//   3. Idle → featureDream every 4 hours
//   4. Memory maintenance every 6 hours
//   5. Heartbeat health check every 5 min

import { watch } from "chokidar";
import { basename, resolve } from "path";
import { readdir, stat, mkdir as mkdirAsync, rename } from "fs/promises";
import { existsSync, writeFileSync, readFileSync, unlinkSync } from "fs";
import { PRDS_DIR, STATUS_FILE, INTERVALS, REPO_PATH, AGENT_TIMEOUT_MS, PIPELINE_TIMEOUT_MS } from "./config.js";
import { runPipeline } from "./pipeline.js";
import { runFeatureDream } from "./dream.js";
import { runHeartbeat, runMemoryMaintenance, processIntake } from "./health.js";
import { log, logError, trimLog } from "./logger.js";
import { notify } from "./telegram.js";

// ─── PID Lockfile ──────────────────────────────────────────

const PID_FILE = "/tmp/great-minds-daemon.pid";

function acquireLock(): void {
  if (existsSync(PID_FILE)) {
    const oldPid = readFileSync(PID_FILE, "utf-8").trim();
    try {
      process.kill(Number(oldPid), 0); // Check if process exists
      console.error(`FATAL: Daemon already running (PID ${oldPid}). Exiting.`);
      process.exit(1);
    } catch {
      // Old PID is stale — remove it
      unlinkSync(PID_FILE);
    }
  }
  writeFileSync(PID_FILE, String(process.pid));
  log(`PID: ${process.pid} (lockfile: ${PID_FILE})`);
}

function releaseLock(): void {
  try { unlinkSync(PID_FILE); } catch {}
}

// ─── State ──────────────────────────────────────────────────

let pipelineRunning = false;
let pipelineAborted = false;
let shuttingDown = false;
let pipelineStartTime = 0;
let currentlyProcessing: string | null = null;

// Track last-run timestamps
let lastHeartbeat = 0;
let lastGitHubPoll = 0;
let lastDream = 0;
let lastMemoryMaintain = 0;

// Queue of PRDs to process — persisted to disk
const prdQueue: string[] = [];
const QUEUE_FILE = resolve(REPO_PATH, ".daemon-queue.json");

function saveQueue(): void {
  try { writeFileSync(QUEUE_FILE, JSON.stringify(prdQueue)); } catch {}
}

function loadQueue(): void {
  try {
    if (existsSync(QUEUE_FILE)) {
      const data = JSON.parse(readFileSync(QUEUE_FILE, "utf-8"));
      if (Array.isArray(data)) {
        for (const slug of data) {
          if (typeof slug === "string" && !prdQueue.includes(slug) && !isAlreadyProcessed(`${slug}.md`)) {
            prdQueue.push(slug);
          }
        }
        log(`QUEUE: Loaded ${prdQueue.length} PRD(s) from disk`);
      }
    }
  } catch {}
}

// ─── Duplicate Detection ────────────────────────────────────

function isAlreadyProcessed(prdFile: string): boolean {
  const completedPath = resolve(PRDS_DIR, "completed", prdFile);
  const failedPath = resolve(PRDS_DIR, "failed", prdFile);
  const parkedPath = resolve(PRDS_DIR, "parked", prdFile);
  return existsSync(completedPath) || existsSync(failedPath) || existsSync(parkedPath);
}

// ─── PRD Watcher ────────────────────────────────────────────

function startPrdWatcher(): void {
  log("WATCHER: Watching prds/ for new files");

  const watcher = watch(PRDS_DIR, {
    ignoreInitial: true,
    depth: 0, // Only watch top-level, not subdirectories
    awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 500 },
  });

  watcher.on("add", (filePath: string) => {
    const name = basename(filePath);
    if (!name.endsWith(".md") || name === "TEMPLATE.md") return;

    const slug = name.replace(/\.md$/, "");

    // Skip if already processed, queued, or currently building
    if (isAlreadyProcessed(name)) {
      log(`WATCHER: Skipping "${name}" — already processed`);
      return;
    }
    if (slug === currentlyProcessing) {
      log(`WATCHER: Skipping "${name}" — currently building`);
      return;
    }

    log(`WATCHER: New PRD detected — ${name}`);

    if (!prdQueue.includes(slug)) {
      prdQueue.push(slug);
      saveQueue();
      log(`QUEUE: Added "${slug}" (${prdQueue.length} in queue)`);
    }
  });

  watcher.on("error", (err) => {
    logError("File watcher error", err);
  });
}

// ─── Scan for existing PRDs ─────────────────────────────────

async function scanExistingPrds(): Promise<void> {
  try {
    const files = await readdir(PRDS_DIR);
    for (const file of files) {
      if (!file.endsWith(".md") || file === "TEMPLATE.md") continue;

      // Check it's a file, not a directory
      const filePath = resolve(PRDS_DIR, file);
      const st = await stat(filePath);
      if (st.isDirectory()) continue;

      // Skip if already processed
      if (isAlreadyProcessed(file)) {
        log(`SCAN: Skipping "${file}" — already processed`);
        continue;
      }

      const slug = file.replace(/\.md$/, "");
      if (!prdQueue.includes(slug)) {
        prdQueue.push(slug);
        saveQueue();
        log(`SCAN: Found pending PRD — ${file}`);
      }
    }
  } catch {
    // prds dir might not exist
  }
}

// ─── Process next PRD from queue ────────────────────────────

async function processNextPrd(): Promise<void> {
  if (pipelineRunning || prdQueue.length === 0) return;

  const project = prdQueue.shift()!;
  saveQueue();
  const prdFile = `${project}.md`;

  // Final duplicate check before spending tokens
  if (isAlreadyProcessed(prdFile)) {
    log(`SKIP: "${project}" already processed — not rebuilding`);
    return;
  }

  currentlyProcessing = project;
  pipelineRunning = true;
  pipelineAborted = false;
  pipelineStartTime = Date.now();

  try {
    await runPipeline(prdFile, project);
  } catch (err) {
    logError(`Pipeline failed for "${project}"`, err);

    await notify(
      `Pipeline crashed for *${project}*:\n\`${err}\`\nArchiving failed PRD and continuing.`,
      "critical",
    ).catch(() => {});

    // Archive the failed PRD
    try {
      const failedDir = resolve(PRDS_DIR, "failed");
      await mkdirAsync(failedDir, { recursive: true });
      const prdPath = resolve(PRDS_DIR, prdFile);
      if (existsSync(prdPath)) {
        await rename(prdPath, resolve(failedDir, prdFile)).catch(() => {});
        log(`ARCHIVE: Moved failed PRD ${prdFile} to prds/failed/`);
      }
    } catch (archiveErr) {
      logError("Failed to archive failed PRD", archiveErr);
    }
  } finally {
    pipelineRunning = false;
    pipelineAborted = false;
    pipelineStartTime = 0;
    currentlyProcessing = null;
  }
}

// ─── Pipeline Watchdog ─────────────────────────────────────

async function checkPipelineWatchdog(): Promise<void> {
  if (!pipelineRunning || pipelineStartTime === 0) return;

  const elapsed = Date.now() - pipelineStartTime;
  if (elapsed > PIPELINE_TIMEOUT_MS) {
    const minutes = (elapsed / 60_000).toFixed(1);
    const msg = `WATCHDOG: Pipeline exceeded ${PIPELINE_TIMEOUT_MS / 60_000} min (${minutes} min) — flagging abort`;
    log(msg);
    await notify(msg, "critical").catch(() => {});
    // Set abort flag — pipeline checks this between phases
    // Do NOT flip pipelineRunning here — let processNextPrd's finally block handle it
    pipelineAborted = true;
  }
}

// Export for pipeline to check
export function isPipelineAborted(): boolean {
  return pipelineAborted;
}

// ─── Check GitHub issues ────────────────────────────────────

async function checkGitHubIssues(): Promise<void> {
  if (pipelineRunning) return;

  try {
    await processIntake();
  } catch (err) {
    logError("Intake processing failed", err);
  }
}

// ─── Periodic Tasks ─────────────────────────────────────────

async function runPeriodicTasks(): Promise<void> {
  const now = Date.now();

  // Heartbeat — every 5 min
  if (now - lastHeartbeat >= INTERVALS.HEARTBEAT_MS) {
    lastHeartbeat = now;
    try {
      await runHeartbeat();
    } catch (err) {
      logError("Heartbeat failed", err);
    }
  }

  // GitHub issue poll — every 5 min
  if (now - lastGitHubPoll >= INTERVALS.GITHUB_POLL_MS) {
    lastGitHubPoll = now;
    try {
      await checkGitHubIssues();
    } catch (err) {
      logError("GitHub poll failed", err);
    }
  }

  // featureDream — every 4 hours (only when idle)
  if (!pipelineRunning && now - lastDream >= INTERVALS.DREAM_MS) {
    lastDream = now;
    try {
      await runFeatureDream();
    } catch (err) {
      logError("Feature dream failed", err);
    }
  }

  // Memory maintenance — every 6 hours
  if (now - lastMemoryMaintain >= INTERVALS.MEMORY_MAINTAIN_MS) {
    lastMemoryMaintain = now;
    try {
      runMemoryMaintenance();
    } catch (err) {
      logError("Memory maintenance failed", err);
    }
  }

  // Pipeline watchdog — detect hung pipelines
  await checkPipelineWatchdog();

  // Trim log file periodically
  trimLog(500);
}

// ─── Graceful Shutdown ──────────────────────────────────────

function setupShutdown(): void {
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    log(`SHUTDOWN: Received ${signal} — stopping gracefully`);

    if (!pipelineRunning) {
      log("SHUTDOWN: No pipeline running — exiting immediately");
      releaseLock();
      process.exit(0);
    } else {
      log("SHUTDOWN: Pipeline in progress — will exit when current agent finishes");
      setTimeout(() => {
        log("SHUTDOWN: Force exit after timeout");
        releaseLock();
        process.exit(1);
      }, 60_000);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

// ─── Main Loop ──────────────────────────────────────────────

async function main(): Promise<void> {
  // C1: PID lockfile — prevent duplicate daemons
  acquireLock();

  log("══════════════════════════════════════════════════");
  log("GREAT MINDS DAEMON v2.0 — Starting");
  log(`REPO: ${REPO_PATH}`);
  log(`PRDs: ${PRDS_DIR}`);
  log(`Loop tick: ${INTERVALS.LOOP_TICK_MS / 1000}s`);
  log(`Heartbeat: every ${INTERVALS.HEARTBEAT_MS / 60_000} min`);
  log(`GitHub poll: every ${INTERVALS.GITHUB_POLL_MS / 60_000} min`);
  log(`Dream: every ${INTERVALS.DREAM_MS / 3_600_000} hours`);
  log(`Memory: every ${INTERVALS.MEMORY_MAINTAIN_MS / 3_600_000} hours`);
  log(`Agent timeout: ${AGENT_TIMEOUT_MS / 60_000} min`);
  log(`Pipeline timeout: ${PIPELINE_TIMEOUT_MS / 60_000} min`);
  log("══════════════════════════════════════════════════");

  await notify("Daemon *started* and watching for work.", "info").catch(() => {});

  setupShutdown();

  // C2: Load persisted queue before scanning
  loadQueue();

  startPrdWatcher();
  await scanExistingPrds();

  if (prdQueue.length > 0) {
    log(`STARTUP: ${prdQueue.length} pending PRD(s) in queue`);
  } else {
    log("STARTUP: No pending PRDs — entering idle mode");
  }

  // Run initial heartbeat
  lastHeartbeat = Date.now();
  lastGitHubPoll = Date.now();
  try {
    await runHeartbeat();
  } catch (err) {
    logError("Initial heartbeat failed", err);
  }

  // Main loop
  while (!shuttingDown) {
    try {
      await processNextPrd();
      await runPeriodicTasks();
    } catch (err) {
      logError("Main loop error", err);
    }

    await new Promise((resolve) => setTimeout(resolve, INTERVALS.LOOP_TICK_MS));
  }

  log("DAEMON: Exited main loop");
  releaseLock();
  process.exit(0);
}

// ─── Start ──────────────────────────────────────────────────

main().catch((err) => {
  logError("Fatal error", err);
  releaseLock();
  process.exit(1);
});
