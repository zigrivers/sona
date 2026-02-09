import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import { DNA_CATEGORIES, type DNACategory,VoiceDNASchema } from './dna';

describe('DNA_CATEGORIES', () => {
  it('has all 9 categories', () => {
    expect(DNA_CATEGORIES).toHaveLength(9);
  });

  it('includes all expected category keys', () => {
    const expectedKeys: DNACategory[] = [
      'vocabulary',
      'sentence_structure',
      'paragraph_structure',
      'tone',
      'rhetorical_devices',
      'punctuation',
      'openings_and_closings',
      'humor',
      'signatures',
    ];
    expect(DNA_CATEGORIES).toEqual(expectedKeys);
  });
});

describe('VoiceDNASchema', () => {
  const fullDNA = {
    vocabulary: {
      complexity_level: 'advanced',
      jargon_usage: 'moderate',
      contraction_frequency: 'frequent',
      word_choice_patterns: ['precise', 'technical'],
    },
    sentence_structure: {
      average_length: 'medium',
      complexity_variation: 'high',
      fragment_usage: 'occasional',
      patterns: ['compound-complex', 'simple'],
    },
    paragraph_structure: {
      average_length: 'short',
      transition_style: 'smooth',
      organization: 'logical',
    },
    tone: {
      formality_level: 'semi-formal',
      warmth: 'moderate',
      primary_tone: 'authoritative',
      secondary_tone: 'encouraging',
    },
    rhetorical_devices: {
      metaphor_usage: 'frequent',
      repetition_patterns: 'anaphora',
      rhetorical_questions: 'occasional',
      storytelling_tendency: 'moderate',
    },
    punctuation: {
      em_dash_frequency: 'high',
      semicolon_usage: 'moderate',
      exclamation_points: 'rare',
      parenthetical_asides: 'frequent',
      ellipsis_usage: 'rare',
    },
    openings_and_closings: {
      opening_patterns: ['question', 'bold_statement'],
      hook_style: 'provocative',
      closing_patterns: ['call_to_action'],
      cta_style: 'soft',
    },
    humor: {
      frequency: 'moderate',
      types: ['dry_wit', 'sarcasm'],
      placement: 'throughout',
    },
    signatures: {
      catchphrases: ['at the end of the day'],
      recurring_themes: ['innovation', 'authenticity'],
      unique_mannerisms: ['starting with "Look,"'],
    },
  };

  it('parses full DNA structure', () => {
    const result = VoiceDNASchema.parse(fullDNA);
    expect(result.vocabulary.complexity_level).toBe('advanced');
    expect(result.sentence_structure.average_length).toBe('medium');
    expect(result.paragraph_structure.transition_style).toBe('smooth');
    expect(result.tone.primary_tone).toBe('authoritative');
    expect(result.rhetorical_devices.metaphor_usage).toBe('frequent');
    expect(result.punctuation.em_dash_frequency).toBe('high');
    expect(result.openings_and_closings.hook_style).toBe('provocative');
    expect(result.humor.frequency).toBe('moderate');
    expect(result.signatures.catchphrases).toContain('at the end of the day');
  });

  it('rejects missing required category', () => {
    const { vocabulary: _, ...incomplete } = fullDNA;
    expect(() => VoiceDNASchema.parse(incomplete)).toThrow(ZodError);
  });

  it('rejects non-object values', () => {
    expect(() => VoiceDNASchema.parse({ ...fullDNA, vocabulary: 'not an object' })).toThrow(
      ZodError,
    );
  });
});
