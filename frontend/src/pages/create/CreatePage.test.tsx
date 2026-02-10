import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { buildClone } from '@/test/factories';
import { server } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';

import { CreatePage } from './CreatePage';

function mockClones() {
  server.use(
    http.get('/api/clones', () => {
      return HttpResponse.json({
        items: [
          buildClone({ id: 'c1', name: 'Marketing Voice', confidence_score: 85 }),
          buildClone({ id: 'c2', name: 'Technical Writer', confidence_score: 72 }),
        ],
        total: 2,
      });
    })
  );
}

async function setupReadyToGenerate() {
  // Reset store to avoid state leaking from previous tests
  const { useGeneratorStore } = await import('@/stores/generator-store');
  useGeneratorStore.setState({ lastUsedCloneId: null, lastUsedProperties: null });

  mockClones();
  const user = userEvent.setup();
  renderWithProviders(<CreatePage />);

  // Select clone
  const trigger = await screen.findByRole('button', { name: /select a voice/i });
  await user.click(trigger);
  await waitFor(() => {
    expect(screen.getByText('Marketing Voice')).toBeInTheDocument();
  });
  await user.click(screen.getByText('Marketing Voice'));

  // Type input
  const textarea = screen.getByPlaceholderText(/describe the content/i);
  await user.type(textarea, 'Write a post');

  // Select platform
  await user.click(screen.getByRole('checkbox', { name: /linkedin/i }));

  return user;
}

