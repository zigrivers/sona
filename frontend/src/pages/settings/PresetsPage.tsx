import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreatePreset, useDeletePreset, usePresets } from '@/hooks/use-presets';

export function PresetsPage() {
  const { data: presets, isLoading } = usePresets();
  const createMutation = useCreatePreset();
  const deleteMutation = useDeletePreset();

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');

  function handleCreate() {
    if (!newName.trim()) return;
    createMutation.mutate(
      { name: newName.trim(), properties: {} },
      {
        onSuccess: () => {
          setNewName('');
          setShowForm(false);
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Presets</h1>
          <p className="text-muted-foreground mt-2">
            Save and reuse generation settings across content creation.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="size-4" />
          Create Preset
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="flex items-center gap-3 py-3">
            <Input
              placeholder="Preset name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Button onClick={handleCreate} disabled={!newName.trim() || createMutation.isPending}>
              Save
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {!isLoading && presets && presets.length === 0 && !showForm && (
        <p className="text-muted-foreground py-8 text-center">
          No presets yet. Create one to save your favorite generation settings.
        </p>
      )}

      {presets &&
        presets.length > 0 &&
        presets.map((preset) => (
          <Card key={preset.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{preset.name}</p>
                <p className="text-muted-foreground text-xs">
                  {Object.keys(preset.properties).length} properties
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteMutation.mutate(preset.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
