import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import type { DnaFieldConfig } from './dna-categories';

interface DnaFieldEditorProps {
  fieldConfig: DnaFieldConfig;
  value: unknown;
  onSave: (newValue: string | string[]) => void;
  isSaving: boolean;
}

export function DnaFieldEditor({ fieldConfig, value, onSave, isSaving }: DnaFieldEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  function startEditing() {
    if (fieldConfig.type === 'array') {
      setDraft(Array.isArray(value) ? (value as string[]).join(', ') : '');
    } else {
      setDraft(typeof value === 'string' ? value : '');
    }
    setEditing(true);
  }

  function handleSave() {
    if (fieldConfig.type === 'array') {
      onSave(
        draft
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      );
    } else {
      onSave(draft);
    }
    setEditing(false);
  }

  function handleCancel() {
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <span className="text-muted-foreground text-sm">{fieldConfig.label}</span>
        <div className="flex items-center gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={isSaving}
            className="h-8"
          />
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <span className="text-muted-foreground text-sm">{fieldConfig.label}</span>
      {value === undefined || value === null ? (
        <button
          className="text-muted-foreground cursor-pointer text-sm italic"
          onClick={startEditing}
        >
          Not set
        </button>
      ) : fieldConfig.type === 'array' && Array.isArray(value) ? (
        <button className="flex flex-wrap gap-1" onClick={startEditing}>
          {(value as string[]).map((item) => (
            <Badge key={item} variant="secondary">
              {item}
            </Badge>
          ))}
        </button>
      ) : (
        <button className="cursor-pointer text-sm" onClick={startEditing}>
          {String(value)}
        </button>
      )}
    </div>
  );
}
