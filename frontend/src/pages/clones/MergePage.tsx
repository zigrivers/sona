import { useMemo, useState } from 'react';

import { SourceSelector } from '@/components/merge/SourceSelector';
import { WeightMatrix } from '@/components/merge/WeightMatrix';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClones } from '@/hooks/use-clones';
import { useMerge } from '@/hooks/use-merge';
import type { DNACategory } from '@/types/dna';
import { DNA_CATEGORIES } from '@/types/dna';

function makeDefaultWeights(): Record<DNACategory, number> {
  const w = {} as Record<DNACategory, number>;
  for (const cat of DNA_CATEGORIES) {
    w[cat] = 50;
  }
  return w;
}

export function MergePage() {
  const [selectedCloneIds, setSelectedCloneIds] = useState<string[]>([]);
  const [weights, setWeights] = useState<Record<string, Record<DNACategory, number>>>({});
  const [mergeName, setMergeName] = useState('');

  const { data: clonesData } = useClones();
  const merge = useMerge();

  const cloneNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const clone of clonesData?.items ?? []) {
      map[clone.id] = clone.name;
    }
    return map;
  }, [clonesData]);

  function handleSelectionChange(ids: string[]) {
    setSelectedCloneIds(ids);
    setWeights((prev) => {
      const next = { ...prev };
      // Add new clones
      for (const id of ids) {
        if (!next[id]) {
          next[id] = makeDefaultWeights();
        }
      }
      // Remove deselected clones
      for (const id of Object.keys(next)) {
        if (!ids.includes(id)) {
          delete next[id];
        }
      }
      return next;
    });
  }

  function handleWeightChange(cloneId: string, category: DNACategory, value: number) {
    setWeights((prev) => ({
      ...prev,
      [cloneId]: { ...prev[cloneId], [category]: value },
    }));
  }

  const canMerge = selectedCloneIds.length >= 2 && mergeName.trim().length > 0;

  function handleMerge() {
    if (!canMerge) return;
    merge.mutate({
      name: mergeName.trim(),
      source_clones: selectedCloneIds.map((id) => ({
        clone_id: id,
        weights: weights[id],
      })),
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">Merge Voice Clones</h1>
        <p className="text-muted-foreground mt-1">
          Combine 2–5 voice clones into a new blended voice by configuring per-element weights.
        </p>
      </div>

      <SourceSelector selectedIds={selectedCloneIds} onChange={handleSelectionChange} />

      {selectedCloneIds.length >= 2 && (
        <WeightMatrix cloneNames={cloneNames} weights={weights} onChange={handleWeightChange} />
      )}

      <div className="space-y-2">
        <Label htmlFor="merge-name">Merged Clone Name</Label>
        <Input
          id="merge-name"
          placeholder="Merged clone name"
          value={mergeName}
          onChange={(e) => setMergeName(e.target.value)}
        />
      </div>

      <Button onClick={handleMerge} disabled={!canMerge || merge.isPending}>
        {merge.isPending ? 'Merging...' : 'Merge'}
      </Button>
    </div>
  );
}
