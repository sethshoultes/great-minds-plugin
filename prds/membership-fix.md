# PRD: Fix MemberShip Plugin — API Pattern Corrections + Sunrise Yoga Integration

> Auto-generated from GitHub issue shipyard-ai#30
> Priority: p0

## Problem

MemberShip plugin was built against a hallucinated Emdash API and has never been tested on a real Emdash instance. It fails at runtime with pattern violations that prevent it from functioning in the sandboxed plugin environment.

Specific banned patterns present in `sandbox-entry.ts` (3,984 lines) — see `BANNED-PATTERNS.md` for full reference:

- **114 instances of `throw new Response(...)`** — banned. Use `throw new Error("message")` or `return { error, status }` instead
- **~50 instances of `JSON.stringify` in `kv.set()` calls** — banned. `ctx.kv` auto-serializes; pass values directly
- **~50 instances of `JSON.parse` on `kv.get()` results** — banned. `ctx.kv` auto-deserializes; use typed return values directly
- **14 instances of `rc.user`** — banned. Emdash handles auth before handler runs; remove these checks entirely

The plugin has extensive correct business logic: JWT auth, member plans, Stripe billing, email templates, group memberships, webhooks, drip content, content gating. None of that needs to change. Only the API transport layer is broken.

## CRITICAL: Do NOT Rewrite From Scratch

Fix the patterns. Keep all business logic, data structures, email templates, Stripe integration, and KV key schemas exactly as-is. The handler signature `async (routeCtx: unknown, ctx: PluginContext)` with `rc = routeCtx as Record<string, unknown>` and `rc.input` is CORRECT — do NOT change it.

## Correct Emdash Plugin Patterns

Reference: `BANNED-PATTERNS.md` in this repo.

### Error Returns
```typescript
// WRONG (banned)
throw new Response(
  JSON.stringify({ error: "Email is required" }),
  { status: 400, headers: { "Content-Type": "application/json" } }
);

// CORRECT option A
throw new Error("Email is required");

// CORRECT option B
return { error: "Email is required", status: 400 };
```

### KV Storage
```typescript
// WRONG (banned — double-encodes, causes deserialization bugs)
await ctx.kv.set(`member:${encodedEmail}`, JSON.stringify(member));
const json = await ctx.kv.get<string>(`member:${encodedEmail}`);
const member = JSON.parse(json) as MemberRecord;

// CORRECT
await ctx.kv.set(`member:${encodedEmail}`, member);
const member = await ctx.kv.get<MemberRecord>(`member:${encodedEmail}`);
if (!member) return { error: "Member not found", status: 404 };
```

### KV Lists
```typescript
// WRONG
await ctx.kv.set("members:list", JSON.stringify(membersList));
const listJson = await ctx.kv.get<string>("members:list");
const list = JSON.parse(listJson) as string[];

// CORRECT
await ctx.kv.set("members:list", membersList);
const list = await ctx.kv.get<string[]>("members:list") ?? [];
```

### Auth Checks
```typescript
// WRONG (banned — rc.user doesn't exist)
const adminUser = rc.user as Record<string, unknown> | undefined;
if (!adminUser || !adminUser.isAdmin) {
  throw new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
}

// CORRECT — remove the check entirely; Emdash handles auth before handler runs
// Delete the entire if-block
```

### Admin Block Kit Route (page_load required)
For the admin route, `rc.input` contains the Block Kit interaction:
```typescript
admin: {
  handler: async (routeCtx: unknown, ctx: PluginContext) => {
    const rc = routeCtx as Record<string, unknown>;
    const input = (rc.input ?? {}) as Record<string, unknown>;
    const interactionType = String(input.type ?? "page_load");

    if (interactionType === "page_load") {
      const memberList = await ctx.kv.get<string[]>("members:list") ?? [];
      const plansList = await ctx.kv.get<PlanConfig[]>("plans") ?? [];
      return {
        blocks: [
          { type: "header", text: "MemberShip — Membership Management" },
          { type: "stats", items: [
            { label: "Total Members", value: String(memberList.length) },
            { label: "Active Plans", value: String(plansList.length) },
          ]},
          { type: "actions", elements: [
            { type: "button", text: "Manage Members", action_id: "view_members", style: "primary" },
            { type: "button", text: "Manage Plans", action_id: "view_plans" },
          ]}
        ]
      };
    }

    return { blocks: [{ type: "section", text: "Unknown interaction" }] };
  }
}
```

## Requirements

### Phase 1: Fix All Pattern Violations (systematic, top-to-bottom)

1. **Replace all `throw new Response`** — 114 instances. Replace each with either `throw new Error("message")` or `return { error: "message", status: N }`. Do NOT preserve `JSON.stringify` inside the error — just use a plain string message.

2. **Remove all `JSON.stringify` from `kv.set()` calls** — pass typed values directly. This affects member records, plan configs, webhook data, group records, lists, and settings.

3. **Remove all `JSON.parse` from `kv.get()` results** — use typed returns directly via `ctx.kv.get<T>(key)`. Replace every `JSON.parse(x)` pattern where `x` came from `kv.get`.

4. **Remove all `rc.user` checks** — 14 instances. Delete the entire `if (!adminUser || !adminUser.isAdmin)` guard blocks. No replacement needed.

### Phase 2: Fix Admin Block Kit UI

5. **Implement admin `page_load` handler** — the admin page must return a valid `blocks` array on `page_load`. Use the example above as a starting point. Show member count, plan count, and action buttons.

6. **Member list view** — handle `action_id: "view_members"` interaction, display a table of recent members with status and plan.

7. **Plan management** — handle `action_id: "view_plans"` interaction, display current plans with name, price, and interval.

### Phase 3: Wire into Sunrise Yoga

8. **Register MemberShip in Sunrise Yoga** — Sunrise Yoga is the designated test bed. Add the plugin to the site's `astro.config.mjs`.

9. **Smoke test** — verify end-to-end on Sunrise Yoga:
   - Admin page loads at `/_emdash/admin/plugins/membership` (no errors)
   - `POST /_emdash/api/plugins/membership/register` with `{ email: "test@example.com", plan: "basic" }` returns `{ success: true }` (not a double-encoded JSON string)
   - `GET /_emdash/api/plugins/membership/status?email=test@example.com` returns a `MemberRecord` object (not a string)
   - Member data stored in KV is an object (not a JSON-encoded string)

## Files to Modify

- `/home/agent/shipyard-ai/plugins/membership/src/sandbox-entry.ts` — all fixes (Phases 1–2)
- Sunrise Yoga `astro.config.mjs` — register plugin (Phase 3)

Note: `./auth.ts` and `./email.ts` are separate files — check them for the same banned patterns but only fix if present. Do not restructure them.

## Success Criteria

- [ ] Admin page at `/_emdash/admin/plugins/membership` loads without error
- [ ] Member registration returns correct typed response (not double-encoded JSON string)
- [ ] Member status lookup returns `MemberRecord` object
- [ ] Zero `throw new Response` in codebase
- [ ] Zero `JSON.stringify`/`JSON.parse` in KV calls
- [ ] Zero `rc.user` references
- [ ] TypeScript compiles without errors
- [ ] Smoke test passes on Sunrise Yoga

## Labels
p0, plugin, bug

## Notes

This is the largest plugin in the Shipyard portfolio at 3,984 lines. Make all pattern fixes in one systematic pass through the file before testing. The fixes are mechanical and repetitive — a global find-and-replace is appropriate for the JSON.stringify/throw patterns, followed by targeted removal of rc.user guard blocks. Do not fix one section and test — fix everything, then compile, then smoke test.
