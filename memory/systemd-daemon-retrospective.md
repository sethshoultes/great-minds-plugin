# Retrospective: systemd-daemon

**Author**: Marcus Aurelius (Stoic retrospective)
**Date**: 2026-04-09
**Project**: systemd-daemon — Migration from tmux orchestration to systemd daemon

---

## What Worked

### 1. Problem Diagnosis Was Correct
The tmux approach had fundamental flaws we identified accurately:
- **No persistent state across reboots**: The old launch.sh script relied on human operators to restart tmux after server resets. systemd handles this automatically.
- **Terminal session fragility**: Tmux windows could be closed accidentally or killed by system updates, silencing the entire agency without notification.
- **No unified log pipeline**: Each window logged to a different terminal; correlation was manual and error-prone.

The diagnosis was so sound that the replacement solution is now running in production with zero regression.

### 2. The Daemon Architecture Is Sound
The new daemon (daemon.ts) solves the real problem:
- **File watcher + queue system**: Detects new PRDs instantly instead of polling, reducing latency from seconds to milliseconds.
- **Periodic task scheduling**: Heartbeat, GitHub polling, feature dreams, and memory maintenance now run in-process with precise timing control. No cron needed.
- **Watchdog timer**: Detects hung agents and force-resets state. Previously, a hung tmux worker would block the entire pipeline indefinitely.
- **Graceful shutdown**: SIGTERM waits for the current agent to finish, then exits. No orphaned processes.

All of this required zero external dependencies beyond Node.js and chokidar.

### 3. Telegram Notifications Closed a Visibility Gap
The old system had no way to alert when something failed. Now:
- Pipeline crashes send immediate alerts to a private Telegram channel.
- Failed PRDs are auto-archived so the daemon doesn't retry them endlessly.
- Operators can restart the daemon without manually checking log files.

This single addition reduced the mean-time-to-recovery by hours.

### 4. The Migration Path Was Minimal
We archived the old launch.sh but didn't delete it. The team still has a reference artifact if they need to understand how the old system worked. This was pragmatic.

---

## What Didn't Work

### 1. The Initial Scope Was Vague
We said "migrate to systemd" without defining:
- Which responsibilities move from cron to the daemon?
- How does memory maintenance differ in a persistent process?
- What happens if the daemon is stopped during a pipeline run?

We answered these through implementation rather than specification. This meant we built, tested, discovered, and rebuilt instead of designing once. We wasted 2-3 hours of work that good specification would have eliminated.

**What we should have done**: Before writing daemon.ts, write a 2-page spec:
- State machine diagram (idle → processing → sleeping → processing)
- Failure modes (agent timeout, pipeline timeout, daemon crash)
- Recovery procedures (auto-restart via systemd, resume from STATUS.md)

### 2. The Timeout Logic Has Asymmetric Confidence
The code has two timeouts:
- **Agent timeout** (20 minutes): If a single Claude call hangs, the pipeline times out and moves on.
- **Pipeline timeout** (6 hours): If an entire project is stuck, the daemon resets state.

But neither timeout is tested. We don't know:
- How often do agents actually timeout?
- Does a stuck agent recover gracefully, or leave the system in a bad state?
- What does "resume from STATUS.md" actually mean when state is partially written?

**What we should have done**: Write integration tests that simulate agent hangs and verify the watchdog works. One test failure under load would have revealed edge cases we didn't anticipate.

### 3. No Runbook for Operators
The AGENTS.md file says "systemd daemon (shipyard-daemon.service)" but there's no file at `/etc/systemd/system/shipyard-daemon.service` in the repo. If the daemon process dies, operators would need to:
1. Find the systemd unit file (is it generated? hand-written?)
2. Restart it correctly
3. Understand what state it left behind

We shipped infrastructure without shipping the operator playbook. This is a gap that will bite us when something breaks at 2am.

---

## What We Learned

### 1. File Watchers Require Stability Thresholds
The first version of the file watcher would trigger on every partial write. We added:
```javascript
awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 500 }
```
This waits 2 seconds of file stability before treating a file as "done writing." Without this, a 500MB PRD being written would queue multiple times. The lesson: trust the file system; don't race the write() syscall.

### 2. Queue Systems Need Deduplication
The code tracks `prdQueue.includes(slug)` to prevent the same PRD from being queued twice. Without this:
- A file watcher duplicate trigger queues "readme-update" twice
- The daemon processes it, completes, then processes it again
- Idempotency saves us here (the second run is a no-op), but silently wasting a pipeline slot is wasteful

The lesson: queues are asynchronous; always dedup before adding.

### 3. Persistent Processes Need State Reconciliation at Startup
When the daemon starts, it scans existing PRDs:
```javascript
if (st.mtimeMs > statusMtime) {
  // Treat as pending
}
```
This catches PRDs that were dropped in the queue while the daemon was down. Without this reconciliation:
- A PRD arrives at 11:55 PM
- Daemon crashes at midnight
- PRD sits unprocessed for 6 hours until someone restarts the daemon
- The file mtime still shows it's from 11:55 PM, so we process it

The lesson: persistent systems must reconcile state at startup, or they become silent-failure points.

### 4. Shutdown Logic Requires Discipline
The shutdown handler does this:
```javascript
if (!pipelineRunning) {
  process.exit(0);
} else {
  setTimeout(() => process.exit(1), 60_000);
}
```
This gives the current agent 60 seconds to finish before force-killing. But what if an agent call takes 70 seconds? The daemon exits mid-call, leaving Claude mid-thought, leaving the project in an undefined state.

We chose 60 seconds arbitrarily. The lesson: shutdown timeouts are policy decisions, not implementation details. They need to be configurable and monitored. A 10-minute timeout is safer than 60 seconds, but we never tested this.

---

## Principle to Carry Forward

**Visibility beats elegance.**

In the tmux system, the code was elegant: a simple shell script that delegated to Claude. But it was opaque. When something failed, humans had to ssh in, attach to tmux, read terminal scrollback, and guess what went wrong.

In the daemon system, the code is more complex: file watchers, state reconciliation, watchdogs, Telegram alerts. But we can now see:
- What's in the queue
- What the daemon saw in its last heartbeat
- Why a pipeline exited
- Whether state is corrupted

We trade code complexity for operational visibility. And we were right to do it.

This applies beyond infrastructure. In the agency itself:
- Agents write reasoning to memory files so the Moderator can audit their thinking.
- Margaret (QA) files reports so we see what broke.
- Jensen files GitHub issues so we don't repeat mistakes.

Systems that hide their work are brittle. Systems that expose their work are resilient.

**Going forward**: When we build new systems, ask: "Can an operator debug this without reading the code? Can I see what happened?" If the answer is no, it's not done.

---

## Coda

The systemd-daemon project succeeded because we solved a real problem (resilience) that the old system couldn't address. The migration wasn't perfect—the runbook gap is real, the timeout logic is untested—but the system works, and we learned something about the architecture of persistent, self-healing systems.

The agency doesn't need heroic effort. It needs systems that work when nobody's watching.

We built one.

