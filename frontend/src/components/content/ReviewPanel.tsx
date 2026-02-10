import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useDetectAI,
  useFeedbackRegen,
  usePartialRegen,
  useRegenerateContent,
  useScoreContent,
  useScorePreview,
  useUpdateContent,
} from '@/hooks/use-content';
import { useDebounce } from '@/hooks/use-debounce';
import { useUIStore } from '@/stores/ui-store';
import type { AuthenticityScoreResponse, ContentResponse, DetectionResponse } from '@/types/api';
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

  const showInputPanel = useUIStore((s) => s.showInputPanel);
  const setShowInputPanel = useUIStore((s) => s.setShowInputPanel);

  const [activeTabId, setActiveTabId] = useState<string>(items[0]?.id ?? '');
  const [scoreResults, setScoreResults] = useState<Record<string, AuthenticityScoreResponse>>({});
  const [detectionResults, setDetectionResults] = useState<Record<string, DetectionResponse>>({});

  const updateMutation = useUpdateContent();
  const regenerateMutation = useRegenerateContent();
  const scoreMutation = useScoreContent();
  const scorePreviewMutation = useScorePreview();
  const detectMutation = useDetectAI();
  const feedbackRegenMutation = useFeedbackRegen();
  const partialRegenMutation = usePartialRegen();

  // Auto-score via debounce
  const activeText = editedContent[activeTabId] ?? '';
  const debouncedText = useDebounce(activeText, 2000);

  useEffect(() => {
    if (!debouncedText.trim() || !generationParams.clone_id) return;
    scorePreviewMutation.mutate(
      { clone_id: generationParams.clone_id, content_text: debouncedText },
      {
        onSuccess: (data) => {
          setScoreResults((prev) => ({ ...prev, [activeTabId]: data }));
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedText, activeTabId, generationParams.clone_id]);

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

  function handleCheckDetection(item: ContentResponse) {
    detectMutation.mutate(item.id, {
      onSuccess: (data) => {
        setDetectionResults((prev) => ({ ...prev, [item.id]: data }));
      },
    });
  }

  function handleFeedbackRegen(item: ContentResponse, feedback: string) {
    feedbackRegenMutation.mutate(
      { id: item.id, feedback },
      {
        onSuccess: (data) => {
          setLocalItems((prev) => prev.map((i) => (i.id === item.id ? data : i)));
          setEditedContent((prev) => ({ ...prev, [data.id]: data.content_current }));
          toast.success('Content improved with feedback');
        },
      }
    );
  }

  function handlePartialRegen(item: ContentResponse, start: number, end: number) {
    partialRegenMutation.mutate(
      { id: item.id, selection_start: start, selection_end: end },
      {
        onSuccess: (data) => {
          setLocalItems((prev) => prev.map((i) => (i.id === item.id ? data : i)));
          setEditedContent((prev) => ({ ...prev, [data.id]: data.content_current }));
          toast.success('Selection regenerated');
        },
      }
    );
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

  function handleTabChange(platform: string) {
    const item = localItems.find((i) => i.platform === platform);
    if (item) setActiveTabId(item.id);
  }

  return (
    <Tabs defaultValue={firstPlatform} onValueChange={handleTabChange}>
      <TabsList>
        {localItems.map((item) => (
          <TabsTrigger key={item.id} value={item.platform}>
            {PLATFORMS[item.platform as PlatformKey]?.label ?? item.platform}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="flex items-center gap-2 py-2">
        <Switch id="show-input" checked={showInputPanel} onCheckedChange={setShowInputPanel} />
        <Label htmlFor="show-input">Show Input</Label>
      </div>

      {localItems.map((item) => (
        <TabsContent key={item.id} value={item.platform}>
          <PlatformTab
            content={item}
            editedText={editedContent[item.id] ?? item.content_current}
            onTextChange={(text) => handleTextChange(item.id, text)}
            onSave={() => handleSave(item)}
            onRegenerate={() => handleRegenerate(item)}
            onCheckScore={() => handleCheckScore(item)}
            onCheckDetection={() => handleCheckDetection(item)}
            isSaving={updateMutation.isPending}
            isRegenerating={regenerateMutation.isPending}
            isScoring={scoreMutation.isPending || scorePreviewMutation.isPending}
            isDetecting={detectMutation.isPending}
            scoreResult={scoreResults[item.id] ?? null}
            detectionResult={detectionResults[item.id] ?? null}
            onFeedbackRegen={(feedback) => handleFeedbackRegen(item, feedback)}
            isFeedbackRegenerating={feedbackRegenMutation.isPending}
            onPartialRegen={(start, end) => handlePartialRegen(item, start, end)}
            isPartialRegenerating={partialRegenMutation.isPending}
            showInput={showInputPanel}
            inputText={item.input_text}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
