// Great Minds Daemon — Configuration

import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Root repo — uses PIPELINE_REPO env var if set, otherwise relative */
export const REPO_PATH = process.env.PIPELINE_REPO || resolve(__dirname, "../..");

/** Root of the great-minds-plugin repo */
export const PLUGIN_PATH = resolve(REPO_PATH, "../great-minds-plugin");

/** GitHub repos to monitor for new issues */
export const GITHUB_REPOS = [
  "sethshoultes/great-minds",
  "sethshoultes/great-minds-plugin",
  "sethshoultes/localgenius",
  "sethshoultes/shipyard-ai",
  "sethshoultes/dash-command-bar",
  "sethshoultes/pinned-notes",
];

/** Sites to health-check */
export const SITES = [
  { name: "LocalGenius", url: "https://localgenius.company" },
  { name: "Great Minds", url: "https://greatminds.company" },
];

/** Related git repos to monitor for uncommitted changes */
export const GIT_REPOS = [
  { name: "great-minds", path: REPO_PATH },
  { name: "great-minds-plugin", path: PLUGIN_PATH },
  { name: "localgenius", path: resolve(REPO_PATH, "../localgenius") },
];

/** Intervals (in milliseconds) */
export const INTERVALS = {
  /** How often to poll for new GitHub issues */
  GITHUB_POLL_MS: 5 * 60 * 1000, // 5 minutes

  /** How often to run the heartbeat health check */
  HEARTBEAT_MS: 5 * 60 * 1000, // 5 minutes

  /** How often to run featureDream when idle */
  DREAM_MS: 4 * 60 * 60 * 1000, // 4 hours

  /** How often to run memory maintenance */
  MEMORY_MAINTAIN_MS: 6 * 60 * 60 * 1000, // 6 hours

  /** How long to wait between main loop iterations */
  LOOP_TICK_MS: 30 * 1000, // 30 seconds
};

/** Default maxTurns for agent calls */
export const DEFAULT_MAX_TURNS = 30;

/** Timeout for a single agent call (default 10 minutes) */
export const AGENT_TIMEOUT_MS = Number(process.env.AGENT_TIMEOUT_MS) || 10 * 60 * 1000;

/** Timeout for an entire pipeline run (default 60 minutes) */
export const PIPELINE_TIMEOUT_MS = Number(process.env.PIPELINE_TIMEOUT_MS) || 60 * 60 * 1000;

/** Shared log directory */
export const LOG_DIR = "/tmp/claude-shared";

/** PRDs directory */
export const PRDS_DIR = resolve(REPO_PATH, "prds");

/** Rounds directory */
export const ROUNDS_DIR = resolve(REPO_PATH, "rounds");

/** Dreams directory */
export const DREAMS_DIR = resolve(REPO_PATH, "dreams");

/** Deliverables directory */
export const DELIVERABLES_DIR = resolve(REPO_PATH, "deliverables");

/** STATUS.md path */
export const STATUS_FILE = resolve(REPO_PATH, "STATUS.md");

/** MEMORY.md path */
export const MEMORY_FILE = resolve(REPO_PATH, "MEMORY.md");

/** Memory store directory */
export const MEMORY_STORE_DIR = resolve(REPO_PATH, "memory-store");

/** Skills directory in the plugin */
export const SKILLS_DIR = resolve(PLUGIN_PATH, "skills");
