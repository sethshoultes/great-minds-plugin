# Hindsight: Build Blueprint

**Project:** Git Intelligence for AI Agents
**Codename:** Hindsight
**Status:** APPROVED FOR BUILD
**Arbiter:** Phil Jackson, The Zen Master
**Date:** April 9, 2026
**Version:** 3.0 — Final Build Specification

---

## I. Locked Decisions

### Decision 1: Product Name

| Field | Value |
|-------|-------|
| **Proposed By** | Steve Jobs (Round 1) |
| **Challenged By** | Elon Musk ("git-intel is cleaner for CLIs") |
| **Winner** | Steve Jobs |
| **Final Decision** | External name is **Hindsight** |
| **Why Steve Won** | "Names outlast code. 'Git Intelligence' is a feature description. Nobody falls in love with a feature description." Elon conceded in Round 2: "I love the name. 'Hindsight' is poetry. I'm stealing it." |

---

### Decision 2: File Artifact vs. Direct Injection

| Field | Value |
|-------|-------|
| **Proposed By** | Elon Musk (Round 1) — inject directly, no file writes |
| **Challenged By** | Steve Jobs (Round 2) — "Agents deserve documents, not just injections" |
| **Winner** | Steve Jobs |
| **Final Decision** | Write markdown file to `.planning/hindsight-report.md` |
| **Why Steve Won** | "A markdown file isn't debugging overhead — it's a thinking artifact. When an agent pauses to read a structured document before acting, it processes information deliberately." Elon's concern about race conditions was addressed by scoping to single-session generation. |

---

### Decision 3: Agent Activity (Shortlog)

| Field | Value |
|-------|-------|
| **Proposed By** | Original PRD; defended by Steve Jobs |
| **Challenged By** | Elon Musk — "Bus factor is a human concern, not agent intel" |
| **Winner** | Elon Musk |
| **Final Decision** | **CUT** from v1 |
| **Why Elon Won** | Steve argued single-author files signal hidden complexity. Elon countered: "Churn data already captures this without parsing contributor names." Board agreed: ship lean, revisit only if users request it. |

---

### Decision 4: Configuration Options

| Field | Value |
|-------|-------|
| **Proposed By** | Steve Jobs |
| **Supported By** | Elon Musk (complete alignment) |
| **Winner** | Consensus |
| **Final Decision** | **Zero** user-facing configuration in v1 |
| **Rationale** | "If you need to configure it, we've already failed." — Steve. "Experts ship opinions, not options." Both agreed. Enterprise config deferred to v2. |

---

### Decision 5: Risk Summary Generation

| Field | Value |
|-------|-------|
| **Proposed By** | Steve Jobs — "mentor voice" prose |
| **Challenged By** | Elon Musk — "LLMs summarizing for LLMs burns tokens" |
| **Winner** | **Compromise** |
| **Final Decision** | Include summary, <50 words, terse not prose |
| **Synthesis** | Steve's voice, Elon's discipline. Maya Angelou provided the template: "Let this guide your hands. The files marked here have stories — some of them cautionary tales." |

---

### Decision 6: Voice and Tone

| Field | Value |
|-------|-------|
| **Proposed By** | Steve Jobs |
| **Challenged By** | Elon Musk (initially dismissed as "emotional overhead") |
| **Winner** | Steve Jobs |
| **Final Decision** | Mentor voice, not alarm voice |
| **Why Steve Won** | Elon conceded in Round 2: "Tone matters. An alarm creates anxiety. A mentor creates trust." Sample: "Tread carefully" not "WARNING: DANGER." Maya Angelou reinforced: "Weak language creates forgettable products." |

---

### Decision 7: Architecture Pattern

| Field | Value |
|-------|-------|
| **Proposed By** | Elon Musk |
| **Challenged By** | Steve Jobs (wanted "invisible guardian" abstraction) |
| **Winner** | Elon Musk |
| **Final Decision** | One function, <100 lines, no classes |
| **Why Elon Won** | "A 50-line script is easier to debug, extend, and kill than a 200-line invisible guardian." Steve conceded simplicity enables the invisible principle he champions. Jony Ive reinforced: "Remove what is uncertain. Keep what is essential." |

