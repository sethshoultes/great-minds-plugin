# Hindsight — Demo Script
*Runtime: 2 minutes | Format: NARRATOR + [SCREEN] stage directions*

---

## ACT ONE: The Problem
*[0:00 - 0:40]*

[SCREEN: Black. A cursor blinks.]

NARRATOR:
Let me tell you about a file called `auth.ts`.

[SCREEN: Code editor opens. `auth.ts` in the file tree. Clean. Unremarkable.]

NARRATOR:
It doesn't look dangerous. That's the thing about dangerous files — they never do. Imports at the top. Functions in the middle. Exports at the bottom. Nothing to see here.

[SCREEN: Git log scrolls. "Fix auth redirect." "Fix auth token." "Revert auth changes." "Fix auth session."]

NARRATOR:
Except this file has been touched forty-three times in three months. Eleven of those commits say "fix." Two say "revert." One just says—

[SCREEN: Freeze on commit message: "please work"]

NARRATOR:
—"please work."

[SCREEN: AI agent interface. Prompt reads: "Refactor authentication module."]

NARRATOR:
The humans on this team? They know. They've earned it. Three AM phone calls. Weekend deploys. Scars you don't forget.

NARRATOR:
But AI agents don't have scars. They see a file. They see opportunity. They're helpful. They're fast. They're confident.

[SCREEN: Agent writes code. Green checkmarks. Build succeeds.]

NARRATOR:
At 4:17 PM on a Tuesday, this agent refactored `auth.ts`. Made it cleaner. Made the tests pass.

[SCREEN: Slack explodes. Datadog goes red. PagerDuty cascades.]

NARRATOR:
By 5:30, production was on fire.

[SCREEN: Fade to black. Beat.]

---

## ACT TWO: The Solution
*[0:40 - 1:30]*

NARRATOR:
Here's what we built.

[SCREEN: Terminal. Build command runs. Two lines appear:]

```
Building project...
Hindsight: 14 high-risk files identified. Proceed with awareness.
```

NARRATOR:
That's it. That's the whole announcement. Fourteen files. Proceed with awareness. Two seconds. No configuration. No dashboard. No settings to ignore.

[SCREEN: Markdown report appears. Simple. Clean.]

```
## High-Churn Files
- auth.ts (43 changes)
- payment.ts (28 changes)

## Bug-Associated Files
- auth.ts
- session.ts
```

NARRATOR:
What happened in those two seconds? Hindsight read your git history. The last hundred commits. It asked two questions: What keeps changing? What shows up next to words like "fix" and "bug" and "revert"?

[SCREEN: Agent prompt with new section highlighted:]

```
## Hindsight Report
Before modifying any file flagged in the report:
1. Read the file completely first
2. Check recent git log for that specific file
3. Make minimal, focused changes
```

NARRATOR:
And then it whispers to your agent. Not "stop." Not "warning." Not a modal with a checkbox nobody reads. Just: "This file has a history. The people who came before you have stories about this one. Tread carefully."

[SCREEN: Same refactoring task. Agent pauses. Runs `git log auth.ts`. Makes one surgical change instead of a rewrite.]

NARRATOR:
The agent still does the work. That's the point. We're not stopping progress. We're giving your machine the same thing you'd give a new engineer on their first day.

---

## ACT THREE: The Wow
*[1:30 - 2:00]*

[SCREEN: Build succeeds. New line appears:]

```
Hindsight: auth.ts was flagged. You handled it carefully. Build succeeded.
```

NARRATOR:
We call that vindication. The system flagged a dangerous file. The agent respected it. Nothing broke. Nobody got paged.

[SCREEN: The message fades. Just the cursor. Blinking.]

NARRATOR:
Hindsight doesn't make your agents perfect. Nothing does. What it does is give them instinct — the kind that takes humans years to develop. The kind that says "this code has stories" before you learn them the hard way.

[SCREEN: Tagline fades in, centered:]

```
Hindsight
Git Intelligence for AI Agents

"Protection that doesn't announce itself."
```

NARRATOR:
Two seconds. Ninety-three lines of code. No configuration. No dashboard. Just a machine that finally knows which code is dangerous.

[SCREEN: Fade to black. Beat.]

NARRATOR:
And that file? `auth.ts`? Still there. Still doing its job. Still a little dangerous.

NARRATOR:
But now... everybody knows.

[SCREEN: Black. End.]

---

*Production notes:*
- The "please work" moment needs a full beat of silence
- "Proceed with awareness" is the emotional hinge — let it land
- Keep transitions invisible; the product is invisible by design
- Final line is a landing, not a tagline — conversational, quiet
