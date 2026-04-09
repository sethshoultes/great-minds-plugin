# Great Minds — Learnings & Patterns

Hard-won lessons from building and operating the Great Minds multi-agent pipeline. These apply to anyone building autonomous AI systems.

---

## 1. Agents Hallucinate APIs

The single biggest failure. Agents wrote 3,600 lines of Emdash plugin code against an API that doesn't exist. They generated plausible-looking code from training data instead of reading the actual source.

**Fix:** Mandatory doc-reading in pipeline prompts. Builder agents must read `docs/` and `CLAUDE.md` before writing code. A `BANNED-PATTERNS.md` file lists known-bad patterns that auto-fail QA.

**Takeaway:** Never trust model memory for API surfaces. Always verify against actual docs or source code.

---

## 2. Code Review Alone Is Not QA

QA was reviewing code but never deploying it. Broken code passed QA because nobody tested it against a running system. The admin UI returned valid JSON via curl but crashed in the browser — and nobody checked the browser.

**Fix:** QA must deploy to a live test site, curl every endpoint, screenshot the UI with Playwright, and check browser console for errors. Code review without execution is theatre.

**Takeaway:** If you didn't run it, you didn't test it.

---

## 3. The Pipeline Is the Product

The daemon, the prompts, the banned patterns list, the anti-hallucination rules — that's the real value. Individual builds come and go. Every pipeline improvement compounds across all future builds.

**Fix:** Invest in pipeline infrastructure: smoke tests, banned pattern checks, doc-reading enforcement, auto-merge after ship, git intelligence pre-build.

**Takeaway:** Don't just build products. Build the system that builds products.

---

## 4. Autonomous Doesn't Mean Unsupervised

The daemon ran for hours building broken plugins, wasting tokens, restarting failed PRDs. Nobody was checking. Auth expired silently. Agents hung for 10 minutes before timeout.

**Fix:** Telegram notifications for every phase transition. Babysitter cron that refreshes auth. Hung agent detection with configurable timeouts. Failed PRDs archived (not retried infinitely).

**Takeaway:** Autonomous systems need monitoring, alerting, and circuit breakers. Build them before you need them.

---

## 5. Separate Concerns, Separate Daemons

Running two daemons on one server caused them to kill each other. `pkill` commands were too broad. Plugin updates on the DO server conflicted with Shipyard builds.

**Fix:** One daemon per repo. Shipyard builds on the DO server. Plugin updates build locally. Great Minds builds locally. Never mix.

**Takeaway:** Isolation isn't just for code — it's for processes too.

---

## 6. PRDs Beat Ad-Hoc Work

Every time someone tried to "just quickly fix" something manually, it spiraled into hours of debugging. Every time a proper PRD went through the pipeline, it shipped.

**Fix:** Hard rule — if it involves code in a pipeline repo, write a PRD and deploy it. No exceptions except daemon infrastructure.

**Takeaway:** The overhead of writing a PRD pays for itself in consistency, accountability, and reproducibility.

---

## 7. Git History Is Intelligence

Running git diagnostics before touching code reveals where the risk is. Churn hotspots, bug clustering, contributor distribution — all available in seconds from git history.

**Fix:** Added git-intelligence pre-build step to the pipeline. Planner reads the risk report before creating the task plan.

**Takeaway:** Don't start coding blind. The repo already knows where the problems are.

---

## 8. Documentation Prevents Hallucination

The moment `EMDASH-GUIDE.md` was written (by reading actual source code) and made mandatory reading in `CLAUDE.md`, build quality improved immediately.

**Fix:** For any framework or API the agents will use, write a verified guide and add it to the repo's `docs/` directory. Reference it in `CLAUDE.md` as mandatory reading.

**Takeaway:** If you want agents to use the right API, give them the docs and make reading them non-optional.

---

## 9. Banned Patterns > Code Review

A simple grep for known-bad patterns catches more bugs than a full code review. 114 `throw new Response()` calls could have been caught in 1 second with `grep -rn "throw new Response" plugins/`.

**Fix:** `BANNED-PATTERNS.md` lists patterns that auto-fail QA. QA runs the grep before doing any code review.

**Takeaway:** Automate the obvious checks. Save human/AI review for judgment calls.

---

## 10. Start Minimal, Verify, Then Expand

The 130-line EventDash rewrite works. The 3,600-line original didn't. The minimal version was written after reading the actual Emdash docs. The original was written from hallucinated memory.

**Fix:** Build the smallest thing that could work. Deploy it. Curl it. Screenshot it. Then add features one at a time, verifying each.

**Takeaway:** Working > complete. Always.

---

## 11. Hardcoded Paths Kill Portability

14 files had `/Users/sethshoultes/` hardcoded. Worked on one machine, broke on the DO server, would break for any contributor.

**Fix:** Use `${PIPELINE_REPO}`, `${HOME}`, or auto-detection. Added to `BANNED-PATTERNS.md` and `DO-NOT-REPEAT.md`.

**Takeaway:** If a path starts with `/Users/` or `/home/`, it's a bug.

---

## 12. Auth Expires Silently

Claude OAuth tokens expire. The daemon kept building with 401 errors, producing no output. Hours wasted before anyone noticed.

**Fix:** Auth detection in pipeline — checks for "401" or "authentication_error" in results and stops immediately. Babysitter cron refreshes auth every 15 minutes.

**Takeaway:** External auth is a runtime dependency. Monitor it like you'd monitor a database connection.

---

## Anti-Patterns (DO NOT REPEAT)

See `DO-NOT-REPEAT.md` for the full list. Key items:
- `grep -oP` on macOS (Linux-only)
- `tmux send-keys` to Claude Code (input buffer rejects it)
- `claude -p` for multi-step work (drops steps)
- Hardcoded paths
- `throw new Response()` in Emdash plugins
- `rc.user`, `rc.pathParams`, `process.env` in sandbox plugins
- Skipping QA or taking shortcuts under pressure

---

*Last updated: April 9, 2026*
