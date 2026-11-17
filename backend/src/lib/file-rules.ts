export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ARCHIVE_QUOTA_BYTES = 1024 * 1024 * 1024;

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

const PREVIEWABLE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
]);

export function extensionOf(filename: string): string | null {
  const match = /\.([a-z0-9]+)$/i.exec(filename);
  return match?.[1]?.toLowerCase() ?? null;
}

export function canonicalMimeType(extension: string): string | null {
  return MIME_BY_EXTENSION[extension] ?? null;
}

export function isAllowedUpload(extension: string, clientMimeType: string): boolean {
  const mimeType = canonicalMimeType(extension);

  if (!mimeType) {
    return false;
  }

  return (
    clientMimeType === mimeType || (mimeType === 'image/jpeg' && clientMimeType === 'image/jpg')
  );
}

export function isPreviewable(mimeType: string): boolean {
  return PREVIEWABLE_MIME_TYPES.has(mimeType);
}

export function isHeic(mimeType: string): boolean {
  return mimeType === 'image/heic' || mimeType === 'image/heif';
}
