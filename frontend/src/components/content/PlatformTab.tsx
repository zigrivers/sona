import { Loader2, RefreshCw, Save, Shield, Sparkles } from 'lucide-react';
import { useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  countWords,
  getLimitColor,
  getLimitStatus,
  getPlatformHints,
  splitIntoThread,
} from '@/lib/platforms';
import { cn } from '@/lib/utils';
import type { AuthenticityScoreResponse, ContentResponse } from '@/types/api';
import { type PlatformKey, PLATFORMS } from '@/types/platforms';

import { AuthenticityScore } from './AuthenticityScore';
import { DimensionBreakdown } from './DimensionBreakdown';
import { ExportMenu } from './ExportMenu';
import { FeedbackInput } from './FeedbackInput';

interface PlatformTabProps {
  content: ContentResponse;
  editedText: string;
  onTextChange: (text: string) => void;
  onSave: () => void;
  onRegenerate: () => void;
  onCheckScore: () => void;
  isSaving: boolean;
  isRegenerating: boolean;
  isScoring: boolean;
  scoreResult: AuthenticityScoreResponse | null;
  onFeedbackRegen?: (feedback: string) => void;
  isFeedbackRegenerating?: boolean;
  onPartialRegen?: (start: number, end: number) => void;
  isPartialRegenerating?: boolean;
}

export function PlatformTab({
  content,
  editedText,
  onTextChange,
  onSave,
  onRegenerate,
  onCheckScore,
  isSaving,
  isRegenerating,
  isScoring,
  scoreResult,
  onFeedbackRegen,
  isFeedbackRegenerating = false,
  onPartialRegen,
  isPartialRegenerating = false,
}: PlatformTabProps) {
  const [showThread, setShowThread] = useState(false);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const platform = content.platform as PlatformKey;
  const platformInfo = PLATFORMS[platform];
  const charLimit = platformInfo?.charLimit ?? 100_000;
  const charCount = editedText.length;
  const wordCount = countWords(editedText);
  const status = getLimitStatus(charCount, charLimit);
  const limitColor = getLimitColor(status);
  const progressPercent = Math.min((charCount / charLimit) * 100, 100);
  const hasUnsavedChanges = editedText !== content.content_current;
  const isTwitter = platform === 'twitter';
  const needsThread = isTwitter && charCount > 280;
  const hints = getPlatformHints(platform);

  return (
    <div className="space-y-4">
      {/* Textarea */}
      <Textarea
        ref={textareaRef}
        value={editedText}
        onChange={(e) => onTextChange(e.target.value)}
        onSelect={(e) => {
          const target = e.target as HTMLTextAreaElement;
          if (target.selectionStart !== target.selectionEnd) {
            setSelectionStart(target.selectionStart);
            setSelectionEnd(target.selectionEnd);
          } else {
            setSelectionStart(null);
            setSelectionEnd(null);
          }
        }}
        rows={8}
        className="resize-y font-mono text-sm"
      />

      {/* Character/word count bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className={cn('font-medium', limitColor)}>
            {charCount.toLocaleString()} / {charLimit.toLocaleString()} chars
          </span>
          <span className="text-muted-foreground">{wordCount} words</span>
        </div>
        <Progress value={progressPercent} />
      </div>

      {/* Feedback-driven regen */}
      {onFeedbackRegen && (
        <FeedbackInput
          onSubmit={onFeedbackRegen}
          isLoading={isFeedbackRegenerating}
          disabled={hasUnsavedChanges}
        />
      )}

      {/* Unsaved changes badge */}
      {hasUnsavedChanges && <Badge variant="outline">Unsaved changes</Badge>}

      {/* Platform hints */}
      <ul className="text-muted-foreground space-y-1 text-xs">
        {hints.map((hint) => (
          <li key={hint}>{hint}</li>
        ))}
      </ul>

      {/* Twitter thread splitting */}
      {needsThread && (
        <div className="space-y-3">
          <Button variant="outline" size="sm" onClick={() => setShowThread(!showThread)}>
            {showThread ? 'Hide thread' : 'Convert to thread?'}
          </Button>

          {showThread && (
            <div className="space-y-2">
              {splitIntoThread(editedText).map((chunk, i) => (
                <Card key={i}>
                  <CardContent className="py-3 text-sm">{chunk}</CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Authenticity score */}
      {scoreResult && (
        <Card>
          <CardContent className="space-y-3 py-3">
            <AuthenticityScore overallScore={scoreResult.overall_score} />
            <DimensionBreakdown dimensions={scoreResult.dimensions} />
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button onClick={onSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save to Library
        </Button>
        <Button variant="outline" onClick={onRegenerate} disabled={isRegenerating}>
          {isRegenerating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Regenerate
        </Button>
        <Button variant="outline" onClick={onCheckScore} disabled={isScoring}>
          {isScoring ? <Loader2 className="size-4 animate-spin" /> : <Shield className="size-4" />}
          Check Authenticity
        </Button>
        {onPartialRegen && selectionStart !== null && selectionEnd !== null && (
          <Button
            variant="outline"
            onClick={() => onPartialRegen(selectionStart, selectionEnd)}
            disabled={isPartialRegenerating}
          >
            {isPartialRegenerating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Regenerate Selection
          </Button>
        )}
        <ExportMenu items={[content]} />
      </div>
    </div>
  );
}
