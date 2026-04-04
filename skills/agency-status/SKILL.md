---
name: agency-status
description: Check agency status — read cron logs, STATUS.md, recent commits, open PRs. No tmux dependency.
allowed-tools: [Bash, Read, Glob]
---

# Great Minds Agency — Status Check

Check the agency status. Uses cron logs (not tmux).

1. Read cron report log: `tail -20 /tmp/claude-shared/cron-reports.log`
2. Read alerts: `cat /tmp/claude-shared/alerts.log | tail -5`
3. Read STATUS.md for current project state
4. Check recent git commits: `git log --oneline -5 --all`
5. Check open PRs: `gh pr list --repo {repo} --json number,title`
6. Check open issues: `gh issue list --repo {repo}`

Report format — keep it SHORT:
- Current phase (from STATUS.md)
- File count + site status (from cron log)
- Recent commits
- Open PRs / issues
- Any alerts
- DO server health (from cron log)
