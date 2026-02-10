import { useQueryClient } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from './render';

function QueryConsumer() {
  const queryClient = useQueryClient();
  return <div>{queryClient ? 'QueryClient available' : 'No QueryClient'}</div>;
}

describe('renderWithProviders', () => {
  it('should provide QueryClient', () => {
    renderWithProviders(<QueryConsumer />);
    expect(screen.getByText('QueryClient available')).toBeInTheDocument();
  });

  it('should provide MemoryRouter', () => {
    renderWithProviders(<div>Router test</div>);
    expect(screen.getByText('Router test')).toBeInTheDocument();
  });

  it('should return queryClient instance', () => {
    const { queryClient } = renderWithProviders(<div>Test</div>);
    expect(queryClient).toBeDefined();
  });
});
