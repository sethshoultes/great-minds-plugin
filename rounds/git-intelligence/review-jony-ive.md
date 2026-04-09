# Design Review: Hindsight — Git Intelligence

**Reviewer:** Jony Ive
**Date:** April 9, 2026
**Review Iteration:** Final Assessment

---

## Opening Reflection

There is something profoundly correct about the *intention* of this work. The desire to create protection that doesn't announce itself—to build something invisible that simply *works*—this speaks to an understanding of design that transcends aesthetics into the realm of respect. Respect for the user. Respect for their attention.

But intention and execution are different conversations. Let me examine what is here with fresh eyes.

---

## Visual Hierarchy

**The most important thing should be the most visible.**

### What Works

**README.md** (lines 1-3) — The opening is architecturally correct:

```markdown
# Hindsight — Git Intelligence for AI Agents

> "Protection that doesn't announce itself. Machines with the instinct to know which code is dangerous."
```

A name, then a manifesto. This is the proper order—identity before philosophy, philosophy before function. The blockquote creates visual separation; the italics communicate that this is a *voice*, not a specification.

**index.ts** (lines 1-19) — Nineteen lines of perfect hierarchy. The philosophical quotation floats above the exports like a banner above a temple. The module breathes intent before it exports anything. This file understands what it is.

**README.md** (lines 58-65) — The Design Principles section:

```markdown
1. **Invisible** — No dashboards, no toggles, no configuration
2. **Opinionated** — Ships defaults, not options
3. **Fast** — <2 seconds on standard repos
4. **Simple** — <100 lines of core logic
5. **Mentor voice** — "Tread carefully" not "WARNING: DANGER"
```

Bold keywords. Clear explanations. Each principle stands alone yet contributes to the whole. This is hierarchy done well.

### What Falls Short

**hindsight.ts** (lines 68-71) — The generated markdown report inverts importance:

```typescript
return `# Hindsight Report
**Generated:** ${r.generatedAt}

## Summary
${r.summary}
```

A timestamp leads. A timestamp is metadata—the *least* important information for someone seeking guidance. The **risk level** is the critical signal, yet it arrives third, embedded within a summary sentence. The reader must parse prose to find the answer to "should I worry?"

The hierarchy should be:

```markdown
# Hindsight Report

> **Risk Level: MEDIUM**

Tread carefully. 12 high-churn files, 8 bug-associated files.
```

Lead with the verdict. Let context follow.

**hindsight-integration.ts** (lines 66-75, 83-91) — The prompt modifiers present numbered lists that feel bureaucratic:

```typescript
When planning tasks:
1. Flag tasks that touch high-churn or bug-prone files as higher risk
2. Consider sequencing tasks to minimize conflicts in hot files
3. Note any uncommitted changes that might affect the plan
```

A mentor doesn't hand you a checklist; a mentor shifts your attention. These could become:

```
Files marked here carry history. High-churn files attract conflicts.
Bug-associated files have broken before. Weight your plans accordingly.
```

Fewer words. More weight.

---

## Whitespace

**There must be room to breathe.**

### What Works

**index.ts** (lines 1-19) — Beautifully spare. The blank line between the docblock and the exports is a breath. The grouping of related exports from `hindsight-integration.js` shows consideration for the reader's parsing.

**hindsight.ts** (lines 10-18) — The interface definition has appropriate vertical rhythm:

```typescript
export interface HindsightReport {
  generatedAt: string;
  recentChanges: string[];
  highChurnFiles: { file: string; changes: number }[];
  bugProneFiles: string[];
  uncommittedState: { status: string; diffStats: string };
  summary: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}
```

Each property on its own line. The eye can trace the shape of data without effort.

### What Falls Short

**hindsight.ts** (lines 43-45) — This is dense to the point of hostility:

```typescript
const highChurnFiles = [...churnMap.entries()]
  .filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]).slice(0, 15)
  .map(([file, changes]) => ({ file, changes }));
```

Three operations chained on a single conceptual line. The mind cannot rest anywhere. Each transformation deserves its own line:

```typescript
const highChurnFiles = [...churnMap.entries()]
  .filter(([, count]) => count >= 3)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .map(([file, changes]) => ({ file, changes }));
```

Now the eye can trace the data's journey.

**hindsight.ts** (lines 57-62) — The report object construction uses property shorthand inconsistently:

```typescript
const report: HindsightReport = {
  generatedAt: new Date().toISOString(),
  recentChanges, highChurnFiles, bugProneFiles,
  uncommittedState: { status: status || "clean", diffStats: diffStats || "none" },
  summary, riskLevel,
};
```

Some properties expanded, some shortened, three crammed onto one line. This is a primary data structure—it deserves the space to be understood at a glance:

```typescript
const report: HindsightReport = {
  generatedAt: new Date().toISOString(),
  recentChanges,
  highChurnFiles,
  bugProneFiles,
  uncommittedState: {
    status: status || "clean",
    diffStats: diffStats || "none"
  },
  summary,
  riskLevel,
};
```

**hindsight-integration.ts** (line 62) — The leading newline `` `\n## Hindsight...` `` creates accidental margin. Whitespace should be intentional, not incidental.

