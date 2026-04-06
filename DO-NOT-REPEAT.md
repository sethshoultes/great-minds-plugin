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
- Hardcode paths (`/Users/sethshoultes/...`) — breaks on other machines. Use env vars or auto-detection.
- `set -e` with `grep -c` — grep returns exit code 1 on no matches, kills the script
- Commit node_modules — use .gitignore
- Say "it should work" without testing — test and show output
- Quick fix that disables functionality — fix properly or don't touch it
