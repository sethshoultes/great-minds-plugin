# Design Review: Hindsight — Git Intelligence

*A meditation on form, restraint, and the quiet confidence of thoughtful software.*

---

## Overall Impression

There is genuine intention here. The philosophy—"invisible by design," "ships opinions, not options"—is correct. The aspiration is to create something that protects without announcing itself, that guides without commanding. This is admirable. And yet, the execution occasionally betrays the philosophy. Let me be specific.

---

## Visual Hierarchy

**The most important thing should be the most visible.**

### README.md

The opening quote (line 3) is beautiful and sets the emotional tone perfectly:

> "Protection that doesn't announce itself. Machines with the instinct to know which code is dangerous."

But then we immediately shift to "What It Does" (line 5) and a dense bullet list (lines 9-13). The hierarchy is inverted. The *feeling* of the product should lead. The mechanics should recede.

**Specific concern:** Lines 17-27 ("Good fit" / "Not a good fit") are premature. A user encountering this for the first time doesn't yet care whether it's a good fit. They need to understand the *emotion* of what this provides before they assess compatibility. Move this to the end.

### hindsight.ts — formatMarkdown function (lines 68-92)

The generated report opens with:

```markdown
# Hindsight Report
**Generated:** ${r.generatedAt}
```

A timestamp is the *least* important information. It's metadata. The *summary*—the human insight—should lead. The timestamp can whisper at the bottom.

**Recommendation:** Invert the hierarchy. Lead with the risk level and summary. Let the timestamp become a footnote at line 89, not the opening statement at line 70.

### index.ts (lines 1-8)

This is *nearly perfect*. The opening quote floats above the exports like a design manifesto—separate, contemplative, then silent. This is how a module should introduce itself.

---

## Whitespace

**There must be room to breathe.**

### hindsight.ts (lines 38-45)

```typescript
const churnRaw = git("log --name-only --format= -100 --max-count=1000", cwd);
const churnMap = new Map<string, number>();
for (const file of (churnRaw || "").split("\n").filter(Boolean)) {
  churnMap.set(file, (churnMap.get(file) || 0) + 1);
}
const highChurnFiles = [...churnMap.entries()]
  .filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]).slice(0, 15)
  .map(([file, changes]) => ({ file, changes }));
```

This is dense. The logic is correct, but the visual rhythm is compressed. There's no pause between *gathering* data and *processing* data. A single blank line between line 42 and line 43 would give the eye permission to rest.

Line 44 chains four operations (`.filter().sort().slice().map()`). Each transformation deserves its own line—not for the compiler, but for the human who will return to this code in six months.

### hindsight.ts (lines 57-62)

The report object construction (lines 57-62) is compressed onto just a few lines:

```typescript
const report: HindsightReport = {
  generatedAt: new Date().toISOString(),
  recentChanges, highChurnFiles, bugProneFiles,
  uncommittedState: { status: status || "clean", diffStats: diffStats || "none" },
  summary, riskLevel,
};
```

The mixing of single-line property shorthand with multi-property lines creates visual inconsistency. Either give each property its own line, or commit fully to compression. This middle ground is neither elegant nor economical.

### hindsight-integration.ts (lines 62-75, 79-92)

The prompt modifiers `hindsightPlannerContext` and `hindsightExecutorContext` are dense blocks of instruction. The content is good—the numbered lists are clear. But the leading newline (line 62: `` `\n## Hindsight...` ``) creates an accidental margin. Whitespace should be intentional, not incidental.

---

## Consistency

**Patterns should repeat elegantly.**

### Logging pattern (hindsight-integration.ts)

Lines 27-28:
```typescript
if (logger) logger.info(msg);
else console.log(msg);
```

Lines 55-56:
```typescript
if (logger) logger.warn(msg);
else console.warn(msg);
```

The pattern repeats, but it's verbose. A small helper would make the intent clearer:

```typescript
const emit = (fn: Function, fallback: Function) => (msg: string) =>
  logger ? fn.call(logger, msg) : fallback(msg);
```

Or accept that the repetition is acceptable. But acknowledge the choice.

### Fallback strings (hindsight.ts, line 60)

```typescript
status: status || "clean", diffStats: diffStats || "none"
```

"clean" implies something positive—a state. "none" implies absence—a quantity. These are different semantic registers. One is an adjective, one is a pronoun. Choose one philosophy:

- Both states: `"clean"` / `"unchanged"`
- Both absences: `"none"` / `"none"`

### README.md — API section (lines 46-56)

The API documentation has inconsistent visual weight:

- Line 46: `` `generateHindsightReport(repoPath, outputPath?)` `` — full signature
- Line 55: `` `hindsightPlannerContext(reportPath)` / `hindsightExecutorContext(reportPath)` `` — two functions sharing one line

Each function deserves equal visual weight. The slash on line 55 is expedient but inconsistent with the pattern established above it.

---

## Craft

**Do the details reward close inspection?**

### What rewards inspection

