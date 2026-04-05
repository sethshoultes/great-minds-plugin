/**
 * Import existing Great Minds memory files into the vector store.
 * Parses memory dir md files, decisions, board reviews, and QA reports from rounds.
 */

import fs from 'node:fs';
import path from 'node:path';
import { type MemoryType, MemoryStore } from './store.js';

interface ImportItem {
  type: MemoryType;
  agent: string;
  project: string;
  content: string;
  source: string;
}

// ── Parse memory/*.md files ────────────────────────────────────────────────

function parseMemoryFile(filePath: string): ImportItem[] {
  const items: ImportItem[] = [];
  const raw = fs.readFileSync(filePath, 'utf-8');
  const basename = path.basename(filePath, '.md');

  // Determine type from filename/frontmatter
  let type: MemoryType = 'learning';
  if (basename.includes('architecture') || basename.includes('decision')) {
    type = 'architecture';
  } else if (basename.includes('identity')) {
    type = 'learning';
  } else if (basename.includes('operational')) {
    type = 'learning';
  } else if (basename.includes('research')) {
    type = 'learning';
  }

  // Detect project from filename
  let project = '';
  if (basename.includes('localgenius') || basename.includes('local-genius')) {
    project = 'LocalGenius';
  }

  // Split into sections by ## headers
  const sections = splitBySections(raw);

  if (sections.length === 0) {
    // No sections, import as single item
    items.push({
      type,
      agent: '',
      project,
      content: raw.trim(),
      source: filePath,
    });
  } else {
    for (const section of sections) {
      if (section.content.trim().length < 20) continue;
      items.push({
        type,
        agent: '',
        project,
        content: `${section.heading}\n${section.content}`.trim(),
        source: filePath,
      });
    }
  }

  return items;
}

// ── Parse MEMORY.md index ──────────────────────────────────────────────────

function parseMemoryIndex(filePath: string): ImportItem[] {
  const items: ImportItem[] = [];
  const raw = fs.readFileSync(filePath, 'utf-8');

  // Extract bullet points — supports both "**bold**: detail" and plain "- text" formats
  const lines = raw.split('\n');
  let currentSection = '';

  for (const line of lines) {
    const sectionMatch = line.match(/^#{1,3}\s+(.+)$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      continue;
    }

    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      const content = bulletMatch[1].trim();
      // Skip index links like "[Name](file.md)"
      if (content.startsWith('[') && content.includes('.md)')) continue;
      if (content.length < 15) continue;

      items.push({
        type: 'learning',
        agent: '',
        project: '',
        content: currentSection ? `${currentSection}: ${content}` : content,
        source: filePath,
      });
    }
  }

  return items;
}

// ── Parse decisions.md ─────────────────────────────────────────────────────

function parseDecisionsFile(filePath: string, project: string): ImportItem[] {
  const items: ImportItem[] = [];
  const raw = fs.readFileSync(filePath, 'utf-8');

  // Split into numbered decisions and amendments
  const sections = splitBySections(raw);

  for (const section of sections) {
    if (section.content.trim().length < 20) continue;
    items.push({
      type: 'decision',
      agent: '',
      project,
      content: `${section.heading}\n${section.content}`.trim(),
      source: filePath,
    });
  }

  // Also capture numbered list items in the top section
  const numberedRegex = /^\d+\.\s+(.+)$/gm;
  let match;
  while ((match = numberedRegex.exec(raw)) !== null) {
    const content = match[1].trim();
    if (content.length > 20) {
      items.push({
        type: 'decision',
        agent: '',
        project,
        content,
        source: filePath,
      });
    }
  }

  return items;
}

// ── Parse board-review-*.md ────────────────────────────────────────────────

function parseBoardReview(filePath: string, project: string): ImportItem[] {
  const items: ImportItem[] = [];
  const raw = fs.readFileSync(filePath, 'utf-8');
  const basename = path.basename(filePath, '.md');

  // Extract agent from first heading or filename
  let agent = 'Jensen Huang'; // default for board reviews
  const agentMatch = raw.match(/^#\s+Board Review.*?—\s*(.+)$/m);
  if (agentMatch) {
    agent = agentMatch[1].trim();
  }

  // Import the whole review as one item (they are coherent documents)
  items.push({
    type: 'board-review',
    agent,
    project,
    content: raw.trim(),
    source: filePath,
  });

  // Also extract individual sections as separate searchable items
  const sections = splitBySections(raw);
  for (const section of sections) {
    if (section.content.trim().length < 50) continue;
    items.push({
      type: 'board-review',
      agent,
      project,
      content: `${section.heading}\n${section.content}`.trim(),
      source: filePath,
    });
  }

  return items;
}

// ── Parse qa-report-*.md ───────────────────────────────────────────────────

function parseQaReport(filePath: string, project: string): ImportItem[] {
  const items: ImportItem[] = [];
  const raw = fs.readFileSync(filePath, 'utf-8');

  items.push({
    type: 'qa-finding',
    agent: 'Margaret Hamilton',
    project,
    content: raw.trim(),
    source: filePath,
  });

  return items;
}

// ── Section splitter ───────────────────────────────────────────────────────

interface Section {
  heading: string;
  content: string;
}

function splitBySections(text: string): Section[] {
  const sections: Section[] = [];
  const lines = text.split('\n');
  let currentHeading = '';
  let currentContent: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)$/);
    if (headingMatch) {
      if (currentHeading && currentContent.length > 0) {
        sections.push({
          heading: currentHeading,
          content: currentContent.join('\n'),
        });
      }
      currentHeading = headingMatch[1];
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  if (currentHeading && currentContent.length > 0) {
    sections.push({
      heading: currentHeading,
      content: currentContent.join('\n'),
    });
  }

  return sections;
}

