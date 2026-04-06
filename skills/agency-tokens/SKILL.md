---
name: agency-tokens
description: View token usage statistics from the token ledger — session, project, agent, and lifetime totals.
argument-hint: [session|project <name>|agent <name>|lifetime|recent]
allowed-tools: [Read, Bash]
---

# Agency Tokens — Token Usage Dashboard

View token usage and cost statistics from the Great Minds daemon.

## Context

The daemon logs token usage for every agent call into a SQLite `token_ledger` table. This skill queries that data to show usage breakdowns.

## Instructions

### Step 1: Parse Arguments

Parse `$ARGUMENTS` for the view type:
- `session` — current session totals (default if no args)
- `project <name>` — totals for a specific project
- `agent <name>` — totals for a specific agent
- `lifetime` — all-time totals
- `recent` — last 20 entries

### Step 2: Query the Ledger

The token ledger database is at the same path as the memory store (`memory.db` in the memory-store directory, or as specified by `MEMORY_DB` env var).

Run queries against the `token_ledger` table:

```sql
-- Session total
SELECT SUM(input_tokens), SUM(output_tokens), SUM(estimated_cost), COUNT(*) FROM token_ledger WHERE session_id = ?;

-- Project total
SELECT SUM(input_tokens), SUM(output_tokens), SUM(estimated_cost), COUNT(*) FROM token_ledger WHERE project = ?;

-- Agent total
SELECT SUM(input_tokens), SUM(output_tokens), SUM(estimated_cost), COUNT(*) FROM token_ledger WHERE agent = ?;

-- Lifetime
SELECT SUM(input_tokens), SUM(output_tokens), SUM(estimated_cost), COUNT(*) FROM token_ledger;

-- Recent entries
SELECT * FROM token_ledger ORDER BY id DESC LIMIT 20;
```

### Step 3: Format Output

Display results as a formatted table:

```
Token Usage: [scope]
═══════════════════════════════════════
  Input tokens:   1,234,567
  Output tokens:    456,789
  Total tokens:   1,691,356
  Estimated cost: $12.34
  Agent calls:    42
═══════════════════════════════════════
```

For `lifetime`, also show:
- Top 5 agents by cost
- Top 5 projects by cost

### Step 4: Cost Warnings

- If session cost > $5, warn about high usage
- If any single agent call > $1, flag it
- Suggest using smaller models (Haiku) for repetitive tasks
