import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { DesignSystemPage } from './DesignSystemPage';

function renderPage() {
  return render(
    <BrowserRouter>
      <DesignSystemPage />
    </BrowserRouter>
  );
}

describe('DesignSystemPage', () => {
  it('renders without crashing', () => {
    renderPage();
    expect(screen.getByText('Design System')).toBeInTheDocument();
  });

  it('renders all major sections', () => {
    renderPage();
    expect(screen.getByText('Color Palette')).toBeInTheDocument();
    expect(screen.getByText('Typography')).toBeInTheDocument();
    expect(screen.getByText('Buttons')).toBeInTheDocument();
    expect(screen.getByText('Form Controls')).toBeInTheDocument();
    expect(screen.getByText('Cards')).toBeInTheDocument();
    expect(screen.getByText('Badges')).toBeInTheDocument();
    expect(screen.getByText('Data Table')).toBeInTheDocument();
    expect(screen.getByText('Loading States')).toBeInTheDocument();
    expect(screen.getByText('Empty State')).toBeInTheDocument();
  });

  it('renders the theme toggle', () => {
    renderPage();
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });
});
