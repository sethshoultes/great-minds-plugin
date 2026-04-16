# Hindsight Dependency Map — Architecture and Integration Points

**Purpose:** Visual mapping of how Hindsight integrates into the pipeline architecture

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GREAT MINDS PIPELINE                             │
└─────────────────────────────────────────────────────────────────────┘

                    runPipeline(prdFile, project)
                             │
                             ├─→ debate (skip for hotfix)
                             │
                             ├─→ runPlan()
                             │   │
                             │   ├─→ [INTEGRATION POINT 1] Generate Hindsight
                             │   │   └─→ generateProjectHindsight()
                             │   │       └─→ .great-minds/hindsight.md
                             │   │
                             │   ├─→ runAgent("planner")
                             │   │   [INTEGRATION POINT 2]
                             │   │   Prompt includes: hindsightPlannerContext()
                             │   │   └─→ Reads: .great-minds/hindsight.md
                             │   │
                             │   └─→ runAgent("sara-blakely-gutcheck")
                             │
                             ├─→ runBuild()
                             │   │
                             │   ├─→ [INTEGRATION POINT 3] Regenerate Hindsight
                             │   │   └─→ generateProjectHindsight()
                             │   │       └─→ .great-minds/hindsight.md (updated)
                             │   │
                             │   ├─→ runAgent("build-setup")
                             │   │   [INTEGRATION POINT 4a]
                             │   │   Prompt includes: hindsightExecutorContext()
                             │   │   └─→ Reads: .great-minds/hindsight.md
                             │   │
                             │   ├─→ runAgent("builder")
                             │   │   [INTEGRATION POINT 4b]
                             │   │   Prompt includes: hindsightExecutorContext()
                             │   │   └─→ Reads: .great-minds/hindsight.md
                             │   │
                             │   ├─→ runAgent("build-reviewer")
                             │   └─→ runAgent("build-fixer")
                             │
                             ├─→ runQA() — (1 or 2 passes)
                             ├─→ runCreativeReview() — (skip for hotfix)
                             ├─→ runBoardReview() — (skip for hotfix)
                             └─→ runShip()
```

---

## Module Dependency Graph

```
┌────────────────────────────────────────────────────────────────┐
│                  daemon/src/pipeline.ts                        │
│                   (orchestration layer)                        │
│                                                                │
│  • runPlan()           ──imports──→ git-intelligence-integration
│  • runBuild()          ──imports──→ git-intelligence-integration
│  • runAgent()          (unchanged)
│  • runQA()             (unchanged)
│                                                                │
└────────────────────────────────────────────────────────────────┘
                              │
                              │ (dynamic import)
                              ▼
┌────────────────────────────────────────────────────────────────┐
│        daemon/src/git-intelligence-integration.ts              │
│             (integration wrapper & prompts)                    │
│                                                                │
│  • generateProjectHindsight()      ──calls──→ generateHindsightReport
│  • hindsightPlannerContext()       (template)
│  • hindsightExecutorContext()      (template)
│  • trackHindsightOutcome()         (logging, optional)
│  • shouldRunHindsight()            (always true in v1)
│                                                                │
└────────────────────────────────────────────────────────────────┘
                              │
                              │ (function call)
                              ▼
┌────────────────────────────────────────────────────────────────┐
│          daemon/src/git-intelligence.ts                        │
│           (core analysis logic)                                │
│                                                                │
│  • generateHindsightReport()       (main function)
│  • assessRisk()                    (helper)
│  • git()                           (exec wrapper)
│  • formatMarkdown()                (output formatter)
│                                                                │
│  Dependencies: child_process, fs, path (all built-in)          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
                              │
                              │ (execSync)
                              ▼
                    ┌─────────────────────┐
                    │  Git Repository     │
                    │  (target project)   │
                    │                     │
                    │  • git log          │
                    │  • git status       │
                    │  • git diff         │
                    └─────────────────────┘
