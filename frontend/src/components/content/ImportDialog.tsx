import { Upload } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useClones } from '@/hooks/use-clones';
import { useImportContent, useUploadContent } from '@/hooks/use-content';
import { ApiError } from '@/types/errors';
import { type PlatformKey, PLATFORMS } from '@/types/platforms';

const ACCEPTED_TYPES: Record<string, string[]> = {
  'text/plain': ['.txt'],
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const [tab, setTab] = useState('paste');
  const [content, setContent] = useState('');
  const [cloneId, setCloneId] = useState('');
  const [platform, setPlatform] = useState('');

  const { data: cloneData } = useClones();
  const importMutation = useImportContent();
  const uploadMutation = useUploadContent();

  useEffect(() => {
    if (open) {
      setTab('paste');
      setContent('');
      setCloneId('');
      setPlatform('');
    }
  }, [open]);

  function handlePasteSubmit() {
    importMutation.mutate(
      {
        clone_id: cloneId,
        platform,
        content_text: content,
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (!cloneId || !platform) {
        toast.error('Select a clone and platform first');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('clone_id', cloneId);
      formData.append('platform', platform);

      uploadMutation.mutate(formData, {
        onSuccess: () => onOpenChange(false),
        onError: (err) => {
          const message = err instanceof ApiError ? err.detail : 'Upload failed';
          toast.error(message);
        },
      });
    },
    [cloneId, platform, uploadMutation, onOpenChange]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    multiple: false,
  });

  const canSubmitPaste = content.trim() !== '' && cloneId !== '' && platform !== '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Content</DialogTitle>
          <DialogDescription>Import existing content into your library.</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="paste" className="flex-1">
              Paste
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex-1">
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste">
            <div className="space-y-4">
              <Textarea
                placeholder="Paste your content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
              />

              <Select value={cloneId} onValueChange={setCloneId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select clone" />
                </SelectTrigger>
                <SelectContent>
                  {(cloneData?.items ?? []).map((clone) => (
                    <SelectItem key={clone.id} value={clone.id}>
                      {clone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(PLATFORMS) as [PlatformKey, (typeof PLATFORMS)[PlatformKey]][]
                  ).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      {info.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handlePasteSubmit}
                disabled={!canSubmitPaste || importMutation.isPending}
              >
                Import
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="upload">
            <div className="space-y-4">
              <Select value={cloneId} onValueChange={setCloneId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select clone" />
                </SelectTrigger>
                <SelectContent>
                  {(cloneData?.items ?? []).map((clone) => (
                    <SelectItem key={clone.id} value={clone.id}>
                      {clone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(PLATFORMS) as [PlatformKey, (typeof PLATFORMS)[PlatformKey]][]
                  ).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      {info.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div
                {...getRootProps()}
                className="border-muted-foreground/25 hover:border-muted-foreground/50 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors"
              >
                <input {...getInputProps()} data-testid="file-input" />
                <Upload className="text-muted-foreground mb-2 size-8" />
                <p className="text-muted-foreground text-sm">
                  Drag &amp; drop a file here, or click to upload
                </p>
                <p className="text-muted-foreground mt-1 text-xs">.txt, .docx, .pdf</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
