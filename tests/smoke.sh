#!/usr/bin/env bash
# Plugin smoke tests for great-minds. Catches frontmatter regressions,
# version coherence drift, and DXT/manifest alignment for the curated
# subset of personas the DXT bundle exposes.
#
# Note: agents/ (22 files) is a superset of distribution/dxt/server/personas/
# (14 files) — great-minds added a Layer-3 developer team in v1.2 (backend-
# engineer, frontend-developer, code-reviewer, etc.) that the DXT bundle
# does not expose. The persona-count check here verifies DXT subset
# membership, NOT strict count equality.

set -uo pipefail

cd "$(dirname "$0")/.."

ERRORS=0
red() { printf '\033[31m%s\033[0m\n' "$1" >&2; }
green() { printf '\033[32m%s\033[0m\n' "$1"; }

# ---------- 1. Frontmatter validity ----------

echo "Checking SKILL.md frontmatter..."
for f in skills/*/SKILL.md; do
  if [ ! -f "$f" ]; then continue; fi
  if ! head -1 "$f" | grep -q '^---$'; then
    red "  FAIL: $f does not start with YAML frontmatter delimiter"
    ERRORS=$((ERRORS + 1))
    continue
  fi
  if ! awk '/^---$/{c++} c==1 && /^name: /{found=1} END{exit !found}' "$f"; then
    red "  FAIL: $f frontmatter is missing 'name:' field"
    ERRORS=$((ERRORS + 1))
  fi
  if ! awk '/^---$/{c++} c==1 && /^description: /{found=1} END{exit !found}' "$f"; then
    red "  FAIL: $f frontmatter is missing 'description:' field"
    ERRORS=$((ERRORS + 1))
  fi
done

echo "Checking persona frontmatter..."
for f in agents/*.md; do
  if [ ! -f "$f" ]; then continue; fi
  if ! head -1 "$f" | grep -q '^---$'; then
    red "  FAIL: $f does not start with YAML frontmatter delimiter"
    ERRORS=$((ERRORS + 1))
    continue
  fi
  if ! awk '/^---$/{c++} c==1 && /^name: /{found=1} END{exit !found}' "$f"; then
    red "  FAIL: $f frontmatter is missing 'name:' field"
    ERRORS=$((ERRORS + 1))
  fi
  if ! awk '/^---$/{c++} c==1 && /^description: /{found=1} END{exit !found}' "$f"; then
    red "  FAIL: $f frontmatter is missing 'description:' field"
    ERRORS=$((ERRORS + 1))
  fi
  if ! awk '/^---$/{c++} c==1 && /^model: /{found=1} END{exit !found}' "$f"; then
    red "  FAIL: $f frontmatter is missing 'model:' field"
    ERRORS=$((ERRORS + 1))
  fi
  if ! awk '/^---$/{c++} c==1 && /^color: /{found=1} END{exit !found}' "$f"; then
    red "  FAIL: $f frontmatter is missing 'color:' field"
    ERRORS=$((ERRORS + 1))
  fi
done

# ---------- 2. DXT bundle persona subset check ----------
#
# Every persona in distribution/dxt/server/personas/ MUST exist in agents/.
# (The reverse is not required — agents/ has Layer-3 developer roles that
# the DXT bundle does not expose.)

echo "Checking DXT persona subset against agents/..."
for dxt_persona in distribution/dxt/server/personas/*.md; do
  if [ ! -f "$dxt_persona" ]; then continue; fi
  fname=$(basename "$dxt_persona")
  if [ ! -f "agents/$fname" ]; then
    red "  FAIL: $dxt_persona has no source at agents/$fname"
    ERRORS=$((ERRORS + 1))
  fi
done

# ---------- 3. Version coherence ----------

echo "Checking version coherence..."
PKG_VERSION=$(grep '"version"' package.json | head -1 | sed 's/.*"version": *"\([^"]*\)".*/\1/')
PLUGIN_VERSION=$(grep '"version"' .claude-plugin/plugin.json | head -1 | sed 's/.*"version": *"\([^"]*\)".*/\1/')
DXT_PKG_VERSION=$(grep '"version"' distribution/dxt/package.json | head -1 | sed 's/.*"version": *"\([^"]*\)".*/\1/')
DXT_MANIFEST_VERSION=$(grep '"version"' distribution/dxt/manifest.json | head -1 | sed 's/.*"version": *"\([^"]*\)".*/\1/')
DXT_SERVER_VERSION=$(grep -oE 'version: *"[0-9.]+"' distribution/dxt/server/index.js | head -1 | sed 's/.*"\([^"]*\)".*/\1/')

