---
name: agency-content
description: End-to-end content pipeline — research to published blog post with companion video. Uses the full creative team (Maya, Rick, Margaret, Steve, Aaron, Shonda, Jony) and produces a live article + YouTube video.
argument-hint: <topic-or-slug>
allowed-tools: [Read, Write, Bash, Agent, Glob, Grep, Edit]
---

# Great Minds Agency — Content Pipeline

End-to-end pipeline that takes a researched topic and produces a published blog article with a companion video uploaded to YouTube.

**Default path (use 99% of the time):**
```
Research input → Draft (Maya) → Edit (Rick) → Fact-check (Margaret) →
Hero image → Gate (Steve) → Publish → Video script (Sorkin) → Narrative review (Shonda) →
Visual review (Jony) → Remotion render → YouTube (public)
```

**Alternative path (if HeyGen avatars are configured):**
```
…Publish → HeyGen Video Agent → YouTube (public)
```

The pipeline is persona-driven: the writer persona determines editorial voice, and the video persona determines script tone and narration style.

## When to Use

- Creating a new blog post that needs a companion video
- An article is published and needs video amplification
- Running the full auto-content pipeline end-to-end
- Any request that says "blog post and video" or "article with video"

**When NOT to use:**
- Standalone videos not tied to a blog post (use `agency-video`)
- Videos under 10 seconds (use Shorts / Reels workflow)
- Editing an existing article without video (use `agency-publish`)

## Phase 1: Article Creation

### 1. Research Input

Research inputs live in `data/content-inputs/<slug>.json`:

```json
{
  "topic": "How to think in first principles",
  "description": "A guide to first-principles thinking for product teams...",
  "slug": "first-principles-thinking",
  "classification": "strategy",
  "tags": ["product", "strategy", "frameworks"],
  "relatedProjects": ["agency-plan"],
  "relatedVideos": ["first-principles-thinking"],
  "targetWords": 1400,
  "research": [
    { "claim": "First principles thinking originated with Aristotle...", "source": "https://..." }
  ]
}
```

### 2. Draft Generation

Spawn Maya Angelou to write the draft:

```
Agent(subagent_type: "maya-angelou-writer",
  prompt: "Write a {targetWords}-word blog post for topic: {topic}.\n"
          "Classification: {classification}. Tone: warm, direct, authoritative.\n"
          "Save to website/content/blog/{slug}.md with frontmatter:\n"
          "title, description, publishedAt, author, tags, relatedProjects, relatedVideos.")
```

### 3. Edit + Fact-Check

**Edit — Rick Rubin (strip to essence):**
```
Agent(model: "haiku", subagent_type: "rick-rubin-creative",
  prompt: "Review website/content/blog/{slug}.md.\n"
          "Cut anything that doesn't earn its place. Is the headline strong?\n"
          "Does the opening hook in 2 sentences? Can 30% be cut without losing meaning?\n"
          "Write feedback to rounds/blog/{slug}-rick-review.md. Apply changes directly if approved.")
```

**Fact-check — Margaret Hamilton (rigorous verification):**
```
Agent(model: "haiku", subagent_type: "margaret-hamilton-qa",
  prompt: "Review website/content/blog/{slug}.md for unsupported claims,\n"
          "outdated data, or logical holes. Flag anything that needs a source.\n"
          "Write feedback to rounds/blog/{slug}-fact-check.md.\n"
          "If concerns are found, STOP and fix the draft before moving forward.")
```

### 4. Hero Image Generation

Generate a hero image from the article title and description:

```bash
# Via OpenAI Image API
curl -s https://api.openai.com/v1/images/generations \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-image-1","prompt":"Editorial hero image: {title}...","size":"1792x1024"}' \
  --output website/public/blog/assets/{slug}.webp
```

Patch the MDX frontmatter with `heroImage`, `heroAlt`, and `heroCredit`.

### 5. Gate — Steve Jobs

Steve Jobs approves the final article before it ships:

```
Agent(model: "haiku", subagent_type: "steve-jobs-visionary",
  prompt: "Review website/content/blog/{slug}.md.\n"
          "Is this simple enough? Does every sentence earn its place?\n"
          "Would you be proud to ship this? If not, say 'rewrite' and explain why.")
```

### 6. Publish

```bash
# Commit, merge to main, and auto-deploy
# (Vercel / your host handles deploy on push)
git add website/content/blog/{slug}.md website/public/blog/assets/{slug}.webp
git commit -m "feat(blog): publish {slug}"
git push origin main
```

After a successful merge, queue a companion video job in `data/video-queue/pending/<slug>.json`.

