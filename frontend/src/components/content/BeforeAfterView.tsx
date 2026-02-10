import type React from 'react';

import { Textarea } from '@/components/ui/textarea';

interface BeforeAfterViewProps {
  inputText: string;
  editedText: string;
  onTextChange: (text: string) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  onSelect?: React.ReactEventHandler<HTMLTextAreaElement>;
}

export function BeforeAfterView({
  inputText,
  editedText,
  onTextChange,
  textareaRef,
  onSelect,
}: BeforeAfterViewProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-muted-foreground mb-1 text-xs font-medium">Original Input</p>
        <div className="bg-muted whitespace-pre-wrap rounded-md border p-3 text-sm">{inputText}</div>
      </div>
      <div>
        <p className="text-muted-foreground mb-1 text-xs font-medium">Generated Output</p>
        <Textarea
          ref={textareaRef}
          value={editedText}
          onChange={(e) => onTextChange(e.target.value)}
          onSelect={onSelect}
          rows={8}
          className="resize-y font-mono text-sm"
        />
      </div>
    </div>
  );
}
