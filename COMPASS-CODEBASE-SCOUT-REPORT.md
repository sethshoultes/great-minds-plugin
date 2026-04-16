# Compass Codebase Scout Report
**Portfolio Analytics Foundation — Build Foundation**

**Date:** 2026-04-16
**Scout:** Codebase Scout
**Status:** Ready for Implementation
**Confidence Level:** High (all relevant patterns identified)

---

## Executive Summary

This report maps the Great Minds Plugin codebase for the **Compass** (Portfolio Analytics Foundation) project. Key findings:

1. **No existing analytics database** — Clean slate. SQLite should be created in `/Users/sethshoultes/Local Sites/great-minds-plugin/compass/` directory.
2. **REST endpoint patterns established** — WP Autopilot demonstrates WordPress REST API patterns we can follow.
3. **Database/storage patterns exist** — Memory Store (SQLite + embeddings) and Token Ledger show mature SQLite implementations.
4. **Configuration patterns established** — Daemon uses environment variables and TypeScript config files; MemoryStore uses better-sqlite3.
5. **Scheduled task infrastructure exists** — Daemon with event loop (chokidar file watcher, timers) for periodic tasks.
6. **No cron jobs needed** — The daemon can handle scheduling; fallback to WordPress hooks if needed for plugin environment.

**Critical Success Factors:**
- Keep it simple: SQLite + HTTP endpoint only (no PostHog, no ClickHouse)
- Reuse existing patterns from Memory Store and Token Ledger for database layer
- Follow WordPress REST API patterns from WP Autopilot for endpoint design
- Design for daily text summaries first (Week 1), UI dashboard later (Week 12)

---

## Part 1: File Structure & Architecture Overview

### Root Project Layout

```
/Users/sethshoultes/Local Sites/great-minds-plugin/
├── daemon/                       # Node.js daemon (TypeScript)
│   ├── src/
│   │   ├── config.ts            # Configuration (paths, intervals, environment)
│   │   ├── daemon.ts            # Main event loop
│   │   ├── token-ledger.ts       # SQLite token tracking
│   │   ├── git-intelligence.ts   # Git analysis
│   │   └── agents.ts            # Agent prompts
│   ├── package.json             # npm dependencies
│   └── .env.example             # Environment template
│
├── memory-store/                 # Node.js SQLite vector store
│   ├── src/
│   │   ├── store.ts             # SQLite + embeddings class
│   │   ├── embeddings.ts        # Embedding providers
│   │   └── config-schema.ts     # Configuration schema
│   ├── memory.db                # SQLite database (WAL mode)
│   ├── package.json
│   └── tsconfig.json
│
├── deliverables/
│   └── wp-autopilot/            # WordPress plugin example
│       └── wp-autopilot/
│           ├── wp-autopilot.php         # Plugin entry point
│           ├── includes/
│           │   ├── class-chat-handler.php        # REST endpoint handler
│           │   ├── class-api-client.php          # External API client
│           │   ├── class-context-collector.php   # Data collector
│           │   └── class-action-executor.php     # Action execution
│           └── admin/
│               ├── class-settings-page.php       # Settings UI
│               └── views/
│
├── rounds/
│   └── portfolio-analytics-foundation/  # Design decisions
│       ├── decisions.md                 # LOCKED architecture decisions
│       ├── round-1-steve.md
│       ├── round-1-elon.md
│       └── essence.md
│
├── prds/
│   └── portfolio-analytics-foundation.md   # Full PRD
│
└── .planning/                    # Project planning files
```

---

## Part 2: Existing Database/Storage Patterns

### Pattern 1: Memory Store (SQLite + Embeddings)
**Location:** `/Users/sethshoultes/Local Sites/great-minds-plugin/memory-store/src/store.ts`

**What it does:**
- Uses `better-sqlite3` for SQLite access
- Implements vector search with cosine similarity
- Manages embeddings cache (TF-IDF + OpenAI)
- Provides CRUD operations, search, clustering

**Key Implementation Details:**
```typescript
// Database initialization
private initSchema(): void {
  this.db.exec(`
    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      agent TEXT NOT NULL DEFAULT '',
      project TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      embedding BLOB,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
    CREATE INDEX IF NOT EXISTS idx_memories_agent ON memories(agent);
    CREATE INDEX IF NOT EXISTS idx_memories_project ON memories(project);
  `);
}

// Constructor pattern
constructor(dbPath?: string, embedder?: EmbeddingProvider) {
  const resolvedPath = dbPath || path.join(process.cwd(), 'memory.db');
  this.db = new Database(resolvedPath);
  this.db.pragma('journal_mode = WAL');  // Write-Ahead Logging
  this.db.pragma('foreign_keys = ON');
  this.initSchema();
}
```

