# Great Minds Agency — Scoreboard

**Last Updated:** 2026-04-13
**Updated By:** Phil Jackson (orchestrator)

---

## Cumulative Statistics

| Metric | Count |
|--------|-------|
| Projects Shipped | 16 |
| Total Commits | 249+ |
| PRs Merged | 26+ |
| Source files (LocalGenius) | 270+ |
| Source files (GM Website) | 35+ |
| Source files (Plugin) | 50+ |
| Test specs (LocalGenius) | 770+ |
| Test specs (Sites) | 83 |
| GitHub repos | 3 (localgenius, great-minds, great-minds-plugin) |
| Archived repos | 2 (localgenius-sites, greatminds-website) |
| Live deployments | 2 (localgenius.company, greatminds.company) |
| Agent personas | 14 + 2 internal consolidation functions |
| Jensen board reviews | 22 |
| Margaret QA reports | 80+ |
| Workshop video | Rendered (2 MP4s) |
| Blog posts | 6 |
| VPS | DigitalOcean droplet (164.90.151.82) — 8GB/4vCPU |
| Shipyard AI | New company on DO — website, pipeline, credit system |
| GSD integration | 3 skills + context-guard hook in plugin |
| Marcus retrospectives | 14 |
| Debate Rounds | 6 |
| Board Reviews | 5 |
| Creative Reviews | 2 |

---

## Projects Completed

| Project | Date | Key Deliverables | Retrospective |
|---------|------|-----------------|---------------|
| daemon-fixes | 2026-04-13 | Auto-commit wiring, GitHub label query fix, daemon stability | memory/daemon-fixes-retrospective.md |
| agentlog | 2026-04-13 | Consolidation ship: metrics formalization, scoreboard updates, process tracking | memory/agentlog-retrospective.md |
| membership-fix | 2026-04-12 | MemberShip plugin pattern fixes: 228 violations corrected, 3 files | memory/membership-fix-retrospective.md |
| finish-plugins | 2026-04-12 | Consolidation ship: 4 files, 2 PRDs, status/scoreboard updates | memory/finish-plugins-retrospective.md |
| agentbench | 2026-04-12 | Ship report, retrospective, process adherence | memory/agentbench-retrospective.md |
| project-audit | 2026-04-09 | Templates cleanup, daemon migration docs, AGENTS.md runtime update | memory/project-audit-retrospective.md |
| emdash-marketplace | 2026-04-09 | Document transformation CLI, 5 design themes, dialectic process, board review | memory/emdash-marketplace-retrospective.md |
| systemd-daemon | 2026-04-09 | tmux→systemd migration, archived launch.sh, updated AGENTS.md runtime docs | memory/systemd-daemon-retrospective.md |
| readme-update | 2026-04-09 | README overhaul, 14 agents documented, 17 skills, daemon architecture, honest constraints | memory/readme-update-retrospective.md |
| workshop-tutorial | 2026-04-09 | Ship pipeline tutorial, process demonstration | N/A |
| Pulse (localgenius-benchmark-engine) | 2026-04-09 | 4,447 LOC benchmarking system, clean architecture | N/A |
| Hindsight (git-intelligence) | 2026-04-09 | 93-line core, mentor voice, zero config | N/A |
| plugin-audit | 2026-04-08 | Remove hardcoded paths, fix daemon deps, update docs | memory/plugin-audit-retrospective.md |
| promptops | 2026-04-11 | Daemon v2.0, PID lockfile, queue persistence, deterministic ops | memory/promptops-retrospective.md |
| finish-plugins | 2026-04-11 | Consolidation ship: 32 files, 2,842 lines, daemon v2.0, debate artifacts | memory/finish-plugins-retrospective.md |
| anti-hallucination | 2026-04-07 | BANNED-PATTERNS, DO-NOT-REPEAT, doc reading enforcement | memory/anti-hallucination-retrospective.md |

---

## Marcus Aurelius Retrospectives

