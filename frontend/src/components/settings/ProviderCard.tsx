import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSaveProvider, useTestConnection } from '@/hooks/use-providers';
import { cn } from '@/lib/utils';
import type { ProviderResponse } from '@/types/api';

const DISPLAY_NAMES: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google AI',
};

const formSchema = z.object({
  api_key: z.string().min(1, 'API key is required'),
  default_model: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ProviderCardProps {
  provider: ProviderResponse;
  isDefault: boolean;
  onSetDefault: (name: string) => void;
}

export function ProviderCard({ provider, isDefault, onSetDefault }: ProviderCardProps) {
  const saveMutation = useSaveProvider();
  const testMutation = useTestConnection();
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      api_key: '',
      default_model: provider.default_model ?? undefined,
    },
  });

  const displayName = DISPLAY_NAMES[provider.name] ?? provider.name;

  function onSubmit(values: FormValues) {
    saveMutation.mutate({
      name: provider.name,
      body: {
        api_key: values.api_key,
        ...(values.default_model ? { default_model: values.default_model } : {}),
      },
    });
  }

  function handleTestConnection() {
    setTestResult(null);
    testMutation.mutate(provider.name, {
      onSuccess: (data) => setTestResult(data),
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle>{displayName}</CardTitle>
            {provider.is_configured ? (
              <Badge variant="secondary">Configured</Badge>
            ) : (
              <Badge variant="outline">Not Configured</Badge>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="default-provider"
              checked={isDefault}
              disabled={!provider.is_configured}
              onChange={() => onSetDefault(provider.name)}
              aria-label="Default"
            />
            Default
          </label>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {provider.is_configured && provider.masked_key && (
          <p className="text-muted-foreground text-sm">
            Current key: <span className="font-mono">{provider.masked_key}</span>
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${provider.name}-api-key`}>API Key</Label>
            <Input
              id={`${provider.name}-api-key`}
              type="password"
              placeholder={provider.is_configured ? 'Enter new key to replace' : 'Enter API key'}
              aria-invalid={!!errors.api_key}
              {...register('api_key')}
            />
            {errors.api_key && <p className="text-destructive text-sm">{errors.api_key.message}</p>}
          </div>

          {provider.available_models.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor={`${provider.name}-model`}>Default Model</Label>
              <Select
                defaultValue={provider.default_model ?? provider.available_models[0]}
                onValueChange={(_value) => {
                  // Radix Select managed externally; model sent via save mutation
                }}
              >
                <SelectTrigger id={`${provider.name}-model`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {provider.available_models.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </Button>

            {provider.is_configured && (
              <Button
                type="button"
                variant="outline"
                disabled={testMutation.isPending}
                onClick={handleTestConnection}
              >
                {testMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
            )}
          </div>
        </form>

        {testResult && (
          <p className={cn('text-sm', testResult.success ? 'text-success' : 'text-destructive')}>
            {testResult.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
