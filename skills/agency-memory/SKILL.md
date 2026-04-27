---
name: agency-memory
description: Query and manage the Great Minds agency vector store — semantic search over memories stored in SQLite with embeddings. Subcommands - search, add, list, import, export, stats. Filters by type (learning, decision, board-review), agent, project. Use to recall prior decisions, learnings, or critiques across multiple agency projects.
argument-hint: <subcommand> [options]
allowed-tools: [Bash, Read, Write]
---

# /agency-memory

Query and manage the Great Minds agency vector store. Memories are stored in SQLite with embeddings for semantic search.

## Usage

```
/agency-memory search "query text"
/agency-memory add --type learning "content here"
/agency-memory add --type decision --agent "Steve Jobs" --project "Dash" "content"
/agency-memory list --type board-review
/agency-memory list --agent "Jensen Huang"
/agency-memory import
/agency-memory export
/agency-memory stats
```

## Instructions

When this skill is invoked, run the memory CLI from the memory-store directory.

### Search

Find relevant memories by semantic similarity:

```bash
cd "${PIPELINE_REPO:-$(git rev-parse --show-toplevel)}/memory-store" && ./bin/memory search "$QUERY" --limit ${LIMIT:-5}
```

### Add

Store a new memory. Valid types: `learning`, `decision`, `qa-finding`, `board-review`, `retrospective`, `architecture`.

```bash
cd "${PIPELINE_REPO:-$(git rev-parse --show-toplevel)}/memory-store" && ./bin/memory add \
  --type "$TYPE" \
  --agent "$AGENT" \
  --project "$PROJECT" \
  --content "$CONTENT"
```

### List

List memories filtered by type, agent, or project:

```bash
cd "${PIPELINE_REPO:-$(git rev-parse --show-toplevel)}/memory-store" && ./bin/memory list --type "$TYPE"
cd "${PIPELINE_REPO:-$(git rev-parse --show-toplevel)}/memory-store" && ./bin/memory list --agent "$AGENT"
cd "${PIPELINE_REPO:-$(git rev-parse --show-toplevel)}/memory-store" && ./bin/memory list --project "$PROJECT"
```

### Import

Import existing markdown memories from the Great Minds project:

```bash
cd "${PIPELINE_REPO:-$(git rev-parse --show-toplevel)}/memory-store" && ./bin/memory import
```

This parses:
- `MEMORY.md` index (key learnings)
- `memory/*.md` files (operational learnings, architecture decisions, research)
- `rounds/*/decisions.md` (locked project decisions)
- `rounds/*/board-review-*.md` (Jensen Huang board reviews)
- `rounds/*/qa-report-*.md` (Margaret Hamilton QA findings)

### Export

Export all memories back to markdown for compatibility:

```bash
cd "${PIPELINE_REPO:-$(git rev-parse --show-toplevel)}/memory-store" && ./bin/memory export
```

### Stats

Show memory store statistics:

```bash
cd "${PIPELINE_REPO:-$(git rev-parse --show-toplevel)}/memory-store" && ./bin/memory stats
```

## Maintenance

### Prune

Remove duplicate memories (cosine similarity > 0.92) and low-value entries (e.g., "all green" board reviews, "PASS" QA findings):

```bash
cd "${PIPELINE_REPO:-$(git rev-parse --show-toplevel)}/memory-store" && ./bin/memory prune
cd "${PIPELINE_REPO:-$(git rev-parse --show-toplevel)}/memory-store" && ./bin/memory prune --threshold 0.85
```

### Consolidate

Find clusters of similar memories (similarity > 0.75) and merge them into single stronger entries:

```bash
cd "${PIPELINE_REPO:-$(git rev-parse --show-toplevel)}/memory-store" && ./bin/memory consolidate
cd "${PIPELINE_REPO:-$(git rev-parse --show-toplevel)}/memory-store" && ./bin/memory consolidate --threshold 0.80
```

### Optimize

Score all memories by recency, uniqueness, and richness. Remove the bottom 10% by score:

```bash
cd "${PIPELINE_REPO:-$(git rev-parse --show-toplevel)}/memory-store" && ./bin/memory optimize
cd "${PIPELINE_REPO:-$(git rev-parse --show-toplevel)}/memory-store" && ./bin/memory optimize --percentile 20
```

### Maintain

Run the full maintenance cycle (prune + consolidate + optimize) in sequence. This is what the dream cron calls automatically:

```bash
cd "${PIPELINE_REPO:-$(git rev-parse --show-toplevel)}/memory-store" && ./bin/memory maintain
```

## Environment

- `OPENAI_API_KEY` — enables neural embeddings (text-embedding-3-small). Falls back to TF-IDF when absent.
- `MEMORY_DB` — custom path to SQLite database. Defaults to `memory-store/memory.db`.

## Bundled Store

The memory store also ships with this plugin at `memory-store/`. Any installation gets a fresh copy. Install dependencies before first use:

```bash
cd "/path/to/great-minds-plugin/memory-store" && npm install
```

## Design

- SQLite with WAL mode for concurrent reads
- Cosine similarity search over embedding vectors
- Content-hash embedding cache to avoid redundant API calls
- Works offline via TF-IDF fallback
- Runs locally and on DigitalOcean with no external services
