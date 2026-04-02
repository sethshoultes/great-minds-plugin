---
name: agency-review
description: Run a Jensen Huang board review on the current project — strategic assessment, concerns, and one actionable recommendation.
argument-hint: [project-name]
allowed-tools: [Read, Bash, Glob, Grep, Agent, Write]
---

# Great Minds Agency — Board Review

Run a Jensen Huang board review on the current project.

## Instructions

1. Launch a `jensen-huang-board` agent with this prompt:
   - Read the project's current state (git log, source files, STATUS.md)
   - Read the previous board review(s) to avoid repetition
   - Write a review under 50 lines to `rounds/{project}/board-review-{N}.md`
   - Create GitHub issues for genuinely new strategic insights (label: board-idea)

2. Format:
```
# Board Review #{N} — Jensen Huang
**Date**: {today}

## Progress Since Last Review
[2-3 bullets]

## What Concerns Me
[1-2 specific concerns]

## Recommendation
[ONE action]
```

3. Commit the review and report findings to the user.
