#!/bin/bash
# anatomy-hook.sh — Generates .wolf/anatomy.md file index with token estimates
# Inspired by OpenWolf's anatomy feature.
# Runs on SessionStart to give agents a map of the codebase.

set -uo pipefail

# Determine project directory
PROJECT_DIR="${PROJECT_DIR:-$(pwd)}"
WOLF_DIR="${PROJECT_DIR}/.wolf"
ANATOMY_FILE="${WOLF_DIR}/anatomy.md"

# Ensure .wolf directory exists
mkdir -p "$WOLF_DIR"

# Directories to ignore
IGNORE_DIRS="node_modules|\.git|dist|build|\.next|out|\.wolf|vendor|__pycache__|\.cache|coverage"

# File extensions to scan
EXTENSIONS="ts|tsx|js|jsx|py|sh|md|json|yaml|yml|toml|css|scss|html|php|rb|go|rs|java|sql|graphql|vue|svelte"

# Generate the anatomy file
cat > "$ANATOMY_FILE" << 'HEADER'
# File Anatomy

> Auto-generated index of source files sorted by estimated token count (descending).
> Agents should read expensive files last to preserve context window.
> Token estimate: lines x 4 (rough approximation).

| File | Lines | ~Tokens | Description |
|------|------:|--------:|-------------|
HEADER

# Find all source files, count lines, compute tokens, infer descriptions
# Uses a temp file to avoid subshell issues
TMPFILE=$(mktemp)

find "$PROJECT_DIR" -type f \
  | grep -v -E "/(${IGNORE_DIRS})/" \
  | grep -E "\.(${EXTENSIONS})$" \
  | while IFS= read -r filepath; do
    # Get relative path
    relpath="${filepath#${PROJECT_DIR}/}"

    # Count lines
    lines=$(wc -l < "$filepath" 2>/dev/null | tr -d ' ')
    [ -z "$lines" ] && lines=0

    # Estimate tokens
    tokens=$((lines * 4))

    # Infer description from path
    desc=""
    filename=$(basename "$filepath")
    dirname_part=$(dirname "$relpath")
    name_no_ext="${filename%.*}"
    ext="${filename##*.}"

    # Description inference based on path components and filename
    case "$relpath" in
      *test*|*spec*|*__test__*)    desc="Tests" ;;
      *config*|*conf*)             desc="Configuration" ;;
      *hook*|*hooks*)              desc="Hook handler" ;;
      *skill*|*SKILL*)             desc="Skill definition" ;;
      *agent*|*agents*)            desc="Agent definition" ;;
      *daemon*)                    desc="Daemon service" ;;
      *memory*|*store*)            desc="Memory/data store" ;;
      *pipeline*)                  desc="Pipeline orchestration" ;;
      *api*|*route*|*endpoint*)    desc="API endpoint" ;;
      *auth*)                      desc="Authentication" ;;
      *util*|*helper*|*lib*)       desc="Utility/helper" ;;
      *cli*|*command*)             desc="CLI command" ;;
      *template*|*tmpl*)           desc="Template" ;;
      *style*|*css*|*scss*)        desc="Styles" ;;
      *cron*|*schedule*)           desc="Scheduled task" ;;
      *log*|*logger*)              desc="Logging" ;;
      *health*)                    desc="Health check" ;;
      *dream*)                     desc="Dream/ideation" ;;
      *embed*)                     desc="Embeddings" ;;
      *import*|*export*)           desc="Import/export" ;;
      *README*|*readme*)           desc="Documentation" ;;
      *CLAUDE*|*claude*)           desc="Claude Code config" ;;
      *)
        # Fallback: humanize the filename
        desc=$(echo "$name_no_ext" | sed 's/[-_]/ /g' | sed 's/\b\(.\)/\U\1/g' 2>/dev/null || echo "$name_no_ext")
        [ -n "$dirname_part" ] && [ "$dirname_part" != "." ] && desc="$desc (${dirname_part})"
        ;;
    esac

    printf "%d\t| \`%s\` | %d | %d | %s |\n" "$tokens" "$relpath" "$lines" "$tokens" "$desc" >> "$TMPFILE"
  done

# Sort by token count descending and strip the sort key
sort -t$'\t' -k1 -rn "$TMPFILE" | cut -f2- >> "$ANATOMY_FILE"

# Add footer
TOTAL_FILES=$(wc -l < "$TMPFILE" | tr -d ' ')
TOTAL_TOKENS=$(awk -F'\t' '{sum+=$1} END {print sum}' "$TMPFILE" 2>/dev/null || echo "0")

cat >> "$ANATOMY_FILE" << EOF

---
**Total files:** ${TOTAL_FILES} | **Estimated total tokens:** ${TOTAL_TOKENS}
*Generated: $(date -u '+%Y-%m-%dT%H:%M:%SZ')*
EOF

rm -f "$TMPFILE"

# Output hook result
echo "{\"hookSpecificOutput\":{\"hookEventName\":\"AnatomyHook\",\"additionalContext\":\"[Anatomy] Generated .wolf/anatomy.md — ${TOTAL_FILES} files, ~${TOTAL_TOKENS} tokens indexed.\"}}"