```

---

## File System Hierarchy

```
/Users/sethshoultes/Local Sites/great-minds-plugin/
│
├── daemon/src/
│   ├── pipeline.ts                         ← MODIFY (5-7 touch points)
│   ├── git-intelligence.ts                 ✅ (no changes)
│   ├── git-intelligence-integration.ts     ✅ (no changes)
│   ├── config.ts                           (optional: add HINDSIGHT_DIR)
│   ├── agents.ts
│   ├── logger.ts
│   └── ...
│
├── .planning/                              ← Created by pipeline (existing)
│   ├── phase-1-plan.md                    (generated by planner agent)
│   ├── REQUIREMENTS.md                    (generated by planner agent)
│   ├── sara-blakely-review.md             (generated by sara-blakely-gutcheck)
│   └── execution-report.md                (generated by builder agent)
│
├── .great-minds/                          ← Created by pipeline (NEW)
│   └── hindsight.md                       (generated by generateHindsightReport)
│                                          (regenerated in plan and build phases)
│
├── rounds/
│   └── {project}/
│       ├── round-1-steve.md
│       ├── decisions.md
│       └── ...
│
├── deliverables/
│   └── {project}/
│       ├── spec.md
│       ├── todo.md
│       └── ...
│
├── prds/
│   └── {project}.md
│
├── skills/
│   ├── agency-plan/SKILL.md
│   ├── agency-execute/SKILL.md
│   └── ...
│
└── docs/
    ├── HINDSIGHT-SCOUT-REPORT.md          (this report)
    ├── HINDSIGHT-INTEGRATION-DIFFS.md
    └── HINDSIGHT-DEPENDENCY-MAP.md
```

---

## Data Flow Diagram

```
Run Phase (Plan or Build)
        │
        ▼
┌─────────────────────────────────────┐
│ mkdir .great-minds                  │
│ (create output directory)           │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ generateProjectHindsight()          │
│ (from git-intelligence-integration) │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ generateHindsightReport()           │
│ (from git-intelligence)             │
│                                     │
│ 1. Run 4 git commands (parallel):   │
│    • git log --oneline -20          │
│    • git log --name-only (churn)    │
│    • git log --grep="fix|bug"       │
│    • git status                     │
│                                     │
│ 2. Parse results                    │
│ 3. Apply thresholds                 │
│ 4. Assess risk level                │
│ 5. Format markdown                  │
│ 6. Write .great-minds/hindsight.md  │
│ 7. Return HindsightReport object    │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ hindsightPlannerContext() OR         │
│ hindsightExecutorContext()          │
│ (from git-intelligence-integration) │
│                                     │
│ Returns: markdown snippet for       │
│ injecting into agent prompts        │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ runAgent("planner" or "builder")    │
│                                     │
│ Agent receives:                     │
│ • PRD/plan/decisions               │
│ • Hindsight context (injected)     │
│ • Instructions to read .great-minds/│
│   hindsight.md                      │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ Agent makes plan/build decisions    │
│ (ideally referencing high-risk files│
│  identified by Hindsight)          │
└─────────────────────────────────────┘
```

---

## Function Call Sequence (Plan Phase)

```
1. runPlan(project)
   │
   ├─ mkdir .planning
   ├─ mkdir .great-minds
   │
   ├─ generateProjectHindsight(REPO_PATH, .great-minds)
   │  │
   │  └─ generateHindsightReport(REPO_PATH, .great-minds/hindsight.md)
   │     │
   │     ├─ git("log --oneline -20", cwd)      ─→ async
   │     ├─ git("log --name-only", cwd)        ─→ async
   │     ├─ git("log --grep=fix|bug", cwd)     ─→ async
   │     ├─ git("status --short", cwd)         ─→ async
   │     │
   │     └─ formatMarkdown(report)
   │        └─ return report + write file
   │
   ├─ hindsightPlannerContext(.great-minds/hindsight.md)
   │  └─ return prompt template string
   │
   ├─ runAgent("planner", prompt + hindsightPrompt)
   │  │
   │  └─ (agent processes, reads hindsight.md, generates plan)
   │
   └─ return

2. Plan output:
   • .planning/phase-1-plan.md
   • .planning/REQUIREMENTS.md
   • .great-minds/hindsight.md (read by agent)
```

---

## Function Call Sequence (Build Phase)

```
1. runBuild(project, isHotfix)
   │
   ├─ mkdir .deliverables
   ├─ mkdir .great-minds
   │
   ├─ generateProjectHindsight(REPO_PATH, .great-minds)
   │  │
   │  └─ generateHindsightReport(REPO_PATH, .great-minds/hindsight.md)
   │     └─ (same as plan phase, fresh analysis)
   │
   ├─ hindsightExecutorContext(.great-minds/hindsight.md)
   │  └─ return prompt template string
   │
   ├─ runAgent("build-setup", prompt + hindsightPrompt)
   │  └─ generates spec.md, todo.md, tests/
   │
   ├─ runAgent("builder", prompt + hindsightPrompt)
   │  │
   │  └─ (agent processes, reads hindsight.md, executes tasks)
   │
   ├─ runAgent("build-reviewer", ...)
   ├─ [if BLOCK] runAgent("build-fixer", ...)
   │
   └─ return

