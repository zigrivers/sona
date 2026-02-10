import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { server } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';

import { QuickGenerate } from './QuickGenerate';

function renderQuickGenerate() {
  return renderWithProviders(
    <Routes>
      <Route
        path="/clones/:id"
        element={<QuickGenerate cloneId="clone-1" cloneName="Test Clone" />}
      />
      <Route path="/create" element={<div data-testid="create-page">Create Page</div>} />
    </Routes>,
    { initialEntries: ['/clones/clone-1'] }
  );
}

describe('QuickGenerate', () => {
  it('shows panel with generate button', () => {
    renderQuickGenerate();
    expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument();
  });

  it('has text input and platform selector', () => {
    renderQuickGenerate();
    expect(screen.getByPlaceholderText(/what.*write/i)).toBeInTheDocument();
    // Platform checkboxes
    expect(screen.getByLabelText(/linkedin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/twitter/i)).toBeInTheDocument();
  });

  it('disables generate when no text entered', () => {
    renderQuickGenerate();
    expect(screen.getByRole('button', { name: /^generate$/i })).toBeDisabled();
  });

  it('generates content and shows result', async () => {
    const user = userEvent.setup();
    renderQuickGenerate();

    const input = screen.getByPlaceholderText(/what.*write/i);
    await user.type(input, 'Write about AI trends');

    await user.click(screen.getByLabelText(/linkedin/i));
    await user.click(screen.getByRole('button', { name: /^generate$/i }));

    await waitFor(() => {
      expect(screen.getByText(/ai-generated content/i)).toBeInTheDocument();
    });
  });

  it('shows Save to Library button after generation', async () => {
    const user = userEvent.setup();
    renderQuickGenerate();

    await user.type(screen.getByPlaceholderText(/what.*write/i), 'Write about AI');
    await user.click(screen.getByLabelText(/linkedin/i));
    await user.click(screen.getByRole('button', { name: /^generate$/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save to library/i })).toBeInTheDocument();
    });
  });

  it('saves content to library', async () => {
    const user = userEvent.setup();
    let savedBody: unknown = null;

    server.use(
      http.put('/api/content/:id', async ({ request }) => {
        savedBody = await request.json();
        return HttpResponse.json({
          id: 'content-linkedin',
          clone_id: 'clone-1',
          platform: 'linkedin',
          status: 'published',
          content_current: 'AI-generated content.',
          content_original: 'AI-generated content.',
          input_text: 'Write about AI',
          generation_properties: null,
          authenticity_score: null,
          score_dimensions: null,
          topic: null,
          campaign: null,
          tags: [],
          word_count: 2,
          char_count: 21,
          preset_id: null,
          created_at: '2026-01-15T10:00:00Z',
          updated_at: '2026-01-15T10:00:00Z',
        });
      })
    );

    renderQuickGenerate();

    await user.type(screen.getByPlaceholderText(/what.*write/i), 'Write about AI');
    await user.click(screen.getByLabelText(/linkedin/i));
    await user.click(screen.getByRole('button', { name: /^generate$/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save to library/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /save to library/i }));

    await waitFor(() => {
      expect(savedBody).toEqual(
        expect.objectContaining({ content_current: 'AI-generated content.', status: 'published' })
      );
    });
  });

  it('shows Open in Generator link after generation', async () => {
    const user = userEvent.setup();
    renderQuickGenerate();

    await user.type(screen.getByPlaceholderText(/what.*write/i), 'Write about AI');
    await user.click(screen.getByLabelText(/linkedin/i));
    await user.click(screen.getByRole('button', { name: /^generate$/i }));

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /open in generator/i })).toBeInTheDocument();
    });
  });
});
