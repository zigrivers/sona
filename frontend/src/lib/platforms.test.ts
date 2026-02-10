import { describe, expect, it } from 'vitest';

import {
  countWords,
  getLimitColor,
  getLimitStatus,
  getPlatformHints,
  splitIntoThread,
} from './platforms';

describe('getLimitStatus', () => {
  it('returns ok when under 80%', () => {
    expect(getLimitStatus(100, 280)).toBe('ok');
    expect(getLimitStatus(0, 280)).toBe('ok');
    expect(getLimitStatus(223, 280)).toBe('ok'); // 79.6%
  });

  it('returns warning when 80-100%', () => {
    expect(getLimitStatus(224, 280)).toBe('warning'); // 80%
    expect(getLimitStatus(250, 280)).toBe('warning');
    expect(getLimitStatus(280, 280)).toBe('warning'); // exactly 100%
  });

  it('returns over when above 100%', () => {
    expect(getLimitStatus(281, 280)).toBe('over');
    expect(getLimitStatus(1000, 280)).toBe('over');
  });
});

describe('getLimitColor', () => {
  it('returns green for ok', () => {
    expect(getLimitColor('ok')).toContain('green');
  });

  it('returns yellow for warning', () => {
    expect(getLimitColor('warning')).toContain('yellow');
  });

  it('returns red for over', () => {
    expect(getLimitColor('over')).toContain('red');
  });
});

describe('countWords', () => {
  it('counts words in a sentence', () => {
    expect(countWords('hello world')).toBe(2);
  });

  it('handles multiple spaces', () => {
    expect(countWords('hello   world')).toBe(2);
  });

  it('returns 0 for empty string', () => {
    expect(countWords('')).toBe(0);
  });

  it('returns 0 for whitespace-only', () => {
    expect(countWords('   ')).toBe(0);
  });

  it('handles newlines', () => {
    expect(countWords('hello\nworld\nfoo')).toBe(3);
  });
});

describe('splitIntoThread', () => {
  it('returns empty array for empty string', () => {
    expect(splitIntoThread('')).toEqual([]);
  });

  it('returns single chunk when under 280 chars', () => {
    const text = 'Short tweet.';
    const result = splitIntoThread(text);
    expect(result).toEqual(['Short tweet.']);
  });

  it('splits long text into numbered chunks', () => {
    // Build text longer than 280 chars with sentence boundaries
    const sentence = 'This is a test sentence. ';
    const text = sentence.repeat(20).trim(); // ~499 chars
    const result = splitIntoThread(text);

    expect(result.length).toBeGreaterThan(1);
    // Each chunk should have prefix like "1/N "
    expect(result[0]).toMatch(/^\d+\/\d+ /);
    // Each chunk should be ≤ 280 chars
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(280);
    }
  });

  it('falls back to word boundary for long sentences', () => {
    // A single very long sentence with no periods
    const text = 'word '.repeat(100).trim(); // 499 chars, no sentence boundary
    const result = splitIntoThread(text);

    expect(result.length).toBeGreaterThan(1);
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(280);
    }
  });

  it('returns empty array for whitespace-only', () => {
    expect(splitIntoThread('   ')).toEqual([]);
  });
});

describe('getPlatformHints', () => {
  it('returns hints for twitter', () => {
    const hints = getPlatformHints('twitter');
    expect(hints.length).toBeGreaterThan(0);
    expect(hints.some((h) => h.toLowerCase().includes('280'))).toBe(true);
  });

  it('returns hints for linkedin', () => {
    const hints = getPlatformHints('linkedin');
    expect(hints.length).toBeGreaterThan(0);
  });

  it('returns hints for email', () => {
    const hints = getPlatformHints('email');
    expect(hints.length).toBeGreaterThan(0);
  });

  it('returns hints for blog', () => {
    const hints = getPlatformHints('blog');
    expect(hints.length).toBeGreaterThan(0);
  });

  it('returns hints for generic', () => {
    const hints = getPlatformHints('generic');
    expect(hints.length).toBeGreaterThan(0);
  });
});
