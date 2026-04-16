# Compass Quick Start — Builder's Cheat Sheet

**For:** Implementing Portfolio Analytics Foundation
**Duration:** ~3-7 days to MVP
**From:** Codebase Scout Report

---

## The 60-Second Version

**Compass** = SQLite database + HTTP POST endpoint + daily text summaries

**NOT:** PostHog, ClickHouse, Kafka, or any infrastructure porn.

**Architecture:**
```
Products (Pinned, Dash, LocalGenius, Shipyard, Great Minds)
          ↓ (POST event JSON)
    /wp-json/compass/v1/events
          ↓ (insert)
    compass.db (SQLite)
          ↓ (query daily)
    Daily Summary.txt
```

---

## What to Build (Phase 1 — Week 1)

### 1. Database Table
```sql
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product TEXT NOT NULL,        -- pinned, dash, localgenius, great-minds, shipyard
  event TEXT NOT NULL,          -- note_created, command_executed, etc
  user_hash TEXT NOT NULL,      -- anonymized user ID
  timestamp TEXT NOT NULL,      -- ISO8601 datetime
  properties TEXT,              -- JSON properties
  revenue_cents INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_product ON events(product);
CREATE INDEX idx_timestamp ON events(timestamp);
```

### 2. REST Endpoint (WordPress)
```php
// Register at plugins_loaded
register_rest_route('compass/v1', '/events', [
    'methods' => 'POST',
    'callback' => 'compass_ingest_event',
    'permission_callback' => '__return_true'
]);

function compass_ingest_event($request) {
    $event = $request->get_json_params();

    // Validate
    if (!isset($event['product'], $event['event'], $event['user_hash'], $event['timestamp'])) {
        return new WP_REST_Response(['error' => 'Invalid event'], 400);
    }

    // Insert (use global $wpdb or SQLite wrapper)
    global $wpdb;
    $wpdb->insert('compass_events', [
        'product' => sanitize_text_field($event['product']),
        'event' => sanitize_text_field($event['event']),
        'user_hash' => sanitize_text_field($event['user_hash']),
        'timestamp' => sanitize_text_field($event['timestamp']),
        'properties' => isset($event['properties']) ? json_encode($event['properties']) : null,
        'revenue_cents' => intval($event['revenue_cents'] ?? 0)
    ]);

    return new WP_REST_Response(['success' => true, 'id' => $wpdb->insert_id], 201);
}
```

### 3. Daily Summary Generator
```php
function compass_generate_daily_summary() {
    global $wpdb;

    $summary = "Compass Daily Brief — " . date('Y-m-d') . "\n\n";

    $products = ['pinned', 'dash', 'localgenius', 'great-minds', 'shipyard'];

    foreach ($products as $product) {
        // DAU: distinct users in last 24h
        $dau = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(DISTINCT user_hash) FROM compass_events
             WHERE product = %s AND timestamp >= DATE_SUB(NOW(), INTERVAL 1 DAY)",
            $product
        ));

        // 7d Retention: users active 7+ days ago who returned
        $cohort = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(DISTINCT user_hash) FROM compass_events
             WHERE product = %s AND timestamp BETWEEN DATE_SUB(NOW(), INTERVAL 14 DAY)
                                                  AND DATE_SUB(NOW(), INTERVAL 7 DAY)",
            $product
        ));

        $returned = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(DISTINCT user_hash) FROM compass_events
             WHERE product = %s AND timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
            $product
        ));

        $retention = $cohort > 0 ? round(($returned / $cohort) * 100) : 0;

        // Diagnosis
        if ($dau < 10) $diagnosis = "Dead. Consider sunsetting.";
        elseif ($retention < 20) $diagnosis = "Dying. Most users never return.";
        elseif ($retention < 50) $diagnosis = "Unhealthy. Retention needs work.";
        else $diagnosis = "Healthy.";

        $summary .= sprintf(
            "%s: %d DAU, 7d retention: %d%%, %s\n\n",
            strtoupper($product),
            $dau,
            $retention,
            $diagnosis
        );
    }

    // Save/email summary
    file_put_contents(WP_CONTENT_DIR . '/compass-summary.txt', $summary);

    return $summary;
}

// Hook it up (in plugin activation)
wp_schedule_event(time(), 'daily', 'compass_daily_summary');
add_action('compass_daily_summary', 'compass_generate_daily_summary');
```

---

## File Structure (Create This)

```
wp-content/plugins/compass/
├── compass.php                  # Main plugin file
├── .env.example                 # Config template
├── README.md
├── includes/
│   ├── class-database.php       # SQLite wrapper (optional)
│   ├── class-event-handler.php  # REST endpoint
│   └── class-validator.php      # Event validation
├── admin/
│   ├── class-settings-page.php  # Admin UI
│   └── views/settings.php
├── templates/
│   └── daily-summary.txt        # Summary template
└── tests/
    └── test-event-handler.php
```

---

## Patterns to Copy (Ctrl+C from existing code)

### 1. SQLite Database Setup
**From:** `/Users/sethshoultes/Local Sites/great-minds-plugin/memory-store/src/store.ts`
**What to copy:**
- WAL mode initialization: `pragma('journal_mode = WAL')`
- Index creation pattern
- Prepared statement usage

### 2. REST Endpoint Pattern
**From:** `/Users/sethshoultes/Local Sites/great-minds-plugin/deliverables/wp-autopilot/wp-autopilot/includes/class-chat-handler.php`
**What to copy:**
- `register_rest_route()` structure
- `permission_callback` pattern
- Input sanitization
- Response format (success/error)

