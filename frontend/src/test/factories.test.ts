import { describe, expect, it } from 'vitest';

import { CloneResponseSchema, ContentResponseSchema, SampleResponseSchema } from '@/types/api';

import { buildClone, buildContent, buildSample } from './factories';

describe('buildClone', () => {
  it('should return a valid CloneResponse', () => {
    const clone = buildClone();
    const result = CloneResponseSchema.safeParse(clone);
    expect(result.success).toBe(true);
  });

  it('should accept overrides', () => {
    const clone = buildClone({ name: 'Custom Name', confidence_score: 85 });
    expect(clone.name).toBe('Custom Name');
    expect(clone.confidence_score).toBe(85);
  });

  it('should generate unique IDs', () => {
    const a = buildClone();
    const b = buildClone();
    expect(a.id).not.toBe(b.id);
  });
});

describe('buildContent', () => {
  it('should return a valid ContentResponse', () => {
    const content = buildContent();
    const result = ContentResponseSchema.safeParse(content);
    expect(result.success).toBe(true);
  });

  it('should accept overrides', () => {
    const content = buildContent({ platform: 'twitter', status: 'published' });
    expect(content.platform).toBe('twitter');
    expect(content.status).toBe('published');
  });
});

describe('buildSample', () => {
  it('should return a valid SampleResponse', () => {
    const sample = buildSample();
    const result = SampleResponseSchema.safeParse(sample);
    expect(result.success).toBe(true);
  });
});