describe('CreatePage', () => {
  it('renders voice selector and input', async () => {
    mockClones();
    renderWithProviders(<CreatePage />);

    expect(screen.getByRole('button', { name: /select a voice/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/describe the content/i)).toBeInTheDocument();
    expect(screen.getByText('Generation Properties')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument();
  });

  it('properties form fields', async () => {
    mockClones();
    renderWithProviders(<CreatePage />);

    // Platform checkboxes
    expect(screen.getByRole('checkbox', { name: /twitter/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /linkedin/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /blog post/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /generic/i })).toBeInTheDocument();

    // Length radio
    expect(screen.getByRole('radio', { name: /short/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /medium/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /long/i })).toBeInTheDocument();

    // Sliders (Radix slider role may not be exposed in jsdom, query by aria-label)
    expect(screen.getByLabelText('Tone')).toBeInTheDocument();
    expect(screen.getByLabelText('Humor')).toBeInTheDocument();
    expect(screen.getByLabelText('Formality')).toBeInTheDocument();

    // Text inputs
    expect(screen.getByLabelText(/target audience/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cta style/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/include phrases/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/exclude phrases/i)).toBeInTheDocument();
  });

  it('generate disabled without clone', async () => {
    mockClones();
    const user = userEvent.setup();
    renderWithProviders(<CreatePage />);

    // Type some input
    const textarea = screen.getByPlaceholderText(/describe the content/i);
    await user.type(textarea, 'Write a post about TDD');

    // Select a platform
    await user.click(screen.getByRole('checkbox', { name: /linkedin/i }));

    // Button should be disabled — no clone selected
    const button = screen.getByRole('button', { name: /generate/i });
    expect(button).toBeDisabled();
  });

  it('generate disabled without input', async () => {
    mockClones();
    const user = userEvent.setup();
    renderWithProviders(<CreatePage />);

    // Select a clone
    const trigger = await screen.findByRole('button', { name: /select a voice/i });
    await user.click(trigger);
    await waitFor(() => {
      expect(screen.getByText('Marketing Voice')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Marketing Voice'));

    // Select a platform
    await user.click(screen.getByRole('checkbox', { name: /linkedin/i }));

    // Button should be disabled — no input text
    const button = screen.getByRole('button', { name: /generate/i });
    expect(button).toBeDisabled();
  });

  it('generate disabled without platform', async () => {
    mockClones();
    const user = userEvent.setup();
    renderWithProviders(<CreatePage />);

    // Select a clone
    const trigger = await screen.findByRole('button', { name: /select a voice/i });
    await user.click(trigger);
    await waitFor(() => {
      expect(screen.getByText('Marketing Voice')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Marketing Voice'));

    // Type some input
    const textarea = screen.getByPlaceholderText(/describe the content/i);
    await user.type(textarea, 'Write a post');

    // Button should be disabled — no platforms
    const button = screen.getByRole('button', { name: /generate/i });
    expect(button).toBeDisabled();
  });

  it('generate enabled when all requirements met', async () => {
    mockClones();
    const user = userEvent.setup();
    renderWithProviders(<CreatePage />);

    // Select a clone
    const trigger = await screen.findByRole('button', { name: /select a voice/i });
    await user.click(trigger);
    await waitFor(() => {
      expect(screen.getByText('Marketing Voice')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Marketing Voice'));

    // Type some input
    const textarea = screen.getByPlaceholderText(/describe the content/i);
    await user.type(textarea, 'Write a post');

    // Select a platform
    await user.click(screen.getByRole('checkbox', { name: /linkedin/i }));

    // Button should be enabled
    const button = screen.getByRole('button', { name: /generate/i });
    expect(button).not.toBeDisabled();
  });

  it('shows loading state during generation', async () => {
    mockClones();
    const user = userEvent.setup();
    renderWithProviders(<CreatePage />);

    // Select clone
    const trigger = await screen.findByRole('button', { name: /select a voice/i });
    await user.click(trigger);
    await waitFor(() => {
      expect(screen.getByText('Marketing Voice')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Marketing Voice'));

    // Type input
    const textarea = screen.getByPlaceholderText(/describe the content/i);
    await user.type(textarea, 'Write a post');

    // Select platform
    await user.click(screen.getByRole('checkbox', { name: /linkedin/i }));

    // Use a delayed handler to catch the loading state
    server.use(
      http.post('/api/content/generate', async () => {
        await new Promise((r) => setTimeout(r, 100));
        return HttpResponse.json(
          {
            items: [
              {
                id: 'content-linkedin',
                clone_id: 'c1',
                platform: 'linkedin',
                status: 'draft',
                content_current: 'Generated.',
                content_original: 'Generated.',
                input_text: 'Write a post',
                generation_properties: null,
                authenticity_score: null,
                score_dimensions: null,
                topic: null,
                campaign: null,
                tags: [],
                word_count: 1,
                char_count: 10,
                preset_id: null,
                created_at: '2026-01-15T10:00:00Z',
                updated_at: '2026-01-15T10:00:00Z',
              },
            ],
          },
          { status: 201 }
        );
      })
    );

    // Click generate
    await user.click(screen.getByRole('button', { name: /generate/i }));

    // Should show generating state
    await waitFor(() => {
      expect(screen.getByText(/generating content/i)).toBeInTheDocument();
    });
  });

  it('shows review panel after generation completes', async () => {
    mockClones();

    // Reset store so no clone is preselected
    const { useGeneratorStore } = await import('@/stores/generator-store');
    useGeneratorStore.setState({ lastUsedCloneId: null, lastUsedProperties: null });

    const user = userEvent.setup();
    renderWithProviders(<CreatePage />);

    // Select clone
    const trigger = await screen.findByRole('button', { name: /select a voice/i });
    await user.click(trigger);
    await waitFor(() => {
      expect(screen.getByText('Marketing Voice')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Marketing Voice'));

    // Type input
    const textarea = screen.getByPlaceholderText(/describe the content/i);
    await user.type(textarea, 'Write a post');

    // Select platforms
    await user.click(screen.getByRole('checkbox', { name: /linkedin/i }));
    await user.click(screen.getByRole('checkbox', { name: /twitter/i }));

    // Click generate
    await user.click(screen.getByRole('button', { name: /generate/i }));

    // Should show review panel with tabs
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /linkedin/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /twitter/i })).toBeInTheDocument();
    });
  });

  it('last used clone preselected', async () => {
    mockClones();

    // Set store state before render
    const { useGeneratorStore } = await import('@/stores/generator-store');
    useGeneratorStore.setState({ lastUsedCloneId: 'c1' });

    renderWithProviders(<CreatePage />);

    await waitFor(() => {
      expect(screen.getByText('Marketing Voice')).toBeInTheDocument();
    });
  });

  it('Cmd+Enter triggers generate', async () => {
    await setupReadyToGenerate();

    // Fire Cmd+Enter
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', metaKey: true, bubbles: true })
    );

    // Should show generating state
    await waitFor(() => {
      expect(screen.getByText(/generating content/i)).toBeInTheDocument();
    });
  });

  it('Cmd+Shift+Enter triggers generate', async () => {
    await setupReadyToGenerate();

    // Fire Cmd+Shift+Enter
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        metaKey: true,
        shiftKey: true,
        bubbles: true,
      })
    );

    // Should show generating state
    await waitFor(() => {
      expect(screen.getByText(/generating content/i)).toBeInTheDocument();
    });
  });

  it('generate button tooltip shows shortcut hint', async () => {
    mockClones();
    renderWithProviders(<CreatePage />);

    expect(screen.getByText(/generate/i)).toBeInTheDocument();
    // Tooltip content with shortcut hint is present in DOM
    expect(screen.getByText(/⌘↵/)).toBeInTheDocument();
  });
});
