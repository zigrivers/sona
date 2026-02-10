import { GitCompare, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ContentInput } from '@/components/content/ContentInput';
import { GenerationProgress } from '@/components/content/GenerationProgress';
import { PropertiesForm } from '@/components/content/PropertiesForm';
import { ReviewPanel } from '@/components/content/ReviewPanel';
import { VariantComparison } from '@/components/content/VariantComparison';
import { VoiceSelector } from '@/components/content/VoiceSelector';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useGenerateContent, useGenerateVariants, useSaveVariant } from '@/hooks/use-content';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';
import {
  DEFAULT_PROPERTIES,
  type GenerationProperties,
  useGeneratorStore,
} from '@/stores/generator-store';
import type { ContentResponse, GenerateVariantsResponse, VariantItem } from '@/types/api';

export function CreatePage() {
  const {
    lastUsedCloneId,
    lastUsedProperties,
    repurposeText,
    setLastUsedCloneId,
    setLastUsedProperties,
    clearRepurpose,
  } = useGeneratorStore();

  const [cloneId, setCloneId] = useState<string | null>(lastUsedCloneId);
  const [inputText, setInputText] = useState(repurposeText ?? '');
  const [properties, setProperties] = useState<GenerationProperties>(
    repurposeText
      ? { ...(lastUsedProperties ?? DEFAULT_PROPERTIES), platforms: [] }
      : lastUsedProperties ?? DEFAULT_PROPERTIES
  );

  useEffect(() => {
    if (repurposeText) {
      clearRepurpose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [generatedItems, setGeneratedItems] = useState<ContentResponse[] | null>(null);
  const [variantResult, setVariantResult] = useState<GenerateVariantsResponse | null>(null);

  const generateMutation = useGenerateContent();
  const variantMutation = useGenerateVariants();
  const saveVariantMutation = useSaveVariant();

  const canGenerate = cloneId && inputText.trim() && properties.platforms.length > 0;
  const canGenerateVariants = canGenerate && properties.platforms.length === 1;

  function getDisabledReason(): string | null {
    if (!cloneId) return 'Select a voice clone first';
    if (!inputText.trim()) return 'Enter content description';
    if (properties.platforms.length === 0) return 'Select at least one platform';
    return null;
  }

  function getVariantDisabledReason(): string | null {
    const base = getDisabledReason();
    if (base) return base;
    if (properties.platforms.length > 1) return 'Select a single platform for variants';
    return null;
  }

  function buildProperties() {
    return {
      length: properties.length,
      tone: properties.tone,
      humor: properties.humor,
      formality: properties.formality,
      target_audience: properties.targetAudience,
      cta_style: properties.ctaStyle,
      include_phrases: properties.includePhrases,
      exclude_phrases: properties.excludePhrases,
    };
  }

  function handleGenerate() {
    if (!canGenerate) return;

    setLastUsedCloneId(cloneId);
    setLastUsedProperties(properties);

    generateMutation.mutate(
      {
        clone_id: cloneId,
        platforms: properties.platforms,
        input_text: inputText.trim(),
        properties: buildProperties(),
      },
      {
        onSuccess: (data) => {
          setGeneratedItems(data.items);
        },
      }
    );
  }

  useKeyboardShortcut('Enter', { meta: true }, handleGenerate);
  useKeyboardShortcut('Enter', { meta: true, shift: true }, handleGenerate);

  function handleGenerateVariants() {
    if (!canGenerateVariants) return;

    setLastUsedCloneId(cloneId);
    setLastUsedProperties(properties);

    variantMutation.mutate(
      {
        clone_id: cloneId,
        platform: properties.platforms[0],
        input_text: inputText.trim(),
        properties: buildProperties(),
      },
      {
        onSuccess: (data) => {
          setVariantResult(data);
        },
      }
    );
  }

  function handleSelectVariant(variant: VariantItem) {
    if (!cloneId) return;

    saveVariantMutation.mutate(
      {
        clone_id: cloneId,
        platform: variantResult!.platform,
        input_text: inputText.trim(),
        content_text: variant.content_text,
        properties: buildProperties(),
      },
      {
        onSuccess: (data) => {
          setVariantResult(null);
          setGeneratedItems([data]);
        },
      }
    );
  }

  function handleDismissVariants() {
    setVariantResult(null);
    variantMutation.reset();
  }

  function handleNewGeneration() {
    setGeneratedItems(null);
    setVariantResult(null);
    generateMutation.reset();
    variantMutation.reset();
  }

  const isPending = generateMutation.isPending || variantMutation.isPending;
  const disabledReason = getDisabledReason();
  const variantDisabledReason = getVariantDisabledReason();

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold tracking-tight">Content Generator</h1>

      {/* Generation progress */}
      {isPending && <GenerationProgress platforms={properties.platforms} />}

      {/* Variant comparison */}
      {variantResult && !isPending && (
        <>
          <VariantComparison
            variants={variantResult.variants}
            onSelect={handleSelectVariant}
            onDismiss={handleDismissVariants}
          />
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleNewGeneration}>
              <Sparkles className="size-4" />
              New Generation
            </Button>
          </div>
        </>
      )}

      {/* Review panel */}
      {generatedItems && !isPending && !variantResult && cloneId && (
        <>
          <ReviewPanel
            items={generatedItems}
            generationParams={{
              clone_id: cloneId,
              input_text: inputText.trim(),
              properties: buildProperties(),
            }}
          />
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleNewGeneration}>
              <Sparkles className="size-4" />
              New Generation
            </Button>
          </div>
        </>
      )}

      {/* Generation form — hidden when reviewing */}
      {!generatedItems && !variantResult && !isPending && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left column: voice + input */}
            <div className="space-y-6">
              <VoiceSelector value={cloneId} onChange={setCloneId} />
              <ContentInput value={inputText} onChange={setInputText} />
            </div>

            {/* Right column: properties */}
            <div>
              <PropertiesForm value={properties} onChange={setProperties} />
            </div>
          </div>

          {/* Generate buttons */}
          <div className="flex justify-end gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button
                      variant="outline"
                      onClick={handleGenerateVariants}
                      disabled={!canGenerateVariants || isPending}
                    >
                      <GitCompare className="size-4" />
                      Generate Variants
                    </Button>
                  </span>
                </TooltipTrigger>
                {variantDisabledReason && (
                  <TooltipContent>
                    <p>{variantDisabledReason}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button onClick={handleGenerate} disabled={!canGenerate || isPending}>
                      <Sparkles className="size-4" />
                      Generate
                      <kbd className="ml-1.5 text-xs opacity-60">⌘↵</kbd>
                    </Button>
                  </span>
                </TooltipTrigger>
                {disabledReason && (
                  <TooltipContent>
                    <p>{disabledReason}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </>
      )}
    </div>
  );
}
