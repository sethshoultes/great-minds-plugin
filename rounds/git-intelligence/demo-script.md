# Hindsight — Demo Script
*Runtime: 2 minutes*

---

**NARRATOR:**
Here's a thing that happened last Tuesday.

[SCREEN: Terminal window. An AI agent running, green text streaming. Looks productive.]

**NARRATOR:**
Our agent was doing what agents do. Writing code. Moving fast. Being helpful. It refactored the authentication module. Cleaned up some imports. Made the tests pass.

[SCREEN: Build succeeds. Green checkmarks. The agent looks like a hero.]

**NARRATOR:**
Shipped at 4pm. By 6pm, production was on fire.

[SCREEN: Slack notifications exploding. Error logs. A Datadog dashboard going red.]

**NARRATOR:**
See, that auth module? It had been touched forty-seven times in the last three months. Nine of those were bug fixes. Two were reverts. The humans on the team knew to tread carefully around that file. They had the scars. They had the stories.

[SCREEN: `git log auth.ts` scrolling. Fix. Fix. Revert. Fix. Bug. The history tells a cautionary tale.]

**NARRATOR:**
The agent didn't know any of that. It saw code. It saw an opportunity to improve. It had no instinct for danger.

[SCREEN: Black screen, single line of text: "What if it did?"]

**NARRATOR:**
This is Hindsight.

[SCREEN: Terminal. Clean. A single command runs: the build pipeline starts.]

**NARRATOR:**
It runs once, at the start of every build. Two seconds. No configuration. No dashboard. You barely know it's there.

[SCREEN: Output line appears: `Hindsight: 14 high-risk files identified. Proceed with awareness.`]

**NARRATOR:**
What it's doing is reading your git history. Not all of it — the last hundred commits. It's looking for patterns. Which files change constantly? Which ones show up in commits with words like "fix" and "bug" and "revert"?

[SCREEN: The Hindsight report appears. Clean markdown. High-churn files listed with change counts. Bug-associated files flagged below.]

**NARRATOR:**
And then it does something simple. It tells the agent.

[SCREEN: Agent prompt visible, with the Hindsight context block highlighted:]
```
Before modifying any file flagged in the report:
1. Read the file completely first
2. Check recent git log for that specific file
3. Make minimal, focused changes
```

**NARRATOR:**
Not "don't touch this." Not a warning. Not a block. Just... "this file has a history. Tread carefully."

[SCREEN: Same refactoring task as before. Agent starts. Pauses on auth.ts. Runs `git log auth.ts`. Reads the whole file. Makes a smaller, surgical change instead of a rewrite.]

**NARRATOR:**
The agent still does the work. But now it has context. It has instinct. It knows what the senior engineers know without needing to have lived through the 2am incident calls.

[SCREEN: Build succeeds. But this time, a new line appears:]
```
Hindsight: auth.ts was flagged. You handled it carefully. Build succeeded.
```

**NARRATOR:**
We call that a vindication moment.

[SCREEN: The line fades. Screen goes quiet. Just the cursor blinking.]

**NARRATOR:**
Hindsight doesn't stop your agents from breaking things. Nothing can do that. What it does is give them the same thing you'd give a new engineer on their first week: a map of where the bodies are buried.

[SCREEN: The tagline fades in:]
```
Hindsight — Git Intelligence for AI Agents
"Protection that doesn't announce itself."
```

**NARRATOR:**
Two seconds. No configuration. Just the instinct to know which code is dangerous.

[SCREEN: Fade to black.]

---

*End of demo.*
