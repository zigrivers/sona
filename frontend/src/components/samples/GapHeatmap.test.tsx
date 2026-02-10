import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { buildSample } from '@/test/factories';
import { server } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';

import { GapHeatmap } from './GapHeatmap';

const CLONE_ID = 'clone-1';

function renderHeatmap() {
  return renderWithProviders(<GapHeatmap cloneId={CLONE_ID} />);
}

describe('GapHeatmap', () => {
  it('renders grid with content type rows and length columns', async () => {
    renderHeatmap();

    await waitFor(() => {
      expect(screen.getByText('Sample Coverage')).toBeInTheDocument();
    });

    // Column headers
    expect(screen.getByText('Short')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Long')).toBeInTheDocument();

    // Row labels (content types)
    expect(screen.getByText('Tweet')).toBeInTheDocument();
    expect(screen.getByText('Thread')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn Post')).toBeInTheDocument();
    expect(screen.getByText('Blog Post')).toBeInTheDocument();
    expect(screen.getByText('Article')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Newsletter')).toBeInTheDocument();
    expect(screen.getByText('Essay')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('colors cells based on sample count', async () => {
    server.use(
      http.get('/api/clones/:cloneId/samples', () => {
        return HttpResponse.json({
          items: [
            buildSample({ content_type: 'tweet', length_category: 'short' }),
            buildSample({ content_type: 'tweet', length_category: 'short' }),
            buildSample({ content_type: 'blog_post', length_category: 'medium' }),
          ],
          total: 3,
        });
      })
    );

    renderHeatmap();

    // Wait for data to load and cells to update
    await waitFor(() => {
      expect(screen.getByTestId('cell-tweet-short')).toHaveClass('bg-success/20');
    });

    // 1 sample → warning styling
    expect(screen.getByTestId('cell-blog_post-medium')).toHaveClass('bg-warning/20');
    // 0 samples → muted styling
    expect(screen.getByTestId('cell-essay-long')).toHaveClass('bg-muted');
  });

  it('shows count in cells with samples', async () => {
    server.use(
      http.get('/api/clones/:cloneId/samples', () => {
        return HttpResponse.json({
          items: [
            buildSample({ content_type: 'tweet', length_category: 'short' }),
            buildSample({ content_type: 'tweet', length_category: 'short' }),
            buildSample({ content_type: 'tweet', length_category: 'short' }),
          ],
          total: 3,
        });
      })
    );

    renderHeatmap();

    await waitFor(() => {
      expect(screen.getByTestId('cell-tweet-short')).toHaveTextContent('3');
    });
  });

  it('empty cells show gap indicator', async () => {
    renderHeatmap();

    await waitFor(() => {
      expect(screen.getByTestId('cell-tweet-short')).toBeInTheDocument();
    });

    // All cells should show dash when no samples
    expect(screen.getByTestId('cell-tweet-short')).toHaveTextContent('—');
    expect(screen.getByTestId('cell-essay-long')).toHaveTextContent('—');
  });

  it('shows recommendations for gaps', async () => {
    server.use(
      http.get('/api/clones/:cloneId/samples', () => {
        return HttpResponse.json({
          items: [buildSample({ content_type: 'tweet', length_category: 'short' })],
          total: 1,
        });
      })
    );

    renderHeatmap();

    await waitFor(() => {
      expect(screen.getByText('Recommendations')).toBeInTheDocument();
    });

    // Should show up to 3 recommendation items
    const recommendations = screen.getAllByTestId('recommendation');
    expect(recommendations.length).toBeLessThanOrEqual(3);
    expect(recommendations.length).toBeGreaterThanOrEqual(1);
  });

  it('no recommendations when all covered', async () => {
    const allSamples = [
      'tweet',
      'thread',
      'linkedin_post',
      'blog_post',
      'article',
      'email',
      'newsletter',
      'essay',
      'other',
    ].flatMap((type) =>
      (['short', 'medium', 'long'] as const).map((len) =>
        buildSample({ content_type: type, length_category: len })
      )
    );

    server.use(
      http.get('/api/clones/:cloneId/samples', () => {
        return HttpResponse.json({
          items: allSamples,
          total: allSamples.length,
        });
      })
    );

    renderHeatmap();

    // Wait for data to load — cell should show count instead of dash
    await waitFor(() => {
      expect(screen.getByTestId('cell-tweet-short')).not.toHaveTextContent('—');
    });

    expect(screen.queryByText('Recommendations')).not.toBeInTheDocument();
  });

  it('handles empty samples array', async () => {
    renderHeatmap();

    await waitFor(() => {
      expect(screen.getByText('Sample Coverage')).toBeInTheDocument();
    });

    // All 27 cells should show gap indicator
    const cells = screen.getAllByText('—');
    expect(cells).toHaveLength(27);

    // Should show recommendations
    expect(screen.getByText('Recommendations')).toBeInTheDocument();
  });
});
