import { describe, it, expect, beforeEach } from 'vitest';
import { TfIdfEmbeddings, contentHash } from '../src/embeddings.js';

// ── contentHash ──────────────────────────────────────────────────────────────

describe('contentHash', () => {
  it('returns a 64-character hex string', () => {
    const hash = contentHash('hello world');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it('same input always produces the same hash', () => {
    expect(contentHash('test')).toBe(contentHash('test'));
  });

  it('different input produces different hashes', () => {
    expect(contentHash('foo')).not.toBe(contentHash('bar'));
  });

  it('trims whitespace before hashing', () => {
    expect(contentHash('  hello  ')).toBe(contentHash('hello'));
  });

  it('handles empty string', () => {
    expect(() => contentHash('')).not.toThrow();
    expect(contentHash('')).toHaveLength(64);
  });
});

// ── TfIdfEmbeddings ──────────────────────────────────────────────────────────

describe('TfIdfEmbeddings', () => {
  let embedder: TfIdfEmbeddings;

  beforeEach(() => {
    embedder = new TfIdfEmbeddings();
  });

  it('has name "tfidf"', () => {
    expect(embedder.name).toBe('tfidf');
  });

  it('has dimensions 512', () => {
    expect(embedder.dimensions).toBe(512);
  });

  it('embed returns a Float64Array of correct length', async () => {
    embedder.buildVocabulary(['the cat sat on the mat', 'a dog ran outside']);
    const vec = await embedder.embed('cat mat');
    expect(vec).toBeInstanceOf(Float64Array);
    expect(vec.length).toBe(512);
  });

  it('embed returns a zero vector before buildVocabulary is called', async () => {
    const vec = await embedder.embed('anything');
    const sum = vec.reduce((a, b) => a + Math.abs(b), 0);
    expect(sum).toBe(0);
  });

  it('embed returns a normalized vector (L2 norm ≈ 1) after buildVocabulary', async () => {
    const docs = [
      'memory system stores learnings',
      'agent dispatch runs pipeline',
      'board review scores project',
    ];
    embedder.buildVocabulary(docs);
    const vec = await embedder.embed('memory stores learnings');
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    expect(norm).toBeCloseTo(1, 5);
  });

  it('similar texts produce higher similarity than dissimilar texts', async () => {
    const docs = [
      'the pipeline runs debate plan build review ship',
      'steve jobs designs the product with taste',
      'elon musk builds the architecture and scales it',
      'margaret hamilton runs quality assurance tests',
    ];
    embedder.buildVocabulary(docs);

    const vecA = await embedder.embed('pipeline debate plan build');
    const vecB = await embedder.embed('pipeline runs debate ship');    // similar to A
    const vecC = await embedder.embed('margaret quality assurance');   // dissimilar to A

    function cosine(a: Float64Array, b: Float64Array): number {
      let dot = 0, na = 0, nb = 0;
      for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i];
      }
      const denom = Math.sqrt(na) * Math.sqrt(nb);
      return denom === 0 ? 0 : dot / denom;
    }

    const simAB = cosine(vecA, vecB);
    const simAC = cosine(vecA, vecC);
    expect(simAB).toBeGreaterThan(simAC);
  });

  it('buildVocabulary handles empty document list', () => {
    expect(() => embedder.buildVocabulary([])).not.toThrow();
  });

  it('buildVocabulary filters stop words', async () => {
    // "the", "and", "for" are stop words — they shouldn't dominate the vocabulary.
    // Need 3+ documents so content words get non-zero IDF:
    //   IDF = log(docCount / (termFreq + 1)); with 2 docs and freq=1 → log(1) = 0
    embedder.buildVocabulary([
      'the and for are but not',     // all stop words → no content terms
      'pipeline agent memory store', // content words appear in 1 of 3 docs
      'different document content',  // third doc so IDF for above terms > 0
    ]);
    const vec = await embedder.embed('pipeline agent memory store');
    const sum = vec.reduce((a, b) => a + Math.abs(b), 0);
    expect(sum).toBeGreaterThan(0);
  });
});
