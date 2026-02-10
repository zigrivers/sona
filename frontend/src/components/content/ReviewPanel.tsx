import { useState } from 'react';
import { toast } from 'sonner';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRegenerateContent, useScoreContent, useUpdateContent } from '@/hooks/use-content';
import type { AuthenticityScoreResponse, ContentResponse } from '@/types/api';
import { type PlatformKey, PLATFORMS } from '@/types/platforms';

import { PlatformTab } from './PlatformTab';

interface ReviewPanelProps {
  items: ContentResponse[];
  generationParams: {
    clone_id: string;
    input_text: string;
    properties?: Record<string, unknown>;
  };
}

export function ReviewPanel({ items, generationParams }: ReviewPanelProps) {
  const [localItems, setLocalItems] = useState<ContentResponse[]>(items);
  const [editedContent, setEditedContent] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const item of items) {
      initial[item.id] = item.content_current;
    }
    return initial;
  });

  const [scoreResults, setScoreResults] = useState<Record<string, AuthenticityScoreResponse>>({});

  const updateMutation = useUpdateContent();
  const regenerateMutation = useRegenerateContent();
  const scoreMutation = useScoreContent();

  function handleTextChange(contentId: string, text: string) {
    setEditedContent((prev) => ({ ...prev, [contentId]: text }));
  }

  function handleSave(item: ContentResponse) {
    updateMutation.mutate(
      {
        id: item.id,
        content_current: editedContent[item.id] ?? item.content_current,
        status: 'draft',
      },
      {
        onSuccess: () => {
          toast.success('Saved to library');
        },
      }
    );
  }

  function handleCheckScore(item: ContentResponse) {
    scoreMutation.mutate(item.id, {
      onSuccess: (data) => {
        setScoreResults((prev) => ({ ...prev, [item.id]: data }));
      },
    });
  }

  function handleRegenerate(item: ContentResponse) {
    regenerateMutation.mutate(
      {
        clone_id: generationParams.clone_id,
        platforms: [item.platform],
        input_text: generationParams.input_text,
        properties: generationParams.properties,
      },
      {
        onSuccess: (data) => {
          const newItem = data.items[0];
          if (newItem) {
            setLocalItems((prev) => prev.map((i) => (i.id === item.id ? newItem : i)));
            setEditedContent((prev) => ({
              ...prev,
              [newItem.id]: newItem.content_current,
            }));
          }
        },
      }
    );
  }

  const firstPlatform = localItems[0]?.platform ?? '';

  return (
    <Tabs defaultValue={firstPlatform}>
      <TabsList>
        {localItems.map((item) => (
          <TabsTrigger key={item.id} value={item.platform}>
            {PLATFORMS[item.platform as PlatformKey]?.label ?? item.platform}
          </TabsTrigger>
        ))}
      </TabsList>

      {localItems.map((item) => (
        <TabsContent key={item.id} value={item.platform}>
          <PlatformTab
            content={item}
            editedText={editedContent[item.id] ?? item.content_current}
            onTextChange={(text) => handleTextChange(item.id, text)}
            onSave={() => handleSave(item)}
            onRegenerate={() => handleRegenerate(item)}
            onCheckScore={() => handleCheckScore(item)}
            isSaving={updateMutation.isPending}
            isRegenerating={regenerateMutation.isPending}
            isScoring={scoreMutation.isPending}
            scoreResult={scoreResults[item.id] ?? null}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
