import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';

import { FileUploadTab } from './FileUploadTab';

const CLONE_ID = 'clone-1';

function renderTab(props: Partial<React.ComponentProps<typeof FileUploadTab>> = {}) {
  const defaultProps = {
    cloneId: CLONE_ID,
    onSuccess: vi.fn(),
    ...props,
  };
  return { ...renderWithProviders(<FileUploadTab {...defaultProps} />), ...defaultProps };
}

describe('FileUploadTab', () => {
  it('renders drop zone with instructions', () => {
    renderTab();
    expect(screen.getByText(/drag.*drop|click.*upload/i)).toBeInTheDocument();
  });

  it('reads .txt file and shows preview', async () => {
    const user = userEvent.setup();
    renderTab();

    const file = new File(['Hello from text file'], 'notes.txt', { type: 'text/plain' });
    const input = screen.getByTestId('file-input');
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue('Hello from text file');
    });
    expect(screen.getByText('notes.txt')).toBeInTheDocument();
  });

  it('submits .txt content via paste endpoint', async () => {
    const user = userEvent.setup();
    let postBody: Record<string, unknown> | null = null;

    server.use(
      http.post('/api/clones/:cloneId/samples', async ({ request }) => {
        postBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            id: 'sample-1',
            clone_id: CLONE_ID,
            content: '',
            content_type: 'blog_post',
            content_type_detected: null,
            word_count: 0,
            length_category: null,
            source_type: 'file',
            source_url: null,
            source_filename: 'notes.txt',
            created_at: '2026-01-15T10:00:00Z',
          },
          { status: 201 }
        );
      })
    );

    const { onSuccess } = renderTab();

    const file = new File(['My text content'], 'notes.txt', { type: 'text/plain' });
    const input = screen.getByTestId('file-input');
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => {
      expect(postBody).toEqual({
        content: 'My text content',
        content_type: 'blog_post',
        source_type: 'file',
        source_filename: 'notes.txt',
      });
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('uploads .pdf file directly', async () => {
    const user = userEvent.setup();
    let uploadCalled = false;

    server.use(
      http.post('/api/clones/:cloneId/samples/upload', async () => {
        uploadCalled = true;
        return HttpResponse.json(
          {
            id: 'sample-up',
            clone_id: CLONE_ID,
            content: '',
            content_type: 'blog_post',
            content_type_detected: null,
            word_count: 0,
            length_category: null,
            source_type: 'file',
            source_url: null,
            source_filename: 'doc.pdf',
            created_at: '2026-01-15T10:00:00Z',
          },
          { status: 201 }
        );
      })
    );

    const { onSuccess } = renderTab();

    const file = new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('file-input');
    await user.upload(input, file);

    await waitFor(() => {
      expect(uploadCalled).toBe(true);
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('uploads .docx file directly', async () => {
    const user = userEvent.setup();
    let uploadCalled = false;

    server.use(
      http.post('/api/clones/:cloneId/samples/upload', async () => {
        uploadCalled = true;
        return HttpResponse.json(
          {
            id: 'sample-up',
            clone_id: CLONE_ID,
            content: '',
            content_type: 'blog_post',
            content_type_detected: null,
            word_count: 0,
            length_category: null,
            source_type: 'file',
            source_url: null,
            source_filename: 'doc.docx',
            created_at: '2026-01-15T10:00:00Z',
          },
          { status: 201 }
        );
      })
    );

    renderTab();

    const file = new File(['PK'], 'doc.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const input = screen.getByTestId('file-input');
    await user.upload(input, file);

    await waitFor(() => {
      expect(uploadCalled).toBe(true);
    });
  });

  it('Back returns to drop zone from preview', async () => {
    const user = userEvent.setup();
    renderTab();

    const file = new File(['Hello'], 'notes.txt', { type: 'text/plain' });
    const input = screen.getByTestId('file-input');
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /back/i }));

    await waitFor(() => {
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
    expect(screen.getByText(/drag.*drop|click.*upload/i)).toBeInTheDocument();
  });

  it('shows error on upload failure', async () => {
    const user = userEvent.setup();

    server.use(
      http.post('/api/clones/:cloneId/samples/upload', () => {
        return HttpResponse.json(
          { detail: 'File too large', code: 'FILE_TOO_LARGE' },
          { status: 413 }
        );
      })
    );

    renderTab();

    const file = new File(['%PDF'], 'huge.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('file-input');
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/file too large/i)).toBeInTheDocument();
    });
  });
});
