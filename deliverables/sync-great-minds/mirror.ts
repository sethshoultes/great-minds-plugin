#!/usr/bin/env npx tsx
/**
 * Mirror — Sync daemon files from great-minds-plugin to great-minds
 *
 * Usage:
 *   npx tsx scripts/mirror.ts
 *
 * Operations (per decisions.md):
 *   1. Copy 6 daemon files
 *   2. Run npm install
 *   3. Git commit + push
 *
 * Exit codes:
 *   0 - Success
 *   1 - Error (uncommitted changes, npm install failed, git push failed)
 *
 * Per decisions.md Decision 7: Output is quiet, declarative, past-tense.
 * Per decisions.md Decision 3: Zero confirmation dialogs.
 */

import { copyFileSync, existsSync, mkdirSync } from "fs";
import { execSync } from "child_process";
import { resolve, dirname, basename } from "path";
import { fileURLToPath } from "url";

// Paths relative to this script's location
const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(__filename);
const PLUGIN_ROOT = resolve(SCRIPT_DIR, "..");
const DEST_ROOT = resolve(PLUGIN_ROOT, "..", "great-minds");

// File manifest per PRD (NOT decisions.md hypothetical list)
const FILES_TO_MIRROR = [
  { src: "daemon/src/pipeline.ts", desc: "Core GSD pipeline" },
  { src: "daemon/src/agents.ts", desc: "14 persona prompts" },
  { src: "daemon/src/config.ts", desc: "Paths and timeouts" },
  { src: "daemon/src/daemon.ts", desc: "Main event loop" },
  { src: "daemon/package.json", desc: "Dependencies" },
  { src: "daemon/README.md", desc: "Daemon documentation" },
];

/**
 * Quiet output helper - past tense, declarative
 */
function log(message: string): void {
  console.log(message);
}

/**
 * Check destination repo exists and has no uncommitted changes
 * Per Risk Register: Fail fast on uncommitted changes
 */
function checkDestinationClean(): void {
  // Check if destination repo exists
  if (!existsSync(DEST_ROOT)) {
    throw new Error(`Destination repo not found: ${DEST_ROOT}`);
  }

  // Check for uncommitted changes (fail fast per Risk Register)
  try {
    const status = execSync(`git -C "${DEST_ROOT}" status --porcelain`, {
      encoding: "utf-8",
    }).trim();

    if (status) {
      throw new Error(
        "Error: Destination has uncommitted changes. Commit or stash first."
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("uncommitted")) {
      throw err;
    }
    throw new Error(`Error checking destination git status: ${err}`);
  }
}

/**
 * Copy all daemon files from plugin to great-minds repo
 */
function copyFiles(): void {
  for (const file of FILES_TO_MIRROR) {
    const srcPath = resolve(PLUGIN_ROOT, file.src);
    const destPath = resolve(DEST_ROOT, file.src);

    if (!existsSync(srcPath)) {
      throw new Error(`Source not found: ${srcPath}`);
    }

    // Ensure destination directory exists
    const destDir = dirname(destPath);
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }

    copyFileSync(srcPath, destPath);
    log(`Mirrored ${basename(file.src)}`);
  }
}

/**
 * Run npm install in destination daemon directory
 * Per REQ-013: Stop immediately if npm install fails
 */
function runNpmInstall(): void {
  const daemonPath = resolve(DEST_ROOT, "daemon");

  try {
    execSync(`cd "${daemonPath}" && npm install`, {
      encoding: "utf-8",
      stdio: "pipe", // Capture output, don't print npm spam
      timeout: 120_000, // 2 minute timeout
    });
    log("Installed dependencies");
  } catch (err) {
    // Per REQ-013: Stop immediately if npm install fails
    const errMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`npm install failed: ${errMsg}`);
  }
}

/**
 * Commit all changes and push to origin
 * Per REQ-014: Don't rollback commit on push failure
 */
function commitAndPush(): void {
  const commitMessage = "Mirror sync from plugin";

  try {
    // Stage all changes
    execSync(`git -C "${DEST_ROOT}" add -A`, { encoding: "utf-8" });

    // Check if there are changes to commit
    const status = execSync(`git -C "${DEST_ROOT}" status --porcelain`, {
      encoding: "utf-8",
    }).trim();

    if (!status) {
      log("No changes to commit");
      return;
    }

    // Commit
    execSync(`git -C "${DEST_ROOT}" commit -m "${commitMessage}"`, {
      encoding: "utf-8",
    });
    log(`Committed: "${commitMessage}"`);

    // Push (per REQ-014: don't rollback on failure)
    try {
      execSync(`git -C "${DEST_ROOT}" push`, { encoding: "utf-8" });
      log("Pushed to origin");
    } catch (pushErr) {
      const errMsg =
        pushErr instanceof Error ? pushErr.message : String(pushErr);
      console.error(`Push failed: ${errMsg}`);
      console.error(
        "Commit was successful. Resolve push issues and run: git -C great-minds push"
      );
      process.exit(1);
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`Git operation failed: ${errMsg}`);
  }
}

/**
 * Main execution - no confirmation per Decision 3
 */
async function main(): Promise<void> {
  // No confirmation dialogs per Decision 3
  // Execution begins immediately

  // Pre-flight checks
  checkDestinationClean();

  // Copy files
  copyFiles();

  // npm install
  runNpmInstall();

  // Git commit + push
  commitAndPush();
}

// Run immediately
main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
