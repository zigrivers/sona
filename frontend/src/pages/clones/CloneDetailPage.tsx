import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { CloneHeader } from '@/components/clones/CloneHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClone, useDeleteClone, useUpdateClone } from '@/hooks/use-clones';

const TABS = [
  { key: 'samples', label: 'Samples' },
  { key: 'voice-dna', label: 'Voice DNA' },
  { key: 'generated', label: 'Generated Content' },
] as const;

export function CloneDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: clone, isLoading } = useClone(id!);
  const updateMutation = useUpdateClone();
  const deleteMutation = useDeleteClone();
  const [activeTab, setActiveTab] = useState('samples');

  if (isLoading || !clone) {
    return (
      <div className="space-y-6" data-testid="clone-detail-loading">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-8 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  function handleUpdate(data: { name: string }) {
    updateMutation.mutate({ id: id!, body: data });
  }

  function handleDelete() {
    deleteMutation.mutate(id!, {
      onSuccess: () => navigate('/clones'),
    });
  }

  return (
    <div className="space-y-6">
      <CloneHeader clone={clone} onUpdate={handleUpdate} onDelete={handleDelete} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="samples">
          <p className="text-muted-foreground py-8 text-center">
            Writing samples will appear here once added.
          </p>
        </TabsContent>

        <TabsContent value="voice-dna">
          <p className="text-muted-foreground py-8 text-center">
            Voice DNA analysis will be generated from writing samples.
          </p>
        </TabsContent>

        <TabsContent value="generated">
          <p className="text-muted-foreground py-8 text-center">
            Generated content will appear here.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
