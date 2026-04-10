import { describe, it, expect } from 'vitest';

// Tests for the QA verdict parsing logic from pipeline.ts runQA().
// Extracted here so it can be tested without invoking an LLM.
//
// Source pattern (pipeline.ts):
//   const verdictMatch = result.match(/^##?\s*(?:Overall\s+)?Verdict:\s*(PASS|BLOCK)/im);
//   const passed = /\bPASS\b/i.test(result) && !/\bBLOCK\b/i.test(result);

function parseVerdict(result: string): 'PASS' | 'BLOCK' {
  const verdictMatch = result.match(/^##?\s*(?:Overall\s+)?Verdict:\s*(PASS|BLOCK)/im);
  if (verdictMatch) {
    return verdictMatch[1].toUpperCase() as 'PASS' | 'BLOCK';
  }
  const passed = /\bPASS\b/i.test(result) && !/\bBLOCK\b/i.test(result);
  return passed ? 'PASS' : 'BLOCK';
}

describe('QA verdict parsing', () => {
  describe('explicit heading format (preferred)', () => {
    it('parses ## Verdict: PASS', () => {
      expect(parseVerdict('## Verdict: PASS')).toBe('PASS');
    });

    it('parses ## Verdict: BLOCK', () => {
      expect(parseVerdict('## Verdict: BLOCK')).toBe('BLOCK');
    });

    it('parses # Verdict: PASS (single hash)', () => {
      expect(parseVerdict('# Verdict: PASS')).toBe('PASS');
    });

    it('parses ## Overall Verdict: PASS', () => {
      expect(parseVerdict('## Overall Verdict: PASS')).toBe('PASS');
    });

    it('parses ## Overall Verdict: BLOCK', () => {
      expect(parseVerdict('## Overall Verdict: BLOCK')).toBe('BLOCK');
    });

    it('is case-insensitive on the label', () => {
      expect(parseVerdict('## verdict: PASS')).toBe('PASS');
      expect(parseVerdict('## VERDICT: BLOCK')).toBe('BLOCK');
    });

    it('handles trailing whitespace', () => {
      expect(parseVerdict('## Verdict: PASS  \n\nrest of report')).toBe('PASS');
    });

    it('finds the heading in the middle of a longer report', () => {
      const report = `
# QA Report

Requirements checked...

## Verdict: BLOCK

Issues found:
- Missing X
      `.trim();
      expect(parseVerdict(report)).toBe('BLOCK');
    });
  });

  describe('fallback keyword parsing', () => {
    it('returns PASS when only PASS keyword present', () => {
      expect(parseVerdict('All requirements met. PASS')).toBe('PASS');
    });

    it('returns BLOCK when BLOCK keyword present', () => {
      expect(parseVerdict('Found issues. BLOCK')).toBe('BLOCK');
    });

    it('returns BLOCK when both PASS and BLOCK appear (BLOCK wins)', () => {
      // Defensive: a BLOCK result that mentions PASS in context should still BLOCK
      expect(parseVerdict('Previous run was PASS but now BLOCK')).toBe('BLOCK');
    });

    it('returns BLOCK when neither keyword present (default safe)', () => {
      expect(parseVerdict('Some ambiguous QA output with no verdict')).toBe('BLOCK');
    });

    it('is case-insensitive on keywords', () => {
      expect(parseVerdict('all good, pass')).toBe('PASS');
      expect(parseVerdict('issues found, block')).toBe('BLOCK');
    });
  });

  describe('auth error detection', () => {
    it('identifies 401 auth errors', () => {
      const hasAuthError = (result: string) =>
        result.includes('401') ||
        result.includes('authentication_error') ||
        result.includes('Invalid authentication');

      expect(hasAuthError('Error 401 Unauthorized')).toBe(true);
      expect(hasAuthError('{"type":"authentication_error"}')).toBe(true);
      expect(hasAuthError('Invalid authentication credentials')).toBe(true);
      expect(hasAuthError('Normal QA output')).toBe(false);
    });
  });
});
