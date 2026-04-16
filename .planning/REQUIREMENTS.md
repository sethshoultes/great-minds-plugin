# Requirements: Portfolio Analytics Foundation (Compass)

**Project Slug:** portfolio-analytics-foundation
**Product Name:** Compass
**Source:** prds/portfolio-analytics-foundation.md + rounds/portfolio-analytics-foundation/decisions.md
**Generated:** 2026-04-16

---

## V1 — Must Ship (Week 1 - Phase 1)

### Backend & Database

| ID | Requirement | Phase | Status |
|----|-------------|-------|--------|
| REQ-001 | SQLite Event Ingestion Database with 6 columns (product, event, user_hash, timestamp, properties_json, revenue_cents). Support ~100k writes/day. | 1 | ⬜ |
| REQ-002 | HTTP POST endpoint (~50 lines) for event ingestion. Async, non-blocking, validates schema, returns 200 immediately. | 1 | ⬜ |
| REQ-003 | Database indexes on timestamp, product+timestamp, user_hash for query performance. Sub-second queries with 100k+ events. | 1 | ⬜ |
| REQ-004 | Hybrid schema: locked core columns + flexible JSON properties_json field for extensibility. | 1 | ⬜ |
| REQ-005 | Postgres migration path pre-written for when SQLite reaches 1M events/day. | 2 | ⬜ |

### Event Tracking & Schema

| ID | Requirement | Phase | Status |
|----|-------------|-------|--------|
| REQ-006 | Universal event schema: 20 events total (4 per product). Outcome-focused, not vanity metrics. | 1 | ⬜ |
| REQ-007 | LocalGenius events: trial_start, subscription_start, post_generated, review_responded | 2 | ⬜ |
| REQ-008 | Dash events: command_executed, search_performed, shortcut_used, session_duration | 2 | ⬜ |
| REQ-009 | Pinned events (FIRST integration): note_created, note_acknowledged, mention_sent, session_duration | 1 | ⬜ |
| REQ-010 | Great Minds events: prd_submitted, debate_completed, plan_approved, project_shipped (capture tokens_consumed) | 2 | ⬜ |
| REQ-011 | Shipyard events: project_started, stage_completed, project_delivered, revision_requested | 2 | ⬜ |
| REQ-012 | Privacy-first user hashing: SHA-256, deterministic, no PII, 64-char hex output. Same user = same hash across products. | 1 | ⬜ |
| REQ-013 | User opt-out mechanism: one-click opt-out, delete historical events within 24 hours. | 1 | ⬜ |
| REQ-014 | Data retention policy: auto-delete events older than 90 days (configurable). Daily cron job. | 1 | ⬜ |
| REQ-015 | No IP logging: explicitly exclude IP addresses from all event tracking. | 1 | ⬜ |

### Metrics & Queries

| ID | Requirement | Phase | Status |
|----|-------------|-------|--------|
| REQ-016 | Daily Active Users (DAU) query: COUNT(DISTINCT user_hash) per product per day. Runs <100ms. Primary health metric. | 1 | ⬜ |
| REQ-017 | 7-Day Retention query: percentage of Day 1 cohort returning on Day 7. Returns 0-100%. | 1 | ⬜ |
| REQ-018 | 30-Day Retention query: percentage of Day 1 cohort returning on Day 30. | 2 | ⬜ |
| REQ-019 | 1-Day Retention query: percentage returning on Day 2 (tightest feedback loop). | 2 | ⬜ |
| REQ-020 | Revenue Per User query: SUM(revenue_cents) / COUNT(DISTINCT user_hash). Returns cents. | 1 | ⬜ |
| REQ-021 | Monthly Recurring Revenue (MRR) query for LocalGenius/Shipyard. | 2 | ⬜ |
| REQ-022 | Customer Acquisition Cost (CAC) query: spend / new paying customers. | 2 | ⬜ |
| REQ-023 | Lifetime Value (LTV) query: sum all revenue from user across lifetime. LTV:CAC ratio. | 2 | ⬜ |

### Output & Reporting