### 7. RAG Indexing

If your project has a retrieval corpus, index the new article:

```bash
# Locally (needs OPENAI_API_KEY):
npx tsx scripts/index-blog.ts

# Or via live admin endpoint:
curl -X POST https://your-site.com/api/admin/reindex/blog \
  -H "Authorization: Bearer $ADMIN_API_KEY"
```

## Phase 2: Video Generation (Primary — Remotion + OpenAI TTS)

For every published article, create a companion video using the agency's creative team.

### Step 1: Write the Video Script (Aaron Sorkin)

Spawn Sorkin to write the script:

```
Agent(subagent_type: "aaron-sorkin-screenwriter",
  prompt: "Write a 60–90 second video script based on the article at website/content/blog/{slug}.md.\n"
          "Format each scene with Visual, Audio/VO, Motion directions.\n"
          "Hook in the first 3 seconds. End with a clear CTA.\n"
          "Save to deliverables/{slug}-video/script.md")
```

### Step 2: Narrative Review (Shonda Rhimes)

```
Agent(model: "haiku", subagent_type: "shonda-rhimes-board",
  prompt: "Review deliverables/{slug}-video/script.md.\n"
          "Does it hook in the first 10 seconds? Is there tension that pulls the viewer through?\n"
          "Does it build to a satisfying resolution? Would someone share this?\n"
          "Write feedback to deliverables/{slug}-video/shonda-review.md.\n"
          "If changes are needed, apply them directly to the script.")
```

### Step 3: Visual Review (Jony Ive)

```
Agent(model: "haiku", subagent_type: "jony-ive-designer",
  prompt: "Review deliverables/{slug}-video/script.md.\n"
          "Check visual hierarchy, spacing, animation timing, color consistency.\n"
          "Write feedback to deliverables/{slug}-video/visual-review.md.")
```

### Step 4: Build Remotion Project

Spawn a builder agent:

```
Agent(isolation: "worktree", run_in_background: true,
  prompt: "Build a Remotion video project at deliverables/{slug}-video/.\n"
          "Read the script. Create: package.json, tsconfig.json, src/Root.tsx,\n"
          "src/scenes/ for each scene, src/styles.ts.\n"
          "Use 1920x1080, 30fps. Run npm install after creating package.json.")
```

### Step 5: Generate Voiceover

Extract VO lines and generate audio:

```bash
# For each scene's VO line:
curl -s https://api.openai.com/v1/audio/speech \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"tts-1-hd","input":"[VO text]","voice":"onyx","response_format":"mp3"}' \
  --output deliverables/{slug}-video/public/audio/scene[N].mp3
```

Wire audio into `Root.tsx` using Remotion's `<Audio>` and `<Sequence>` components.

### Step 6: Preview & Render

```bash
cd deliverables/{slug}-video
npm install
npx remotion studio              # Preview in browser
npx remotion render [comp-id] out/{slug}.mp4  # Render final
```

Verify audio integrity:
```bash
ffmpeg -i out/{slug}.mp4 -vn -af silencedetect=noise=-50dB:d=0.5 -f null -
```

### Step 7: Upload to YouTube

```bash
# One-time OAuth setup (if not already done):
npx tsx scripts/youtube-auth.ts

# Upload:
npx tsx -e "
import { uploadVideoToYouTube } from './scripts/lib/youtube-uploader.ts';
await uploadVideoToYouTube({
  videoPath: 'deliverables/{slug}-video/out/{slug}.mp4',
  title: '{title}',
  description: '...',
  tags: ['...'],
  privacyStatus: 'public'
});
"
```

### Step 8: Update Manifest + Article

Add the video to your video manifest (e.g., `content/video-manifest.ts`):

```typescript
{
  slug: 'first-principles-thinking',
  youtubeId: '...',
  title: '...',
  caption: '...',
  aspect: '16:9',
  transcript: `...`,
  relatedProjects: ['agency-plan'],
  cta: {
    label: 'Read the full guide',
    href: '/blog/first-principles-thinking',
  },
}
```

Add the video slug to the article's `relatedVideos` frontmatter. Commit and push to main.

## Phase 2 Alternative: HeyGen Video Agent

If your project has HeyGen avatar IDs configured for personas, use this faster path:

### Step 1: Write the HeyGen Script

Create `data/heygen-scripts/<slug>.md`:

