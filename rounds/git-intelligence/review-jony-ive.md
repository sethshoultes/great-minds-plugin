# Design Review: Hindsight — Git Intelligence

**Reviewer:** Jony Ive
**Date:** April 9, 2026
**Review Iteration:** Second Pass

---

## Opening Reflection

There is something profoundly correct about the *intention* of this work. The desire to create protection that doesn't announce itself—to build something invisible that simply *works*—this speaks to an understanding of design that goes beyond aesthetics into the realm of respect. Respect for the user. Respect for their attention.

But intention and execution are different conversations. Let me examine what is here.

---

## Visual Hierarchy

**The most important thing should be the most visible.**

### What Works

The **README.md** (lines 1-86) demonstrates considered hierarchy. The opening quotation (line 3) functions as a manifesto—it tells you what this *is* before telling you what it *does*. This is correct. The progression from philosophy to function to implementation follows a natural reading gravity.

```markdown
> "Protection that doesn't announce itself. Machines with the instinct to know which code is dangerous."
```

The section headings create clear waypoints: "What It Does," "Who This Is For," "Quick Start." These are not clever. They are clear. Clarity is a form of kindness.

**index.ts** (lines 1-19) is nearly perfect in its hierarchy—the philosophical quotation floats above the exports like a design manifesto. The module breathes intent before it exports anything.

### What Doesn't

**hindsight.ts** (lines 68-92) — The `formatMarkdown` function produces a report where the most important information is buried:

```typescript
return `# Hindsight Report
**Generated:** ${r.generatedAt}

## Summary
${r.summary}
```

A timestamp leads. A timestamp is metadata—the *least* important information. The **risk level** (line 17, 54-55) is the most important insight, yet it arrives third, embedded within a summary sentence. The hierarchy is inverted.

**README.md** (lines 17-27) — The "Good fit / Not a good fit" section arrives too early. A user encountering this for the first time doesn't yet care whether it's a good fit. They need to understand the *emotion* of what this provides before they assess compatibility. This is gatekeeping at the entrance.

**hindsight-integration.ts** (lines 62-75, 79-92) — The prompt modifiers are walls of text. Numbered lists feel like instructions issued to subordinates, not guidance offered to professionals. A mentor doesn't hand you a checklist; a mentor shifts your attention.

---

## Whitespace

**There must be room to breathe.**

### What Works

**index.ts** (lines 1-19) is beautifully spare. Nineteen lines. One purpose. The blank line between the docblock and the exports is a breath. The grouping of related exports from `hindsight-integration.js` shows consideration for the reader's parsing.

**hindsight.ts** maintains reasonable density overall. The core function `generateHindsightReport` (lines 32-66) is compact but not crowded in most places.

### What Doesn't

**hindsight.ts** (lines 43-45) — This is dense to the point of hostility:

```typescript
const highChurnFiles = [...churnMap.entries()]
  .filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]).slice(0, 15)
  .map(([file, changes]) => ({ file, changes }));
```

Three operations chained on a single conceptual line. The mind cannot rest anywhere. Four transformations deserve four lines:

```typescript
const highChurnFiles = [...churnMap.entries()]
  .filter(([, count]) => count >= 3)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .map(([file, changes]) => ({ file, changes }));
```

Each transformation deserves its own line. The eye should be able to trace the data's journey.

**hindsight.ts** (lines 38-48) — There is no pause between *gathering* data and *processing* data. A single blank line between the git command and the Map construction would give the eye permission to rest.

**hindsight-integration.ts** (line 62) — The leading newline `` `\n## Hindsight...` `` creates accidental margin. Whitespace should be intentional, not incidental.

---

## Consistency

**Patterns should repeat elegantly.**

### What Works

The error handling pattern (line 23) is consistent: `try/catch` with silent failure returning empty string. This is opinionated in a good way—it says "git commands may fail, and that's fine, we continue."

The naming convention is harmonious: `hindsightPlannerContext`, `hindsightExecutorContext`, `generateHindsightReport`, `generateProjectHindsight`. The word "Hindsight" anchors everything. This is a small family of functions that know they belong together.

### What Doesn't

**Magic numbers without music.** Throughout the code, numbers are scattered like seeds without a garden:

- **hindsight.ts, line 35:** `-20` and `--max-count=1000`
- **hindsight.ts, line 38:** `-100`
- **hindsight.ts, line 44:** `>= 3`, `.slice(0, 15)`
- **hindsight.ts, line 48:** `.slice(0, 20)`
- **hindsight.ts, lines 27-29:** `> 10`, `> 5`

These numbers are reasonable but unexplained. They feel arbitrary because they *appear* arbitrary. Named constants would transform magic into meaning:

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

Now they have a home. Now they can be understood as a system of choices.

**hindsight.ts** (lines 57-62) — The object property shorthand is inconsistent:

```typescript
const report: HindsightReport = {
  generatedAt: new Date().toISOString(),
  recentChanges, highChurnFiles, bugProneFiles,  // shorthand
  uncommittedState: { status: status || "clean", diffStats: diffStats || "none" },  // explicit
  summary, riskLevel,  // shorthand
};
```

Either use shorthand throughout or expand throughout. The mixture reads as indecision.