| ID | Requirement | Phase | Status |
|----|-------------|-------|--------|
| REQ-024 | Daily text summary generator in Compass voice: "Product: [metric] ([trend]). Diagnosis: [health]. Decision: [recommendation]". Direct, unsentimental, diagnostic. | 1 | ⬜ |
| REQ-025 | Email delivery of daily summary. Plain text, 6am daily, all 5 products. | 1 | ⬜ |
| REQ-026 | Dashboard UI (HTML+CSS+JS): 5 products, 3 metrics each, <3s load, ONE screen, no customization. | 3 | ⬜ |
| REQ-027 | Dashboard color coding: green (growing), yellow (stable), red (dying). Thresholds set after Week 4 data review. | 3 | ⬜ |
| REQ-028 | Dashboard time range selector: Last 7/30/90 days or custom. Retains selection on reload. | 3 | ⬜ |
| REQ-029 | Dashboard metrics API endpoint: JSON, <100ms, 1-hour cache. | 3 | ⬜ |
| REQ-030 | Dashboard detail drilldown view (nice-to-have): click product = expanded metrics. | 3 | ⬜ |

### Infrastructure & Operations

| ID | Requirement | Phase | Status |
|----|-------------|-------|--------|
| REQ-031 | Daily cron job: runs queries, generates report, logs success/failure. Executes at 6am. | 1 | ⬜ |
| REQ-032 | Deploy to existing server: $0 infrastructure cost. Co-locate with daemon. | 1 | ⬜ |
| REQ-033 | SQLite database backups: daily at 2am, gzip compressed, 30-day retention. | 1 | ⬜ |
| REQ-034 | Error logging & monitoring: log all failed inserts, missing columns, endpoint failures. Weekly summary in email. | 2 | ⬜ |
| REQ-035 | Query performance monitoring: alert if any query >500ms. Establish baseline Week 2. | 2 | ⬜ |
| REQ-036 | Manual refresh capability in dashboard: on-demand data pull with 60s cooldown. | 3 | ⬜ |

### Integrations

| ID | Requirement | Phase | Status |
|----|-------------|-------|--------|
| REQ-037 | Pinned integration (FIRST): JavaScript tracker SDK, 4 events, <100ms performance impact. Week 1 validation. | 1 | ⬜ |
| REQ-038 | LocalGenius integration: JavaScript SDK, 4 events, revenue tracking. | 2 | ⬜ |
| REQ-039 | Dash integration: JavaScript SDK (or PHP), 4 events. | 2 | ⬜ |
| REQ-040 | Great Minds integration: Node.js SDK, 4 events, tokens_consumed tracking. | 2 | ⬜ |
| REQ-041 | Shipyard integration: JavaScript SDK, 4 events, project metadata. | 2 | ⬜ |
| REQ-042 | Cross-product user identity (legal review required): track same user across products via consistent hash. | 2+ | ⬜ |

---

## V2 — Next Iteration (Week 2-4)

