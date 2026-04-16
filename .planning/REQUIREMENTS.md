# Requirements Traceability — WP Autopilot

**Project:** wp-autopilot
**Generated:** 2026-04-16
**Phase:** 1 (MVP Build)
**Source Documents:**
- PRD: `/Users/sethshoultes/Local Sites/great-minds-plugin/prds/wp-autopilot.md`
- Decisions: `/Users/sethshoultes/Local Sites/great-minds-plugin/rounds/wp-autopilot/decisions.md`

---

## Executive Summary

**Product Core:** WordPress chat interface powered by Claude AI that turns natural language into WordPress actions.

**MVP Scope:** ~600 lines of PHP/JavaScript creating pages/posts, managing plugins, inserting blocks.

**Key Tensions:**
1. **Product Name:** "Wordsmith" (Steve) vs "WP Autopilot" (Elon) — UNRESOLVED
2. **Chat History:** Transients (Elon) vs Custom Table (Steve) — RESOLVED: Transients for v1
3. **Frontend:** Alpine.js 12KB — RESOLVED: Compromise between React (Steve) and vanilla JS (Elon)

**Total Requirements:** 72 atomic requirements across 5 categories

---

## Atomic Requirements

### FEATURE REQUIREMENTS (F1-F30)

**F1** | Chat interface panel in wp-admin dashboard
**Source:** PRD line 62, Decisions lines 45-55
**Verification:** Admin menu shows chat panel, renders without errors

**F2** | Text input for user messages with submit button
**Source:** PRD line 62, Decisions line 162
**Verification:** Input accepts text, submits on Enter or button click

**F3** | Message history display with user/assistant distinction
**Source:** PRD line 62, Decisions line 162
**Verification:** Chat shows scrollable history with role-based styling

**F4** | Create new pages via natural language
**Source:** PRD line 63, Decisions line 172
**Verification:** "Create contact page" → wp_insert_post() executes successfully

**F5** | Edit existing pages via natural language
**Source:** PRD line 63, Decisions line 172
**Verification:** "Update About page header" → wp_update_post() modifies content

**F6** | Create new posts via natural language
**Source:** PRD line 64, Decisions line 172
**Verification:** "Add blog post about services" → wp_insert_post() with post_type=post

**F7** | Edit existing posts via natural language
**Source:** PRD line 64, Decisions line 172
**Verification:** "Change post title" → wp_update_post() modifies post

**F8** | Insert Gutenberg blocks into pages/posts
**Source:** PRD line 65, Decisions line 173
**Verification:** "Add testimonials block" → Block inserted via REST API

**F9** | Insert Gutenberg block patterns
**Source:** PRD line 29, Decisions line 173
**Verification:** "Add contact form pattern" → Pattern inserted correctly

**F10** | Recommend plugins from wordpress.org
**Source:** PRD line 66, Decisions line 174
**Verification:** "I need a contact form" → Suggests Contact Form 7 or WPForms

**F11** | Activate existing plugins
**Source:** PRD line 66, Decisions line 174
**Verification:** "Activate Contact Form 7" → activate_plugin() executes

**F12** | Install AND activate plugins (combined action)
**Source:** Decisions lines 174, 466
**Verification:** "Install Yoast SEO" → Downloads + activates in one step

**F13** | Collect active theme context
**Source:** PRD line 67, Decisions line 176
**Verification:** System prompt includes theme name and version

**F14** | Collect installed plugins context (top 5 most recent)
**Source:** PRD line 67, Decisions line 176
**Verification:** System prompt includes plugin list (capped at 5)

**F15** | Collect existing pages context (last 10 modified)
**Source:** PRD line 67, Decisions line 177
**Verification:** System prompt includes page titles and IDs

**F16** | Collect current user role context
**Source:** PRD line 68, Decisions line 177
**Verification:** System prompt includes user capability level

**F17** | Action confirmation before mutations
**Source:** PRD line 68, Decisions lines 135-140, 355-360
**Verification:** User sees "I'll create Contact page. Proceed?" before wp_insert_post()

**F18** | Before/after preview for edits (visual, not code diff)
**Source:** Decisions lines 135-140
**Verification:** User sees current content → proposed changes before confirming

**F19** | Undo mechanism via "undo that" chat command
**Source:** Decisions lines 139, 359
**Verification:** Last action stored in transient, reversible on command

**F20** | API key storage in wp_options (encrypted)
**Source:** PRD line 124, Decisions lines 75-81
**Verification:** get_option('wp_autopilot_api_key') returns encrypted value

**F21** | API key validation on settings save
**Source:** Decisions line 81, PRD line 124
**Verification:** Settings page tests key against Claude API before saving

**F22** | Invalid API key detection with setup guide
**Source:** Decisions line 182, PRD line 124
**Verification:** 401 response triggers "Add your Claude API key" message with link

