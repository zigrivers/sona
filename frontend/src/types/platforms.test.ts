import { describe, expect, it } from 'vitest';

import { type PlatformKey, PLATFORMS } from './platforms';

describe('PLATFORMS', () => {
  it('includes all 5 platforms', () => {
    const keys = Object.keys(PLATFORMS);
    expect(keys).toHaveLength(5);
  });

  it('includes twitter with correct label and char limit', () => {
    expect(PLATFORMS.twitter).toEqual({
      label: 'Twitter/X',
      charLimit: 280,
    });
  });

  it('includes linkedin with correct label and char limit', () => {
    expect(PLATFORMS.linkedin).toEqual({
      label: 'LinkedIn',
      charLimit: 3000,
    });
  });

  it('includes email with correct label and char limit', () => {
    expect(PLATFORMS.email).toEqual({
      label: 'Email',
      charLimit: 10_000,
    });
  });

  it('includes blog with correct label and char limit', () => {
    expect(PLATFORMS.blog).toEqual({
      label: 'Blog Post',
      charLimit: 50_000,
    });
  });

  it('includes generic with correct label and char limit', () => {
    expect(PLATFORMS.generic).toEqual({
      label: 'Generic',
      charLimit: 100_000,
    });
  });

  it('every platform has a label and charLimit', () => {
    for (const [key, platform] of Object.entries(PLATFORMS)) {
      expect(platform.label, `${key} should have a label`).toBeTruthy();
      expect(typeof platform.charLimit, `${key} charLimit should be a number`).toBe('number');
      expect(platform.charLimit, `${key} charLimit should be positive`).toBeGreaterThan(0);
    }
  });

  it('PlatformKey type matches PLATFORMS keys', () => {
    const keys: PlatformKey[] = ['twitter', 'linkedin', 'email', 'blog', 'generic'];
    for (const key of keys) {
      expect(PLATFORMS[key]).toBeDefined();
    }
  });
});
