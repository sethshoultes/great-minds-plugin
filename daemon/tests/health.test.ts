import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Use a temp directory as a fake repo so we don't touch real files.
const tmpRepo = join(tmpdir(), `gm-health-test-${process.pid}`);

vi.mock('../src/config.js', () => ({
  MEMORY_FILE: join(tmpRepo, 'MEMORY.md'),
  MEMORY_STORE_DIR: join(tmpRepo, 'memory-store'),
  REPO_PATH: tmpRepo,
  PRDS_DIR: join(tmpRepo, 'prds'),
  SITES: [],
  GIT_REPOS: [],
  GITHUB_REPOS: [],
  LOG_DIR: join(tmpRepo, 'logs'),
  STATUS_FILE: join(tmpRepo, 'STATUS.md'),
}));

vi.mock('../src/logger.js', () => ({
  log: vi.fn(),
  logError: vi.fn(),
}));

beforeAll(() => {
  mkdirSync(tmpRepo, { recursive: true });
});

afterAll(() => {
  rmSync(tmpRepo, { recursive: true, force: true });
});

describe('checkMemory', () => {
  it('returns zero lines and not bloated when MEMORY.md is missing', async () => {
    const { checkMemory } = await import('../src/health.js');
    const result = checkMemory();
    expect(result.lines).toBe(0);
    expect(result.bloated).toBe(false);
  });

  it('counts lines in MEMORY.md', async () => {
    writeFileSync(
      join(tmpRepo, 'MEMORY.md'),
      Array(50).fill('- item').join('\n'),
    );
    vi.resetModules();

    vi.mock('../src/config.js', () => ({
      MEMORY_FILE: join(tmpRepo, 'MEMORY.md'),
      MEMORY_STORE_DIR: join(tmpRepo, 'memory-store'),
      REPO_PATH: tmpRepo,
      PRDS_DIR: join(tmpRepo, 'prds'),
      SITES: [],
      GIT_REPOS: [],
      GITHUB_REPOS: [],
      LOG_DIR: join(tmpRepo, 'logs'),
      STATUS_FILE: join(tmpRepo, 'STATUS.md'),
    }));
    vi.mock('../src/logger.js', () => ({
      log: vi.fn(),
      logError: vi.fn(),
    }));

    const { checkMemory } = await import('../src/health.js');
    const result = checkMemory();
    expect(result.lines).toBe(50);
    expect(result.bloated).toBe(false);
  });

  it('flags bloated when MEMORY.md exceeds 100 lines', async () => {
    writeFileSync(
      join(tmpRepo, 'MEMORY.md'),
      Array(150).fill('- item').join('\n'),
    );
    vi.resetModules();

    vi.mock('../src/config.js', () => ({
      MEMORY_FILE: join(tmpRepo, 'MEMORY.md'),
      MEMORY_STORE_DIR: join(tmpRepo, 'memory-store'),
      REPO_PATH: tmpRepo,
      PRDS_DIR: join(tmpRepo, 'prds'),
      SITES: [],
      GIT_REPOS: [],
      GITHUB_REPOS: [],
      LOG_DIR: join(tmpRepo, 'logs'),
      STATUS_FILE: join(tmpRepo, 'STATUS.md'),
    }));
    vi.mock('../src/logger.js', () => ({
      log: vi.fn(),
      logError: vi.fn(),
    }));

    const { checkMemory } = await import('../src/health.js');
    const result = checkMemory();
    expect(result.lines).toBeGreaterThan(100);
    expect(result.bloated).toBe(true);
  });
});

describe('runHeartbeat', () => {
  it('returns an empty problems array when sites and repos are empty', async () => {
    writeFileSync(join(tmpRepo, 'MEMORY.md'), Array(10).fill('- item').join('\n'));
    vi.resetModules();

    vi.mock('../src/config.js', () => ({
      MEMORY_FILE: join(tmpRepo, 'MEMORY.md'),
      MEMORY_STORE_DIR: join(tmpRepo, 'memory-store'),
      REPO_PATH: tmpRepo,
      PRDS_DIR: join(tmpRepo, 'prds'),
      SITES: [],        // no sites to check
      GIT_REPOS: [],    // no repos to check
      GITHUB_REPOS: [],
      LOG_DIR: join(tmpRepo, 'logs'),
      STATUS_FILE: join(tmpRepo, 'STATUS.md'),
    }));
    vi.mock('../src/logger.js', () => ({
      log: vi.fn(),
      logError: vi.fn(),
    }));

    const { runHeartbeat } = await import('../src/health.js');
    const problems = await runHeartbeat();
    expect(problems).toEqual([]);
  });
});
