# `/team-build` Decision Table

The lookup table for project-signal → plugin → persona. SKILL.md references this; the table lives separately so it can be updated as new plugins ship without touching the skill's instructions.

Last updated: 2026-04-28 — constellation v0.1 (10 plugins, ~111 personas).

## Plugin coverage map

| Plugin | Owns the craft of |
|---|---|
| `great-minds` | Founder-class strategy, orchestration (Phil), QA (Margaret), creative direction (Rick), capital allocation (Buffett), Stoic mediation (Aurelius), founder empathy (Sara), prose voice (Maya), strategic visual taste (Jony), screenwriting craft (Sorkin) |
| `great-authors` | Prose craft (eleven author voices) and editorial work (Gottlieb) |
| `great-filmmakers` | Film and video craft (directors, writers, craft specialists) |
| `great-publishers` | Publication form (covers, jackets, magazine direction, book sites) |
| `great-marketers` | Advertising and marketing craft (positioning, ad copy, launch composition) |
| `great-engineers` | Software engineering craft (technical specs, design reviews, code) |
| `great-designers` | Product, UX, and visual-design craft (design specs, audits, product discovery) |
| `great-counsels` | Legal, policy, and ethics craft (memos, reviews, ethical reasoning) |
| `great-operators` | Operations craft (operating plans, process reviews, OKRs) |
| `great-researchers` | Research craft (studies, peer reviews, literature reviews) |

## Project-type recognition

Look for these signals in the project brief. Multiple signals fire = multiple plugins recommended.

| Brief contains | Triggers plugin(s) |
|---|---|
| "tool", "static page", "HTML", "CSS", "JavaScript", "browser", "SPA" | `great-engineers` + `great-designers` |
| "API", "backend", "server", "database", "service" | `great-engineers` |
| "library", "package", "framework", "module" | `great-engineers` |
| "novel", "manuscript", "chapter", "story", "fiction" | `great-authors` |
| "essay", "memoir", "long-form", "narrative nonfiction" | `great-authors` |
| "decision", "should we", "should I", "right thing" | `great-counsels` (ethics) + `great-minds` (Marcus, Buffett) |
| "memo", "policy", "regulation", "compliance", "legal review" | `great-counsels` |
| "ethics", "ethical", "moral", "principles" | `great-counsels` (Rawls, Arendt) + `great-minds` (Marcus) |
| "research", "literature review", "study", "investigation", "deep dive", "open question" | `great-researchers` |
| "ad copy", "campaign", "launch", "positioning", "tagline", "marketing" | `great-marketers` |
| "book site", "trailer", "magazine", "publication", "cover", "jacket", "catalog" | `great-publishers` |
| "operations", "OKR", "scaling", "hiring", "process", "playbook", "runbook", "post-mortem" | `great-operators` |
| "scene", "shot", "screenplay", "film", "video", "documentary" | `great-filmmakers` |
| "autonomous", "pipeline", "agency", "orchestration", "PRD-to-ship" | `great-minds` (especially `agency-*` skills) |

## Phase → persona reference

### Discovery

| Project type | Default persona | Why |
|---|---|---|
| Software product | `great-designers:marty-cagan-designer` | Cagan's four-risks framework on a product brief |
| Business / commercial | `great-minds:sara-blakely-growth` | Founder empathy for "would the customer pay and stay" |
| Research / academic | `great-researchers:carl-sagan-researcher` | "What is the question really asking?" |
| Decision / ethical | `great-minds:marcus-aurelius-mod` or `great-counsels:john-rawls-counsel` | Whose interests does this serve? |
| Creative / artistic | `great-minds:rick-rubin-creative` | Strip to essence, what is the work really about |

### Debate

| Tension type | Default persona | Why |
|---|---|---|
| Scope vs. polish (cut features?) | `great-minds:steve-jobs-visionary` | "Is this insanely great?" — knows when to cut |
| First-principles vs. convention | `great-minds:elon-musk-persona` | Disregards the conventional answer, asks what physics permits |
| Ethical / mediation | `great-minds:marcus-aurelius-mod` | Stoic mediator, calm under tension |
| Strategic / capital | `great-minds:warren-buffett-persona` or `great-operators:charlie-munger-operator` | Mental models on big calls |
| Creative direction | `great-minds:rick-rubin-creative` | Reduction to essence; is this real? |
| Design / form | `great-minds:jony-ive-designer` | Less, but better |

### Plan

Always `great-minds:phil-jackson-orchestrator`. He's the orchestrator. His skill is dispatching the right play; that's exactly what `/team-build` outputs.

### Build (sample mappings)

#### Engineering