---

### Decision 8: Git Command Performance

| Field | Value |
|-------|-------|
| **Proposed By** | Elon Musk |
| **Challenged By** | Steve (initially dismissed as "premature optimization") |
| **Winner** | Elon Musk |
| **Final Decision** | Parallel execution with `Promise.all()`, add `--max-count=1000` to all log commands |
| **Why Elon Won** | "On a 50K-commit repo, sequential git commands = 10-25 seconds of blocking I/O. Parallel = instant 5x improvement." Steve conceded in Round 2: "I was romanticizing when practical limits matter." |

---

### Decision 9: Caching

| Field | Value |
|-------|-------|
| **Proposed By** | Elon Musk |
| **Winner** | Both (DEFERRED) |
| **Final Decision** | No caching in v1 |
| **Rationale** | "Don't optimize what doesn't hurt." 1-2 seconds is fast enough. Hash-based cache invalidation documented for v2 if needed. |

---

### Decision 10: Dashboard/UI

| Field | Value |
|-------|-------|
| **Proposed By** | Steve Jobs ("invisible by design") |
| **Supported By** | Elon Musk (complete alignment) |
| **Challenged By** | Shonda Rhimes ("invisible heroes don't get renewed") |
| **Winner** | Steve/Elon for v1 |
| **Final Decision** | No dashboard, no toggle, no UI in v1 |
| **Board Note** | Shonda's retention concerns addressed via v1.1 "vindication moments" — surface value without adding UI. |

---

### Decision 11: Bug Pattern Matching

| Field | Value |
|-------|-------|
| **Proposed By** | Elon Musk |
| **Winner** | Elon Musk |
| **Final Decision** | Simple regex: `fix|bug|broken|revert` — no expansion |
| **Rationale** | Diminishing returns from complexity. Jensen called it "regex from 1968." Oprah noted English-only excludes international teams. |
| **Board Condition** | Internationalization required for v1.1 |

---

### Decision 12: Artificial Delays

| Field | Value |
|-------|-------|
| **Proposed By** | Implied by Steve's "the agent pauses, it reads, it considers" |
| **Challenged By** | Elon Musk — "that's a dark pattern" |
| **Winner** | Elon Musk |
| **Final Decision** | No artificial delays. Feature runs in ~1.5 seconds because it IS ~1.5 seconds |
| **Rationale** | "We ship fast things that are fast. Users learn to trust speed." |

---

## II. MVP Feature Set (v1.0 Ship Manifest)

### What Ships

| Component | Specification |
|-----------|---------------|
| **Core Function** | `generateHindsightReport(repoPath, outputPath?)` |
| **Git Command 1** | Recent changes: `git log --oneline -20 --max-count=1000` |
| **Git Command 2** | File churn: `git log --name-only --format= -100 --max-count=1000` |
| **Git Command 3** | Bug-associated: `git log --grep="fix\|bug\|broken\|revert" -i --name-only --format= -100 --max-count=1000` |
| **Git Command 4** | Uncommitted state: `git status --short` + `git diff --stat` |
| **Output Format** | Markdown file to `.planning/hindsight-report.md` |
| **Integration** | `generateProjectHindsight()` called in pipeline |
| **Prompt Modifiers** | `hindsightPlannerContext()`, `hindsightExecutorContext()` |
| **Risk Assessment** | `assessRisk(churnCount, bugCount)` returns LOW/MEDIUM/HIGH |
| **Summary** | <50 words synthesizing risk posture |
| **Safeguard** | `--max-count=1000` on all log commands |
| **Acknowledgment** | `"Hindsight: ${n} high-risk files identified. Proceed with awareness."` |
| **Outcome Tracking** | `trackHindsightOutcome()` logs flagged file + build failure correlation |

### What Does NOT Ship (v1.0)

