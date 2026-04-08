// Great Minds Daemon — GSD Pipeline as TypeScript functions
// Each phase spawns agent(s) via the Claude Code SDK. No markdown state parsing.

import { query } from "@anthropic-ai/claude-agent-sdk";
import { resolve } from "path";
import { mkdir } from "fs/promises";
import {
  REPO_PATH, PLUGIN_PATH, PRDS_DIR, ROUNDS_DIR, DELIVERABLES_DIR,
  SKILLS_DIR, DEFAULT_MAX_TURNS, AGENT_TIMEOUT_MS,
} from "./config.js";
import { notify, notifyPhase } from "./telegram.js";
import {
  steveJobsDebateR1, elonMuskDebateR1,
  steveJobsDebateR2, elonMuskDebateR2,
  rickRubinEssence, philJacksonConsolidation,
  saraBlakelyGutCheck, margaretHamiltonQA,
  jonyIveVisualReview, mayaAngelouCopyReview,
  aaronSorkinDemoScript,
  jensenHuangBoardReview, oprahWinfreyBoardReview,
  warrenBuffettBoardReview, shondaRhimesBoardReview,
  marcusAureliusRetrospective,
} from "./agents.js";
import { log } from "./logger.js";
import { TokenLedger, estimateCost } from "./token-ledger.js";

// ─── Token Ledger ───────────────────────────────────────────

let ledger: TokenLedger | null = null;
let currentProject = "";

function getLedger(): TokenLedger {
  if (!ledger) {
    const dbPath = process.env.MEMORY_DB || resolve(REPO_PATH, "memory-store/memory.db");
    ledger = new TokenLedger(dbPath);
  }
  return ledger;
}

export function setCurrentProject(project: string): void {
  currentProject = project;
}

// ─── Agent Runner ───────────────────────────────────────────

const ALLOWED_TOOLS = ["Read", "Write", "Edit", "Bash", "Agent", "Glob", "Grep"];

/**
 * Core agent call — runs a single query() invocation with token tracking.
 * This is the inner function; use runAgentWithRetry() or runAgentWithTimeout()
 * as the public entry points.
 */
async function runAgentCore(name: string, prompt: string, maxTurns = DEFAULT_MAX_TURNS, phase = ""): Promise<string> {
  log(`AGENT START: ${name}`);
  const startTime = Date.now();

  let result = "";
  let inputTokens = 0;
  let outputTokens = 0;

  try {
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
        const msg = message as any;
        if (msg.inputTokens) inputTokens = msg.inputTokens;
        if (msg.outputTokens) outputTokens = msg.outputTokens;
        if (msg.usage) {
          inputTokens = msg.usage.input_tokens || msg.usage.inputTokens || inputTokens;
          outputTokens = msg.usage.output_tokens || msg.usage.outputTokens || outputTokens;
        }
      }
    }
  } catch (err) {
    // SDK throws exit code 1 after successful completion — ignore if we got a result
    if (result) {
      // Check if the "result" is actually an auth error
      if (result.includes("401") || result.includes("authentication_error") || result.includes("Invalid authentication")) {
        log(`AGENT AUTH FAILED: ${name} — Claude credentials expired. Run 'claude' on the server to re-authenticate.`);
        await notify(`AUTH EXPIRED: Agent ${name} got 401. Run 'claude' on the server to re-authenticate.`, "critical");
        throw new Error("Authentication expired — re-run 'claude' on the server to login");
      }
      log(`AGENT NOTE: ${name} — process exited with error after returning result (ignored)`);
    } else {
      throw err;
    }
  }

  // Double-check result isn't an auth error masquerading as success
  if (result.includes("401") || result.includes("authentication_error") || result.includes("/login")) {
    log(`AGENT AUTH FAILED: ${name} — result contains auth error`);
    await notify(`AUTH EXPIRED: Agent ${name} returned auth error. Re-authenticate on server.`, "critical");
    throw new Error("Authentication expired — re-run 'claude' on the server to login");
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  log(`AGENT DONE: ${name} (${elapsed}s)`);

  // Estimate tokens from prompt/result length if SDK didn't provide them
  if (inputTokens === 0) {
    inputTokens = Math.ceil(prompt.length / 4);
  }
  if (outputTokens === 0) {
    outputTokens = Math.ceil(result.length / 4);
  }

  // Log to token ledger
  try {
    getLedger().logUsage({
      timestamp: new Date().toISOString(),
      agent: name,
      project: currentProject,
      phase: phase || name.split('-')[0],
      inputTokens,
      outputTokens,
      estimatedCost: estimateCost(inputTokens, outputTokens),
    });
  } catch (err) {
    log(`LEDGER WARN: Failed to log token usage for ${name}: ${err}`);
  }

  return result;
}

