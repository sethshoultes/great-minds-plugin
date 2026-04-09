# Hindsight — Demo Script
*Runtime: 2 minutes*

---

[SCREEN: Black. Then a cursor blinks.]

NARRATOR:
Let me tell you about a file called `auth.ts`.

[SCREEN: A code editor opens. `auth.ts` is highlighted in the file tree. It looks... normal.]

NARRATOR:
It doesn't look dangerous. That's the thing about dangerous files — they never do. They look like every other file. Imports at the top. Functions in the middle. Exports at the bottom. Clean. Professional. Nothing to see here.

[SCREEN: Git history scrolls up. Commit messages fly past. "Fix auth redirect." "Fix auth token." "Revert auth changes." "Fix auth session bug."]

NARRATOR:
Except this file has been touched forty-three times in three months. Eleven of those commits have the word "fix" in them. Two say "revert." One just says "please work."

[SCREEN: Freeze on that commit message: "please work"]

NARRATOR:
The humans on this team? They know. They've earned that knowledge. Three AM phone calls. Weekend deployments. The kind of scars you don't forget.

[SCREEN: An AI agent interface. Clean. Eager. A prompt says: "Refactor authentication module."]

NARRATOR:
But here's the thing about AI agents. They don't have scars. They don't have three AM stories. They see a file, they see an opportunity. They're helpful. They're fast. They're confident.

[SCREEN: The agent writes code. Green checkmarks appear. Tests pass. Build succeeds.]

NARRATOR:
And at 4:17 PM on a Tuesday, this agent refactored `auth.ts`. Made it cleaner. Made it modern. Made the tests pass.

[SCREEN: Slack explodes. Datadog goes red. PagerDuty notifications cascade.]

NARRATOR:
By 5:30, production was on fire.

[SCREEN: Fade to black. Beat. Then:]

NARRATOR:
Here's what we built.

[SCREEN: A terminal. A build command runs. Two lines appear:]
```
Building project...
Hindsight: 14 high-risk files identified. Proceed with awareness.
```

NARRATOR:
That's it. That's the whole announcement. Fourteen files. Proceed with awareness. Takes two seconds. No configuration. No dashboard. No settings to ignore.

[SCREEN: A markdown report appears. Simple. Clean.]
```
## High-Churn Files
- `auth.ts` (43 changes)
- `payment.ts` (28 changes)

## Bug-Associated Files
- `auth.ts`
- `session.ts`
```

NARRATOR:
What happened in those two seconds? Hindsight read your git history. Not all of it — the last hundred commits. It asked two questions: What keeps changing? What shows up in commits with words like "fix" and "bug" and "revert"?

[SCREEN: The agent prompt now has a new section highlighted:]
```
## Hindsight Report
Before modifying any file flagged in the report:
1. Read the file completely first
2. Check recent git log for that specific file
3. Make minimal, focused changes
```

NARRATOR:
And then it whispers to your agent. Not "stop." Not "warning." Not a modal dialog with a checkbox nobody reads. Just... "this file has a history. The people who came before you? They have stories about this one. Tread carefully."

[SCREEN: Same refactoring task. But now the agent pauses. Runs `git log auth.ts`. Reads the whole file. Makes one small, surgical change instead of a rewrite.]

NARRATOR:
The agent still does the work. That's the point. We're not here to stop progress. We're here to give your machine the same thing you'd give a new engineer on day one.

[SCREEN: Build succeeds. A new line appears:]
```
Hindsight: auth.ts was flagged. You handled it carefully. Build succeeded.
```

NARRATOR:
We call that vindication. The system flagged a dangerous file. The agent respected the warning. Nothing broke. Nobody got paged.

[SCREEN: The message fades. Just the cursor. Blinking.]

NARRATOR:
Hindsight doesn't make your agents perfect. Nothing does. What it does is give them instinct. The kind that takes humans years to develop. The kind that says "this code has stories" before you learn them the hard way.

[SCREEN: The tagline fades in, centered:]
```
Hindsight
Git Intelligence for AI Agents

"Protection that doesn't announce itself."
```

NARRATOR:
Two seconds. No configuration. No dashboard. Just a machine that finally knows which code is dangerous.

[SCREEN: Fade to black.]

NARRATOR:
And that file? `auth.ts`? It's still there. Still doing its job. Still a little dangerous.

NARRATOR:
But now, everybody knows.

[SCREEN: Black. End.]

---

*End of demo.*
