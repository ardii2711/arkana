import type { Response } from 'express';
import type { Readable } from 'node:stream';

import { stripExtension } from '../lib/file-name.js';

export interface FileContent {
  body: Readable | Buffer;
  contentType: string;
  size: number;
  originalName: string;
  inline: boolean;
  converted: boolean;
}

function contentDisposition(type: 'inline' | 'attachment', filename: string): string {
  const fallback = filename.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  return `${type}; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

function previewName(filename: string): string {
  return `${stripExtension(filename)}.jpg`;
}

export function sendFileContent(res: Response, content: FileContent): void {
  res.setHeader('Content-Type', content.contentType);
  res.setHeader('Content-Length', String(content.size));
  res.setHeader(
    'Content-Disposition',
    contentDisposition(
      content.inline ? 'inline' : 'attachment',
      content.converted ? previewName(content.originalName) : content.originalName,
    ),
  );
  res.setHeader('Cache-Control', 'private, max-age=300');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (Buffer.isBuffer(content.body)) {
    res.end(content.body);
    return;
  }

  content.body.on('error', () => {
    res.destroy();
  });
  content.body.pipe(res);
}
