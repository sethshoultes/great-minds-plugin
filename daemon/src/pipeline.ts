// Great Minds Daemon — GSD Pipeline as TypeScript functions
// Each phase spawns agent(s) via the Claude Code SDK. No markdown state parsing.

import { query } from "@anthropic-ai/claude-agent-sdk";
import { resolve } from "path";
import { mkdir } from "fs/promises";
import {
  REPO_PATH, PLUGIN_PATH, PRDS_DIR, ROUNDS_DIR, DELIVERABLES_DIR,
  SKILLS_DIR, DEFAULT_MAX_TURNS,
} from "./config.js";
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

// ─── Agent Runner ───────────────────────────────────────────

const ALLOWED_TOOLS = ["Read", "Write", "Edit", "Bash", "Agent", "Glob", "Grep"];

async function runAgent(name: string, prompt: string, maxTurns = DEFAULT_MAX_TURNS): Promise<string> {
  log(`AGENT START: ${name}`);
  const startTime = Date.now();

  let result = "";
  for await (const message of query({
    prompt,
    options: {
      maxTurns,
      allowedTools: ALLOWED_TOOLS,
      permissionMode: "bypassPermissions" as const,
    },
  })) {
    if (message.type === "result") {
      result = typeof (message as any).result === "string" ? (message as any).result : JSON.stringify(message);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  log(`AGENT DONE: ${name} (${elapsed}s)`);
  return result;
}

// ─── Pipeline Phases ────────────────────────────────────────

export async function runDebate(prdPath: string, project: string): Promise<void> {
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

  try {
    await runDebate(prdFile, project);
    await runPlan(project);
    await runBuild(project);

    // QA pass 1
    const qa1 = await runQA(project, 1);
    // QA pass 2 (even if pass 1 blocked and we auto-fixed)
    await runQA(project, 2);

    // Creative review (Jony Ive, Maya Angelou, Aaron Sorkin)
    await runCreativeReview(project);

    // Board review
    await runBoardReview(project);

    // Ship
    await runShip(project);

    // Archive completed PRD so daemon doesn't rebuild it
    const prdPath = resolve(PRDS_DIR, prd);
    const archiveDir = resolve(PRDS_DIR, "completed");
    await mkdir(archiveDir, { recursive: true });
    const archivePath = resolve(archiveDir, prd);
    const { rename } = await import("fs/promises");
    await rename(prdPath, archivePath).catch(() => {});
    log(`ARCHIVE: Moved ${prd} to prds/completed/`);

    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    log(`═══════════════════════════════════════════════════`);
    log(`PIPELINE COMPLETE: ${project} in ${elapsed} minutes`);
    log(`═══════════════════════════════════════════════════`);
  } catch (err) {
    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    log(`PIPELINE FAILED: ${project} after ${elapsed} minutes — ${err}`);
    throw err;
  }
}
