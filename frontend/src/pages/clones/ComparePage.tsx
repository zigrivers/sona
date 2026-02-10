import { Link, useSearchParams } from 'react-router-dom';

import { ComparisonChart } from '@/components/clones/ComparisonChart';
import { DimensionTable } from '@/components/clones/DimensionTable';
import { useClone } from '@/hooks/use-clones';
import { useDna } from '@/hooks/use-dna';
import type { ProminenceScores } from '@/types/dna';

export function ComparePage() {
  const [searchParams] = useSearchParams();
  const idA = searchParams.get('a') ?? '';
  const idB = searchParams.get('b') ?? '';

  const cloneA = useClone(idA);
  const cloneB = useClone(idB);
  const dnaA = useDna(idA);
  const dnaB = useDna(idB);

  if (!idA || !idB) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 p-6">
        <p className="text-muted-foreground">Select two clones to compare.</p>
      </div>
    );
  }

  const isLoading = cloneA.isLoading || cloneB.isLoading || dnaA.isLoading || dnaB.isLoading;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const nameA = cloneA.data?.name ?? 'Clone A';
  const nameB = cloneB.data?.name ?? 'Clone B';

  const missingDna: string[] = [];
  if (!dnaA.data?.prominence_scores) missingDna.push(nameA);
  if (!dnaB.data?.prominence_scores) missingDna.push(nameB);

  if (missingDna.length > 0) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 p-6">
        <h1 className="text-2xl font-bold">
          Compare: {nameA} vs {nameB}
        </h1>
        <p className="text-muted-foreground">
          Analyze DNA first for {missingDna.join(' and ')} before comparing.{' '}
          {missingDna.includes(nameA) && (
            <Link to={`/clones/${idA}`} className="text-primary underline">
              {nameA}
            </Link>
          )}
          {missingDna.length === 2 && ' | '}
          {missingDna.includes(nameB) && (
            <Link to={`/clones/${idB}`} className="text-primary underline">
              {nameB}
            </Link>
          )}
        </p>
      </div>
    );
  }

  const scoresA = (dnaA.data?.prominence_scores ?? {}) as ProminenceScores;
  const scoresB = (dnaB.data?.prominence_scores ?? {}) as ProminenceScores;

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">
          Compare: {nameA} vs {nameB}
        </h1>
        <p className="text-muted-foreground mt-1">Side-by-side Voice DNA comparison</p>
      </div>

      <ComparisonChart scoresA={scoresA} scoresB={scoresB} nameA={nameA} nameB={nameB} />
      <DimensionTable scoresA={scoresA} scoresB={scoresB} nameA={nameA} nameB={nameB} />
    </div>
  );
}
