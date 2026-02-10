import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildContent } from '@/test/factories';

import { copyToClipboard, exportAsPdf, exportAsTxt, formatContentForExport } from './export';

describe('formatContentForExport', () => {
  it('formats single content item', () => {
    const item = buildContent({
      platform: 'linkedin',
      content_current: 'Hello world',
      created_at: '2026-01-15T10:00:00Z',
    });
    const result = formatContentForExport(item);
    expect(result).toContain('Hello world');
    expect(result).toContain('LinkedIn');
  });

  it('formats multiple items with separators', () => {
    const items = [
      buildContent({ platform: 'linkedin', content_current: 'Post one' }),
      buildContent({ platform: 'twitter', content_current: 'Tweet two' }),
    ];
    const result = formatContentForExport(items);
    expect(result).toContain('Post one');
    expect(result).toContain('Tweet two');
    expect(result).toContain('---');
  });
});

describe('copyToClipboard', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('copies text to clipboard', async () => {
    await copyToClipboard('Hello');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Hello');
  });
});

describe('exportAsTxt', () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    revokeObjectURL = vi.fn();
    Object.assign(globalThis.URL, { createObjectURL, revokeObjectURL });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a downloadable text file', () => {
    const clickSpy = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: clickSpy,
      style: {},
    } as unknown as HTMLAnchorElement);

    const item = buildContent({ content_current: 'Export me' });
    exportAsTxt(item);

    expect(clickSpy).toHaveBeenCalled();
  });
});

describe('exportAsPdf', () => {
  it('generates a PDF file (calls jspdf)', async () => {
    // Just verify it doesn't throw
    const item = buildContent({ platform: 'linkedin', content_current: 'PDF content here' });
    // exportAsPdf calls jspdf internally — we just verify it completes
    await expect(exportAsPdf(item)).resolves.not.toThrow();
  });
});
