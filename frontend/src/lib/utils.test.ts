import { describe, expect, it } from 'vitest';

import { cn, formatRelativeTime, formatSampleCount, getInitials } from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    const isHidden = false;
    expect(cn('base', isHidden && 'hidden', 'extra')).toBe('base extra');
  });

  it('resolves tailwind conflicts (last wins)', () => {
    expect(cn('px-4', 'px-6')).toBe('px-6');
  });

  it('handles undefined and null inputs', () => {
    expect(cn('base', undefined, null, 'extra')).toBe('base extra');
  });

  it('handles empty input', () => {
    expect(cn()).toBe('');
  });

  it('merges complex tailwind classes', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });
});

describe('getInitials', () => {
  it('returns first letters of first two words', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('returns single initial for single word', () => {
    expect(getInitials('Alice')).toBe('A');
  });

  it('handles more than two words (takes first and last)', () => {
    expect(getInitials('John Michael Doe')).toBe('JD');
  });

  it('uppercases initials', () => {
    expect(getInitials('john doe')).toBe('JD');
  });

  it('returns empty string for empty input', () => {
    expect(getInitials('')).toBe('');
  });

  it('trims whitespace', () => {
    expect(getInitials('  Alice   Bob  ')).toBe('AB');
  });
});

describe('formatRelativeTime', () => {
  it('returns "just now" for less than a minute ago', () => {
    const now = new Date();
    expect(formatRelativeTime(now.toISOString())).toBe('just now');
  });

  it('returns minutes ago', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(date.toISOString())).toBe('5m ago');
  });

  it('returns hours ago', () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(formatRelativeTime(date.toISOString())).toBe('3h ago');
  });

  it('returns days ago', () => {
    const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(date.toISOString())).toBe('2d ago');
  });

  it('returns weeks ago', () => {
    const date = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(date.toISOString())).toBe('2w ago');
  });

  it('returns months ago', () => {
    const date = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(date.toISOString())).toBe('2mo ago');
  });

  it('returns years ago', () => {
    const date = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(date.toISOString())).toBe('1y ago');
  });
});

describe('formatSampleCount', () => {
  it('returns singular for 1 sample', () => {
    expect(formatSampleCount(1)).toBe('1 sample');
  });

  it('returns plural for 0 samples', () => {
    expect(formatSampleCount(0)).toBe('0 samples');
  });

  it('returns plural for multiple samples', () => {
    expect(formatSampleCount(42)).toBe('42 samples');
  });
});