// ─── Crash Recovery with Retry ─────────────────────────────

/**
 * Wraps runAgentCore with automatic retry on failure.
 * Uses exponential backoff (5s, 10s, ...) between attempts.
 */
async function runAgentWithRetry(
  name: string,
  prompt: string,
  maxTurns = DEFAULT_MAX_TURNS,
  maxRetries = 2,
  phase = "",
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await runAgentCore(name, prompt, maxTurns, phase);
    } catch (err) {
      log(`AGENT FAILED: ${name} attempt ${attempt}/${maxRetries} — ${err}`);
      if (attempt === maxRetries) {
        await notify(
          `Agent *${name}* failed after ${maxRetries} attempts:\n\`${err}\``,
          "critical",
        );
        throw err;
      }
      // Exponential backoff
      const delay = attempt * 5000;
      log(`AGENT RETRY: ${name} attempt ${attempt + 1} in ${delay / 1000}s`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  // Unreachable, but TypeScript needs it
  throw new Error(`runAgentWithRetry: exhausted retries for ${name}`);
}

// ─── Hung Agent Detection ──────────────────────────────────

/**
 * Wraps runAgentWithRetry with a hard timeout.
 * If the agent exceeds timeoutMs, the promise rejects (triggering retry).
 */
async function runAgentWithTimeout(
  name: string,
  prompt: string,
  maxTurns = DEFAULT_MAX_TURNS,
  timeoutMs = AGENT_TIMEOUT_MS,
  maxRetries = 2,
  phase = "",
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => {
      const msg = `AGENT HUNG: ${name} exceeded ${timeoutMs / 1000}s — aborting`;
      log(msg);
      notify(msg, "warning").catch(() => {});
      reject(new Error(msg));
    }, timeoutMs);

    runAgentWithRetry(name, prompt, maxTurns, maxRetries, phase)
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// ─── Public runAgent (drop-in replacement) ─────────────────

/**
 * Run an agent with timeout protection and automatic retry.
 * This is the function all pipeline phases should call.
 */
async function runAgent(name: string, prompt: string, maxTurns = DEFAULT_MAX_TURNS, phase = ""): Promise<string> {
  return runAgentWithTimeout(name, prompt, maxTurns, AGENT_TIMEOUT_MS, 2, phase);
}

// ─── Pipeline Phases ────────────────────────────────────────

export async function runDebate(prdPath: string, project: string): Promise<void> {
  setCurrentProject(project);
  log(`PHASE: debate — project=${project}`);
  const roundsDir = resolve(ROUNDS_DIR, project);
  await mkdir(roundsDir, { recursive: true });

  const prd = resolve(PRDS_DIR, prdPath);

  // Round 1 — Steve and Elon stake positions (run in parallel)
  const r1Steve = resolve(roundsDir, "round-1-steve.md");
  const r1Elon = resolve(roundsDir, "round-1-elon.md");

  log("DEBATE R1: Steve + Elon in parallel");
  await Promise.all([
    runAgent("steve-jobs-r1", steveJobsDebateR1(prd, r1Steve)),
    runAgent("elon-musk-r1", elonMuskDebateR1(prd, r1Elon)),
  ]);

  // Round 2 — Challenge each other (run in parallel)
  const r2Steve = resolve(roundsDir, "round-2-steve.md");
  const r2Elon = resolve(roundsDir, "round-2-elon.md");

  log("DEBATE R2: Steve + Elon challenge each other");
  await Promise.all([
    runAgent("steve-jobs-r2", steveJobsDebateR2(r1Steve, r1Elon, r2Steve)),
    runAgent("elon-musk-r2", elonMuskDebateR2(r1Steve, r1Elon, r2Elon)),
  ]);

  // Rick Rubin distills the essence
  const essencePath = resolve(roundsDir, "essence.md");
  log("DEBATE: Rick Rubin essence");
  await runAgent("rick-rubin-essence", rickRubinEssence(roundsDir, essencePath), 15);

  // Phil Jackson consolidates decisions
  const decisionsPath = resolve(roundsDir, "decisions.md");
  log("DEBATE: Phil Jackson consolidation");
  await runAgent("phil-jackson-consolidation", philJacksonConsolidation(roundsDir, decisionsPath));

  log("PHASE DONE: debate");
}

export async function runPlan(project: string): Promise<void> {
  log(`PHASE: plan — project=${project}`);
  const roundsDir = resolve(ROUNDS_DIR, project);
  const planDir = resolve(REPO_PATH, ".planning");
  await mkdir(planDir, { recursive: true });

  const skillPath = resolve(SKILLS_DIR, "agency-plan/SKILL.md");
  const decisionsPath = resolve(roundsDir, "decisions.md");
  const prdPath = resolve(PRDS_DIR, `${project}.md`);

  await runAgent("planner", `Read and follow the instructions in ${skillPath}.
Use project slug '${project}'. Read ${decisionsPath} and ${prdPath} as inputs.
Write output to ${planDir}/phase-1-plan.md and ${planDir}/REQUIREMENTS.md.`);

  // Sara Blakely gut-check
  const planPath = resolve(planDir, "phase-1-plan.md");
  const saraPath = resolve(planDir, "sara-blakely-review.md");
  await runAgent("sara-blakely-gutcheck", saraBlakelyGutCheck(planPath, saraPath), 15);

  log("PHASE DONE: plan");
}

export async function runBuild(project: string): Promise<void> {
  log(`PHASE: build — project=${project}`);
  const delDir = resolve(DELIVERABLES_DIR, project);
  await mkdir(delDir, { recursive: true });

  const skillPath = resolve(SKILLS_DIR, "agency-execute/SKILL.md");
  const planPath = resolve(REPO_PATH, ".planning/phase-1-plan.md");
  const roundsDir = resolve(ROUNDS_DIR, project);
  const decisionsPath = resolve(roundsDir, "decisions.md");

  await runAgent("builder", `Read and follow the instructions in ${skillPath}.
Use project slug '${project}'. Read ${planPath} and ${decisionsPath} as inputs.
Put all output in ${delDir}/. Write ${resolve(REPO_PATH, ".planning/execution-report.md")} when done.
Commit everything on a feature branch and push.`);

  log("PHASE DONE: build");
}

export async function runQA(project: string, passNumber: number): Promise<"PASS" | "BLOCK"> {
  log(`PHASE: qa-${passNumber} — project=${project}`);
  const delDir = resolve(DELIVERABLES_DIR, project);
  const roundsDir = resolve(ROUNDS_DIR, project);
  const reqPath = resolve(REPO_PATH, ".planning/REQUIREMENTS.md");
  const outputPath = resolve(roundsDir, `qa-pass-${passNumber}.md`);

  const result = await runAgent(
    `margaret-hamilton-qa-${passNumber}`,
    margaretHamiltonQA(project, passNumber, delDir, reqPath, outputPath),
  );

  // Check verdict from the result text
  const passed = /\bPASS\b/i.test(result) && !/\bBLOCK\b/i.test(result);
  const verdict = passed ? "PASS" : "BLOCK";
  log(`QA-${passNumber} VERDICT: ${verdict}`);

  if (verdict === "BLOCK") {
    // Auto-fix: have the builder address QA issues
    log(`QA-${passNumber}: BLOCK detected — running auto-fix`);
    await runAgent("qa-fixer", `Read the QA report at ${outputPath}.
Fix every issue listed. Edit files directly in ${delDir}/. Commit fixes.`);
  }

  log(`PHASE DONE: qa-${passNumber}`);
  return verdict;
}

export async function runCreativeReview(project: string): Promise<void> {
  log(`PHASE: creative-review — project=${project}`);
  const delDir = resolve(DELIVERABLES_DIR, project);
  const roundsDir = resolve(ROUNDS_DIR, project);

  // Jony Ive + Maya Angelou + Aaron Sorkin in parallel
  await Promise.all([
    runAgent("jony-ive-review", jonyIveVisualReview(delDir, resolve(roundsDir, "review-jony-ive.md")), 15),
    runAgent("maya-angelou-review", mayaAngelouCopyReview(delDir, resolve(roundsDir, "review-maya-angelou.md")), 15),
    runAgent("aaron-sorkin-demo", aaronSorkinDemoScript(project, delDir, resolve(roundsDir, "demo-script.md")), 20),
  ]);

  log("PHASE DONE: creative-review");
}

export async function runBoardReview(project: string): Promise<void> {
  log(`PHASE: board-review — project=${project}`);
  const delDir = resolve(DELIVERABLES_DIR, project);
  const roundsDir = resolve(ROUNDS_DIR, project);
  const prdPath = resolve(PRDS_DIR, `${project}.md`);

  // All 4 board members review in parallel
  await Promise.all([
    runAgent("jensen-huang-review", jensenHuangBoardReview(project, delDir, prdPath, resolve(roundsDir, "board-review-jensen.md")), 20),
    runAgent("oprah-winfrey-review", oprahWinfreyBoardReview(project, delDir, prdPath, resolve(roundsDir, "board-review-oprah.md")), 20),
    runAgent("warren-buffett-review", warrenBuffettBoardReview(project, delDir, prdPath, resolve(roundsDir, "board-review-buffett.md")), 20),
    runAgent("shonda-rhimes-review", shondaRhimesBoardReview(project, delDir, prdPath, resolve(roundsDir, "board-review-shonda.md")), 20),
  ]);

  // Consolidate board verdict
  await runAgent("board-consolidation", `Read all board review files in ${roundsDir}/board-review-*.md.
Write ${resolve(roundsDir, "board-verdict.md")} — consolidated verdict:
- Points of agreement across board members
- Points of tension
- Overall verdict: PROCEED, HOLD, or REJECT
- Conditions for proceeding (if any)

Also write ${resolve(roundsDir, "shonda-retention-roadmap.md")} — what keeps users coming back, v1.1 features.`);

  log("PHASE DONE: board-review");
}

export async function runShip(project: string): Promise<void> {
  log(`PHASE: ship — project=${project}`);
  const roundsDir = resolve(ROUNDS_DIR, project);
  const skillPath = resolve(SKILLS_DIR, "agency-ship/SKILL.md");

  // Ship using the skill
  await runAgent("shipper", `Read and follow the instructions in ${skillPath}.
Use project slug '${project}'. Ship the project: commit, write retrospective, push, update scoreboard.`);

  // Marcus Aurelius retrospective
  const retroPath = resolve(roundsDir, "retrospective.md");
  await runAgent("marcus-aurelius-retro", marcusAureliusRetrospective(project, roundsDir, retroPath), 20);

  log("PHASE DONE: ship");
}

// ─── Full Pipeline ──────────────────────────────────────────

export async function runPipeline(prdFile: string, project: string): Promise<void> {
  log(`═══════════════════════════════════════════════════`);
  log(`PIPELINE START: ${project} (PRD: ${prdFile})`);
  log(`═══════════════════════════════════════════════════`);
  const startTime = Date.now();

  await notify(`Pipeline *started* for project *${project}*\nPRD: \`${prdFile}\``, "info");

  try {
    await notifyPhase(project, "debate", "start");
    await runDebate(prdFile, project);
    await notifyPhase(project, "debate", "done");

    await notifyPhase(project, "plan", "start");
    await runPlan(project);
    await notifyPhase(project, "plan", "done");

    await notifyPhase(project, "build", "start");
    await runBuild(project);
    await notifyPhase(project, "build", "done");

    // QA pass 1
    await notifyPhase(project, "qa-1", "start");
    const qa1 = await runQA(project, 1);
    await notify(`*${project}* | QA-1 verdict: *${qa1}*`, qa1 === "PASS" ? "info" : "warning");

    // QA pass 2 (even if pass 1 blocked and we auto-fixed)
    await notifyPhase(project, "qa-2", "start");
    const qa2 = await runQA(project, 2);
    await notify(`*${project}* | QA-2 verdict: *${qa2}*`, qa2 === "PASS" ? "info" : "warning");

    // Creative review (Jony Ive, Maya Angelou, Aaron Sorkin)
    await notifyPhase(project, "creative-review", "start");
    await runCreativeReview(project);
    await notifyPhase(project, "creative-review", "done");

    // Board review
    await notifyPhase(project, "board-review", "start");
    await runBoardReview(project);
    await notifyPhase(project, "board-review", "done");

    // Ship
    await notifyPhase(project, "ship", "start");
    await runShip(project);
    await notifyPhase(project, "ship", "done");

    // Archive completed PRD so daemon doesn't rebuild it
    const prdPath = resolve(PRDS_DIR, prdFile);
    const archiveDir = resolve(PRDS_DIR, "completed");
    await mkdir(archiveDir, { recursive: true });
    const archivePath = resolve(archiveDir, prdFile);
    const { rename } = await import("fs/promises");
    await rename(prdPath, archivePath).catch(() => {});
    log(`ARCHIVE: Moved ${prdFile} to prds/completed/`);

    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    log(`═══════════════════════════════════════════════════`);
    log(`PIPELINE COMPLETE: ${project} in ${elapsed} minutes`);
    log(`═══════════════════════════════════════════════════`);

    await notify(
      `Pipeline *SHIPPED* for *${project}* in ${elapsed} minutes`,
      "info",
    );
  } catch (err) {
    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    log(`PIPELINE FAILED: ${project} after ${elapsed} minutes — ${err}`);
    await notify(
      `Pipeline *FAILED* for *${project}* after ${elapsed} minutes\n\`${err}\``,
      "critical",
    );
    throw err;
  }
}
