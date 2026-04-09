# Banned Patterns — Auto-Fail QA

These patterns indicate hallucinated or incorrect API usage. If any are found in built code, QA must BLOCK the build.

## Emdash Plugin Patterns

| Pattern | Why It's Wrong | Correct Alternative |
|---------|---------------|-------------------|
| `throw new Response(` | Emdash sandbox doesn't handle thrown Response objects | `throw new Error("message")` or return error objects |
| `rc.user` | Doesn't exist in sandbox adapter — only `input`, `request`, `requestMeta` are forwarded | Remove auth checks — Emdash handles auth before handler runs |
| `rc.pathParams` | Doesn't exist in sandbox | Read from `rc.input` |
| `rc.rawBody` | Doesn't exist in sandbox | Use `rc.request` or `rc.requestMeta` |
| `rc.headers` | Doesn't exist in sandbox | Use `rc.requestMeta` |
| `process.env` | Doesn't exist in Cloudflare Workers | Use `ctx.env` |
| `JSON.stringify` in `kv.set()` | Emdash KV auto-serializes values | Pass the value directly: `kv.set(key, value)` |
| `JSON.parse` on `kv.get()` | Emdash KV auto-deserializes values | Use the return value directly: `const val = await kv.get<Type>(key)` |

## How to Check

```bash
# Run this from the project root to check all plugin code:
grep -rn "throw new Response\|rc\.user\|rc\.pathParams\|rc\.rawBody\|rc\.headers\|process\.env" plugins/*/src/ --include="*.ts"
```

Any match = BLOCK. Fix the code before passing QA.

## Cross-Project Patterns

These patterns apply to ALL Great Minds code, not just Emdash plugins.

| Pattern | Why It's Wrong | Correct Alternative |
|---------|---------------|-------------------|
| `/Users/sethshoultes/` (or any absolute home path) | Hardcoded paths break on other machines. See `DO-NOT-REPEAT.md` for full context. | Use `${PIPELINE_REPO}`, `${HOME}`, `$(git rev-parse --show-toplevel)`, or relative paths |
| `console.log` in production daemon code | Bypasses the structured logger; missing timestamps and log levels | Use `logger.info()` / `logger.error()` from `daemon/src/logger.ts` |
| `await new Promise(resolve => setTimeout(...))` without timeout protection | Can hang indefinitely if the awaited work never completes | Wrap with `Promise.race([..., timeoutPromise])` or use `AGENT_TIMEOUT_MS` |

### How to Check for Hardcoded Paths

```bash
grep -rn '/Users/' agents/ crons/ skills/ templates/ --include="*.md" --include="*.sh"
```

Any match = BLOCK. Replace with environment variables or auto-detection before merging.