| ID | Requirement | Notes |
|----|-------------|-------|
| REQ-043 | Cohort analysis beyond D1/D7/D30: retention curves at Days 2, 3, 5, 14, 60, 90 | Fine-grained retention understanding |
| REQ-044 | Anomaly detection & alerts: DAU drop >20%, conversion drop >15%, error spike | Email within 1 hour of anomaly |
| REQ-045 | Revenue Per Token analysis (Great Minds): tokens_consumed vs revenue_generated per project | Track PRD → shipped project value |
| REQ-046 | Resurrection tracking: users who churned then returned. Percentage and average dormant days. | Churn recovery insights |
| REQ-047 | Weekly digest email: trends, week-over-week changes, forward-looking recommendations | Extended weekly reporting |
| REQ-048 | Feature usage breakdown: which features most used per product. Percentage of total usage. | Core vs neglected features |
| REQ-049 | Dark mode support: auto-detect OS preference, CSS variables, no toggle (Steve's no-customization rule) | WCAG AA compliant |
| REQ-050 | Session duration calculation: average session length from session_start/session_end events | Minutes, configurable per product |

---

## V3+ — Future (Week 12+)

| ID | Requirement | Notes |
|----|-------------|-------|
| REQ-051 | Week 1 exit validation: demonstrate Event → Database → Summary → Email flow end-to-end | Success criteria checkpoint |
| REQ-052 | Week 4 exit: ONE data-driven decision made (kill/pivot/double-down on product) | Data must inform decision |
| REQ-053 | Week 12 exit: Dashboard live, daily habit formed, 3+ decisions attributed to dashboard | Habit formation milestone |
| REQ-054 | Week 26 exit: V2 features prioritized based on actual usage gaps (not speculation) | Evidence-based roadmap |

---

## Success Metrics (Week 1-4)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Time to first insight | <1 week from implementation | — | pending |
| Dashboard load time | <2 seconds | — | pending |
| Data freshness | <1 hour lag | — | pending |
| Events tracked per day | Measure baseline, then optimize | — | pending |
| Questions answered | "Which product is growing fastest?", "What's our retention?", "What's our LTV?" | — | pending |
| First decision made | Week 4 deadline | — | pending |

---

## Out of Scope (Explicitly Cut or Never)

### V2+ Features (Cut from V1)

- **REQ-K01:** Cohort analysis beyond D1/D7/D30 → V2
- **REQ-K02:** Anomaly detection alerts → V2 (10 users = no anomalies exist)
- **REQ-K03:** Cross-product user tracking → V2 (legal review required)
- **REQ-K04:** Dashboard UI → V3 (Week 12, after knowing what to show)
- **REQ-K05:** Customizable views/widgets → V2+
- **REQ-K06:** Real-time updates → V1 uses hourly refresh (sufficient)

### V3+ Features

- **REQ-K07:** Resurrection tracking
- **REQ-K08:** Great Minds outcome prediction model
- **REQ-K09:** Weekly digest emails (just query DB manually)
- **REQ-K10:** Revenue per token analysis (Great Minds specific)
- **REQ-K11:** Advanced retention cohorts
- **REQ-K12:** AI-generated insights (GPT-4 fortune-telling)

### NEVER Features

- **REQ-K13:** 47 chart types (line + bar only)
- **REQ-K14:** Customizable dashboards ("we decide what matters")
- **REQ-K15:** User settings (font size, themes)
- **REQ-K16:** Minute-by-minute real-time obsession
- **REQ-K17:** PostHog/ClickHouse/infrastructure complexity

---

## Acceptance Criteria

Each requirement is done when:
1. Code is committed on a feature branch
2. Tests pass (build succeeds, schema validates, queries run <500ms)
3. QA verified (automated checks or manual validation)
4. PR merged to main
5. Requirement marked ✅ in this document

---

## Technical Context

### Codebase Patterns to Follow

- **SQLite with WAL mode**: See `memory-store/src/store.ts` (lines 79, 86-110)
- **Indexed schemas**: See `daemon/src/token-ledger.ts` (lines 52-69)
- **Daemon loop pattern**: See `daemon/src/daemon.ts` (lines 330-387)
- **Config management**: See `daemon/src/config.ts`
- **Type-safe event schemas**: Use Zod (existing pattern in daemon)
- **Error handling**: See `daemon/src/pipeline.ts` (lines 84-96)

### Privacy & Compliance

- **GDPR Article 6(1)(f)**: Legitimate interest basis
- **No PII**: Hashed identifiers only
- **User opt-out**: Must honor within 24 hours
- **Data retention**: 90-day default, configurable
- **CCPA compliance**: Opt-out and deletion within 45 days

### Performance Constraints

- **<1s first insight**: Week 1 exit criteria
- **<2s dashboard load**: Week 12 target
- **<1 hour data lag**: Freshness target
- **<100ms DAU query**: Sub-second queries required
- **<500ms retention query**: Complex cohort threshold

---

## Red Flags (Pivot Signals)

- ⚠️ Week 4: No decision made using Compass data → we failed
- ⚠️ Week 12: Dashboard not used daily → habit formation failed
- ⚠️ <1% event validation failure rate → schema drift issue
- ⚠️ Query performance >500ms → indexing or volume issue
- ⚠️ Week 26: V2 features chosen based on speculation (not evidence) → not data-driven

---

## Status Legend

- ⬜ Not started
- 🔨 In progress
- ✅ Complete
- ❌ Blocked
- 🔄 Needs revision

---

## Notes

- Total V1 requirements: 42 (37 backend/queries/integrations + 5 exit criteria)
- Total V2 requirements: 8
- Total V3+ requirements: 4
- NEVER features: 5 explicitly killed
- Critical path: REQ-001, REQ-002, REQ-006, REQ-009, REQ-012, REQ-016, REQ-017, REQ-020, REQ-024, REQ-025, REQ-031, REQ-032, REQ-051