---

## Consistency

**Patterns should repeat elegantly.**

### What Works

**Naming convention** — The word "Hindsight" anchors everything harmoniously: `hindsightPlannerContext`, `hindsightExecutorContext`, `generateHindsightReport`, `generateProjectHindsight`, `trackHindsightOutcome`, `HindsightReport`. This is a small family of functions that know they belong together.

**Error handling** (line 20-24) — The silent `catch { return ""; }` is philosophically consistent. Git commands may fail; the system continues. This is opinionated in a good way.

**Export pattern** (index.ts) — Clean separation of the core function from integration utilities. The reader understands the API surface immediately.

### What Falls Short

**Magic numbers without homes.** Throughout `hindsight.ts`, numbers are scattered:

| Location | Value | Purpose |
|----------|-------|---------|
| Line 35 | `-20`, `--max-count=1000` | Commit limits (redundant?) |
| Line 38 | `-100` | Churn sample size |
| Line 44 | `>= 3`, `.slice(0, 15)` | Churn threshold, max results |
| Line 48 | `.slice(0, 20)` | Max bug-prone files |
| Lines 27-29 | `> 10`, `> 5` | Risk thresholds |

These numbers are reasonable but unexplained. They feel arbitrary because they *appear* arbitrary. A configuration object would transform magic into meaning:

```typescript
const ANALYSIS = {
  recentCommitCount: 20,
  churnSampleSize: 100,
  minChangesForFlag: 3,
  maxHighChurnFiles: 15,
  maxBugProneFiles: 20,
  riskThresholds: { high: 10, medium: 5 },
} as const;
```

This is not configuration for users—that would betray the design philosophy. This is documentation for maintainers.

**Semantic register mismatch** — `hindsight.ts` line 60:

```typescript
status: status || "clean", diffStats: diffStats || "none"
```

"clean" implies a positive state—an adjective. "none" implies absence—a pronoun. These are different semantic registers. Choose one philosophy: both states (`"clean"` / `"unchanged"`) or both absences (`"none"` / `"none"`).

**Comment voice inconsistency** — Compare:

- `hindsight.ts` line 3: *"Single function, <100 lines, no classes. Ships opinions, not options."* — Personality.
- `hindsight-integration.ts` line 3: *"Provides the integration points for the Hindsight report generator."* — Bureaucracy.

The voice should be consistent across the module.

---

## Craft

**Do the details reward close inspection?**

### What Rewards Inspection

**hindsight.ts, line 22** — `maxBuffer: 10_000_000`. The underscore separator transforms "ten million" from a wall of zeros into a legible number. This is the work of someone who cares about the next reader.

**hindsight.ts, lines 89-90** — The closing line of the generated report:

```markdown
*Let this guide your hands. The files marked here have stories—some of them cautionary tales.*
```

This is *exquisite*. It treats the developer as a craftsperson, not a cog. It speaks to the humanity of the work. This is the voice the entire system should have.

**README.md, line 64** — "Mentor voice — 'Tread carefully' not 'WARNING: DANGER'" shows someone who has thought deeply about how software speaks to people. This single line justifies the entire project's philosophy.

**hindsight.ts, lines 26-30** — The `assessRisk` function is wonderfully minimal—six lines that make the most important decision in the entire system:

```typescript
function assessRisk(churnCount: number, bugCount: number): "LOW" | "MEDIUM" | "HIGH" {
  if (bugCount > 10 || churnCount > 10) return "HIGH";
  if (bugCount > 5 || churnCount > 5) return "MEDIUM";
  return "LOW";
}
```

Clear thresholds, no ambiguity, no cleverness. This is confidence.

### What Falls Short

**hindsight.ts, line 35** — Using both `-20` and `--max-count=1000` together:

```typescript
const recentRaw = git("log --oneline -20 --max-count=1000", cwd);
```

The `-20` limits output to 20 commits; `--max-count=1000` is then redundant or contradictory. This reads as uncertainty preserved in code. Small inconsistencies reveal large truths about care.

**hindsight-integration.ts, lines 23, 36** — Comments that break the fourth wall:

```typescript
// Board condition: Acknowledgment line on first run (Oprah)
// Board condition: Basic outcome tracking (Jensen/Buffett)
```

These internal references to your review process should not ship. They are scaffolding, not structure. The code should not remember how it was made—it should simply *be*.

**hindsight-integration.ts, lines 96-98** — A function that always returns `true`:

```typescript
export function shouldRunHindsight(_project: string): boolean {
  return true; // v1: Always run. v2: Check for .hindsight-skip or config option.
}
```

