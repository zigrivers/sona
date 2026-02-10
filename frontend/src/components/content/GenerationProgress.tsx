import { Loader2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type PlatformKey, PLATFORMS } from '@/types/platforms';

interface GenerationProgressProps {
  platforms: string[];
}

export function GenerationProgress({ platforms }: GenerationProgressProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generating content...</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {platforms.map((platform) => (
            <li key={platform} className="flex items-center gap-2">
              <Loader2 className="text-muted-foreground size-4 animate-spin" />
              <span>{PLATFORMS[platform as PlatformKey]?.label ?? platform}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
