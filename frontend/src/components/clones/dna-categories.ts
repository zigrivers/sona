export interface DnaFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'array';
}

export interface DnaCategoryConfig {
  key: string;
  label: string;
  fields: DnaFieldConfig[];
}

export const DNA_CATEGORIES: DnaCategoryConfig[] = [
  {
    key: 'vocabulary',
    label: 'Vocabulary',
    fields: [
      { key: 'complexity_level', label: 'Complexity Level', type: 'text' },
      { key: 'jargon_usage', label: 'Jargon Usage', type: 'text' },
    ],
  },
  {
    key: 'sentence_structure',
    label: 'Sentence Structure',
    fields: [{ key: 'average_length', label: 'Average Length', type: 'text' }],
  },
  {
    key: 'paragraph_structure',
    label: 'Paragraph Structure',
    fields: [{ key: 'average_length', label: 'Average Length', type: 'text' }],
  },
  {
    key: 'tone',
    label: 'Tone',
    fields: [
      { key: 'formality_level', label: 'Formality Level', type: 'text' },
      { key: 'primary_tone', label: 'Primary Tone', type: 'text' },
    ],
  },
  {
    key: 'rhetorical_devices',
    label: 'Rhetorical Devices',
    fields: [{ key: 'metaphor_usage', label: 'Metaphor Usage', type: 'text' }],
  },
  {
    key: 'punctuation',
    label: 'Punctuation',
    fields: [{ key: 'em_dash_frequency', label: 'Em Dash Frequency', type: 'text' }],
  },
  {
    key: 'openings_and_closings',
    label: 'Openings & Closings',
    fields: [{ key: 'hook_style', label: 'Hook Style', type: 'text' }],
  },
  {
    key: 'humor',
    label: 'Humor',
    fields: [{ key: 'frequency', label: 'Frequency', type: 'text' }],
  },
  {
    key: 'signatures',
    label: 'Signatures',
    fields: [{ key: 'catchphrases', label: 'Catchphrases', type: 'array' }],
  },
];
