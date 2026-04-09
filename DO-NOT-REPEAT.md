# Do-Not-Repeat List

These patterns have failed. Never use them again.

## Commands
- `grep -oP` — Linux-only, fails silently on macOS. Use `grep | sed` instead.
- `timeout` command — Linux-only. Check with `command -v timeout` first, or skip.
- `tmux send-keys` to Claude Code — input buffer rejects pasted prompts. 0 successes. Use Agent tool.
- `claude -p` for multi-step work — drops steps silently. Use for single-step only, or use Agent SDK daemon.
- `sed -i ''` with complex patterns — escaping differs between macOS and Linux. Test on both.

## Patterns
- Skip/disable a feature instead of fixing it — creates downstream failures
- Hardcode paths (`/Users/sethshoultes/...`) — breaks on other machines. Use env vars or auto-detection. See also `BANNED-PATTERNS.md` cross-project section.
- `set -e` with `grep -c` — grep returns exit code 1 on no matches, kills the script
- Commit node_modules — use .gitignore
- Say "it should work" without testing — test and show output
- Quick fix that disables functionality — fix properly or don't touch it

## Daemon-Specific Patterns to Avoid

These were discovered during daemon development and first production runs.

- **PRD watcher race condition** — chokidar fires `add` before the file is fully written. Always use `awaitWriteFinish: { stabilityThreshold: 2000 }` (or similar threshold) to wait for the write to complete before reading the PRD.
- **Agent timeout vs. pipeline timeout coordination** — a 20-min agent timeout with a 60-min pipeline timeout means a single agent can retry twice and consume 40+ minutes, leaving no room for subsequent phases. Ensure `(AGENT_TIMEOUT_MS * maxRetries * numberOfAgents)` fits within `PIPELINE_TIMEOUT_MS`, or the watchdog will kill the pipeline mid-phase.
- **Memory store pre-check** — the daemon must verify the memory-store SQLite database exists and is accessible before starting the pipeline. If `MEMORY_DB` is unset and the fallback path does not exist, the token ledger will crash on first write. Add an `existsSync` check at startup.
- **Token ledger CWD instability** — `token-ledger.ts` defaults to `process.cwd()` for the DB path. If the daemon is launched from different directories, it creates separate databases and loses history. Always pass an explicit `dbPath` from `config.ts` or `pipeline.ts`.