**F23** | Rate limit detection with usage warning
**Source:** Decisions line 183, PRD line 124
**Verification:** 429 response shows "Check your API tier" message

**F24** | Action failure explanation in plain English
**Source:** Decisions line 184, PRD line 149-152
**Verification:** Error responses translated to user-friendly language

**F25** | Chat history stored in transients (1-hour expiry)
**Source:** Decisions lines 85-98
**Verification:** get_transient('wp_autopilot_chat_{user_id}') returns message array

**F26** | REST API endpoint: POST /wp-json/wp-autopilot/v1/chat
**Source:** PRD line 189, Decisions line 202
**Verification:** Endpoint registered, accepts JSON, returns structured response

**F27** | Claude API integration with context + user message
**Source:** PRD line 100-159, Decisions line 162
**Verification:** PHP cURL request to Anthropic API with system prompt + user input

**F28** | Structured action parsing from Claude response
**Source:** PRD line 154-159, Decisions line 204
**Verification:** PHP parses <action> XML tags or JSON from Claude response

**F29** | WordPress action execution (create/edit/activate)
**Source:** PRD line 119, Decisions line 204
**Verification:** Parsed actions call wp_insert_post(), wp_update_post(), activate_plugin()

**F30** | No delete actions without double-confirm
**Source:** Decisions line 356, PRD line 153
**Verification:** DELETE operations require explicit "yes, delete" confirmation

---

### UI/UX REQUIREMENTS (U1-U25)

**U1** | One sentence greeting: "What would you like to build?"
**Source:** Decisions lines 46-48
**Verification:** First chat load shows exactly this text

**U2** | One example prompt: "Try: Add a contact page"
**Source:** Decisions lines 48, 189
**Verification:** Example shown below greeting (and only one)

**U3** | NO tutorial, NO feature tour, NO "Welcome to..." text
**Source:** Decisions line 49, 466
**Verification:** Grep for "welcome\|tutorial\|getting started" returns no matches in UI

**U4** | Clean, minimal, text-focused interface
**Source:** Decisions lines 51-54
**Verification:** Chat panel uses white background, clear typography, no distractions

**U5** | NO robot icons, NO "AI branding," NO gradients
**Source:** Decisions line 53
**Verification:** No AI-themed imagery in chat panel

**U6** | White background, clear typography, instant feedback
**Source:** Decisions line 54
**Verification:** CSS uses #ffffff background, readable font, no loading delays

**U7** | Confident assistant voice (no hedging)
**Source:** Decisions lines 59-67
**Verification:** Responses use "Done. Your contact form is live." not "I think I created..."

**U8** | Active voice, short sentences, direct responses
**Source:** Decisions line 65
**Verification:** No passive voice ("The page was created by me...")

**U9** | NO hedging words: "might," "possibly," "I think"
**Source:** Decisions line 62
**Verification:** Grep for hedging patterns in response templates

**U10** | NO corporate speak: "leverage," "utilize"
**Source:** Decisions line 63
**Verification:** Grep for corporate jargon in response templates

**U11** | NO AI cheerleading: "As an AI assistant..."
**Source:** Decisions line 64
**Verification:** No self-referential AI language in responses

**U12** | Markdown rendering for code blocks, lists, headings
**Source:** Decisions lines 130-134
**Verification:** Chat displays ```code```, **bold**, ## headings correctly

**U13** | NO syntax highlighting, NO diff views, NO copy buttons (v1)
**Source:** Decisions line 132
**Verification:** Basic markdown only, no advanced features

**U14** | Simple before/after preview (visual, not technical)
**Source:** Decisions lines 135-138
**Verification:** Preview shows "Current: ..." and "New: ..." in plain text

**U15** | Settings page with API key field
**Source:** Decisions lines 145-155
**Verification:** Admin settings page renders with one text input for API key

**U16** | 3-step visual guide for API key setup
**Source:** Decisions line 189
**Verification:** Settings page shows: 1) Sign up 2) Copy key 3) Paste here

**U17** | NO verbose output modes, NO confirmation preferences, NO "advanced mode"
**Source:** Decisions line 155
**Verification:** Settings page has ONE setting (API key)

**U18** | Optional usage limit warnings toggle
**Source:** Decisions line 151
**Verification:** Settings includes checkbox for rate limit notifications

**U19** | Optional error logging toggle
**Source:** Decisions line 151
**Verification:** Settings includes checkbox for error log storage

**U20** | "Thinking..." indicator during API call (not loading spinner)
**Source:** Decisions line 332
**Verification:** Chat shows text-based indicator while waiting for Claude

**U21** | Error states handled gracefully with user-friendly messages
**Source:** PRD line 242, Decisions line 184
**Verification:** All error paths return plain English explanations

**U22** | No blank canvas paralysis mitigation
**Source:** Decisions lines 343-348
**Verification:** Example prompt prevents "What do I do?" abandonment

**U23** | Suggest actions based on site state (optional feature)
**Source:** Decisions line 346
**Verification:** "I notice you don't have an About page..." proactive suggestions

