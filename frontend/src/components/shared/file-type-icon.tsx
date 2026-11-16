import { FileIcon, FileImageIcon, FileTextIcon } from 'lucide-react';

export function FileTypeIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) return <FileImageIcon aria-hidden="true" />;
  if (mimeType === 'application/pdf') return <FileTextIcon aria-hidden="true" />;
  return <FileIcon aria-hidden="true" />;
}
