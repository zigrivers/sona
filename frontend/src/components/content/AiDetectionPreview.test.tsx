import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { DetectionResponse } from '@/types/api';

import { AiDetectionPreview } from './AiDetectionPreview';

const baseResult: DetectionResponse = {
  risk_level: 'medium',
  confidence: 72,
  flagged_passages: [
    {
      text: 'Furthermore, it is important to note',
      reason: 'Generic transitional phrase common in AI output',
      suggestion: 'Replace with a more natural transition',
    },
    {
      text: 'In conclusion',
      reason: 'Cliché closer frequently used by AI',
      suggestion: 'End with a specific call to action',
    },
  ],
  summary: 'Some AI-like patterns detected in the content.',
};

describe('AiDetectionPreview', () => {
  it('shows risk level badge', () => {
    render(<AiDetectionPreview result={baseResult} />);
    expect(screen.getByText(/medium/i)).toBeInTheDocument();
  });

  it('shows confidence score', () => {
    render(<AiDetectionPreview result={baseResult} />);
    expect(screen.getByText(/72/)).toBeInTheDocument();
  });

  it('shows summary text', () => {
    render(<AiDetectionPreview result={baseResult} />);
    expect(screen.getByText('Some AI-like patterns detected in the content.')).toBeInTheDocument();
  });

  it('shows flagged passages with text, reason, and suggestion', () => {
    render(<AiDetectionPreview result={baseResult} />);
    expect(screen.getByText('Furthermore, it is important to note')).toBeInTheDocument();
    expect(screen.getByText('Generic transitional phrase common in AI output')).toBeInTheDocument();
    expect(screen.getByText('Replace with a more natural transition')).toBeInTheDocument();
    expect(screen.getByText('In conclusion')).toBeInTheDocument();
  });

  it('shows disclaimer text', () => {
    render(<AiDetectionPreview result={baseResult} />);
    expect(screen.getByText(/probabilistic/i)).toBeInTheDocument();
  });

  it('shows green badge for low risk', () => {
    const { container } = render(
      <AiDetectionPreview result={{ ...baseResult, risk_level: 'low' }} />
    );
    expect(container.querySelector('.bg-green-100')).toBeInTheDocument();
  });

  it('shows yellow badge for medium risk', () => {
    const { container } = render(
      <AiDetectionPreview result={{ ...baseResult, risk_level: 'medium' }} />
    );
    expect(container.querySelector('.bg-yellow-100')).toBeInTheDocument();
  });

  it('shows red badge for high risk', () => {
    const { container } = render(
      <AiDetectionPreview result={{ ...baseResult, risk_level: 'high' }} />
    );
    expect(container.querySelector('.bg-red-100')).toBeInTheDocument();
  });

  it('shows empty state when no passages flagged', () => {
    render(<AiDetectionPreview result={{ ...baseResult, flagged_passages: [] }} />);
    expect(screen.getByText(/no flagged passages/i)).toBeInTheDocument();
  });
});
