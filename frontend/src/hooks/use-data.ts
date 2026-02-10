import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { DatabaseStatsResponse } from '@/types/api';

export function useDatabaseStats() {
  return useQuery({
    queryKey: queryKeys.data.stats(),
    queryFn: () => api.get<DatabaseStatsResponse>('/api/data/stats'),
  });
}

export function useBackupDatabase() {
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/data/backup');
      if (!response.ok) throw new Error('Backup failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sona-backup.db';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast.success('Backup downloaded');
    },
    onError: () => {
      toast.error('Failed to download backup');
    },
  });
}

export function useRestoreDatabase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/data/restore', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail ?? 'Restore failed');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success('Database restored successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to restore database');
    },
  });
}
