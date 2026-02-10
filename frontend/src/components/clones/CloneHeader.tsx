import { Pencil, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';

import { ConfidenceBadge } from '@/components/clones/ConfidenceBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { CloneResponse } from '@/types/api';

interface CloneHeaderProps {
  clone: CloneResponse;
  onUpdate: (data: { name: string }) => void;
  onDelete: () => void;
}

export function CloneHeader({ clone, onUpdate, onDelete }: CloneHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(clone.name);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEditing() {
    setEditName(clone.name);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = editName.trim();
      if (trimmed && trimmed !== clone.name) {
        onUpdate({ name: trimmed });
      }
      setIsEditing(false);
      setEditName(clone.name);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditName(clone.name);
    }
  }

  function handleBlur() {
    setIsEditing(false);
    setEditName(clone.name);
  }

  function handleConfirmDelete() {
    setDeleteOpen(false);
    onDelete();
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isEditing ? (
            <Input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="text-2xl font-bold"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={startEditing}
              className="group flex items-center gap-2 text-left"
            >
              <h1 className="text-2xl font-bold">{clone.name}</h1>
              <Pencil className="text-muted-foreground size-4 opacity-0 group-hover:opacity-100" />
            </button>
          )}
          <Badge variant="secondary">{clone.type}</Badge>
          <ConfidenceBadge score={clone.confidence_score} />
        </div>

        <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="mr-1 size-4" />
          Delete
        </Button>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Clone</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{clone.name}&quot;? This clone will be
              moved to trash and permanently deleted after 30 days. You can restore it
              from the deleted clones section.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
