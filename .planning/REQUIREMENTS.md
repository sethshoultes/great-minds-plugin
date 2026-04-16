# Requirements: Sous Revenue & Onboarding

**Project Slug:** localgenius-revenue-onboarding
**Product Name:** Sous (formerly LocalGenius)
**Source:** prds/localgenius-revenue-onboarding.md + rounds/localgenius-revenue-onboarding/decisions.md
**Generated:** 2026-04-16

---

## v1 — Must Ship (Week 1)

| ID | Requirement | Phase | Status |
|----|-------------|-------|--------|
| REQ-001 | Static pricing page with <1s load time (Lighthouse ≥90) | 1 | ⬜ |
| REQ-002 | Display single price of $99/month prominently | 1 | ⬜ |
| REQ-003 | 14-day trial signup requires credit card | 1 | ⬜ |
| REQ-004 | Embed 3-5 Loom video testimonials (60-90s each) | 1 | ⬜ |
| REQ-005 | Product tour video (60s max, Loom format) | 1 | ⬜ |
| REQ-006 | Display one case study with before/after metrics | 1 | ⬜ |
| REQ-007 | Copy uses "Your marketing, handled" tagline and voice | 1 | ⬜ |
| REQ-008 | PostHog analytics with 5 specific events | 1 | ⬜ |
| REQ-009 | Single CTA: "Start your 14-day trial" with credit card capture | 1 | ⬜ |
| REQ-010 | Domain registered (getous.com or trysous.com) | 1 | ⬜ |
| REQ-011 | Hosting via CDN for <1s global load | 1 | ⬜ |
| REQ-012 | Mobile-responsive design (320px+, 768px+, 1024px+) | 1 | ⬜ |
| REQ-013 | No three-tier pricing structure (single $99 option only) | 1 | ⬜ |
| REQ-014 | No ROI calculator included | 1 | ⬜ |
| REQ-015 | No "AI-powered" language in copy | 1 | ⬜ |
| REQ-016 | No "Request a Demo" CTA | 1 | ⬜ |
| REQ-017 | No FAQ section | 1 | ⬜ |
| REQ-018 | Video play metrics tracked via PostHog | 1 | ⬜ |

## v2 — Next Iteration (30+ Days)

| ID | Requirement | Notes |
|----|-------------|-------|
| REQ-019 | Produced hero video (upgrade from Loom) | Professionally shot video with real dashboard footage |
| REQ-020 | Distribution strategy execution | Toast/Square partnerships, SEO blog posts, case studies |
| REQ-021 | Referral program | Deferred until 25 customers onboarded |
| REQ-022 | Freemium tier | Revisit in month 3 if demand emerges |
| REQ-023 | "Trusted by X restaurants" counter | Only add if X > 50 |
| REQ-024 | Magic dashboard (zero-configuration) | Requires backend cron jobs, auto-publishing APIs |
| REQ-025 | A/B testing infrastructure | Wait for traffic volume, revisit month 2 |
| REQ-026 | Multi-location pricing model | Pending customer feedback |

## Out of Scope (Explicitly Killed)

- **REQ-K01:** ROI calculator — "No one trusts your math. Show real results instead."
- **REQ-K02:** Three-tier pricing — Creates decision paralysis
- **REQ-K03:** FAQ section — "If you need an FAQ to explain pricing, your pricing is confusing"
- **REQ-K04:** A/B testing in V1 — Premature optimization, no traffic yet
- **REQ-K05:** "Trusted by X restaurants" counter — Only valid if X > 50
- **REQ-K06:** "AI-powered" language — "The iPhone doesn't say 'computer-powered'"
- **REQ-K07:** "Request a Demo" CTA — Enterprise bloatware pattern, not SMB
- **REQ-K08:** Separate testimonials section — Testimonials woven into narrative

## Acceptance Criteria

Each requirement is done when:
1. Code is committed on a feature branch
2. Tests pass (build succeeds, Lighthouse ≥90)
3. QA has verified (Margaret or automated checks)
4. PR is merged to main

## Technical Context

### Existing Codebase Discovery
- **Framework:** Next.js 14.2.0 (App Router) with TypeScript
- **Existing Pricing Page:** `/Users/sethshoultes/Local Sites/localgenius/src/app/(marketing)/pricing/page.tsx`
- **Current State:** Two-tier pricing ($29 Base, $79 Pro) — needs replacement with single $99 tier
- **Design System:** Tailwind CSS with defined color palette (Charcoal, Terracotta, Sage, Warm White)
- **Deployment:** Vercel with CDN configuration
- **Analytics:** Internal service exists, but NO PostHog integration yet

### Performance Constraints
- **<1s load time** — Non-negotiable (Google Lighthouse ≥90)
- **Mobile-first** — 320px breakpoint minimum
- **Image budget:** <100KB total (WebP with PNG fallback)
- **Analytics script:** <50ms overhead (async/defer required)

### Integration Requirements
- **PostHog:** Client-side SDK integration needed
- **Stripe:** Trial signup with credit card capture
- **Loom:** Video embeds (lazy-load, no auto-play)
- **Domain:** Register getous.com or trysous.com, configure DNS

## Success Metrics (Week 1-4)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Page load time | <1s (Lighthouse ≥90) | — | pending |
| Unique visitors | 100 by day 14 | — | pending |
| Trial signups | 5 (5% conversion) | — | pending |
| Paying customers | 2 (40% trial→paid) | — | pending |
| MRR | $200 minimum | — | pending |
| Video completion | 40%+ | — | pending |

## Red Flags (Pivot Signals)

- ⚠️ <1% trial signup conversion → pricing page isn't resonating
- ⚠️ <20% trial→paid conversion → product doesn't deliver value
- ⚠️ <10% video completion rate → testimonials aren't credible

## Status Legend

- ⬜ Not started
- 🔨 In progress
- ✅ Complete
- ❌ Blocked
- 🔄 Needs revision
