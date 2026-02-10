import { type PlatformKey, PLATFORMS } from '@/types/platforms';

export type LimitStatus = 'ok' | 'warning' | 'over';

export function getLimitStatus(charCount: number, charLimit: number): LimitStatus {
  const ratio = charCount / charLimit;
  if (ratio > 1) return 'over';
  if (ratio >= 0.8) return 'warning';
  return 'ok';
}

export function getLimitColor(status: LimitStatus): string {
  switch (status) {
    case 'ok':
      return 'text-green-600';
    case 'warning':
      return 'text-yellow-600';
    case 'over':
      return 'text-red-600';
  }
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function splitIntoThread(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // If fits in a single tweet, no splitting needed
  if (trimmed.length <= 280) return [trimmed];

  // Split into sentences first
  const sentences = trimmed.match(/[^.!?]+[.!?]+\s*/g) ?? [trimmed];

  // First pass: estimate chunk count to determine prefix length
  const estimatedChunks = Math.ceil(trimmed.length / 250);
  const prefixLen = `${estimatedChunks}/${estimatedChunks} `.length;
  const maxContent = 280 - prefixLen;

  // Build chunks by accumulating sentences
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    const s = sentence.trimEnd();
    if (!current) {
      if (s.length <= maxContent) {
        current = s;
      } else {
        // Sentence too long — split by word boundary
        chunks.push(...splitByWords(s, maxContent));
      }
    } else if ((current + ' ' + s).length <= maxContent) {
      current += ' ' + s;
    } else {
      chunks.push(current);
      if (s.length <= maxContent) {
        current = s;
      } else {
        chunks.push(...splitByWords(s, maxContent));
        current = '';
      }
    }
  }
  if (current) chunks.push(current);

  // Add numbering prefix
  const total = chunks.length;
  return chunks.map((chunk, i) => `${i + 1}/${total} ${chunk}`);
}

function splitByWords(text: string, maxLen: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
    } else if ((current + ' ' + word).length <= maxLen) {
      current += ' ' + word;
    } else {
      chunks.push(current);
      current = word;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

const PLATFORM_HINTS: Record<PlatformKey, string[]> = {
  twitter: [
    `${PLATFORMS.twitter.charLimit} character limit per tweet`,
    'Use thread splitting for longer content',
    'Hashtags and mentions count toward the limit',
  ],
  linkedin: [
    `${PLATFORMS.linkedin.charLimit} character limit`,
    'First 2-3 lines visible before "See more"',
    'Use line breaks for readability',
  ],
  email: [
    `${PLATFORMS.email.charLimit} character limit`,
    'Include a clear subject line and CTA',
    'Keep paragraphs short for mobile readers',
  ],
  blog: [
    `${PLATFORMS.blog.charLimit} character limit`,
    'Use headings and subheadings for structure',
    'Include a compelling introduction',
  ],
  generic: [
    `${PLATFORMS.generic.charLimit} character limit`,
    'Adapt format to your target channel',
  ],
};

export function getPlatformHints(platform: PlatformKey): string[] {
  return PLATFORM_HINTS[platform];
}
