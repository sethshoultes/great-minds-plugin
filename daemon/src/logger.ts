// Great Minds Daemon — Logger
// Writes to both console and log file

import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { LOG_DIR } from "./config.js";

const LOG_FILE = `${LOG_DIR}/daemon.log`;

// Ensure log directory exists
try {
  mkdirSync(LOG_DIR, { recursive: true });
} catch {
  // ignore
}

export function log(message: string): void {
  const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
  const line = `${timestamp} DAEMON: ${message}`;
  console.log(line);
  try {
    appendFileSync(LOG_FILE, line + "\n");
  } catch {
    // If we can't write to log file, console is enough
  }
}

export function logError(message: string, err?: unknown): void {
  const errStr = err instanceof Error ? err.message : String(err ?? "");
  log(`ERROR: ${message}${errStr ? ` — ${errStr}` : ""}`);
}

/** Trim log file to last N lines */
export function trimLog(maxLines = 500): void {
  try {
    const content = readFileSync(LOG_FILE, "utf-8");
    const lines = content.split("\n");
    if (lines.length > maxLines) {
      writeFileSync(LOG_FILE, lines.slice(-maxLines).join("\n"));
    }
  } catch {
    // ignore
  }
}