2. Build output:
   • .deliverables/{project}/spec.md
   • .deliverables/{project}/todo.md
   • .deliverables/{project}/tests/
   • .planning/execution-report.md
   • .great-minds/hindsight.md (read by agents)
```

---

## Import Dependency Tree

```
pipeline.ts
├── @anthropic-ai/claude-agent-sdk
├── path
│   └── resolve
├── fs/promises
│   ├── mkdir
│   └── writeFile
├── child_process
│   └── execSync
├── fs
│   ├── existsSync
│   └── readFileSync
├── config.ts
│   ├── REPO_PATH
│   ├── PLUGIN_PATH
│   ├── PRDS_DIR
│   ├── ROUNDS_DIR
│   ├── DELIVERABLES_DIR
│   ├── SKILLS_DIR
│   ├── DEFAULT_MAX_TURNS
│   └── AGENT_TIMEOUT_MS
├── telegram.ts
│   ├── notify
│   └── notifyPhase
├── agents.ts
│   └── Various agent prompt generators
├── logger.ts
│   ├── log
│   └── logError
├── token-ledger.ts
│   ├── TokenLedger
│   └── estimateCost
│
└── [DYNAMIC IMPORT]
    └── git-intelligence-integration.ts
        ├── generateProjectHindsight
        ├── hindsightPlannerContext
        ├── hindsightExecutorContext
        ├── trackHindsightOutcome
        └── shouldRunHindsight

            └─ imports from git-intelligence.ts
                ├── generateHindsightReport
                └── HindsightReport interface

                    └─ imports
                        ├── child_process → execSync
                        ├── fs → writeFileSync
                        └── path → resolve
```

---

## Data Structure Flow

```
HindsightReport {
  generatedAt: string;
  recentChanges: string[];
  highChurnFiles: {
    file: string;
    changes: number;
  }[];
  bugProneFiles: string[];
  uncommittedState: {
    status: string;
    diffStats: string;
  };
  summary: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}
        │
        ├─ Written to disk as: .great-minds/hindsight.md
        │  (formatMarkdown() transforms to markdown)
        │
        ├─ Returned to pipeline as: HindsightReport object
        │
        └─ Read by agents as: .great-minds/hindsight.md file
           (agents receive path in prompt, read via tool)
```

---

## Integration Checklist with Dependencies

```
TASK 1: Add Hindsight Generation to runPlan()
├─ Depends on: config.ts (REPO_PATH constant)
├─ Depends on: fs/promises (mkdir)
├─ Depends on: path (resolve)
├─ Depends on: git-intelligence-integration.ts (generateProjectHindsight)
├─ Depends on: logger.ts (log function)
└─ Provides: hindsightPath for prompt injection

TASK 2: Inject Hindsight Context into Planner Prompt
├─ Depends on: git-intelligence-integration.ts (hindsightPlannerContext)
├─ Depends on: hindsightPath from TASK 1
└─ Provides: enriched planner prompt

TASK 3: Add Hindsight Generation to runBuild()
├─ Depends on: Same as TASK 1
└─ Provides: hindsightPath for prompt injection (v2)

TASK 4: Inject Hindsight Context into Build Prompts
├─ Depends on: git-intelligence-integration.ts (hindsightExecutorContext)
├─ Depends on: hindsightPath from TASK 3
└─ Provides: enriched build prompts
```

---

## Execution Environment Map

```
Runtime Environment: Node.js (TypeScript compiled to JS)

Module Loading:
├─ Static imports: config.ts, logger.ts, agents.ts, token-ledger.ts
└─ Dynamic imports: git-intelligence-integration.ts (await import at runtime)

Working Directory:
├─ REPO_PATH = /Users/sethshoultes/Local Sites/great-minds-plugin
├─ .planning/ = within REPO_PATH
├─ .great-minds/ = within REPO_PATH
├─ rounds/ = within REPO_PATH
├─ deliverables/ = within REPO_PATH
├─ prds/ = within REPO_PATH
└─ skills/ = within PLUGIN_PATH

Git Operations:
├─ Target: REPO_PATH
├─ Commands: git log, git status, git diff (read-only)
├─ Execution: execSync with cwd=REPO_PATH
└─ Timeout: None in v1 (add in v1.1)

