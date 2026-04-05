---
name: agency-status
description: Comprehensive agency health check — pipeline state, cron health, memory stats, DO server status, GitHub issues/PRs, and recent commits.
allowed-tools: [Bash, Read, Glob, Grep]
---

# Great Minds Agency — Status Check

Full agency health report. No tmux dependency — reads files and APIs directly.

## Instructions

### Step 1: Pipeline State

Read `STATUS.md` and extract:
- Current state (idle, debate, plan, build, verify, ship)
- Active project name
- Current phase number
- Any blockers listed
- Last updated timestamp

If STATUS.md is missing, report "No STATUS.md found — run /agency-start first."

### Step 2: Cron Health

Check if crons are installed and healthy:

```bash
# List installed crons
crontab -l 2>/dev/null | grep -E "(heartbeat|pipeline|dream|qa-check|git-monitor)" || echo "No agency crons installed"

# Last heartbeat
if [ -f /tmp/claude-shared/heartbeat.log ]; then
  echo "Last heartbeat: $(tail -1 /tmp/claude-shared/heartbeat.log)"
else
  echo "No heartbeat log found"
fi

# Pipeline runner last run
if [ -f /tmp/claude-shared/pipeline.log ]; then
  echo "Last pipeline entry: $(tail -1 /tmp/claude-shared/pipeline.log)"
else
  echo "No pipeline log found"
fi
```

Report:
- Number of agency crons installed (expected: 3-5)
- Last heartbeat timestamp and age (warn if older than 15 minutes)
- Last pipeline runner entry
- Any cron errors in logs

### Step 3: Memory Store Stats

```bash
# Check if memory store exists
if [ -d memory-store ]; then
  TOTAL=$(find memory-store/data -name "*.json" 2>/dev/null | wc -l | tr -d ' ')
  echo "Memory entries: $TOTAL"
  LAST_MAINT=$(stat -f "%Sm" memory-store/data/ 2>/dev/null || echo "unknown")
  echo "Last maintenance: $LAST_MAINT"
else
  echo "No memory store configured"
fi

# Check dreams directory
if [ -d dreams ]; then
  DREAMS=$(ls dreams/*.md 2>/dev/null | wc -l | tr -d ' ')
  echo "Dream logs: $DREAMS"
  LAST_DREAM=$(ls -t dreams/*.md 2>/dev/null | head -1)
  [ -n "$LAST_DREAM" ] && echo "Last dream: $LAST_DREAM"
fi
```

### Step 4: DigitalOcean Server Health (if configured)

```bash
# Check if DO is configured
if [ -f .env ] && grep -q "DO_" .env 2>/dev/null; then
  DO_IP=$(grep "DO_IP" .env | cut -d= -f2)
  if [ -n "$DO_IP" ]; then
    # Quick health check
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://$DO_IP" 2>/dev/null)
    echo "DO Server ($DO_IP): HTTP $HTTP_CODE"
  fi
else
  echo "DO server: not configured"
fi
```

If no .env or no DO config, report "not configured" and move on.

### Step 5: GitHub — Open Issues

```bash
# Try to detect repo from git remote
REPO=$(git remote get-url origin 2>/dev/null | sed 's/.*github.com[:/]//' | sed 's/.git$//')
if [ -n "$REPO" ]; then
  echo "=== Open Issues ==="
  gh issue list --repo "$REPO" --limit 10 --json number,title,labels 2>/dev/null || echo "gh CLI not available or no access"

  echo "=== Open PRs ==="
  gh pr list --repo "$REPO" --limit 10 --json number,title,state 2>/dev/null || echo "gh CLI not available or no access"
else
  echo "No git remote configured — skipping GitHub checks"
fi
```

### Step 6: Recent Commits

```bash
git log --oneline -10 --all --decorate 2>/dev/null || echo "Not a git repo"
```

### Step 7: File System Health

Quick sanity checks:
```bash
# Check for expected system files
for f in SOUL.md AGENTS.md STATUS.md MEMORY.md HEARTBEAT.md; do
  [ -f "$f" ] && echo "  $f: present" || echo "  $f: MISSING"
done

# Check for expected directories
for d in prds rounds deliverables memory .planning; do
  [ -d "$d" ] && echo "  $d/: present ($(find "$d" -type f 2>/dev/null | wc -l | tr -d ' ') files)" || echo "  $d/: MISSING"
done
```

## Output Format

Keep the report concise and scannable:

```markdown
# Agency Status Report

## Pipeline
- **State**: {state}
- **Project**: {name or "none"}
- **Phase**: {phase or "—"}
- **Blockers**: {blockers or "none"}

## Cron Health
- **Installed**: {count} of 5 expected
- **Last heartbeat**: {timestamp} ({age} ago)
- **Last pipeline run**: {timestamp}
- **Status**: HEALTHY / DEGRADED / DOWN

## Memory
- **Entries**: {count}
- **Dream logs**: {count}
- **Last maintenance**: {date}

## Server
- **DO health**: {HTTP code or "not configured"}

## GitHub
- **Open issues**: {count}
- **Open PRs**: {count}
- {list top 5 issues/PRs by title}

## Recent Commits
{last 5 commits, one-line format}

## System Files
{present/missing checklist}
```

## Error Handling

- If any check fails, report what's available and note what could not be checked
- Never block on a single failed check — report everything you CAN determine
- If gh CLI is not installed, skip GitHub checks gracefully
- If not in a git repo, skip commit/PR/issue checks
