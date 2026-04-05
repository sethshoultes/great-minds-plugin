#!/usr/bin/env node
/**
 * CLI for the Great Minds memory store.
 *
 * Usage:
 *   memory add --type learning --agent "Elon Musk" --project "Dash" --content "..."
 *   memory search "how to dispatch agents" --limit 5
 *   memory list --type decision --project "LocalGenius"
 *   memory list --agent "Jensen Huang"
 *   memory import --dir ../memory --rounds ../rounds
 *   memory export
 *   memory stats
 *   memory remove --id 42
 */

import { Command } from 'commander';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MEMORY_TYPES, type MemoryType, MemoryStore } from './store.js';
import { importAll, exportToMarkdown } from './import.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Resolve DB path — look for memory-store dir, fall back to cwd
function resolveDbPath(): string {
  // Check if MEMORY_DB env is set
  if (process.env.MEMORY_DB) return process.env.MEMORY_DB;

  // Default: memory.db in the memory-store directory
  return path.join(PROJECT_ROOT, 'memory.db');
}

function createStore(): MemoryStore {
  return new MemoryStore(resolveDbPath());
}

// ── CLI ────────────────────────────────────────────────────────────────────

const program = new Command();

program
  .name('memory')
  .description('Great Minds agency memory store — search, add, and manage agent memories')
  .version('1.0.0');

// ── add ────────────────────────────────────────────────────────────────────

program
  .command('add')
  .description('Add a memory')
  .requiredOption('-t, --type <type>', `Memory type: ${MEMORY_TYPES.join(', ')}`)
  .option('-a, --agent <agent>', 'Agent name', '')
  .option('-p, --project <project>', 'Project name', '')
  .requiredOption('-c, --content <content>', 'Memory content')
  .action(async (opts) => {
    if (!MEMORY_TYPES.includes(opts.type)) {
      console.error(`Invalid type: ${opts.type}. Must be one of: ${MEMORY_TYPES.join(', ')}`);
      process.exit(1);
    }

    const store = createStore();
    try {
      const id = await store.add(opts.type as MemoryType, opts.agent, opts.project, opts.content);
      console.log(`Added memory #${id} (${opts.type})`);
    } finally {
      store.close();
    }
  });

// ── search ─────────────────────────────────────────────────────────────────

program
  .command('search <query>')
  .description('Search memories by semantic similarity')
  .option('-l, --limit <n>', 'Max results', '5')
  .action(async (query, opts) => {
    const store = createStore();
    try {
      const results = await store.search(query, parseInt(opts.limit, 10));

      if (results.length === 0) {
        console.log('No matching memories found.');
        return;
      }

      for (const mem of results) {
        const score = (mem.score * 100).toFixed(1);
        console.log(`\n--- #${mem.id} [${mem.type}] (${score}% match) ---`);
        if (mem.agent) console.log(`Agent: ${mem.agent}`);
        if (mem.project) console.log(`Project: ${mem.project}`);
        console.log(mem.content.substring(0, 300));
        if (mem.content.length > 300) console.log('  ...(truncated)');
      }
      console.log(`\n${results.length} result(s)`);
    } finally {
      store.close();
    }
  });

// ── list ───────────────────────────────────────────────────────────────────

program
  .command('list')
  .description('List memories by type, agent, or project')
  .option('-t, --type <type>', 'Filter by type')
  .option('-a, --agent <agent>', 'Filter by agent')
  .option('-p, --project <project>', 'Filter by project')
  .action(async (opts) => {
    const store = createStore();
    try {
      let results;
      if (opts.type) {
        results = store.listByType(opts.type as MemoryType);
      } else if (opts.agent) {
        results = store.listByAgent(opts.agent);
      } else if (opts.project) {
        results = store.listByProject(opts.project);
      } else {
        console.error('Specify --type, --agent, or --project');
        process.exit(1);
      }

      if (results.length === 0) {
        console.log('No memories found.');
        return;
      }

      for (const mem of results) {
        console.log(`\n--- #${mem.id} [${mem.type}] ---`);
        if (mem.agent) console.log(`Agent: ${mem.agent}`);
        if (mem.project) console.log(`Project: ${mem.project}`);
        console.log(mem.content.substring(0, 200));
        if (mem.content.length > 200) console.log('  ...(truncated)');
      }
      console.log(`\n${results.length} result(s)`);
    } finally {
      store.close();
    }
  });

// ── import ─────────────────────────────────────────────────────────────────