**U24** | Response streaming if Claude API supports it
**Source:** Decisions line 332
**Verification:** Chat displays tokens as they arrive (not waiting for full response)

**U25** | First message sent in <60 seconds (onboarding clarity)
**Source:** Decisions line 440
**Verification:** Time from plugin activation to first message submission <1 minute

---

### TECHNICAL ARCHITECTURE (T1-T52)

**T1** | PHP 7.4+ backend compatibility
**Source:** PRD line 111, Decisions line 234
**Verification:** Plugin header declares "Requires PHP: 7.4"

**T2** | WordPress 6.0+ compatibility
**Source:** PRD line 237, Decisions line 234
**Verification:** Plugin header declares "Requires at least: 6.0"

**T3** | Alpine.js (12KB) for frontend framework
**Source:** Decisions lines 100-114
**Verification:** alpine.js loaded via CDN, no React in bundle

**T4** | NO React, NO 50KB+ bundle
**Source:** Decisions lines 100-109
**Verification:** Total JavaScript bundle <50KB

**T5** | User-provided API keys (zero server infrastructure)
**Source:** Decisions lines 75-81
**Verification:** No server-side API key pooling, user supplies own key

**T6** | API key encrypted in wp_options
**Source:** Decisions line 80, PRD line 127
**Verification:** Encryption uses WordPress SECURE_AUTH_KEY or AES-256-GCM

**T7** | Transients for chat history (1-hour expiry)
**Source:** Decisions lines 85-98
**Verification:** set_transient('wp_autopilot_chat_{user_id}', $history, 3600)

**T8** | NO custom database tables (v1)
**Source:** Decisions lines 86-98
**Verification:** No CREATE TABLE statements, no $wpdb->query() for schema

**T9** | Paginated context collection (not comprehensive site dump)
**Source:** Decisions lines 117-121
**Verification:** Context limited to 10 pages, 5 plugins, active theme

**T10** | Context payload <2K tokens
**Source:** Decisions line 334
**Verification:** System prompt + context JSON <2000 tokens when sent to Claude

**T11** | WordPress REST API for internal mutations
**Source:** PRD line 96, Decisions line 202
**Verification:** wp_insert_post(), wp_update_post() called via REST handlers

**T12** | Claude API endpoint: Anthropic Messages API
**Source:** PRD line 100
**Verification:** POST to https://api.anthropic.com/v1/messages

**T13** | Claude model: claude-sonnet-4-20250514 (default)
**Source:** PRD line 178
**Verification:** API request specifies model version

**T14** | Fallback to GPT-4 if Claude API unreachable (optional)
**Source:** Decisions line 295
**Verification:** Error handler detects Claude 503 and switches to OpenAI

**T15** | Version lock Claude API to prevent breaking changes
**Source:** Decisions line 294
**Verification:** API requests specify exact model version, not "latest"

**T16** | System prompt defines available actions
**Source:** PRD lines 133-159
**Verification:** System message includes: create_page, edit_page, insert_block, activate_plugin

**T17** | Structured output format for actions (XML or JSON)
**Source:** PRD lines 154-159
**Verification:** Claude response includes <action> tags or JSON with "type" field

**T18** | Action executor parses structured output
**Source:** PRD line 119, Decisions line 204
**Verification:** PHP class parses XML/JSON and maps to WordPress functions

**T19** | Action executor validates before execution
**Source:** Decisions line 356
**Verification:** Executor checks user capability, resource existence before mutation

**T20** | Confirmation required for all mutations
**Source:** PRD line 68, Decisions line 355
**Verification:** No wp_insert_post() call without user confirming action

**T21** | Undo stores last action in transient
**Source:** Decisions line 359
**Verification:** set_transient('wp_autopilot_undo_{user_id}', $action, 3600)

**T22** | REST endpoint permission check: edit_posts capability
**Source:** PRD line 97, WordPress security best practice
**Verification:** register_rest_route() includes 'permission_callback' => current_user_can('edit_posts')

**T23** | Settings page permission check: manage_options capability
**Source:** WordPress security best practice
**Verification:** Admin page registration checks current_user_can('manage_options')

**T24** | Nonce verification for settings form
**Source:** WordPress security best practice
**Verification:** Settings form includes wp_nonce_field(), handler calls wp_verify_nonce()

**T25** | Input sanitization for all $_GET/$_POST
**Source:** WordPress security best practice
**Verification:** All input uses sanitize_text_field(), sanitize_email(), etc.

**T26** | Output escaping for all admin page content
**Source:** WordPress security best practice
**Verification:** All echo/print uses esc_html(), wp_kses_post(), wp_json_encode()

**T27** | Prepared statements for all database queries
**Source:** WordPress security best practice
**Verification:** All $wpdb->query() uses $wpdb->prepare() with placeholders

