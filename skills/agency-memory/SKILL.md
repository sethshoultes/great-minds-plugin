# Agency Memory

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
cd "/Users/sethshoultes/Local Sites/great-minds/memory-store" && ./bin/memory search "$QUERY" --limit ${LIMIT:-5}
```

### Add

Store a new memory. Valid types: `learning`, `decision`, `qa-finding`, `board-review`, `retrospective`, `architecture`.

```bash
cd "/Users/sethshoultes/Local Sites/great-minds/memory-store" && ./bin/memory add \
  --type "$TYPE" \
  --agent "$AGENT" \
  --project "$PROJECT" \
  --content "$CONTENT"
```

### List

List memories filtered by type, agent, or project:

```bash
cd "/Users/sethshoultes/Local Sites/great-minds/memory-store" && ./bin/memory list --type "$TYPE"
cd "/Users/sethshoultes/Local Sites/great-minds/memory-store" && ./bin/memory list --agent "$AGENT"
cd "/Users/sethshoultes/Local Sites/great-minds/memory-store" && ./bin/memory list --project "$PROJECT"
```

### Import

Import existing markdown memories from the Great Minds project:

```bash
cd "/Users/sethshoultes/Local Sites/great-minds/memory-store" && ./bin/memory import
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
cd "/Users/sethshoultes/Local Sites/great-minds/memory-store" && ./bin/memory export
```

### Stats

Show memory store statistics:

```bash
cd "/Users/sethshoultes/Local Sites/great-minds/memory-store" && ./bin/memory stats
```

## Environment

- `OPENAI_API_KEY` — enables neural embeddings (text-embedding-3-small). Falls back to TF-IDF when absent.
- `MEMORY_DB` — custom path to SQLite database. Defaults to `memory-store/memory.db`.

## Design

- SQLite with WAL mode for concurrent reads
- Cosine similarity search over embedding vectors
- Content-hash embedding cache to avoid redundant API calls
- Works offline via TF-IDF fallback
- Runs locally and on DigitalOcean with no external services