```markdown
---
avatar_group_id: {your-avatar-group-id}
avatar_name: Maya
voice_id: {your-voice-id}
background: "#FFFFFF"
target_duration_seconds: 60
tone: warm, diagnostic, reassuring
slug: first-principles-thinking
blog_url: https://your-site.com/blog/first-principles-thinking
---

# {Title} — HeyGen Script

## Visual Setup
- **Avatar:** Maya (warm expression, approachable)
- **Background:** Clean white `#FFFFFF`
- **Aspect Ratio:** 9:16
- **On-screen text:** Key numbers and takeaways

## Scene Breakdown

### Scene 1 — The Hook (0:00–0:08)
**Narration:** "The problem isn't that you don't have enough ideas..."
**On-screen text:** "First principles thinking"

## Full Spoken Script (continuous)
[Complete narration here]
```

### Step 2: Submit to HeyGen Video Agent

```typescript
// Via MCP create_video_agent with mode="chat"
{
  prompt: "Create a 60-second educational Short based on the script...",
  avatarId: "{your-avatar-group-id}",
  voiceId: "{your-voice-id}",
  mode: "chat"
}
```

The agent designs a storyboard, asks for approval, then generates the video.

### Step 3: Poll for Completion

```typescript
// Poll get_video until status === "completed"
const video = await getVideo(videoId);
// video.video_url contains the download URL
```

### Step 4: Download

```bash
curl -L -o deliverables/{slug}-video/out/{slug}-heygen.mp4 "<video_url_from_get_video>"
```

### Step 5: Upload to YouTube

Same YouTube upload step as the Remotion path above.

## Persona → Role Mapping

| Stage | Persona | Role | Use For |
|---|---|---|---|
| Writer | `maya-angelou-writer` | Warm, direct, authoritative copy | Blog drafts |
| Editor | `rick-rubin-creative` | Strip to essence, cut fluff | Editorial review |
| Fact-checker | `margaret-hamilton-qa` | Rigorous verification, safety | Claim validation |
| Gate | `steve-jobs-visionary` | Vision, simplicity, taste | Final approval |
| Script | `aaron-sorkin-screenwriter` | Dialogue, rhythm, structure | Video scripts |
| Narrative | `shonda-rhimes-board` | Arc, tension, shareability | Script review |
| Visual | `jony-ive-designer` | Hierarchy, spacing, timing | Visual review |
| Orchestrator | `phil-jackson-orchestrator` | Coordination, wave management | Pipeline oversight |
| Growth | `sara-blakely-growth` | Customer gut-check, conversion | Pre-publish check |

## YouTube Metadata

Create `data/video-queue/completed/<slug>-youtube.md` with title options, description, and tags. The uploader reads this automatically if present.

## Critical Pitfalls

1. **Git rejects large MP4s** — Videos are gitignored. Never commit MP4s to git. Use the queue JSON + YouTube ID for persistence.
2. **HeyGen URL expires** — The `video_url` from `get_video` has a time-limited signed URL. Download immediately after completion.
3. **Remotion asset path trap** — `staticFile()` resolves to the Remotion project's `public/`, NOT your site root `public/`.
4. **Fact-check failures** — Margaret Hamilton flags unsupported claims. Fix them before publishing, or the article goes live with bad info.
5. **OAuth scope** — YouTube upload needs `https://www.googleapis.com/auth/youtube` (not just `youtube.upload`) to set public visibility.

## Output Files

After the full pipeline:
- `website/content/blog/<slug>.md` — Published article
- `website/public/blog/assets/<slug>.webp` — Hero image
- `deliverables/<slug>-video/script.md` — Video script
- `deliverables/<slug>-video/out/<slug>.mp4` — Rendered video (local only)
- `data/video-queue/completed/<slug>.json` — Job metadata with `youtubeVideoId`
- `data/video-queue/completed/<slug>-youtube.md` — YouTube upload metadata

## Known Limitations

1. **HeyGen video duration** — The Video Agent may exceed the target duration on the first pass. Ask it to trim in chat mode.
2. **OpenAI TTS capped at ~22s per call** — Long voiceovers must be split into scenes/chunks and concatenated in Remotion.
3. **LLM script generation is single-shot** — No revision loop in the Remotion pipeline. Review narration before rendering.
4. **HeyGen cannot use custom photos** — It generates its own visuals. Use Remotion if you need specific screenshots or assets as backgrounds.

## Style Guide (Remotion Path)

| Property | Value |
|----------|-------|
| Background | `#0a0a0a` |
| Accent | `#f59e0b` (amber) |
| Text | `#fafafa` |
| Code font | JetBrains Mono / monospace |
| Body font | Inter / system-ui |
| Voice | OpenAI TTS "onyx" (deep, professional) |
| Resolution | 1920x1080 |
| FPS | 30 |
