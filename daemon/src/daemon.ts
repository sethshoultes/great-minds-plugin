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
import { readdir, stat } from "fs/promises";
import { PRDS_DIR, STATUS_FILE, INTERVALS, REPO_PATH, AGENT_TIMEOUT_MS, PIPELINE_TIMEOUT_MS } from "./config.js";
import { runPipeline } from "./pipeline.js";
import { runFeatureDream } from "./dream.js";
import { runHeartbeat, pollGitHubIssues, runMemoryMaintenance, gitAutoCommit, processIntake } from "./health.js";
import { log, logError, trimLog } from "./logger.js";
import { notify } from "./telegram.js";

// ─── State ──────────────────────────────────────────────────

let pipelineRunning = false;
let shuttingDown = false;
let pipelineStartTime = 0; // for watchdog

// Track last-run timestamps
let lastHeartbeat = 0;
let lastGitHubPoll = 0;
let lastDream = 0;
let lastMemoryMaintain = 0;

// Queue of PRDs to process
const prdQueue: string[] = [];

// ─── PRD Watcher ────────────────────────────────────────────

function startPrdWatcher(): void {
  log("WATCHER: Watching prds/ for new files");

  const watcher = watch(PRDS_DIR, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 500 },
  });

  watcher.on("add", (filePath: string) => {
    const name = basename(filePath);
    if (!name.endsWith(".md") || name === "TEMPLATE.md" || filePath.includes("completed") || filePath.includes("failed")) return;

    const slug = name.replace(/\.md$/, "");
    log(`WATCHER: New PRD detected — ${name}`);

    if (!prdQueue.includes(slug)) {
      prdQueue.push(slug);
      log(`QUEUE: Added "${slug}" (${prdQueue.length} in queue)`);
    }
  });

  watcher.on("error", (err) => {
    logError("File watcher error", err);
  });
}

// ─── Scan for existing PRDs newer than STATUS.md ────────────

async function scanExistingPrds(): Promise<void> {
  let statusMtime = 0;
  try {
    const st = await stat(STATUS_FILE);
    statusMtime = st.mtimeMs;
  } catch {
    // STATUS.md doesn't exist — treat all PRDs as new
  }

  try {
    const files = await readdir(PRDS_DIR);
    for (const file of files) {
      if (!file.endsWith(".md") || file === "TEMPLATE.md") continue;
      const filePath = resolve(PRDS_DIR, file);
      const st = await stat(filePath);
      if (st.mtimeMs > statusMtime) {
        const slug = file.replace(/\.md$/, "");
        if (!prdQueue.includes(slug)) {
          prdQueue.push(slug);
          log(`SCAN: Found pending PRD — ${file}`);
        }
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
  pipelineRunning = true;
  pipelineStartTime = Date.now();

  try {
    await runPipeline(`${project}.md`, project);
  } catch (err) {
    logError(`Pipeline failed for "${project}"`, err);

    // Notify via Telegram
    await notify(
      `Pipeline crashed for *${project}*:\n\`${err}\`\nArchiving failed PRD and continuing.`,
      "critical",
    ).catch(() => {});

    // Archive the failed PRD so the daemon doesn't retry it endlessly
    try {
      const { mkdir: mkdirAsync, rename } = await import("fs/promises");
      const failedDir = resolve(PRDS_DIR, "failed");
      await mkdirAsync(failedDir, { recursive: true });
      const prdPath = resolve(PRDS_DIR, `${project}.md`);
      await rename(prdPath, resolve(failedDir, `${project}.md`)).catch(() => {});
      log(`ARCHIVE: Moved failed PRD ${project}.md to prds/failed/`);
    } catch (archiveErr) {
      logError("Failed to archive failed PRD", archiveErr);
    }
  } finally {
    pipelineRunning = false;
    pipelineStartTime = 0;
  }
}

// ─── Pipeline Watchdog ─────────────────────────────────────

async function checkPipelineWatchdog(): Promise<void> {
  if (!pipelineRunning || pipelineStartTime === 0) return;

  const elapsed = Date.now() - pipelineStartTime;
  if (elapsed > PIPELINE_TIMEOUT_MS) {
    const minutes = (elapsed / 60_000).toFixed(1);
    const msg = `WATCHDOG: Pipeline has been running for ${minutes} minutes (limit: ${PIPELINE_TIMEOUT_MS / 60_000} min) — force-skipping`;
    log(msg);
    await notify(msg, "critical").catch(() => {});

    // Force-reset pipeline state so the daemon picks up the next PRD
    // The currently running agent will finish its turn but no new phases will start
    pipelineRunning = false;
    pipelineStartTime = 0;
  }
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

    // If pipeline is running, it will finish its current agent call
    // then the loop will exit on the next tick
    if (!pipelineRunning) {
      log("SHUTDOWN: No pipeline running — exiting immediately");
      process.exit(0);
    } else {
      log("SHUTDOWN: Pipeline in progress — will exit when current agent finishes");
      // Force exit after 60 seconds
      setTimeout(() => {
        log("SHUTDOWN: Force exit after timeout");
        process.exit(1);
      }, 60_000);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

// ─── Main Loop ──────────────────────────────────────────────

async function main(): Promise<void> {
  log("══════════════════════════════════════════════════");
  log("GREAT MINDS DAEMON v1.1 — Starting");
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

  // Notify Telegram that the daemon is starting
  await notify("Daemon *started* and watching for work.", "info").catch(() => {});

  setupShutdown();
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
      // Process PRDs first
      await processNextPrd();

      // Run periodic tasks
      await runPeriodicTasks();
    } catch (err) {
      logError("Main loop error", err);
    }

    // Wait before next tick
    await new Promise((resolve) => setTimeout(resolve, INTERVALS.LOOP_TICK_MS));
  }

  log("DAEMON: Exited main loop");
  process.exit(0);
}

// ─── Start ──────────────────────────────────────────────────

main().catch((err) => {
  logError("Fatal error", err);
  process.exit(1);
});
