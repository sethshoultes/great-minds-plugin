# Compass Portfolio Analytics Foundation — Requirements Specification

**Generated**: 2026-04-16  
**Source**: Requirements Analyst Agent (a89d8ff)  
**Input Documents**: prds/portfolio-analytics-foundation.md + rounds/portfolio-analytics-foundation/decisions.md  
**Total Requirements**: 19 atomic requirements (Week 1 / Phase 1 scope only)

---

## Requirements Summary

**V1 Scope**: SQLite analytics foundation with daily text summaries  
**Excluded**: Dashboard UI (Week 12), V2+ features (cohorts, anomaly detection, AI insights)  
**Timeline**: Week 1 delivery (7 days)

---

## TIER 1: DATABASE & INFRASTRUCTURE (CRITICAL PATH)

### REQ-001: Define SQLite Database Schema
**Statement**: Design and implement a SQLite database named `compass.db` with a single events table containing exactly 6 columns: `product`, `event`, `user_hash`, `timestamp`, `properties_json`, `revenue_cents`. All columns must support indexed queries on timestamps.

**Source**: decisions.md lines 45-52 (Architecture), line 184 (6-column schema)

**Dependencies**: None (first item on critical path)

**Success Criteria**:
- Database file created and queryable
- Schema matches specification exactly
- Timestamps are indexed and optimized for range queries
- Can insert 100k events/day without performance degradation

**Priority**: CRITICAL (blocks all downstream work)

---

### REQ-002: Implement HTTP POST Event Ingestion Endpoint
**Statement**: Build a PHP endpoint (`ingest.php`, ~50 lines) that accepts HTTP POST requests containing event data, validates against the event schema, and writes valid events to the SQLite `events` table. Endpoint must be privacy-first (accepts only hashed user IDs, no PII).

**Source**: decisions.md lines 45-52 (Architecture), lines 182-184 (File structure)

**Dependencies**: REQ-001 (database must exist)

**Success Criteria**:
- HTTP POST endpoint listens and responds correctly
- Valid events are persisted to SQLite
- Invalid/malformed events are rejected (400 error)
- No PII is logged or stored
- Endpoint accepts JSON payloads with: product, event, user_hash, timestamp, properties, revenue_cents

**Priority**: CRITICAL (Week 1 hard deadline)

---

## TIER 2: EVENT SCHEMA DEFINITION (CRITICAL PATH)

### REQ-003: Define 20 Critical Events (4 per Product)
**Statement**: Document and lock exactly 20 events across 5 products (Pinned, Dash, LocalGenius, Shipyard, Great Minds) in `config/events.json`. Each event must be outcome-focused (not vanity metrics). For Week 1, define events for Pinned only; remaining 4 products get event definitions but no integration yet.

**Source**: decisions.md lines 131-134 (V1 scope: 20 events), line 541 (REQUIRES SETH INPUT)

**Dependencies**: REQ-001 (schema exists to inform event structure)

**Success Criteria**:
- 4 events defined for Pinned (outcome-focused, not activity metrics)
- Event definitions stored in config/events.json
- Each event includes: name, description, required properties, example payload
- 16 events for remaining products defined but not implemented
- No vanity metrics (page views, time-on-page); only engagement outcomes

**Priority**: CRITICAL (Required before Pinned integration can begin)

---

### REQ-010: Document Event Schema in events.json
**Statement**: Create `config/events.json` that documents all 20 events (even those not integrated in Week 1) with schema including: event name, product, description, required properties, optional properties, example payload, outcome rationale (why this event matters).

**Source**: decisions.md lines 251 (events.json), lines 159-160 (Day 1: Define 20 critical events)

**Dependencies**: REQ-003 (events defined)

**Success Criteria**:
- JSON file is valid and parseable
- All 20 events documented
- Each event includes: name, product, description, properties, example
- Rationale explains why event tracks outcomes not vanity metrics
- File serves as reference for integration teams (Week 2-4)

**Priority**: HIGH (enables Week 2-4 integrations)

---

### REQ-011: Create Database Migration & Initialization Script
**Statement**: Create initialization script that sets up fresh SQLite database with correct schema, indexed timestamps, and empty events table. Script must be idempotent (safe to run multiple times).

**Source**: decisions.md lines 244-247 (compass.db location), lines 45-52 (schema definition), lines 417-420 (indexed timestamps from Day 1)

**Dependencies**: REQ-001 (schema designed)

