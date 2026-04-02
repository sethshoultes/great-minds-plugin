---
name: agency-qa
description: Run the full QA pipeline on the current project — build, typecheck, lint, tests, live site verification, accessibility, and security review. Uses the Margaret Hamilton QA agent.
argument-hint: [project-path]
allowed-tools: [Read, Bash, Glob, Grep, Agent, Write]
---

# Great Minds Agency — QA Pipeline

Run the Margaret Hamilton QA pipeline on the current project.

## Instructions

1. Identify the project path (from $ARGUMENTS or current directory)
2. Launch the `margaret-hamilton-qa` agent with this pipeline:

### Phase 1: Build Verification
```bash
cd {project-path}
npm run build 2>&1
npm run typecheck 2>&1
npm run lint 2>&1
```

### Phase 2: Test Suite
```bash
npm run test 2>&1
```
Report: X/Y tests passing. List any failures.

### Phase 3: Live Site (if deployed)
- Use Puppeteer to screenshot the live URL
- Check key pages: /, /welcome, /app
- Verify design tokens are rendering (colors, typography, spacing)
- Check mobile viewport (390x844)

### Phase 4: API Smoke Test
```bash
curl -s {base-url}/api/health | jq .
curl -s -X POST {base-url}/api/auth/register -H 'Content-Type: application/json' -d '{"test": true}' | head -5
```

### Phase 5: Accessibility
- Check for ARIA roles on interactive elements
- Verify color contrast meets WCAG AA
- Check touch target sizes (44px minimum)
- Verify keyboard navigation

### Phase 6: Security Review
- Check API routes don't leak error details
- Verify auth middleware on protected routes
- Check for hardcoded secrets in source
- Verify CORS configuration

## Output Format

Write results to `rounds/{project}/qa-report-{timestamp}.md`:

```markdown
# QA Report — Margaret Hamilton
**Date**: {date}
**Project**: {project}

## Results
| Check | Status | Details |
|-------|--------|---------|
| Build | PASS/FAIL | ... |
| Types | PASS/FAIL | ... |
| Lint | PASS/FAIL | ... |
| Tests | X/Y PASS | ... |
| Live Site | PASS/FAIL | ... |
| A11y | PASS/FAIL | ... |
| Security | PASS/FAIL | ... |

## Critical Issues
[List any blockers]

## Recommendation
SHIP / FIX FIRST / BLOCK
```
