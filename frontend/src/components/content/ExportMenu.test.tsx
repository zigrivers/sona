import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { buildContent } from '@/test/factories';

import { ExportMenu } from './ExportMenu';

// Mock the export utilities
vi.mock('@/lib/export', () => ({
  copyToClipboard: vi.fn().mockResolvedValue(undefined),
  exportAsTxt: vi.fn(),
  exportAsPdf: vi.fn().mockResolvedValue(undefined),
  formatContentForExport: vi.fn().mockReturnValue('Formatted content'),
}));

const item = buildContent({ platform: 'linkedin', content_current: 'Test content' });

describe('ExportMenu', () => {
  it('renders export button', () => {
    render(<ExportMenu items={[item]} />);
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
  });

  it('shows menu items when clicked', async () => {
    const user = userEvent.setup();
    render(<ExportMenu items={[item]} />);

    await user.click(screen.getByRole('button', { name: /export/i }));

    expect(screen.getByRole('menuitem', { name: /copy/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /text/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /pdf/i })).toBeInTheDocument();
  });

  it('calls copyToClipboard on Copy click', async () => {
    const { copyToClipboard } = await import('@/lib/export');
    const user = userEvent.setup();
    render(<ExportMenu items={[item]} />);

    await user.click(screen.getByRole('button', { name: /export/i }));
    await user.click(screen.getByRole('menuitem', { name: /copy/i }));

    expect(copyToClipboard).toHaveBeenCalled();
  });

  it('calls exportAsTxt on Text click', async () => {
    const { exportAsTxt } = await import('@/lib/export');
    const user = userEvent.setup();
    render(<ExportMenu items={[item]} />);

    await user.click(screen.getByRole('button', { name: /export/i }));
    await user.click(screen.getByRole('menuitem', { name: /text/i }));

    expect(exportAsTxt).toHaveBeenCalled();
  });

  it('calls exportAsPdf on PDF click', async () => {
    const { exportAsPdf } = await import('@/lib/export');
    const user = userEvent.setup();
    render(<ExportMenu items={[item]} />);

    await user.click(screen.getByRole('button', { name: /export/i }));
    await user.click(screen.getByRole('menuitem', { name: /pdf/i }));

    expect(exportAsPdf).toHaveBeenCalled();
  });
});
