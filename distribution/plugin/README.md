# Great Minds — Claude Desktop Plugin

14 persona agents + 6 co-work skills, carved from the full Great Minds agency for single-session use (no cron, no daemon, no worktrees).

## Agents

**Product / creative:** Steve Jobs, Jony Ive, Rick Rubin, Aaron Sorkin, Maya Angelou
**Board / strategy:** Warren Buffett, Jensen Huang, Oprah Winfrey, Shonda Rhimes
**Growth / ops:** Sara Blakely, Elon Musk, Phil Jackson, Marcus Aurelius
**Engineering QA:** Margaret Hamilton

## Skills

- `/plan <topic-or-path>` — parallel research + atomic XML task cards organized into dependency waves
- `/agency-debate <topic>` — 2-round Jobs vs. Musk debate + Rick Rubin essence distillation
- `/agency-board-review <topic>` — 4 board members review in parallel, consolidated verdict
- `/agency-publish` — Maya writes → Rubin strips → Ive reviews → Oprah checks accessibility
- `/agency-video` — Sorkin script → Rhimes narrative → Ive visual → Remotion + TTS render
- `/agency-anatomy` — File index with token estimates
- `/scope-check` — Compare plan vs. git diff for drift

## Not included (by design)

Cron/daemon/worktree/ship/execute/launch/status/setup/start/memory/tokens/verify skills — those depend on background orchestration that doesn't exist in Claude Desktop. Use the full `great-minds-plugin` repo in Claude Code if you need the autonomous swarm.

## Install

Drop into the Claude Desktop plugin directory, or publish to a marketplace and install by name.

## Notes

Skills write outputs relative to CWD (e.g. `rounds/{slug}/`, `deliverables/`). Run from a project directory, not your home folder.
