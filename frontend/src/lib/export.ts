import { jsPDF } from 'jspdf';

import type { ContentResponse } from '@/types/api';
import { type PlatformKey, PLATFORMS } from '@/types/platforms';

function getPlatformLabel(platform: string): string {
  return PLATFORMS[platform as PlatformKey]?.label ?? platform;
}

function formatSingleItem(item: ContentResponse): string {
  const lines = [
    `Platform: ${getPlatformLabel(item.platform)}`,
    `Date: ${new Date(item.created_at).toLocaleDateString()}`,
    `Status: ${item.status}`,
    '',
    item.content_current,
  ];
  return lines.join('\n');
}

export function formatContentForExport(items: ContentResponse | ContentResponse[]): string {
  const arr = Array.isArray(items) ? items : [items];
  return arr.map(formatSingleItem).join('\n\n---\n\n');
}

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export function exportAsTxt(items: ContentResponse | ContentResponse[], filename?: string): void {
  const text = formatContentForExport(items);
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? 'content-export.txt';
  a.click();

  URL.revokeObjectURL(url);
}

export async function exportAsPdf(
  items: ContentResponse | ContentResponse[],
  filename?: string
): Promise<void> {
  const arr = Array.isArray(items) ? items : [items];
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];

    if (i > 0) {
      // Separator between items
      y += 10;
      if (y > 270) {
        doc.addPage();
        y = margin;
      }
      doc.setDrawColor(200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;
    }

    // Header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${getPlatformLabel(item.platform)} — ${item.status}`, margin, y);
    y += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128);
    doc.text(`Created: ${new Date(item.created_at).toLocaleDateString()}`, margin, y);
    y += 8;

    // Content
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    const lines = doc.splitTextToSize(item.content_current, maxWidth);
    for (const line of lines) {
      if (y > 280) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 5;
    }
  }

  doc.save(filename ?? 'content-export.pdf');
}
