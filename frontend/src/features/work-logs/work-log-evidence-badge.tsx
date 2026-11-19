'use client';

import { PaperclipIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

export function WorkLogEvidenceBadge({ fileCount }: { fileCount: number }) {
  if (fileCount === 0) {
    return (
      <Badge variant="outline" className="gap-1 text-amber-600 dark:text-amber-400">
        <PaperclipIcon aria-hidden="true" />
        Belum ada bukti
      </Badge>
    );
  }

  return (
    <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
      <PaperclipIcon aria-hidden="true" className="size-3.5" />
      {fileCount} bukti
    </span>
  );
}
