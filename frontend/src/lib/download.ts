export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  // Beri waktu browser memulai unduhan sebelum blob dilepas.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
