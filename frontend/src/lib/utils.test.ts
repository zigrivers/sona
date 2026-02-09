import { describe, expect, it } from 'vitest';

import { cn } from './utils';

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
