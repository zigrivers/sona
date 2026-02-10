import { ProviderCard } from '@/components/settings/ProviderCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useProviders, useSetDefaultProvider } from '@/hooks/use-providers';

export function ProvidersPage() {
  const { data: providers, isLoading } = useProviders();
  const setDefaultMutation = useSetDefaultProvider();

  const configuredProviders = providers?.filter((p) => p.is_configured) ?? [];
  const defaultProvider = configuredProviders.length === 1 ? configuredProviders[0].name : null;

  function handleSetDefault(name: string) {
    setDefaultMutation.mutate(name);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Providers</h1>
        <p className="text-muted-foreground mt-2">
          Configure your AI provider API keys and default models.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {providers?.map((provider) => (
            <ProviderCard
              key={provider.name}
              provider={provider}
              isDefault={defaultProvider === provider.name}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}
    </div>
  );
}
