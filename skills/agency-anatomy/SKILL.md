---
name: agency-anatomy
description: Generate or regenerate the .wolf/anatomy.md file index with token estimates for the current project.
argument-hint: [project-dir]
allowed-tools: [Read, Bash, Glob]
---

# Agency Anatomy — File Index Generator

Regenerate the `.wolf/anatomy.md` codebase index.

## Context

This skill scans the project directory, counts lines in every source file, estimates token usage (lines x 4), and produces a sorted table so agents know which files are expensive to read.

## Instructions

### Step 1: Determine Project Directory

1. If `$ARGUMENTS` is provided, use it as the project directory
2. Otherwise, use the current working directory
3. Validate the directory exists

### Step 2: Run the Anatomy Hook

Run the anatomy hook script:

```bash
PROJECT_DIR="<project-dir>" bash "${CLAUDE_PLUGIN_ROOT}/hooks/anatomy-hook.sh"
```

If `CLAUDE_PLUGIN_ROOT` is not set, locate the hook relative to this skill file.

### Step 3: Display Results

1. Read the generated `.wolf/anatomy.md`
2. Report:
   - Total files indexed
   - Total estimated tokens
   - Top 10 largest files by token count
3. Note any files that exceed 10,000 estimated tokens as "context-heavy"

### Step 4: Recommendations

If total tokens exceed 500,000:
- Suggest which directories to `.claudeignore`
- Recommend splitting large files

If any single file exceeds 20,000 tokens:
- Flag it as a candidate for decomposition
