import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { CONTENT_TYPES } from './constants';

interface TextPreviewProps {
  initialContent: string;
  sourceLabel: string;
  onSubmit: (data: { content: string; content_type: string }) => void;
  onBack: () => void;
  isPending?: boolean;
}

export function TextPreview({
  initialContent,
  sourceLabel,
  onSubmit,
  onBack,
  isPending,
}: TextPreviewProps) {
  const [content, setContent] = useState(initialContent);
  const [contentType, setContentType] = useState('blog_post');

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">{sourceLabel}</p>

      <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} />

      <Select value={contentType} onValueChange={setContentType}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CONTENT_TYPES.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={() => onSubmit({ content, content_type: contentType })}
          disabled={content.trim() === '' || isPending}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