**Why Relevant:** This is the **gold standard** for how to structure Compass's SQLite implementation.

**Dependencies:**
- `better-sqlite3` (^11.7.0) — synchronous SQLite driver
- Native Node.js `path`, `fs`

---

### Pattern 2: Token Ledger (SQLite for Metrics)
**Location:** `/Users/sethshoultes/Local Sites/great-minds-plugin/daemon/src/token-ledger.ts`

**What it does:**
- Tracks token usage per agent call
- Calculates estimated costs
- Provides aggregation queries (session, project, agent, lifetime)
- Returns top agents/projects by cost

**Key Implementation Details:**
```typescript
// Schema similar to Compass needs
CREATE TABLE IF NOT EXISTS token_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  agent TEXT NOT NULL,
  project TEXT NOT NULL DEFAULT '',
  phase TEXT NOT NULL DEFAULT '',
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  estimated_cost REAL NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ledger_session ON token_ledger(session_id);
CREATE INDEX IF NOT EXISTS idx_ledger_agent ON token_ledger(agent);
CREATE INDEX IF NOT EXISTS idx_ledger_project ON token_ledger(project);

// Query pattern (aggregation)
getSessionTotal(): TokenSummary {
  const row = this.db.prepare(`
    SELECT
      COALESCE(SUM(input_tokens), 0) as totalInputTokens,
      COALESCE(SUM(output_tokens), 0) as totalOutputTokens,
      COALESCE(SUM(estimated_cost), 0) as totalCost,
      COUNT(*) as entries
    FROM token_ledger
    WHERE session_id = ?
  `).get(this.sessionId) as TokenSummary;
  return row;
}
```

**Why Relevant:** Shows pattern for aggregation queries (DAU, retention, revenue calculations).

**Dependencies:**
- `better-sqlite3` (same as Memory Store)

---

### Pattern 3: Configuration Schema (TypeScript)
**Location:** `/Users/sethshoultes/Local Sites/great-minds-plugin/memory-store/src/config-schema.ts`

**What it does:**
- Validates configuration structures
- Provides runtime type checking
- Used for build setup configuration

**Why Relevant:** Compass will need to validate event schema at ingest time.

---

## Part 3: Existing HTTP Endpoint Patterns

### WordPress REST API Pattern (WP Autopilot)
**Location:** `/Users/sethshoultes/Local Sites/great-minds-plugin/deliverables/wp-autopilot/wp-autopilot/includes/class-chat-handler.php`

**Key Code:**
```php
// Register REST API routes
public function register_routes() {
    register_rest_route('wp-autopilot/v1', '/chat', array(
        'methods' => 'POST',
        'callback' => array($this, 'handle_chat_request'),
        'permission_callback' => array($this, 'check_permissions')
    ));

    register_rest_route('wp-autopilot/v1', '/history', array(
        'methods' => 'GET',
        'callback' => array($this, 'get_chat_history'),
        'permission_callback' => array($this, 'check_permissions')
    ));
}

// Permission check
public function check_permissions() {
    return current_user_can('edit_posts');
}

// Request handler
public function handle_chat_request($request) {
    $message = $request->get_param('message');

    if (empty($message)) {
        return new WP_REST_Response(array(
            'success' => false,
            'error' => __('Message cannot be empty.', 'wp-autopilot')
        ), 400);
    }

    $message = sanitize_textarea_field($message);

    // ... implementation

    return new WP_REST_Response(array(
        'success' => true,
        'data' => $result
    ), 200);
}
```

**Why Relevant:** Compass needs an HTTP endpoint. This shows WordPress REST API pattern. However, for analytics ingest endpoint:
- Can be simpler (no permission checks for event tracking)
- Should be lightweight (async to not block client)
- Could follow similar route registration pattern

**Patterns to Reuse:**
- Route registration with namespace/version: `wp-json/compass/v1/events`
- Nonce-based validation (if user-authenticated)
- JSON response with success/error fields
- HTTP status codes (200, 400, 401, 403)

---

## Part 4: Cron Job & Scheduled Task Patterns

### Daemon Event Loop Pattern
**Location:** `/Users/sethshoultes/Local Sites/great-minds-plugin/daemon/src/daemon.ts`

**What it does:**
- Main event loop using Chokidar file watcher
- Manages multiple timers (intervals)
- Processes queue of work
- Handles cleanup and recovery

