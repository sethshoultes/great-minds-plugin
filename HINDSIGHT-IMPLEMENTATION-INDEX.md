# Hindsight Implementation — Master Index

**Scout Date:** 2026-04-16
**Status:** Ready for Build
**Confidence:** High
**Estimated Effort:** 90-120 minutes

---

## Quick Navigation

### For Builders
Start here if you're implementing Hindsight integration:
1. **[Integration Diffs](./HINDSIGHT-INTEGRATION-DIFFS.md)** — Exact code changes needed
2. **[Scout Report Part 2](./HINDSIGHT-SCOUT-REPORT.md#part-2-integration-points-in-pipeline)** — Integration points explained
3. **Test the integration** — See verification checklist below

### For Architects
Understand the system design:
1. **[Dependency Map](./HINDSIGHT-DEPENDENCY-MAP.md)** — Architecture and data flow
2. **[Scout Report](./HINDSIGHT-SCOUT-REPORT.md)** — Complete analysis
3. Review: No new dependencies required

### For PM/Product Owners
Track implementation progress:
1. **[Success Criteria](#success-criteria)** — Below
2. **[Risk Register](./HINDSIGHT-SCOUT-REPORT.md#part-11-risk-register)** — What could go wrong
3. **[Timeline](#implementation-timeline)** — When this ships

---

## The Hindsight Feature (Recap)

**What it is:** A git intelligence pre-build step that runs before agents plan or build code. Gives agents visibility into which files are fragile, which are bug-prone, and what changed recently.

**Why it matters:** Agents make fewer mistakes on high-churn files when warned beforehand.

**How it works:**
```
4 git commands → churn analysis → markdown report → agent prompt injection
```

**Performance:** <500ms per phase (can be optimized to <100ms in v1.1 with caching)

---

## Current Status (April 16, 2026)

| Component | Status | Lines of Code | Location |
|-----------|--------|---------------|----------|
| Core git analysis logic | ✅ Complete (100%) | ~93 | daemon/src/git-intelligence.ts |
| Integration helpers & prompts | ✅ Complete (100%) | ~101 | daemon/src/git-intelligence-integration.ts |
| Pipeline integration | ❌ NOT STARTED | ~30-35 needed | daemon/src/pipeline.ts |
| Agent prompt updates | ❌ NOT STARTED | ~5 touch points | daemon/src/pipeline.ts |
| Output directory creation | ❌ NOT STARTED | ~3 lines needed | daemon/src/pipeline.ts |
| **TOTAL NEW CODE NEEDED** | **30-35 lines** | **~120 minutes to implement** | |

---

## What's Already Built (Don't Modify These)

### 1. Core Analysis Engine
**File:** `/Users/sethshoultes/Local Sites/great-minds-plugin/daemon/src/git-intelligence.ts`

**Status:** ✅ Complete, battle-tested, no changes needed

**What it does:**
- Runs 4 git commands to analyze repository
- Returns structured report (HindsightReport interface)
- Formats output as calm, veteran-engineer markdown
- Handles errors gracefully (silent return of empty values)

**Key Functions:**
```typescript
generateHindsightReport(repoPath, outputPath?)
  → HindsightReport with: generatedAt, recentChanges, highChurnFiles,
    bugProneFiles, uncommittedState, summary, riskLevel
```

**Use as-is:** No modifications needed

---

### 2. Integration Wrapper
**File:** `/Users/sethshoultes/Local Sites/great-minds-plugin/daemon/src/git-intelligence-integration.ts`

**Status:** ✅ Complete, ready to be called from pipeline

**What it provides:**
- `generateProjectHindsight()` — wrapper for report generation
- `hindsightPlannerContext()` — markdown template for planner prompt
- `hindsightExecutorContext()` — markdown template for builder prompt
- `trackHindsightOutcome()` — optional logging (unused in v1)
- `shouldRunHindsight()` — feature flag (always true in v1)

**Key Functions:**
```typescript
hindsightPlannerContext(reportPath)
  → Returns: markdown template to inject into planner prompt

hindsightExecutorContext(reportPath)
  → Returns: markdown template to inject into builder prompt
```

**Use as-is:** No modifications needed

---

## What Needs Building (Integration Work)

### Integration Point 1: Plan Phase Directory & Report
**Location:** `/Users/sethshoultes/Local Sites/great-minds-plugin/daemon/src/pipeline.ts`, line ~259-275

**What to add:**
```typescript
// Add these lines after mkdir(.planning):
const hindsightDir = resolve(REPO_PATH, ".great-minds");
await mkdir(hindsightDir, { recursive: true });

// Generate Hindsight report
const { generateProjectHindsight, hindsightPlannerContext } =
  await import("./git-intelligence-integration.js");
await generateProjectHindsight(REPO_PATH, hindsightDir, { info: log });
const hindsightPath = resolve(hindsightDir, "hindsight.md");

// Extract prompt template
const hindsightPrompt = hindsightPlannerContext(hindsightPath);
```

**Lines Added:** ~8-10

---

### Integration Point 2: Plan Agent Prompt
**Location:** `/Users/sethshoultes/Local Sites/great-minds-plugin/daemon/src/pipeline.ts`, line ~269-277

**What to modify:**
Inject `${hindsightPrompt}` into the planner agent prompt after reading PRD/decisions but before the "IMPORTANT" section.

**Lines Modified:** 1 (prompt string)

---

### Integration Point 3: Build Phase Directory & Report
**Location:** `/Users/sethshoultes/Local Sites/great-minds-plugin/daemon/src/pipeline.ts`, line ~287-299

**What to add:**
Same as Integration Point 1 (regenerate in build phase)

**Lines Added:** ~8-10

---

### Integration Point 4: Build-Setup Agent Prompt
**Location:** `/Users/sethshoultes/Local Sites/great-minds-plugin/daemon/src/pipeline.ts`, line ~302-331

**What to modify:**
Inject `${hindsightPrompt}` into the build-setup agent prompt after reading PRD/plan but before "Read CLAUDE.md"

**Lines Modified:** 1 (prompt string)

---

### Integration Point 5: Builder Agent Prompt
**Location:** `/Users/sethshoultes/Local Sites/great-minds-plugin/daemon/src/pipeline.ts`, line ~348-359

**What to modify:**
Inject `${hindsightPrompt}` into the builder agent prompt (both hotfix and feature branches)

**Lines Modified:** 2 (one per branch)

---

## Integration Checklist

```
PHASE 1: Preparation
├─ [ ] Read all documentation:
│   ├─ decisions.md (product decisions)
│   ├─ git-intelligence.md (PRD)
│   ├─ HINDSIGHT-SCOUT-REPORT.md (this analysis)
│   └─ HINDSIGHT-INTEGRATION-DIFFS.md (exact code diffs)
│
├─ [ ] Review existing code:
│   ├─ daemon/src/git-intelligence.ts
│   ├─ daemon/src/git-intelligence-integration.ts
│   └─ daemon/src/pipeline.ts (understand flow)
│
└─ [ ] Set up for testing:
    ├─ Identify test repository with 500+ commits
    └─ Clear .planning/ and .great-minds/ if they exist

PHASE 2: Integration (Main Work)
├─ [ ] Add Hindsight generation to runPlan()
│   ├─ [ ] Add hindsightDir constant
│   ├─ [ ] Add mkdir call
│   ├─ [ ] Add dynamic import
│   ├─ [ ] Add generateProjectHindsight() call
│   ├─ [ ] Extract hindsightPrompt
│   └─ [ ] Add logging
│
├─ [ ] Inject Hindsight into planner prompt
│   └─ [ ] Add ${hindsightPrompt} before "IMPORTANT" line
│
├─ [ ] Add Hindsight regeneration to runBuild()
│   ├─ [ ] Add hindsightDir constant
│   ├─ [ ] Add mkdir call
│   ├─ [ ] Add dynamic import
│   ├─ [ ] Add generateProjectHindsight() call
│   ├─ [ ] Extract hindsightPrompt
│   └─ [ ] Add logging
│
├─ [ ] Inject Hindsight into build-setup prompt
│   └─ [ ] Add ${hindsightPrompt} before "Read CLAUDE.md" line
│
└─ [ ] Inject Hindsight into builder prompt (both branches)
    ├─ [ ] Hotfix branch: add ${hindsightPrompt}
    └─ [ ] Feature branch: add ${hindsightPrompt}

PHASE 3: Testing & Verification
├─ [ ] Manual testing on test repo:
│   ├─ [ ] Run runPlan() and verify:
│   │   ├─ .great-minds/ directory created
│   │   ├─ .great-minds/hindsight.md generated
│   │   ├─ Report contains expected sections
│   │   └─ Planner prompt includes hindsight context
│   │
│   ├─ [ ] Run runBuild() and verify:
│   │   ├─ .great-minds/hindsight.md regenerated
│   │   ├─ Builder prompt includes hindsight context
│   │   └─ No pipeline errors
│   │
│   └─ [ ] Check pipeline doesn't break:
│       ├─ [ ] Full pipeline runs without new errors
│       └─ [ ] Hotfix path still works
│
└─ [ ] Code review:
    ├─ [ ] Diffs reviewed by team lead
    ├─ [ ] No refactoring of existing code
    ├─ [ ] All imports are correct
    └─ [ ] Logging is appropriate

PHASE 4: Commit & Documentation
├─ [ ] Commit changes:
│   ├─ [ ] git add daemon/src/pipeline.ts
│   ├─ [ ] git commit -m "feat: integrate Hindsight git intelligence into pipeline"
│   └─ [ ] Commit message references decisions.md
│
└─ [ ] Documentation:
    ├─ [ ] Remove these scout reports from repo root (or keep for reference)
    ├─ [ ] Update STATUS.md or MEMORY.md if tracking features
    └─ [ ] Test results documented
```

---

## Success Criteria

All of these must be true for "DONE":

### Functional Requirements
- [ ] `.great-minds/hindsight.md` is generated during `runPlan()`
- [ ] `.great-minds/hindsight.md` is regenerated during `runBuild()`
- [ ] Planner agent receives Hindsight context in prompt
- [ ] Builder agent receives Hindsight context in prompt
- [ ] Report contains: summary, recent changes, high-churn files, bug-prone files, uncommitted state
- [ ] Report includes risk level assessment (LOW/MEDIUM/HIGH)
- [ ] Agents can read the hindsight.md file (it's created before they run)

### Quality Requirements
- [ ] No new pipeline errors introduced
- [ ] No refactoring of existing pipeline code
- [ ] Integration code follows existing patterns (mkdir, logging, imports)
- [ ] Dynamic imports used to avoid circular dependencies
- [ ] Error handling is graceful (git errors don't crash pipeline)

### Testing Requirements
- [ ] Tested on repository with 500+ commits
- [ ] Report shows reasonable hotspots (top 5-20 files)
- [ ] Execution time is acceptable (<2s per phase)
- [ ] Hotfix path still works (skips debate, runs plan/build/qa-1/ship)
- [ ] Agent prompts actually reference hindsight (check agent output)

### Documentation Requirements
- [ ] Code changes are self-documenting (clear variable names, comments)
- [ ] No placeholder comments left behind
- [ ] Commit message references the product decision document

---

## Implementation Timeline

### Session 1: Preparation & Analysis (This Session)
- [x] Read PRD and decisions document
- [x] Review existing git-intelligence code
- [x] Analyze pipeline.ts for integration points
- [x] Document findings in scout report
- **Time: 1-2 hours**

### Session 2: Integration & Testing (Next Session)
- [ ] Implement 5 integration points in pipeline.ts
- [ ] Test on real repository
- [ ] Verify agents reference hindsight
- [ ] Commit changes
- **Time: 1.5-2 hours**

### Post-Launch (v1.1 or later)
- [ ] Add caching (HEAD hash + timestamp)
- [ ] Parallelize git commands (Promise.all)
- [ ] Add timeout protection (10s per command)
- [ ] Gather metrics on error reduction
- **Time: 2-3 hours**

---

## Files & Locations

### Documentation (Reference)
- `HINDSIGHT-SCOUT-REPORT.md` — Comprehensive analysis (11 sections)
- `HINDSIGHT-INTEGRATION-DIFFS.md` — Exact code changes
- `HINDSIGHT-DEPENDENCY-MAP.md` — Architecture reference
- `HINDSIGHT-IMPLEMENTATION-INDEX.md` — This document
- `/rounds/git-intelligence/decisions.md` — Product decisions (locked)
- `/prds/git-intelligence.md` — Product requirements

### Source Code (To Be Modified)
- `daemon/src/pipeline.ts` — Main integration work (~5-7 touch points)
- `daemon/src/git-intelligence.ts` — Already complete (read-only)
- `daemon/src/git-intelligence-integration.ts` — Already complete (read-only)

### Output (Generated at Runtime)
- `.great-minds/hindsight.md` — Report generated per-phase
- `.planning/phase-1-plan.md` — Planner output (unchanged)
- `.planning/REQUIREMENTS.md` — Requirements (unchanged)

---

## Key Files to Know

| File | Purpose | Status | Action |
|------|---------|--------|--------|
| daemon/src/pipeline.ts | Orchestration | ⚠️ MAIN WORK | Integrate Hindsight |
| daemon/src/git-intelligence.ts | Analysis engine | ✅ DONE | Read only |
| daemon/src/git-intelligence-integration.ts | Wrappers & templates | ✅ DONE | Read only |
| daemon/src/config.ts | Constants | ✅ OK | Optional: add HINDSIGHT_DIR |
| daemon/src/agents.ts | Agent prompts | ✅ NO CHANGE | (prompts are inline in pipeline.ts) |
| rounds/git-intelligence/decisions.md | Product spec | 🔒 LOCKED | Reference only |
| prds/git-intelligence.md | Requirements | 🔒 LOCKED | Reference only |

---

## Code Patterns to Follow

### Pattern 1: Directory Creation
```typescript
const outputDir = resolve(REPO_PATH, "output-name");
await mkdir(outputDir, { recursive: true });
```

### Pattern 2: Dynamic Import
```typescript
const { functionName } = await import("./module-name.js");
```

### Pattern 3: Prompt Injection
```typescript
const contextText = helperFunction(filePath);
const prompt = `Read instructions...

${contextText}

Continue with more instructions...`;
```

### Pattern 4: Logging
```typescript
log(`PHASE: phase-name — started`);
log(`PHASE: phase-name — action completed`);
```

---

## Common Questions & Answers

### Q: Will this slow down the pipeline?
**A:** No. Hindsight adds ~500ms per phase (plan & build), which is negligible compared to agent execution (5-30 minutes). Can be optimized to <100ms with caching in v1.1.

### Q: What if git isn't available?
**A:** The code handles it gracefully. `git()` function returns empty string, report shows "clean", pipeline continues.

### Q: What if the repo is massive (500k+ commits)?
**A:** Design accounts for this with timeout protection in v1.1. For v1, just accept that very large repos will take longer.

### Q: Can we skip Hindsight for certain projects?
**A:** Yes, `shouldRunHindsight()` is a feature flag. Currently always true, can be enhanced in v1.1 to check for `.hindsight-skip` file.

### Q: Will agents actually read the report?
**A:** Not guaranteed, but likely. The explicit prompt instruction should help. Monitor agent output for Hindsight references. If agents ignore it, we need stronger prompt engineering.

### Q: What if .great-minds/ already exists?
**A:** `mkdir` with `recursive: true` is idempotent — no error if directory exists. File is overwritten each time.

### Q: Should we commit .great-minds/hindsight.md?
**A:** No. It's a transient build artifact. Add to .gitignore if needed (though probably fine to commit since it's generated fresh each run).

---

## Troubleshooting Guide

### Problem: Pipeline errors after integration
**Diagnosis:**
1. Check error message
2. Verify `mkdir` calls are correct
3. Verify dynamic imports use correct path
4. Verify prompt injection syntax (closing backtick placement)

**Solution:**
- Revert pipeline.ts to HEAD
- Reimplement one integration point at a time
- Test after each change

### Problem: .great-minds/hindsight.md not created
**Diagnosis:**
1. Check if `mkdir` for `.great-minds` was added
2. Check if `generateProjectHindsight()` call exists
3. Check if file path in call is correct

**Solution:**
- Verify hindsightDir = resolve(REPO_PATH, ".great-minds")
- Verify await mkdir(hindsightDir, { recursive: true })
- Verify await generateProjectHindsight(REPO_PATH, hindsightDir, ...)

### Problem: Agent doesn't read hindsight.md
**Diagnosis:**
1. Check if prompt injection happened
2. Check if hindsightPath variable is correct
3. Check if ${hindsightPrompt} is in prompt string

**Solution:**
- Review agent output for hindsight references
- If missing, verify prompt was injected correctly
- Strengthen prompt language: "Start by reading the Hindsight report..."

### Problem: Execution time increased significantly
**Diagnosis:**
1. Normal: ~500ms per phase is expected
2. If >5s per phase: git commands may be slow on large repo
3. If >30s per phase: something else is wrong

**Solution:**
- Measure with `time node ...`
- Profile git command execution time
- Consider reducing lookback from 90 days to 30 days
- Plan caching optimization for v1.1

---

## Risk Mitigation Strategies

### Risk: Integration breaks existing pipeline
**Mitigation:**
- Make only additive changes (no refactoring)
- Keep changes isolated to runPlan() and runBuild()
- Test before committing
- Have git revert ready

### Risk: Agents ignore Hindsight
**Mitigation:**
- Use explicit prompt language: "Read the Hindsight report first"
- Monitor agent output for references
- Adjust prompt if needed
- Measure impact post-launch

### Risk: Performance regression
**Mitigation:**
- Measure baseline before integration
- Measure after integration
- If >2s added per phase, optimize git commands
- Cache implementation for v1.1

### Risk: Wrong file paths
**Mitigation:**
- Use resolve() consistently with REPO_PATH
- Test path construction before committing
- Print paths to log for verification

---

## Next Steps

1. **Immediate:** Build changes using Integration Diffs guide
2. **Testing:** Run on test repository, verify all success criteria
3. **Review:** Commit and document changes
4. **Monitor:** Track agent behavior after launch
5. **Optimize:** Implement caching & parallelization in v1.1

---

## Resources

### Decision Document (Product)
📄 `/rounds/git-intelligence/decisions.md` — All strategic decisions locked here

### PRD (Requirements)
📄 `/prds/git-intelligence.md` — Original requirements document

### Scout Reports (This Analysis)
📄 `HINDSIGHT-SCOUT-REPORT.md` — Complete detailed analysis
📄 `HINDSIGHT-INTEGRATION-DIFFS.md` — Exact code changes
📄 `HINDSIGHT-DEPENDENCY-MAP.md` — Architecture reference

### Source Code (Reference)
- `daemon/src/git-intelligence.ts` — Core analysis
- `daemon/src/git-intelligence-integration.ts` — Wrappers
- `daemon/src/pipeline.ts` — Where to integrate

---

## Contact & Questions

For questions during implementation:
- Reference the scout reports (comprehensive analysis)
- Check "Common Questions & Answers" section above
- Review "Troubleshooting Guide" section above
- Consult the decisions document for product rationale

---

**Status:** 🟢 Ready for Build
**Confidence:** HIGH
**Effort Estimate:** 90-120 minutes
**Blocking Issues:** None
**Dependencies:** None (all code exists)

---

**Report Generated:** 2026-04-16
**Scout Mandate:** Map relevant files, identify patterns, note gaps
**Mandate Status:** ✅ COMPLETE

Begin implementation with `HINDSIGHT-INTEGRATION-DIFFS.md` for code changes.