**T28** | NO hardcoded paths (use WordPress functions)
**Source:** LEARNINGS.md lesson 11, Decisions line 376
**Verification:** No /Users/, /home/, C:\Users\ in codebase

**T29** | NO eval(), exec(), passthru(), or system() calls
**Source:** WordPress.org security requirements
**Verification:** Grep for dangerous functions returns no matches

**T30** | GPL-2.0 compatible license
**Source:** PRD line 222, WordPress.org requirement
**Verification:** Plugin header declares "License: GPL v2 or later"

**T31** | readme.txt with proper WordPress.org headers
**Source:** PRD line 222
**Verification:** readme.txt includes Tested up to, Stable tag, etc.

**T32** | Plugin activation hook (no database changes in v1)
**Source:** PRD line 197
**Verification:** register_activation_hook() defined (empty or minimal)

**T33** | Plugin deactivation hook (cleanup transients)
**Source:** WordPress best practice
**Verification:** register_deactivation_hook() deletes transients

**T34** | Admin menu registration
**Source:** PRD line 210
**Verification:** add_menu_page() or add_submenu_page() in admin_menu hook

**T35** | Enqueue admin assets (CSS/JS) only on plugin pages
**Source:** WordPress best practice
**Verification:** wp_enqueue_script() called only on admin_enqueue_scripts with screen check

**T36** | Namespace all JavaScript functions/variables
**Source:** Decisions line 319
**Verification:** All JS prefixed with wp_autopilot_ or wpAutopilot

**T37** | Namespace all CSS classes
**Source:** Decisions line 319
**Verification:** All classes prefixed with .wp-autopilot-

**T38** | NO conflicts with popular plugins (test with top 20)
**Source:** Decisions line 319
**Verification:** QA tests with WooCommerce, ACF, Yoast, Elementor, etc.

**T39** | Browser compatibility: Chrome, Firefox, Safari, Edge
**Source:** WordPress standard
**Verification:** Alpine.js and CSS work in all major browsers

**T40** | Mobile responsive admin panel (optional for v1)
**Source:** Nice-to-have
**Verification:** Chat panel usable on tablet/phone (not primary use case)

**T41** | Error logging opt-in (not on by default)
**Source:** Decisions line 269-273
**Verification:** Settings toggle enables error_log() for API failures

**T42** | Error logs exclude API key
**Source:** Security requirement
**Verification:** error_log() never includes $_POST['api_key'] or decrypted key

**T43** | Rate limit response handling
**Source:** Decisions line 302-310
**Verification:** 429 HTTP status triggers user-facing warning with Anthropic link

**T44** | Timeout handling (3-10 second Claude response)
**Source:** Decisions line 329
**Verification:** wp_remote_post() includes 'timeout' => 30 parameter

**T45** | Retry logic for transient failures (optional)
**Source:** LEARNINGS.md lesson 3
**Verification:** API client retries once on 503/timeout before showing error

**T46** | NO streaming responses in v1 (add if API supports)
**Source:** Decisions line 332
**Verification:** Wait for full Claude response before displaying

**T47** | Context collection runs <2 seconds
**Source:** Performance target
**Verification:** get_posts(), get_plugins(), wp_get_theme() combined <2s

**T48** | Plugin file size <500KB (excluding Alpine.js CDN)
**Source:** WordPress.org best practice
**Verification:** ZIP file for distribution <500KB

**T49** | NO external dependencies except Alpine.js CDN and Claude API
**Source:** Decisions line 113
**Verification:** No npm packages bundled, no Composer dependencies

**T50** | PHP class autoloading (optional, nice-to-have)
**Source:** WordPress coding standards
**Verification:** spl_autoload_register() or manual require_once for classes

**T51** | NO cron jobs, NO background processing (v1)
**Source:** Simplicity constraint
**Verification:** No wp_schedule_event() calls

**T52** | NO multi-site support (v1)
**Source:** PRD line 74, out of scope
**Verification:** Plugin may break on multi-site (not tested)

---

### FILE STRUCTURE REQUIREMENTS (FS1-FS25)

**FS1** | Main plugin file: wp-autopilot.php
**Source:** PRD line 197, Decisions line 196
**Verification:** Plugin header with Name, Description, Version, Author

**FS2** | Plugin header includes: Plugin Name, Plugin URI, Description, Version, Author, License
**Source:** WordPress.org requirements
**Verification:** First 20 lines of wp-autopilot.php contain all headers

**FS3** | includes/ directory for PHP classes
**Source:** PRD line 199, Decisions line 196
**Verification:** Directory exists with PHP class files

**FS4** | includes/class-api-client.php (~100 lines)
**Source:** PRD line 200, Decisions line 226
**Verification:** File exists, handles Claude API POST requests

**FS5** | includes/class-context-collector.php (~50 lines)
**Source:** PRD line 201, Decisions line 227
**Verification:** File exists, collects theme/plugins/pages

