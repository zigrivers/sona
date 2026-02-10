import { useEffect, useState } from 'react';

import { VersionHistory } from '@/components/settings/VersionHistory';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  useMethodologySection,
  useMethodologyVersions,
  useRevertMethodology,
  useUpdateMethodology,
} from '@/hooks/use-methodology';

interface MethodologyEditorProps {
  sectionKey: string;
}

export function MethodologyEditor({ sectionKey }: MethodologyEditorProps) {
  const { data, isLoading, isError } = useMethodologySection(sectionKey);
  const updateMutation = useUpdateMethodology(sectionKey);
  const versionsQuery = useMethodologyVersions(sectionKey);
  const revertMutation = useRevertMethodology(sectionKey);

  const [content, setContent] = useState('');

  useEffect(() => {
    if (data?.current_content !== undefined) {
      setContent(data.current_content);
    }
  }, [data?.current_content]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-10 w-20" />
      </div>
    );
  }

  if (isError) {
    return <p className="text-destructive text-sm">Failed to load methodology section.</p>;
  }

  const isUnchanged = content === (data?.current_content ?? '');

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Textarea
          className="min-h-96"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Button
          disabled={isUnchanged || updateMutation.isPending}
          onClick={() => updateMutation.mutate(content)}
        >
          Save
        </Button>
      </div>

      <div className="space-y-3">
        <h3 className="text-muted-foreground text-sm font-medium">Version History</h3>
        <VersionHistory
          versions={versionsQuery.data ?? []}
          onRevert={(version) => revertMutation.mutate(version)}
          isLoading={versionsQuery.isLoading}
        />
      </div>
    </div>
  );
}
