# PRD: Auto-Convert GitHub Issues to PRDs

## Problem
GitHub issues are filed but never acted on. The daemon polls GitHub but only logs issues as heartbeat problems — it never converts them into PRDs. The team should be picking up issues automatically.

## CRITICAL: Do NOT Start Over
The daemon already has GitHub polling in `health.ts` and issue monitoring in `config.ts`. Build on what exists.

## Requirements

### 1. Issue-to-PRD Converter
Add a new module `daemon/src/github-intake.ts` that:
- Polls all repos in `config.ts` GITHUB_REPOS for open issues
- Filters for issues with actionable labels (e.g., `p0`, `p1`, `plugin`, `bug`, `feature`)
- Skips issues already converted (track in KV or a local JSON file)
- Converts qualifying issues into a PRD file:
  - Title → PRD title
  - Body → PRD problem/solution/requirements
  - Labels → priority and type
  - Issue number → referenced in PRD for status updates
- Writes the PRD to `${PIPELINE_REPO}/prds/github-issue-{repo}-{number}.md`
- The daemon's existing watcher picks it up from there

### 2. Issue Status Updates
When the pipeline completes a GitHub-sourced PRD:
- Comment on the original issue with the result (shipped/failed)
- If shipped: close the issue with a comment linking to the commit/PR
- If failed: comment with the failure reason, leave issue open
- Use `gh` CLI or GitHub API with the token already on the server

### 3. Issue Filtering Rules
Not every issue should become a PRD. Only convert issues that:
- Have a label: `p0`, `p1`, `plugin`, `bug`, `feature`, or `enhancement`
- Are NOT labeled `question`, `wontfix`, `duplicate`, or `discussion`
- Are open (not closed)
- Have not already been converted (check tracking file)
- Were created or updated since the last poll

### 4. Poll Schedule
- Check every 15 minutes (same as heartbeat interval)
- Or integrate into the existing heartbeat cycle in `health.ts`

### 5. PRD Format for Issues
```markdown
# PRD: {issue title}

> Auto-generated from GitHub issue {repo}#{number}
> {issue URL}

## Problem
{issue body}

## Labels
{issue labels}

## Priority
{derived from p0/p1/p2 label}

## Success Criteria
- Issue {repo}#{number} requirements are met
- All tests pass
- Deployed and verified
```

### 6. Configuration
- Add `GITHUB_TOKEN` env var support (for API access and commenting)
- Add `GITHUB_INTAKE_ENABLED` env var (default: true) to toggle
- Track converted issues in `${PIPELINE_REPO}/.github-intake-state.json`

## Files to Create/Modify
- Create: `daemon/src/github-intake.ts`
- Modify: `daemon/src/daemon.ts` — add intake to the event loop
- Modify: `daemon/src/pipeline.ts` — after ship, check if PRD came from a GitHub issue and update it
- Modify: `daemon/src/config.ts` — add intake interval and toggle

## Success Criteria
- Open GitHub issues with actionable labels automatically become PRDs
- Pipeline processes them like any other PRD
- Original issues get status comments and are closed when shipped
- Issues without actionable labels are ignored
- Already-processed issues are not re-queued
