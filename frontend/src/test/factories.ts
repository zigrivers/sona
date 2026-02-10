import type { CloneResponse, ContentResponse, SampleResponse } from '@/types/api';

let counter = 0;

const NOW = '2026-01-15T10:00:00Z';

export function buildClone(overrides: Partial<CloneResponse> = {}): CloneResponse {
  counter += 1;
  return {
    id: `clone-${counter}`,
    name: `Test Clone ${counter}`,
    description: null,
    tags: [],
    type: 'original',
    is_demo: false,
    is_hidden: false,
    avatar_path: null,
    confidence_score: 0,
    sample_count: 0,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

export function buildContent(overrides: Partial<ContentResponse> = {}): ContentResponse {
  counter += 1;
  return {
    id: `content-${counter}`,
    clone_id: 'clone-1',
    platform: 'linkedin',
    status: 'draft',
    content_current: 'Generated content text.',
    content_original: 'Generated content text.',
    input_text: 'Write about testing.',
    generation_properties: null,
    authenticity_score: null,
    score_dimensions: null,
    topic: null,
    campaign: null,
    tags: [],
    word_count: 3,
    char_count: 24,
    preset_id: null,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

export function buildSample(overrides: Partial<SampleResponse> = {}): SampleResponse {
  counter += 1;
  return {
    id: `sample-${counter}`,
    clone_id: 'clone-1',
    content: 'Sample writing text for voice analysis.',
    content_type: 'blog_post',
    content_type_detected: null,
    word_count: 6,
    length_category: null,
    source_type: 'paste',
    source_url: null,
    source_filename: null,
    created_at: NOW,
    ...overrides,
  };
}
