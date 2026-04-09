# Design Review: mirror.ts

**Reviewer:** Jony Ive
**Date:** April 9, 2026
**File:** `/deliverables/sync-great-minds/mirror.ts`

---

## Overall Impression

There is a quietness to this script that I appreciate. It knows what it is. It does not apologize for existing. The past-tense output philosophy—"Mirrored," "Installed," "Committed"—speaks to confidence. The work is done; we simply acknowledge it.

And yet.

There is noise here. Visual clutter that diminishes the essential clarity of what should be a profoundly simple object: a synchronization mechanism.

---

## Visual Hierarchy

### What Works
The file opens with a clear docblock (lines 2-19) that establishes intent. This is good. The reader knows immediately what they hold in their hands.

### What Doesn't
**Lines 33-40: The manifest declaration is visually heavy.**

```typescript
const FILES_TO_MIRROR = [
  { src: "daemon/src/pipeline.ts", desc: "Core GSD pipeline" },
  { src: "daemon/src/agents.ts", desc: "14 persona prompts" },
  ...
];
```

The `desc` field is charming but decorative. It serves documentation, not function. When we read this array, we want to see *what moves*—the paths. The descriptions introduce lateral eye movement, competing for attention with the essential truth.

**Recommendation:** Remove `desc` entirely. If documentation is needed, let it live in comments above, not inline noise within the data structure itself.

---

## Whitespace

### Lines 44-47: The log helper breathes alone.
```typescript
function log(message: string): void {
  console.log(message);
}
```

This single-purpose function sits in generous whitespace. Beautiful. It is what it is.

### Lines 53-76: checkDestinationClean() is claustrophobic.

The nested try-catch creates visual density. The conditional logic at line 71 (`if (err instanceof Error && err.message.includes("uncommitted"))`) is defensive programming that reads as anxiety.

**Recommendation:** Extract the error-handling into a separate concern. The function should read as a clean assertion, not a negotiation with failure modes.

---

## Consistency

### Pattern Recognition

I observe three operational functions with a clear rhythm:
- `checkDestinationClean()` — verify
- `copyFiles()` — transform
- `runNpmInstall()` — install
- `commitAndPush()` — publish

The verbs are inconsistent. "check" vs. "copy" vs. "run" vs. "commitAnd."

**Lines 81-99 vs. 105-120:** `copyFiles()` uses a `for...of` loop with clean iteration. `runNpmInstall()` uses a procedural try-catch block. The rhythms differ when they should rhyme.

**Lines 126-166: commitAndPush()** — This function name betrays a design flaw. "And" in a function name is a code smell. Two responsibilities bound together.

**Recommendation:**
- Rename to verbs that share grammatical structure: `verifyDestination()`, `mirrorFiles()`, `installDependencies()`, `commitChanges()`, `pushChanges()`
- Separate commit and push into distinct functions

---

## Craft

### Details That Reward

**Line 111:** `stdio: "pipe"` with the comment "Capture output, don't print npm spam."

This is craft. Someone understood that npm's verbosity is hostile to the script's quiet philosophy. The comment is direct, human, almost irreverent. I appreciate the restraint it represents.

**Line 112:** `timeout: 120_000` — The numeric separator is a small kindness. Two minutes, readable.

**Line 139:** `"No changes to commit"` — The messaging maintains past-tense philosophy even in the null case. Consistent.

### Details That Don't

**Lines 154-159:** The push failure handling breaks form catastrophically.

```typescript
console.error(`Push failed: ${errMsg}`);
console.error(
  "Commit was successful. Resolve push issues and run: git -C great-minds push"
);
process.exit(1);
```

Suddenly we have multi-line error messages with instructional content. The voice shifts from quiet observer to anxious helper. This is jarring. The script should not explain remediation strategies—that belongs in documentation.

**Lines 27-30:** The path resolution block is mechanical and undifferentiated.

```typescript
const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(__filename);
const PLUGIN_ROOT = resolve(SCRIPT_DIR, "..");
const DEST_ROOT = resolve(PLUGIN_ROOT, "..", "great-minds");
```

Four constants, each dependent on the previous, presented identically. This is a visual list when it should express a hierarchy. The destination root is the *point*; the intermediate steps are noise.

---

## What Would Make It Quieter But More Powerful

### 1. Remove the manifest descriptions (lines 33-40)
Let the paths speak for themselves. If you must annotate, do it once, elsewhere.

### 2. Collapse the path derivation (lines 27-30)
```typescript
const DEST_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "great-minds");
```
One truth. One line. The intermediate steps are implementation, not meaning.

### 3. Separate commit and push (lines 126-166)
Two functions. Each does one thing. If push fails, the calling context decides what to say about it—not the push function itself.

### 4. Standardize error surfaces (lines 66-68, 117-118, 154-159)
Every error should exit the same way. The script should have one error voice, not three. Consider:
```typescript
function fail(message: string): never {
  console.error(message);
  process.exit(1);
}
```

### 5. Let the main function breathe (lines 171-186)
The comments "Pre-flight checks," "Copy files," "npm install," "Git commit + push" are section headers pretending to be inline comments. Either elevate them to proper visual separators or remove them entirely. The function names already communicate.

### 6. Consider what happens at line 97
```typescript
log(`Mirrored ${basename(file.src)}`);
```
Six files, six log lines. This is noisy. Consider instead a single completion message: `log("Mirrored 6 files");` Or better: silence during operation, a single confirmation at the end.

---

## The Essential Question

This script wants to be invisible. It wants to synchronize files and disappear. The output philosophy of past-tense declarations supports this—we are told what happened, not what is happening.

But the implementation betrays this aspiration. It speaks too much during errors. It carries decorative metadata. Its functions have inconsistent granularity.

The most powerful version of this script would produce exactly three possible outputs:
1. `Synced.` (success)
2. `Nothing to sync.` (no changes)
3. `Failed: {reason}` (error)

Everything else is ornamentation.

---

## Summary

| Dimension | Assessment |
|-----------|------------|
| Visual Hierarchy | Functional but cluttered |
| Whitespace | Inconsistent—some functions breathe, others suffocate |
| Consistency | Pattern breaks in naming and error handling |
| Craft | Moments of beauty undermined by anxious verbosity |

**Final thought:** Simplicity is not the absence of complexity—it is the resolution of it. This script has resolved the complexity of file synchronization. It has not yet resolved the complexity of communicating that resolution.

The work to be done is subtraction.

---

*"Design is not just what it looks like and feels like. Design is how it works."*
*— Steve Jobs*

*And how it works should be evident in how it reads.*
*— JI*
