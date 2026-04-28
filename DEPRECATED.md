# This plugin has consolidated

`great-minds-plugin` is now also available — and recommended for new installs — as part of the **[Great Minds constellation](https://github.com/sethshoultes/great-minds-constellation)** marketplace, which bundles all 10 great-* plugins under one install.

## For new users

Install from the constellation marketplace:

```
/plugin marketplace add sethshoultes/great-minds-constellation
/plugin install great-minds@great-minds-constellation
```

You only need to add the marketplace once — all 10 great-* plugins become available from it. Install only the ones your project needs (per-project enablement keeps your default Claude Code session lean).

## For existing users

Your install of `great-minds@sethshoultes` keeps working. **No forced migration.** This standalone marketplace remains live for backward compatibility.

To migrate to the constellation:

```
/plugin marketplace remove great-minds
/plugin marketplace add sethshoultes/great-minds-constellation
/plugin install great-minds@great-minds-constellation
```

## Why consolidate

- **One marketplace** instead of ten — simpler setup for users who want multiple plugins
- **Single source of truth** — coordinated updates across the constellation
- **Cleaner discovery** — the constellation README documents all 10 plugins together

## Where to file issues

This repo remains open for backward-compatibility bugs. For new development, file issues on the constellation: <https://github.com/sethshoultes/great-minds-constellation/issues>
