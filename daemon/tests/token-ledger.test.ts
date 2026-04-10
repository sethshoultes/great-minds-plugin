import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TokenLedger, estimateCost } from '../src/token-ledger.js';

// ── estimateCost ────────────────────────────────────────────────────────────

describe('estimateCost', () => {
  it('returns 0 for zero tokens', () => {
    expect(estimateCost(0, 0)).toBe(0);
  });

  it('prices 1M input tokens at $3.00', () => {
    expect(estimateCost(1_000_000, 0)).toBeCloseTo(3.0);
  });

  it('prices 1M output tokens at $15.00', () => {
    expect(estimateCost(0, 1_000_000)).toBeCloseTo(15.0);
  });

  it('sums input and output costs', () => {
    expect(estimateCost(1_000_000, 1_000_000)).toBeCloseTo(18.0);
  });

  it('handles fractional tokens', () => {
    const cost = estimateCost(100, 100);
    expect(cost).toBeGreaterThan(0);
    expect(cost).toBeLessThan(0.01);
  });

  it('output tokens cost 5x more than input tokens', () => {
    const inputOnly = estimateCost(1_000_000, 0);
    const outputOnly = estimateCost(0, 1_000_000);
    expect(outputOnly / inputOnly).toBeCloseTo(5);
  });
});

// ── TokenLedger ─────────────────────────────────────────────────────────────

