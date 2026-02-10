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
    expect(data).toHaveLength(3);
    expect(data[0].name).toBe('openai');
  });

  it('should intercept GET /api/methodology/:section', async () => {
    const response = await fetch('/api/methodology/voice_cloning');
    const data = await response.json();
    expect(data.section_key).toBe('voice_cloning');
    expect(data.current_content).toBe('Voice cloning methodology instructions.');
  });
});
