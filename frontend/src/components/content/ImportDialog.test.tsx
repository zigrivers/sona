import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { buildClone, buildContent } from '@/test/factories';
import { server } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';

import { ImportDialog } from './ImportDialog';

function mockClones() {
  server.use(
    http.get('/api/clones', () => {
      return HttpResponse.json({
        items: [
          buildClone({ id: 'clone-1', name: 'Marketing Voice' }),
          buildClone({ id: 'clone-2', name: 'Tech Writer' }),
        ],
        total: 2,
      });
    })
  );
}

function renderDialog(props: Partial<React.ComponentProps<typeof ImportDialog>> = {}) {
  mockClones();
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    ...props,
  };
  return { ...renderWithProviders(<ImportDialog {...defaultProps} />), ...defaultProps };
}

describe('ImportDialog', () => {
  it('shows dialog with heading', () => {
    renderDialog();
    expect(screen.getByText('Import Content')).toBeInTheDocument();
  });

  it('shows Paste and Upload tabs', () => {
    renderDialog();
    expect(screen.getByRole('tab', { name: /paste/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /upload/i })).toBeInTheDocument();
  });

  it('paste tab has textarea, clone selector, platform selector, and Import button', async () => {
    renderDialog();

    expect(screen.getByPlaceholderText(/paste your content/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();

    // Clone and platform selectors
    await waitFor(() => {
      expect(screen.getByText(/select clone/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/select platform/i)).toBeInTheDocument();
  });

  it('Import button disabled when text empty', () => {
    renderDialog();
    expect(screen.getByRole('button', { name: /import/i })).toBeDisabled();
  });

  it('Import button disabled when clone not selected', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByPlaceholderText(/paste your content/i), 'Some text');

    // Button still disabled because no clone selected
    expect(screen.getByRole('button', { name: /import/i })).toBeDisabled();
  });

  it('submits paste import and closes dialog', async () => {
    const user = userEvent.setup();
    let postBody: Record<string, unknown> | null = null;

    server.use(
      http.post('/api/content/import', async ({ request }) => {
        postBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(buildContent({ generation_properties: { source: 'import' } }), {
          status: 201,
        });
      })
    );

    const { onOpenChange } = renderDialog();

    // Wait for clones to load
    await waitFor(() => {
      expect(screen.getByText(/select clone/i)).toBeInTheDocument();
    });

    // Type content
    await user.type(screen.getByPlaceholderText(/paste your content/i), 'My imported post');

    // Select clone — click the trigger (combobox), then the option
    const cloneTriggers = screen.getAllByRole('combobox');
    await user.click(cloneTriggers[0]);
    await user.click(screen.getByText('Marketing Voice'));

    // Select platform
    await user.click(cloneTriggers[1]);
    await user.click(screen.getByText('Blog Post'));

    // Click import
    await user.click(screen.getByRole('button', { name: /import/i }));

    await waitFor(() => {
      expect(postBody).toEqual(
        expect.objectContaining({
          clone_id: 'clone-1',
          platform: 'blog',
          content_text: 'My imported post',
        })
      );
    });

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('shows upload tab with dropzone', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('tab', { name: /upload/i }));

    await waitFor(() => {
      expect(screen.getByText(/drag.*drop|click.*upload/i)).toBeInTheDocument();
    });
  });
});
