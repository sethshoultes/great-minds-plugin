# GitSense — Locked Decisions

*Consolidated by Phil Jackson, The Zen Master*

---

## Decision Log

### 1. Product Name: **GitSense**

| Proposed By | Steve Jobs |
|-------------|------------|
| Winner | Steve Jobs |
| Why | Elon conceded: "GitSense is a fine name... shorter and cleaner." One word, evocative, captures the essence of giving agents a sixth sense about repository history. Names shape expectations. |

**LOCKED: GitSense**

---

### 2. Risk Summary Format

| Proposed By | Steve (LLM-generated 1-3 sentences) vs Elon (string template) |
|-------------|------------|
| Winner | Elon Musk |
| Why | Steve's LLM summary adds 200ms+ latency and API cost to every pipeline run. Elon's template approach (`"${hotspotCount} hotspots, ${revertCount} reverts, ${highChurnFiles} high-churn files"`) costs zero, ships faster, and carries no hallucination risk. Agents need parseable data, not prose. |

**LOCKED: Template-based summary. No LLM calls.**

---

### 3. Agent Activity Section (shortlog)

| Proposed By | Steve (keep it) vs Elon (cut it) |
|-------------|------------|
| Winner | Elon Musk |
| Why | Steve argued bus factor signals "concentrated, undocumented knowledge." Elon countered: "The agent doesn't care who wrote the code — it cares what the code does and how often it breaks." For an AI agent, contributor identity is noise. The feature serves human managers, not agent workflows. |

**LOCKED: No shortlog. 4 git commands, not 5.**

---

### 4. Configuration Options

| Proposed By | Elon (add hotspot_threshold) vs Steve (zero config) |
|-------------|------------|
| Winner | Steve Jobs (for v1) |
| Why | Elon conceded: "Zero configuration for v1 is correct... Ship the defaults. Add the escape hatch in v1.1 when someone complains." Every option is cognitive load. Leadership means shipping the right answer, not abdicating to a config file. |

**LOCKED: Zero configuration in v1. Revisit if complaints arise.**

---

### 5. Timeout & Graceful Degradation

| Proposed By | Elon Musk |
|-------------|------------|
| Winner | Elon Musk |
| Why | Steve conceded: "The timeout for large repos is smart... A monorepo with 10M commits shouldn't block the pipeline. Fail gracefully, continue working. That's good design." |

**LOCKED: 10-second timeout per command. On timeout, report "analysis incomplete — repo too large" and continue pipeline.**

---

### 6. Architecture

| Proposed By | Elon Musk |
|-------------|------------|
| Winner | Elon Musk |
| Why | Steve conceded: "One function, ~150 lines. He's right about the architecture. No abstractions. No service layer. Inline it, run it, move on." Premature extraction is procrastination. |

**LOCKED: Single inline function. No service layer. No GitSense module extraction.**

---

## MVP Feature Set (v1)

### Ships

1. **4 Git Commands**
   - `git log --since="90 days ago" --format="%H"` — commit count
   - `git log --since="90 days ago" --name-only --format=""` — file change frequency (hotspots)
   - `git log --since="90 days ago" --oneline --grep="revert"` — revert detection
   - `git log --since="90 days ago" --format="" --name-only --diff-filter=M` — churn analysis

2. **Stdout Parsing** — Simple regex, no external dependencies

3. **Template-Based Summary** — Zero API calls, deterministic output

4. **Timeout Protection** — 10s max per command, graceful degradation

5. **Single Markdown Output** — `.planning/git-intelligence.md`

6. **Pipeline Injection** — Runs once before agent task begins

### Does NOT Ship

- ~~LLM-generated Risk Summary~~ (cut)
- ~~Agent Activity / shortlog~~ (cut)
- ~~Configuration options~~ (deferred to v1.1)
- ~~Visualizations or charts~~ (rejected)
- ~~Trend analysis~~ (v2)
- ~~Cross-referencing hotspots with bug files~~ (v2)
- ~~CI/CD log integration~~ (rejected)
- ~~Caching or incremental updates~~ (rejected)

---

## File Structure

```
daemon/src/pipeline.ts          # Injection point (modify, DO NOT rewrite)
.planning/git-intelligence.md   # Output file (created per-run)
```

**Implementation Details:**
- ~100 lines of code total
- Inline within pipeline.ts at the appropriate injection point
- No new files created for the feature itself
- Output goes to `.planning/` directory, read by agent before task execution

---

## Open Questions

| # | Question | Owner | Blocker? |
|---|----------|-------|----------|
| 1 | What is the exact injection point in pipeline.ts? PRD warns "DO NOT rewrite" — suggests past trauma. Need careful analysis. | Build Agent | Yes |
| 2 | What thresholds define "hotspot"? (e.g., 10+ changes in 90 days?) | Build Agent | No — use sensible defaults, observe |
| 3 | Should output filename be `git-intelligence.md` or `gitsense.md`? | Steve/Elon | No |
| 4 | Does `.planning/` directory exist or need creation? | Build Agent | No |
| 5 | How does agent prompt reference the intelligence file? Needs prompt update. | Build Agent | Yes |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **pipeline.ts integration breaks existing functionality** | Medium | High | Read pipeline.ts thoroughly before modification. Test on actual repo. Keep changes minimal. |
| **Large monorepos timeout on all commands** | Low | Medium | Graceful degradation already designed. Report shows "analysis incomplete" and pipeline continues. |
| **Hardcoded thresholds trigger false positives on high-velocity repos** | Medium | Low | Accept for v1. Add config escape hatch in v1.1 if complaints arise. |
| **Git not available in execution environment** | Low | High | Check for git availability. Fail gracefully with "git not found" message. |
| **Output directory `.planning/` doesn't exist** | Low | Low | Create directory if it doesn't exist before writing file. |
| **Agent ignores the intelligence file** | Medium | High | Prompt engineering required. Explicit instruction to read `.planning/git-intelligence.md` before acting. |

---

## Build Mandate

**Estimated Effort:** 3 hours (one agent session)

**Success Criteria:**
1. Pipeline runs GitSense before agent task begins
2. Output appears at `.planning/git-intelligence.md`
3. Agent reads and acknowledges the report
4. No pipeline failures introduced
5. Timeout handles large repos gracefully

**The Essence:**
> *Wisdom, not intelligence. The agent pauses, reads history, and knows.*

---

*"The strength of the team is each individual member. The strength of each member is the team." — Phil Jackson*

*Steve brought the vision. Elon brought the scalpel. Now we build.*
