---
name: brain
description: Read/write the team's shared brain — a GitHub repo of debate rounds, board verdicts, persona critiques, and shared team knowledge. Triggers when the user says save this debate, save the board verdict, load the brain, list brain entries, or wants to persist/retrieve shared context across teammates.
argument-hint: save|load|list <path>
allowed-tools: [Bash, Read, Write]
---

# Brain — Shared GitHub-Backed Knowledge

Team-shared vault for debates, board reviews, persona critiques, runbooks. Uses the `gh` CLI (already authenticated for most devs) so no tokens live in the repo.

## Config

Resolve the target repo in this order:

1. Env var `GREAT_MINDS_BRAIN_REPO` (format: `owner/repo`)
2. File `.great-minds-brain` in the current working directory (single line, `owner/repo`)

If neither is set, stop and ask the user which repo to use — offer to write it to `.great-minds-brain`.

Default branch: `main`. Override with `GREAT_MINDS_BRAIN_BRANCH`.

## Subcommands

### `save <path>`

Commits a file to the brain repo. If the user hasn't supplied content, ask what to save (or use the most recent debate/board output in the session).

```bash
REPO="${GREAT_MINDS_BRAIN_REPO:-$(cat .great-minds-brain 2>/dev/null)}"
BR="${GREAT_MINDS_BRAIN_BRANCH:-main}"
# Write content to a tempfile first, then:
gh api -X PUT "repos/$REPO/contents/$PATH" \
  -f message="brain: save $PATH" \
  -f branch="$BR" \
  -f content="$(base64 < /tmp/brain-content)"
```

If the file already exists, first `gh api repos/$REPO/contents/$PATH?ref=$BR -q .sha` and pass `-f sha=<sha>`.

Example: `/brain save debates/2026-04-18-pricing.md`

### `load <path>`

Fetches and displays the file.

```bash
gh api "repos/$REPO/contents/$PATH?ref=$BR" -q .content | base64 -d
```

On 404, report `Not found: <path>`.

Example: `/brain load board-reviews/2026-04-10-launch.md`

### `list <dir>`

Lists files in a directory.

```bash
gh api "repos/$REPO/contents/$DIR?ref=$BR" \
  -q '.[] | "- \(.type | if . == "dir" then "[dir] " else "" end)\(.path) (\(.size // 0) bytes)"'
```

Example: `/brain list debates`

## Suggested layout

```
debates/YYYY-MM-DD-<topic>.md
board-reviews/YYYY-MM-DD-<subject>.md
critiques/<persona>/<slug>.md
runbooks/<name>.md
```

## Notes

- Never commit secrets. Brain repo is team-shared.
- Always include a date prefix in filenames so entries sort chronologically.
- If `gh` is not authenticated, instruct the user to run `gh auth login` — do not fall back to raw HTTP from this skill (the DXT has a raw-HTTP variant via `brain_save` / `brain_load` / `brain_list`).
