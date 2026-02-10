import { Loader2, Send } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useGenerateContent, useUpdateContent } from '@/hooks/use-content';
import type { ContentResponse } from '@/types/api';
import { type PlatformKey, PLATFORMS } from '@/types/platforms';

interface QuickGenerateProps {
  cloneId: string;
  cloneName: string;
}

const PLATFORM_KEYS = Object.keys(PLATFORMS) as PlatformKey[];

export function QuickGenerate({ cloneId, cloneName }: QuickGenerateProps) {
  const [inputText, setInputText] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [generatedItems, setGeneratedItems] = useState<ContentResponse[] | null>(null);

  const generateMutation = useGenerateContent();
  const updateMutation = useUpdateContent();

  function togglePlatform(platform: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  }

  function handleGenerate() {
    generateMutation.mutate(
      {
        clone_id: cloneId,
        platforms: selectedPlatforms,
        input_text: inputText,
      },
      {
        onSuccess: (data) => {
          setGeneratedItems(data.items);
        },
      }
    );
  }

  function handleSave(item: ContentResponse) {
    updateMutation.mutate({
      id: item.id,
      content_current: item.content_current,
      status: 'published',
    });
  }

  const canGenerate = inputText.trim().length > 0 && selectedPlatforms.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <h3 className="text-sm font-medium">Quick Generate for {cloneName}</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="What should we write about?"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={3}
        />

        <div className="flex flex-wrap gap-4">
          {PLATFORM_KEYS.map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selectedPlatforms.includes(key)}
                onCheckedChange={() => togglePlatform(key)}
              />
              {PLATFORMS[key].label}
            </label>
          ))}
        </div>

        <Button onClick={handleGenerate} disabled={!canGenerate || generateMutation.isPending}>
          {generateMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Generate
        </Button>

        {generatedItems && (
          <div className="space-y-3">
            {generatedItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="space-y-2 py-3">
                  <p className="text-muted-foreground text-xs font-medium">
                    {PLATFORMS[item.platform as PlatformKey]?.label ?? item.platform}
                  </p>
                  <p className="text-sm">{item.content_current}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSave(item)}
                      disabled={updateMutation.isPending}
                    >
                      Save to Library
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <Link
                        to={`/create?clone_id=${cloneId}&input_text=${encodeURIComponent(inputText)}`}
                      >
                        Open in Generator
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
