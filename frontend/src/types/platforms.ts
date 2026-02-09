/**
 * Platform definitions matching backend constants.py exactly.
 */

export interface PlatformInfo {
  label: string;
  charLimit: number;
}

export const PLATFORMS = {
  twitter: { label: 'Twitter/X', charLimit: 280 },
  linkedin: { label: 'LinkedIn', charLimit: 3_000 },
  email: { label: 'Email', charLimit: 10_000 },
  blog: { label: 'Blog Post', charLimit: 50_000 },
  generic: { label: 'Generic', charLimit: 100_000 },
} as const satisfies Record<string, PlatformInfo>;

export type PlatformKey = keyof typeof PLATFORMS;
