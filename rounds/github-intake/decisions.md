# Funnel: Consolidated Decisions

*Synthesized by Phil Jackson — The Zen Master*

---

## Executive Summary

Two visionaries. One product. Steve brought the soul; Elon brought the skeleton. The path forward requires both.

**Funnel** transforms GitHub issues into shipped code. It's invisible until it speaks — and when it speaks, it says one word: "Shipped."

---

## Locked Decisions

### 1. Product Name: **Funnel**

| Proposed By | Winner | Resolution |
|-------------|--------|------------|
| Steve Jobs | Steve Jobs | Elon conceded explicitly: "The name. 'Funnel' is better than 'GitHub Intake System.' I concede." |

**Why:** One word. Captures the essence. Issues pour in the top, shipped code flows out the bottom. Memorable for open-source adoption.

---

### 2. State Management: JSON File

| Proposed By | Winner | Resolution |
|-------------|--------|------------|
| Elon Musk | Elon Musk | Steve conceded explicitly: "He's right about the JSON state file... his logic is airtight." |

**Implementation:**
```json
{"owner/repo#42": "processed", "owner/repo#43": "processed"}
```

**Why:**
- 100 lines scales to 10,000 issues at ~500KB
- Any engineer can `cat` the state and understand it
- No infrastructure dependencies
- No migrations needed until success forces the issue

---

### 3. Architecture: Single Poll, Two Consumers

| Proposed By | Winner | Resolution |
|-------------|--------|------------|
| Elon Musk | Elon Musk | Steve conceded explicitly: "He's right about consolidating the poll. One poll, two consumers. Clean." |

**Implementation:**
- Consolidate `pollGitHubIssues()` (health.ts) with intake polling
- One API call cycle serves both health logging and PRD conversion

---

### 4. Interface: No Dashboard

| Proposed By | Winner | Resolution |
|-------------|--------|------------|
| Steve Jobs (articulated) | Both (consensus) | Steve: "If you're building a dashboard, you've already lost." Elon: "Don't invent new machinery." |

**Why:** GitHub IS the dashboard. Building a separate UI admits the core experience failed.

---

### 5. GitHub API: gh CLI for v1, GraphQL for v2

| Proposed By | Winner | Resolution |
|-------------|--------|------------|
| Elon Musk | Elon Musk | Steve conceded: "He's right that GraphQL is v2. The gh CLI works now." |

**Why:** Optimize later. Ship now with working tools.

---

### 6. Status Updates Back to GitHub — **THE CONTESTED DECISION**

| Proposed By | Winner | Resolution |
|-------------|--------|------------|
| Steve Jobs | **STEVE JOBS** | Phil's ruling below |

**The Debate:**
- *Elon's position:* Cut status updates from v1. Ship the core loop first. Add notifications in v1.1.
- *Steve's position:* "The comment that closes the issue IS the product. Without it, there's no user experience."

**Phil's Ruling:** Steve wins this one.

Elon optimizes for time-to-ship. Steve optimizes for user experience. Both are valid — but Elon missed something critical: **the feedback loop IS the minimum viable product.**

Without "Shipped." appearing on the GitHub issue, users can't tell if Funnel is working. They'd need to manually check commit histories, hunt for PRs, wonder if the system is alive. That's not a product — that's a mystery.

The essence document confirms this: *"What's the one thing that must be perfect? The moment of confirmation."*

**Implementation:** Status updates ship in v1. The comment is minimal: "Shipped." or "Failed: [reason]". No verbose updates. Elon's simplicity + Steve's feedback loop.

---

## MVP Feature Set (v1)

### Ships in v1

1. **github-intake.ts** (~100-150 lines)
   - Poll GitHub issues via gh CLI
   - Filter for `p0` and `p1` labels
   - Convert matching issues to PRD files
   - Write to existing PRD directory

2. **State tracking**
   - JSON file: `processed-issues.json`
   - Format: `{"owner/repo#issue": "processed"}`
   - Track processed issue numbers (not dates)

3. **Status updates back to GitHub**
   - On success: Comment "Shipped." and close issue
   - On failure: Comment "Failed: [brief reason]"
   - Minimal, confident tone

4. **Integration with existing daemon**
   - ~10 lines added to daemon.ts
   - Trigger intake on existing tick cycle
   - Let file watcher handle PRD → pipeline

5. **Configuration**
   - ~5 lines added to config.ts
   - Toggle: enable/disable intake
   - Interval: polling frequency (default 15 min)

### Cut from v1 (Elon's Recommendations, Accepted)

- Bi-directional sync (issue updates → PRD updates)
- Priority queue ordering
- Rate limit handling/retry logic
- Multi-org support
- Complex label matrix beyond p0/p1
- GraphQL optimization

---

## File Structure

