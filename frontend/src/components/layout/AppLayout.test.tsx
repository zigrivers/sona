import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { renderWithRouter } from '@/test/render';

import { AppLayout } from './AppLayout';

describe('AppLayout', () => {
  it('should render sidebar and main content area', () => {
    renderWithRouter(
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/test" element={<div>Test Content</div>} />
        </Route>
      </Routes>,
      { initialEntries: ['/test'] }
    );

    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
