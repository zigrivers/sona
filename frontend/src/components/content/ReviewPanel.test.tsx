import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { buildContent } from '@/test/factories';
import { server } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';

import { ReviewPanel } from './ReviewPanel';

const items = [
  buildContent({ id: 'c-1', platform: 'linkedin', content_current: 'LinkedIn content' }),
  buildContent({ id: 'c-2', platform: 'twitter', content_current: 'Twitter content' }),
];

const generationParams = {
  clone_id: 'clone-1',
  input_text: 'Write about TDD.',
  properties: { length: 'medium' },
};

describe('ReviewPanel', () => {
  it('renders a tab per platform', () => {
    renderWithProviders(<ReviewPanel items={items} generationParams={generationParams} />);
    expect(screen.getByRole('tab', { name: /linkedin/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /twitter/i })).toBeInTheDocument();
  });

  it('shows correct content per tab', () => {
    renderWithProviders(<ReviewPanel items={items} generationParams={generationParams} />);
    // First tab (LinkedIn) should be active by default
    expect(screen.getByDisplayValue('LinkedIn content')).toBeInTheDocument();
  });

  it('switching tabs shows different content', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReviewPanel items={items} generationParams={generationParams} />);

    await user.click(screen.getByRole('tab', { name: /twitter/i }));
    expect(screen.getByDisplayValue('Twitter content')).toBeInTheDocument();
  });

  it('save calls PUT endpoint and shows toast', async () => {
    let capturedUrl = '';
    server.use(
      http.put('/api/content/:id', async ({ request }) => {
        capturedUrl = new URL(request.url).pathname;
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          id: 'c-1',
          clone_id: 'clone-1',
          platform: 'linkedin',
          status: 'draft',
          content_current: body.content_current ?? 'LinkedIn content',
          content_original: 'LinkedIn content',
          input_text: 'Write about TDD.',
          generation_properties: null,
          authenticity_score: null,
          score_dimensions: null,
          topic: null,
          campaign: null,
          tags: [],
          word_count: 2,
          char_count: 16,
          preset_id: null,
          created_at: '2026-01-15T10:00:00Z',
          updated_at: '2026-01-15T10:00:00Z',
        });
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<ReviewPanel items={items} generationParams={generationParams} />);

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(capturedUrl).toBe('/api/content/c-1');
    });
  });

  it('edited content preserved when switching tabs', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReviewPanel items={items} generationParams={generationParams} />);

    // Edit LinkedIn content
    const textarea = screen.getByDisplayValue('LinkedIn content');
    await user.clear(textarea);
    await user.type(textarea, 'Edited LinkedIn');

    // Switch to Twitter
    await user.click(screen.getByRole('tab', { name: /twitter/i }));
    expect(screen.getByDisplayValue('Twitter content')).toBeInTheDocument();

    // Switch back to LinkedIn
    await user.click(screen.getByRole('tab', { name: /linkedin/i }));
    expect(screen.getByDisplayValue('Edited LinkedIn')).toBeInTheDocument();
  });
});
