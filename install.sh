#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/sethshoultes/great-minds-plugin.git"
PLUGIN_ID="sethshoultes-great-minds-plugin"
PLUGIN_DIR="$HOME/.cache/plugins/github.com-sethshoultes-great-minds-plugin"
SETTINGS_FILE="$HOME/.claude/settings.json"

echo "==> Installing Great Minds plugin for Claude Code"

# 1. Clone or update the repo
if [ -d "$PLUGIN_DIR/.git" ]; then
  echo "    Plugin directory exists, pulling latest..."
  git -C "$PLUGIN_DIR" pull --ff-only
else
  echo "    Cloning repo to $PLUGIN_DIR..."
  mkdir -p "$(dirname "$PLUGIN_DIR")"
  git clone "$REPO_URL" "$PLUGIN_DIR"
fi

# 2. Ensure settings.json exists with valid JSON
mkdir -p "$HOME/.claude"
if [ ! -f "$SETTINGS_FILE" ]; then
  echo '{}' > "$SETTINGS_FILE"
  echo "    Created $SETTINGS_FILE"
fi

# 3. Patch settings.json — add marketplace source + enable the plugin
#    Uses python3 (available on macOS and most Linux) to safely merge JSON
python3 << 'PYEOF'
import json, sys, os

settings_file = os.path.expanduser("~/.claude/settings.json")

with open(settings_file, "r") as f:
    settings = json.load(f)

plugin_id = "sethshoultes-great-minds-plugin"
plugin_dir = os.path.expanduser("~/.cache/plugins/github.com-sethshoultes-great-minds-plugin")
enable_key = "great-minds@sethshoultes-great-minds-plugin"

changed = False

# Add extraKnownMarketplaces entry
markets = settings.setdefault("extraKnownMarketplaces", {})
expected = {"source": {"source": "directory", "path": plugin_dir}}
if markets.get(plugin_id) != expected:
    markets[plugin_id] = expected
    changed = True

# Enable the plugin
enabled = settings.setdefault("enabledPlugins", {})
if not enabled.get(enable_key):
    enabled[enable_key] = True
    changed = True

if changed:
    with open(settings_file, "w") as f:
        json.dump(settings, f, indent=2)
        f.write("\n")
    print("    Updated", settings_file)
else:
    print("    Settings already configured, no changes needed")
PYEOF

echo ""
echo "==> Done! Restart Claude Code to load the plugin."
echo "    Run /agency-start <project-name> to get started."