**hindsight.ts, line 22**: `maxBuffer: 10_000_000`. The underscore separator transforms "ten million" from a wall of zeros into a legible number. This is the work of someone who cares about the next reader.

**hindsight.ts, line 90**:

```markdown
*Let this guide your hands. The files marked here have stories—some of them cautionary tales.*
```

This is *exquisite*. It treats the developer as a craftsperson, not a cog. It speaks to the humanity of the work. This is the voice the entire system should have. More of this.

**index.ts, lines 4-5**: "Protection that doesn't announce itself. Machines with the instinct to know which code is dangerous." Poetry in a JSDoc. The module breathes intent before it exports anything.

**hindsight.ts, lines 26-30**: The `assessRisk` function is wonderfully minimal—six lines that make the most important decision in the entire system. Clear thresholds, no ambiguity.

### What undermines inspection

**hindsight.ts, lines 20-24**: The `git` helper swallows all errors silently:

```typescript
function git(cmd: string, cwd: string): string {
  try {
    return execSync(`git ${cmd}`, { cwd, encoding: "utf-8", maxBuffer: 10_000_000 }).trim();
  } catch { return ""; }
}
```

This cannot distinguish "no results" from "catastrophic failure." A corrupted repo, a network timeout, a permission error—all become empty strings. This is convenience masquerading as simplicity. Consider returning `null` for errors, allowing calling code to decide what absence means.

**hindsight.ts, lines 35, 38, 47**: Magic numbers scattered throughout:

- `-20` commits for recent changes (line 35)
- `-100` commits for churn/bug analysis (lines 38, 47)
- `>= 3` changes threshold (line 44)
- `.slice(0, 15)` / `.slice(0, 20)` (lines 44, 48)

These numbers are reasonable, but unexplained. Named constants at the top would transform magic into meaning:

```typescript
const RECENT_COMMITS = 20;
const ANALYSIS_DEPTH = 100;
const CHURN_THRESHOLD = 3;
```

**hindsight-integration.ts, line 96**: `_project: string` with the underscore prefix indicating unused. This is a placeholder for the future, but it announces incompleteness. Ship what is, not what might be. Delete it and add it when needed.

---

## What I Would Change

*To make it quieter, but more powerful.*

### 1. Invert the report hierarchy (hindsight.ts, lines 68-92)

Lead with the risk assessment, not the timestamp:

```markdown
# Hindsight Report

## Risk Assessment: HIGH

> 12 high-churn files, 8 bug-associated files, 3 uncommitted changes.
> Tread carefully on flagged files.

---

## High-Churn Files
...

---

*Generated: 2024-01-15T10:30:00Z*
*Let this guide your hands. The files marked here have stories—some of them cautionary tales.*
```

The risk level becomes the hero. The timestamp becomes a footnote where it belongs.

### 2. Name the magic numbers (hindsight.ts, top of file)

```typescript
const CONFIG = {
  recentCommits: 20,
  analysisDepth: 100,
  churnThreshold: 3,
  maxChurnFiles: 15,
  maxBugFiles: 20,
} as const;
```

Now the numbers have names. The intent is visible. Future readers will understand *why* these values exist.

### 3. Surface errors with grace (hindsight.ts, lines 20-24)

```typescript
function git(cmd: string, cwd: string): string | null {
  try {
    return execSync(`git ${cmd}`, { cwd, encoding: "utf-8", maxBuffer: 10_000_000 }).trim();
  } catch {
    return null; // Explicit: "we tried, we failed"
  }
}
```

Then handle `null` explicitly. The distinction between "empty result" and "failed operation" is meaningful.

### 4. Restructure the README (lines 5-27)

Lead with emotion, follow with mechanics:

1. The quote (already perfect)
2. One sentence: "Hindsight gives AI agents the instinct to know which code is dangerous."
3. A three-line code example
4. Then the details

Move "Good fit / Not a good fit" to the end—it's important, but it's gatekeeping at the entrance.

### 5. Add breathing room (hindsight.ts, lines 43-55)

Insert blank lines between the three data-gathering blocks (recent, churn, bugs). The gathering of data and the synthesis of meaning are different acts. Mark the transitions.

### 6. Unify semantic registers (hindsight.ts, line 60)

Choose: `"clean"` / `"unchanged"` or `"none"` / `"none"`. Consistency in small things creates trust in large things.

---

## Summary

The philosophy is sound. The restraint is admirable. The voice—when it emerges, as in line 90—is beautiful.

But beauty requires consistency. Every detail must serve the whole. The silent error handling, the unnamed numbers, the inverted hierarchies—these are small compromises that accumulate into noise.

Make it quieter. Let the important things speak. Let the unimportant things disappear entirely.

The closing line already knows what this software wants to be:

> *Let this guide your hands. The files marked here have stories—some of them cautionary tales.*

Build everything to earn that moment.

---

*"Design is not just what it looks like and feels like. Design is how it works."*

— Jony Ive