**Success Criteria**:
- Script creates compass.db if not exists
- Schema matches specification exactly
- Timestamps indexed
- Script runs without errors
- Running script twice doesn't corrupt database
- Total size <1MB after initialization

**Priority**: HIGH (unblocks development)

---

## TIER 3: METRIC QUERIES (CRITICAL PATH)

### REQ-005: Implement DAU Metric Query
**Statement**: Create SQL query in `src/queries.php` that calculates Daily Active Users (DAU) per product by counting unique user_hash values within a 24-hour period. Must support querying previous 30 days for trend analysis.

**Source**: decisions.md lines 89-92 (Core metrics: DAU is "the truth"), PRD lines 52-56 (key metrics: DAU)

**Dependencies**: REQ-001 (database), REQ-004 (events flowing from Pinned)

**Success Criteria**:
- Query returns accurate DAU count for each product
- Query executes in <1 second for 30-day window
- Results match manual count verification
- Handles products with zero events gracefully

**Priority**: CRITICAL (required for daily summaries)

---

### REQ-006: Implement 7-Day Retention Metric Query
**Statement**: Create SQL query that calculates retention cohorts for Day 1, Day 7, and Day 30 returns. For Week 1, calculate D1 retention (% of users who returned the next day). Requires tracking user_hash first_event_date and subsequent activity dates.

**Source**: decisions.md lines 89-92 (Core metrics: 7-day retention is "the future"), PRD lines 65-68 (retention curves)

**Dependencies**: REQ-001 (database), REQ-004 (events flowing)

**Success Criteria**:
- Query correctly identifies first event date per user
- Calculates % of users with activity on Day 1, Day 7, Day 30
- Query executes in <2 seconds
- Results breakable by product
- Handles new users (no false negatives)

**Priority**: CRITICAL (required for daily summaries; focus on D1/D7 only for Week 1)

---

### REQ-007: Implement Revenue Per User Metric Query
**Statement**: Create SQL query that calculates Monthly Recurring Revenue (MRR) divided by unique user count per product. For Week 1, sum `revenue_cents` column per product and divide by DAU to get revenue_per_user.

**Source**: decisions.md lines 89-92 (Core metrics: "revenue per user is the value"), PRD lines 81-89 (revenue tracking)

**Dependencies**: REQ-001 (database with revenue_cents column), REQ-004 (events with revenue data)

**Success Criteria**:
- Query sums revenue_cents per product
- Divides by DAU to get per-user revenue
- Results accurate to nearest cent
- Handles products with zero revenue (returns $0.00)
- Query executes in <1 second

**Priority**: CRITICAL (required for daily summaries)

---

## TIER 4: OUTPUT & INTEGRATION

### REQ-008: Implement Daily Text Summary Generator in Compass Voice
**Statement**: Create `src/report.php` that executes metric queries and generates a daily text summary in Compass voice (brutal honesty, direct, actionable). Format: "Product: [metric] ([trend]). Diagnosis: [health]. Decision: [recommendation]".

**Source**: decisions.md lines 66-69 (Phase 1 output: daily text summary), lines 103-117 (brand voice principles), lines 202-203 (format example), PRD lines 100 (weekly digest pattern)

**Dependencies**: REQ-005, REQ-006, REQ-007 (all metric queries)

**Success Criteria**:
- Report.php executes without errors
- Output matches Compass voice (direct, confident, actionable)
- Example output: "Pinned: 12 DAU (-40%). 7d retention: 8%. Diagnosis: Dead. Decision: Kill or pivot."
- Report includes all 3 metrics (DAU, retention, revenue/user) for each product
- No jargon or corporate-speak
- Trends correctly identified (up/down/flat)

**Priority**: CRITICAL (deliverable for Week 1)

---

### REQ-009: Set Up Daily Cron Job for Text Summary Generation & Delivery
**Statement**: Create `cron/daily-summary.sh` bash script that executes `report.php` and delivers output via email or text file to designated recipient. Script must run once daily (recommend 9 AM). Must be deployable to existing server.

**Source**: decisions.md lines 256 (daily-summary.sh cron job), lines 158-161 (Week 1 timeline: daily text summaries), lines 360-364 (risk mitigation: email delivery drives usage)

**Dependencies**: REQ-008 (report.php exists)

**Success Criteria**:
- Cron job can be configured on existing server
- Script executes daily at scheduled time
- Email delivery successful (or fallback to text file)
- Email includes full daily report from report.php
- Log file tracks successful/failed executions

