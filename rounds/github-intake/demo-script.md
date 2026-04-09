# Intake: Demo Script
### Runtime: 2 minutes

---

**[SCREEN: Black. Then — a GitHub issue notification pops up. 2:47 AM timestamp.]**

NARRATOR:
It's three in the morning and your phone just buzzed.

**[SCREEN: The notification expands. "Login button broken on mobile Safari." Label: p1.]**

NARRATOR:
Someone filed an issue. A real one. Priority one.

**[SCREEN: Cut to morning. A developer opens their laptop. Slack has 47 unread messages. The GitHub issue sits in a browser tab, untouched.]**

NARRATOR:
You get to your desk and it's already buried. Buried under standups. Buried under reviews. Buried under the thing that was already on fire when you walked in.

**[SCREEN: Time-lapse. Days tick by on a calendar. 1... 2... 5... 9. The issue still shows "Open."]**

NARRATOR:
Nine days. That's the average. Nine days from "someone should fix this" to someone actually fixing it. Not because your team is slow. Because the space between *filing* and *doing* is where issues go to die.

**[SCREEN: Fade to black. Beat. Then: "INTAKE" appears. Simple. Clean. One word.]**

NARRATOR:
We built something.

**[SCREEN: GitHub interface. A new issue is filed. "Cart total shows $0.00 on checkout." Label: p0.]**

NARRATOR:
Watch.

**[SCREEN: The issue sits there for exactly 4 seconds. Then — in the repo's /prds folder — a new file appears: "github-issue-storefront-47.md"]**

NARRATOR:
No one clicked anything. No one wrote a product requirements doc. No one scheduled a meeting to discuss whether this was worth doing.

**[SCREEN: The PRD file opens. Clean header: repo, issue number, priority. The issue body transformed into structured requirements.]**

NARRATOR:
The issue *became* the PRD.

**[SCREEN: A terminal shows pipeline activity. "Processing PRD: github-issue-storefront-47.md"]**

NARRATOR:
And now it's in the build queue. Same queue that handles everything else. Same agents. Same tests. Same deployment.

**[SCREEN: Close-up on the state file: .github-intake-state.json. The issue number 47 gets added.]**

NARRATOR:
Intake remembers what it's seen. File the same issue twice — it knows. Edit it after conversion — that's logged. No duplicates. No drift. No babysitting.

**[SCREEN: Time-lapse. Hours compress into seconds. The pipeline churns. Tests run. Green checkmarks cascade.]**

NARRATOR:
This is the part that used to take nine days.

**[SCREEN: The pipeline completes. A commit hash appears: abc7f3e. The GitHub issue shows a new comment.]**

NARRATOR:
And this...

**[SCREEN: Close-up on the comment. Three words: "Shipped. See PR #47." The issue status flips from "Open" to "Closed."]**

NARRATOR:
...is the part that usually never happened at all.

**[SCREEN: Pull back to the developer who filed the issue. They're getting coffee. Their phone buzzes. They glance at it. Smile. Keep walking.]**

NARRATOR:
You filed it. You walked away. It shipped.

**[SCREEN: Black. Then the text appears, one line at a time:]**

> "Filing an issue should be the last thing you do."

**[SCREEN: Pause. Then:]**

> "The system handles everything after that."

**[SCREEN: Final beat. The Intake logo. No tagline. No call to action. Just the name.]**

NARRATOR:
That's Intake.

**[SCREEN: Black.]**

---

## Director's Notes

**Tone:** Quiet confidence. Not a sales pitch — a demonstration. Let the product speak.

**Music:** None until the final 20 seconds. Then: ambient, low, builds slightly on "Shipped. See PR #47."

**Pacing:** The first 40 seconds should feel *heavy* — the weight of unreliable systems. The demo section (middle 60 seconds) should feel *effortless*. The final 20 seconds should feel *inevitable*.

**The "Wow" Moment:** It's not the automation. It's the comment. "Shipped. See PR #47." That's when viewers realize this isn't a logging tool — it's a *closure* tool. The issue doesn't just get processed. It gets *finished*.

**What to avoid:** Feature lists. Pricing. "But wait, there's more." This is a story about relief — the relief of putting something down and knowing it won't get dropped. Trust is the product. Show it.

---

*"The absence of experience is the experience."* — Steve Jobs (on Intake)
