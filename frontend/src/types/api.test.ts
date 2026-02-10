import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import {
  AuthenticityScoreResponseSchema,
  CloneListResponseSchema,
  CloneResponseSchema,
  ContentListResponseSchema,
  ContentResponseSchema,
  DNAResponseSchema,
  DNAVersionListResponseSchema,
  MethodologyResponseSchema,
  PresetResponseSchema,
  ProviderResponseSchema,
  ProviderTestResponseSchema,
  SampleResponseSchema,
} from './api';

const NOW = '2026-01-15T10:00:00.000Z';

describe('CloneResponseSchema', () => {
  const validClone = {
    id: 'abc123',
    name: 'Test Clone',
    description: 'A test clone',
    tags: ['formal', 'blog'],
    type: 'original',
    is_demo: false,
    is_hidden: false,
    avatar_path: null,
    confidence_score: 85,
    sample_count: 5,
    created_at: NOW,
    updated_at: NOW,
    deleted_at: null,
  };

  it('parses valid clone data', () => {
    const result = CloneResponseSchema.parse(validClone);
    expect(result.id).toBe('abc123');
    expect(result.name).toBe('Test Clone');
    expect(result.tags).toEqual(['formal', 'blog']);
    expect(result.type).toBe('original');
    expect(result.is_demo).toBe(false);
    expect(result.confidence_score).toBe(85);
    expect(result.sample_count).toBe(5);
  });

  it('rejects missing id', () => {
    const { id: _, ...noId } = validClone;
    expect(() => CloneResponseSchema.parse(noId)).toThrow(ZodError);
  });

  it('rejects missing name', () => {
    const { name: _, ...noName } = validClone;
    expect(() => CloneResponseSchema.parse(noName)).toThrow(ZodError);
  });

  it('allows null description', () => {
    const result = CloneResponseSchema.parse({ ...validClone, description: null });
    expect(result.description).toBeNull();
  });

  it('allows null avatar_path', () => {
    const result = CloneResponseSchema.parse({ ...validClone, avatar_path: null });
    expect(result.avatar_path).toBeNull();
  });
});

describe('CloneListResponseSchema', () => {
  it('parses list with items and total', () => {
    const data = {
      items: [
        {
          id: 'a',
          name: 'Clone A',
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
          deleted_at: null,
        },
      ],
      total: 1,
    };
    const result = CloneListResponseSchema.parse(data);
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });
});

describe('ContentResponseSchema', () => {
  const validContent = {
    id: 'cnt-1',
    clone_id: 'abc123',
    platform: 'linkedin',
    status: 'draft',
    content_current: 'Hello world',
    content_original: 'Hello world',
    input_text: 'Write a post',
    generation_properties: { length: 'medium' },
    authenticity_score: 92,
    score_dimensions: { vocabulary: 90 },
    topic: 'AI',
    campaign: null,
    tags: ['tech'],
    word_count: 2,
    char_count: 11,
    preset_id: null,
    created_at: NOW,
    updated_at: NOW,
  };

  it('parses valid content data', () => {
    const result = ContentResponseSchema.parse(validContent);
    expect(result.id).toBe('cnt-1');
    expect(result.clone_id).toBe('abc123');
    expect(result.platform).toBe('linkedin');
    expect(result.status).toBe('draft');
    expect(result.word_count).toBe(2);
    expect(result.char_count).toBe(11);
  });

  it('allows null optional fields', () => {
    const result = ContentResponseSchema.parse({
      ...validContent,
      generation_properties: null,
      authenticity_score: null,
      score_dimensions: null,
      topic: null,
      campaign: null,
      preset_id: null,
    });
    expect(result.generation_properties).toBeNull();
    expect(result.authenticity_score).toBeNull();
  });

  it('rejects missing clone_id', () => {
    const { clone_id: _, ...noCloneId } = validContent;
    expect(() => ContentResponseSchema.parse(noCloneId)).toThrow(ZodError);
  });
});