The underscore prefix announces incompleteness. Ship what is, not what might be. Delete it and add it when needed.

**hindsight.ts, lines 20-24** — The `git` helper swallows all errors silently:

```typescript
function git(cmd: string, cwd: string): string {
  try {
    return execSync(`git ${cmd}`, { cwd, encoding: "utf-8", maxBuffer: 10_000_000 }).trim();
  } catch { return ""; }
}
```

This cannot distinguish "no results" from "catastrophic failure." A corrupted repo, a network timeout, a permission error—all become empty strings. In service of "invisible," we've lost "traceable." Consider returning `null` for failures versus `""` for empty results.

---

## What Would Make It Quieter but More Powerful

### 1. Invert the Report Hierarchy

**hindsight.ts, lines 68-91**

Lead with the risk level. Let the timestamp retreat:

```markdown
# Hindsight Report

> **MEDIUM RISK** — Tread carefully.

12 high-churn files. 8 bug-associated files. 3 uncommitted changes.

---

## High-Churn Files
...

---

*Generated: 2026-04-09T14:30:00Z*
*Let this guide your hands. The files marked here have stories—some of them cautionary tales.*
```

The risk level becomes the hero. The blockquote creates visual separation. The timestamp retreats to where it belongs.

### 2. Name the Magic Numbers

**hindsight.ts, top of file** — Create a single source of truth:

```typescript
const ANALYSIS = {
  recentCommitCount: 20,
  churnSampleSize: 100,
  minChangesForFlag: 3,
  maxHighChurnFiles: 15,
  maxBugProneFiles: 20,
  riskThresholds: { high: 10, medium: 5 },
} as const;
```

This is self-documentation, not configuration.

### 3. Let the Processing Breathe

**hindsight.ts, lines 35-55** — Insert blank lines between the three data-gathering blocks. Add a single comment before each section:

```typescript
// Recent activity
const recentRaw = git("log --oneline -20", cwd);
const recentChanges = recentRaw ? recentRaw.split("\n") : [];

// Churn analysis
const churnRaw = git("log --name-only --format= -100", cwd);
...

// Bug association
const bugRaw = git('log --grep="fix\\|bug\\|broken\\|revert" ...', cwd);
```

The gathering of data and the synthesis of meaning are different acts. Mark the transitions.

### 4. Replace Instructions with Observations

**hindsight-integration.ts, lines 66-75, 83-91**

Transform checklists into guidance:

```typescript
export function hindsightPlannerContext(reportPath: string): string {
  return `
## Hindsight Report

Read the report at ${reportPath}.

Files marked here carry history. High-churn files attract conflicts.
Bug-associated files have broken before. Uncommitted changes may
complicate your plans. Weight your decisions accordingly.
`;
}
```

Fewer words. More weight. Trust the professional.

### 5. Remove the Scaffolding

- Delete all "Board condition" comments
- Delete `shouldRunHindsight` until it does something
- Remove redundant git flags (`-20` vs `--max-count`)
- Unify the semantic register ("clean"/"none" → pick one)

### 6. Surface Errors with Grace

**hindsight.ts, lines 20-24** — Distinguish between failure and emptiness:

```typescript
function git(cmd: string, cwd: string): string | null {
  try {
    return execSync(`git ${cmd}`, { cwd, encoding: "utf-8", maxBuffer: 10_000_000 }).trim();
  } catch {
    return null;
  }
}
```

Then handle `null` explicitly where it matters.

---

## Summary

This is thoughtful work. The philosophy is sound: invisible protection, opinionated defaults, mentor voice. The execution honors this philosophy in places and forgets it in others.

The greatest opportunity lies not in adding features but in *removing noise*:
- The chained method calls that compress three thoughts into one line
- The numbered instructions that turn guidance into commands
- The magic numbers scattered without a home
- The timestamps that lead when risk levels should
- The scaffolding comments that remember how it was made

**Quieter. More powerful.** These are not opposites. They are the same thing.

The closing line of the report—"*Let this guide your hands*"—is exactly right. Now let the code itself embody that same confidence. Say less. Mean more.

---

## Scores

| Dimension | Score | Notes |
|-----------|-------|-------|
| Visual Hierarchy | 6/10 | Strong README, inverted report hierarchy |
| Whitespace | 7/10 | index.ts excellent, core logic cramped |
| Consistency | 6/10 | Good naming, scattered magic numbers |
| Craft | 8/10 | Beautiful moments, some rough edges |
| **Overall** | **7/10** | Sound foundation requiring refinement |

---

## Verdict

**PROCEED** with refinements before v1.1.

The intention is correct. The philosophy is sound. The execution needs polish to match the promise. Every detail must serve the whole.

Build everything to earn that moment when a developer encounters this work and thinks: *"This is exactly what I needed, and I didn't even know it existed."*

---

*"Design is not just what it looks like and feels like. Design is how it works."*

— Jony Ive
