# Great Minds Memory Store

Lightweight vector store for the Great Minds agency memory system. Replaces flat markdown files with searchable embeddings backed by SQLite.

## Setup

```bash
cd memory-store
npm install
```

## Usage

### Add a memory

```bash
./bin/memory add --type learning --agent "Elon Musk" --project "Dash" \
  --content "tmux dispatch failed, use worktrees instead"
```

### Search by semantic similarity

```bash
./bin/memory search "how to dispatch agents" --limit 5
```

### List memories

```bash
./bin/memory list --type decision --project "LocalGenius"
./bin/memory list --agent "Jensen Huang"
./bin/memory list --type board-review
```

### Import existing files

```bash
# Import all memory/, rounds/, and MEMORY.md
./bin/memory import

# Import a single file
./bin/memory import --file ../memory/operational-learnings.md
```

### Export to markdown

```bash
./bin/memory export
./bin/memory export --output MEMORY-EXPORT.md
```

### Stats

```bash
./bin/memory stats
```

### Remove a memory

```bash
./bin/memory remove --id 42
```

## Memory Types

| Type | Description |
|------|-------------|
| `learning` | Operational learnings, patterns discovered |
| `decision` | Locked decisions from debate rounds |
| `qa-finding` | QA reports from Margaret Hamilton |
| `board-review` | Board reviews from Jensen Huang |
| `retrospective` | Post-project retrospectives |
| `architecture` | Architecture and design decisions |

## Embedding Providers

- **OpenAI** (default when `OPENAI_API_KEY` is set): Uses `text-embedding-3-small` (1536 dimensions). Best quality semantic search.
- **TF-IDF** (fallback): Works offline with no API key. Basic keyword-weighted similarity. Adequate for most agency queries.

Embeddings are cached by content hash to avoid re-embedding identical content.

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | OpenAI API key for neural embeddings |
| `MEMORY_DB` | Custom path for the SQLite database file |

## Architecture

- **SQLite** via `better-sqlite3` — zero external dependencies, runs locally and on DO
- **Cosine similarity** search over stored embeddings
- **Content-hash cache** prevents duplicate embedding API calls
- **TF-IDF fallback** means the store works without internet

## Database Schema

```sql
memories (id, type, agent, project, content, embedding BLOB, created_at, updated_at)
embeddings_cache (content_hash, embedding BLOB)
```
