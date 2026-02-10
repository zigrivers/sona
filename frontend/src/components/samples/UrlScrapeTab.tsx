import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useScrapeSample } from '@/hooks/use-samples';
import { ApiError } from '@/types/errors';

import { CONTENT_TYPES } from './constants';

interface UrlScrapeTabProps {
  cloneId: string;
  onSuccess: () => void;
}

export function UrlScrapeTab({ cloneId, onSuccess }: UrlScrapeTabProps) {
  const [url, setUrl] = useState('');
  const [contentType, setContentType] = useState('blog_post');
  const [error, setError] = useState<string | null>(null);

  const scrapeMutation = useScrapeSample(cloneId);

  function handleScrape() {
    setError(null);
    scrapeMutation.mutate(
      { url, content_type: contentType },
      {
        onSuccess: () => {
          toast.success('Sample scraped successfully');
          onSuccess();
        },
        onError: (err) => {
          const message = err instanceof ApiError ? err.detail : 'Scrape failed';
          setError(message);
          toast.error(message);
        },
      }
    );
  }

  return (
    <div className="space-y-4">
      <Input placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />

      <Select value={contentType} onValueChange={setContentType}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CONTENT_TYPES.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex justify-end">
        <Button onClick={handleScrape} disabled={url.trim() === '' || scrapeMutation.isPending}>
          {scrapeMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Scrape
        </Button>
      </div>
    </div>
  );
}
