# Mirror — Demo Script
**Runtime:** 2 minutes
**Format:** Narrator + Screen Directions

---

## SCENE ONE: THE PROBLEM
*[0:00 - 0:35]*

[SCREEN: Split view. Left side: `great-minds-plugin/daemon/pipeline.ts`. Right side: `great-minds/daemon/pipeline.ts`. Both open in VS Code. The files look identical... until they don't.]

**NARRATOR:**
Here's a question that'll ruin your afternoon: *Which one is current?*

[SCREEN: Cursor highlights a function on the left. Then the same function on the right. Different code. Different logic.]

**NARRATOR:**
You fixed a bug last Tuesday. You know you fixed it. You *remember* fixing it. But now you're staring at two files with the same name, in two different repos, and they don't match.

[SCREEN: Slack message pops up: "Hey, is the daemon in great-minds up to date? Seeing weird behavior."]

**NARRATOR:**
And the worst part? You're not sure when they drifted. Was it the last deploy? The one before that? Did someone push directly to the wrong repo?

[SCREEN: Terminal. User types `git log --oneline` in both repos. Different histories. The timestamps don't align.]

**NARRATOR:**
You're not debugging code anymore. You're debugging *trust.* And trust, once broken... takes forever to rebuild.

---

## SCENE TWO: THE SOLUTION
*[0:35 - 1:30]*

[SCREEN: Clean terminal. Single line: `npx tsx scripts/mirror.ts`]

**NARRATOR:**
This is Mirror.

[SCREEN: User hits Enter.]

**NARRATOR:**
Watch what happens.

[SCREEN: Output appears, line by line, quiet and confident:]
```
Mirrored pipeline.ts
Mirrored agents.ts
Mirrored config.ts
Mirrored daemon.ts
Mirrored package.json
Mirrored README.md
Installed dependencies
Committed: "Mirror sync from plugin"
Pushed to origin
```

**NARRATOR:**
Six files. One command. No questions asked.

[SCREEN: Pause on the output. Let it breathe.]

**NARRATOR:**
Mirror doesn't ask if you're sure. It doesn't show you a diff and wait for approval. It doesn't need you to select which files matter.

[SCREEN: Highlight the `Pushed to origin` line]

**NARRATOR:**
The plugin is the source of truth. Mirror reflects that truth to the great-minds repo. Completely. Immediately. The commit message tells the story: *"Mirror sync from plugin."* That's it. That's the whole explanation needed.

[SCREEN: Switch to the great-minds repo. Open `pipeline.ts`. It now matches the plugin version exactly.]

**NARRATOR:**
One source of truth. One direction. No negotiation.

---

## SCENE THREE: THE WOW MOMENT
*[1:30 - 2:00]*

[SCREEN: Back to that split view from the opening. Both files, side by side.]

**NARRATOR:**
Remember this screen? The one that made you question your own memory?

[SCREEN: Run a diff tool. Output: `Files are identical.`]

**NARRATOR:**
Gone.

[SCREEN: Back to the Slack message. User types a reply: "Just ran Mirror. You're current."]

**NARRATOR:**
That question — "which one is current?" — it doesn't exist anymore. Not because you got better at remembering. Because the system *makes forgetting impossible.*

[SCREEN: Terminal. One line of output: `Pushed to origin`. Cursor blinking.]

**NARRATOR:**
Mirror isn't a feature. It's the absence of anxiety. It's the exhale after holding your breath.

[SCREEN: Fade to logo. Simple text: **MIRROR**. Below it: *Trust the reflection.*]

**NARRATOR:**
One source of truth. Perfect reflection. Always current.

[SCREEN: Hold on the logo. Three seconds. Fade out.]

---

## END

**Total runtime:** 2:00

---

*"We're not selling a sync tool. We're selling trust in your own codebase."*
— Steve Jobs, Round 1 Positions
