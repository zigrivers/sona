/**
 * Voice DNA type definitions.
 *
 * The 9 DNA categories match the analysis framework described in the
 * Voice Cloning Instructions methodology section.
 */

import { z } from 'zod';

// ── Category keys ──────────────────────────────────────────────────

export const DNA_CATEGORIES = [
  'vocabulary',
  'sentence_structure',
  'paragraph_structure',
  'tone',
  'rhetorical_devices',
  'punctuation',
  'openings_and_closings',
  'humor',
  'signatures',
] as const;

export type DNACategory = (typeof DNA_CATEGORIES)[number];

// ── Per-category schemas ───────────────────────────────────────────

const VocabularySchema = z.object({
  complexity_level: z.string(),
  jargon_usage: z.string(),
  contraction_frequency: z.string(),
  word_choice_patterns: z.array(z.string()),
});

const SentenceStructureSchema = z.object({
  average_length: z.string(),
  complexity_variation: z.string(),
  fragment_usage: z.string(),
  patterns: z.array(z.string()),
});

const ParagraphStructureSchema = z.object({
  average_length: z.string(),
  transition_style: z.string(),
  organization: z.string(),
});

const ToneSchema = z.object({
  formality_level: z.string(),
  warmth: z.string(),
  primary_tone: z.string(),
  secondary_tone: z.string(),
});

const RhetoricalDevicesSchema = z.object({
  metaphor_usage: z.string(),
  repetition_patterns: z.string(),
  rhetorical_questions: z.string(),
  storytelling_tendency: z.string(),
});

const PunctuationSchema = z.object({
  em_dash_frequency: z.string(),
  semicolon_usage: z.string(),
  exclamation_points: z.string(),
  parenthetical_asides: z.string(),
  ellipsis_usage: z.string(),
});

const OpeningsAndClosingsSchema = z.object({
  opening_patterns: z.array(z.string()),
  hook_style: z.string(),
  closing_patterns: z.array(z.string()),
  cta_style: z.string(),
});

const HumorSchema = z.object({
  frequency: z.string(),
  types: z.array(z.string()),
  placement: z.string(),
});

const SignaturesSchema = z.object({
  catchphrases: z.array(z.string()),
  recurring_themes: z.array(z.string()),
  unique_mannerisms: z.array(z.string()),
});

// ── Full Voice DNA schema ──────────────────────────────────────────

export const VoiceDNASchema = z.object({
  vocabulary: VocabularySchema,
  sentence_structure: SentenceStructureSchema,
  paragraph_structure: ParagraphStructureSchema,
  tone: ToneSchema,
  rhetorical_devices: RhetoricalDevicesSchema,
  punctuation: PunctuationSchema,
  openings_and_closings: OpeningsAndClosingsSchema,
  humor: HumorSchema,
  signatures: SignaturesSchema,
});

export type VoiceDNA = z.infer<typeof VoiceDNASchema>;

// ── Per-category inferred types ────────────────────────────────────

export type Vocabulary = z.infer<typeof VocabularySchema>;
export type SentenceStructure = z.infer<typeof SentenceStructureSchema>;
export type ParagraphStructure = z.infer<typeof ParagraphStructureSchema>;
export type Tone = z.infer<typeof ToneSchema>;
export type RhetoricalDevices = z.infer<typeof RhetoricalDevicesSchema>;
export type Punctuation = z.infer<typeof PunctuationSchema>;
export type OpeningsAndClosings = z.infer<typeof OpeningsAndClosingsSchema>;
export type Humor = z.infer<typeof HumorSchema>;
export type Signatures = z.infer<typeof SignaturesSchema>;

// ── Prominence scores ──────────────────────────────────────────────

export type ProminenceScores = Partial<Record<DNACategory, number>>;