**FS6** | includes/class-action-executor.php (~100 lines)
**Source:** PRD line 202, Decisions line 228
**Verification:** File exists, parses and executes WordPress actions

**FS7** | includes/class-chat-handler.php (~50 lines)
**Source:** PRD line 203, Decisions line 229
**Verification:** File exists, registers REST endpoint

**FS8** | admin/ directory for settings and UI
**Source:** PRD line 205, Decisions line 196
**Verification:** Directory exists with admin-specific files

**FS9** | admin/class-settings-page.php (~50 lines)
**Source:** PRD line 206, Decisions line 230
**Verification:** File exists, registers admin menu and settings

**FS10** | admin/class-chat-ui.php (optional, or inline in settings)
**Source:** PRD line 207, Decisions line 196
**Verification:** Renders chat panel HTML scaffold

**FS11** | admin/views/settings.php
**Source:** PRD line 210
**Verification:** HTML template for settings page form

**FS12** | admin/views/chat-panel.php
**Source:** PRD line 211
**Verification:** HTML scaffold for chat UI (Alpine.js attaches here)

**FS13** | assets/ directory for CSS/JS
**Source:** PRD line 213, Decisions line 196
**Verification:** Directory exists with subdirectories

**FS14** | assets/css/chat-panel.css (~50 lines)
**Source:** PRD line 216, Decisions line 231
**Verification:** Minimal styling (white background, clean typography)

**FS15** | assets/js/chat.js (~200 lines, Alpine.js)
**Source:** PRD line 218, Decisions line 231
**Verification:** Alpine.js component handling send/receive/render

**FS16** | assets/images/ (empty in v1)
**Source:** PRD line 219, Decisions line 53
**Verification:** No logos, no icons in MVP

**FS17** | readme.txt for WordPress.org listing
**Source:** PRD line 221
**Verification:** Standard WordPress readme format with sections

**FS18** | README.md for GitHub (optional)
**Source:** PRD line 222
**Verification:** GitHub readme with installation instructions

**FS19** | LICENSE file (GPL-2.0)
**Source:** PRD line 222
**Verification:** GPL v2 license text included

**FS20** | NO node_modules/ (Alpine.js via CDN)
**Source:** Decisions line 113
**Verification:** No npm dependencies bundled

**FS21** | NO build toolchain (no webpack, no babel)
**Source:** Decisions line 109
**Verification:** No package.json, no build scripts

**FS22** | Total line count: ~600 lines
**Source:** Decisions line 234
**Verification:** PHP classes + JS + CSS sum to ~600 lines

**FS23** | NO vendor/ directory (no Composer dependencies)
**Source:** Simplicity constraint
**Verification:** All code is custom, no third-party PHP libraries

**FS24** | NO tests/ directory (v1)
**Source:** Out of scope for MVP
**Verification:** No PHPUnit or Jest tests in initial release

**FS25** | Plugin slug: wp-autopilot
**Source:** PRD title, Decisions line 29
**Verification:** Directory name and text domain use "wp-autopilot"

---

### QUALITY & TESTING REQUIREMENTS (Q1-Q20)

**Q1** | Plugin installs and activates without errors on WordPress 6.0+
**Source:** PRD line 237
**Verification:** Manual test on clean WordPress install

**Q2** | Chat panel appears in wp-admin sidebar or top menu
**Source:** PRD line 238
**Verification:** Admin menu item visible after activation

**Q3** | User can create a new page via chat
**Source:** PRD line 239
**Verification:** End-to-end test: "Create About page" → Page exists in wp-admin

**Q4** | User can edit existing page content via chat
**Source:** PRD line 240
**Verification:** End-to-end test: "Change homepage title" → Title updated

**Q5** | AI responses include confirmation before actions
**Source:** PRD line 241
**Verification:** Chat shows "I'll create X. Proceed?" before mutation

**Q6** | Actions execute successfully via WordPress functions
**Source:** PRD line 242
**Verification:** wp_insert_post() returns post ID, not WP_Error

**Q7** | Error states handled gracefully
**Source:** PRD line 243
**Verification:** Invalid API key, rate limit, timeout all show user-friendly messages

**Q8** | Settings page for API key configuration renders without errors
**Source:** PRD line 244
**Verification:** Settings page loads, form submits, key saves

**Q9** | NO PHP warnings, notices, or errors in debug mode
**Source:** WordPress coding standards
**Verification:** Enable WP_DEBUG, check for any error_log() output

**Q10** | NO JavaScript console errors or warnings
**Source:** WordPress coding standards
**Verification:** Browser console clear when chat panel loads

**Q11** | Plugin deactivates cleanly (no fatal errors)
**Source:** WordPress.org requirement
**Verification:** Deactivate plugin → No errors, transients cleaned up

**Q12** | Plugin uninstalls cleanly (cleanup wp_options)
**Source:** WordPress.org requirement
**Verification:** Uninstall deletes wp_autopilot_* options