// ── Project name from directory ────────────────────────────────────────────

function projectFromDir(dirName: string): string {
  const map: Record<string, string> = {
    'local-genius': 'LocalGenius',
    'localgenius-sites': 'LocalGenius Sites',
    blog: 'Blog',
    'wp-command-bar': 'WP Command Bar',
    'services-page': 'Services Page',
  };
  return map[dirName] || dirName;
}

// ── Main import function ───────────────────────────────────────────────────

export async function importAll(
  store: MemoryStore,
  opts: {
    memoryDir?: string;
    roundsDir?: string;
    memoryIndex?: string;
  }
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const items: ImportItem[] = [];
  const errors: string[] = [];

  // 1. Parse MEMORY.md index
  if (opts.memoryIndex && fs.existsSync(opts.memoryIndex)) {
    try {
      items.push(...parseMemoryIndex(opts.memoryIndex));
      console.log(`  Parsed MEMORY.md: ${items.length} items`);
    } catch (e) {
      errors.push(`MEMORY.md: ${e}`);
    }
  }

  // 2. Parse memory/*.md files
  if (opts.memoryDir && fs.existsSync(opts.memoryDir)) {
    const files = fs.readdirSync(opts.memoryDir).filter((f) => f.endsWith('.md'));
    for (const file of files) {
      try {
        const filePath = path.join(opts.memoryDir, file);
        const fileItems = parseMemoryFile(filePath);
        items.push(...fileItems);
        console.log(`  Parsed ${file}: ${fileItems.length} items`);
      } catch (e) {
        errors.push(`${file}: ${e}`);
      }
    }
  }

  // 3. Parse rounds/*/ for decisions, board reviews, QA reports
  if (opts.roundsDir && fs.existsSync(opts.roundsDir)) {
    const projects = fs.readdirSync(opts.roundsDir, { withFileTypes: true });
    for (const entry of projects) {
      if (!entry.isDirectory()) continue;
      const projectDir = path.join(opts.roundsDir, entry.name);
      const project = projectFromDir(entry.name);

      const files = fs.readdirSync(projectDir);
      for (const file of files) {
        if (!file.endsWith('.md')) continue;
        const filePath = path.join(projectDir, file);

        try {
          if (file === 'decisions.md') {
            const fileItems = parseDecisionsFile(filePath, project);
            items.push(...fileItems);
            console.log(`  Parsed ${entry.name}/${file}: ${fileItems.length} items`);
          } else if (file.startsWith('board-review-')) {
            const fileItems = parseBoardReview(filePath, project);
            items.push(...fileItems);
            console.log(`  Parsed ${entry.name}/${file}: ${fileItems.length} items`);
          } else if (file.startsWith('qa-report-')) {
            const fileItems = parseQaReport(filePath, project);
            items.push(...fileItems);
            console.log(`  Parsed ${entry.name}/${file}: ${fileItems.length} items`);
          }
        } catch (e) {
          errors.push(`${entry.name}/${file}: ${e}`);
        }
      }
    }
  }

  // 4. Deduplicate by content hash
  const seen = new Set<string>();
  const unique: ImportItem[] = [];
  for (const item of items) {
    const key = item.content.trim().substring(0, 200);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  console.log(`\n  Total items: ${items.length}, unique: ${unique.length}`);

  // 5. Insert into store
  let imported = 0;
  for (const item of unique) {
    try {
      await store.add(item.type, item.agent, item.project, item.content);
      imported++;
      if (imported % 10 === 0) {
        process.stdout.write(`  Imported ${imported}/${unique.length}\r`);
      }
    } catch (e) {
      errors.push(`Import failed for [${item.source}]: ${e}`);
    }
  }

  console.log(`  Imported ${imported}/${unique.length} memories`);

  // 6. Rebuild TF-IDF if needed
  await store.rebuildTfIdfVocabulary();

  return { imported, skipped: items.length - unique.length, errors };
}

// ── Export to markdown ─────────────────────────────────────────────────────

export function exportToMarkdown(store: MemoryStore): string {
  const lines: string[] = ['# Great Minds Agency -- Memory Export', ''];

  for (const type of [
    'learning',
    'decision',
    'qa-finding',
    'board-review',
    'retrospective',
    'architecture',
  ] as const) {
    const memories = store.listByType(type);
    if (memories.length === 0) continue;

    lines.push(`## ${type} (${memories.length})`, '');

    for (const mem of memories) {
      const meta: string[] = [];
      if (mem.agent) meta.push(`agent: ${mem.agent}`);
      if (mem.project) meta.push(`project: ${mem.project}`);
      meta.push(`id: ${mem.id}`);

      lines.push(`### [${meta.join(', ')}]`);
      lines.push(mem.content);
      lines.push('');
    }
  }

  return lines.join('\n');
}