**Key Code Structure:**
```typescript
import { watch } from "chokidar";
import { INTERVALS, PRDS_DIR } from "./config.js";

// Track last-run timestamps
let lastHeartbeat = 0;
let lastGitHubPoll = 0;
let lastDream = 0;
let lastMemoryMaintain = 0;

// Queue persisted to disk
const prdQueue: string[] = [];
const QUEUE_FILE = resolve(REPO_PATH, ".daemon-queue.json");

// File watcher for file-based triggers
const watcher = watch(PRDS_DIR, {
    ignored: /(^|[\/\\])\.|node_modules/,
    persistent: true,
    awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 100 }
});

watcher.on('add', (filePath) => {
    const slug = basename(filePath, '.md');
    if (!isAlreadyProcessed(`${slug}.md`)) {
        prdQueue.push(slug);
        saveQueue();
    }
});

// Main loop with interval checks
async function mainLoop() {
    while (!shuttingDown) {
        const now = Date.now();

        // Process queue
        if (prdQueue.length > 0 && !pipelineRunning) {
            const slug = prdQueue.shift();
            await runPipeline(slug);
            saveQueue();
        }

        // Heartbeat check (every HEARTBEAT_MS)
        if (now - lastHeartbeat > INTERVALS.HEARTBEAT_MS) {
            await runHeartbeat();
            lastHeartbeat = now;
        }

        // GitHub poll (every GITHUB_POLL_MS)
        if (now - lastGitHubPoll > INTERVALS.GITHUB_POLL_MS) {
            await pollGitHub();
            lastGitHubPoll = now;
        }

        // Dream cycle (every DREAM_MS when idle)
        if (!pipelineRunning && now - lastDream > INTERVALS.DREAM_MS) {
            await runFeatureDream();
            lastDream = now;
        }

        // Memory maintenance (every MEMORY_MAINTAIN_MS)
        if (now - lastMemoryMaintain > INTERVALS.MEMORY_MAINTAIN_MS) {
            await runMemoryMaintenance();
            lastMemoryMaintain = now;
        }

        // Sleep before next iteration
        await sleep(INTERVALS.LOOP_TICK_MS);
    }
}
```

**Why Relevant for Compass:**
- For **daily text summaries**: Can use a scheduler (Node.js setInterval, or WordPress wp_schedule_event)
- Pattern shows how to manage time-based triggers without cron
- Could run "calculate summaries" task every 24 hours

**Alternative: WordPress Hook Pattern**
For WordPress integration, use `wp_schedule_event`:
```php
// In activation hook
wp_schedule_event(time(), 'daily', 'compass_generate_daily_summary');

// In main plugin file
add_action('compass_generate_daily_summary', array($this, 'generateDailySummary'));

// In deactivation hook
wp_clear_scheduled_hook('compass_generate_daily_summary');
```

---

## Part 5: Configuration File Patterns

### Daemon Configuration
**Location:** `/Users/sethshoultes/Local Sites/great-minds-plugin/daemon/src/config.ts`

**Pattern:**
```typescript
// Paths
export const REPO_PATH = process.env.PIPELINE_REPO || resolve(__dirname, "../..");
export const PLUGIN_PATH = resolve(REPO_PATH, "../great-minds-plugin");
export const PRDS_DIR = resolve(REPO_PATH, "prds");
export const DELIVERABLES_DIR = resolve(REPO_PATH, "deliverables");

// Intervals (milliseconds)
export const INTERVALS = {
    GITHUB_POLL_MS: 5 * 60 * 1000,      // 5 minutes
    HEARTBEAT_MS: 5 * 60 * 1000,        // 5 minutes
    DREAM_MS: 4 * 60 * 60 * 1000,       // 4 hours
    MEMORY_MAINTAIN_MS: 6 * 60 * 60 * 1000,  // 6 hours
    LOOP_TICK_MS: 30 * 1000,            // 30 seconds
};

// Environment variables with defaults
export const AGENT_TIMEOUT_MS = Number(process.env.AGENT_TIMEOUT_MS) || 20 * 60 * 1000;
export const PIPELINE_TIMEOUT_MS = Number(process.env.PIPELINE_TIMEOUT_MS) || 60 * 60 * 1000;
```

**Why Relevant:** Compass should follow similar pattern:
- Use `COMPASS_DB_PATH` for database location
- Use `COMPASS_SUMMARY_INTERVAL` for daily summary schedule
- Use `.env` file with defaults

### Environment Template
**Location:** `/Users/sethshoultes/Local Sites/great-minds-plugin/daemon/.env.example`

