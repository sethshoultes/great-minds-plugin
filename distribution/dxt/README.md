# Great Minds — DXT (Claude Desktop Extension)

Local MCP server that exposes persona critiques, structured debates, board reviews, and planning as tools.

## Architecture

The server returns structured *prompts*, not LLM output. Claude runs the persona reasoning inside its own inference using your subscription — no API key, no hosting, no per-request cost.

## Build

```bash
cd claude-desktop/dxt
npm install
npx @anthropic-ai/dxt pack
```

Produces `great-minds.dxt`. Double-click to install in Claude Desktop.

## Tools

- `list_personas` — 14 persona blurbs
- `persona_critique(persona, input)` — single persona feedback
- `debate(topic)` — Jobs vs. Musk 2-round + Rubin essence
- `board_review(subject)` — Jensen, Oprah, Warren, Shonda in parallel
- `plan(requirement)` — XML task cards in dependency waves
- `brain_save(path, content, message)` — commit a file to the shared brain repo
- `brain_load(path)` — fetch a file from the shared brain repo
- `brain_list(directory)` — list files in a directory of the shared brain repo

## Shared brain

Team members can read/write debate rounds, board verdicts, and persona critiques to a common GitHub repo so everyone works from the same context. Configure via env vars in Claude Desktop's MCP server env (or your shell):

- `GREAT_MINDS_GITHUB_TOKEN` — a GitHub PAT with `contents:write` on the brain repo (required)
- `GREAT_MINDS_GITHUB_REPO` — `owner/repo`, e.g. `caseproof/great-minds-brain` (required)
- `GREAT_MINDS_GITHUB_BRANCH` — target branch (optional, default `main`)

If env vars are missing the brain tools return a clear error instead of failing silently. 404s return `Not found: <path>`. All other GitHub errors return `GitHub error <status>: <body>`.

Suggested layout inside the brain repo:

```
debates/YYYY-MM-DD-<topic>.md
board-reviews/YYYY-MM-DD-<subject>.md
critiques/<persona>/<slug>.md
```

## Team distribution

Drop `great-minds.dxt` in a shared Drive / S3 / internal site. Teammates download once, double-click. Updates = new file + re-install. Optional shared brain = point a GitHub repo at persona outputs.
