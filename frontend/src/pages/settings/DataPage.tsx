import { Database, Download, Eye, EyeOff, Lock, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useBackupDatabase, useDatabaseStats, useRestoreDatabase } from '@/hooks/use-data';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function DataPage() {
  const { data: stats, isLoading } = useDatabaseStats();
  const backupMutation = useBackupDatabase();
  const restoreMutation = useRestoreDatabase();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
    }
    // Reset so the same file can be selected again
    e.target.value = '';
  };

  const handleConfirmRestore = () => {
    if (pendingFile) {
      restoreMutation.mutate(pendingFile);
      setPendingFile(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Data & Privacy</h1>
        <p className="text-muted-foreground mt-2">
          Manage your database and understand what data Sona stores and sends.
        </p>
      </div>

      {/* Database Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-5" />
            Database
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          ) : stats ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location</span>
                <span className="font-mono text-xs">{stats.db_location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Size</span>
                <span>{formatBytes(stats.db_size_bytes)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Voice clones</span>
                <span>{stats.clone_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Content items</span>
                <span>{stats.content_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Writing samples</span>
                <span>{stats.sample_count}</span>
              </div>
            </div>
          ) : null}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => backupMutation.mutate()}
              disabled={backupMutation.isPending}
            >
              <Download className="mr-2 size-4" />
              Download Backup
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={restoreMutation.isPending}
            >
              <Upload className="mr-2 size-4" />
              Restore from File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".db,.sqlite,.sqlite3"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Transparency Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="size-5" />
            Data Transparency
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stored Locally */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <Database className="size-4" />
              Stored Locally
            </h3>
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li>Voice clone profiles and names</li>
              <li>Writing samples you provide</li>
              <li>Voice DNA analysis results</li>
              <li>Generated content and version history</li>
              <li>Methodology settings and presets</li>
              <li>LLM provider API keys (encrypted at rest)</li>
            </ul>
          </div>

          <Separator />

          {/* Sent to LLM Providers */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <EyeOff className="size-4" />
              Sent to LLM Providers
            </h3>
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li>Writing sample text (for voice analysis)</li>
              <li>Voice DNA profile (for content generation)</li>
              <li>Input text and prompts you provide</li>
              <li>Methodology and platform settings</li>
            </ul>
          </div>

          <Separator />

          {/* Never Sent */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <Lock className="size-4" />
              Never Sent
            </h3>
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li>API keys (used only for authentication)</li>
              <li>Clone names and descriptions</li>
              <li>Content version history</li>
              <li>Library items after generation</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <Dialog open={pendingFile !== null} onOpenChange={() => setPendingFile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Database?</DialogTitle>
            <DialogDescription>
              This will replace your current database with the uploaded file. A backup of your
              current database will be created automatically.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingFile(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmRestore}>Confirm Restore</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
