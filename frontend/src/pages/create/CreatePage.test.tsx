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
});
