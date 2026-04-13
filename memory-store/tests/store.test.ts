import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryStore, MEMORY_TYPES } from '../src/store.js';
import { TfIdfEmbeddings } from '../src/embeddings.js';

// All tests use TF-IDF (no OpenAI key needed) and :memory: SQLite.

function makeStore(): MemoryStore {
  return new MemoryStore(':memory:', new TfIdfEmbeddings());
}

describe('MemoryStore', () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = makeStore();
  });

  afterEach(() => {
    store.close();
  });

  describe('MEMORY_TYPES constant', () => {
    it('contains the expected types', () => {
      expect(MEMORY_TYPES).toContain('learning');
      expect(MEMORY_TYPES).toContain('decision');
      expect(MEMORY_TYPES).toContain('qa-finding');
      expect(MEMORY_TYPES).toContain('board-review');
      expect(MEMORY_TYPES).toContain('retrospective');
      expect(MEMORY_TYPES).toContain('architecture');
    });
  });

  describe('add', () => {
    it('returns a positive integer id', async () => {
      const id = await store.add('learning', 'steve-jobs', 'great-minds', 'Simplicity is the ultimate sophistication');
      expect(id).toBeGreaterThan(0);
    });

    it('each add gets a unique id', async () => {
      const id1 = await store.add('learning', 'agent', 'proj', 'first memory');
      const id2 = await store.add('learning', 'agent', 'proj', 'second memory');
      expect(id2).toBeGreaterThan(id1);
    });
  });

  describe('count', () => {
    it('returns 0 on empty store', () => {
      expect(store.count()).toBe(0);
    });

    it('increments with each add', async () => {
      await store.add('learning', 'a', 'p', 'first');
      await store.add('decision', 'b', 'p', 'second');
      expect(store.count()).toBe(2);
    });
  });

  describe('getById', () => {
    it('returns the inserted memory', async () => {
      const id = await store.add('decision', 'elon-musk', 'pulse', 'Use Promise.all for parallel execution');
      const mem = store.getById(id);
      expect(mem?.content).toBe('Use Promise.all for parallel execution');
      expect(mem?.agent).toBe('elon-musk');
      expect(mem?.type).toBe('decision');
      expect(mem?.project).toBe('pulse');
    });

    it('returns undefined for unknown id', () => {
      expect(store.getById(99999)).toBeUndefined();
    });
  });

  describe('remove', () => {
    it('returns true when entry exists and is deleted', async () => {
      const id = await store.add('learning', 'agent', 'proj', 'to be deleted');
      expect(store.remove(id)).toBe(true);
      expect(store.count()).toBe(0);
    });

    it('returns false for non-existent id', () => {
      expect(store.remove(99999)).toBe(false);
    });
  });

  describe('listByType', () => {
    beforeEach(async () => {
      await store.add('learning', 'steve', 'proj', 'a learning');
      await store.add('learning', 'elon', 'proj', 'another learning');
      await store.add('decision', 'phil', 'proj', 'a decision');
    });

    it('returns only entries of the given type', () => {
      const learnings = store.listByType('learning');
      expect(learnings).toHaveLength(2);
      expect(learnings.every(m => m.type === 'learning')).toBe(true);
    });

    it('returns empty array for type with no entries', () => {
      expect(store.listByType('architecture')).toHaveLength(0);
    });
  });

  describe('listByAgent', () => {
    beforeEach(async () => {
      await store.add('learning', 'steve-jobs', 'proj', 'steve memory 1');
      await store.add('decision', 'steve-jobs', 'proj', 'steve memory 2');
      await store.add('learning', 'elon-musk', 'proj', 'elon memory');
    });

    it('returns only entries for the given agent', () => {
      const steveMemories = store.listByAgent('steve-jobs');
      expect(steveMemories).toHaveLength(2);
      expect(steveMemories.every(m => m.agent === 'steve-jobs')).toBe(true);
    });
  });

  describe('listByProject', () => {
    beforeEach(async () => {
      await store.add('learning', 'agent', 'hindsight', 'hindsight mem 1');
      await store.add('decision', 'agent', 'hindsight', 'hindsight mem 2');
      await store.add('learning', 'agent', 'pulse', 'pulse memory');
    });

    it('returns only entries for the given project', () => {
      const hindsight = store.listByProject('hindsight');
      expect(hindsight).toHaveLength(2);
      expect(hindsight.every(m => m.project === 'hindsight')).toBe(true);
    });
  });

  describe('stats', () => {
    it('returns zero totals on empty store', () => {
      const s = store.stats();
      expect(s.total).toBe(0);
      expect(s.byType).toEqual({});
      expect(s.byAgent).toEqual({});
    });

    it('counts by type and agent correctly', async () => {
      await store.add('learning', 'steve', 'proj', 'mem 1');
      await store.add('learning', 'elon', 'proj', 'mem 2');
      await store.add('decision', 'steve', 'proj', 'mem 3');

      const s = store.stats();
      expect(s.total).toBe(3);
      expect(s.byType['learning']).toBe(2);
      expect(s.byType['decision']).toBe(1);
      expect(s.byAgent['steve']).toBe(2);
      expect(s.byAgent['elon']).toBe(1);
    });

    it('excludes empty-string agents from byAgent', async () => {
      await store.add('learning', '', 'proj', 'anonymous memory');
      const s = store.stats();
      expect('' in s.byAgent).toBe(false);
    });
  });

  describe('pruneLowValue', () => {
    it('removes short all-green board reviews', async () => {
      await store.add('board-review', 'jensen', 'proj', 'all green');
      await store.add('board-review', 'jensen', 'proj', 'All tests passing, everything looks good');
      await store.add('board-review', 'jensen', 'proj', 'This is a substantive board review with real feedback about the product direction and strategic concerns that goes beyond simple status.');

      const result = store.pruneLowValue();
      expect(result.removed).toBeGreaterThan(0);
      // Substantive review should survive
      const remaining = store.listByType('board-review');
      expect(remaining.some(m => m.content.length > 100)).toBe(true);
    });

    it('removes short PASS qa-findings', async () => {
      await store.add('qa-finding', 'margaret', 'proj', 'PASS');
      await store.add('qa-finding', 'margaret', 'proj', 'All tests pass');
      await store.add('qa-finding', 'margaret', 'proj', 'BLOCK: Missing error handling in checkout flow, null pointer at line 42, needs fix before ship');

      const result = store.pruneLowValue();
      // BLOCK with detail should survive
      const remaining = store.listByType('qa-finding');
      expect(remaining.some(m => m.content.includes('BLOCK'))).toBe(true);
    });

    it('does not remove learning or decision memories', async () => {
      await store.add('learning', 'steve', 'proj', 'all green');  // same text, different type
      await store.add('decision', 'elon', 'proj', 'PASS');

      const result = store.pruneLowValue();
      expect(result.removed).toBe(0);  // only board-review and qa-finding are candidates
    });

    it('returns 0 removed on empty store', () => {
      const result = store.pruneLowValue();
      expect(result.removed).toBe(0);
    });
  });

  describe('search', () => {
    it('returns results sorted by score descending', async () => {
      await store.add('learning', 'agent', 'proj', 'pipeline debate plan build review ship');
      await store.add('learning', 'agent', 'proj', 'steve jobs creative director design brand');
      await store.add('learning', 'agent', 'proj', 'margaret hamilton quality assurance testing');

      const results = await store.search('pipeline debate ship', 3);
      expect(results).toHaveLength(3);
      // Scores should be non-increasing
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });

    it('respects the limit parameter', async () => {
      await store.add('learning', 'a', 'p', 'memory one about pipelines');
      await store.add('learning', 'b', 'p', 'memory two about pipelines');
      await store.add('learning', 'c', 'p', 'memory three about pipelines');

      const results = await store.search('pipelines', 2);
      expect(results).toHaveLength(2);
    });

    it('returns empty array when store is empty', async () => {
      const results = await store.search('anything');
      expect(results).toHaveLength(0);
    });

    it('each result has a score property', async () => {
      await store.add('learning', 'a', 'p', 'test content for scoring');
      const results = await store.search('test content', 1);
      expect(results[0]).toHaveProperty('score');
      expect(typeof results[0].score).toBe('number');
    });
  });

  describe('findDuplicates', () => {
    it('finds identical content as duplicates', async () => {
      const content = 'Simplicity is the ultimate sophistication';
      await store.add('learning', 'a', 'p', content);
      await store.add('learning', 'b', 'p', content);

      const dupes = store.findDuplicates(0.99);
      expect(dupes.length).toBeGreaterThan(0);
      expect(dupes[0].similarity).toBeCloseTo(1, 2);
    });

    it('does not flag clearly different content', async () => {
      await store.add('learning', 'a', 'p', 'pipeline debate plan build ship review');
      await store.add('learning', 'b', 'p', 'margaret quality assurance testing bugs');

      const dupes = store.findDuplicates(0.9);
      expect(dupes).toHaveLength(0);
    });

    it('returns empty array on single entry', async () => {
      await store.add('learning', 'a', 'p', 'only one memory');
      expect(store.findDuplicates(0.5)).toHaveLength(0);
    });
  });
});
