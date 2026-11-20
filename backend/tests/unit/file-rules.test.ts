import { describe, expect, it } from 'vitest';

import {
  ARCHIVE_QUOTA_BYTES,
  MAX_FILE_BYTES,
  canonicalMimeType,
  extensionOf,
  isAllowedUpload,
  isHeic,
  isPreviewable,
} from '../../src/lib/file-rules';

describe('extensionOf', () => {
  it('mengambil ekstensi terakhir dalam huruf kecil', () => {
    expect(extensionOf('Laporan.PDF')).toBe('pdf');
    expect(extensionOf('arsip.tar.GZ')).toBe('gz');
    expect(extensionOf('foto.jpeg')).toBe('jpeg');
  });

  it('mengembalikan null bila tidak ada ekstensi', () => {
    expect(extensionOf('tanpa-ekstensi')).toBeNull();
    expect(extensionOf('folder/nama.dengan/titik')).toBeNull();
  });
});

describe('canonicalMimeType', () => {
  it('memetakan ekstensi yang didukung', () => {
    expect(canonicalMimeType('jpg')).toBe('image/jpeg');
    expect(canonicalMimeType('docx')).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    expect(canonicalMimeType('heic')).toBe('image/heic');
  });

  it('menolak ekstensi di luar daftar', () => {
    expect(canonicalMimeType('exe')).toBeNull();
    expect(canonicalMimeType('svg')).toBeNull();
  });
});

describe('isAllowedUpload', () => {
  it('menerima MIME yang sesuai dengan ekstensi', () => {
    expect(isAllowedUpload('pdf', 'application/pdf')).toBe(true);
    expect(isAllowedUpload('png', 'image/png')).toBe(true);
  });

  it('menerima alias image/jpg untuk JPEG', () => {
    expect(isAllowedUpload('jpeg', 'image/jpg')).toBe(true);
    expect(isAllowedUpload('jpg', 'image/jpg')).toBe(true);
  });

  it('menolak MIME yang tidak sesuai atau ekstensi tak dikenal', () => {
    expect(isAllowedUpload('pdf', 'image/png')).toBe(false);
    expect(isAllowedUpload('png', 'image/jpg')).toBe(false);
    expect(isAllowedUpload('exe', 'application/pdf')).toBe(false);
  });
});

describe('preview dan HEIC', () => {
  it('menandai gambar dan PDF sebagai previewable', () => {
    expect(isPreviewable('image/jpeg')).toBe(true);
    expect(isPreviewable('application/pdf')).toBe(true);
    expect(isPreviewable('image/heif')).toBe(true);
  });

  it('menolak dokumen kantor sebagai previewable', () => {
    expect(isPreviewable('application/msword')).toBe(false);
    expect(isPreviewable('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe(
      false,
    );
  });

  it('mengenali HEIC dan HEIF', () => {
    expect(isHeic('image/heic')).toBe(true);
    expect(isHeic('image/heif')).toBe(true);
    expect(isHeic('image/jpeg')).toBe(false);
  });
});

describe('batas file', () => {
  it('memakai 5 MB per file dan kuota arsip 1 GB', () => {
    expect(MAX_FILE_BYTES).toBe(5 * 1024 * 1024);
    expect(ARCHIVE_QUOTA_BYTES).toBe(1024 * 1024 * 1024);
  });
});
