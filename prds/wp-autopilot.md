# PRD: WP Autopilot
**Status:** Ready for Build
**DREAM Cycle:** 2026-04-09
**Vote:** 4/5 board approval

---

## Overview

**WP Autopilot** is a WordPress plugin that provides an AI-powered chat interface inside wp-admin. Users describe what they want ("create a contact page with a form") and the AI builds it — creating pages, configuring plugins, and managing content through natural language.

---

## Problem Statement

WordPress powers 45% of the web, but building sites still requires technical knowledge:
- Users must understand blocks, patterns, plugins, and settings
- Simple tasks require multiple clicks across different screens
- Non-technical site owners hire developers for basic changes
- Competitors (Squarespace, Wix) win on ease-of-use, not capability

**The gap:** WordPress has every feature but hides them behind complexity.

---

## Solution

A chat panel in wp-admin that translates plain English into WordPress actions:
- "Add a testimonials section to the homepage" → Inserts a testimonials block pattern
- "Create a contact page with a form that emails me" → Creates page, recommends/configures Contact Form 7
- "Update the About page header to say 'Our Story'" → Edits the existing content

The AI understands the user's current theme, installed plugins, and existing content.

---

## User Persona

**Primary:** Small business owners managing their own WordPress sites
- Non-technical but capable
- Know what they want but not how WordPress implements it
- Time-constrained, value simplicity

**Secondary:** Freelance developers building client sites
- Want to speed up repetitive tasks
- Will use chat for scaffolding, then refine manually

---

## Distribution Strategy

1. **WordPress.org Plugin Directory** — Primary channel, free tier
2. **Product Hunt Launch** — Initial awareness burst
3. **WordPress Facebook groups** — Highly engaged SMB audience
4. **YouTube tutorial** — "Build a site in 5 minutes with AI"

---

## Scope: Session 1 (MVP)

### In Scope
- [ ] Chat interface panel in wp-admin dashboard
- [ ] Create/edit pages and posts via natural language
- [ ] Insert Gutenberg blocks and block patterns
- [ ] Recommend and activate plugins from wordpress.org
- [ ] Context awareness: current theme, active plugins, existing pages
- [ ] Action confirmation before mutations ("I'll create a Contact page with a form. Proceed?")

### Out of Scope (Future)
- Theme switching/customization
- Media library management
- WooCommerce integration
- Multi-site support
- User/role management

---

## Technical Architecture

```
┌─────────────────────────────────────────┐
│           WP Admin Dashboard            │
│  ┌───────────────────────────────────┐  │
│  │     WP Autopilot Chat Panel       │  │
│  │  [User input] → [AI response]     │  │
│  │  [Action preview] → [Confirm]     │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│          PHP Plugin Backend             │
│  • REST API endpoints for chat          │
│  • WP context collector (theme, plugins)│
│  • Action executor (WP REST mutations)  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         Claude API (Anthropic)          │
│  • Understands user intent              │
│  • Returns structured action plan       │
│  • Generates content as needed          │
└─────────────────────────────────────────┘
```

### Key Components

1. **Chat Panel (React)**
   - Renders in wp-admin via admin menu page
   - Markdown rendering for AI responses
   - Action confirmation UI with diff preview

2. **Context Collector (PHP)**
   - Gathers: active theme, installed plugins, existing pages/posts, site settings
   - Sends as system context with each chat message

3. **Action Executor (PHP)**
   - Receives structured actions from AI
   - Executes via WordPress REST API internally
   - Returns success/failure status

4. **Claude Integration**
   - API key stored in wp_options (encrypted)
   - System prompt defines available actions
   - Structured output format for actions

---

## AI System Prompt (Core)

```
You are WP Autopilot, an AI assistant inside WordPress admin.

CONTEXT: You receive information about the user's WordPress site:
- Theme: {theme_name}
- Active plugins: {plugin_list}
- Existing pages: {page_list}

CAPABILITIES:
- create_page(title, content_blocks)
- edit_page(page_id, changes)
- insert_block(page_id, block_type, block_content, position)
- recommend_plugin(slug, reason)
- activate_plugin(slug)

RULES:
1. Always confirm before executing actions
2. Explain what you'll do in plain English
3. If unsure, ask clarifying questions
4. Never delete content without explicit confirmation
5. Suggest alternatives when requests aren't possible

OUTPUT FORMAT:
Respond with a message to the user, then optionally:
<action type="create_page" confirm="true">
  {"title": "Contact", "blocks": [...]}
</action>
```

---

## Database Schema

```sql
-- Chat history for context
CREATE TABLE wp_autopilot_messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  role ENUM('user', 'assistant') NOT NULL,
  content TEXT NOT NULL,
  actions_taken JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Settings stored in wp_options
-- wp_autopilot_api_key (encrypted)
-- wp_autopilot_model (default: claude-sonnet-4-20250514)
```

---

## File Structure

```
wp-autopilot/
├── wp-autopilot.php              # Plugin entry point
├── includes/
│   ├── class-chat-handler.php    # REST API for chat
│   ├── class-context-collector.php
│   ├── class-action-executor.php
│   └── class-claude-client.php
├── admin/
│   ├── class-admin-page.php      # Admin menu registration
│   └── js/
│       └── chat-panel.js         # React chat UI (bundled)
├── assets/
│   └── css/
│       └── admin.css
└── readme.txt                    # WordPress.org listing
```

---

## Success Metrics

1. **Installation:** 100+ active installs in first week
2. **Engagement:** Average 5+ messages per session
3. **Completion:** 70%+ of actions confirmed and executed
4. **Retention:** 50%+ weekly active users

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| AI makes destructive changes | Always require confirmation; no delete without double-confirm |
| API costs per user | Start with user-provided API key; consider pooled tier later |
| Plugin conflicts | Sandbox testing with popular theme/plugin combos |
| Scope creep | Strict MVP scope; future features go to backlog |

---

## Open Questions

1. **API key model:** User provides own key (MVP) vs. plugin-managed key (future)?
   - Decision: User-provided for MVP, reduces our liability and cost

2. **Block pattern library:** Ship with curated patterns or use theme defaults?
   - Decision: Use theme defaults + WP core patterns, no custom library for MVP

---

## Acceptance Criteria

- [ ] Plugin installs and activates without errors on WordPress 6.0+
- [ ] Chat panel appears in wp-admin sidebar
- [ ] User can create a new page via chat
- [ ] User can edit existing page content via chat
- [ ] AI responses include confirmation before actions
- [ ] Actions execute successfully via WP REST API
- [ ] Error states handled gracefully
- [ ] Settings page for API key configuration

---

## Build Instructions

```bash
# The agency should:
1. Scaffold plugin structure
2. Implement PHP backend (context collector, action executor, Claude client)
3. Build React chat panel
4. Wire up REST API endpoints
5. Test on clean WordPress install
6. Generate readme.txt for WordPress.org
```

---

**Ready for implementation.** This PRD is scoped for a single build session.
