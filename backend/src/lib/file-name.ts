/** Buang ekstensi terakhir dari nama file, mis. "SK CPNS.pdf" -> "SK CPNS". */
export function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '');
}
