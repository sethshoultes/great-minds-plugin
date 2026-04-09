# Hindsight — Git Intelligence for AI Agents

> "Protection that doesn't announce itself. Machines with the instinct to know which code is dangerous."

## What It Does

Hindsight generates a risk-aware context report from git history that helps AI agents understand which files in your codebase warrant extra care before modification.

**Core capabilities:**
- Identifies high-churn files (frequently modified, higher conflict risk)
- Flags bug-associated files (appeared in fix/bug/revert commits)
- Reports uncommitted state
- Generates a terse risk summary (<50 words)

## Who This Is For

**Good fit:**
- Teams using AI agents for code generation/modification
- Repos with English commit messages
- Standard git workflows
- Repos under ~100k commits

**Not a good fit:**
- Non-English commit messages (v1 uses English regex: `fix|bug|broken|revert`)
- Non-git version control
- Projects where you want UI dashboards or configuration (this is invisible by design)

## Quick Start

```typescript
import { generateProjectHindsight, hindsightPlannerContext } from "./hindsight";

// Generate report at start of build/plan
const report = await generateProjectHindsight(
  "/path/to/repo",
  ".planning",
  console // optional logger
);

// Add context to planner prompts
const plannerPrompt = basePrompt + hindsightPlannerContext(".planning/hindsight-report.md");
```

## API

### `generateHindsightReport(repoPath, outputPath?)`
Core function. Analyzes git history and returns a structured report. Optionally writes markdown to `outputPath`.

### `generateProjectHindsight(repoPath, outputDir, logger?)`
Pipeline integration. Generates report and logs acknowledgment on first run.

### `trackHindsightOutcome(report, modifiedFiles, buildFailed, logger?)`
Outcome tracking. Call after builds to log when flagged files were modified and the build failed.

### `hindsightPlannerContext(reportPath)` / `hindsightExecutorContext(reportPath)`
Prompt modifiers. Append to agent prompts for risk-aware planning/execution.

## Design Principles

1. **Invisible** — No dashboards, no toggles, no configuration
2. **Opinionated** — Ships defaults, not options
3. **Fast** — <2 seconds on standard repos
4. **Simple** — <100 lines of core logic
5. **Mentor voice** — "Tread carefully" not "WARNING: DANGER"

## Limitations (v1)

- English commit patterns only
- No caching (fast enough without it)
- No user configuration
- No historical reports
- `--max-count=1000` safeguard may miss patterns in very old history

## Future (v1.1+)

- Vindication moments: "Hindsight flagged auth.ts. You handled it carefully. Build succeeded."
- Delta surfacing: "2 new high-risk files since yesterday."
- Internationalized patterns
- Optional configuration for enterprise repos

---

*"The best products aren't optimized for shipping speed. They're optimized for the moment when a user thinks, 'This is exactly what I needed, and I didn't even know it existed.'"*

See `rounds/git-intelligence/decisions.md` for full design rationale.
