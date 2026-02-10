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
import { Textarea } from '@/components/ui/textarea';

const CONTENT_TYPES = [
  { value: 'tweet', label: 'Tweet' },
  { value: 'thread', label: 'Thread' },
  { value: 'linkedin_post', label: 'LinkedIn Post' },
  { value: 'blog_post', label: 'Blog Post' },
  { value: 'article', label: 'Article' },
  { value: 'email', label: 'Email' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'essay', label: 'Essay' },
  { value: 'other', label: 'Other' },
] as const;

interface AddSampleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { content: string; content_type: string; source_type: string }) => void;
  isPending?: boolean;
}

export function AddSampleDialog({ open, onOpenChange, onSubmit, isPending }: AddSampleDialogProps) {
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState('blog_post');

  useEffect(() => {
    if (open) {
      setContent('');
      setContentType('blog_post');
    }
  }, [open]);

  function handleSubmit() {
    onSubmit({ content, content_type: contentType, source_type: 'paste' });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Writing Sample</DialogTitle>
          <DialogDescription>
            Paste a writing sample to help train your voice clone.
          </DialogDescription>
        </DialogHeader>

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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={content.trim() === '' || isPending}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
