import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { buildClone } from '@/test/factories';
import { server } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';

import { VoiceSelector } from './VoiceSelector';

function mockClones() {
  server.use(
    http.get('/api/clones', () => {
      return HttpResponse.json({
        items: [
          buildClone({ id: 'c1', name: 'Marketing Voice', confidence_score: 85, is_hidden: false }),
          buildClone({
            id: 'c2',
            name: 'Technical Writer',
            confidence_score: 72,
            is_hidden: false,
          }),
          buildClone({ id: 'hidden', name: 'Hidden Clone', is_hidden: true }),
        ],
        total: 3,
      });
    })
  );
}

describe('VoiceSelector', () => {
  it('shows clones in dropdown', async () => {
    mockClones();
    const user = userEvent.setup();
    renderWithProviders(<VoiceSelector value={null} onChange={() => {}} />);

    const trigger = await screen.findByRole('button', { name: /select a voice/i });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Marketing Voice')).toBeInTheDocument();
      expect(screen.getByText('Technical Writer')).toBeInTheDocument();
    });
  });

  it('hides is_hidden clones', async () => {
    mockClones();
    const user = userEvent.setup();
    renderWithProviders(<VoiceSelector value={null} onChange={() => {}} />);

    const trigger = await screen.findByRole('button', { name: /select a voice/i });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Marketing Voice')).toBeInTheDocument();
    });
    expect(screen.queryByText('Hidden Clone')).not.toBeInTheDocument();
  });

  it('shows warning for low confidence clone', async () => {
    server.use(
      http.get('/api/clones', () => {
        return HttpResponse.json({
          items: [buildClone({ id: 'low', name: 'Low Confidence', confidence_score: 40 })],
          total: 1,
        });
      })
    );
    renderWithProviders(<VoiceSelector value="low" onChange={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Low Confidence')).toBeInTheDocument();
    });
    expect(screen.getByTestId('confidence-warning')).toBeInTheDocument();
  });

  it('calls onChange when a clone is selected', async () => {
    mockClones();
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<VoiceSelector value={null} onChange={onChange} />);

    const trigger = await screen.findByRole('button', { name: /select a voice/i });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Marketing Voice')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Marketing Voice'));
    expect(onChange).toHaveBeenCalledWith('c1');
  });

  it('filters clones by search', async () => {
    mockClones();
    const user = userEvent.setup();
    renderWithProviders(<VoiceSelector value={null} onChange={() => {}} />);

    const trigger = await screen.findByRole('button', { name: /select a voice/i });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Marketing Voice')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'Technical');

    expect(screen.getByText('Technical Writer')).toBeInTheDocument();
    expect(screen.queryByText('Marketing Voice')).not.toBeInTheDocument();
  });

  it('shows selected clone name and badge in trigger', async () => {
    mockClones();
    renderWithProviders(<VoiceSelector value="c1" onChange={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Marketing Voice')).toBeInTheDocument();
    });

    const trigger = screen.getByRole('button');
    expect(within(trigger).getByText('85%')).toBeInTheDocument();
  });
});
