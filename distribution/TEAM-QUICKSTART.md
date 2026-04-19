# Great Minds — Team Quickstart

Get from zero to running debates + board reviews + plans in 5 minutes.

## 1. Install in Cowork (recommended)

In Cowork, open the plugins panel → **Personal** → `+` → **Sync from GitHub** → pick `caseproof/great-minds-plugin-claude-desktop`.

You'll see two plugins:
- **Great minds** — full autonomous swarm (skip unless you know you want cron/daemon)
- **Great minds lite** — personas + co-work skills ← **install this one**

Click install. Done.

## 2. First commands to try

Open any Cowork chat and type:

```
/agency-debate Should we sunset the legacy API in Q3?
```

Watch Steve Jobs and Elon Musk argue in two rounds, then Rick Rubin distills the essence. Output lands in `rounds/{topic-slug}/`.

```
/agency-board-review Our new pricing page
```

Jensen, Oprah, Warren, and Shonda review in parallel, then a consolidated verdict.

```
/plan Add OAuth login with GitHub
```

Gets you XML task cards in dependency waves with verification checks.

## 3. The 14 personas

Call any of them with `@<name>` in a chat, or let skills dispatch them automatically.

| Use when you need | Persona |
|-------------------|---------|
| Ruthless focus, cut features | Steve Jobs |
| First-principles, moonshots | Elon Musk |
| Visual polish, craft | Jony Ive |
| Strip to essence | Rick Rubin |
| Unit economics, moats | Warren Buffett |
| Platform strategy | Jensen Huang |
| Is-this-clear-to-a-human | Oprah Winfrey |
| Retention, engagement hooks | Shonda Rhimes |
| Scrappy growth | Sara Blakely |
| Warm copywriting | Maya Angelou |
| Scripts, demos | Aaron Sorkin |
| QA, testing, pre-flight | Margaret Hamilton |
| Mediation, quality gate | Marcus Aurelius |
| Orchestration | Phil Jackson |

## 4. Shared brain (optional)

For team-wide debate history and board verdicts, set up the `brain` skill:

```
/brain save rounds/oauth-decision/verdict.md
/brain load rounds/oauth-decision/verdict.md
/brain list rounds
```

It pushes to/pulls from a shared GitHub repo. Config one of:
- Env var: `GREAT_MINDS_BRAIN_REPO=caseproof/great-minds-brain`
- Or a `.great-minds-brain` file in your CWD with that one line

Requires `gh` CLI authenticated (most of us already have it).

## 5. Common recipes

**"I have a PRD and want it stress-tested":**
```
/agency-debate docs/prd/my-feature.md
/agency-board-review docs/prd/my-feature.md
```
Then read `rounds/my-feature/` — you'll have 4 reviews + essence in ~5 min.

**"I need atomic tasks from a spec":**
```
/plan docs/prd/my-feature.md
```
Output: `plans/my-feature-plan.md` with dependency-ordered XML task cards.

**"One quick gut-check from a specific voice":**
Use the persona subagent directly. In Cowork: mention `@steve-jobs-visionary` with the thing you want critiqued.

**"We're about to ship — is the code matching the plan?":**
```
/scope-check plans/my-feature-plan.md
```
Reports drift between plan and actual git diff.

## 6. Troubleshooting

- **Skill not found** — plugin didn't install cleanly. Try uninstall + reinstall, or run `/plugin reload`.
- **`/brain` errors** — `gh auth status` to verify CLI auth; set `GREAT_MINDS_BRAIN_REPO`.
- **Board review returns empty files** — one of the subagents timed out. Re-run; parallel agents sometimes drop.
- **"Where's the output?"** — skills write relative to your working dir (usually project root). Check `rounds/`, `plans/`, `deliverables/`.

## 7. Where to go deeper

- `distribution/plugin/README.md` — what's in the lite plugin
- `distribution/dxt/README.md` — for the Claude Desktop app version (DXT bundle)
- `distribution/README.md` — full format comparison and contributor setup
- Slack/Teams: ping Seth for help

## 8. Contributing back

Edit personas only in `agents/` at the repo root — a pre-commit hook syncs to `distribution/plugin/agents/` and `distribution/dxt/server/personas/` automatically. One-time setup after cloning:

```bash
git config core.hooksPath .githooks
```
