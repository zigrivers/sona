import { describe, expect, it } from 'vitest';

import { useGeneratorStore } from './generator-store';

describe('generator-store', () => {
  it('defaults to null values', () => {
    const state = useGeneratorStore.getState();
    expect(state.lastUsedCloneId).toBeNull();
    expect(state.lastUsedProperties).toBeNull();
  });

  it('sets lastUsedCloneId', () => {
    useGeneratorStore.getState().setLastUsedCloneId('clone-123');
    expect(useGeneratorStore.getState().lastUsedCloneId).toBe('clone-123');
  });

  it('sets lastUsedProperties', () => {
    const props = {
      platforms: ['twitter'],
      length: 'short' as const,
      tone: 70,
      humor: 30,
      formality: 60,
      targetAudience: 'developers',
      ctaStyle: 'subtle',
      includePhrases: 'hello',
      excludePhrases: 'goodbye',
    };
    useGeneratorStore.getState().setLastUsedProperties(props);
    expect(useGeneratorStore.getState().lastUsedProperties).toEqual(props);
  });

  it('clears lastUsedCloneId with null', () => {
    useGeneratorStore.getState().setLastUsedCloneId('clone-123');
    useGeneratorStore.getState().setLastUsedCloneId(null);
    expect(useGeneratorStore.getState().lastUsedCloneId).toBeNull();
  });
});
