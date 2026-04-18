#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PERSONAS_DIR = join(__dirname, "personas");

const PERSONAS = Object.fromEntries(
  readdirSync(PERSONAS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const slug = f.replace(/\.md$/, "").replace(/-(persona|visionary|designer|creative|writer|screenwriter|qa|mod|orchestrator|growth|board)$/, "");
      const body = readFileSync(join(PERSONAS_DIR, f), "utf8");
      return [slug, body];
    })
);

const PERSONA_BLURBS = {
  "steve-jobs": "Product taste, ruthless focus, say NO to features",
  "elon-musk": "First principles, moonshots, physics-based reasoning",
  "jony-ive": "Visual design, materials, inevitability, craft",
  "rick-rubin": "Strip to essence, kill the noise, find the truth",
  "warren-buffett": "Unit economics, moats, is-this-a-business gut check",
  "jensen-huang": "Platforms, ecosystems, data moats, compounding advantage",
  "oprah-winfrey": "Audience connection, accessibility, human clarity",
  "shonda-rhimes": "Retention, cliffhangers, narrative arcs, engagement",
  "sara-blakely": "Scrappy growth, small-business empathy, real customers",
  "maya-angelou": "Warm copywriting, brand storytelling, dignity",
  "aaron-sorkin": "Dialogue, scripts, screenwriting, sharp prose",
  "margaret-hamilton": "QA, test suites, error recovery, pre-flight checks",
  "marcus-aurelius": "Orchestration, mediation, Stoic quality gates",
  "phil-jackson": "System orchestration, swarm dispatch, Zen coordination",
};