```
great-minds-plugin/
├── src/
│   ├── github-intake.ts      # NEW: ~100-150 lines
│   │   ├── pollIssues()      # Fetch from configured repos
│   │   ├── filterByLabel()   # p0, p1 only
│   │   ├── convertToPRD()    # Issue → PRD format
│   │   ├── writeState()      # Update JSON tracker
│   │   └── postStatus()      # Comment back to GitHub
│   │
│   ├── daemon.ts             # MODIFY: ~10 lines
│   │   └── Add intake trigger to tick cycle
│   │
│   └── config.ts             # MODIFY: ~5 lines
│       ├── INTAKE_ENABLED    # boolean toggle
│       └── INTAKE_INTERVAL   # polling frequency
│
├── data/
│   └── processed-issues.json # NEW: state tracking
│
└── rounds/
    └── github-intake/
        └── decisions.md      # This document
```

**Total new code:** ~115-165 lines
**Modified code:** ~15 lines
**New files:** 2 (github-intake.ts, processed-issues.json)

---

## Open Questions

### 1. PRD Format Conversion
**Question:** What template should be used to convert GitHub issue body → PRD format?

**Context:** Issues may have varying structure. Need to define:
- Required fields extraction
- Default values for missing fields
- How to handle attachments/images

**Recommendation:** Start with direct pass-through of issue body as PRD content. Iterate based on pipeline feedback.

---

### 2. Failure Handling
**Question:** What happens when the pipeline fails mid-implementation?

**Elon flagged:** Claude session timeout, test failures, ambiguous issues.

**Steve's "binary" stance:** Ship or fail, nothing in between.

**Recommendation:** For v1, fail loudly. Comment "Failed: [reason]" on issue. Leave issue open. Let humans triage. Build sophistication in v1.1.

---

### 3. Label Expansion Timeline
**Question:** When do we add labels beyond p0/p1?

**Steve's concern:** Labels are the user interface. Training users on limited labels may create habits we can't undo.

**Recommendation:** Document supported labels clearly. Add labels when user feedback demands it, not before.

---

### 4. Duplicate PRD Prevention
**Question:** How do we prevent the same issue from generating multiple PRDs?

**Current approach:** JSON state tracks processed issues.

**Edge case:** What if someone re-labels an issue after it's processed?

**Recommendation:** Track by issue number. Re-labeling doesn't re-process. Manual intervention required for re-runs.

---

### 5. Which Repos to Monitor
**Question:** Does Funnel monitor all `GITHUB_REPOS` from config, or a separate list?

**Recommendation:** Use existing `GITHUB_REPOS` array. Single source of truth.

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **GitHub API rate limiting** | Low | High | Current load (6 repos × 4 polls/hr = 24 requests) is 0.5% of limit. Monitor in health.ts. |
| **gh CLI latency spikes** | Medium | Medium | 1-3 sec per call is acceptable. Log timing. Alert if >10 sec. |
| **Malformed issue bodies** | High | Low | Graceful degradation: pass through as-is, let pipeline handle parsing. |
| **State file corruption** | Low | High | JSON is human-readable. Backup on each write. Manual recovery possible. |
| **Infinite loop: issue → PRD → failure → reprocess** | Medium | High | State tracks "processed", not "succeeded". Once seen, never reprocessed automatically. |
| **Timezone bugs in date filtering** | N/A | N/A | **Mitigated by design:** Elon's recommendation to track issue numbers, not dates. |
| **Users expect real-time processing** | Medium | Medium | Document 15-minute polling interval. Set expectations. |
| **Pipeline queue backlog** | Medium | Low | Sequential processing is intentional. p0 before p1. Long queues = success. |
| **Comments feel like spam** | Medium | High | **Mitigated by design:** Steve's "Shipped." brevity. No verbose updates. |

---

## Design Principles (Synthesized)

1. **Invisible until it speaks.** No dashboards. No configuration UI. The product meets users where they are: GitHub.

2. **Inspectable when it fails.** JSON state. Simple code. Any engineer debugs in 5 minutes.

3. **Confident and quiet.** "Shipped." — one word. Trust earned through results, not announcements.

4. **Ship the 80% case.** Handle edge cases when they appear in production, not before.

5. **Don't invent new machinery.** Leverage existing daemon, file watcher, pipeline. One new file does the new work.

---

## Attribution

- **Steve Jobs:** Product vision, naming ("Funnel"), emotional hook, brand voice, feedback loop insistence
- **Elon Musk:** Architecture, JSON state, performance analysis, scope cutting, implementation path
- **Phil Jackson:** Synthesis, contested decision on status updates, risk register, final blueprint

---

*The triangle offense works because every player knows their role. Steve paints the vision. Elon ships the version that works. Together, we iterate toward magic.*

**Status:** Ready for build phase.