| Project | Date | Key Principle | Location |
|---------|------|--------------|----------|
| daemon-fixes | 2026-04-13 | A plan is not a fix. A fix is not shipped. | memory/daemon-fixes-retrospective.md |
| agentlog | 2026-04-13 | What you measure is what you become | memory/agentlog-retrospective.md |
| membership-fix | 2026-04-12 | Systematic passes beat incremental fixes | memory/membership-fix-retrospective.md |
| agentbench | 2026-04-12 | Small discipline is not small | memory/agentbench-retrospective.md |
| project-audit | 2026-04-09 | Maintenance is infrastructure, not overhead | memory/project-audit-retrospective.md |
| anti-hallucination | 2026-04-08 | Systems beat willpower | memory/anti-hallucination-retrospective.md |
| plugin-audit | 2026-04-09 | Path references are infrastructure decisions | memory/plugin-audit-retrospective.md |
| readme-update | 2026-04-09 | Comprehensibility before completeness | memory/readme-update-retrospective.md |
| systemd-daemon | 2026-04-09 | Visibility beats elegance | memory/systemd-daemon-retrospective.md |
| emdash-marketplace | 2026-04-09 | Discovery is architecture, not marketing | memory/emdash-marketplace-retrospective.md |
| promptops | 2026-04-11 | Trust bash, not instructions | memory/promptops-retrospective.md |
| finish-plugins | 2026-04-11 | Infrastructure enables velocity | memory/finish-plugins-retrospective.md |
| finish-plugins | 2026-04-12 | Clean the metadata before declaring victory | memory/finish-plugins-retrospective.md |

**Score: 11 retrospectives, 11 principles extracted**

---

## Project Metrics (promptops)

| Metric | Value |
|--------|-------|
| Tasks Completed | 4/4 |
| Files Changed | 4 |
| Risk Mitigations | 4 (PID lockfile, queue persistence, abort flag, strict parsing) |
| Process Score | 8/10 (Marcus Aurelius) |
| Ship Report | deliverables/promptops/ship-report.md |
| Retrospective | memory/promptops-retrospective.md |
| Key Principle | Trust bash, not instructions |

---

## Pipeline Summary (promptops)

| Phase | Status | Date |
|-------|--------|------|
| Execute | Complete | 2026-04-11 |
| Verify | Complete (manual) | 2026-04-11 |
| Ship | Complete | 2026-04-11 |

---

## Key Decisions Made (promptops)

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Deterministic git operations | `execSync('git add -A')` always works; agent prompts sometimes don't |
| 2 | Defense in depth | Multiple layers (PID, queue, abort, parsing) each catch what previous missed |
| 3 | Strict verdict parsing | Require `## Verdict: PASS/BLOCK` format to eliminate ambiguity |
| 4 | Minimal scope | Four files changed, no new dependencies |

---

## promptops Learnings

### Key Principle: Trust Bash, Not Instructions
When an operation must happen, make it happen with code. Agent prompts are requests; shell commands are demands.

### What Worked
1. **Deterministic operations beat agent instructions** — bash commands execute reliably
2. **Defense in depth** — PID lockfiles prevent duplicate daemons, queue persistence survives crashes
3. **Strict verdict parsing** — explicit format eliminates ambiguous results
4. **Small surface area** — four files, no new dependencies, robust without complexity

### What to Improve
1. No formal test suite for daemon behavior
2. Documentation lag (changes not yet reflected in README)
3. Testing in production (no staging environment for daemon)

### Key Quote
> "The impediment to action advances action. What stands in the way becomes the way." — Marcus Aurelius retrospective

---

## Agent Participation (git-intelligence)

| Agent | Role | Contributions |
|-------|------|---------------|
| **Steve Jobs** | Creative Director | 2 debate rounds, won name + file artifact + voice decisions |
| **Elon Musk** | Technical Director | 2 debate rounds, won architecture + performance decisions |
| **Rick Rubin** | Essence Distillation | 1 essence document |
| **Maya Angelou** | Copy Review | 1 review, closing line |
| **Jony Ive** | Design Review | 1 review, 9 specific improvements |
| **Jensen Huang** | Board Review | 5/10, pushed for AI leverage |
| **Warren Buffett** | Board Review | 6/10, revenue path mandate |
| **Oprah Winfrey** | Board Review | 7.5/10, i18n advocacy |
| **Shonda Rhimes** | Board Review | 4/10, retention roadmap |
| **Marcus Aurelius** | Retrospective | Process review, 7/10 process score |
| **Phil Jackson** | Orchestrator | Pipeline coordination |

---

## Quality Gate Results (git-intelligence)

| Gate | Result | Details |
|------|--------|---------|
| **Jony Ive Design Review** | PASS with notes | 9 improvements suggested, 2 minor implemented |
| **Maya Angelou Copy Review** | PASS | Closing line adopted verbatim |
| **Board Verdict** | PROCEED | Unanimous with conditions |
| **Verification** | PASS | 10/10 criteria, 0 banned patterns |

