# Great Minds — Distribution

Two distributions, same personas and skills, different install paths.

## Contributor setup (one-time)

Enable the pre-commit hook so edits to `agents/*.md` auto-sync to `distribution/plugin/agents/` and `distribution/dxt/server/personas/`:

```bash
git config core.hooksPath .githooks
```

Manual sync anytime: `distribution/sync-distribution.sh`.

## Pick one

### `plugin/` — for Claude Cowork + Claude Code

Native plugin format. 14 personas as subagents, skills as slash commands.

**Best for:** developers, technical teams, anyone using Cowork or Claude Code CLI.

**Install:**
1. Push this repo (or a subtree of `plugin/`) to GitHub
2. In Cowork or Claude Code: add marketplace → `/plugin marketplace add <git-url>`
3. `/plugin install great-minds@<marketplace>`

**Updates:** `git pull` + `/plugin reload`.

### `dxt/` — for Claude Desktop app

MCP server bundled as a `.dxt` file. One double-click install.

**Best for:** non-technical teammates, anyone on the Desktop app who doesn't use Cowork.

**Build:**
```bash
cd dxt && npm install && npx @anthropic-ai/dxt pack
```

**Install:** share the generated `great-minds.dxt`, teammates double-click to install.

**Updates:** new `.dxt` file, re-install.

## What's in both

- 14 personas (Jobs, Musk, Ive, Rubin, Buffett, Huang, Winfrey, Rhimes, Blakely, Angelou, Sorkin, Hamilton, Aurelius, Jackson)
- `debate` — 2-round Jobs vs. Musk + Rubin essence
- `board_review` — 4 members in parallel
- `plan` — atomic XML task cards in dependency waves

## What's only in `plugin/`

Native slash commands that write files to CWD:
- `agency-publish` — Maya → Rubin → Ive → Oprah writing pipeline
- `agency-video` — Sorkin → Rhimes → Ive → Remotion render
- `agency-anatomy` — file index with token estimates
- `scope-check` — plan vs. git diff drift report

DXT can't do these — MCP tools can't spawn sub-agents or run local pipelines the same way.

## Shared brain (optional)

Point both distributions at a shared GitHub repo for debate rounds / board verdicts. For plugin: reviews write to `rounds/{project}/` in CWD — if CWD is a git clone of a team repo, commits are shared. For DXT: add a `memory` tool that GETs/POSTs to a GitHub repo via the GitHub API.