### 3. Aggregation Queries
**From:** `/Users/sethshoultes/Local Sites/great-minds-plugin/daemon/src/token-ledger.ts`
**What to copy:**
- `GROUP BY` for aggregations
- `COALESCE(SUM(...), 0)` for safe nulls
- Date-based filtering

---

## Quick Integration Checklist

### Pinned Notes Integration
```javascript
// In Pinned's note creation handler
fetch('/wp-json/compass/v1/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        product: 'pinned',
        event: 'note_created',
        user_hash: hashUserId(userId),  // Use salted hash of user ID
        timestamp: new Date().toISOString(),
        properties: { note_length: content.length }
    })
}).catch(() => {}); // Fire and forget, don't block user
```

### Dash Integration
```javascript
// Similar to Pinned
fetch('/wp-json/compass/v1/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        product: 'dash',
        event: 'command_executed',
        user_hash: hashUserId(userId),
        timestamp: new Date().toISOString(),
        properties: { command: commandName }
    })
}).catch(() => {});
```

### LocalGenius Integration
```javascript
// External app POST
fetch('https://yoursite.com/wp-json/compass/v1/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        product: 'localgenius',
        event: 'subscription_start',
        user_hash: hashUserId(userId),
        timestamp: new Date().toISOString(),
        properties: { plan: 'pro', revenue_cents: 9900 },
        revenue_cents: 9900
    })
}).catch(() => {});
```

---

## Success Metrics (Week 1)

- [ ] REST endpoint accepts POST requests
- [ ] Events are inserted into database
- [ ] Daily summary query runs without errors
- [ ] At least one product sending test events
- [ ] Summary text looks like:
  ```
  Compass Daily Brief — 2026-04-16

  PINNED: 47 DAU, 7d retention: 62%, Healthy.
  DASH: 12 DAU, 7d retention: 8%, Dying. Most users never return.
  LOCALGENIUS: 203 DAU, 7d retention: 71%, Healthy.
  GREAT-MINDS: 5 DAU, 7d retention: 40%, Unhealthy.
  SHIPYARD: 89 DAU, 7d retention: 55%, Healthy.
  ```

---

## Event Schema (Copy This)

```json
{
  "product": "pinned|dash|localgenius|great-minds|shipyard",
  "event": "page_view|feature_use|session_start|conversion|trial_start|subscription_start|post_generated|command_executed|note_created|prd_submitted|project_started",
  "user_hash": "sha256(email + salt)_or_anonymous_hash",
  "timestamp": "2026-04-16T10:30:45Z",
  "properties": {
    "duration_ms": 1234,
    "feature": "advanced_search",
    "plan": "pro"
  },
  "revenue_cents": 0
}
```

---

## Voice Guide (The Compass Brand)

**Direct:** "Pinned is dying" not "user engagement metrics suggest suboptimal retention"
**Actionable:** Every insight ends with "Do this"
**Confident:** It's not "data suggests", it's "here's what's happening"

Example:
```
❌ WRONG: "Retention coefficient decreased 23% week-over-week"
✅ RIGHT: "Pinned: 62% of users never return. Kill it or pivot."
```

---

## Common Mistakes (Don't Do These)

1. ❌ Adding all columns you might someday want (keep JSON `properties` column flexible)
2. ❌ Synchronous event processing (use background jobs or fire-and-forget)
3. ❌ Tracking PII (hash user IDs, never store emails)
4. ❌ No database indexes (at least index product + timestamp)
5. ❌ Complex SQL queries (use aggregation tables for weekly/monthly data)
6. ❌ Real-time dashboards (start with daily summaries)
7. ❌ Chasing perfect metrics (focus on 3: DAU, retention, revenue/user)

---

## Testing with curl (Local Development)

```bash
# Test event ingestion
curl -X POST http://localhost:8000/wp-json/compass/v1/events \
  -H "Content-Type: application/json" \
  -d '{
    "product": "pinned",
    "event": "note_created",
    "user_hash": "abc123hash",
    "timestamp": "'$(date -u +'%Y-%m-%dT%H:%M:%SZ')'",
    "properties": {"note_length": 250}
  }'

# Expected response:
# {"success":true,"id":1}
```

---

## Resources to Reference

**Database Patterns:**
→ `/Users/sethshoultes/Local Sites/great-minds-plugin/memory-store/src/store.ts` (SQLite + indexes)

**REST Endpoint Patterns:**
→ `/Users/sethshoultes/Local Sites/great-minds-plugin/deliverables/wp-autopilot/wp-autopilot/includes/class-chat-handler.php`

**Aggregation Query Patterns:**
→ `/Users/sethshoultes/Local Sites/great-minds-plugin/daemon/src/token-ledger.ts`

**Configuration Patterns:**
→ `/Users/sethshoultes/Local Sites/great-minds-plugin/daemon/src/config.ts`

**Full Scout Report:**
→ `/Users/sethshoultes/Local Sites/great-minds-plugin/COMPASS-CODEBASE-SCOUT-REPORT.md`

---

## Timeline (Estimated)

- **Day 1:** Database + endpoint (4 hours)
- **Day 2:** Summary generator + validation (3 hours)
- **Day 3:** Testing + first integration (2 hours)
- **Day 4-5:** Integrate all 5 products (8 hours)
- **Day 6-7:** Polish + documentation (4 hours)

**Total:** ~21 hours engineering time = 3 business days

---

**Now go build. The data is waiting to talk to you.**
