/**
 * Zod schemas and inferred TypeScript types for all API entities.
 * Types are derived from schemas via z.infer<typeof Schema>.
 */

import { z } from 'zod';

// ── Clone ──────────────────────────────────────────────────────────

export const CloneResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  tags: z.array(z.string()),
  type: z.string(),
  is_demo: z.boolean(),
  is_hidden: z.boolean(),
  avatar_path: z.string().nullable(),
  confidence_score: z.number().int(),
  sample_count: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type CloneResponse = z.infer<typeof CloneResponseSchema>;

export const CloneListResponseSchema = z.object({
  items: z.array(CloneResponseSchema),
  total: z.number().int(),
});

export type CloneListResponse = z.infer<typeof CloneListResponseSchema>;

// ── Content ────────────────────────────────────────────────────────

export const ContentResponseSchema = z.object({
  id: z.string(),
  clone_id: z.string(),
  platform: z.string(),
  status: z.string(),
  content_current: z.string(),
  content_original: z.string(),
  input_text: z.string(),
  generation_properties: z.record(z.unknown()).nullable(),
  authenticity_score: z.number().int().nullable(),
  score_dimensions: z.record(z.unknown()).nullable(),
  topic: z.string().nullable(),
  campaign: z.string().nullable(),
  tags: z.array(z.string()),
  word_count: z.number().int(),
  char_count: z.number().int(),
  preset_id: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ContentResponse = z.infer<typeof ContentResponseSchema>;

export const ContentListResponseSchema = z.object({
  items: z.array(ContentResponseSchema),
  total: z.number().int(),
});

export type ContentListResponse = z.infer<typeof ContentListResponseSchema>;

// ── Sample ─────────────────────────────────────────────────────────

export const SampleResponseSchema = z.object({
  id: z.string(),
  clone_id: z.string(),
  content: z.string(),
  content_type: z.string(),
  content_type_detected: z.string().nullable(),
  word_count: z.number().int(),
  length_category: z.string().nullable(),
  source_type: z.string(),
  source_url: z.string().nullable(),
  source_filename: z.string().nullable(),
  created_at: z.string(),
});

export type SampleResponse = z.infer<typeof SampleResponseSchema>;

export const SampleListResponseSchema = z.object({
  items: z.array(SampleResponseSchema),
  total: z.number().int(),
});

export type SampleListResponse = z.infer<typeof SampleListResponseSchema>;

// ── DNA ────────────────────────────────────────────────────────────

export const DNAResponseSchema = z.object({
  id: z.string(),
  clone_id: z.string(),
  version_number: z.number().int(),
  data: z.record(z.unknown()),
  prominence_scores: z.record(z.unknown()).nullable(),
  trigger: z.string(),
  model_used: z.string(),
  created_at: z.string(),
});

export type DNAResponse = z.infer<typeof DNAResponseSchema>;

export const DNAVersionListResponseSchema = z.object({
  items: z.array(DNAResponseSchema),
});

export type DNAVersionListResponse = z.infer<typeof DNAVersionListResponseSchema>;

// ── Methodology ────────────────────────────────────────────────────

export const MethodologyResponseSchema = z.object({
  id: z.string(),
  section_key: z.string(),
  current_content: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type MethodologyResponse = z.infer<typeof MethodologyResponseSchema>;

export const MethodologyVersionResponseSchema = z.object({
  id: z.string(),
  settings_id: z.string(),
  version_number: z.number().int(),
  content: z.string(),
  trigger: z.string(),
  created_at: z.string(),
});

export type MethodologyVersionResponse = z.infer<typeof MethodologyVersionResponseSchema>;

// ── Preset ─────────────────────────────────────────────────────────

export const PresetResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  properties: z.record(z.unknown()),
  created_at: z.string(),
  updated_at: z.string(),
});

export type PresetResponse = z.infer<typeof PresetResponseSchema>;

// ── Provider ───────────────────────────────────────────────────────

export const ProviderResponseSchema = z.object({
  name: z.string(),
  is_configured: z.boolean(),
  masked_key: z.string().nullable(),
  default_model: z.string().nullable(),
  available_models: z.array(z.string()),
});

export type ProviderResponse = z.infer<typeof ProviderResponseSchema>;

export const ProviderTestResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type ProviderTestResponse = z.infer<typeof ProviderTestResponseSchema>;

// ── Data ──────────────────────────────────────────────────────────

export const DatabaseStatsResponseSchema = z.object({
  db_location: z.string(),
  db_size_bytes: z.number().int(),
  clone_count: z.number().int(),
  content_count: z.number().int(),
  sample_count: z.number().int(),
});

export type DatabaseStatsResponse = z.infer<typeof DatabaseStatsResponseSchema>;

// ── Content Version ────────────────────────────────────────────────

export const ContentVersionResponseSchema = z.object({
  id: z.string(),
  version_number: z.number().int(),
  content_text: z.string(),
  trigger: z.string(),
  word_count: z.number().int(),
  created_at: z.string(),
});

export type ContentVersionResponse = z.infer<typeof ContentVersionResponseSchema>;

export const ContentVersionListResponseSchema = z.object({
  items: z.array(ContentVersionResponseSchema),
});

export type ContentVersionListResponse = z.infer<typeof ContentVersionListResponseSchema>;

// ── Scoring ────────────────────────────────────────────────────────

export const DimensionScoreSchema = z.object({
  name: z.string(),
  score: z.number().int(),
  feedback: z.string(),
});

export type DimensionScore = z.infer<typeof DimensionScoreSchema>;

export const AuthenticityScoreResponseSchema = z.object({
  overall_score: z.number().int(),
  dimensions: z.array(DimensionScoreSchema),
});

export type AuthenticityScoreResponse = z.infer<typeof AuthenticityScoreResponseSchema>;

// ── Detection ─────────────────────────────────────────────────────

export const FlaggedPassageSchema = z.object({
  text: z.string(),
  reason: z.string(),
  suggestion: z.string(),
});

export type FlaggedPassage = z.infer<typeof FlaggedPassageSchema>;

export const DetectionResponseSchema = z.object({
  risk_level: z.string(),
  confidence: z.number().int(),
  flagged_passages: z.array(FlaggedPassageSchema),
  summary: z.string(),
});

export type DetectionResponse = z.infer<typeof DetectionResponseSchema>;