**Q13** | REST API endpoint returns valid JSON
**Source:** API requirement
**Verification:** curl /wp-json/wp-autopilot/v1/chat → Valid JSON response

**Q14** | REST API endpoint rejects unauthenticated requests
**Source:** Security requirement
**Verification:** curl without auth header → 401 or 403 response

**Q15** | Settings page validates API key before saving
**Source:** UX requirement
**Verification:** Invalid key shows error, doesn't save; valid key saves successfully

**Q16** | Chat history persists during session (1 hour)
**Source:** Transient requirement
**Verification:** Send message, refresh page, history still visible

**Q17** | Chat history expires after 1 hour
**Source:** Transient requirement
**Verification:** Wait 1 hour, refresh page, history cleared

**Q18** | Rate limit error displays user-facing message
**Source:** Error handling requirement
**Verification:** Mock 429 response → Chat shows "You've hit your rate limit" message

**Q19** | Plugin works with popular themes (Divi, GeneratePress, Astra)
**Source:** Compatibility requirement
**Verification:** QA tests on 3+ popular themes

**Q20** | Plugin works with popular plugins (WooCommerce, ACF, Yoast)
**Source:** Compatibility requirement
**Verification:** QA tests with 5+ popular plugins active

---

## Success Metrics (S1-S15)

**S1** | 100+ active installs in first week
**Source:** PRD line 207
**Verification:** WordPress.org plugin stats

**S2** | Average 5+ messages per session
**Source:** PRD line 208
**Verification:** Track transient message count per user

**S3** | 70%+ of actions confirmed and executed
**Source:** PRD line 209
**Verification:** Track confirmed actions / total suggested actions

**S4** | 50%+ weekly active users (return rate)
**Source:** PRD line 210
**Verification:** Unique users opening chat panel week-over-week

**S5** | First message sent in <60 seconds (onboarding clarity)
**Source:** Decisions line 440
**Verification:** Time from plugin activation to first message <1 minute

**S6** | 3+ actions completed in first session (engagement)
**Source:** Decisions line 441
**Verification:** Track actions executed in first-time user sessions

**S7** | Users return next day (retention)
**Source:** Decisions line 442
**Verification:** % of users who open chat panel 24 hours after first use

**S8** | Zero 1-star reviews about "doesn't work" (reliability)
**Source:** Decisions line 443
**Verification:** WordPress.org review sentiment analysis

**S9** | 10+ unsolicited testimonials in first month (word-of-mouth potential)
**Source:** Decisions line 444
**Verification:** Social media mentions, WordPress.org reviews with quotes

**S10** | Plugin passes WordPress.org security scan
**Source:** Distribution requirement
**Verification:** No automated security rejections

**S11** | Plugin approved for WordPress.org directory within 7 days of submission
**Source:** Distribution timeline
**Verification:** Plugin status changes to "approved"

**S12** | Product Hunt launch receives 100+ upvotes
**Source:** Distribution strategy (PRD line 52)
**Verification:** Product Hunt page vote count

**S13** | Blog post or YouTube tutorial drives traffic
**Source:** Distribution strategy (PRD line 56)
**Verification:** Google Analytics referrals from content

**S14** | NO user reports of API key leakage or credential theft
**Source:** Security metric
**Verification:** Zero security incidents reported

**S15** | Average response time <5 seconds (perceived speed)
**Source:** UX quality bar
**Verification:** Time from message send to assistant response render

---

## Disputed Decisions (Unresolved)

### DISPUTED #1: Product Name (BLOCKING)

**Steve's Position:** "Wordsmith"
- **Rationale:** Evocative, memorable, speaks to creators not tools
- **Positioning:** "When someone asks 'How'd you build that site?' they'll say 'Wordsmith'"
- **Target:** Baristas, consultants, non-technical creators

**Elon's Position:** "WP Autopilot"
- **Rationale:** Ship first, rebrand later if data supports it
- **Positioning:** "This is Copilot for WordPress"
- **Target:** Pragmatic users who want productivity tools

**DECISION REQUIRED:** Choose name before build or ship as "WP Autopilot" with rebrand option post-launch

**Impact:** Plugin slug, text domain, branding, WordPress.org listing, all marketing
**Blocking:** YES — Must decide before creating any files
**Recommendation:** Ship as "WP Autopilot" for MVP, monitor user language for rebrand signals

---

### DISPUTED #2: Chat History Persistence (RESOLVED for v1)

**Elon's Position:** Transients (1-hour expiry)
- **Rationale:** Zero custom database tables, no maintenance burden
- **Risk:** Users lose "memory magic"

**Steve's Position:** Custom table (permanent storage)
- **Rationale:** "Continue where we left off" magic moment
- **Risk:** Migration scripts, corrupted table support tickets

**BUILD DECISION:** Start with transients, add persistence in v1.1 if users demand it
- **Mitigation:** Test with 10 beta users, measure retention impact
- **Success Criteria:** If 50%+ mention "I wish you remembered" → Upgrade to custom table