Agent Operations:
├─ Tool access: Read, Write, Edit, Bash, Glob, Grep, Agent
├─ Working directory: REPO_PATH
├─ Model used: sonnet (for planner and builder)
└─ File access: Can read .great-minds/hindsight.md
```

---

## Performance Dependencies

```
Plan Phase Execution Time:
├─ mkdir .great-minds              ~1ms
├─ generateProjectHindsight()      ~500ms (sequential git commands)
│  └─ Without caching (v1)
│  └─ With caching (v1.1): <100ms on cache hit
├─ hindsightPlannerContext()       <1ms
├─ runAgent("planner")             ~5-15 minutes (varies by project)
└─ TOTAL: +500ms overhead per plan phase

Build Phase Execution Time:
├─ mkdir .great-minds              ~1ms
├─ generateProjectHindsight()      ~500ms (fresh analysis)
├─ hindsightExecutorContext()      <1ms
├─ runAgent("builder")             ~10-30 minutes (varies by project)
└─ TOTAL: +500ms overhead per build phase

Overall Impact:
├─ Adds: ~1 second per pipeline run (negligible)
├─ Without caching: ~500ms per phase
├─ With caching (v1.1): <100ms per phase
└─ Payoff: Reduced agent errors on high-churn files
```

---

## Error Handling Dependency Chain

```
Pipeline Error → logError() → log warning → notify() (telegram) → continue

Hindsight Error Cases:
├─ git not available
│  └─ git() function returns ""
│     └─ Report contains "clean" or "none"
│     └─ Pipeline continues
│
├─ Non-git repo
│  └─ git() function returns ""
│     └─ Report shows no analysis
│     └─ Pipeline continues
│
├─ Large repo (slow git commands)
│  └─ execSync may timeout (no current protection)
│     └─ Graceful degradation in v1.1
│
├─ .great-minds/ mkdir fails
│  └─ Thrown error caught by runPlan/runBuild
│     └─ Pipeline fails (expected behavior)
│
└─ Agent ignores Hindsight
   └─ No error
   └─ Feature works but less effective
   └─ Monitor by checking agent output for references
```

---

## Testing Dependency Map

```
Unit Tests (if applicable):
├─ git-intelligence.ts
│  ├─ Test on repo with 0 commits
│  ├─ Test on repo with 1 commit
│  ├─ Test on repo with 10k commits
│  └─ Test on repo with 100k+ commits
│
└─ git-intelligence-integration.ts
   ├─ Test generateProjectHindsight()
   ├─ Test prompt generators (content only)
   └─ Test shouldRunHindsight()

Integration Tests:
├─ Test runPlan() with Hindsight
│  ├─ .great-minds/hindsight.md created
│  ├─ Planner receives Hindsight context
│  └─ Planner output references risk files
│
├─ Test runBuild() with Hindsight
│  ├─ .great-minds/hindsight.md updated
│  ├─ Builder receives Hindsight context
│  └─ Builder references risk files in decisions
│
└─ Test hotfix path
   ├─ Hindsight still generated
   └─ Plan phase skipped (so Hindsight only in build)

E2E Tests:
└─ Full pipeline with known high-churn repo
   ├─ .great-minds/hindsight.md matches expected files
   ├─ Planner plan reflects high-risk awareness
   └─ Builder modifications avoid flagged files (if possible)
```

---

## Rollback Dependency Chain

```
If integration causes issues:

1. Revert pipeline.ts to HEAD
   └─ Removes all Hindsight calls

2. Delete .great-minds/ directories
   └─ Clean up generated files

3. Verify pipeline runs normally
   └─ Tests should pass

4. No dependency cleanup needed
   ├─ No new npm packages
   ├─ No new config files
   └─ No data migrations
```

---

## Version Timeline

```
v1.0 (Current):
├─ Core git-intelligence.ts ✅ Complete
├─ Integration helpers ✅ Complete
├─ Pipeline integration ❌ TODO
├─ No caching ❌ TODO for v1.1
├─ No parallel git commands ❌ TODO for v1.1
└─ No timeout protection ❌ TODO for v1.1

v1.1 (Post-launch):
├─ Caching (HEAD hash + timestamp)
├─ Parallel execution (Promise.all)
├─ Timeout protection (10s per command)
├─ Config escape hatch (if complaints)
└─ Performance optimizations

v2.0 (Future):
├─ LLM-generated risk summary (cut from v1)
├─ Agent activity/shortlog (cut from v1)
├─ Configuration options
├─ Visualizations/heatmaps
└─ CI/CD log integration
```

---

**Navigation:**
- [Scout Report](./HINDSIGHT-SCOUT-REPORT.md) — Comprehensive analysis
- [Integration Diffs](./HINDSIGHT-INTEGRATION-DIFFS.md) — Exact code changes
- [This Document](./HINDSIGHT-DEPENDENCY-MAP.md) — Architecture reference

**Status:** Ready for implementation
