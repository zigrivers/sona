import { Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { copyToClipboard } from '@/lib/export';

interface DnaExportProps {
  cloneId: string;
}

export function DnaExport({ cloneId }: DnaExportProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleExport() {
    setIsLoading(true);
    try {
      const { prompt } = await api.get<{ prompt: string }>(`/api/clones/${cloneId}/dna/prompt`);
      await copyToClipboard(prompt);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to export prompt');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={isLoading}>
      <Copy className="mr-2 size-4" />
      Export as Prompt
    </Button>
  );
}