| Need | Persona |
|---|---|
| Performance / parser / engine | `great-engineers:john-carmack-engineer` |
| Pragmatic web app, opinions about defaults | `great-engineers:dhh-engineer` |
| Compiler, language, teaching | `great-engineers:grace-hopper-engineer` |
| Algorithm correctness, rigor | `great-engineers:donald-knuth-engineer` |
| Systems, kernel-level, "we don't break userspace" | `great-engineers:linus-torvalds-engineer` |
| Language design, backwards compat | `great-engineers:anders-hejlsberg-engineer` |
| Browser internals, JS runtime | `great-engineers:brendan-eich-engineer` |
| Proofs, structured programming | `great-engineers:edsger-dijkstra-engineer` |
| Refactoring for clarity, OO design | `great-engineers:sandi-metz-engineer` |

#### Prose

| Register | Persona |
|---|---|
| Tight, lean, iceberg | `great-authors:hemingway-persona` |
| Biblical weight, mythic | `great-authors:mccarthy-persona` |
| Cool observation, cultural reporting | `great-authors:didion-persona` |
| Moral urgency, confrontation | `great-authors:baldwin-persona` |
| Lyric, polyphonic, the past speaks | `great-authors:morrison-persona` |
| Long-form structure, "structure is destiny" | `great-authors:mcphee-persona` |
| Maximalist, self-aware | `great-authors:wallace-persona` |
| Plain-style, anti-jargon | `great-authors:orwell-persona` |
| Narrative momentum, working novelist | `great-authors:king-persona` |
| Speculative, world-building serves theme | `great-authors:le-guin-persona` |
| Compression with humane heart | `great-authors:vonnegut-persona` |

#### Design

| Need | Persona |
|---|---|
| Cognitive flows, affordances | `great-designers:don-norman-designer` |
| Industrial restraint, "less but better" | `great-designers:dieter-rams-designer` |
| Information density, charts | `great-designers:edward-tufte-designer` |
| Pixel craft, icon design | `great-designers:susan-kare-designer` |
| Product discovery (when not used at discovery phase) | `great-designers:marty-cagan-designer` |
| Physical product as story | `great-designers:tinker-hatfield-designer` |
| Typography, identity, system at scale | `great-designers:paula-scher-designer` |
| Usability research, evidence over opinion | `great-designers:jared-spool-designer` |
| Design management, building taste in teams | `great-designers:julie-zhuo-designer` |

#### Copy / Marketing

| Need | Persona |
|---|---|
| Direct response, "the consumer is not a moron" | `great-marketers:david-ogilvy-marketer` |
| Clever, surprising, "Think Small" | `great-marketers:bill-bernbach-marketer` |
| Pop voice, headline-as-hook | `great-marketers:mary-wells-lawrence-marketer` |
| Storytelling, "1984" register | `great-marketers:lee-clow-marketer` |
| USP discipline, repetition | `great-marketers:rosser-reeves-marketer` |
| Emotional direct response, women's market | `great-marketers:helen-lansdowne-resor-marketer` |
| Biblical-American copy, "The Man Nobody Knows" | `great-marketers:bruce-barton-marketer` |
| Behavioral economics, irrational by design | `great-marketers:rory-sutherland-marketer` |

#### Decision memo / Legal

| Need | Persona |
|---|---|
| Constitutional civil rights, long-game precedent | `great-counsels:ruth-bader-ginsburg-counsel` |
| Litigation strategy, the case that ends Plessy | `great-counsels:thurgood-marshall-counsel` |
| Originalism, textualism | `great-counsels:antonin-scalia-counsel` |
| Digital law, code-as-law | `great-counsels:lawrence-lessig-counsel` |
| Antitrust, platform power | `great-counsels:tim-wu-counsel` |
| Privacy, "right to be let alone" | `great-counsels:louis-brandeis-counsel` |
| Administrative law, behavioral regulation | `great-counsels:cass-sunstein-counsel` |
| Political philosophy, "the banality of evil" | `great-counsels:hannah-arendt-counsel` |
| Justice as fairness, veil of ignorance | `great-counsels:john-rawls-counsel` |

#### Research / Synthesis

| Register | Persona |
|---|---|
| Science communication, wonder | `great-researchers:carl-sagan-researcher` |
| Natural history, contingency | `great-researchers:stephen-jay-gould-researcher` |
| Popular science, gonzo-rigor | `great-researchers:mary-roach-researcher` |
| Narrative neurology, case studies | `great-researchers:oliver-sacks-researcher` |
| Medical writing, surgical precision | `great-researchers:atul-gawande-researcher` |
| Big-picture history, "Guns, Germs, and Steel" | `great-researchers:jared-diamond-researcher` |
| Synthesis biology, sociobiology | `great-researchers:e-o-wilson-researcher` |
| Ten-year investigation, ethical dimension | `great-researchers:rebecca-skloot-researcher` |
| Biographical depth, power dynamics | `great-researchers:robert-caro-researcher` |

#### Operations

