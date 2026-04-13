import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Config exports are computed at module load time, so we must use
// vi.resetModules() + dynamic import to test different env var combinations.

describe('config', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    // Restore env
    Object.keys(process.env).forEach(k => {
      if (!(k in originalEnv)) delete process.env[k];
    });
    Object.assign(process.env, originalEnv);
  });

  describe('REPO_PATH', () => {
    it('defaults to two levels above daemon/src (i.e. the repo root)', async () => {
      delete process.env.PIPELINE_REPO;
      const { REPO_PATH } = await import('../src/config.js');
      // daemon/src/config.ts → resolve('../..') = great-minds/
      const expected = resolve(__dirname, '../../src/../../');
      expect(REPO_PATH).toBe(resolve(__dirname, '../src', '../..'));
    });

    it('is overridden by PIPELINE_REPO env var', async () => {
      process.env.PIPELINE_REPO = '/custom/repo/path';
      const { REPO_PATH } = await import('../src/config.js');
      expect(REPO_PATH).toBe('/custom/repo/path');
    });
  });

  describe('derived paths', () => {
    it('PLUGIN_PATH is ../great-minds-plugin relative to REPO_PATH', async () => {
      process.env.PIPELINE_REPO = '/custom/repo';
      const { PLUGIN_PATH, REPO_PATH } = await import('../src/config.js');
      expect(PLUGIN_PATH).toBe(resolve(REPO_PATH, '../great-minds-plugin'));
    });

    it('PRDS_DIR is prds/ inside REPO_PATH', async () => {
      process.env.PIPELINE_REPO = '/custom/repo';
      const { PRDS_DIR, REPO_PATH } = await import('../src/config.js');
      expect(PRDS_DIR).toBe(resolve(REPO_PATH, 'prds'));
    });

    it('ROUNDS_DIR is rounds/ inside REPO_PATH', async () => {
      process.env.PIPELINE_REPO = '/custom/repo';
      const { ROUNDS_DIR, REPO_PATH } = await import('../src/config.js');
      expect(ROUNDS_DIR).toBe(resolve(REPO_PATH, 'rounds'));
    });

    it('DELIVERABLES_DIR is deliverables/ inside REPO_PATH', async () => {
      process.env.PIPELINE_REPO = '/custom/repo';
      const { DELIVERABLES_DIR, REPO_PATH } = await import('../src/config.js');
      expect(DELIVERABLES_DIR).toBe(resolve(REPO_PATH, 'deliverables'));
    });

    it('STATUS_FILE is STATUS.md inside REPO_PATH', async () => {
      process.env.PIPELINE_REPO = '/custom/repo';
      const { STATUS_FILE, REPO_PATH } = await import('../src/config.js');
      expect(STATUS_FILE).toBe(resolve(REPO_PATH, 'STATUS.md'));
    });

    it('SKILLS_DIR is skills/ inside PLUGIN_PATH', async () => {
      process.env.PIPELINE_REPO = '/custom/repo';
      const { SKILLS_DIR, PLUGIN_PATH } = await import('../src/config.js');
      expect(SKILLS_DIR).toBe(resolve(PLUGIN_PATH, 'skills'));
    });
  });

  describe('timeout constants', () => {
    it('AGENT_TIMEOUT_MS defaults to 20 minutes', async () => {
      delete process.env.AGENT_TIMEOUT_MS;
      const { AGENT_TIMEOUT_MS } = await import('../src/config.js');
      expect(AGENT_TIMEOUT_MS).toBe(20 * 60 * 1000);
    });

    it('AGENT_TIMEOUT_MS is overridden by env var', async () => {
      process.env.AGENT_TIMEOUT_MS = '5000';
      const { AGENT_TIMEOUT_MS } = await import('../src/config.js');
      expect(AGENT_TIMEOUT_MS).toBe(5000);
    });

    it('PIPELINE_TIMEOUT_MS defaults to 60 minutes', async () => {
      delete process.env.PIPELINE_TIMEOUT_MS;
      const { PIPELINE_TIMEOUT_MS } = await import('../src/config.js');
      expect(PIPELINE_TIMEOUT_MS).toBe(60 * 60 * 1000);
    });

    it('PIPELINE_TIMEOUT_MS is overridden by env var', async () => {
      process.env.PIPELINE_TIMEOUT_MS = '30000';
      const { PIPELINE_TIMEOUT_MS } = await import('../src/config.js');
      expect(PIPELINE_TIMEOUT_MS).toBe(30000);
    });

    it('DEFAULT_MAX_TURNS is 30', async () => {
      const { DEFAULT_MAX_TURNS } = await import('../src/config.js');
      expect(DEFAULT_MAX_TURNS).toBe(30);
    });
  });
});
