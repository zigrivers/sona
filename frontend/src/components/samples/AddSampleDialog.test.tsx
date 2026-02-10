import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { buildSample } from '@/test/factories';
import { server } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';

import { AddSampleDialog } from './AddSampleDialog';

const CLONE_ID = 'clone-1';

function renderDialog(props: Partial<React.ComponentProps<typeof AddSampleDialog>> = {}) {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    cloneId: CLONE_ID,
    ...props,
  };
  return { ...renderWithProviders(<AddSampleDialog {...defaultProps} />), ...defaultProps };
}

describe('AddSampleDialog', () => {
  it('renders dialog with tabs when open', () => {
    renderDialog();
    expect(screen.getByText('Add Writing Sample')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /paste/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /upload/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /url/i })).toBeInTheDocument();
  });

  it('defaults to paste tab', () => {
    renderDialog();
    expect(screen.getByPlaceholderText(/paste your writing sample/i)).toBeInTheDocument();
  });

  it('add button disabled when textarea empty', () => {
    renderDialog();
    expect(screen.getByRole('button', { name: /^add$/i })).toBeDisabled();
  });

  it('add button enabled when textarea has content', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByPlaceholderText(/paste your writing sample/i), 'Hello world');

    expect(screen.getByRole('button', { name: /^add$/i })).toBeEnabled();
  });

  it('submits paste sample via API', async () => {
    const user = userEvent.setup();
    let postBody: Record<string, unknown> | null = null;

    server.use(
      http.post('/api/clones/:cloneId/samples', async ({ request }) => {
        postBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(buildSample(), { status: 201 });
      })
    );

    renderDialog();

    await user.type(screen.getByPlaceholderText(/paste your writing sample/i), 'My blog post');
    await user.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => {
      expect(postBody).toEqual({
        content: 'My blog post',
        content_type: 'blog_post',
        source_type: 'paste',
      });
    });
  });

  it('resets form when reopened', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    const { rerender } = renderWithProviders(
      <AddSampleDialog open={true} onOpenChange={onOpenChange} cloneId={CLONE_ID} />
    );

    await user.type(screen.getByPlaceholderText(/paste your writing sample/i), 'Some text');

    // Simulate close and reopen
    rerender(<AddSampleDialog open={false} onOpenChange={onOpenChange} cloneId={CLONE_ID} />);
    rerender(<AddSampleDialog open={true} onOpenChange={onOpenChange} cloneId={CLONE_ID} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/paste your writing sample/i)).toHaveValue('');
    });
  });

  it('switches to upload tab', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('tab', { name: /upload/i }));

    await waitFor(() => {
      expect(screen.getByText(/drag.*drop|click.*upload/i)).toBeInTheDocument();
    });
  });

  it('switches to URL tab', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('tab', { name: /url/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/https:\/\//i)).toBeInTheDocument();
    });
  });

  it('resets to paste tab when reopened', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    const { rerender } = renderWithProviders(
      <AddSampleDialog open={true} onOpenChange={onOpenChange} cloneId={CLONE_ID} />
    );

    await user.click(screen.getByRole('tab', { name: /url/i }));

    // Simulate close and reopen
    rerender(<AddSampleDialog open={false} onOpenChange={onOpenChange} cloneId={CLONE_ID} />);
    rerender(<AddSampleDialog open={true} onOpenChange={onOpenChange} cloneId={CLONE_ID} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/paste your writing sample/i)).toBeInTheDocument();
    });
  });
});
