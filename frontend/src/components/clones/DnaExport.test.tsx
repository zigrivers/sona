import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { copyToClipboard } from '@/lib/export';
import { server } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';

import { DnaExport } from './DnaExport';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/export', () => ({
  copyToClipboard: vi.fn().mockResolvedValue(undefined),
}));

const MOCK_PROMPT =
  'Write in a style that matches the following voice DNA profile:\n\nVocabulary: Uses intermediate complexity.';

beforeEach(() => {
  vi.mocked(copyToClipboard).mockClear();
  vi.mocked(toast.success).mockClear();

  server.use(
    http.get('/api/clones/:cloneId/dna/prompt', () =>
      HttpResponse.json({ prompt: MOCK_PROMPT })
    )
  );
});

describe('DnaExport', () => {
  it('renders export button', () => {
    renderWithProviders(<DnaExport cloneId="clone-1" />);

    expect(screen.getByRole('button', { name: /export as prompt/i })).toBeInTheDocument();
  });

  it('copies prompt to clipboard on click', async () => {
    const user = userEvent.setup();

    renderWithProviders(<DnaExport cloneId="clone-1" />);

    await user.click(screen.getByRole('button', { name: /export as prompt/i }));

    await waitFor(() => {
      expect(copyToClipboard).toHaveBeenCalledWith(MOCK_PROMPT);
    });
  });

  it('shows toast on successful copy', async () => {
    const user = userEvent.setup();

    renderWithProviders(<DnaExport cloneId="clone-1" />);

    await user.click(screen.getByRole('button', { name: /export as prompt/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Copied to clipboard');
    });
  });
});
