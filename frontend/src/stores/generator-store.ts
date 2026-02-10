import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GenerationProperties {
  platforms: string[];
  length: 'short' | 'medium' | 'long';
  tone: number;
  humor: number;
  formality: number;
  targetAudience: string;
  ctaStyle: string;
  includePhrases: string;
  excludePhrases: string;
}

interface GeneratorState {
  lastUsedCloneId: string | null;
  lastUsedProperties: GenerationProperties | null;
  setLastUsedCloneId: (id: string | null) => void;
  setLastUsedProperties: (properties: GenerationProperties | null) => void;
}

export const DEFAULT_PROPERTIES: GenerationProperties = {
  platforms: [],
  length: 'medium',
  tone: 50,
  humor: 50,
  formality: 50,
  targetAudience: '',
  ctaStyle: '',
  includePhrases: '',
  excludePhrases: '',
};

export const useGeneratorStore = create<GeneratorState>()(
  persist(
    (set) => ({
      lastUsedCloneId: null,
      lastUsedProperties: null,
      setLastUsedCloneId: (id) => set({ lastUsedCloneId: id }),
      setLastUsedProperties: (properties) => set({ lastUsedProperties: properties }),
    }),
    { name: 'sona-generator' }
  )
);
