---
name: agency-video
description: Create product videos using Aaron Sorkin (script), Shonda Rhimes (narrative review), Jony Ive (visual review), Remotion (React video framework), and OpenAI TTS (voiceover). Full pipeline from concept to rendered MP4.
argument-hint: <project-name> <duration-seconds>
allowed-tools: [Read, Write, Bash, Agent, Glob, Grep, Edit]
---

# Great Minds Agency — Video Production

Create a product video using the agency's creative team and Remotion.

**Usage:** `/agency-video <project-name> <duration-seconds>`

## Pipeline

### Phase 1: Script (Aaron Sorkin)
Spawn Sorkin agent to write the video script:
```
Agent(subagent_type: "general-purpose", isolation: "worktree", run_in_background: true,
  prompt: "You are Aaron Sorkin. Write a [duration]-second video script for [project].
           Format each scene with Visual, Audio/VO, Motion directions.
           Write to deliverables/[project]-video/script.md")
```

### Phase 2: Narrative Review (Shonda Rhimes)
After script is ready, spawn Shonda to review the narrative arc:
```
Agent(model: "haiku", run_in_background: true,
  prompt: "You are Shonda Rhimes. Review the video script at deliverables/[project]-video/script.md.
           Check: Does it hook in the first 10 seconds? Is there tension that pulls the viewer through?
           Does it build to a satisfying resolution? Would someone share this?
           Write feedback to deliverables/[project]-video/shonda-review.md
           If changes are needed, apply them directly to the script.")
```

### Phase 3: Visual Review (Jony Ive)

After script is ready, spawn Jony Ive to review visual directions:
```
Agent(model: "haiku", run_in_background: true,
  prompt: "You are Jony Ive. Review the script at deliverables/[project]-video/script.md.
           Check: visual hierarchy, spacing, animation timing, color consistency.
           Write feedback to deliverables/[project]-video/visual-review.md")
```

### Phase 3: Build Remotion Project
Spawn builder agent to create the Remotion components:
```
Agent(isolation: "worktree", run_in_background: true,
  prompt: "Build a Remotion video project at deliverables/[project]-video/.
           Read the script. Create: package.json, tsconfig.json, src/Root.tsx,
           src/scenes/ for each scene, src/styles.ts.
           Use 1920x1080, 30fps. Copy persona images if needed.
           Run npm install after creating package.json.")
```

### Phase 4: Generate Voiceover
Extract VO lines from the script and generate audio:
```bash
# For each scene's VO line:
curl -s https://api.openai.com/v1/audio/speech \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"tts-1-hd","input":"[VO text]","voice":"onyx","response_format":"mp3"}' \
  --output public/audio/scene[N].mp3
```

Wire audio into Root.tsx using Remotion's `<Audio>` and `<Sequence>` components.

### Phase 5: Preview & Render
```bash
cd deliverables/[project]-video
npm install
npx remotion studio          # Preview in browser
npx remotion render [comp-id] out/[project].mp4  # Render final
```

## Screenshot Sourcing

For product screenshots, check:
1. Live URLs — use Playwright to capture: `npx playwright screenshot [url] screenshot.png`
2. Existing images — check `website/public/work/[project]/`
3. Generate with OpenAI Image API if needed

## Style Guide

| Property | Value |
|----------|-------|
| Background | #0a0a0a |
| Accent | #f59e0b (amber) |
| Text | #fafafa |
| Code font | JetBrains Mono / monospace |
| Body font | Inter / system-ui |
| Voice | OpenAI TTS "onyx" (deep, professional) |

## Notes
- Each video should be 45-90 seconds
- Hook in the first 3 seconds
- End with clear CTA
- Match the greatminds.company dark theme
- Use persona thumbnails from website/public/personas/