describe('ContentListResponseSchema', () => {
  it('parses empty list', () => {
    const result = ContentListResponseSchema.parse({ items: [], total: 0 });
    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});

describe('SampleResponseSchema', () => {
  it('parses valid sample data', () => {
    const sample = {
      id: 's-1',
      clone_id: 'abc123',
      content: 'Sample writing content here.',
      content_type: 'blog_post',
      content_type_detected: 'blog',
      word_count: 4,
      length_category: 'short',
      source_type: 'paste',
      source_url: null,
      source_filename: null,
      created_at: NOW,
    };
    const result = SampleResponseSchema.parse(sample);
    expect(result.id).toBe('s-1');
    expect(result.content_type).toBe('blog_post');
    expect(result.word_count).toBe(4);
  });
});

describe('DNAResponseSchema', () => {
  it('parses valid DNA response', () => {
    const dna = {
      id: 'd-1',
      clone_id: 'abc123',
      version_number: 1,
      data: { vocabulary: { complexity: 'high' } },
      prominence_scores: { vocabulary: 85 },
      trigger: 'analysis',
      model_used: 'gpt-4o',
      created_at: NOW,
    };
    const result = DNAResponseSchema.parse(dna);
    expect(result.version_number).toBe(1);
    expect(result.data).toEqual({ vocabulary: { complexity: 'high' } });
    expect(result.prominence_scores).toEqual({ vocabulary: 85 });
  });

  it('allows null prominence_scores', () => {
    const dna = {
      id: 'd-1',
      clone_id: 'abc123',
      version_number: 1,
      data: {},
      prominence_scores: null,
      trigger: 'analysis',
      model_used: 'gpt-4o',
      created_at: NOW,
    };
    const result = DNAResponseSchema.parse(dna);
    expect(result.prominence_scores).toBeNull();
  });
});

describe('DNAVersionListResponseSchema', () => {
  it('parses list of DNA versions', () => {
    const data = {
      items: [
        {
          id: 'd-1',
          clone_id: 'abc123',
          version_number: 1,
          data: {},
          prominence_scores: null,
          trigger: 'analysis',
          model_used: 'gpt-4o',
          created_at: NOW,
        },
      ],
    };
    const result = DNAVersionListResponseSchema.parse(data);
    expect(result.items).toHaveLength(1);
  });
});

describe('MethodologyResponseSchema', () => {
  it('parses valid methodology', () => {
    const data = {
      id: 'm-1',
      section_key: 'voice_cloning_instructions',
      current_content: 'Analyze samples...',
      created_at: NOW,
      updated_at: NOW,
    };
    const result = MethodologyResponseSchema.parse(data);
    expect(result.section_key).toBe('voice_cloning_instructions');
  });
});

describe('PresetResponseSchema', () => {
  it('parses valid preset', () => {
    const data = {
      id: 'p-1',
      name: 'LinkedIn Formal',
      properties: { platform: 'linkedin', length: 'long' },
      created_at: NOW,
      updated_at: NOW,
    };
    const result = PresetResponseSchema.parse(data);
    expect(result.name).toBe('LinkedIn Formal');
    expect(result.properties).toEqual({ platform: 'linkedin', length: 'long' });
  });
});

describe('ProviderResponseSchema', () => {
  it('parses valid provider', () => {
    const data = {
      name: 'openai',
      is_configured: true,
      masked_key: 'sk-...abc',
      default_model: 'gpt-4o',
      available_models: ['gpt-4o', 'gpt-4o-mini'],
    };
    const result = ProviderResponseSchema.parse(data);
    expect(result.is_configured).toBe(true);
    expect(result.available_models).toHaveLength(2);
  });
});

describe('ProviderTestResponseSchema', () => {
  it('parses test response', () => {
    const data = { success: true, message: 'Connection successful' };
    const result = ProviderTestResponseSchema.parse(data);
    expect(result.success).toBe(true);
  });
});

describe('AuthenticityScoreResponseSchema', () => {
  it('parses score with dimensions', () => {
    const data = {
      overall_score: 88,
      dimensions: [
        { name: 'Vocabulary Match', score: 90, feedback: 'Great match' },
        { name: 'Tone Fidelity', score: 85, feedback: 'Good alignment' },
      ],
    };
    const result = AuthenticityScoreResponseSchema.parse(data);
    expect(result.overall_score).toBe(88);
    expect(result.dimensions).toHaveLength(2);
    expect(result.dimensions[0].name).toBe('Vocabulary Match');
  });
});
