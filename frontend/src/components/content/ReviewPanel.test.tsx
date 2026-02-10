import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUIStore } from '@/stores/ui-store';
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
  beforeEach(() => {
    useUIStore.setState({ showInputPanel: false });
  });

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

  it('Check Authenticity triggers scoring and shows result', async () => {
    let capturedUrl = '';
    server.use(
      http.post('/api/content/:id/score', ({ request }) => {
        capturedUrl = new URL(request.url).pathname;
        return HttpResponse.json({
          overall_score: 82,
          dimensions: [
            { name: 'Vocabulary', score: 85, feedback: 'Great' },
            { name: 'Tone', score: 60, feedback: 'Needs work' },
          ],
        });
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<ReviewPanel items={items} generationParams={generationParams} />);

    await user.click(screen.getByRole('button', { name: /check authenticity/i }));

    await waitFor(() => {
      expect(capturedUrl).toBe('/api/content/c-1/score');
    });

    await waitFor(() => {
      expect(screen.getByText('82')).toBeInTheDocument();
    });
  });

  it('Check AI Detection triggers detection and shows result', async () => {
    let capturedUrl = '';
    server.use(
      http.post('/api/content/:id/detect', ({ request }) => {
        capturedUrl = new URL(request.url).pathname;
        return HttpResponse.json({
          risk_level: 'high',
          confidence: 88,
          flagged_passages: [
            {
              text: 'In conclusion',
              reason: 'Cliché closer',
              suggestion: 'End naturally',
            },
          ],
          summary: 'High AI likelihood.',
        });
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<ReviewPanel items={items} generationParams={generationParams} />);

    await user.click(screen.getByRole('button', { name: /check ai detection/i }));

    await waitFor(() => {
      expect(capturedUrl).toBe('/api/content/c-1/detect');
    });

    await waitFor(() => {
      expect(screen.getByText('High AI likelihood.')).toBeInTheDocument();
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

  it('toggle renders and defaults to off', () => {
    renderWithProviders(<ReviewPanel items={items} generationParams={generationParams} />);
    const toggle = screen.getByRole('switch', { name: /show input/i });
    expect(toggle).toBeInTheDocument();
    expect(toggle).not.toBeChecked();
  });

  it('clicking toggle shows original input text', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReviewPanel items={items} generationParams={generationParams} />);

    await user.click(screen.getByRole('switch', { name: /show input/i }));

    expect(screen.getByText('Original Input')).toBeInTheDocument();
    expect(screen.getByText('Write about testing.')).toBeInTheDocument();
  });

  it('auto-scores after debounce when text is edited', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let scorePreviewCallCount = 0;
    server.use(
      http.post('/api/content/score-preview', () => {
        scorePreviewCallCount += 1;
        return HttpResponse.json({
          overall_score: 90,
          dimensions: [
            { name: 'Vocabulary', score: 90, feedback: 'Excellent' },
            { name: 'Tone', score: 90, feedback: 'Great tone' },
          ],
        });
      })
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<ReviewPanel items={items} generationParams={generationParams} />);

    // Advance past initial debounce (initial text "LinkedIn content" fires)
    await vi.advanceTimersByTimeAsync(2500);
    await waitFor(() => {
      expect(scorePreviewCallCount).toBeGreaterThanOrEqual(1);
    });

    const countBefore = scorePreviewCallCount;

    // Edit text — should trigger a new score-preview after debounce
    const textarea = screen.getByDisplayValue('LinkedIn content');
    await user.clear(textarea);
    await user.type(textarea, 'Updated text');

    // Advance past debounce again
    await vi.advanceTimersByTimeAsync(2500);

    await waitFor(() => {
      expect(scorePreviewCallCount).toBeGreaterThan(countBefore);
    });

    vi.useRealTimers();
  });

  it('does not auto-score for empty text', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let scorePreviewCalled = false;
    server.use(
      http.post('/api/content/score-preview', () => {
        scorePreviewCalled = true;
        return HttpResponse.json({
          overall_score: 0,
          dimensions: [],
        });
      })
    );

    const emptyItems = [buildContent({ id: 'c-empty', platform: 'linkedin', content_current: '' })];

    renderWithProviders(<ReviewPanel items={emptyItems} generationParams={generationParams} />);

    await vi.advanceTimersByTimeAsync(2500);

    expect(scorePreviewCalled).toBe(false);

    vi.useRealTimers();
  });

  it('textarea remains editable in split view', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReviewPanel items={items} generationParams={generationParams} />);

    await user.click(screen.getByRole('switch', { name: /show input/i }));

    const textarea = screen.getByDisplayValue('LinkedIn content');
    expect(textarea).toBeInTheDocument();
    await user.clear(textarea);
    await user.type(textarea, 'Edited');
    expect(textarea).toHaveValue('Edited');
  });
});