| Feature | Status | Reason |
|---------|--------|--------|
| Caching/memoization | DEFERRED | Fast enough without it |
| User configuration | CUT | "Ships opinions, not options" |
| Dashboard/UI | CUT | "Invisible by design" |
| Agent Activity (shortlog) | CUT | Elon won debate |
| Risk scores/badges | CUT | "Show data, trust the agent" |
| Enforcement mechanisms | CUT | Soft guidance only |
| Vindication moments | DEFERRED to v1.1 | Board condition |
| Delta reports | DEFERRED to v1.1 | Board condition |
| i18n patterns | DEFERRED to v1.1 | Board condition |
| ML classification | DEFERRED to v2.0 | Jensen's roadmap |

---

## III. File Structure (Build Specification)

```
src/
  hindsight/
    index.ts                    # Exports + JSDoc manifesto
    hindsight.ts                # Core logic (<100 lines)
    hindsight-integration.ts    # Pipeline hooks + outcome tracking

.planning/
  hindsight-report.md           # Generated per-build (not committed)

prompts/
  planner.ts                    # Add Hindsight context block
  executor.ts                   # Add "before modifying flagged files" guidance

pipeline.ts                     # Add: await generateProjectHindsight()
```

### Code Quality Standards (Jony Ive Review)

1. **Named constants** — Extract magic numbers: `RECENT_COMMITS = 20`, `ANALYSIS_DEPTH = 100`, `CHURN_THRESHOLD = 3`
2. **Extracted risk function** — `assessRisk(churn, bugs)` as separate pure function
3. **Consistent fallbacks** — Use same semantic register ("clean"/"unchanged" or "none"/"none")
4. **Error handling** — Return `null` for git failures, not empty strings
5. **Breathing room** — Blank lines between data gathering and synthesis blocks
6. **No unused parameters** — Delete `_project` prefixed params
7. **Report hierarchy** — Risk assessment leads, timestamp becomes footnote

---

## IV. Open Questions (Requiring Resolution)

### 1. Enforcement Mechanism
**Status:** UNRESOLVED
**Problem:** Elon noted agents may ignore the report
**Options:**
- Soft: Prompt language only (current)
- Medium: Post-modification verification
- Hard: Require confirmation for flagged files
**Owner:** Technical Lead
**Timeline:** Define approach for v1.1

### 2. Threshold Definitions
**Status:** IMPLICIT
**Problem:** What constitutes "high churn" or "bug-prone"?
**Current:** Top 15 files by change frequency, files with 3+ changes
**Recommendation:** Ship with current logic, tune with data

### 3. Revenue Path
**Status:** REQUIRED (Board condition)
**Timeline:** Define within 60 days
**Buffett's Question:** "Who writes the check?"
**Options:**
- Retention feature for paid platform
- Open source for ecosystem goodwill
- Enterprise tier with configuration

### 4. Integration Location
**Status:** ASSUMED
**Problem:** Elon noted "PRD doesn't specify WHERE the planner prompt lives"
**Action:** Builder must identify exact file paths and line numbers before implementation

---

## V. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Report ignored by agent** | HIGH | HIGH | Strong prompt language; v1.1 context injection; vindication feedback |
| **No measurable impact** | HIGH | MEDIUM | Basic outcome tracking; v1.1 analytics |
| **False positives** | MEDIUM | HIGH | Keep logic simple; soft enforcement only |
| **Monorepo timeout** | MEDIUM | MEDIUM | `--max-count=1000` safeguard |
| **Token bloat** | MEDIUM | MEDIUM | Terse formatting; test with large repos |
| **Feature creep** | HIGH | MEDIUM | Point to this document; "$100 penalty" culture |
| **No competitive moat** | HIGH | HIGH | v2: cross-repo learning, feedback loops, ML |
| **English-only exclusion** | HIGH | MEDIUM | v1.1: i18n patterns |
| **v2 becomes fantasy** | MEDIUM | HIGH | Firm roadmap with dates and owners |
| **Invisible value trap** | HIGH | MEDIUM | v1.1: vindication moments, delta surfacing |

---

## VI. Board Conditions

### Mandatory for v1.0 Launch

| Condition | Source | Specification | Status |
|-----------|--------|---------------|--------|
| Acknowledgment Line | Oprah | `"Hindsight: ${n} high-risk files identified. Proceed with awareness."` | REQUIRED |
| Basic Outcome Tracking | Jensen/Buffett | Log when flagged file modified AND build fails | REQUIRED |
| Boundary Documentation | Oprah | README stating who this is for and who it isn't for | REQUIRED |