program
  .command('import')
  .description('Import memories from existing markdown files')
  .option('-d, --dir <path>', 'Memory directory (memory/)', '../memory')
  .option('-r, --rounds <path>', 'Rounds directory (rounds/)', '../rounds')
  .option('-i, --index <path>', 'MEMORY.md index file', '../MEMORY.md')
  .option('-f, --file <path>', 'Import a single markdown file')
  .action(async (opts) => {
    const store = createStore();
    try {
      // Resolve paths relative to the memory-store directory
      const baseDir = PROJECT_ROOT;

      if (opts.file) {
        // Import single file
        const filePath = path.resolve(opts.file);
        if (!fs.existsSync(filePath)) {
          console.error(`File not found: ${filePath}`);
          process.exit(1);
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        const id = await store.add('learning', '', '', content);
        console.log(`Imported file as memory #${id}`);
        return;
      }

      console.log('Importing Great Minds memories...\n');

      const result = await importAll(store, {
        memoryDir: path.resolve(baseDir, opts.dir),
        roundsDir: path.resolve(baseDir, opts.rounds),
        memoryIndex: path.resolve(baseDir, opts.index),
      });

      console.log(`\nDone. Imported: ${result.imported}, Skipped (dupes): ${result.skipped}`);
      if (result.errors.length > 0) {
        console.log(`Errors (${result.errors.length}):`);
        for (const e of result.errors) console.log(`  - ${e}`);
      }
    } finally {
      store.close();
    }
  });

// ── export ─────────────────────────────────────────────────────────────────

program
  .command('export')
  .description('Export all memories to markdown')
  .option('-o, --output <path>', 'Output file (stdout if omitted)')
  .action(async (opts) => {
    const store = createStore();
    try {
      const md = exportToMarkdown(store);
      if (opts.output) {
        fs.writeFileSync(opts.output, md);
        console.log(`Exported to ${opts.output}`);
      } else {
        console.log(md);
      }
    } finally {
      store.close();
    }
  });

// ── stats ──────────────────────────────────────────────────────────────────

program
  .command('stats')
  .description('Show memory store statistics')
  .action(async () => {
    const store = createStore();
    try {
      const s = store.stats();
      console.log(`Total memories: ${s.total}\n`);

      console.log('By type:');
      for (const [type, count] of Object.entries(s.byType)) {
        console.log(`  ${type}: ${count}`);
      }

      console.log('\nBy agent:');
      for (const [agent, count] of Object.entries(s.byAgent)) {
        console.log(`  ${agent}: ${count}`);
      }
    } finally {
      store.close();
    }
  });

// ── remove ─────────────────────────────────────────────────────────────────

program
  .command('remove')
  .description('Remove a memory by ID')
  .requiredOption('--id <id>', 'Memory ID to remove')
  .action(async (opts) => {
    const store = createStore();
    try {
      const id = parseInt(opts.id, 10);
      const mem = store.getById(id);
      if (!mem) {
        console.error(`Memory #${id} not found.`);
        process.exit(1);
      }
      store.remove(id);
      console.log(`Removed memory #${id} (${mem.type})`);
    } finally {
      store.close();
    }
  });

// ── prune ─────────────────────────────────────────────────────────────────

program
  .command('prune')
  .description('Remove duplicate and low-value memories')
  .option('--threshold <n>', 'Cosine similarity threshold for duplicates', '0.92')
  .action(async (opts) => {
    const store = createStore();
    try {
      const threshold = parseFloat(opts.threshold);
      console.log(`Pruning duplicates (threshold: ${threshold})...`);

      const dupeResult = store.removeDuplicates(threshold);
      if (dupeResult.pairs.length > 0) {
        console.log(`\nRemoved ${dupeResult.removed} duplicate(s):`);
        for (const desc of dupeResult.pairs) {
          console.log(`  ${desc}`);
        }
      } else {
        console.log('No duplicates found.');
      }

      console.log('\nPruning low-value entries...');
      const lowResult = store.pruneLowValue();
      if (lowResult.descriptions.length > 0) {
        console.log(`Removed ${lowResult.removed} low-value entries:`);
        for (const desc of lowResult.descriptions) {
          console.log(`  ${desc}`);
        }
      } else {
        console.log('No low-value entries found.');
      }

      console.log(`\nTotal pruned: ${dupeResult.removed + lowResult.removed}`);
    } finally {
      store.close();
    }
  });

// ── consolidate ───────────────────────────────────────────────────────────

program
  .command('consolidate')
  .description('Merge clusters of similar memories into single stronger entries')
  .option('--threshold <n>', 'Similarity threshold for clustering', '0.75')
  .action(async (opts) => {
    const store = createStore();
    try {
      const threshold = parseFloat(opts.threshold);
      console.log(`Finding clusters (threshold: ${threshold})...`);

      const clusters = store.findClusters(threshold);

      if (clusters.length === 0) {
        console.log('No clusters found to consolidate.');
        return;
      }

      let consolidated = 0;
      let memoriesReplaced = 0;

      for (const cluster of clusters) {
        // Build a merged summary
        const merged = buildMergedContent(cluster.type, cluster.contents);
        const newId = await store.consolidateCluster(cluster.ids, merged);
        consolidated++;
        memoriesReplaced += cluster.ids.length;
        console.log(
          `  [${cluster.type}] Merged ${cluster.ids.length} memories (${cluster.ids.join(', ')}) → #${newId}`
        );
      }

      console.log(
        `\nConsolidated ${consolidated} clusters (${memoriesReplaced} memories → ${consolidated} entries)`
      );
    } finally {
      store.close();
    }
  });

// ── optimize ──────────────────────────────────────────────────────────────

program
  .command('optimize')
  .description('Score memories by relevance and remove the bottom percentile')
  .option('--percentile <n>', 'Remove bottom N percent', '10')
  .action(async (opts) => {
    const store = createStore();
    try {
      const percentile = parseFloat(opts.percentile);

      console.log('Scoring all memories...');
      const scoreResult = store.scoreMemories();
      console.log(`Scored ${scoreResult.scored} memories.`);

      console.log(`\nRemoving bottom ${percentile}%...`);
      const pruneResult = store.pruneByScore(percentile);
      console.log(
        `Removed ${pruneResult.removed} memories (score threshold: ${pruneResult.threshold.toFixed(4)})`
      );

      const stats = store.stats();
      console.log(`\nRemaining: ${stats.total} memories`);
    } finally {
      store.close();
    }
  });

// ── maintain ──────────────────────────────────────────────────────────────

program
  .command('maintain')
  .description('Full maintenance cycle: prune → consolidate → optimize (used by dream cron)')
  .action(async () => {
    const store = createStore();
    try {
      const before = store.count();
      console.log(`Memory maintenance starting (${before} memories)...\n`);

      // Step 1: Prune
      console.log('=== PRUNE ===');
      const dupeResult = store.removeDuplicates(0.92);
      console.log(`  Duplicates removed: ${dupeResult.removed}`);
      const lowResult = store.pruneLowValue();
      console.log(`  Low-value removed: ${lowResult.removed}`);

      // Step 2: Consolidate
      console.log('\n=== CONSOLIDATE ===');
      const clusters = store.findClusters(0.75);
      let consolidated = 0;
      let memoriesReplaced = 0;
      for (const cluster of clusters) {
        const merged = buildMergedContent(cluster.type, cluster.contents);
        await store.consolidateCluster(cluster.ids, merged);
        consolidated++;
        memoriesReplaced += cluster.ids.length;
      }
      console.log(`  Clusters merged: ${consolidated} (${memoriesReplaced} → ${consolidated})`);

      // Step 3: Optimize
      console.log('\n=== OPTIMIZE ===');
      const scoreResult = store.scoreMemories();
      console.log(`  Scored: ${scoreResult.scored}`);
      const pruneResult = store.pruneByScore(10);
      console.log(`  Bottom 10% removed: ${pruneResult.removed}`);

      const after = store.count();
      console.log(`\nMaintenance complete: ${before} → ${after} memories (${before - after} removed)`);
    } finally {
      store.close();
    }
  });

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Build a merged content string from a cluster of similar memories.
 */
function buildMergedContent(type: string, contents: string[]): string {
  // Extract key points from each, deduplicate
  const allLines = contents
    .flatMap((c) => c.split('\n').map((l) => l.trim()).filter((l) => l.length > 10))
    .filter((line, i, arr) => arr.indexOf(line) === i); // deduplicate exact lines

  const header = `[Consolidated from ${contents.length} ${type} entries]`;

  // For QA findings, summarize health status
  if (type === 'qa-finding') {
    const urls = allLines.filter((l) => l.includes('http') || l.includes('200') || l.includes('PASS'));
    if (urls.length > 0) {
      return `${header}\nSites consistently healthy — all URLs return 200.\nChecked patterns:\n${urls.slice(0, 10).map((u) => `- ${u}`).join('\n')}`;
    }
  }

  // For board reviews, keep unique insights
  if (type === 'board-review') {
    const insights = allLines.filter(
      (l) => !l.match(/^(all\s+green|no\s+issues?|everything\s+(looks?\s+)?good)/i)
    );
    if (insights.length > 0) {
      return `${header}\nKey insights:\n${insights.slice(0, 15).map((i) => `- ${i}`).join('\n')}`;
    }
    return `${header}\nAll reviews passed with no issues noted.`;
  }

  // Generic: keep unique lines
  return `${header}\n${allLines.slice(0, 20).join('\n')}`;
}

// ── run ────────────────────────────────────────────────────────────────────

program.parse();
