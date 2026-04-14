# PRD: Fix EventDash Plugin — Admin UI + API Pattern Corrections

> Auto-generated from GitHub issue shipyard-ai#31
> Priority: p0

## Problem

EventDash admin pages show "Failed to load admin page" in the browser, blocking all admin management of events. API routes work via curl, confirming the business logic and data storage are functional — the issue is in the admin Block Kit rendering and the hallucinated API patterns throughout the plugin.

The plugin was written against a non-existent API surface and has never been tested against real Emdash. Specific banned patterns present (see `/home/agent/great-minds-plugin/BANNED-PATTERNS.md`):

- **121 instances of `throw new Response(...)`** — banned. Use `throw new Error("message")` or `return { error, status }` instead
- **153 instances of `JSON.stringify` in `kv.set()` calls** — banned. `ctx.kv` auto-serializes; pass the value directly
- **153 instances of `JSON.parse` on `kv.get()` results** — banned. `ctx.kv` auto-deserializes; use the typed return value directly
- **16 instances of `rc.user`** — banned. Emdash handles auth before the handler runs; remove these checks entirely
- **`rc.pathParams`** — banned. Read path params from `rc.input` instead

## CRITICAL: Do NOT Rewrite From Scratch

EventDash has extensive, correct business logic: event data structures, registration management, Stripe ticketing, waitlist handling, calendar logic, RSVP flows, email templates. All of that works. Fix only the API transport patterns. Keep everything else.

The handler signature `async (routeCtx: unknown, ctx: PluginContext)` with `rc = routeCtx as Record<string, unknown>` is CORRECT — do NOT change it.

## Correct Emdash Plugin Patterns

Reference: `BANNED-PATTERNS.md` in this repo.

### Error Returns (not throws)
```typescript
// WRONG (banned)
throw new Response(JSON.stringify({ error: "Event not found" }), { status: 404 });

// CORRECT option A — throw a plain Error
throw new Error("Event not found");

// CORRECT option B — return an error object
return { error: "Event not found", status: 404 };
```

### KV Storage (no manual JSON)
```typescript
// WRONG (banned)
await ctx.kv.set(`event:${id}`, JSON.stringify(event));
const eventJson = await ctx.kv.get<string>(`event:${id}`);
const event = JSON.parse(eventJson) as EventRecord;

// CORRECT — KV auto-serializes and deserializes
await ctx.kv.set(`event:${id}`, event);
const event = await ctx.kv.get<EventRecord>(`event:${id}`);
if (!event) return { error: "Event not found", status: 404 };
```

### Auth Checks (remove rc.user)
```typescript
// WRONG (banned — rc.user doesn't exist in sandbox)
const adminUser = rc.user as Record<string, unknown> | undefined;
if (!adminUser || !adminUser.isAdmin) {
  throw new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
}

// CORRECT — remove the check entirely; Emdash handles auth before handler runs
// No replacement needed
```

### Path Params (use rc.input, not rc.pathParams)
```typescript
// WRONG (banned)
const eventId = String(rc.pathParams?.id ?? "");

// CORRECT
const input = (rc.input ?? {}) as Record<string, unknown>;
const eventId = String(input.id ?? "").trim();
```

