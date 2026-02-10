import { Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FeedbackInputProps {
  onSubmit: (feedback: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function FeedbackInput({ onSubmit, isLoading, disabled }: FeedbackInputProps) {
  const [value, setValue] = useState('');

  const canSubmit = value.trim().length > 0 && !isLoading && !disabled;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit(value.trim());
    setValue('');
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Give feedback to improve..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <Button onClick={handleSubmit} disabled={!canSubmit} size="sm">
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        Improve
      </Button>
    </div>
  );
}
