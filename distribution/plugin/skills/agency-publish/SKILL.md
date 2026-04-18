---
name: agency-publish
description: Review and publish blog content. Maya writes, Rick Rubin strips to essence, Jony Ive reviews layout, Oprah checks accessibility, then publish.
argument-hint: <post-slug>
allowed-tools: [Read, Write, Bash, Agent, Edit]
---

# Great Minds Agency — Publish Pipeline

Review and publish blog content through the creative team.

## Pipeline

### Step 1: Write (Maya Angelou or assigned writer)
Author writes the post in `website/content/blog/{slug}.md`

### Step 2: Editorial Review (Rick Rubin — haiku)
Strip to essence. Cut anything that doesn't earn its place.
- Is the headline strong enough?
- Does the opening hook in 2 sentences?
- Can 30% be cut without losing meaning?
- Output: `rounds/blog/{slug}-rick-review.md`

### Step 3: Brand Voice Check (Maya Angelou — haiku)
If Maya didn't write it, she reviews for voice consistency.
- Does it sound like Great Minds?
- Is it warm but direct?
- Output: `rounds/blog/{slug}-voice-review.md`

### Step 4: Accessibility & Clarity (Oprah — haiku)
Would a non-technical person understand the key takeaway?
- Is the jargon explained or unnecessary?
- Would someone share this?
- Output: `rounds/blog/{slug}-clarity-review.md`

### Step 5: Apply Fixes
Author applies feedback from all three reviewers.

### Step 6: Publish
- Commit to `website/content/blog/{slug}.md`
- Push to main (Vercel auto-deploys)
- Verify live at greatminds.company/blog/{slug}

## Quality Gate
All three reviewers must pass before publish. If any says "rewrite", go back to Step 5.
