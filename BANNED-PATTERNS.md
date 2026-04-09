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
