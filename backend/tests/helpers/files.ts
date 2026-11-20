/** Byte PNG 1×1 untuk unggahan avatar dan bukti dukung pada test. */
export const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

export const PDF_BYTES = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n',
);

export function fileForm(fileName: string, mimeType: string, bytes: Buffer): FormData {
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: mimeType }), fileName);

  return form;
}