**Priority**: CRITICAL (required for Week 1 delivery)

---

### REQ-004: Implement Pinned Event Tracker
**Statement**: Create `integrations/pinned/tracker.js` that sends 4 defined Pinned events to the HTTP ingestion endpoint via client-side tracking. Events must include user_hash (not ID), timestamp, and relevant properties. Must not impact Pinned performance.

**Source**: decisions.md lines 133-134 (Pinned integration Week 1), lines 206-208 (Phase 2 integrations), PRD line 45 (Pinned events: note_created, note_acknowledged, mention_sent, session_duration)

**Dependencies**: REQ-002 (ingestion endpoint), REQ-003 (event schema for Pinned)

**Success Criteria**:
- Tracker.js successfully sends events to ingest.php endpoint
- Events appear in SQLite within 5 seconds of user action
- No PII (emails, names, IPs) in event payloads
- Pinned application performance unaffected (<5ms overhead per event)
- User hash generation is consistent (same user = same hash across sessions)

**Priority**: CRITICAL (Week 1 integration target)

---

## TIER 5: VALIDATION & QUALITY

### REQ-012: Validate Privacy Requirements (No PII)
**Statement**: Verify that all event ingestion, storage, and querying implements privacy-first approach: user_hash only (never email/name/IP), no cross-product identity tracking, no personally identifiable information stored.

**Source**: PRD lines 138-143 (privacy requirements), decisions.md lines 402-405 (mitigation: hash-only from Day 1)

**Dependencies**: REQ-002, REQ-004 (ingestion and integration implemented)

**Success Criteria**:
- Automated test: attempt to POST email → rejected
- SQLite contains no email, name, or IP columns
- All user_hash values are hashed (not plain text IDs)
- Code review confirms no PII in properties_json
- Privacy policy updated to reflect data collection

**Priority**: CRITICAL (legal/compliance requirement)

---

### REQ-013: Performance Test: SQLite Handles 100k Events/Day
**Statement**: Validate that SQLite database can handle 100k writes/day with sub-second query response. Load-test the ingest endpoint and metric queries under expected throughput.