---

## Board Verdict Summary (git-intelligence)

**Composite Score:** 5.6/10

| Reviewer | Score | Key Quote |
|----------|-------|-----------|
| Oprah Winfrey | 7.5/10 | "You got the hardest part right: you made something that cares." |
| Warren Buffett | 6/10 | "This is wonderful engineering. I'm still looking for the company." |
| Jensen Huang | 5/10 | "You named this thing 'Intelligence' and delivered 'Formatted Output.'" |
| Shonda Rhimes | 4/10 | "You've built a beautiful pilot that ends at the cold open." |

**Points of Agreement:**
- Technical execution is sound
- Mentor voice is correct
- Board conditions were met
- Capital efficiency is exemplary
- No competitive moat exists
- English-only limitation is a problem

---

## Essence Archive

### Hindsight (git-intelligence)

> **What is this product REALLY about?**
> Memory for machines that would otherwise forget.

> **What's the feeling it should evoke?**
> Relief. Someone already knows where you'll trip.

> **What's the one thing that must be perfect?**
> The silence. Protection that never performs.

> **Creative direction:**
> Scars speak. Listen first.

---

## Key Decisions Made (git-intelligence)

| # | Decision | Winner | Key Quote |
|---|----------|--------|-----------|
| 1 | Product name | Steve Jobs | "Names outlast code." |
| 2 | File artifact vs. injection | Steve Jobs | "A markdown file is a thinking artifact." |
| 3 | Agent activity | Elon Musk (CUT) | "Churn data captures this without parsing names." |
| 4 | Zero configuration | Consensus | "If you need to configure it, we've already failed." |
| 5 | <100 line architecture | Elon Musk | "A 50-line script is easier to debug, extend, and kill." |
| 6 | Mentor voice | Steve Jobs | "'Tread carefully' not 'WARNING: DANGER.'" |
| 7 | Parallel git execution | Elon Musk | "5x improvement via Promise.all()." |
| 8 | No numeric risk scores | Consensus | "Risk scores are intellectual cowardice." |
| 9 | No LLM summaries | Elon Musk | "LLMs summarizing for LLMs wastes tokens." |
| 10 | No caching v1 | Consensus | "Don't optimize what doesn't hurt." |

---

## Upcoming Milestones

| Milestone | Due Date | Owner |
|-----------|----------|-------|
| v1.1 Vindication Moments | May 9, 2026 | TBD |
| v1.1 Outcome Persistence | May 9, 2026 | TBD |
| v1.1 Delta Surfacing | May 9, 2026 | TBD |
| v1.1 i18n Patterns | May 9, 2026 | TBD |
| Revenue Path Decision | June 8, 2026 | Leadership |
| v2.0 Decision Point | July 8, 2026 | Board |

---

## Process Learnings (from Marcus Aurelius)

### What Worked
1. Debate process revealed truth through opposition
2. Multi-lens review caught what single reviewers would miss
3. Scope discipline was maintained
4. Essence document anchored everything
5. Capital efficiency was exemplary

### What to Improve
1. Front-load strategic questions before creative investment
2. Require technical spike before multi-day deliberation
3. Involve creative reviewers at outline stage
4. Assign owners and dates to every deferral
5. Reconcile divergent scores before declaring verdict

**Process Score:** 7/10

---

## Agent Participation (emdash-marketplace / Wardrobe)

| Agent | Role | Contributions |
|-------|------|---------------|
| **Steve Jobs** | Creative Director | Won naming "Wardrobe," five themes, transformation language |
| **Elon Musk** | Technical Director | Won no live preview, static infrastructure, <3s install |
| **Maya Angelou** | Copy Review | 3 key lines rewritten, established voice |
| **Warren Buffett** | Board Review | 5/10, "Feature masquerading as business" |
| **Oprah Winfrey** | Board Review | 7.5/10, trust signals advocacy |
| **Shonda Rhimes** | Board Review | 4/10, 8-page retention roadmap |
| **Jensen Huang** | Board Review | Platform architecture concerns |
| **Marcus Aurelius** | Retrospective | 6/10 process score, 403-line retrospective |
| **Phil Jackson** | Orchestrator | 370-line decisions document |

---

## Quality Gate Results (emdash-marketplace)

| Gate | Result | Details |
|------|--------|---------|
| **Maya Angelou Copy Review** | PASS | 3 lines rewritten, voice established |
| **Board Verdict** | HOLD | Discovery/retention/monetization gaps |
| **Dialectic Synthesis** | PASS | Steve vs Elon produced genuine synthesis |

