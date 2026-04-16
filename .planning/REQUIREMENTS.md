# Requirements Traceability — Blog GSD Pipeline Evolution

**Project:** blog-gsd-pipeline-evolution
**Generated:** 2026-04-16
**Phase:** 1 (Writing & Publishing)
**Source Documents:**
- PRD: `/prds/blog-gsd-pipeline-evolution.md`
- Decisions: `/rounds/blog-gsd-pipeline-evolution/decisions.md`

---

## Atomic Requirements

### Content Requirements

**R1** | Cover the evolution story from cron scripts to tmux dispatch to Agent SDK daemon to systemd service
**Source:** PRD line 11
**Verification:** Blog post includes chronological narrative with all four phases

**R2** | Document the tmux failure: explain why "tmux send-keys doesn't work"
**Source:** PRD line 12
**Verification:** Post includes specific technical explanation of tmux failure mode

**R3** | Document OOM kills from parallel agents as a specific failure mode
**Source:** PRD line 12
**Verification:** Post includes OOM kill description with context

**R4** | Document the "dead code in gitAutoCommit" failure and lessons learned
**Source:** PRD line 12
**Verification:** Post includes gitAutoCommit failure and lesson

**R5** | Document the "wrong PRD directory" failure and lessons learned
**Source:** PRD line 12
**Verification:** Post includes PRD directory failure and lesson

**R6** | Show current architecture including: systemd service, chokidar file watcher, Pipeline phases, retry + timeout protection
**Source:** PRD line 13
**Verification:** Post describes all four architectural components

**R7** | Include the "48 restarts" story as central narrative element
**Source:** PRD line 14, Decision 2 lines 37-44
**Verification:** 48 restarts mentioned in opening paragraph (first 100 words)

**R8** | Explain how swap + batching solved the 48 restarts problem
**Source:** PRD line 14
**Verification:** Post includes swap/batching solution explanation

**R9** | End with the current state: fully autonomous, self-healing, auto-queuing from GitHub issues
**Source:** PRD line 15
**Verification:** Conclusion describes current autonomous capabilities

**R10** | Include specific stack traces and error logs from failures
**Source:** Decision 7 line 130
**Verification:** Post includes at least 2 concrete error examples

**R11** | Include code snippets from daemon.ts and pipeline.ts
**Source:** Decision MVP Feature Set line 190
**Verification:** Post includes relevant code snippets from both files

**R12** | Document the 48 restarts in the opening paragraph before any architecture discussion
**Source:** Decision 2 line 44
**Verification:** Opening 100 words mention 48 restarts before technical details

**R13** | Lead with failure/48 restarts in the first 100 words
**Source:** Decision 2 line 44
**Verification:** Word count check: 48 restarts in first 100 words

**R14** | Follow chronological narrative structure: tmux phase → failure cascade (48 restarts, OOM kills) → systemd solution
**Source:** Decision 3 lines 59-62
**Verification:** Three-part structure evident in section headings

**R15** | Show real failure data and stack traces, not happy-path narratives
**Source:** Decision 7 lines 130-131
**Verification:** Post includes actual error messages, not just descriptions

---

### Structural Requirements

**S1** | Blog post format must match existing Great Minds website blog format
**Source:** PRD Success Criteria line 27
**Verification:** Markdown structure matches blog-board-reviews-lessons pattern

**S2** | Chronological narrative structure, not emotional arc storytelling
**Source:** Decision 3 lines 48-62
**Verification:** Timeline-based progression, not hero's journey

**S3** | Three-part body structure: tmux attempt → failure cascade → systemd solution
**Source:** Decision 3 lines 59-62
**Verification:** Clear three-section body with headers

**S4** | Opening hook must mention 48 restarts/deaths/resurrections before architecture discussion
**Source:** Decision 2 line 44
**Verification:** First paragraph ends before technical architecture begins

**S5** | Text-only format - NO diagrams or visualizations
**Source:** Decision 6 lines 106-114
**Verification:** No image files, no diagram references

**S6** | NO comparisons to other systems (Airflow, Temporal, etc.)
**Source:** Decision MVP Feature Set line 195
**Verification:** Grep for competitor names returns no matches

**S7** | NO comprehensive technical architecture documentation
**Source:** Decision MVP Feature Set line 196
**Verification:** Focus on evolution story, not API reference

**S8** | NO paid advertising campaign content
**Source:** Decision 10 lines 169-176
**Verification:** No ad copy, no promotional CTAs

**S9** | Story length should be dictated by narrative completeness, not arbitrary word count targets
**Source:** Decision 9 lines 151-161
**Verification:** Story feels complete, not padded or truncated

**S10** | Include title with "Phoenix" framing or "Building a System That Won't Stay Dead" equivalent
**Source:** Decision 1 line 29
**Verification:** Title includes Phoenix metaphor

---

### Voice & Tone Requirements

**V1** | Engineering narrative tone showing the messy reality of building autonomous systems
**Source:** PRD line 16
**Verification:** Tone matches battle-scarred engineering voice

**V2** | Battle-scarred honesty - war stories, not marketing copy
**Source:** Decision 7 lines 122-132
**Verification:** No buzzwords, no sanitized narratives

**V3** | Show stack traces, error logs, and real failure data
**Source:** Decision 7 line 130
**Verification:** At least 2 actual error messages included

