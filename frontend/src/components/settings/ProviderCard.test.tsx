import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { buildProvider } from '@/test/factories';
import { server } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';

import { ProviderCard } from './ProviderCard';

describe('ProviderCard', () => {
  it('renders provider name and Not Configured badge when unconfigured', () => {
    const provider = buildProvider({ name: 'openai', is_configured: false });
    renderWithProviders(
      <ProviderCard provider={provider} isDefault={false} onSetDefault={vi.fn()} />
    );

    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('Not Configured')).toBeInTheDocument();
  });

  it('renders Configured badge and masked key when configured', () => {
    const provider = buildProvider({
      name: 'anthropic',
      is_configured: true,
      masked_key: '****1234',
      default_model: 'claude-sonnet-4-5-20250929',
      available_models: ['claude-sonnet-4-5-20250929'],
    });
    renderWithProviders(
      <ProviderCard provider={provider} isDefault={false} onSetDefault={vi.fn()} />
    );

    expect(screen.getByText('Anthropic')).toBeInTheDocument();
    expect(screen.getByText('Configured')).toBeInTheDocument();
    expect(screen.getByText('****1234')).toBeInTheDocument();
  });

  it('shows validation error when saving with empty API key', async () => {
    const user = userEvent.setup();
    const provider = buildProvider({ name: 'openai', is_configured: false });
    renderWithProviders(
      <ProviderCard provider={provider} isDefault={false} onSetDefault={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/api key is required/i)).toBeInTheDocument();
    });
  });

  it('calls save mutation when form is submitted with a valid key', async () => {
    const user = userEvent.setup();
    const provider = buildProvider({ name: 'openai', is_configured: false });

    let capturedBody: unknown = null;
    server.use(
      http.put('/api/providers/openai', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({
          name: 'openai',
          is_configured: true,
          masked_key: '****9999',
          default_model: 'gpt-4o',
          available_models: ['gpt-4o', 'gpt-4o-mini'],
        });
      })
    );

    renderWithProviders(
      <ProviderCard provider={provider} isDefault={false} onSetDefault={vi.fn()} />
    );

    await user.type(screen.getByLabelText(/api key/i), 'sk-new-key-9999');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(capturedBody).toEqual(expect.objectContaining({ api_key: 'sk-new-key-9999' }));
    });
  });

  it('shows loading state during connection test', async () => {
    const user = userEvent.setup();
    const provider = buildProvider({
      name: 'openai',
      is_configured: true,
      masked_key: '****1234',
    });

    server.use(
      http.post('/api/providers/openai/test', async () => {
        await new Promise((r) => setTimeout(r, 200));
        return HttpResponse.json({ success: true, message: 'Connection successful' });
      })
    );

    renderWithProviders(
      <ProviderCard provider={provider} isDefault={false} onSetDefault={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: /test connection/i }));

    expect(screen.getByRole('button', { name: /testing/i })).toBeDisabled();
  });

  it('shows success message after successful connection test', async () => {
    const user = userEvent.setup();
    const provider = buildProvider({
      name: 'openai',
      is_configured: true,
      masked_key: '****1234',
    });

    renderWithProviders(
      <ProviderCard provider={provider} isDefault={false} onSetDefault={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: /test connection/i }));

    await waitFor(() => {
      expect(screen.getByText(/connection successful/i)).toBeInTheDocument();
    });
  });

  it('shows error message after failed connection test', async () => {
    const user = userEvent.setup();
    const provider = buildProvider({
      name: 'openai',
      is_configured: true,
      masked_key: '****1234',
    });

    server.use(
      http.post('/api/providers/openai/test', () => {
        return HttpResponse.json({ success: false, message: 'Invalid API key' });
      })
    );

    renderWithProviders(
      <ProviderCard provider={provider} isDefault={false} onSetDefault={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: /test connection/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid api key/i)).toBeInTheDocument();
    });
  });

  it('calls onSetDefault when default radio is clicked', async () => {
    const user = userEvent.setup();
    const onSetDefault = vi.fn();
    const provider = buildProvider({
      name: 'openai',
      is_configured: true,
      masked_key: '****1234',
    });

    renderWithProviders(
      <ProviderCard provider={provider} isDefault={false} onSetDefault={onSetDefault} />
    );

    await user.click(screen.getByRole('radio', { name: /default/i }));

    expect(onSetDefault).toHaveBeenCalledWith('openai');
  });

  it('disables default radio when not configured', () => {
    const provider = buildProvider({ name: 'openai', is_configured: false });
    renderWithProviders(
      <ProviderCard provider={provider} isDefault={false} onSetDefault={vi.fn()} />
    );

    expect(screen.getByRole('radio', { name: /default/i })).toBeDisabled();
  });
});
