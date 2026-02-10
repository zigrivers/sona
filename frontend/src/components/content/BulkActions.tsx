import { useState } from 'react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBulkAddTags, useBulkDelete, useBulkUpdateStatus } from '@/hooks/use-content';

const STATUSES = ['draft', 'review', 'approved', 'published', 'archived'] as const;

interface BulkActionsProps {
  selectedIds: string[];
  onComplete: () => void;
}

export function BulkActions({ selectedIds, onComplete }: BulkActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const bulkUpdateStatus = useBulkUpdateStatus();
  const bulkDelete = useBulkDelete();
  const bulkAddTags = useBulkAddTags();

  if (selectedIds.length === 0) return null;

  function handleStatusChange(status: string) {
    bulkUpdateStatus.mutate({ ids: selectedIds, status }, { onSuccess: onComplete });
  }

  function handleDelete() {
    bulkDelete.mutate(
      { ids: selectedIds },
      {
        onSuccess: () => {
          setDeleteOpen(false);
          onComplete();
        },
      }
    );
  }

  function handleAddTags() {
    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (tags.length === 0) return;
    bulkAddTags.mutate(
      { ids: selectedIds, tags },
      {
        onSuccess: () => {
          setTagsOpen(false);
          setTagInput('');
          onComplete();
        },
      }
    );
  }

  return (
    <>
      <div
        className="bg-background fixed inset-x-0 bottom-0 z-50 flex items-center gap-3 border-t px-6 py-3 shadow-lg"
        data-testid="bulk-actions"
      >
        <span className="text-sm font-medium">{selectedIds.length} selected</span>

        <Select onValueChange={handleStatusChange}>
          <SelectTrigger className="w-40" aria-label="Change status">
            <SelectValue placeholder="Change Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={() => setTagsOpen(true)}>
          Add Tags
        </Button>

        <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
          Delete
        </Button>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Content</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.length} item
              {selectedIds.length !== 1 && 's'}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={bulkDelete.isPending}>
              {bulkDelete.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={tagsOpen} onOpenChange={setTagsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tags</DialogTitle>
            <DialogDescription>
              Enter tags separated by commas to add to {selectedIds.length} item
              {selectedIds.length !== 1 && 's'}.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="tag1, tag2, tag3"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            aria-label="Tags"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTags} disabled={bulkAddTags.isPending}>
              {bulkAddTags.isPending ? 'Adding…' : 'Add Tags'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