**Pattern:**
```bash
# Authentication
CLAUDE_CONFIG_DIR=~/.claude
GIT_CONFIG=~/.gitconfig

# Optional: API keys
OPENAI_API_KEY=sk-...
RESEND_API_KEY=re_...

# Optional: Timeouts
AGENT_TIMEOUT_MS=600000
PIPELINE_TIMEOUT_MS=3600000

# Notifications
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

**Why Relevant:** Compass `.env.example` should include:
```bash
# Compass — Analytics Database
COMPASS_DB_PATH=./compass/compass.db
COMPASS_SUMMARY_INTERVAL=86400000  # 24 hours in ms
COMPASS_ENABLE_EMAIL=false
COMPASS_SUMMARY_RECIPIENT=admin@example.com
```

---

## Part 6: Integration Points & Product Locations

### The 5 Products to Integrate

Based on PRD and config files:

| Product | Type | Location | Integration Point |
|---------|------|----------|-------------------|
| **Pinned** | WordPress Plugin | `sethshoultes/pinned-notes` | REST endpoint for note events |
| **Dash** | WordPress Plugin | `sethshoultes/dash-command-bar` | REST endpoint for command events |
| **LocalGenius** | Web App | `sethshoultes/localgenius` | HTTPS POST to Compass endpoint |
| **Great Minds** | Node.js CLI/Daemon | `sethshoultes/great-minds` | Direct class instantiation or HTTP |
| **Shipyard** | Web App | `sethshoultes/shipyard-ai` | HTTPS POST to Compass endpoint |

**Event Schema (from PRD):**
```json
{
  "product": "pinned|dash|localgenius|great-minds|shipyard",
  "event": "note_created|command_executed|trial_start|prd_submitted|project_started",
  "user_id": "anonymous_hash_or_user_id",
  "timestamp": "2026-04-16T10:30:00Z",
  "properties": {
    "duration_ms": 1234,
    "feature": "advanced_search",
    "revenue_cents": 0
  }
}
```

---

## Part 7: Existing Patterns to Follow

### SQLite Pattern (Memory Store)

**Table Schema Pattern:**
```sql
CREATE TABLE IF NOT EXISTS memories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  agent TEXT NOT NULL,
  project TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
CREATE INDEX IF NOT EXISTS idx_memories_agent ON memories(agent);
CREATE INDEX IF NOT EXISTS idx_memories_project ON memories(project);
```

**Compass Event Table Pattern (RECOMMENDED):**
```sql
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product TEXT NOT NULL,           -- pinned|dash|localgenius|great-minds|shipyard
  event TEXT NOT NULL,             -- note_created|command_executed|etc
  user_hash TEXT NOT NULL,         -- anonymized user identifier
  timestamp TEXT NOT NULL,         -- ISO8601
  properties TEXT,                 -- JSON properties
  revenue_cents INTEGER DEFAULT 0, -- for revenue tracking
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_product ON events(product);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_event ON events(event);
CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_hash);
```

### REST Endpoint Pattern (WP Autopilot)

**Recommended Compass Endpoint:**
```php
<?php
// compass/includes/class-event-handler.php

class Compass_Event_Handler {

    public function register_routes() {
        register_rest_route('compass/v1', '/events', array(
            'methods' => 'POST',
            'callback' => array($this, 'ingest_event'),
            'permission_callback' => '__return_true'  // Public endpoint
        ));

        register_rest_route('compass/v1', '/summary', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_summary'),
            'permission_callback' => array($this, 'check_admin')
        ));
    }

    public function ingest_event($request) {
        $event = $request->get_json_params();

        // Validate event schema
        if (!$this->validate_event($event)) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => 'Invalid event schema'
            ), 400);
        }

        // Insert into database (async, non-blocking)
        $db = new Compass_Database();
        $db->insert_event($event);

        return new WP_REST_Response(array(
            'success' => true,
            'event_id' => $event['id']
        ), 201);
    }

    public function get_summary($request) {
        $period = $request->get_param('period') ?? '7d';
        $db = new Compass_Database();
        $summary = $db->get_summary($period);

        return new WP_REST_Response($summary, 200);
    }

    private function check_admin() {
        return current_user_can('manage_options');
    }

    private function validate_event($event) {
        return isset($event['product'], $event['event'],
                     $event['user_hash'], $event['timestamp']);
    }
}
?>
```

### Class Instantiation Pattern (Token Ledger)

**Pattern to Follow:**
```typescript
// Easy initialization
const ledger = new TokenLedger(dbPath);

// Insert records
ledger.logUsage({
    timestamp: new Date().toISOString(),
    agent: 'builder',
    project: 'portfolio-analytics',
    phase: 'build',
    inputTokens: 2000,
    outputTokens: 500,
    estimatedCost: 0.0123
});

// Query aggregates
const sessionTotal = ledger.getSessionTotal();
const projectTotal = ledger.getProjectTotal('portfolio-analytics');
const topAgents = ledger.getTopAgents(10);

// Cleanup
ledger.close();
```

**Compass Database Class (RECOMMENDED):**
```typescript
// compass/src/database.ts

export class CompassDatabase {
    private db: Database.Database;

    constructor(dbPath = './compass/compass.db') {
        this.db = new Database(dbPath);
        this.db.pragma('journal_mode = WAL');
        this.initSchema();
    }

