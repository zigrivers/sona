import { Clipboard, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { copyToClipboard, exportAsPdf, exportAsTxt, formatContentForExport } from '@/lib/export';
import type { ContentResponse } from '@/types/api';

interface ExportMenuProps {
  items: ContentResponse[];
}

export function ExportMenu({ items }: ExportMenuProps) {
  async function handleCopy() {
    const text = formatContentForExport(items);
    await copyToClipboard(text);
    toast.success('Copied to clipboard');
  }

  function handleExportTxt() {
    exportAsTxt(items);
    toast.success('Downloaded as text file');
  }

  async function handleExportPdf() {
    await exportAsPdf(items);
    toast.success('Downloaded as PDF');
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="size-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCopy}>
          <Clipboard className="size-4" />
          Copy to clipboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportTxt}>
          <FileText className="size-4" />
          Export as text
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPdf}>
          <Download className="size-4" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