if [ "$PKG_VERSION" != "$PLUGIN_VERSION" ] || \
   [ "$PKG_VERSION" != "$DXT_PKG_VERSION" ] || \
   [ "$PKG_VERSION" != "$DXT_MANIFEST_VERSION" ] || \
   [ "$PKG_VERSION" != "$DXT_SERVER_VERSION" ]; then
  red "  FAIL: version drift across config files:"
  red "        package.json:                       $PKG_VERSION"
  red "        .claude-plugin/plugin.json:         $PLUGIN_VERSION"
  red "        distribution/dxt/package.json:      $DXT_PKG_VERSION"
  red "        distribution/dxt/manifest.json:     $DXT_MANIFEST_VERSION"
  red "        distribution/dxt/server/index.js:   $DXT_SERVER_VERSION"
  ERRORS=$((ERRORS + 1))
fi

# ---------- 4. DXT tool definition / handler alignment ----------

echo "Checking DXT tool definitions vs handlers..."
TOOL_NAMES=$(grep -oE 'name: "[a-z_]+"' distribution/dxt/server/index.js | sed 's/name: "\(.*\)"/\1/' | sort -u)
HANDLER_NAMES=$(grep -oE 'name === "[a-z_]+"' distribution/dxt/server/index.js | sed 's/name === "\(.*\)"/\1/' | sort -u)

MISSING_HANDLERS=$(comm -23 <(echo "$TOOL_NAMES") <(echo "$HANDLER_NAMES"))
MISSING_DEFS=$(comm -13 <(echo "$TOOL_NAMES") <(echo "$HANDLER_NAMES"))

if [ -n "$MISSING_HANDLERS" ]; then
  red "  FAIL: tool defined in DXT manifest but no handler:"
  echo "$MISSING_HANDLERS" | sed 's/^/        /' >&2
  ERRORS=$((ERRORS + 1))
fi
if [ -n "$MISSING_DEFS" ]; then
  red "  FAIL: handler in DXT but no tool definition:"
  echo "$MISSING_DEFS" | sed 's/^/        /' >&2
  ERRORS=$((ERRORS + 1))
fi

# ---------- 5. v1.3+ constellation-start skill check ----------

echo "Checking v1.3+ constellation-start skill exists..."
# Numeric major.minor compare (lexicographic compare would break at v1.10).
PKG_MAJOR=$(echo "$PKG_VERSION" | cut -d. -f1)
PKG_MINOR=$(echo "$PKG_VERSION" | cut -d. -f2)
if [ "$PKG_MAJOR" -gt 1 ] || { [ "$PKG_MAJOR" -eq 1 ] && [ "$PKG_MINOR" -ge 3 ]; }; then
  if [ ! -f "skills/constellation-start/SKILL.md" ]; then
    red "  FAIL: v1.3+ requires skills/constellation-start/SKILL.md (constellation entry point)"
    ERRORS=$((ERRORS + 1))
  fi
  if ! grep -q "constellation_start" distribution/dxt/server/index.js; then
    red "  FAIL: v1.3+ requires constellation_start tool in DXT server (constellation entry point)"
    ERRORS=$((ERRORS + 1))
  fi
fi

# ---------- Summary ----------

echo ""
if [ "$ERRORS" -eq 0 ]; then
  green "✓ All smoke tests passed."
  exit 0
else
  red "✗ $ERRORS check(s) failed."
  exit 1
fi