---

## Board Verdict Summary (emdash-marketplace)

**Composite Score:** 5.4/10

| Reviewer | Score | Key Quote |
|----------|-------|-----------|
| Warren Buffett | 5/10 | "You built a feature masquerading as a business." |
| Shonda Rhimes | 4/10 | "No retention mechanics = no engagement." |
| Oprah Winfrey | 7.5/10 | "Trust signals present, but transformation proof missing." |

**Verdict**: HOLD — awaiting discovery, retention, and monetization work.

---

## Key Decisions Made (emdash-marketplace)

| # | Decision | Winner | Key Quote |
|---|----------|--------|-----------|
| 1 | Product name "Wardrobe" | Steve Jobs | "Names outlast code." |
| 2 | Five themes vs three | Steve Jobs | "Emotional range worth the engineering." |
| 3 | No live preview | Elon Musk | "30 days engineering for zero users." |
| 4 | Static infrastructure | Elon Musk | "CLI-first, R2 distribution, no ops." |
| 5 | Transformation copy | Steve Jobs | "Your site is now wearing Ember." |
| 6 | <3 second install | Consensus | "If it's slow, we've failed." |

---

## Emdash Marketplace (Wardrobe) Learnings

### Key Principle: Discovery is Architecture, Not Marketing
If users can't find your product, the product doesn't exist. Discovery is as important as the CLI itself.

### What Worked
1. **Dialectic produced synthesis** — Steve vs Elon opposition created better product than either alone
2. **Scope discipline under pressure** — Board HOLD became specification, not rejection
3. **Five themes were distinct** — Ember, Forge, Slate, Drift, Bloom each have emotional clarity
4. **Copy treated as first-class work** — Maya Angelou's review defined the voice
5. **Board diversity revealed blind spots** — Four reviewers, four different axes

### What to Improve
1. **Board review at PRD stage** — structural concerns should be caught before build
2. **Distinguish MVP from launchable** — MVP proves value; launchable includes discovery
3. **Risk mitigations enforced** — if you say "three themes," ship three
4. **Measurement infrastructure built** — even if features are deferred
5. **Discovery is Phase 1, not Phase 2** — never defer how users find you

### Key Quote
> "You can build a perfect transformation and still fail if no one knows where to find it." — Marcus Aurelius retrospective

---

## Pulse (localgenius-benchmark-engine) Learnings

### Key Principle: Separate the Verdict from the Conditions
When authority says "proceed with conditions," add those conditions to the requirements immediately. Don't wait for another review.

### What Worked
1. **Debate locked decisions** — Steve vs Elon produced clear north star
2. **Data audit was honest** — 4/5 metrics available, 1 viable proxy
3. **QA was specific** — Block feedback was actionable
4. **Architecture stayed simple** — Even at 9x the LOC target (4,447 LOC)
5. **Integration worked** — Parallel teams, clean composition

### What to Improve
1. Revisit constraints as conditions change — don't let them slip silently
2. Map board feedback to requirements immediately
3. Separate "QA pass" from "board approval"
4. Create execution roadmap with owners
5. Design API contracts before parallel work

### Key Quote
> "You cannot control outcomes. You can only control whether you're honest about what's happening." — Marcus Aurelius retrospective

---

## Workshop Tutorial Learnings

### Key Principle: Separate the Verdict from the Conditions
When authority says "proceed with conditions," add those conditions to the requirements immediately. Don't treat conditions as optional Phase 2 work.

### What Worked
1. **Debate locked a clear path** — Steve vs Elon produced binding decisions
2. **QA was honest and unblocking** — BLOCK verdicts were specific enough to respond to
3. **Essence document held north star** — Never wavered during execution
4. **Board review was rigorous** — Honest scores (5/10 to 7.5/10), not diplomatic ones

### What to Improve
1. Initial deliverable was 19% of requirement (231 vs 800-1200 lines)
2. Board strategic questions weren't anticipated upfront
3. Open questions were listed but quietly dropped during execution
4. Lock decisions earlier in the pipeline

### Key Quote
> "The obstacle is the way. The process reveals what we avoid confronting." — Marcus Aurelius retrospective

---

## Live Deployments

| Service | URL | Status |
|---------|-----|--------|
| LocalGenius | localgenius.company | Live |
| Great Minds | greatminds.company | Live |

---

**Scoreboard Maintained By:** Phil Jackson
**Version:** 1.1
