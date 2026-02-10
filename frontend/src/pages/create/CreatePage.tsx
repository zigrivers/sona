import { Sparkles } from 'lucide-react';
import { useState } from 'react';

import { ContentInput } from '@/components/content/ContentInput';
import { PropertiesForm } from '@/components/content/PropertiesForm';
import { VoiceSelector } from '@/components/content/VoiceSelector';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useGenerateContent } from '@/hooks/use-content';
import {
  DEFAULT_PROPERTIES,
  type GenerationProperties,
  useGeneratorStore,
} from '@/stores/generator-store';

export function CreatePage() {
  const { lastUsedCloneId, lastUsedProperties, setLastUsedCloneId, setLastUsedProperties } =
    useGeneratorStore();

  const [cloneId, setCloneId] = useState<string | null>(lastUsedCloneId);
  const [inputText, setInputText] = useState('');
  const [properties, setProperties] = useState<GenerationProperties>(
    lastUsedProperties ?? DEFAULT_PROPERTIES
  );

  const generateMutation = useGenerateContent();

  const canGenerate = cloneId && inputText.trim() && properties.platforms.length > 0;

  function getDisabledReason(): string | null {
    if (!cloneId) return 'Select a voice clone first';
    if (!inputText.trim()) return 'Enter content description';
    if (properties.platforms.length === 0) return 'Select at least one platform';
    return null;
  }

  function handleGenerate() {
    if (!canGenerate) return;

    setLastUsedCloneId(cloneId);
    setLastUsedProperties(properties);

    generateMutation.mutate({
      clone_id: cloneId,
      platforms: properties.platforms,
      input_text: inputText.trim(),
      properties: {
        length: properties.length,
        tone: properties.tone,
        humor: properties.humor,
        formality: properties.formality,
        target_audience: properties.targetAudience,
        cta_style: properties.ctaStyle,
        include_phrases: properties.includePhrases,
        exclude_phrases: properties.excludePhrases,
      },
    });
  }

  const disabledReason = getDisabledReason();

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold tracking-tight">Content Generator</h1>

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

      {/* Generate button */}
      <div className="flex justify-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <Button
                  onClick={handleGenerate}
                  disabled={!canGenerate || generateMutation.isPending}
                >
                  <Sparkles className="size-4" />
                  {generateMutation.isPending ? 'Generating...' : 'Generate'}
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
    </div>
  );
}
