import { Upload } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

import { useCreateSample, useUploadSample } from '@/hooks/use-samples';
import { ApiError } from '@/types/errors';

import { TextPreview } from './TextPreview';

const ACCEPTED_TYPES: Record<string, string[]> = {
  'text/plain': ['.txt'],
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

interface FileUploadTabProps {
  cloneId: string;
  onSuccess: () => void;
}

export function FileUploadTab({ cloneId, onSuccess }: FileUploadTabProps) {
  const [preview, setPreview] = useState<{ content: string; filename: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateSample(cloneId);
  const uploadMutation = useUploadSample(cloneId);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setError(null);
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.name.endsWith('.txt') || file.type === 'text/plain') {
        const text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsText(file);
        });
        setPreview({ content: text, filename: file.name });
      } else {
        // .pdf / .docx — upload directly
        const formData = new FormData();
        formData.append('file', file);
        formData.append('content_type', 'blog_post');

        uploadMutation.mutate(formData, {
          onSuccess: () => {
            toast.success(`Uploaded ${file.name}`);
            onSuccess();
          },
          onError: (err) => {
            const message = err instanceof ApiError ? err.detail : 'Upload failed';
            setError(message);
            toast.error(message);
          },
        });
      }
    },
    [uploadMutation, onSuccess]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    multiple: false,
  });

  function handlePreviewSubmit(data: { content: string; content_type: string }) {
    if (!preview) return;
    createMutation.mutate(
      {
        content: data.content,
        content_type: data.content_type,
        source_type: 'file',
        source_filename: preview.filename,
      },
      {
        onSuccess: () => {
          toast.success(`Added ${preview.filename}`);
          onSuccess();
        },
        onError: (err) => {
          const message = err instanceof ApiError ? err.detail : 'Failed to add sample';
          toast.error(message);
        },
      }
    );
  }

  function handleBack() {
    setPreview(null);
    setError(null);
  }

  if (preview) {
    return (
      <TextPreview
        initialContent={preview.content}
        sourceLabel={preview.filename}
        onSubmit={handlePreviewSubmit}
        onBack={handleBack}
        isPending={createMutation.isPending}
      />
    );
  }

  return (
    <div className="space-y-4">
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

      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
