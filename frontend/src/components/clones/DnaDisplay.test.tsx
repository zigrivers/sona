import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { buildDna } from '@/test/factories';
import { server } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';

import { DnaDisplay } from './DnaDisplay';

describe('DnaDisplay', () => {
  it('shows empty state when no DNA exists', async () => {
    renderWithProviders(<DnaDisplay cloneId="clone-1" />);

    await waitFor(() => {
      expect(screen.getByText('No Voice DNA Yet')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /analyze/i })).toBeInTheDocument();
  });

  it('renders 9 category sections when DNA exists', async () => {
    const dna = buildDna({ clone_id: 'clone-1' });
    server.use(http.get('/api/clones/:cloneId/dna', () => HttpResponse.json(dna)));

    renderWithProviders(<DnaDisplay cloneId="clone-1" />);

    await waitFor(() => {
      expect(screen.getByText('Vocabulary')).toBeInTheDocument();
    });

    expect(screen.getByText('Sentence Structure')).toBeInTheDocument();
    expect(screen.getByText('Paragraph Structure')).toBeInTheDocument();
    expect(screen.getByText('Tone')).toBeInTheDocument();
    expect(screen.getByText('Rhetorical Devices')).toBeInTheDocument();
    expect(screen.getByText('Punctuation')).toBeInTheDocument();
    expect(screen.getByText('Openings & Closings')).toBeInTheDocument();
    expect(screen.getByText('Humor')).toBeInTheDocument();
    expect(screen.getByText('Signatures')).toBeInTheDocument();
  });

  it('shows consistency score when DNA exists', async () => {
    const dna = buildDna({
      clone_id: 'clone-1',
      data: {
        ...buildDna().data,
        consistency_score: 85,
      },
    });
    server.use(http.get('/api/clones/:cloneId/dna', () => HttpResponse.json(dna)));

    renderWithProviders(<DnaDisplay cloneId="clone-1" />);

    await waitFor(() => {
      expect(screen.getByText(/Consistency: 85%/)).toBeInTheDocument();
    });
  });

  it('field click enables editing', async () => {
    const user = userEvent.setup();
    const dna = buildDna({ clone_id: 'clone-1' });
    server.use(http.get('/api/clones/:cloneId/dna', () => HttpResponse.json(dna)));

    renderWithProviders(<DnaDisplay cloneId="clone-1" />);

    await waitFor(() => {
      expect(screen.getByText('Vocabulary')).toBeInTheDocument();
    });

    // Expand the Vocabulary section
    await user.click(screen.getByText('Vocabulary'));

    await waitFor(() => {
      expect(screen.getByText('intermediate')).toBeInTheDocument();
    });

    await user.click(screen.getByText('intermediate'));
    expect(screen.getByDisplayValue('intermediate')).toBeInTheDocument();
  });

  it('save creates new version via PUT', async () => {
    const user = userEvent.setup();
    const dna = buildDna({ clone_id: 'clone-1' });
    let capturedBody: unknown = null;

    server.use(
      http.get('/api/clones/:cloneId/dna', () => HttpResponse.json(dna)),
      http.put('/api/clones/:cloneId/dna', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(
          buildDna({ clone_id: 'clone-1', trigger: 'manual_edit', version_number: 2 })
        );
      })
    );

    renderWithProviders(<DnaDisplay cloneId="clone-1" />);

    await waitFor(() => {
      expect(screen.getByText('Vocabulary')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Vocabulary'));

    await waitFor(() => {
      expect(screen.getByText('intermediate')).toBeInTheDocument();
    });

    await user.click(screen.getByText('intermediate'));
    const input = screen.getByDisplayValue('intermediate');
    await user.clear(input);
    await user.type(input, 'advanced');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(capturedBody).toEqual(
        expect.objectContaining({
          data: expect.objectContaining({
            vocabulary: expect.objectContaining({ complexity_level: 'advanced' }),
          }),
        })
      );
    });
  });

  it('shows version history section when DNA exists', async () => {
    const dna = buildDna({ clone_id: 'clone-1' });
    const versions = {
      items: [
        buildDna({ version_number: 2, trigger: 'manual_edit' }),
        buildDna({ version_number: 1, trigger: 'initial_analysis' }),
      ],
    };
    server.use(
      http.get('/api/clones/:cloneId/dna', () => HttpResponse.json(dna)),
      http.get('/api/clones/:cloneId/dna/versions', () => HttpResponse.json(versions))
    );

    renderWithProviders(<DnaDisplay cloneId="clone-1" />);

    expect(await screen.findByText('Version History')).toBeInTheDocument();
    expect((await screen.findAllByText('v2')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('v1').length).toBeGreaterThan(0);
  });

  it('analyze button triggers DNA generation', async () => {
    const user = userEvent.setup();
    let analyzeCalled = false;

    server.use(
      http.post('/api/clones/:cloneId/analyze', () => {
        analyzeCalled = true;
        return HttpResponse.json(buildDna({ clone_id: 'clone-1' }), { status: 201 });
      })
    );

    renderWithProviders(<DnaDisplay cloneId="clone-1" />);

    await waitFor(() => {
      expect(screen.getByText('No Voice DNA Yet')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /analyze/i }));

    await waitFor(() => {
      expect(analyzeCalled).toBe(true);
    });
  });
});