**hindsight.ts, line 60** — Semantic registers are mixed:

```typescript
status: status || "clean", diffStats: diffStats || "none"
```

"clean" implies a positive state—an adjective. "none" implies absence—a pronoun. These are different semantic registers. Choose one philosophy:
- Both states: `"clean"` / `"unchanged"`
- Both absences: `"none"` / `"none"`

**hindsight-integration.ts** (lines 27-28 and 55-56) — The logging pattern repeats but is verbose:

```typescript
if (logger) logger.info(msg);
else console.log(msg);
```

This appears twice with minor variation. Repetition is acceptable, but acknowledge the choice. A small helper would make intent clearer, or commit fully to the explicitness.

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

**README.md, line 64** — "Mentor voice — 'Tread carefully' not 'WARNING: DANGER'" shows someone who has thought deeply about how software speaks to people. This single line justifies the entire project.

**hindsight.ts, lines 26-30** — The `assessRisk` function is wonderfully minimal—six lines that make the most important decision in the entire system. Clear thresholds, no ambiguity.

**index.ts, lines 3-5** — "Protection that doesn't announce itself. Machines with the instinct to know which code is dangerous." Poetry in a JSDoc.

### What Falls Short

**hindsight.ts, lines 20-24** — The `git` helper function swallows all errors silently:

```typescript
function git(cmd: string, cwd: string): string {
  try {
    return execSync(`git ${cmd}`, { cwd, encoding: "utf-8", maxBuffer: 10_000_000 }).trim();
  } catch { return ""; }
}
```

This cannot distinguish "no results" from "catastrophic failure." A corrupted repo, a network timeout, a permission error—all become empty strings. This is convenience masquerading as simplicity. In service of "invisible," we've lost "traceable." When something goes wrong, where does the question go?

**hindsight-integration.ts, line 23** — The comment `// Board condition: Acknowledgment line on first run (Oprah)` breaks the fourth wall. These internal references to your review process should not ship. They are scaffolding, not structure.

Similarly, **line 36**: `// Board condition: Basic outcome tracking (Jensen/Buffett)` — remove these. The code should stand without its backstory.

**hindsight.ts, line 35** — `git("log --oneline -20 --max-count=1000", cwd)` — Using both `-20` and `--max-count=1000` together is confusing. The `-20` limits output to 20 commits; `--max-count=1000` is redundant or contradictory. This reads as uncertainty preserved in code.

**hindsight-integration.ts, line 96** — `_project: string` with the underscore prefix indicating unused. This is a placeholder for the future, but it announces incompleteness. Ship what is, not what might be. Delete it and add it when needed.

---

## What Would Make It Quieter but More Powerful

### 1. Invert the Report Hierarchy

**hindsight.ts, lines 68-92**

Lead with the risk level. Let the timestamp become a footnote:

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

### 2. Replace Instructions with Observations

**hindsight-integration.ts, lines 72-75**

Instead of:
```
When planning tasks:
1. Flag tasks that touch high-churn or bug-prone files as higher risk
2. Consider sequencing tasks to minimize conflicts in hot files
3. Note any uncommitted changes that might affect the plan
```

Consider:
```
Files marked here carry history. High-churn files attract conflicts.
Bug-associated files have broken before. Weight your plans accordingly.
```

Fewer words. More weight. The user is a professional; speak to them as one.

### 3. Name the Magic Numbers

**hindsight.ts, top of file**

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

This isn't configurability—you've correctly rejected that. This is self-documentation.

### 4. Let the Processing Breathe

**hindsight.ts, lines 35-55**

Insert blank lines between the three data-gathering blocks (recent, churn, bugs). Add a single comment before each section. The gathering of data and the synthesis of meaning are different acts. Mark the transitions.

### 5. Surface Errors with Grace

**hindsight.ts, lines 20-24**

```typescript
function git(cmd: string, cwd: string): string | null {
  try {
    return execSync(`git ${cmd}`, { cwd, encoding: "utf-8", maxBuffer: 10_000_000 }).trim();
  } catch {
    return null; // Explicit: "we tried, we failed"
  }
}
```

Then handle `null` explicitly. The distinction between "empty result" and "failed operation" is meaningful for debugging.

### 6. Remove the Scaffolding

Delete all "Board condition" comments. Delete any reference to internal review processes. The code should not remember how it was made—it should simply *be*.

---

## Summary

This is thoughtful work. The philosophy is sound: invisible protection, opinionated defaults, mentor voice. The execution honors this philosophy in places and forgets it in others.

The greatest opportunity lies not in adding features but in *removing noise*. The chained method calls that compress three thoughts into one line. The numbered instructions that turn guidance into commands. The magic numbers scattered without a home. The timestamps that lead when risk levels should.

**Quieter. More powerful.** These are not opposites. They are the same thing.

The closing line of the report—"*Let this guide your hands*"—is exactly right. Now let the code itself embody that same confidence. Say less. Mean more.

Every detail must serve the whole. Build everything to earn that moment when a developer encounters this work and thinks: "This is exactly what I needed, and I didn't even know it existed."

---

*"Design is not just what it looks like and feels like. Design is how it works."*

— Jony Ive
