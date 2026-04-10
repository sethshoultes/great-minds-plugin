import { describe, it, expect } from 'vitest';
import {
  parseSchedule,
  normalizeAgentName,
  defaultConfig,
  validateConfig,
} from '../src/config-schema.js';

// ── parseSchedule ─────────────────────────────────────────────────────────────

describe('parseSchedule', () => {
  it('"hourly" → "0 * * * *"', () => {
    expect(parseSchedule('hourly')).toBe('0 * * * *');
  });

  it('"every hour" → "0 * * * *"', () => {
    expect(parseSchedule('every hour')).toBe('0 * * * *');
  });

  it('"every 30 minutes" → "*/30 * * * *"', () => {
    expect(parseSchedule('every 30 minutes')).toBe('*/30 * * * *');
  });

  it('"every 15 minutes" → "*/15 * * * *"', () => {
    expect(parseSchedule('every 15 minutes')).toBe('*/15 * * * *');
  });

  it('"every 2 hours" → "0 */2 * * *"', () => {
    expect(parseSchedule('every 2 hours')).toBe('0 */2 * * *');
  });

  it('"daily" → "0 0 * * *"', () => {
    expect(parseSchedule('daily')).toBe('0 0 * * *');
  });

  it('"manual only" → null', () => {
    expect(parseSchedule('manual only')).toBeNull();
  });

  it('"manual" → null', () => {
    expect(parseSchedule('manual')).toBeNull();
  });

  it('"skip" → null', () => {
    expect(parseSchedule('skip')).toBeNull();
  });

  it('"none" → null', () => {
    expect(parseSchedule('none')).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(parseSchedule('Hourly')).toBe('0 * * * *');
    expect(parseSchedule('MANUAL ONLY')).toBeNull();
  });

  it('passes through a raw cron expression unchanged', () => {
    expect(parseSchedule('*/5 * * * *')).toBe('*/5 * * * *');
  });

  it('returns null for a malformed cron string (wrong field count)', () => {
    expect(parseSchedule('* * * *')).toBeNull();
  });

  it('returns null for out-of-range minutes (0)', () => {
    expect(parseSchedule('every 0 minutes')).toBeNull();
  });

  it('returns null for out-of-range minutes (61)', () => {
    expect(parseSchedule('every 61 minutes')).toBeNull();
  });

  it('returns null for out-of-range hours (0)', () => {
    expect(parseSchedule('every 0 hours')).toBeNull();
  });

  it('returns null for out-of-range hours (25)', () => {
    expect(parseSchedule('every 25 hours')).toBeNull();
  });

  it('returns null for unrecognized input', () => {
    expect(parseSchedule('whenever I feel like it')).toBeNull();
  });
});

// ── normalizeAgentName ────────────────────────────────────────────────────────

describe('normalizeAgentName', () => {
  it('strips .md extension', () => {
    expect(normalizeAgentName('steve-jobs-visionary.md')).toBe('steve-jobs-visionary');
  });

  it('lowercases the name', () => {
    expect(normalizeAgentName('Steve-Jobs-Visionary')).toBe('steve-jobs-visionary');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeAgentName('  jony-ive-designer  ')).toBe('jony-ive-designer');
  });

  it('handles name without extension', () => {
    expect(normalizeAgentName('margaret-hamilton-qa')).toBe('margaret-hamilton-qa');
  });

  it('handles .MD extension (uppercase)', () => {
    expect(normalizeAgentName('elon-musk-persona.MD')).toBe('elon-musk-persona');
  });
});

// ── defaultConfig ─────────────────────────────────────────────────────────────

describe('defaultConfig', () => {
  it('sets the project name', () => {
    const c = defaultConfig('my-project');
    expect(c.project).toBe('my-project');
  });

  it('sets version to "1.0"', () => {
    expect(defaultConfig('x').version).toBe('1.0');
  });

  it('sets autoShip to false', () => {
    expect(defaultConfig('x').pipeline.autoShip).toBe(false);
  });

  it('sets schedule to null (manual)', () => {
    expect(defaultConfig('x').pipeline.schedule).toBeNull();
  });

  it('sets tokenBudgetPerAgent to 50000', () => {
    expect(defaultConfig('x').agents.tokenBudgetPerAgent).toBe(50000);
  });

  it('sets active agents to empty array', () => {
    expect(defaultConfig('x').agents.active).toEqual([]);
  });

  it('sets telegram fields to empty strings', () => {
    const c = defaultConfig('x');
    expect(c.notifications.telegram.botToken).toBe('');
    expect(c.notifications.telegram.chatId).toBe('');
  });

  it('sets bannedPatterns and customRules to empty arrays', () => {
    const c = defaultConfig('x');
    expect(c.rules.bannedPatterns).toEqual([]);
    expect(c.rules.customRules).toEqual([]);
  });

  it('sets createdAt to a valid ISO timestamp', () => {
    const c = defaultConfig('x');
    expect(() => new Date(c.createdAt)).not.toThrow();
    expect(new Date(c.createdAt).toISOString()).toBe(c.createdAt);
  });
});

// ── validateConfig ────────────────────────────────────────────────────────────

describe('validateConfig', () => {
  const valid = () => ({
    project: 'test-project',
    version: '1.0',
    createdAt: new Date().toISOString(),
    prds: { dir: './docs/prds' },
    agents: { active: ['steve-jobs-visionary'], tokenBudgetPerAgent: 50000 },
    pipeline: { schedule: '0 * * * *', autoShip: false },
    notifications: { telegram: { botToken: '', chatId: '' } },
    rules: { bannedPatterns: [], customRules: [] },
  });

  it('accepts a valid config object', () => {
    expect(() => validateConfig(valid())).not.toThrow();
  });

  it('returns the config object on success', () => {
    const c = valid();
    expect(validateConfig(c)).toBe(c);
  });

  it('throws if project is missing', () => {
    const c = valid();
    delete (c as any).project;
    expect(() => validateConfig(c)).toThrow(/project/);
  });

  it('throws if project is empty string', () => {
    expect(() => validateConfig({ ...valid(), project: '' })).toThrow(/project/);
  });

  it('throws if agents.active is missing', () => {
    const c = valid();
    delete (c as any).agents;
    expect(() => validateConfig(c)).toThrow(/agents/);
  });

  it('throws if agents.active is not an array', () => {
    expect(() => validateConfig({ ...valid(), agents: { active: 'not-array', tokenBudgetPerAgent: 50000 } })).toThrow(/agents/);
  });

  it('throws if pipeline is missing', () => {
    const c = valid();
    delete (c as any).pipeline;
    expect(() => validateConfig(c)).toThrow(/Config\.pipeline must be an object/);
  });

  it('throws if raw is null', () => {
    expect(() => validateConfig(null)).toThrow(/non-null object|must be/i);
  });

  it('throws if raw is a string', () => {
    expect(() => validateConfig('string')).toThrow(/non-null object|must be/i);
  });

  it('throws if raw is a number', () => {
    expect(() => validateConfig(42)).toThrow(/non-null object|must be/i);
  });

  it('accepts schedule: null (manual-only config)', () => {
    expect(() => validateConfig({ ...valid(), pipeline: { schedule: null, autoShip: false } })).not.toThrow();
  });

  it('does not validate the version field (any value accepted)', () => {
    expect(() => validateConfig({ ...valid(), version: 'anything' })).not.toThrow();
  });

  it('does not validate the createdAt field (any value accepted)', () => {
    expect(() => validateConfig({ ...valid(), createdAt: 'not-a-date' })).not.toThrow();
  });
});