| Need | Persona |
|---|---|
| Supply chain, planetary scale | `great-operators:tim-cook-operator` |
| Management craft, OKRs | `great-operators:andy-grove-operator` |
| Mental models, latticework | `great-operators:charlie-munger-operator` |
| People ops, "we hire adults" | `great-operators:patty-mccord-operator` |
| Total Quality, eliminate the slogans | `great-operators:w-edwards-deming-operator` |
| Production flow, the seven wastes | `great-operators:taiichi-ohno-operator` |
| Startup-velocity ops, "wartime CEO" | `great-operators:ben-horowitz-operator` |
| Retail logistics, the customer is boss | `great-operators:sam-walton-operator` |
| Ops-as-culture | `great-operators:herb-kelleher-operator` |

#### Publication form

| Need | Persona |
|---|---|
| Book covers, metaphor as economy | `great-publishers:chip-kidd-publisher` |
| Magazine direction, editorial sensibility | `great-publishers:tina-brown-publisher` |
| Editorial relationships with writers | `great-publishers:maxwell-perkins-publisher` |
| Magazine voice, brand culture | `great-publishers:jann-wenner-publisher` |
| The book review, intellectual judgment | `great-publishers:bob-silvers-publisher` |
| Fashion/cultural authority | `great-publishers:diana-vreeland-publisher` |
| The publishing house as institution | `great-publishers:bennett-cerf-publisher` |
| Poster/cover as visual essay | `great-publishers:george-lois-publisher` |

### QA

Default: `great-minds:margaret-hamilton-qa` — software-engineer-as-discipline; pre-flight checks; "would this survive a 3 AM production incident?"

For prose: also dispatch `great-authors:gottlieb-persona` for editorial QA.

### Review

| Deliverable register | Persona |
|---|---|
| Visual / product | `great-minds:steve-jobs-visionary` or `great-minds:jony-ive-designer` |
| Creative essence | `great-minds:rick-rubin-creative` |
| Strategic / capital | `great-minds:warren-buffett-persona` |
| Prose / editorial | `great-authors:gottlieb-persona` |
| Voice / dignity | `great-minds:maya-angelou-writer` |
| Operational | `great-operators:andy-grove-operator` (the high-output-management lens) |

## Substitution table (when a plugin isn't loaded)

For every persona recommended from a plugin OTHER than `great-minds`, check whether that plugin is in the operator's session. If not, substitute as below (always toward `great-minds` since it's the most reliably-installed plugin).

| Missing plugin → persona | Substitute (almost always great-minds) | What's lost |
|---|---|---|
| `great-designers:marty-cagan-designer` | `great-minds:sara-blakely-growth` | Cagan's structured four-risks; gain founder-empathy |
| `great-designers:don-norman-designer` | `great-minds:jony-ive-designer` | Norman's usability-engineering register; gain Apple-aesthetic |
| `great-engineers:john-carmack-engineer` | `great-minds:elon-musk-persona` | Carmack's specific systems craft; gain first-principles |
| `great-engineers:donald-knuth-engineer` | `great-minds:margaret-hamilton-qa` | Knuth's rigor on algorithms; gain QA-discipline framing |
| `great-counsels:lawrence-lessig-counsel` | `great-minds:marcus-aurelius-mod` | Lessig's digital-law specifics; gain Stoic ethical lens |
| `great-counsels:john-rawls-counsel` | `great-minds:marcus-aurelius-mod` | Rawls's veil-of-ignorance framework; gain Stoic alternative |
| `great-operators:tim-cook-operator` | `great-minds:warren-buffett-persona` | Cook's supply-chain craft; gain capital-allocation lens |
| `great-operators:andy-grove-operator` | `great-minds:phil-jackson-orchestrator` | Grove's OKR/management discipline; gain orchestrator-coach lens |
| `great-researchers:carl-sagan-researcher` | `great-minds:rick-rubin-creative` | Sagan's science communication; gain reduction-to-essence lens |
| `great-publishers:chip-kidd-publisher` | `great-minds:jony-ive-designer` | Kidd's book-cover voice; gain general visual-design discipline |
| `great-marketers:david-ogilvy-marketer` | `great-minds:maya-angelou-writer` | Ogilvy's direct-response craft; gain warmth/dignity in copy |

## What this table doesn't cover

- Project shapes that span MANY plugins simultaneously (e.g., a multi-deliverable launch — book + site + film). Recommend the operator break the project into sub-projects and run `/team-build` on each.
- Cross-dispatch chains (e.g., great-authors persona dispatched by great-publishers as a sub-step). The brief calls out the primary phase persona; cross-dispatch within build is up to that persona's own logic.
- Rapidly evolving plugin lineups. When a new plugin ships, this table needs an update. The skill's first step (read `~/brain/projects/great-minds-ai-company-constellation.md`) is the override — if the roadmap says something different from this table, trust the roadmap.
