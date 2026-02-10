import type {
  CloneResponse,
  ContentResponse,
  DNAResponse,
  MethodologyResponse,
  MethodologyVersionResponse,
  ProviderResponse,
  SampleResponse,
} from '@/types/api';

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

export function buildProvider(overrides: Partial<ProviderResponse> = {}): ProviderResponse {
  return {
    name: 'openai',
    is_configured: false,
    masked_key: null,
    default_model: null,
    available_models: ['gpt-4o', 'gpt-4o-mini'],
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

export function buildMethodology(
  overrides: Partial<MethodologyResponse> = {}
): MethodologyResponse {
  counter += 1;
  return {
    id: `method-${counter}`,
    section_key: 'voice_cloning',
    current_content: 'Default methodology instructions.',
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

export function buildMethodologyVersion(
  overrides: Partial<MethodologyVersionResponse> = {}
): MethodologyVersionResponse {
  counter += 1;
  return {
    id: `method-ver-${counter}`,
    settings_id: 'method-1',
    version_number: 1,
    content: 'Version content.',
    trigger: 'manual_edit',
    created_at: NOW,
    ...overrides,
  };
}

export function buildDna(overrides: Partial<DNAResponse> = {}): DNAResponse {
  counter += 1;
  return {
    id: `dna-${counter}`,
    clone_id: 'clone-1',
    version_number: 1,
    data: {
      vocabulary: { complexity_level: 'intermediate', jargon_usage: 'moderate' },
      sentence_structure: { average_length: 'medium' },
      paragraph_structure: { average_length: 'medium' },
      tone: { formality_level: 'semi-formal', primary_tone: 'conversational' },
      rhetorical_devices: { metaphor_usage: 'occasional' },
      punctuation: { em_dash_frequency: 'moderate' },
      openings_and_closings: { hook_style: 'question' },
      humor: { frequency: 'occasional' },
      signatures: { catchphrases: ['Let me tell you', 'Here is the thing'] },
    },
    prominence_scores: {
      vocabulary: 0.8,
      tone: 0.9,
      humor: 0.5,
    },
    trigger: 'initial_analysis',
    model_used: 'gpt-4o',
    created_at: NOW,
    ...overrides,
  };
}
