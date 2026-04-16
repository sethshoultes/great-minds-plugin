# Hindsight Integration — Exact Code Diffs

**Purpose:** Show the exact changes needed to integrate Hindsight into pipeline.ts

**Files Modified:** 1 (daemon/src/pipeline.ts)

**Files Created:** 0 (output files created dynamically at runtime)

---

## Change 1: Dynamic Import (Optional, Recommended)

**Location:** `/Users/sethshoultes/Local Sites/great-minds-plugin/daemon/src/pipeline.ts`, top-level imports

**Option A: Add at top with other imports (simpler)**
```typescript
import { generateProjectHindsight, hindsightPlannerContext, hindsightExecutorContext } from "./git-intelligence-integration.js";
```

**Option B: Dynamic import within functions (cleaner for isolation)**
This is preferred because it avoids top-level import and keeps the module loading lazy.

---

## Change 2: runPlan() — Add Hindsight Generation

**Location:** `/Users/sethshoultes/Local Sites/great-minds-plugin/daemon/src/pipeline.ts`, around line 259-277

**Current Code:**
```typescript
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
...
```

**Proposed Code:**
```typescript
export async function runPlan(project: string): Promise<void> {
  log(`PHASE: plan — project=${project}`);
  const roundsDir = resolve(ROUNDS_DIR, project);
  const planDir = resolve(REPO_PATH, ".planning");
  const hindsightDir = resolve(REPO_PATH, ".great-minds");
  await mkdir(planDir, { recursive: true });
  await mkdir(hindsightDir, { recursive: true });

  // Generate Hindsight report
  log("PLAN: Generating Hindsight report...");
  const { generateProjectHindsight, hindsightPlannerContext } = await import("./git-intelligence-integration.js");
  await generateProjectHindsight(REPO_PATH, hindsightDir, { info: log });
  const hindsightPath = resolve(hindsightDir, "hindsight.md");
  log(`PLAN: Hindsight report generated`);

  const skillPath = resolve(SKILLS_DIR, "agency-plan/SKILL.md");
  const decisionsPath = resolve(roundsDir, "decisions.md");
  const prdPath = resolve(PRDS_DIR, `${project}.md`);
  const hindsightPrompt = hindsightPlannerContext(hindsightPath);

  await runAgent("planner", `Read and follow the instructions in ${skillPath}.
Use project slug '${project}'. Read ${decisionsPath} and ${prdPath} as inputs.

${hindsightPrompt}