### Admin Block Kit Route (page_load required)
For the admin route, `rc.input` contains the Block Kit interaction object:
```typescript
admin: {
  handler: async (routeCtx: unknown, ctx: PluginContext) => {
    const rc = routeCtx as Record<string, unknown>;
    const input = (rc.input ?? {}) as Record<string, unknown>;
    const interactionType = String(input.type ?? "page_load");

    if (interactionType === "page_load") {
      const events = await ctx.kv.get<EventRecord[]>("events:list") ?? [];
      return {
        blocks: [
          { type: "header", text: "EventDash — Event Management" },
          { type: "stats", items: [
            { label: "Total Events", value: String(events.length) },
          ]},
          { type: "table",
            columns: ["Title", "Date", "Location", "Registered", "Capacity"],
            rows: events.map(e => [e.title, e.date, e.location, String(e.registered), String(e.capacity)])
          },
          { type: "actions", elements: [
            { type: "button", text: "Create Event", action_id: "create_event", style: "primary" }
          ]}
        ]
      };
    }

    if (interactionType === "action" && String(input.action_id) === "create_event") {
      return {
        blocks: [
          { type: "header", text: "Create New Event" },
          { type: "form", block_id: "create_event_form",
            fields: [
              { type: "text_input", action_id: "title", label: "Event Title", required: true },
              { type: "text_input", action_id: "date", label: "Date (YYYY-MM-DD)", required: true },
              { type: "text_input", action_id: "time", label: "Time (HH:MM)", required: true },
              { type: "text_input", action_id: "location", label: "Location", required: true },
              { type: "number_input", action_id: "capacity", label: "Max Capacity", required: true },
            ],
            submit: { label: "Create Event", action_id: "submit_create" }
          }
        ]
      };
    }

    return { blocks: [{ type: "section", text: "Unknown interaction" }] };
  }
}
```

## Requirements

### Phase 1: Fix Core Pattern Violations (unblocks the plugin)

1. **Replace all `throw new Response`** — scan all 121 instances in `sandbox-entry.ts`. Replace each with either `throw new Error("message")` or `return { error: "message", status: N }`. Prefer `return` for expected error cases (validation, not found); prefer `throw new Error` for unexpected/catch block errors.

2. **Remove all `JSON.stringify` from `kv.set()` calls** — pass the typed value directly. Example: `ctx.kv.set(key, event)` not `ctx.kv.set(key, JSON.stringify(event))`.

3. **Remove all `JSON.parse` from `kv.get()` results** — use the typed return directly. Example: `const event = await ctx.kv.get<EventRecord>(key)` not `JSON.parse(await ctx.kv.get<string>(key))`.

4. **Remove all `rc.user` checks** — 16 instances. Delete the `if (!adminUser)` guard blocks entirely. Emdash handles auth before the handler runs; no replacement needed.

5. **Replace `rc.pathParams`** — use `rc.input` for all path parameter reads.

### Phase 2: Fix Admin Block Kit UI (unblocks admin panel)

6. **Fix the admin route** — implement `page_load`, `action`, and `form_submit` interaction handlers as shown above. At minimum, `page_load` must return a valid `blocks` array so the admin page loads.

7. **Fix Create Event form submission** — `form_submit` handler for `create_event_form` should create the event in KV using the correct (no-JSON.stringify) pattern and return a confirmation Block Kit response.

### Phase 3: Wire into Sunrise Yoga and Smoke Test

8. **Register EventDash in Sunrise Yoga** — add the plugin to `astro.config.mjs` on the Sunrise Yoga site

9. **Smoke test** — verify:
   - Admin page loads at `/_emdash/admin/plugins/eventdash` (no "Failed to load" error)
   - Create Event form appears and submits successfully
   - `curl /_emdash/api/plugins/eventdash/events` returns events list
   - Created event appears in the events list

## Files to Modify

- `/home/agent/shipyard-ai/plugins/eventdash/src/sandbox-entry.ts` — all fixes (Phases 1–2)
- Sunrise Yoga `astro.config.mjs` — register plugin (Phase 3)

## Success Criteria

- [ ] Admin page at `/_emdash/admin/plugins/eventdash` loads without error
- [ ] Create Event form appears and submits successfully
- [ ] Event list API returns events
- [ ] Zero `throw new Response` in codebase
- [ ] Zero `JSON.stringify`/`JSON.parse` in KV calls
- [ ] Zero `rc.user` or `rc.pathParams` references
- [ ] TypeScript compiles without errors

## Labels
p0, plugin, bug

## Notes

Do not add features or reorganize the file structure. Fix the transport patterns, test the admin UI, ship. Phase 3 (Sunrise Yoga wiring) can be a follow-up PR if needed.
