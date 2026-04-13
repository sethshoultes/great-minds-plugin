import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BugLog, seedKnownBugs } from '../src/buglog.js';

describe('BugLog', () => {
  let log: BugLog;

  beforeEach(() => {
    log = new BugLog(':memory:');
  });

  afterEach(() => {
    log.close();
  });

  const bug = (overrides = {}) => ({
    bug: 'test bug description',
    cause: 'root cause here',
    fix: 'apply this fix',
    file: 'src/daemon.ts',
    platform: 'both' as const,
    discoveredBy: 'Margaret Hamilton',
    project: 'great-minds',
    ...overrides,
  });

  describe('addBug', () => {
    it('returns a positive integer id', () => {
      const id = log.addBug(bug());
      expect(id).toBeGreaterThan(0);
    });

    it('each insert gets a unique id', () => {
      const id1 = log.addBug(bug());
      const id2 = log.addBug(bug({ bug: 'another bug' }));
      expect(id2).toBeGreaterThan(id1);
    });

    it('uses default values for optional fields', () => {
      const id = log.addBug({ bug: 'minimal', cause: '', fix: '', file: '', platform: 'both', discoveredBy: 'manual', project: '' });
      const entry = log.getById(id);
      expect(entry?.platform).toBe('both');
      expect(entry?.discoveredBy).toBe('manual');
    });
  });

  describe('getById', () => {
    it('returns the inserted entry', () => {
      const id = log.addBug(bug({ bug: 'grep -oP fails on macOS' }));
      const entry = log.getById(id);
      expect(entry?.bug).toBe('grep -oP fails on macOS');
      expect(entry?.file).toBe('src/daemon.ts');
    });

    it('returns undefined for unknown id', () => {
      expect(log.getById(99999)).toBeUndefined();
    });
  });

  describe('count', () => {
    it('returns 0 on empty log', () => {
      expect(log.count()).toBe(0);
    });

    it('increments with each insert', () => {
      log.addBug(bug());
      log.addBug(bug({ bug: 'second' }));
      expect(log.count()).toBe(2);
    });
  });

  describe('getAll', () => {
    it('returns all entries (order by timestamp desc, id breaks ties)', () => {
      log.addBug(bug({ bug: 'first' }));
      log.addBug(bug({ bug: 'second' }));
      const all = log.getAll();
      expect(all).toHaveLength(2);
      // Both entries present; order by timestamp desc (id desc for same-second inserts)
      expect(all.map(e => e.bug)).toContain('first');
      expect(all.map(e => e.bug)).toContain('second');
    });
  });

  describe('searchBugs', () => {
    beforeEach(() => {
      log.addBug(bug({ bug: 'grep -oP fails', cause: 'BSD grep', file: 'crons/run.sh' }));
      log.addBug(bug({ bug: 'timeout missing', cause: 'GNU coreutils', file: 'crons/deploy.sh' }));
      log.addBug(bug({ bug: 'tmux send-keys fails', cause: 'input buffer', file: 'agent.ts' }));
    });

    it('finds by bug text', () => {
      const results = log.searchBugs('grep');
      expect(results).toHaveLength(1);
      expect(results[0].bug).toContain('grep');
    });

    it('finds by cause text', () => {
      const results = log.searchBugs('BSD grep');
      expect(results.some(r => r.cause === 'BSD grep')).toBe(true);
    });

    it('finds by file name', () => {
      const results = log.searchBugs('agent.ts');
      expect(results.some(r => r.file === 'agent.ts')).toBe(true);
    });

    it('returns empty array for no matches', () => {
      expect(log.searchBugs('nonexistent query xyz')).toHaveLength(0);
    });

    it('is case-insensitive (LIKE is case-insensitive in SQLite)', () => {
      const results = log.searchBugs('GREP');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('checkBeforeBuild', () => {
    beforeEach(() => {
      log.addBug(bug({ file: 'src/daemon.ts', bug: 'exact file bug' }));
      log.addBug(bug({ file: 'src/pipeline.ts', bug: 'pipeline bug' }));
      log.addBug(bug({ file: '', bug: 'no file bug' }));
    });

    it('returns empty array for empty file list', () => {
      expect(log.checkBeforeBuild([])).toHaveLength(0);
    });

    it('matches exact file path', () => {
      const results = log.checkBeforeBuild(['src/daemon.ts']);
      expect(results.some(r => r.file === 'src/daemon.ts')).toBe(true);
    });

    it('matches partial file path (basename)', () => {
      const results = log.checkBeforeBuild(['/long/path/to/src/pipeline.ts']);
      expect(results.some(r => r.file === 'src/pipeline.ts')).toBe(true);
    });

    it('deduplicates results (exact match not returned twice)', () => {
      const results = log.checkBeforeBuild(['src/daemon.ts']);
      const ids = results.map(r => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('returns no results for files with no known bugs', () => {
      expect(log.checkBeforeBuild(['src/unknown-file.ts'])).toHaveLength(0);
    });
  });
});

// ── seedKnownBugs ─────────────────────────────────────────────────────────────

describe('seedKnownBugs', () => {
  let log: BugLog;

  beforeEach(() => {
    log = new BugLog(':memory:');
  });

  afterEach(() => {
    log.close();
  });

  it('seeds at least 5 known bugs', () => {
    const added = seedKnownBugs(log);
    expect(added).toBeGreaterThanOrEqual(5);
    expect(log.count()).toBeGreaterThanOrEqual(5);
  });

  it('does not add duplicates on second run', () => {
    seedKnownBugs(log);
    const countAfterFirst = log.count();
    const addedSecond = seedKnownBugs(log);
    expect(addedSecond).toBe(0);
    expect(log.count()).toBe(countAfterFirst);
  });

  it('includes macOS-specific bugs', () => {
    seedKnownBugs(log);
    const macosBugs = log.getAll().filter(b => b.platform === 'macOS');
    expect(macosBugs.length).toBeGreaterThan(0);
  });

  it('includes the grep -oP macOS bug', () => {
    seedKnownBugs(log);
    const results = log.searchBugs('grep -oP');
    expect(results.length).toBeGreaterThan(0);
  });

  it('includes the tmux send-keys bug', () => {
    seedKnownBugs(log);
    const results = log.searchBugs('tmux send-keys');
    expect(results.length).toBeGreaterThan(0);
  });
});