**V4** | Use phrase "Here's what broke, here's what we built, here's what works now" as structural anchor
**Source:** Decision 7 line 132
**Verification:** This framing evident in narrative flow

**V5** | NO buzzwords or corporate jargon like "leveraging synergies"
**Source:** Decision 7 line 131
**Verification:** Grep for corporate jargon returns no matches

**V6** | Ruthlessly cut jargon that doesn't contribute to reader understanding
**Source:** Decision 8 lines 140-147
**Verification:** Technical terms are explained or omitted

**V7** | Explain technical details in human terms (e.g., explain why "watchdog timeout" matters: "so a stuck agent can't freeze the entire pipeline")
**Source:** Decision 8 line 144
**Verification:** Every technical term has human-readable explanation

**V8** | Technical details should serve narrative purpose, not exist for completeness
**Source:** Decision 8 line 145
**Verification:** No extraneous technical details

**V9** | Match existing Great Minds voice constraints from DO-NOT-REPEAT.md and BANNED-PATTERNS.md
**Source:** Decision 7 line 125
**Verification:** No patterns from banned lists appear in post

**V10** | "If you say 'watchdog timeout,' you better explain why it matters in human terms" - every technical term must be justified
**Source:** Decision 8 line 144
**Verification:** All technical terms have context/justification

---

### Technical Requirements

**T1** | Check local availability of daemon.ts and pipeline.ts before SSH
**Source:** Decision 5 lines 92-95
**Verification:** Files exist locally (already verified)

**T2** | Read daemon.ts for evolution context
**Source:** PRD line 20, Decision 5 lines 92-95
**Verification:** daemon.ts content informs blog post

**T3** | Read pipeline.ts for reliability patterns
**Source:** PRD line 21, Decision 5 lines 92-95
**Verification:** pipeline.ts patterns documented in post

**T4** | Read DO-NOT-REPEAT.md for voice constraints
**Source:** PRD line 22, Decision 5 line 96
**Verification:** Voice matches constraints file

**T5** | Read BANNED-PATTERNS.md for style guide prohibitions
**Source:** PRD line 22, Decision 5 line 96
**Verification:** No banned patterns in post

**T6** | Write blog post to deliverables/blog-gsd-pipeline-evolution/ directory
**Source:** PRD line 24, Great Minds convention
**Verification:** File created in correct location

**T7** | Blog post filename: phoenix-post.md or equivalent
**Source:** Decision file structure section
**Verification:** File created with appropriate name

**T8** | Execution must complete in ≤30 minutes of agent time
**Source:** Decision 4 lines 66-77
**Verification:** Total execution time logged and verified

**T9** | No code refactoring or improvements to daemon.ts during documentation phase
**Source:** Decision MVP Feature Set line 199
**Verification:** daemon.ts unchanged from start to finish

**T10** | Time allocation: 5 min framing + 15 min writing + 5 min editing = 25 minutes
**Source:** Decision 4 line 73
**Verification:** Phase timestamps align with allocation

---

## Requirements Summary

- **Total Requirements:** 44
  - Content: 15 (R1-R15)
  - Structural: 10 (S1-S10)
  - Voice/Tone: 10 (V1-V10)
  - Technical: 10 (T1-T10)

- **Critical Path Requirements:** R7, R13, R14, S4, V3, T8
- **Verification Method:** Manual review + automated checks (grep for banned patterns, word count, file existence)

---

## Success Criteria (from decisions.md)

### Shipping Success
- [ ] Blog post published in ≤30 minutes agent time (T8)
- [ ] No code refactoring occurred during documentation (T9)
- [ ] Post includes concrete stack traces/error examples (R10, V3)
- [ ] Opening 100 words mention "48 restarts" or equivalent failure metric (R7, R13)

### Reader Success (Post-Launch Metrics)
- [ ] HackerNews/Reddit engagement (upvotes, comments, shares)
- [ ] "This is real" sentiment in comments vs "this is marketing"
- [ ] Readers quote specific failure details (not just "cool architecture")
- [ ] Blog drives traffic to Great Minds main site

### Steve's Test
*"If someone reads this and thinks 'cool pipeline,' we failed. If they think 'I want to build something that resilient,' we won."*

### Elon's Test
*"If this takes more than 1 hour of wall-clock time, something went wrong."*

---

## Non-Negotiables (Final Synthesis)

### From Steve Jobs
1. **Name is Phoenix** — not "pipeline evolution," not "infrastructure update" (S10)
2. **Lead with 48 restarts** — failure in first 100 words or lose readers (R7, R13, S4)
3. **Battle-scarred honesty** — war stories, stack traces, real mess (V2, V3)

### From Elon Musk
1. **One session, 25-30 min max** — if process takes longer, it's broken (T8)
2. **Chronological narrative** — timeline IS structure, no emotional arc engineering (S2, S3)
3. **No SSH (files are local)** — eliminate unnecessary latency/failure points (T1)

### Shared Agreement
1. **No refactoring while documenting** — journalist mode, not surgeon mode (T9)
2. **Ruthlessly cut jargon** — explain in human terms or delete (V6, V7)
3. **Story dictates length** — no arbitrary word count targets (S9)
4. **Ship fast, iterate never** — this is v1 and final unless traffic demands update

---

*This requirements document provides the atomic specifications and verification criteria for the blog-gsd-pipeline-evolution project. Each requirement is traceable to source documents and includes specific verification methods.*
