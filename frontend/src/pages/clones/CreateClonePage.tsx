import { useNavigate } from 'react-router-dom';

import { CloneForm } from '@/components/clones/CloneForm';
import { useCreateClone } from '@/hooks/use-clones';

export function CreateClonePage() {
  const navigate = useNavigate();
  const createMutation = useCreateClone();

  function handleSubmit(data: { name: string; description: string; tags: string[] }) {
    createMutation.mutate(
      {
        name: data.name,
        description: data.description || undefined,
        tags: data.tags,
      },
      {
        onSuccess: (clone) => {
          navigate(`/clones/${clone.id}`);
        },
      }
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-4xl font-bold tracking-tight">Create Clone</h1>
      <p className="text-muted-foreground">
        Create a new voice clone by providing a name and optional details.
      </p>
      <CloneForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
    </div>
  );
}