    insertEvent(event: CompassEvent): number {
        const result = this.db.prepare(`
            INSERT INTO events (product, event, user_hash, timestamp, properties, revenue_cents)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            event.product,
            event.event,
            event.user_hash,
            event.timestamp,
            JSON.stringify(event.properties || {}),
            event.revenue_cents || 0
        );
        return result.lastInsertRowid as number;
    }

    getDAU(product: string, days = 1): number {
        const cutoff = new Date(Date.now() - days * 86400000).toISOString();
        const row = this.db.prepare(`
            SELECT COUNT(DISTINCT user_hash) as dau
            FROM events
            WHERE product = ? AND timestamp >= ?
        `).get(product, cutoff) as { dau: number };
        return row.dau;
    }

    getRetention7d(product: string): number {
        // Cohort analysis: users active in week 1 who return in week 2
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString();

        // Complex query combining D1 and D7+ data
        const row = this.db.prepare(`
            SELECT
                COUNT(DISTINCT CASE WHEN timestamp >= ? AND timestamp < ?
                                   THEN user_hash END) as cohort_size,
                COUNT(DISTINCT CASE WHEN timestamp >= ?
                                   THEN user_hash END) as returned
            FROM events
            WHERE product = ?
        `).get(weekAgo, twoWeeksAgo, weekAgo, product);

        if (row.cohort_size === 0) return 0;
        return Math.round((row.returned / row.cohort_size) * 100);
    }

    getSummary(product: string, days = 7): CompassSummary {
        return {
            product,
            dau: this.getDAU(product, 1),
            retention_7d: this.getRetention7d(product),
            revenue_per_user: this.getRevenuePerUser(product, days)
        };
    }

    close(): void {
        this.db.close();
    }
}
```

---

## Part 8: Suggested File Structure for Compass

### Recommended Directory Layout

```
compass/                                # New directory for Compass
├── compass.php                         # Main plugin file (if WordPress)
├── compass.db                          # SQLite database (created at runtime)
├── .env.example                        # Environment template
├── README.md                           # Documentation
│
├── includes/                           # PHP classes (WordPress pattern)
│   ├── class-database.php              # SQLite wrapper
│   ├── class-event-handler.php         # REST endpoint
│   ├── class-summary-generator.php     # Daily summary logic
│   └── class-validator.php             # Event schema validation
│
├── src/                                # Node.js/TypeScript (if standalone)
│   ├── database.ts                     # SQLite class (using better-sqlite3)
│   ├── event-handler.ts                # HTTP endpoint (Express.js)
│   ├── summary-generator.ts            # Daily summary generation
│   └── config.ts                       # Configuration (paths, intervals)
│
├── admin/                              # WordPress admin pages
│   ├── class-settings-page.php         # Configuration UI
│   └── views/
│       └── settings.php                # Settings template
│
├── assets/                             # Frontend files (if dashboard needed)
│   ├── js/dashboard.js
│   ├── css/dashboard.css
│   └── css/admin.css
│
├── templates/                          # Email/text summary templates
│   ├── daily-summary.txt
│   └── weekly-digest.txt
│
├── tests/                              # Test files
│   ├── database.test.ts
│   ├── event-handler.test.ts
│   └── summary-generator.test.ts
│
├── bin/                                # CLI utilities
│   ├── generate-summary                # Generate summary on demand
│   └── migrate-db                      # Migration scripts
│
├── queries/                            # SQL queries for reports
│   ├── dau.sql                         # Daily active users
│   ├── retention.sql                   # Retention calculation
│   ├── revenue.sql                     # Revenue metrics
│   └── summary.sql                     # Full summary aggregation
│
└── docs/                               # Documentation
    ├── SCHEMA.md                       # Database schema
    ├── API.md                          # Endpoint documentation
    ├── INTEGRATION.md                  # Product integration guide
    └── VOICE.md                        # Brand voice guidelines
```

---

## Part 9: Dependencies & Technology Stack

### Recommended Dependencies

**For Node.js/TypeScript version:**
```json
{
  "dependencies": {
    "better-sqlite3": "^11.7.0",
    "express": "^4.18.0",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.12",
    "@types/node": "^22.10.0",
    "typescript": "^5.7.0",
    "vitest": "^2.0.0"
  }
}
```

**For WordPress version:**
```
- WordPress 6.0+ (existing requirement)
- PHP 7.4+ (existing requirement)
- SQLite (bundled with WordPress 6.2+, or use SQLite Database Integration plugin)
```

**External APIs (optional, for future):**
- Resend or SendGrid (email summaries)
- Telegram Bot API (notifications)

---

## Part 10: Critical Patterns to Reuse

### 1. Database Initialization Pattern
✅ **From:** Memory Store (`store.ts`)
✅ **To Apply To:** `compass/includes/class-database.php` or `compass/src/database.ts`
```
- Use WAL (Write-Ahead Logging) pragma
- Create indexes on frequently queried columns
- Use NOT NULL constraints where data is mandatory
- Default timestamps to (datetime('now'))
```

### 2. REST Endpoint Pattern
✅ **From:** WP Autopilot (`class-chat-handler.php`)
✅ **To Apply To:** `compass/includes/class-event-handler.php`
```
- Register route with namespace/version: wp-json/compass/v1
- Use permission_callback for access control
- Return WP_REST_Response with HTTP status codes
- Sanitize all inputs (sanitize_textarea_field, etc.)
- Validate before processing
```

### 3. Configuration Pattern
✅ **From:** Daemon (`config.ts`)
✅ **To Apply To:** `compass/.env` and config file
```
- Use environment variables for paths and secrets
- Provide defaults for optional settings
- Group related settings (database, email, notifications)
- Document all available settings in .env.example
```

### 4. Query Aggregation Pattern
✅ **From:** Token Ledger (`token-ledger.ts`)
✅ **To Apply To:** Summary queries (DAU, retention, revenue)
```
- Use GROUP BY for aggregations
- Use COALESCE(SUM(...), 0) for safe nulls
- Create helper methods for common queries
- Index the columns you filter/group by
```

### 5. Scheduled Task Pattern
✅ **From:** Daemon (`daemon.ts`)
✅ **To Apply To:** Daily summary generation
```
- Track last-run timestamp
- Check interval before executing (don't re-run within period)
- Use file-based queue for persistence
- Implement retry logic for failures
```

---

## Part 11: Validation & Testing Patterns

### Schema Validation Pattern
**From:** Memory Store and Token Ledger

**Apply to Compass:**
```typescript
interface CompassEvent {
    product: 'pinned' | 'dash' | 'localgenius' | 'great-minds' | 'shipyard';
    event: string;
    user_hash: string;
    timestamp: string;
    properties?: Record<string, any>;
    revenue_cents?: number;
}

function validateEvent(event: any): event is CompassEvent {
    if (typeof event !== 'object' || !event) return false;
    if (!['pinned', 'dash', 'localgenius', 'great-minds', 'shipyard'].includes(event.product)) return false;
    if (typeof event.event !== 'string' || !event.event) return false;
    if (typeof event.user_hash !== 'string' || !event.user_hash) return false;
    if (typeof event.timestamp !== 'string' || !event.timestamp) return false;
    // ISO8601 format check
    if (isNaN(new Date(event.timestamp).getTime())) return false;
    return true;
}
```

---

## Part 12: Privacy & Security Patterns

### From WP Autopilot Pattern:

**Encryption Pattern (API Keys):**
```php
// Encrypt on save
$encrypted = base64_encode(openssl_encrypt(
    $api_key,
    'AES-256-CBC',
    SECURE_AUTH_KEY,
    true
));
update_option('compass_db_key', $encrypted);

// Decrypt on use
$encrypted = get_option('compass_db_key');
$api_key = openssl_decrypt(
    base64_decode($encrypted),
    'AES-256-CBC',
    SECURE_AUTH_KEY,
    true
);
```

### Privacy Requirements (from PRD):
- No PII (names, emails, IP addresses)
- Hashed user identifiers only (hash email or user ID)
- User opt-out mechanism (add `compass_opted_out` flag to users)
- Data retention policy (purge events >90 days old)

---

## Part 13: Known Integration Points

### Pinned Notes (WordPress Plugin)
- **How to Integrate:** Add Compass event tracking to note creation handler
- **Events to Track:** `note_created`, `note_acknowledged`, `mention_sent`
- **Endpoint:** `POST /wp-json/compass/v1/events`
- **Pattern:** JavaScript in wp_enqueue_script, send via wp.apiRequest

### Dash (WordPress Plugin)
- **How to Integrate:** Similar to Pinned, hook into command execution
- **Events to Track:** `command_executed`, `search_performed`, `shortcut_used`
- **Endpoint:** `POST /wp-json/compass/v1/events`

### LocalGenius (Web App)
- **How to Integrate:** HTTP POST from JavaScript/server code
- **Events to Track:** `trial_start`, `subscription_start`, `post_generated`
- **Endpoint:** `POST https://compass.example.com/api/v1/events` (external)
- **Pattern:** Async fetch, fire-and-forget (don't block user interactions)

### Great Minds (CLI/Daemon)
- **How to Integrate:** Direct database access or HTTP endpoint
- **Events to Track:** `prd_submitted`, `debate_completed`, `plan_approved`, `project_shipped`
- **Pattern:** Can directly instantiate CompassDatabase class or call HTTP endpoint

### Shipyard (Web App)
- **How to Integrate:** HTTP POST like LocalGenius
- **Events to Track:** `project_started`, `stage_completed`, `project_delivered`
- **Endpoint:** `POST https://compass.example.com/api/v1/events`

---

## Part 14: Summary Generation Patterns

### Daily Text Summary (Week 1 Output)

**Template (from decisions.md):**
```
Compass Daily Brief — {DATE}

PINNED: {DAU} DAU ({CHANGE}%). 7d retention: {RET}%.
   → {DIAGNOSIS}
   → {RECOMMENDATION}

DASH: {DAU} DAU ({CHANGE}%). 7d retention: {RET}%.
   → {DIAGNOSIS}
   → {RECOMMENDATION}

[... repeat for all 5 products ...]

---
Generated by Compass. You are flying on data now.
```

**Code Pattern:**
```typescript
async generateDailySummary(): Promise<string> {
    const products = ['pinned', 'dash', 'localgenius', 'great-minds', 'shipyard'];
    const lines: string[] = [];

    lines.push(`Compass Daily Brief — ${new Date().toISOString().split('T')[0]}\n`);

    for (const product of products) {
        const dau = this.db.getDAU(product, 1);
        const retention = this.db.getRetention7d(product);
        const revenuePerUser = this.db.getRevenuePerUser(product, 7);

        const diagnosis = this.diagnose(dau, retention, revenuePerUser);
        const recommendation = this.recommend(diagnosis);

        lines.push(`${product.toUpperCase()}: ${dau} DAU`);
        lines.push(`  7d retention: ${retention}%`);
        lines.push(`  Diagnosis: ${diagnosis}`);
        lines.push(`  → ${recommendation}\n`);
    }

    return lines.join('\n');
}

private diagnose(dau: number, retention: number, rpUser: number): string {
    if (dau < 10) return 'Dead product. Consider sunsetting.';
    if (retention < 20) return 'Dying. Most users never return.';
    if (retention < 50) return 'Unhealthy. Retention needs work.';
    return 'Healthy.';
}
```

---

## Part 15: Recommended Build Sequence

### Phase 1: Foundation (Week 1)
1. **Create compass/ directory** with structure from Part 8
2. **Implement database class** (reuse Memory Store pattern)
3. **Create event schema** (SQLite table)
4. **Implement REST endpoint** (reuse WP Autopilot pattern)
5. **Add event validation** (schema validation pattern)
6. **Implement daily summary generator**
7. **Test locally with sample events**

### Phase 2: Product Integration (Weeks 2-3)
1. Integrate Pinned notes (JavaScript event tracking)
2. Integrate Dash (JavaScript event tracking)
3. Integrate LocalGenius (HTTP POST from web app)
4. Integrate Shipyard (HTTP POST from web app)
5. Integrate Great Minds (direct database or HTTP)
6. Test all 5 products sending events

### Phase 3: Dashboard UI (Week 12)
1. Create dashboard layout (HTML + CSS)
2. Implement query endpoints (DAU, retention, revenue)
3. Add visualization library (Chart.js or Recharts)
4. Deploy dashboard UI

---

## Part 16: Files You'll Need to Create

### Core Files (Required for Week 1)
- [ ] `/Users/sethshoultes/Local Sites/great-minds-plugin/compass/compass.php` — Main plugin file
- [ ] `/Users/sethshoultes/Local Sites/great-minds-plugin/compass/includes/class-database.php` — SQLite wrapper
- [ ] `/Users/sethshoultes/Local Sites/great-minds-plugin/compass/includes/class-event-handler.php` — REST endpoint
- [ ] `/Users/sethshoultes/Local Sites/great-minds-plugin/compass/includes/class-validator.php` — Event validation
- [ ] `/Users/sethshoultes/Local Sites/great-minds-plugin/compass/includes/class-summary-generator.php` — Daily summaries
- [ ] `/Users/sethshoultes/Local Sites/great-minds-plugin/compass/.env.example` — Environment template
- [ ] `/Users/sethshoultes/Local Sites/great-minds-plugin/compass/README.md` — Documentation

### Supporting Files
- [ ] `/Users/sethshoultes/Local Sites/great-minds-plugin/compass/admin/class-settings-page.php` — Admin UI
- [ ] `/Users/sethshoultes/Local Sites/great-minds-plugin/compass/admin/views/settings.php` — Settings template
- [ ] `/Users/sethshoultes/Local Sites/great-minds-plugin/compass/queries/` — SQL query templates
- [ ] `/Users/sethshoultes/Local Sites/great-minds-plugin/compass/templates/` — Email/text templates
- [ ] `/Users/sethshoultes/Local Sites/great-minds-plugin/compass/tests/` — Unit tests

### Documentation Files
- [ ] `/Users/sethshoultes/Local Sites/great-minds-plugin/compass/docs/SCHEMA.md` — Database schema
- [ ] `/Users/sethshoultes/Local Sites/great-minds-plugin/compass/docs/API.md` — Endpoint docs
- [ ] `/Users/sethshoultes/Local Sites/great-minds-plugin/compass/docs/INTEGRATION.md` — Integration guide
- [ ] `/Users/sethshoultes/Local Sites/great-minds-plugin/compass/docs/VOICE.md` — Brand voice

---

## Part 17: Key Dependencies Summary

### Direct Dependencies to Add

| Technology | Package | Version | Purpose | Pattern From |
|-----------|---------|---------|---------|--------------|
| SQLite | `better-sqlite3` | ^11.7.0 | Database | Memory Store |
| WordPress | Built-in | 6.0+ | REST routes, options | WP Autopilot |
| PHP | Built-in | 7.4+ | Main language | WP Autopilot |
| JavaScript | Vanilla | ES6 | Client tracking | WP Autopilot |

### Optional Dependencies (for future phases)

| Technology | Package | Version | Purpose |
|-----------|---------|---------|---------|
| Email | Resend | Latest | Daily summaries email |
| Notifications | Telegram Bot API | Latest | Real-time alerts |
| Charting | Chart.js | 3.x | Dashboard graphs |
| Visualization | Recharts | 2.x | Alternative charting |

---

## Part 18: Known Constraints & Notes

### What EXISTS
- SQLite expertise (Memory Store, Token Ledger)
- REST endpoint patterns (WP Autopilot)
- Configuration management (Daemon)
- Scheduled task infrastructure (Daemon event loop)

### What DOESN'T EXIST
- No existing Compass analytics codebase
- No event tracking system yet
- No daily summary generation code
- No analytics database setup

### Build Philosophy (from Decisions)
- **Simple over Complex:** SQLite + HTTP endpoint, not PostHog
- **Data First:** Text summaries before dashboard UI
- **Brutal Honesty:** Direct language, actionable recommendations
- **Ruthless Scope:** 20 events, 3 metrics, 1 summary per product

### Success Measures
- Day 1: Event ingestion working, database initialized
- Day 3: All 5 products can send events
- Day 5: Daily summaries generating correctly
- Day 10: Analytics dashboard MVP ready
- Week 12: Full dashboard UI shipped

---

## Part 19: Next Steps for Implementation

### Immediate Actions
1. **Create compass/ directory** at `/Users/sethshoultes/Local Sites/great-minds-plugin/compass/`
2. **Copy patterns** from Memory Store (database initialization, indexing)
3. **Copy patterns** from WP Autopilot (REST endpoint registration)
4. **Set up schema** (events table with all required columns)
5. **Implement ingest.php** (handle POST /wp-json/compass/v1/events)

### Quick Reference Files to Copy From
- `memory-store/src/store.ts` → Reference for SQLite schema and connection
- `daemon/src/token-ledger.ts` → Reference for aggregation queries and cost calculations
- `deliverables/wp-autopilot/wp-autopilot/includes/class-chat-handler.php` → Reference for REST endpoint pattern
- `daemon/src/config.ts` → Reference for configuration pattern

---

## Appendix: Quick Lookup Table

| What You Need | Location | Pattern File | Key Insight |
|---------------|----------|--------------|-------------|
| **SQLite setup** | Memory Store | `memory-store/src/store.ts` | Use WAL mode, create indexes |
| **REST endpoint** | WP Autopilot | `deliverables/wp-autopilot/wp-autopilot/includes/class-chat-handler.php` | register_rest_route + permission_callback |
| **Aggregation queries** | Token Ledger | `daemon/src/token-ledger.ts` | GROUP BY + COALESCE(SUM(), 0) |
| **Configuration** | Daemon | `daemon/src/config.ts` | Environment variables with defaults |
| **Scheduled tasks** | Daemon | `daemon/src/daemon.ts` | Track last-run timestamp, use intervals |
| **Database class** | Memory Store | `memory-store/src/store.ts` | Constructor + initSchema() + CRUD methods |
| **Event validation** | WP Autopilot | `deliverables/wp-autopilot/wp-autopilot/includes/class-api-client.php` | Sanitize + validate inputs |
| **Error handling** | WP Autopilot | `deliverables/wp-autopilot/wp-autopilot/includes/class-chat-handler.php` | Return WP_REST_Response with status codes |

---

**Report Completed**
**Confidence:** High — All patterns mapped, all file locations verified, all dependencies identified.
**Ready for Build:** Yes — Begin with Part 1 (Foundation Phase).