IMPORTANT: Before creating the task plan, read CLAUDE.md in the repo root for project-specific rules.
...
```

**Changes Summary:**
- Add `hindsightDir` constant (line ~263)
- Add `mkdir` for `.great-minds` (line ~266)
- Add dynamic import and Hindsight generation (lines ~268-271)
- Add `hindsightPath` constant (line ~272)
- Add logging (lines ~267, ~271)
- Extract `hindsightPrompt` from helper function (line ~279)
- Inject `${hindsightPrompt}` into planner prompt (before "IMPORTANT" line)

---

## Change 3: runBuild() — Add Hindsight Regeneration

**Location:** `/Users/sethshoultes/Local Sites/great-minds-plugin/daemon/src/pipeline.ts`, around line 287-299

**Current Code:**
```typescript
export async function runBuild(project: string, isHotfix = false): Promise<void> {
  log(`PHASE: build${isHotfix ? " (HOTFIX)" : ""} — project=${project}`);
  const delDir = resolve(DELIVERABLES_DIR, project);
  await mkdir(delDir, { recursive: true });

  const prdPath = resolve(PRDS_DIR, `${project}.md`);
  const planPath = resolve(REPO_PATH, ".planning/phase-1-plan.md");
  const roundsDir = resolve(ROUNDS_DIR, project);
  const decisionsPath = resolve(roundsDir, "decisions.md");
  const specPath = resolve(delDir, "spec.md");
  const todoPath = resolve(delDir, "todo.md");
  const testsDir = resolve(delDir, "tests");

  // ── Step 1: Create spec.md + todo.md + tests/ ──────────────
  log("BUILD STEP 1: Creating spec.md, todo.md, tests/");
  await runAgent("build-setup", `You are preparing a structured build.

Read the PRD at ${prdPath}...
```

**Proposed Code:**
```typescript
export async function runBuild(project: string, isHotfix = false): Promise<void> {
  log(`PHASE: build${isHotfix ? " (HOTFIX)" : ""} — project=${project}`);
  const delDir = resolve(DELIVERABLES_DIR, project);
  const hindsightDir = resolve(REPO_PATH, ".great-minds");
  await mkdir(delDir, { recursive: true });
  await mkdir(hindsightDir, { recursive: true });

  // Regenerate Hindsight report (code may have changed since plan phase)
  log("BUILD: Regenerating Hindsight report...");
  const { generateProjectHindsight, hindsightExecutorContext } = await import("./git-intelligence-integration.js");
  await generateProjectHindsight(REPO_PATH, hindsightDir, { info: log });
  const hindsightPath = resolve(hindsightDir, "hindsight.md");
  log(`BUILD: Hindsight report regenerated`);

  const prdPath = resolve(PRDS_DIR, `${project}.md`);
  const planPath = resolve(REPO_PATH, ".planning/phase-1-plan.md");
  const roundsDir = resolve(ROUNDS_DIR, project);
  const decisionsPath = resolve(roundsDir, "decisions.md");
  const specPath = resolve(delDir, "spec.md");
  const todoPath = resolve(delDir, "todo.md");
  const testsDir = resolve(delDir, "tests");
  const hindsightPrompt = hindsightExecutorContext(hindsightPath);

  // ── Step 1: Create spec.md + todo.md + tests/ ──────────────
  log("BUILD STEP 1: Creating spec.md, todo.md, tests/");
  await runAgent("build-setup", `You are preparing a structured build.

Read the PRD at ${prdPath}...
```

**Changes Summary:**
- Add `hindsightDir` constant (line ~289)
- Add `mkdir` for `.great-minds` (line ~291)
- Add dynamic import and Hindsight regeneration (lines ~293-298)
- Add `hindsightPath` constant (line ~299)
- Add logging (lines ~292, ~298)
- Extract `hindsightPrompt` from helper function (line ~308)

---

## Change 4: build-setup Agent Prompt — Inject Hindsight

**Location:** `/Users/sethshoultes/Local Sites/great-minds-plugin/daemon/src/pipeline.ts`, around line 302-331

**Current Code:**
```typescript
  log("BUILD STEP 1: Creating spec.md, todo.md, tests/");
  await runAgent("build-setup", `You are preparing a structured build.

Read the PRD at ${prdPath}${existsSync(planPath) ? ` and the plan at ${planPath}` : ""}.
${existsSync(decisionsPath) ? `Read debate decisions at ${decisionsPath}.` : ""}
Read CLAUDE.md in the repo root for project rules.
${!isHotfix && existsSync(resolve(REPO_PATH, "BANNED-PATTERNS.md")) ? "Read BANNED-PATTERNS.md for patterns that will fail QA." : ""}

Create these three files:
```

**Proposed Code:**
```typescript
  log("BUILD STEP 1: Creating spec.md, todo.md, tests/");
  await runAgent("build-setup", `You are preparing a structured build.

Read the PRD at ${prdPath}${existsSync(planPath) ? ` and the plan at ${planPath}` : ""}.
${existsSync(decisionsPath) ? `Read debate decisions at ${decisionsPath}.` : ""}

${hindsightPrompt}

Read CLAUDE.md in the repo root for project rules.
${!isHotfix && existsSync(resolve(REPO_PATH, "BANNED-PATTERNS.md")) ? "Read BANNED-PATTERNS.md for patterns that will fail QA." : ""}

Create these three files:
```

**Changes Summary:**
- Insert `${hindsightPrompt}` after reading PRD/plan/decisions (blank line before CLAUDE.md reference)
- This is a single-line addition (plus blank line for readability)

---

## Change 5: Main Builder Agent Prompt — Inject Hindsight

**Location:** `/Users/sethshoultes/Local Sites/great-minds-plugin/daemon/src/pipeline.ts`, around line 348-359

**Current Code:**
```typescript
  const builderPrompt = isHotfix
    ? `You are fixing a bug. Your spec is at ${specPath}. Your todo list is at ${todoPath}.

For each unchecked task in todo.md:
1. Read spec.md to confirm the approach
2. Make the change
3. Run the test scripts in ${testsDir}/ to verify
4. Edit todo.md to check off the completed task: change "- [ ]" to "- [x]"
5. Move to the next task

Do NOT explore the codebase beyond what spec.md says is needed.
Read CLAUDE.md first for project rules.
When all tasks are checked off, commit: git add -A && git commit -m "hotfix: ${project}".`
    : `You are building a feature. Your spec is at ${specPath}. Your todo list is at ${todoPath}.

CRITICAL RULES:
1. Before EVERY change, re-read spec.md to confirm alignment.
2. After EVERY task, run test scripts in ${testsDir}/ and fix failures before moving on.
3. After completing each task, edit todo.md: change "- [ ]" to "- [x]".
4. If you discover a new sub-task, ADD it to todo.md before doing it.
5. Read CLAUDE.md for project rules. Read BANNED-PATTERNS.md if it exists.
6. NO PLACEHOLDER CONTENT. No "coming soon", no "TODO", no empty function bodies, no stub files.
7. Commit on a feature branch when done: git checkout -b feature/${project} && git add -A && git commit.

Put all output in ${delDir}/. Write ${resolve(REPO_PATH, ".planning/execution-report.md")} when done.`;

  await runAgent("builder", builderPrompt,
    isHotfix ? 15 : DEFAULT_MAX_TURNS, "build", "sonnet");
```

**Proposed Code:**
```typescript
  const builderPrompt = isHotfix
    ? `You are fixing a bug. Your spec is at ${specPath}. Your todo list is at ${todoPath}.

${hindsightPrompt}

For each unchecked task in todo.md:
1. Read spec.md to confirm the approach
2. Make the change
3. Run the test scripts in ${testsDir}/ to verify
4. Edit todo.md to check off the completed task: change "- [ ]" to "- [x]"
5. Move to the next task

Do NOT explore the codebase beyond what spec.md says is needed.
Read CLAUDE.md first for project rules.
When all tasks are checked off, commit: git add -A && git commit -m "hotfix: ${project}".`
    : `You are building a feature. Your spec is at ${specPath}. Your todo list is at ${todoPath}.

${hindsightPrompt}

CRITICAL RULES:
1. Before EVERY change, re-read spec.md to confirm alignment.
2. After EVERY task, run test scripts in ${testsDir}/ and fix failures before moving on.
3. After completing each task, edit todo.md: change "- [ ]" to "- [x]".
4. If you discover a new sub-task, ADD it to todo.md before doing it.
5. Read CLAUDE.md for project rules. Read BANNED-PATTERNS.md if it exists.
6. NO PLACEHOLDER CONTENT. No "coming soon", no "TODO", no empty function bodies, no stub files.
7. Commit on a feature branch when done: git checkout -b feature/${project} && git add -A && git commit.

Put all output in ${delDir}/. Write ${resolve(REPO_PATH, ".planning/execution-report.md")} when done.`;

  await runAgent("builder", builderPrompt,
    isHotfix ? 15 : DEFAULT_MAX_TURNS, "build", "sonnet");
```

**Changes Summary:**
- Add `${hindsightPrompt}` after spec/todo introduction (in both hotfix and feature branches)
- Two single-line additions (one per branch)

---

## Summary of Changes

### Lines Added: ~30-35 (including logging and blank lines)
### Lines Modified: ~10 (prompt injections)
### Files Changed: 1 (pipeline.ts)
### New Files: 0 (output created dynamically)

### Change Breakdown by Location:

| Function | Lines Changed | Type | Additions |
|----------|---------------|------|-----------|
| `runPlan()` | ~12 | Addition | hindsight dir creation, generation, extraction |
| `runBuild()` | ~12 | Addition | hindsight dir creation, regeneration, extraction |
| `build-setup` prompt | 1 | Injection | hindsight context |
| `builder` prompt (hotfix) | 1 | Injection | hindsight context |
| `builder` prompt (feature) | 1 | Injection | hindsight context |

---

## Implementation Checklist

- [ ] Add `hindsightDir` constant in `runPlan()`
- [ ] Add `mkdir` for `.great-minds` in `runPlan()`
- [ ] Add dynamic import of git-intelligence-integration in `runPlan()`
- [ ] Add `generateProjectHindsight()` call in `runPlan()`
- [ ] Extract `hindsightPrompt` using `hindsightPlannerContext()` in `runPlan()`
- [ ] Inject `${hindsightPrompt}` into planner agent prompt
- [ ] Add `hindsightDir` constant in `runBuild()`
- [ ] Add `mkdir` for `.great-minds` in `runBuild()`
- [ ] Add dynamic import of git-intelligence-integration in `runBuild()`
- [ ] Add `generateProjectHindsight()` call in `runBuild()`
- [ ] Extract `hindsightPrompt` using `hindsightExecutorContext()` in `runBuild()`
- [ ] Inject `${hindsightPrompt}` into build-setup agent prompt
- [ ] Inject `${hindsightPrompt}` into builder agent prompt (hotfix branch)
- [ ] Inject `${hindsightPrompt}` into builder agent prompt (feature branch)

---

## Testing After Integration

```bash
# 1. Check that .great-minds directory is created
ls -la .great-minds/

# 2. Check that hindsight.md is generated
cat .great-minds/hindsight.md

# 3. Check that planner references it (look for "hindsight" or churn mentions)
grep -i "hindsight\|churn\|risk" .planning/phase-1-plan.md

# 4. Run a full pipeline and check for errors
# (pipeline.ts should not throw)

# 5. Verify no existing tests broke
npm test  # if applicable
```

---

## Rollback Strategy

If integration causes issues:

1. Revert pipeline.ts to HEAD
2. Delete any `.great-minds/` directories created
3. Verify pipeline runs normally again

Git revert is safe because changes are purely additive (no refactoring).

---

## Notes

- Dynamic imports (await import()) are used to avoid hard-coding dependencies at module load time
- Each phase regenerates Hindsight (plan phase, then build phase) to catch repository state changes
- Prompt injection happens at the point where agents are about to make decisions
- No configuration needed — all defaults from decisions.md are hardcoded in git-intelligence.ts

---

**Ready to implement?** All diffs are self-contained and can be applied manually or via a guided agent session.
