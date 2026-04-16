#!/bin/bash
# ⚠️ TEMPORARY TOOL — Scheduled for deprecation in 3 months
# This script syncs the daemon code from great-minds-plugin to the great-minds repo.
# Do NOT add features. Ship surgical simplicity today. Delete it tomorrow.

set -e

# =============================================================================
# Path Configuration (Edit these for your environment)
# =============================================================================
PLUGIN_ROOT="/Users/sethshoultes/Local Sites/great-minds-plugin"
GREAT_MINDS_ROOT="/home/agent/great-minds"

# =============================================================================
# Pre-Flight Validations
# =============================================================================

echo "Syncing daemon code..."

# Validation 1: Check destination has no uncommitted changes
cd "$GREAT_MINDS_ROOT"
if [[ -n $(git status -s) ]]; then
  echo "❌ ERROR: Destination repo has uncommitted changes. Commit or stash them first."
  git status -s
  exit 1
fi

# Validation 2: Check source daemon/src exists
if [[ ! -d "$PLUGIN_ROOT/daemon/src" ]]; then
  echo "❌ ERROR: Source daemon/src not found at \"$PLUGIN_ROOT/daemon/src\""
  exit 1
fi

# Validation 3: Check npm is available
if ! command -v npm > /dev/null 2>&1; then
  echo "❌ ERROR: npm not found in PATH"
  exit 1
fi

# Validation 4: Check destination structure exists
if [[ ! -d "$GREAT_MINDS_ROOT/daemon/src" ]]; then
  echo "❌ ERROR: Wrong destination path — \"$GREAT_MINDS_ROOT/daemon/src\" does not exist"
  exit 1
fi

# Validation 5: File count sanity check
SOURCE_COUNT=$(find "$PLUGIN_ROOT/daemon/src" -name "*.ts" -type f | wc -l | tr -d ' ')
if [[ $SOURCE_COUNT -ne 11 ]]; then
  echo "⚠️  WARNING: Expected 11 TypeScript files in source, found $SOURCE_COUNT"
fi

# =============================================================================
# Wave 2: File Operations
# =============================================================================

# Copy daemon TypeScript files
cp "$PLUGIN_ROOT/daemon/src/"*.ts "$GREAT_MINDS_ROOT/daemon/src/"

# Copy package.json
cp "$PLUGIN_ROOT/daemon/package.json" "$GREAT_MINDS_ROOT/daemon/package.json"

# Copy README.md with warning banner
cat > "$GREAT_MINDS_ROOT/daemon/README.md" <<'EOF'
# ⚠️ **IMPORTANT:** This daemon code is synced from great-minds-plugin

**Do NOT edit files here directly.** All changes must be made in the plugin repo and synced.

Source of truth: https://github.com/sethshoultes/great-minds-plugin

To sync changes from the plugin:
```bash
cd /path/to/great-minds-plugin
npm run sync
```

---

EOF

# Append original README content
cat "$PLUGIN_ROOT/daemon/README.md" >> "$GREAT_MINDS_ROOT/daemon/README.md"

# Copy documentation files to repo root
cp "$PLUGIN_ROOT/BANNED-PATTERNS.md" "$GREAT_MINDS_ROOT/BANNED-PATTERNS.md"
cp "$PLUGIN_ROOT/DO-NOT-REPEAT.md" "$GREAT_MINDS_ROOT/DO-NOT-REPEAT.md"

# Update CLAUDE.md - Add Daemon Sync Protocol section (idempotent)
if ! grep -q "## Daemon Sync Protocol" "$GREAT_MINDS_ROOT/CLAUDE.md" 2>/dev/null; then
  cat >> "$GREAT_MINDS_ROOT/CLAUDE.md" <<'EOF'

---

## Daemon Sync Protocol

**Source of Truth:** The daemon code in this repository is synced from the `great-minds-plugin` repository.

**DO NOT edit daemon files directly in this repo.** All changes must be made in the plugin repo and synced using:

```bash
cd /path/to/great-minds-plugin
npm run sync
```

**What gets synced:**
- All TypeScript files in `daemon/src/`
- `daemon/package.json`
- `daemon/README.md` (with warning banner)
- `BANNED-PATTERNS.md`
- `DO-NOT-REPEAT.md`
- This section of `CLAUDE.md`

**When to sync:**
- After editing any daemon code in the plugin repo
- After updating anti-hallucination rules or banned patterns
- Before running the daemon in production

The sync script:
1. Validates no uncommitted changes in destination
2. Copies all daemon files
3. Updates this CLAUDE.md file
4. Runs `npm install` to update dependencies
5. Commits and pushes changes

EOF
fi

# Update CLAUDE.md - Add Anti-Hallucination Rules section (idempotent)
if ! grep -q "## Anti-Hallucination Rules" "$GREAT_MINDS_ROOT/CLAUDE.md" 2>/dev/null; then
  cat >> "$GREAT_MINDS_ROOT/CLAUDE.md" <<'EOF'

---

## Anti-Hallucination Rules

The Great Minds pipeline enforces strict rules to prevent agents from building against hallucinated APIs or using incorrect patterns.

**Banned Patterns:** See `BANNED-PATTERNS.md` for the complete list. Key patterns that auto-fail QA:

- **Hardcoded paths** like `/Users/sethshoultes/` — breaks on other machines
- **`console.log`** in daemon code — bypasses structured logger
- **Unquoted path variables** — breaks with spaces in paths
- **API tokens/secrets** in code — security violation
- **Emdash-specific patterns** — incorrect API usage

**Enforcement:**

1. **Planner** must read `CLAUDE.md` and `docs/` before planning
2. **Builder** must read docs, `CLAUDE.md`, and `BANNED-PATTERNS.md` before writing code
3. **Builder** must grep own output for banned patterns before committing
4. **QA** must deploy and test against a live system
5. **QA** must run banned patterns grep — any match = automatic BLOCK

**How to check:**

```bash
# Check for banned patterns in code
grep -rn "throw new Response\|rc\.user\|rc\.pathParams\|process\.env" plugins/*/src/ --include="*.ts"

# Check for hardcoded paths
grep -rn '/Users/' agents/ crons/ skills/ templates/ --include="*.md" --include="*.sh"

# Check for secrets
grep -rn "cfat_\|sk-[a-zA-Z0-9]\{20,\}\|gho_" --include="*.md" --include="*.ts" --include="*.sh" .
```

Any match = BLOCK. Fix before passing QA.

EOF
fi

# =============================================================================
# Wave 3: Dependency Installation
# =============================================================================

cd "$GREAT_MINDS_ROOT/daemon"
npm install

# =============================================================================
# Wave 4: Git Operations
# =============================================================================

cd "$GREAT_MINDS_ROOT"
git add .
git commit -m "Sync daemon from plugin"

# Push to remote (allow failure for network issues)
git push || echo "⚠️  WARNING: git push failed (commit remains local)"

# =============================================================================
# Success
# =============================================================================

echo "Done."
