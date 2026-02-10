import { describe, expect, it } from 'vitest';

describe('MSW server', () => {
  it('should intercept GET /api/clones', async () => {
    const response = await fetch('/api/clones');
    const data = await response.json();
    expect(data).toEqual({ items: [], total: 0 });
  });

  it('should intercept GET /api/content', async () => {
    const response = await fetch('/api/content');
    const data = await response.json();
    expect(data).toEqual({ items: [], total: 0 });
  });

  it('should intercept GET /api/providers', async () => {
    const response = await fetch('/api/providers');
    const data = await response.json();
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe('openai');
  });

  it('should intercept GET /api/methodology', async () => {
    const response = await fetch('/api/methodology');
    const data = await response.json();
    expect(data).toHaveLength(1);
    expect(data[0].section_key).toBe('voice_cloning');
  });
});
