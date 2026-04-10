// Great Minds Daemon — GSD Pipeline as TypeScript functions
// Each phase spawns agent(s) via the Claude Code SDK. No markdown state parsing.

import { query } from "@anthropic-ai/claude-agent-sdk";
import { resolve } from "path";
import { mkdir, writeFile } from "fs/promises";
import { execSync } from "child_process";
import { existsSync } from "fs";
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
export async function runAgent(name: string, prompt: string, maxTurns = DEFAULT_MAX_TURNS, phase = ""): Promise<string> {
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

IMPORTANT: Before creating the task plan, read CLAUDE.md in the repo root for project-specific rules.
If the project involves a framework or external API, read the relevant docs in the docs/ directory FIRST.
Verify your technical approach by reading actual documentation or source code — do NOT guess at API surfaces.
If docs exist (e.g., docs/EMDASH-GUIDE.md), cite specific sections in your plan to prove you read them.

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

CRITICAL — RULES THAT WILL FAIL YOUR BUILD IF VIOLATED:
1. Read CLAUDE.md in the repo root FIRST for project-specific rules and constraints.
2. If building an Emdash plugin/theme/site, read docs/EMDASH-GUIDE.md BEFORE writing any code.
3. If calling any external API or framework, verify the API exists by reading actual source code or docs — do NOT generate code from memory.
4. Read BANNED-PATTERNS.md if it exists — any banned pattern in your code means automatic QA failure.
5. After writing code, grep your own output for banned patterns before committing.
6. NO PLACEHOLDER CONTENT. No "coming soon", no "TODO", no empty function bodies, no stub files. Every file you create must have COMPLETE, REAL, USABLE content. If you can't finish it, don't create it.
7. COMMIT EVERYTHING. Run git add -A && git commit before you finish. QA will check git status and BLOCK if there are uncommitted files.

Put all output in ${delDir}/. Write ${resolve(REPO_PATH, ".planning/execution-report.md")} when done.
Commit everything on a feature branch and push.`);

  // H1: Deterministic post-build commit — don't trust agent to commit
  log("BUILD: Verifying all files committed");
  try {
    const opts = { cwd: REPO_PATH, encoding: "utf-8" as const, timeout: 30_000 };
    const status = execSync('git status --short', opts).trim();
    if (status) {
      log(`BUILD: ${status.split("\n").length} uncommitted files — force-committing`);
      execSync('git add -A', opts);
      execSync(`git commit -m "daemon: auto-commit after build phase for ${project}"`, opts);
    } else {
      log("BUILD: All files committed — clean");
    }
  } catch (err) {
    logError("BUILD: post-build commit failed", err);
  }

  log("PHASE DONE: build");
}

export async function runQA(project: string, passNumber: number): Promise<"PASS" | "BLOCK"> {
  log(`PHASE: qa-${passNumber} — project=${project}`);
  const delDir = resolve(DELIVERABLES_DIR, project);
  const roundsDir = resolve(ROUNDS_DIR, project);
  const reqPath = resolve(REPO_PATH, ".planning/REQUIREMENTS.md");
  const outputPath = resolve(roundsDir, `qa-pass-${passNumber}.md`);

  // H2: Deterministic placeholder check BEFORE agent QA
  if (existsSync(delDir)) {
    try {
      const placeholderCheck = execSync(
        `grep -rn "placeholder\\|coming soon\\|TODO\\|FIXME\\|lorem ipsum\\|TBD\\|WIP" "${delDir}" 2>/dev/null || true`,
        { encoding: "utf-8", timeout: 10_000 }
      ).trim();

      if (placeholderCheck) {
        log(`QA-${passNumber}: AUTOMATIC BLOCK — placeholder content found:\n${placeholderCheck}`);
        await writeFile(outputPath, `# QA Pass ${passNumber} — AUTOMATIC BLOCK\n\nPlaceholder content detected:\n\`\`\`\n${placeholderCheck}\n\`\`\`\n`);
        // Still run auto-fix
        await runAgent("qa-fixer", `Read the QA report at ${outputPath}.
Fix every placeholder found — replace with REAL content. No "coming soon", no TODO, no stubs. Edit files directly in ${delDir}/. Commit fixes.`);
        return "BLOCK";
      }
    } catch {}
  }

  const result = await runAgent(
    `margaret-hamilton-qa-${passNumber}`,
    margaretHamiltonQA(project, passNumber, delDir, reqPath, outputPath),
  );

  // H3: Strict verdict parsing — require explicit format, default to BLOCK
  const verdictMatch = result.match(/^##?\s*(?:Overall\s+)?Verdict:\s*(PASS|BLOCK)/im);
  let verdict: "PASS" | "BLOCK";
  if (!verdictMatch) {
    // Fallback to old regex but default to BLOCK if ambiguous
    const passed = /\bPASS\b/i.test(result) && !/\bBLOCK\b/i.test(result);
    verdict = passed ? "PASS" : "BLOCK";
  } else {
    verdict = verdictMatch[1].toUpperCase() as "PASS" | "BLOCK";
  }
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
Use project slug '${project}'. Ship the project: commit all changes, write retrospective, update scoreboard.

CRITICAL: You MUST commit ALL files before finishing. Run:
1. git add -A
2. git commit -m "Ship ${project}: all deliverables"
3. Verify with git status that working tree is clean

Do NOT push yet — the merge step handles that.`);

  // Marcus Aurelius retrospective
  const retroPath = resolve(roundsDir, "retrospective.md");
  await runAgent("marcus-aurelius-retro", marcusAureliusRetrospective(project, roundsDir, retroPath), 20);

  // C3: Deterministic merge-and-push via execSync — no agent guessing
  log("SHIP: Running deterministic merge-and-push via bash");
  try {
    const opts = { cwd: REPO_PATH, encoding: "utf-8" as const, timeout: 60_000 };

    // Step 1: Commit any remaining changes
    execSync('git add -A', opts);
    try {
      execSync(`git commit -m "Ship ${project}: all deliverables + retrospective" --allow-empty`, opts);
    } catch {} // empty commit is fine

    // Step 2: Get current branch
    const branch = execSync('git branch --show-current', opts).trim();
    log(`SHIP: Current branch: ${branch}`);

    if (branch && branch !== 'main') {
      // Step 3: Merge to main
      execSync('git checkout main', opts);
      execSync('git pull origin main', opts);
      try {
        execSync(`git merge ${branch} -m "Merge ${branch}: ${project} shipped" --no-edit`, opts);
      } catch {
        log("SHIP: Merge conflict — accepting feature branch changes");
        execSync('git checkout --theirs .', opts);
        execSync('git add -A', opts);
        execSync(`git commit -m "Resolve conflicts: accept ${project} changes"`, opts);
      }

      // Step 4: Push
      execSync('git push origin main', opts);
      log("SHIP: PUSHED TO GITHUB");

      // Step 5: Switch back
      execSync(`git checkout ${branch}`, opts);
    } else {
      // Already on main
      execSync('git push origin main', opts);
      log("SHIP: Already on main, pushed directly");
    }
  } catch (err) {
    logError("SHIP: merge-and-push failed", err);
    await notify(`SHIP FAILED for ${project}: merge-and-push error`, "critical");
  }

  log("PHASE DONE: ship");
}

// ─── Full Pipeline ──────────────────────────────────────────

export async function runPipeline(prdFile: string, project: string): Promise<void> {
  log(`═══════════════════════════════════════════════════`);
  log(`PIPELINE START: ${project} (PRD: ${prdFile})`);
  log(`═══════════════════════════════════════════════════`);
  const startTime = Date.now();

  await notify(`Pipeline *started* for project *${project}*\nPRD: \`${prdFile}\``, "info");

  // C4: Import abort check from daemon
  const { isPipelineAborted } = await import("./daemon.js");
  const checkAbort = () => {
    if (isPipelineAborted()) throw new Error("Pipeline aborted by watchdog");
  };

  try {
    checkAbort();
    await notifyPhase(project, "debate", "start");
    await runDebate(prdFile, project);
    await notifyPhase(project, "debate", "done");

    checkAbort();
    await notifyPhase(project, "plan", "start");
    await runPlan(project);
    await notifyPhase(project, "plan", "done");

    checkAbort();
    await notifyPhase(project, "build", "start");
    await runBuild(project);
    await notifyPhase(project, "build", "done");

    checkAbort();
    // QA pass 1
    await notifyPhase(project, "qa-1", "start");
    const qa1 = await runQA(project, 1);
    await notify(`*${project}* | QA-1 verdict: *${qa1}*`, qa1 === "PASS" ? "info" : "warning");

    checkAbort();
    // QA pass 2
    await notifyPhase(project, "qa-2", "start");
    const qa2 = await runQA(project, 2);
    await notify(`*${project}* | QA-2 verdict: *${qa2}*`, qa2 === "PASS" ? "info" : "warning");

    checkAbort();
    // Creative review
    await notifyPhase(project, "creative-review", "start");
    await runCreativeReview(project);
    await notifyPhase(project, "creative-review", "done");

    checkAbort();
    // Board review
    await notifyPhase(project, "board-review", "start");
    await runBoardReview(project);
    await notifyPhase(project, "board-review", "done");

    checkAbort();
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
