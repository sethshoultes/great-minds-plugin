#!/usr/bin/env bash
# Sync personas from root agents/ into both distribution targets.
# Root is the source of truth. Run after editing any persona.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/agents"
PLUGIN="$ROOT/distribution/plugin/agents"
DXT="$ROOT/distribution/dxt/server/personas"

if [[ ! -d "$SRC" ]]; then
  echo "ERROR: source dir not found: $SRC" >&2
  exit 1
fi

mkdir -p "$PLUGIN" "$DXT"

echo "Syncing personas from $SRC"
echo "  → $PLUGIN"
echo "  → $DXT"

# Clear stale personas in both targets, then copy fresh.
find "$PLUGIN" -maxdepth 1 -name "*.md" -delete
find "$DXT" -maxdepth 1 -name "*.md" -delete

cp "$SRC"/*.md "$PLUGIN/"
cp "$SRC"/*.md "$DXT/"

count=$(find "$SRC" -maxdepth 1 -name "*.md" | wc -l | tr -d ' ')
echo "Synced $count personas."

# Verify counts match
plugin_count=$(find "$PLUGIN" -maxdepth 1 -name "*.md" | wc -l | tr -d ' ')
dxt_count=$(find "$DXT" -maxdepth 1 -name "*.md" | wc -l | tr -d ' ')

if [[ "$count" != "$plugin_count" || "$count" != "$dxt_count" ]]; then
  echo "ERROR: count mismatch — source=$count plugin=$plugin_count dxt=$dxt_count" >&2
  exit 1
fi

echo "Done. Commit with:"
echo "  git add agents distribution && git commit -m 'sync: personas to distribution'"