**Impact:** User experience, retention metrics, code complexity
**Blocking:** NO — Decision made for v1 (transients)

---

### DISPUTED #3: Markdown Rendering Scope

**Question:** How much markdown formatting in v1?

**Locked:** Bold, lists, headings, code blocks
**Open:** Link rendering? Image embeds? Tables?

**Decision:** Implement progressively — start minimal, add based on real chat logs

**Impact:** Feature scope, JavaScript complexity
**Blocking:** NO — MVP defined (basic markdown)

---

## Open Questions

### Question 1: Error Logging for Support

**Question:** Store error logs for debugging?

**Concern:** Privacy (don't log user prompts), support burden (need diagnostic data)

**Options:**
- A) Log API errors only (status codes, rate limits)
- B) Log full request/response (opt-in via setting)
- C) No logging (user screenshots for support)

**Decision needed by:** Before settings page build

**Recommendation:** Option A (API errors only, no user content)

---

### Question 2: Distribution Timeline

**Question:** When to submit to WordPress.org?

**Options:**
- A) Private beta (10 users) → WordPress.org → Product Hunt
- B) WordPress.org immediately → gather feedback → iterate

**Impact:** Initial user quality vs. feedback speed

**Recommendation:** Private beta first (catch breaking bugs, validate UX)

---

### Question 3: Fallback to GPT-4

**Question:** If Claude API fails, fallback to OpenAI?

**Concern:** Two API keys to manage, more complexity

**Options:**
- A) Claude-only (simpler, aligns with product positioning)
- B) Claude + GPT-4 fallback (resilience, redundancy)

**Decision needed by:** Before API client build

**Recommendation:** Claude-only for v1 (add fallback if Claude reliability issues emerge)

---

### Question 4: Multi-Site Support

**Question:** Should plugin work on WordPress multi-site?

**Current Scope:** Single-site only

**Options:**
- A) Explicitly block multi-site activation (clear messaging)
- B) Allow activation but don't test (may break)
- C) Add multi-site support in v1

**Recommendation:** Option A (block multi-site, add in v1.1 if requested)

---

### Question 5: Mobile Admin Panel Support

**Question:** Should chat panel work on mobile devices?

**Primary Use Case:** Desktop wp-admin

**Options:**
- A) Desktop-only (don't optimize for mobile)
- B) Mobile-responsive (CSS media queries, smaller touch targets)

**Recommendation:** Option A for v1 (WordPress admin is primarily desktop)

---

## Risk Register

### CRITICAL RISKS (Build Blockers)

**RISK 1: Agent Hallucination of WordPress API**
- **Probability:** HIGH
- **Impact:** HIGH (3,600+ lines of non-functional code)
- **Historical Precedent:** Emdash plugin failure
- **Mitigation:** MANDATORY READING: WordPress API docs in CLAUDE.md, BANNED-PATTERNS-WORDPRESS.md with grep checks
- **Owner:** Margaret Hamilton (QA)

**RISK 2: Hardcoded Paths / Environment-Specific Code**
- **Probability:** MEDIUM
- **Impact:** CRITICAL (plugin breaks on any server other than dev machine)
- **Historical Precedent:** 14 files with /Users/sethshoultes/ paths
- **Mitigation:** Grep for hardcoded paths, use WordPress functions (admin_url, wp_upload_dir)
- **Owner:** Margaret Hamilton (QA)

**RISK 3: API Key Exposure & Credential Leakage**
- **Probability:** MEDIUM
- **Impact:** CRITICAL (user keys compromised, project liable)
- **Mitigation:** Backend-only API calls, encryption, never expose to frontend
- **Owner:** Security review before ship

---

### MEDIUM RISKS (UX/Quality Impacts)

**RISK 4: Alpine.js vs. React Framework Conflict**
- **Probability:** MEDIUM
- **Impact:** MEDIUM (chat UI breaks on certain themes/plugins)
- **Mitigation:** Namespace isolation, test with top 20 plugins
- **Owner:** Margaret Hamilton (QA)

**RISK 5: Claude API Rate Limiting & User Billing**
- **Probability:** HIGH
- **Impact:** MEDIUM (users hit limits, blame plugin)
- **Mitigation:** Rate limit detection, user-facing warnings, Anthropic link
- **Owner:** API client implementation

**RISK 6: WordPress Plugin Compatibility & Security Scan Rejection**
- **Probability:** MEDIUM
- **Impact:** MEDIUM (plugin rejected from WordPress.org)
- **Mitigation:** Security checklist, nonce verification, capability checks, input sanitization
- **Owner:** Pre-submission review