### Required for v1.1 (30 Days Post-Launch)

| Feature | Source | Specification |
|---------|--------|---------------|
| Vindication Moments | Shonda | Surface when flagged files handled successfully |
| Delta Surfacing | Shonda/Jensen | "What changed since last run" |
| Outcome Persistence | Jensen | Store warning/outcome pairs |
| i18n Patterns | Oprah | Support non-English commit conventions |

### Required for v1.2 (60 Days)

| Feature | Source | Specification |
|---------|--------|---------------|
| Revenue Path | Buffett | Document monetization strategy |
| Cross-Session Memory | Shonda | Reports reference past interactions |
| Human Annotation | Oprah | `.hindsight-context.md` for team wisdom |

### Required for v2.0 (90 Days)

| Feature | Source | Specification |
|---------|--------|---------------|
| Feedback Loop | Jensen | Track warning -> modification -> outcome -> learning |
| ML Classification | Jensen | Replace regex with semantic commit analysis |
| Risk API | Jensen | Let other tools query risk assessments |
| Cross-Project Learning | Jensen | Aggregated patterns across repos |

---

## VII. Board Scores & Key Quotes

| Reviewer | Score | Key Quote |
|----------|-------|-----------|
| **Jensen Huang** | 5/10 | "You named this thing 'Intelligence' and delivered 'Formatted Output.'" |
| **Warren Buffett** | 6/10 | "This is wonderful engineering. I'm still looking for the company." |
| **Oprah Winfrey** | 7.5/10 | "You got the hardest part right: you made something that cares." |
| **Shonda Rhimes** | 4/10 | "You've built a beautiful pilot that ends at the cold open." |

**Composite Score:** 5.6/10
**Verdict:** PROCEED with conditions

---

## VIII. Success Criteria

### v1.0 Definition of Done

- [ ] `generateHindsightReport()` exists and runs in <2 seconds
- [ ] Report generated and written to `.planning/hindsight-report.md`
- [ ] Planner prompt references report
- [ ] Executor prompt includes flagged-file guidance
- [ ] No user-facing configuration or UI
- [ ] Total implementation <100 lines core TypeScript
- [ ] Acknowledgment line on first run
- [ ] Basic outcome tracking implemented
- [ ] README documents boundaries (English commits, standard git workflows)

---

## IX. The Essence

> **What is this product REALLY about?**
> Memory for machines that would otherwise forget.

> **What's the feeling it should evoke?**
> Relief. Someone already knows where you'll trip.

> **What's the one thing that must be perfect?**
> The silence. Protection that never performs.

> **Creative direction:**
> Scars speak. Listen first.

---

## X. Retrospective Wisdom (Marcus Aurelius)

For future projects:

1. **Front-load strategic questions** — moat, revenue, compounding should be asked BEFORE creative investment
2. **Require technical validation** — a 2-hour spike before multi-day deliberation
3. **Involve creative reviewers earlier** — at outline stage, not finished artifacts
4. **v2 accountability** — every deferral needs owner, date, and kill condition
5. **Reconcile conflicting scores** — 4/10 and 8/10 on same project requires explicit resolution

**Process Score:** 7/10 — competent execution, better sequencing needed

---

## Authorization

This document consolidates locked decisions from:
- 2 rounds of debate: Steve Jobs vs. Elon Musk
- 2 creative reviews: Maya Angelou (copy), Jony Ive (design)
- 4 board reviews: Jensen Huang, Warren Buffett, Oprah Winfrey, Shonda Rhimes
- 1 retrospective: Marcus Aurelius
- 1 retention roadmap: Shonda Rhimes
- 1 demo script: Production-ready narrative

**The Build Phase Is Authorized.**

---

*"Ship the elegant ugly thing that doesn't break and doesn't announce itself. Then evolve it."*

— Phil Jackson, The Zen Master

---

**Document Version:** 3.0 — Final Build Blueprint
**Authority:** Great Minds Agency Consolidated Decision Record
