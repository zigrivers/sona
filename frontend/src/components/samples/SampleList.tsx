import { FileText, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { EmptyState } from '@/components/shared/EmptyState';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDeleteSample, useSamples } from '@/hooks/use-samples';
import type { SampleResponse } from '@/types/api';

import { AddSampleDialog } from './AddSampleDialog';
import { CONTENT_TYPE_LABELS } from './constants';

function formatContentType(type: string): string {
  return CONTENT_TYPE_LABELS[type] ?? type;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

interface SampleListProps {
  cloneId: string;
}

export function SampleList({ cloneId }: SampleListProps) {
  const { data } = useSamples(cloneId);
  const deleteMutation = useDeleteSample(cloneId);

  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SampleResponse | null>(null);

  const samples = data?.items ?? [];

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }

  if (samples.length === 0) {
    return (
      <>
        <EmptyState
          icon={FileText}
          heading="No samples yet"
          description="Add writing samples to train your voice clone."
        >
          <Button onClick={() => setAddOpen(true)}>Add Sample</Button>
        </EmptyState>
        <AddSampleDialog open={addOpen} onOpenChange={setAddOpen} cloneId={cloneId} />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between pb-4">
        <h3 className="text-lg font-semibold">
          {data?.total ?? samples.length} sample{samples.length !== 1 ? 's' : ''}
        </h3>
        <Button onClick={() => setAddOpen(true)}>Add Sample</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Content Type</TableHead>
            <TableHead>Preview</TableHead>
            <TableHead>Word Count</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {samples.map((sample) => (
            <TableRow key={sample.id}>
              <TableCell>
                <Badge variant="secondary">{formatContentType(sample.content_type)}</Badge>
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {sample.content.length > 80 ? `${sample.content.slice(0, 80)}...` : sample.content}
              </TableCell>
              <TableCell>{sample.word_count}</TableCell>
              <TableCell>{sample.source_type}</TableCell>
              <TableCell>{formatDate(sample.created_at)}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(sample)}
                  aria-label="Delete"
                >
                  <Trash2 className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AddSampleDialog open={addOpen} onOpenChange={setAddOpen} cloneId={cloneId} />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sample</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this sample? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
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
