import { Dna, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/shared/EmptyState';
import { Accordion } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnalyzeDna, useDna, useDnaVersions, useUpdateDna } from '@/hooks/use-dna';

import { DNA_CATEGORIES } from './dna-categories';
import { DnaCategorySection } from './DnaCategorySection';
import { DnaTimeline } from './DnaTimeline';
import { DnaVersionHistory } from './DnaVersionHistory';

interface DnaDisplayProps {
  cloneId: string;
}

export function DnaDisplay({ cloneId }: DnaDisplayProps) {
  const { data: dna, isLoading } = useDna(cloneId);
  const { data: versionsData } = useDnaVersions(cloneId);
  const updateMutation = useUpdateDna(cloneId);
  const analyzeMutation = useAnalyzeDna(cloneId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!dna) {
    return (
      <EmptyState
        icon={Dna}
        heading="No Voice DNA Yet"
        description="Analyze writing samples to generate a voice DNA profile."
      >
        <Button
          onClick={() =>
            analyzeMutation.mutate(undefined, {
              onSuccess: () => toast.success('Voice DNA analysis complete'),
              onError: () => toast.error('Failed to analyze voice DNA'),
            })
          }
          disabled={analyzeMutation.isPending}
        >
          {analyzeMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Analyze Voice DNA
        </Button>
      </EmptyState>
    );
  }

  const dnaData = dna.data as Record<string, unknown>;
  const consistencyScore = dnaData.consistency_score as number | undefined;

  function handleFieldSave(categoryKey: string, fieldKey: string, newValue: string | string[]) {
    const currentCategory = (dnaData[categoryKey] as Record<string, unknown>) ?? {};
    const updatedData = {
      ...dnaData,
      [categoryKey]: {
        ...currentCategory,
        [fieldKey]: newValue,
      },
    };

    updateMutation.mutate(
      { data: updatedData },
      {
        onSuccess: () => toast.success('Voice DNA updated'),
        onError: () => toast.error('Failed to update voice DNA'),
      }
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground text-sm">
          Version {dna.version_number} &middot; {dna.trigger.replace('_', ' ')}
        </span>
        {consistencyScore !== undefined && (
          <Badge variant="outline">Consistency: {String(consistencyScore)}%</Badge>
        )}
      </div>

      <Accordion type="multiple">
        {DNA_CATEGORIES.map((category) => (
          <DnaCategorySection
            key={category.key}
            categoryKey={category.key}
            categoryLabel={category.label}
            fields={category.fields}
            data={(dnaData[category.key] as Record<string, unknown>) ?? {}}
            onFieldSave={(fieldKey, newValue) => handleFieldSave(category.key, fieldKey, newValue)}
            isSaving={updateMutation.isPending}
          />
        ))}
      </Accordion>

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Version History</h3>
        <DnaVersionHistory cloneId={cloneId} />
      </div>

      {versionsData?.items && versionsData.items.length > 1 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Evolution Timeline</h3>
          <DnaTimeline versions={versionsData.items} />
        </div>
      )}
    </div>
  );
}