describe('TokenLedger', () => {
  let ledger: TokenLedger;

  beforeEach(() => {
    ledger = new TokenLedger(':memory:');
  });

  afterEach(() => {
    ledger.close();
  });

  const entry = (overrides: Partial<Parameters<typeof ledger.logUsage>[0]> = {}) => {
    const base = {
      timestamp: new Date().toISOString(),
      agent: 'test-agent',
      project: 'test-project',
      phase: 'build',
      inputTokens: 1000,
      outputTokens: 200,
      ...overrides,
    };
    return { ...base, estimatedCost: overrides.estimatedCost ?? estimateCost(base.inputTokens, base.outputTokens) };
  };

  describe('logUsage', () => {
    it('inserts an entry and returns a row id', () => {
      const id = ledger.logUsage(entry());
      expect(id).toBeGreaterThan(0);
    });

    it('each insert gets a unique id', () => {
      const id1 = ledger.logUsage(entry());
      const id2 = ledger.logUsage(entry());
      expect(id2).toBeGreaterThan(id1);
    });
  });

  describe('getSessionTotal', () => {
    it('returns zeros on empty session', () => {
      const total = ledger.getSessionTotal();
      expect(total.totalInputTokens).toBe(0);
      expect(total.totalOutputTokens).toBe(0);
      expect(total.totalCost).toBe(0);
      expect(total.entries).toBe(0);
    });

    it('sums tokens across multiple entries', () => {
      ledger.logUsage(entry({ inputTokens: 500, outputTokens: 100 }));
      ledger.logUsage(entry({ inputTokens: 1500, outputTokens: 300 }));
      const total = ledger.getSessionTotal();
      expect(total.totalInputTokens).toBe(2000);
      expect(total.totalOutputTokens).toBe(400);
      expect(total.entries).toBe(2);
    });

    it('only counts entries from the current session', () => {
      ledger.logUsage(entry());
      const anotherLedger = new TokenLedger(':memory:');
      // Different instance = different session id
      const total = anotherLedger.getSessionTotal();
      expect(total.entries).toBe(0);
      anotherLedger.close();
    });
  });

  describe('getProjectTotal', () => {
    it('returns zeros for unknown project', () => {
      const total = ledger.getProjectTotal('nonexistent');
      expect(total.totalInputTokens).toBe(0);
      expect(total.entries).toBe(0);
    });

    it('sums only entries for the specified project', () => {
      ledger.logUsage(entry({ project: 'alpha', inputTokens: 1000 }));
      ledger.logUsage(entry({ project: 'alpha', inputTokens: 2000 }));
      ledger.logUsage(entry({ project: 'beta', inputTokens: 9999 }));

      const alpha = ledger.getProjectTotal('alpha');
      expect(alpha.totalInputTokens).toBe(3000);
      expect(alpha.entries).toBe(2);

      const beta = ledger.getProjectTotal('beta');
      expect(beta.totalInputTokens).toBe(9999);
      expect(beta.entries).toBe(1);
    });
  });

  describe('getAgentTotal', () => {
    it('sums only entries for the specified agent', () => {
      ledger.logUsage(entry({ agent: 'steve-jobs', inputTokens: 500 }));
      ledger.logUsage(entry({ agent: 'steve-jobs', inputTokens: 500 }));
      ledger.logUsage(entry({ agent: 'elon-musk', inputTokens: 9000 }));

      const steve = ledger.getAgentTotal('steve-jobs');
      expect(steve.totalInputTokens).toBe(1000);
      expect(steve.entries).toBe(2);

      const elon = ledger.getAgentTotal('elon-musk');
      expect(elon.totalInputTokens).toBe(9000);
    });
  });

  describe('getLifetimeTotal', () => {
    it('sums all entries regardless of project or agent', () => {
      ledger.logUsage(entry({ agent: 'steve-jobs', project: 'alpha', inputTokens: 100 }));
      ledger.logUsage(entry({ agent: 'elon-musk', project: 'beta', inputTokens: 200 }));
      ledger.logUsage(entry({ agent: 'margaret', project: 'gamma', inputTokens: 300 }));

      const total = ledger.getLifetimeTotal();
      expect(total.totalInputTokens).toBe(600);
      expect(total.entries).toBe(3);
    });
  });

  describe('getTopAgents', () => {
    it('returns agents sorted by cost descending', () => {
      ledger.logUsage(entry({ agent: 'cheap-agent', inputTokens: 100, outputTokens: 10 }));
      ledger.logUsage(entry({ agent: 'expensive-agent', inputTokens: 10000, outputTokens: 5000 }));
      ledger.logUsage(entry({ agent: 'mid-agent', inputTokens: 1000, outputTokens: 500 }));

      const top = ledger.getTopAgents(3);
      expect(top[0].agent).toBe('expensive-agent');
      expect(top[top.length - 1].agent).toBe('cheap-agent');
    });

    it('respects the limit parameter', () => {
      for (let i = 0; i < 5; i++) {
        ledger.logUsage(entry({ agent: `agent-${i}` }));
      }
      const top = ledger.getTopAgents(2);
      expect(top).toHaveLength(2);
    });
  });

  describe('getTopProjects', () => {
    it('excludes entries with empty project', () => {
      ledger.logUsage(entry({ project: '' }));
      ledger.logUsage(entry({ project: 'real-project', inputTokens: 5000 }));

      const top = ledger.getTopProjects();
      expect(top.every(p => p.project !== '')).toBe(true);
    });

    it('returns projects sorted by cost descending', () => {
      ledger.logUsage(entry({ project: 'small', inputTokens: 100 }));
      ledger.logUsage(entry({ project: 'large', inputTokens: 100000 }));

      const top = ledger.getTopProjects(2);
      expect(top[0].project).toBe('large');
    });
  });

  describe('getRecent', () => {
    it('returns entries most recent first', () => {
      ledger.logUsage(entry({ agent: 'first' }));
      ledger.logUsage(entry({ agent: 'second' }));
      ledger.logUsage(entry({ agent: 'third' }));

      const recent = ledger.getRecent(3);
      expect(recent[0].agent).toBe('third');
      expect(recent[2].agent).toBe('first');
    });

    it('respects the limit', () => {
      for (let i = 0; i < 10; i++) {
        ledger.logUsage(entry({ agent: `agent-${i}` }));
      }
      expect(ledger.getRecent(3)).toHaveLength(3);
    });

    it('returns all entries when limit exceeds count', () => {
      ledger.logUsage(entry());
      ledger.logUsage(entry());
      expect(ledger.getRecent(100)).toHaveLength(2);
    });
  });
});
