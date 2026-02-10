import { useEffect, useState } from 'react';

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
import { useCreateSample } from '@/hooks/use-samples';

import { CONTENT_TYPES } from './constants';
import { FileUploadTab } from './FileUploadTab';
import { UrlScrapeTab } from './UrlScrapeTab';

interface AddSampleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cloneId: string;
}

export function AddSampleDialog({ open, onOpenChange, cloneId }: AddSampleDialogProps) {
  const [tab, setTab] = useState('paste');
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState('blog_post');

  const createMutation = useCreateSample(cloneId);

  useEffect(() => {
    if (open) {
      setTab('paste');
      setContent('');
      setContentType('blog_post');
    }
  }, [open]);

  function handlePasteSubmit() {
    createMutation.mutate(
      { content, content_type: contentType, source_type: 'paste' },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  function handleTabSuccess() {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Writing Sample</DialogTitle>
          <DialogDescription>
            Add a writing sample to help train your voice clone.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="paste" className="flex-1">
              Paste
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex-1">
              Upload
            </TabsTrigger>
            <TabsTrigger value="url" className="flex-1">
              URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste">
            <div className="space-y-4">
              <Textarea
                placeholder="Paste your writing sample here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
              />

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
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handlePasteSubmit}
                disabled={content.trim() === '' || createMutation.isPending}
              >
                Add
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="upload">
            <FileUploadTab cloneId={cloneId} onSuccess={handleTabSuccess} />
          </TabsContent>

          <TabsContent value="url">
            <UrlScrapeTab cloneId={cloneId} onSuccess={handleTabSuccess} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