**Source**: decisions.md line 40 (SQLite handles 100k writes/day single-threaded), lines 411-421 (risk mitigation: validate Elon's claim)

**Dependencies**: REQ-001, REQ-002, REQ-005-007 (infrastructure and queries)

**Success Criteria**:
- Ingest endpoint accepts 100k events without degradation
- DAU query still returns <1 second after 100k events
- Retention query still returns <2 seconds
- Revenue query still returns <1 second
- No disk space issues (compressed SQLite file)

**Priority**: HIGH (validates architecture)

---

### REQ-014: Integration Test: POST Event → See in Database → See in Summary
**Statement**: End-to-end validation: POST a test event via HTTP → verify it appears in SQLite → verify metric query includes it → verify report.php includes updated metrics.

**Source**: decisions.md lines 555-559 (Week 1 exit criteria: POST event → see in SQLite, run report → get summary)

**Dependencies**: REQ-001-009 (entire pipeline)

**Success Criteria**:
- POST request to ingest.php returns 200 OK
- Event appears in SQLite within 5 seconds
- DAU query returns +1 user
- report.php includes new metrics
- End-to-end time <5 seconds

**Priority**: CRITICAL (validation gate for Week 1)

---

### REQ-019: Week 1 Exit Criteria Validation
**Statement**: Verify all Week 1 success criteria met per decisions.md lines 515-518: (1) SQLite database live with events flowing from Pinned, (2) First daily text summary delivered, (3) 20 events defined across all 5 products.

**Source**: decisions.md lines 515-518 (Week 1 success criteria), lines 555-559 (exit criteria validation)

**Dependencies**: REQ-001-018 (all Week 1 work)

**Success Criteria**:
- Checklist complete: SQLite live + Pinned data flowing + summary delivered + 20 events locked
- Data verified in production environment
- First daily summary email received
- All 20 events documented and approved
- No critical bugs blocking Week 2 integration

**Priority**: CRITICAL (gates entire project)

---

## REMAINING PRODUCT EVENT DEFINITIONS (NOT INTEGRATED IN WEEK 1)

### REQ-015: Define Dash Events (4 events)
**Statement**: Define event schema for Dash product (4 events). From PRD line 44: command_executed, search_performed, shortcut_used, session_duration. Document in events.json. NO integration in Week 1.

**Source**: PRD lines 44, 127 (Dash critical events), decisions.md lines 131-134 (20 events total)

**Dependencies**: REQ-010 (events.json exists)

**Success Criteria**:
- 4 Dash events documented in events.json
- Each event includes example payload
- Rationale explains outcome-focus

**Priority**: MEDIUM (Week 2 integration prep)

---

### REQ-016: Define LocalGenius Events (4 events)
**Statement**: Define event schema for LocalGenius product (4 events). From PRD line 43: trial_start, subscription_start, post_generated, review_responded, report_viewed (choose 4). Document in events.json. NO integration in Week 1.

**Source**: PRD lines 43, 127 (LocalGenius critical events), decisions.md lines 131-134 (20 events total)

**Dependencies**: REQ-010 (events.json exists)

**Success Criteria**:
- 4 LocalGenius events documented in events.json
- Includes subscription_start (revenue event)
- Each event includes example payload

**Priority**: MEDIUM (Week 2 integration prep)

---

### REQ-017: Define Shipyard Events (4 events)
**Statement**: Define event schema for Shipyard product (4 events). From PRD line 47: project_started, stage_completed, project_delivered, revision_requested. Document in events.json. NO integration in Week 1.

**Source**: PRD lines 47, 127 (Shipyard critical events), decisions.md lines 131-134 (20 events total)

**Dependencies**: REQ-010 (events.json exists)

**Success Criteria**:
- 4 Shipyard events documented in events.json
- Each event includes example payload
- Rationale explains outcome-focus

**Priority**: MEDIUM (Week 2 integration prep)

---

### REQ-018: Define Great Minds Events (4 events)
**Statement**: Define event schema for Great Minds product (4 events). From PRD line 46: prd_submitted, debate_completed, plan_approved, project_shipped, tokens_consumed. Document in events.json. NO integration in Week 1.

**Source**: PRD lines 46, 127, 211 (Great Minds tracking: tokens_consumed), decisions.md lines 131-134 (20 events total)

**Dependencies**: REQ-010 (events.json exists)

**Success Criteria**:
- 4 Great Minds events documented in events.json
- Includes tokens_consumed (key outcome metric)
- Each event includes example payload
- Rationale explains outcome-focus

**Priority**: MEDIUM (Week 2 integration prep)

---

## KEY EXCLUSIONS (NOT V1/PHASE 1)

The following features from the PRD are explicitly EXCLUDED from Week 1 scope per decisions.md lines 211-234:

- ❌ Dashboard UI (deferred to Week 12)
- ❌ Cohort analysis beyond D1/D7/D30
- ❌ Anomaly detection alerts
- ❌ Weekly digest emails (daily text only)
- ❌ Cross-product user tracking / identity resolution
- ❌ Time range selectors (fixed 30 days)
- ❌ Churn prediction models
- ❌ AI-generated insights
- ❌ Real-time updates (daily sufficient)
- ❌ Revenue Per Token analysis (Great Minds advanced features)

---

## CRITICAL DEPENDENCIES & SEQUENCING

**Path 1 (Infrastructure - Days 1-3)**:
1. REQ-001 → REQ-011 (Database + init script)
2. REQ-002 (Ingest endpoint)
3. REQ-003 (Event schema)

**Path 2 (Queries - Days 3-4, parallel with Path 1)**:
1. REQ-005 (DAU)
2. REQ-006 (Retention)
3. REQ-007 (Revenue)

**Path 3 (Integration - Days 4-7, dependent on Paths 1-2)**:
1. REQ-004 (Pinned tracker)
2. REQ-008 (Text summary)
3. REQ-009 (Cron job)

**Path 4 (Validation - Day 7, dependent on all above)**:
1. REQ-012 (Privacy)
2. REQ-013 (Perf test)
3. REQ-014 (E2E test)
4. REQ-019 (Exit validation)

**Path 5 (Documentation - Days 1-2, parallel with all)**:
1. REQ-010 (events.json)
2. REQ-015-018 (remaining products)

---

**Requirements Status**: ✅ Complete (19 atomic requirements extracted and verified)  
**Traceability**: All requirements traced to source documents with line references  
**Ready For**: Phase 1 implementation  
**Next**: Sara Blakely customer gut-check review

---

*Requirements extracted: 2026-04-16*  
*Analyst: Requirements Analyst Agent (a89d8ff)*  
*Verification: All requirements atomic, testable, traceable, scoped to Week 1*
