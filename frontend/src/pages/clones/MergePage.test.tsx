import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { buildClone, buildDna } from '@/test/factories';
import { server } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';

import { MergePage } from './MergePage';

function mockClonesWithDna() {
  server.use(
    http.get('/api/clones', () =>
      HttpResponse.json({
        items: [
          buildClone({ id: 'c1', name: 'Writer A', confidence_score: 85 }),
          buildClone({ id: 'c2', name: 'Writer B', confidence_score: 72 }),
          buildClone({ id: 'c3', name: 'No DNA Clone', confidence_score: 0 }),
        ],
        total: 3,
      })
    ),
    http.get('/api/clones/c1/dna', () => HttpResponse.json(buildDna({ clone_id: 'c1' }))),
    http.get('/api/clones/c2/dna', () => HttpResponse.json(buildDna({ clone_id: 'c2' }))),
    http.get('/api/clones/c3/dna', () =>
      HttpResponse.json({ detail: 'Not found' }, { status: 404 })
    )
  );
}

describe('MergePage', () => {
  it('source selector shows clones with DNA', async () => {
    const user = userEvent.setup();
    mockClonesWithDna();
    renderWithProviders(<MergePage />);

    await user.click(screen.getByRole('button', { name: /select source clones/i }));

    await waitFor(() => {
      expect(screen.getByText('Writer A')).toBeInTheDocument();
    });
    expect(screen.getByText('Writer B')).toBeInTheDocument();
  });

  it('clones without DNA are disabled', async () => {
    const user = userEvent.setup();
    mockClonesWithDna();
    renderWithProviders(<MergePage />);

    await user.click(screen.getByRole('button', { name: /select source clones/i }));

    await waitFor(() => {
      expect(screen.getByText('No DNA Clone')).toBeInTheDocument();
    });
    const noDnaRow = screen
      .getByText('No DNA Clone')
      .closest('[data-slot="clone-row"]') as HTMLElement;
    expect(within(noDnaRow).getByText('No DNA')).toBeInTheDocument();
  });

  it('weight sliders for 9 elements', async () => {
    const user = userEvent.setup();
    mockClonesWithDna();
    renderWithProviders(<MergePage />);

    // Open selector and pick two clones
    await user.click(screen.getByRole('button', { name: /select source clones/i }));
    await waitFor(() => {
      expect(screen.getByText('Writer A')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Writer A'));
    await user.click(screen.getByText('Writer B'));

    // All 9 DNA category labels should appear
    const categoryLabels = [
      'Vocabulary',
      'Sentence Structure',
      'Paragraph Structure',
      'Tone',
      'Rhetorical Devices',
      'Punctuation',
      'Openings & Closings',
      'Humor',
      'Signatures',
    ];
    for (const label of categoryLabels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('weights show relative display', async () => {
    const user = userEvent.setup();
    mockClonesWithDna();
    renderWithProviders(<MergePage />);

    // Select two clones
    await user.click(screen.getByRole('button', { name: /select source clones/i }));
    await waitFor(() => {
      expect(screen.getByText('Writer A')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Writer A'));
    await user.click(screen.getByText('Writer B'));

    // Default weights are 50/50 → each should show 50%
    const percentages = screen.getAllByText('50%');
    expect(percentages.length).toBeGreaterThanOrEqual(2);
  });

  it('merge disabled under 2 clones', async () => {
    mockClonesWithDna();
    renderWithProviders(<MergePage />);

    // With 0 clones selected, merge button should be disabled
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /merge/i })).toBeDisabled();
    });
  });

  it('merge submits with weights', async () => {
    const user = userEvent.setup();
    mockClonesWithDna();
    let capturedBody: unknown = null;

    server.use(
      http.post('/api/clones/merge', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(
          buildClone({ id: 'merged-1', name: 'Merged Voice', type: 'merged' }),
          { status: 201 }
        );
      })
    );

    renderWithProviders(<MergePage />);

    // Select two clones
    await user.click(screen.getByRole('button', { name: /select source clones/i }));
    await waitFor(() => {
      expect(screen.getByText('Writer A')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Writer A'));
    await user.click(screen.getByText('Writer B'));

    // Close popover by clicking trigger again
    await user.click(screen.getByRole('button', { name: /2 clones selected/i }));

    // Enter name
    const nameInput = screen.getByPlaceholderText(/merged clone name/i);
    await user.type(nameInput, 'Merged Voice');

    // Submit
    await user.click(screen.getByRole('button', { name: /merge/i }));

    await waitFor(() => {
      expect(capturedBody).toEqual(
        expect.objectContaining({
          name: 'Merged Voice',
          source_clones: expect.arrayContaining([
            expect.objectContaining({ clone_id: 'c1' }),
            expect.objectContaining({ clone_id: 'c2' }),
          ]),
        })
      );
    });
  });
});