const server = new Server(
  { name: "great-minds", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

function getPersona(slug) {
  const key = Object.keys(PERSONAS).find((k) => k === slug || k.startsWith(slug));
  if (!key) throw new Error(`Unknown persona: ${slug}. Available: ${Object.keys(PERSONAS).join(", ")}`);
  return PERSONAS[key];
}

const GITHUB_API = "https://api.github.com";

function brainEnv() {
  const token = process.env.GREAT_MINDS_GITHUB_TOKEN;
  const repo = process.env.GREAT_MINDS_GITHUB_REPO;
  const branch = process.env.GREAT_MINDS_GITHUB_BRANCH || "main";
  if (!token) return { error: "Missing env var GREAT_MINDS_GITHUB_TOKEN." };
  if (!repo || !repo.includes("/")) return { error: "Missing or malformed env var GREAT_MINDS_GITHUB_REPO (expected 'owner/repo')." };
  return { token, repo, branch };
}

function ghHeaders(token) {
  return {
    "Authorization": `Bearer ${token}`,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "great-minds-dxt",
  };
}

async function brainSave(path, content, message) {
  const env = brainEnv();
  if (env.error) return env.error;
  const url = `${GITHUB_API}/repos/${env.repo}/contents/${encodeURI(path)}`;
  // Check for existing file to get sha
  let sha;
  const existing = await fetch(`${url}?ref=${encodeURIComponent(env.branch)}`, { headers: ghHeaders(env.token) });
  if (existing.ok) {
    const j = await existing.json();
    sha = j.sha;
  }
  const body = {
    message: message || `brain: update ${path}`,
    content: Buffer.from(content, "utf8").toString("base64"),
    branch: env.branch,
  };
  if (sha) body.sha = sha;
  const res = await fetch(url, {
    method: "PUT",
    headers: { ...ghHeaders(env.token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) return `GitHub error ${res.status}: ${text}`;
  const j = JSON.parse(text);
  return `Saved ${path} to ${env.repo}@${env.branch} (commit ${j.commit?.sha?.slice(0, 7) || "?"}).`;
}

async function brainLoad(path) {
  const env = brainEnv();
  if (env.error) return env.error;
  const url = `${GITHUB_API}/repos/${env.repo}/contents/${encodeURI(path)}?ref=${encodeURIComponent(env.branch)}`;
  const res = await fetch(url, { headers: ghHeaders(env.token) });
  if (res.status === 404) return `Not found: ${path}`;
  const text = await res.text();
  if (!res.ok) return `GitHub error ${res.status}: ${text}`;
  const j = JSON.parse(text);
  if (j.type !== "file" || !j.content) return `Not a file: ${path}`;
  const decoded = Buffer.from(j.content, j.encoding || "base64").toString("utf8");
  return decoded;
}

async function brainList(directory) {
  const env = brainEnv();
  if (env.error) return env.error;
  const dir = (directory || "").replace(/^\/+|\/+$/g, "");
  const url = `${GITHUB_API}/repos/${env.repo}/contents/${encodeURI(dir)}?ref=${encodeURIComponent(env.branch)}`;
  const res = await fetch(url, { headers: ghHeaders(env.token) });
  if (res.status === 404) return `Not found: ${dir || "/"}`;
  const text = await res.text();
  if (!res.ok) return `GitHub error ${res.status}: ${text}`;
  const j = JSON.parse(text);
  if (!Array.isArray(j)) return `Not a directory: ${dir}`;
  const lines = j.map((e) => `- ${e.type === "dir" ? "[dir] " : ""}${e.path} (${e.size || 0} bytes)`);
  return `# ${env.repo}:${dir || "/"} @ ${env.branch}\n\n${lines.join("\n")}`;
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "persona_critique",
      description: "Get a critique from one of 14 legendary personas. Returns the persona's system prompt + the input to critique. Claude will role-play the persona.",
      inputSchema: {
        type: "object",
        properties: {
          persona: { type: "string", description: "Persona slug (e.g. steve-jobs, elon-musk, jony-ive, rick-rubin, warren-buffett, jensen-huang, oprah-winfrey, shonda-rhimes, sara-blakely, maya-angelou, aaron-sorkin, margaret-hamilton, marcus-aurelius, phil-jackson)" },
          input: { type: "string", description: "The thing to critique — a PRD, design, copy, idea, decision" },
        },
        required: ["persona", "input"],
      },
    },
    {
      name: "debate",
      description: "Run a structured 2-round debate between Steve Jobs and Elon Musk, ending with Rick Rubin essence distillation.",
      inputSchema: {
        type: "object",
        properties: {
          topic: { type: "string", description: "Topic, PRD, or decision to debate" },
        },
        required: ["topic"],
      },
    },
    {
      name: "board_review",
      description: "Spawn 4 board members (Jensen, Oprah, Warren, Shonda) to review in parallel from strategy, audience, business, and retention angles.",
      inputSchema: {
        type: "object",
        properties: {
          subject: { type: "string", description: "What to review — project state, PRD, or deliverable" },
        },
        required: ["subject"],
      },
    },
    {
      name: "plan",
      description: "Generate a structured task plan with atomic XML task cards organized into dependency waves.",
      inputSchema: {
        type: "object",
        properties: {
          requirement: { type: "string", description: "Requirement, PRD, or topic to plan" },
        },
        required: ["requirement"],
      },
    },
    {
      name: "list_personas",
      description: "List all 14 available personas with one-line descriptions.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "brain_save",
      description: "Commit a file to the shared brain GitHub repo (debate rounds, board verdicts, persona critiques, shared notes). Requires env vars GREAT_MINDS_GITHUB_TOKEN and GREAT_MINDS_GITHUB_REPO (owner/repo).",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path within the repo (e.g. 'debates/2026-04-18-pricing.md')" },
          content: { type: "string", description: "File content (utf8)" },
          message: { type: "string", description: "Optional commit message" },
        },
        required: ["path", "content"],
      },
    },
    {
      name: "brain_load",
      description: "Fetch a file from the shared brain GitHub repo. Returns decoded file content or 'Not found'.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path within the repo" },
        },
        required: ["path"],
      },
    },
    {
      name: "brain_list",
      description: "List files in a directory of the shared brain GitHub repo.",
      inputSchema: {
        type: "object",
        properties: {
          directory: { type: "string", description: "Directory path within the repo (empty string for root)" },
        },
        required: ["directory"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  if (name === "list_personas") {
    const lines = Object.entries(PERSONA_BLURBS).map(([k, v]) => `- **${k}** — ${v}`);
    return { content: [{ type: "text", text: `# Available Personas\n\n${lines.join("\n")}` }] };
  }

  if (name === "persona_critique") {
    const persona = getPersona(args.persona);
    const text = `You are now channeling the following persona. Read the system prompt carefully, then critique the input below in that persona's voice.\n\n---PERSONA---\n${persona}\n---END PERSONA---\n\n---INPUT TO CRITIQUE---\n${args.input}\n---END INPUT---\n\nGive your critique now, staying fully in character.`;
    return { content: [{ type: "text", text }] };
  }

  if (name === "debate") {
    const jobs = getPersona("steve-jobs");
    const musk = getPersona("elon-musk");
    const rubin = getPersona("rick-rubin");
    const text = `Run a 3-step structured debate on this topic:\n\n**TOPIC:** ${args.topic}\n\n## Step 1 — Round 1 Positions (do both in parallel)\n\nChannel Steve Jobs and stake clear positions on the topic (scope, taste, what to cut, what matters). Use this persona:\n\n${jobs}\n\n---\n\nThen channel Elon Musk and stake positions from first principles (physics, scale, ambition, what's possible). Use this persona:\n\n${musk}\n\n## Step 2 — Round 2 Challenges\n\nHave each persona read the other's Round 1 and challenge the weakest claims. Lock any agreements reached.\n\n## Step 3 — Rick Rubin Essence Distillation\n\nNow channel Rick Rubin and distill both debates into 3-5 lines of essence — what's actually true, what's noise. Use this persona:\n\n${rubin}\n\nProduce all three steps now. Clearly label each section.`;
    return { content: [{ type: "text", text }] };
  }

  if (name === "board_review") {
    const jensen = getPersona("jensen-huang");
    const oprah = getPersona("oprah-winfrey");
    const warren = getPersona("warren-buffett");
    const shonda = getPersona("shonda-rhimes");
    const text = `Spawn 4 board members in parallel to review this subject, then produce a consolidated verdict.\n\n**SUBJECT:** ${args.subject}\n\n## Reviewer 1 — Jensen Huang (Tech Strategy)\n\n${jensen}\n\nWrite a review under 30 lines: platform economics, data moats, competitive positioning, technical strategy.\n\n## Reviewer 2 — Oprah Winfrey (Audience & Accessibility)\n\n${oprah}\n\nWrite a review under 30 lines: audience connection, storytelling clarity, onboarding, whether a normal person would understand and care.\n\n## Reviewer 3 — Warren Buffett (Business & Economics)\n\n${warren}\n\nWrite a review under 30 lines: business model, unit economics, moat durability, pricing, is this a business or a hobby.\n\n## Reviewer 4 — Shonda Rhimes (Retention & Narrative)\n\n${shonda}\n\nWrite a review under 30 lines: retention arc, engagement hooks, why users come back, narrative sequencing.\n\n## Consolidated Verdict\n\nAfter all four reviews, synthesize: strongest concern, biggest opportunity, GO / REVISE / KILL recommendation with one-line reason.\n\nProduce all five sections now.`;
    return { content: [{ type: "text", text }] };
  }

  if (name === "plan") {
    const text = `Generate a structured task plan for this requirement:\n\n**REQUIREMENT:** ${args.requirement}\n\n## Step 1 — Parallel Research\n\nSpawn 3 sub-agents in parallel (via the Agent tool, model haiku):\n1. **Codebase Scout** — Map relevant files, patterns, conventions\n2. **Requirements Analyst** — Extract atomic, testable requirements\n3. **Risk Scanner** — High-churn files, tangled deps, footguns\n\n## Step 2 — Generate XML Task Cards\n\nFor each atomic requirement, produce:\n\n\`\`\`xml\n<task id="task-N" wave="W">\n  <title>Short title</title>\n  <requirement>Traced requirement</requirement>\n  <description>What and why</description>\n  <context><file path="..." reason="..." /></context>\n  <steps><step order="1">Atomic instruction</step></steps>\n  <verification>\n    <check type="build">command</check>\n    <check type="test">command</check>\n    <check type="manual">what to confirm</check>\n  </verification>\n  <dependencies><depends-on task-id="task-X" /></dependencies>\n  <commit-message>Conventional commit</commit-message>\n</task>\n\`\`\`\n\n## Step 3 — Organize into Waves\n\nWave 1 = no deps, Wave N = depends only on Wave N-1. DAG, no cycles.\n\n## Step 4 — Self-Verify\n\n- Every requirement has a task\n- Every file path exists\n- Every task has a verification check\n- No dependency cycles\n- Each task is independently committable\n\n## Step 5 — Output\n\nWrite a plan markdown with: traceability table, wave-ordered task cards, risk notes. Report the plan path, task count, wave count in under 5 lines.\n\nBegin.`;
    return { content: [{ type: "text", text }] };
  }

  if (name === "brain_save") {
    const text = await brainSave(args.path, args.content, args.message);
    return { content: [{ type: "text", text }] };
  }

  if (name === "brain_load") {
    const text = await brainLoad(args.path);
    return { content: [{ type: "text", text }] };
  }

  if (name === "brain_list") {
    const text = await brainList(args.directory || "");
    return { content: [{ type: "text", text }] };
  }

  throw new Error(`Unknown tool: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("great-minds MCP server running on stdio");