**RISK 7: Transient Expiry & Session Data Loss**
- **Probability:** MEDIUM
- **Impact:** MEDIUM (users lose chat history, confused)
- **Mitigation:** User-facing messaging about session duration, v1.1 upgrade path
- **Owner:** Product decision (Elon's architecture)

---

### LOW RISKS (Annoyances, Not Blockers)

**RISK 8: Product Name Collision ("WP Autopilot" vs. Jetpack Autopilot)**
- **Probability:** LOW
- **Impact:** LOW (minor SEO/branding confusion)
- **Mitigation:** Clear differentiation in WordPress.org description
- **Owner:** Marketing/branding

**RISK 9: Support Burden at Scale (10K+ Users)**
- **Probability:** HIGH (if product takes off)
- **Impact:** LOW (time sink, not product failure)
- **Mitigation:** FAQ, auto-responses, escalation path
- **Owner:** Post-launch operations

**RISK 10: Initial Engagement Metrics (Cold Start)**
- **Probability:** MEDIUM
- **Impact:** LOW (affects growth, not viability)
- **Mitigation:** Example prompt, 3-step onboarding, first assistant message
- **Owner:** UX polish

---

## MVP Scope Boundaries

### IN SCOPE (What Ships in v1)

**Core Loop:**
- Chat input/output with message history
- Claude API integration with WordPress context
- Action executor for create/edit/activate operations
- API key management in settings

**Supported Actions:**
- Create/edit pages
- Create/edit posts
- Insert Gutenberg blocks
- Activate plugins
- Install & activate plugins (combined)

**Context Awareness:**
- Active theme name
- Installed plugins (top 5)
- Last 10 modified pages/posts
- Current user role

**Error Handling:**
- Invalid API key → Setup guide
- Rate limit → Usage warning
- Action failure → Plain English explanation

**Onboarding:**
- Settings page with API key field
- 3-step visual guide
- First message: "What would you like to build?"
- One example prompt

---

### OUT OF SCOPE (Future/Never)

**Explicitly Out:**
- Theme switching/customization (v1.1)
- Media library management (v1.1)
- WooCommerce integration (v1.2)
- Multi-site support (v1.1)
- User/role management (never)
- Custom post types (v1.1)
- Persistent chat history (v1.1 if demanded)
- Syntax highlighting (nice-to-have)
- Diff previews (cut from v1)
- Tutorial/feature tour (cut from v1)
- Advanced settings panel (cut from v1)

---

## Build Sequence (Recommended Order)

**Day 1-2:** Core Infrastructure
1. Settings page — API key input, validation, storage
2. API client — Claude integration, error handling, response parsing
3. Context collector — Query WordPress for theme/plugins/pages

**Day 3-4:** Action Execution
4. Action executor — Parse Claude JSON, execute WordPress functions
5. Chat handler — REST endpoint registration, request/response flow

**Day 5-6:** Frontend & Polish
5. Chat UI — Alpine.js panel, message rendering, markdown support
6. Integration testing — End-to-end flow with real Claude API

**Day 7:** Beta Testing
7. Beta testing — 10 users, collect feedback, fix breaking bugs

**Day 8:** Submission
8. WordPress.org submission — Screenshots, readme, support forum monitoring

---

## Requirements Summary

- **Total Requirements:** 72
  - Feature: 30 (F1-F30)
  - UI/UX: 25 (U1-U25)
  - Technical: 52 (T1-T52)
  - File Structure: 25 (FS1-FS25)
  - Quality/Testing: 20 (Q1-Q20)

- **Success Metrics:** 15 (S1-S15)
- **Disputed Decisions:** 3 (1 blocking, 2 resolved)
- **Open Questions:** 5
- **Risks:** 10 (3 critical, 4 medium, 3 low)

- **Critical Path Requirements:** F1, F4, F20, F26, T3, T7, FS1, Q1
- **Verification Method:** Manual QA + automated checks (grep for banned patterns, security scan, functional tests)

---

## Non-Negotiables (Final Synthesis)

### From Steve Jobs
1. **Chat panel design is perfect** — 90% of UX is the chat, no compromises (U4-U6)
2. **Brand voice is confident** — No hedging, no corporate speak, no AI cheerleading (U7-U11)
3. **Markdown rendering** — Readability is non-negotiable (U12)

### From Elon Musk
1. **User-provided API keys** — Zero server cost, scales to 100K users (T5)
2. **Transients, not custom tables** — Maintenance burden too high for v1 (T7-T8)
3. **Alpine.js, not React** — 12KB vs 50KB, simplicity scales (T3-T4)
4. **One week timeline** — 7 days to beta-ready, no scope creep (Build Sequence)

### Shared Agreement
1. **No refactoring during build** — Stick to plan, ship fast
2. **Ruthlessly cut jargon** — Explain or delete
3. **Story dictates length** — No arbitrary targets
4. **Security is non-negotiable** — API key encryption, nonce verification, capability checks (T20-T29)

---

*This requirements document provides atomic specifications and verification criteria for the wp-autopilot project. Each requirement is traceable to source documents and includes specific verification methods.*
