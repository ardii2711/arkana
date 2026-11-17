export const ALLOWED_FILE_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'heic',
  'heif',
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
];

export const FILE_ACCEPT = ALLOWED_FILE_EXTENSIONS.map((extension) => `.${extension}`).join(',');

export function fileExtension(name: string) {
  return /\.([a-z0-9]+)$/i.exec(name)?.[1]?.toUpperCase() ?? 'FILE';
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

export function isAllowedFile(file: File) {
  return ALLOWED_FILE_EXTENSIONS.includes(fileExtension(file.name).toLowerCase());
}
