// Great Minds Daemon — featureDream cycle
// IMPROVE mode: Board reviews shipped products for improvements
// DREAM mode: Steve + Elon brainstorm, board votes, winner becomes PRD

import { query } from "@anthropic-ai/claude-agent-sdk";
import { resolve } from "path";
import { mkdir, readdir, stat } from "fs/promises";
import { execSync } from "child_process";
import {
  REPO_PATH, DREAMS_DIR, PRDS_DIR, MEMORY_STORE_DIR, DEFAULT_MAX_TURNS,
} from "./config.js";
import { log, logError } from "./logger.js";

const ALLOWED_TOOLS = ["Read", "Write", "Edit", "Bash", "Agent", "Glob", "Grep"];

async function runAgent(name: string, prompt: string, maxTurns = DEFAULT_MAX_TURNS): Promise<string> {
  log(`DREAM AGENT: ${name}`);
  let result = "";
  for await (const message of query({
    prompt,
    options: {
      maxTurns,
      allowedTools: ALLOWED_TOOLS,
      permissionMode: "bypassPermissions" as const,
      cwd: REPO_PATH,
    },
  })) {
    if (message.type === "result") {
      result = typeof (message as any).result === "string" ? (message as any).result : JSON.stringify(message);
    }
  }
  return result;
}

// ─── Check if we dreamed/improved recently ──────────────────

async function recentFileExists(prefix: string, withinHours: number): Promise<boolean> {
  try {
    const files = await readdir(DREAMS_DIR);
    const cutoff = Date.now() - withinHours * 60 * 60 * 1000;
    for (const file of files) {
      if (file.startsWith(prefix)) {
        const st = await stat(resolve(DREAMS_DIR, file));
        if (st.mtimeMs > cutoff) return true;
      }
    }
  } catch {
    // dreams dir might not exist yet
  }
  return false;
}

// ─── IMPROVE Mode ───────────────────────────────────────────

async function runImprove(): Promise<void> {
  if (await recentFileExists("improve-", 24)) {
    log("DREAM: Already improved in the last 24h — skipping");
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 15);
  log("DREAM: Running IMPROVE cycle");

  // Load learnings from memory store
  let learnings = "(no learnings available)";
  try {
    learnings = execSync(
      `cd "${MEMORY_STORE_DIR}" && npx tsx src/cli.ts search "improvement opportunity" --limit 10 2>/dev/null`,
      { encoding: "utf-8", timeout: 30_000 },
    );
  } catch {
    // memory store may not be set up
  }

  await runAgent("improve-cycle", `You are Phil Jackson running a featureDream IMPROVE cycle.

Recent learnings from memory store:
${learnings}

Review all shipped products for improvement opportunities:
- LocalGenius (localgenius.company) — AI marketing for local businesses
- Dash (WP Cmd+K command palette) — sethshoultes/dash-command-bar
- Pinned (WP sticky notes) — sethshoultes/pinned-notes
- Great Minds Plugin — sethshoultes/great-minds-plugin
- Shipyard AI (www.shipyard.company) — autonomous site builder

Write 4 board member reviews:
1. ${DREAMS_DIR}/improve-${timestamp}-jensen.md — Jensen: moat gaps, compounding advantages
2. ${DREAMS_DIR}/improve-${timestamp}-oprah.md — Oprah: new user confusion, first-5-minutes
3. ${DREAMS_DIR}/improve-${timestamp}-buffett.md — Buffett: revenue opportunities, investability
4. ${DREAMS_DIR}/improve-${timestamp}-shonda.md — Shonda: retention hooks, what brings people back

Then consolidate into ${DREAMS_DIR}/improve-${timestamp}-summary.md with:
- Top 3 improvements ranked by impact
- If any improvement is significant enough to be a project, write a PRD to ${PRDS_DIR}/ so the pipeline picks it up automatically`);

  log("DREAM: IMPROVE cycle complete");
}

// ─── DREAM Mode ─────────────────────────────────────────────

async function runDream(): Promise<void> {
  if (await recentFileExists("dream-", 48)) {
    log("DREAM: Already dreamed in the last 48h — skipping");
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 15);
  log("DREAM: Running DREAM cycle — brainstorming new products");

  await runAgent("dream-cycle", `You are Phil Jackson running a featureDream DREAM cycle.

The agency is idle. Time to innovate. Consider what we're good at:
- WordPress plugins (Dash, Pinned — shipped in one session each)
- SaaS applications (LocalGenius — full stack)
- Multi-agent orchestration (the plugin itself)
- AI integrations (hybrid Claude + Cloudflare Workers AI)
- Video production (Remotion + TTS)

Write brainstorm files:
1. ${DREAMS_DIR}/dream-${timestamp}-steve.md — Steve: 3 product ideas focused on design quality, user delight
2. ${DREAMS_DIR}/dream-${timestamp}-elon.md — Elon: 3 product ideas focused on market size, technical feasibility

Then write board votes:
3. ${DREAMS_DIR}/dream-${timestamp}-votes.md — Each board member picks #1 from all 6 ideas with 5-line justification

Consolidate: the idea with the most votes becomes a PRD.
Write the winning PRD to ${PRDS_DIR}/ so the pipeline picks it up and builds it automatically.

Rules:
- Products must be buildable in one session by the agency
- Must have a clear user and distribution channel
- Prefer products we can dogfood (tools for developers, WordPress ecosystem, AI tooling)
- No vaporware — it ships or it doesn't count`);

  log("DREAM: DREAM cycle complete");
}

// ─── Entry Point ────────────────────────────────────────────

export async function runFeatureDream(): Promise<void> {
  await mkdir(DREAMS_DIR, { recursive: true });

  // Alternate: even days improve, odd days dream
  const day = new Date().getDate();
  if (day % 2 === 0) {
    await runImprove();
  } else {
    await runDream();
  }
}
