# Retention Roadmap: What Keeps Users Coming Back

**Author:** Shonda Rhimes (Narrative & Retention)
**Project:** GitHub Intake
**Focus:** V1.1 Features for Habit Formation

---

## The Retention Problem

V1 asks users to file issues into a void. There's no confirmation, no progress, no resolution. That's not a product — that's a prayer.

**Retention requires three things:**
1. Proof the system works (first use)
2. Reason to return (tomorrow)
3. Habit formation (next month)

---

## What Keeps Users Coming Back

### The Retention Loop

```
File Issue → See Progress → Witness Shipment → Feel Relief → File Next Issue
     ↑                                                              ↓
     └──────────────────── HABIT FORMED ───────────────────────────┘
```

**V1 breaks this loop.** There's no "See Progress" and no "Witness Shipment." Users file, then wonder. Wondering is not a retention strategy.

---

## V1.1 Feature: The Feedback Loop

### Feature 1: Issue Acknowledgment

**When:** Immediately after intake converts an issue to PRD

**What:** GitHub comment on the original issue:

```
Intake has received this issue and created a development spec.

Queue position: 3 of 5
Estimated start: ~45 minutes

You'll receive updates as work progresses.
```

**Why it retains:**
- Immediate confirmation (dopamine hit)
- Transparency (trust building)
- Anticipation (cliffhanger: "when will mine start?")

### Feature 2: Progress Updates

**When:** At each pipeline stage transition

**What:** Edited or new comment with status:

```
Status Update: In Progress

- [x] Issue received
- [x] Spec created
- [x] Build started
- [ ] Tests running
- [ ] QA review
- [ ] Shipped

Current step: Building implementation...
```

**Why it retains:**
- Progress visibility (investment payoff)
- Suspense (will tests pass?)
- Engagement (users check back to see updates)

### Feature 3: Ship Notification

**When:** PR merged or code deployed

**What:** Final comment with proof:

```
Shipped. See PR #47.

Time from issue to ship: 2h 14m
Lines changed: 147
Tests passed: 23/23

Your issue is now live. Thank you for contributing.
```

**Why it retains:**
- Closure (emotional payoff)
- Proof (shareable artifact)
- Invitation ("Thank you" implies "do it again")

---

## The Emotional Arc (V1.1 Complete)

| Stage | User Emotion | Trigger |
|-------|--------------|---------|
| **Filing** | Hope | User submits issue |
| **Acknowledgment** | Relief | "Intake has received this" |
| **Queue** | Anticipation | "Queue position: 3 of 5" |
| **Building** | Investment | "Build started" |
| **Testing** | Suspense | "Tests running..." |
| **QA** | Tension | "QA review" |
| **Ship** | Satisfaction | "Shipped. See PR #47" |
| **Invitation** | Motivation | "Thank you for contributing" |

This is a complete story arc. Beginning, middle, end. Setup, confrontation, resolution.

---

## V1.1 Feature: The Content Flywheel

### Feature 4: Ship Stats Summary

**When:** Weekly (if any issues shipped)

**What:** GitHub Discussion or repo wiki update:

```markdown
## This Week in Intake

Issues shipped: 7
Average time to ship: 3h 22m
Total lines of code: 1,247
Tests passed: 156

Top contributors:
- @user1: 3 issues shipped
- @user2: 2 issues shipped
- @user3: 2 issues shipped
```

**Why it retains:**
- Recognition (social proof)
- Competition (gamification)
- Shareable (viral potential)

### Feature 5: Personal Ship History

**When:** On demand (via special issue comment or command)

**What:** Summary of user's shipped issues:

```
Your Intake History:

Total issues shipped: 12
Success rate: 92%
Average ship time: 4h 15m
Most recent: #147 "Add dark mode toggle" (2 days ago)

Keep them coming!
```

**Why it retains:**
- Ownership (personal investment)
- Progress tracking (streak psychology)
- Identity ("I'm someone who ships through Intake")

---

## Retention Metrics to Track

| Metric | Target | Indicates |
|--------|--------|-----------|
| **Return rate** | >60% file second issue within 7 days | First use convinced them |
| **Ship-to-file ratio** | <2 days between ship and next issue | Habit forming |
| **Comment engagement** | >20% click through to PR | Users care about outcome |
| **Share rate** | >5% screenshot/share ship notification | Product-led growth |

---

## The Psychology of Retention

### Why "Shipped. See PR #47" Works

1. **Completion effect:** Open loops cause cognitive dissonance. Closing them provides relief.

2. **Concrete proof:** Abstract "it worked" is weak. Link to specific PR is strong.

3. **Social currency:** "I filed an issue and it shipped in 2 hours" is a story people tell.

4. **Reciprocity:** System delivered value. User wants to reciprocate with more issues.

### Why Status Updates Work

1. **Endowed progress effect:** Showing partial completion increases motivation to see it finish.

2. **Variable reward:** "Will tests pass?" is more engaging than "it's processing."

3. **Investment escalation:** Each update increases user's psychological investment.

---

## V1.1 Implementation Priority

### Must Have (Week 1)
1. Ship notification comment ("Shipped. See PR #47")
2. Basic stats (time to ship, lines changed)

### Should Have (Week 2)
3. Issue acknowledgment ("Intake has received this")
4. Queue position indicator

### Nice to Have (Week 3-4)
5. Progress updates (stage-by-stage)
6. Weekly summary

### Future (V1.2+)
7. Personal ship history
8. Contributor recognition
9. Share/export functionality

---

## The Shonda Principle

Every episode of a TV series must:
1. Resolve something from the previous episode (satisfaction)
2. Open something new for the next episode (anticipation)
3. Make the viewer feel their time was respected (value)

Every Intake interaction must:
1. Resolve the previous issue (ship notification)
2. Invite the next issue (stats, recognition, "keep them coming")
3. Make the user feel their issue mattered (proof, speed, transparency)

---

## Success Criteria for V1.1

V1.1 is successful when:

1. **Every shipped issue has a comment trail** — No silent successes
2. **Users can share proof** — Screenshot-friendly ship notifications
3. **Return rate exceeds 50%** — Users file a second issue within 7 days
4. **Trust is earned** — "I filed it and it shipped" becomes the story

---

## The North Star

**V1:** "I think it worked?"
**V1.1:** "It shipped. I saw it. I'll file another."
**V2:** "I don't even think about it anymore. I just file issues and they become code."

The goal is not engagement. The goal is trust so deep it becomes invisible. Intake should become like electricity — you flip the switch, the light comes on, you don't think about the power plant.

But first, you have to prove the light comes on. That's V1.1.

---

*"Everybody wants a happy ending, right? But it doesn't always roll that way. Unless you build the ending into the product."*
— Shonda Rhimes

---

**Roadmap Owner:** Shonda Rhimes (Narrative & Retention)
**Implementation:** Engineering Team
**Review Cycle:** V1.1 Ship + 30 Days
