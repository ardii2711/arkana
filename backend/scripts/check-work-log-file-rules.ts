import assert from 'node:assert/strict';

import {
  MAX_FILE_BYTES,
  MAX_FILES_PER_WORK_LOG,
  MAX_TOTAL_BYTES_PER_WORK_LOG,
  canonicalMimeType,
  extensionOf,
  isAllowedUpload,
  isHeic,
  isPreviewable,
} from '../src/modules/work-logs/work-log-file.rules.js';

assert.equal(MAX_FILE_BYTES, 5 * 1024 * 1024);
assert.equal(MAX_FILES_PER_WORK_LOG, 10);
assert.equal(MAX_TOTAL_BYTES_PER_WORK_LOG, 50 * 1024 * 1024);

assert.equal(extensionOf('Bukti Rapat.PDF'), 'pdf');
assert.equal(extensionOf('foto.heic'), 'heic');
assert.equal(extensionOf('tanpa-ekstensi'), null);
assert.equal(extensionOf('arsip.tar.gz'), 'gz');

assert.equal(canonicalMimeType('jpg'), 'image/jpeg');
assert.equal(canonicalMimeType('exe'), null);

assert.equal(isAllowedUpload('jpg', 'image/jpeg'), true);
assert.equal(isAllowedUpload('jpg', 'image/jpg'), true);
assert.equal(isAllowedUpload('jpg', 'image/png'), false);
assert.equal(isAllowedUpload('exe', 'application/octet-stream'), false);
assert.equal(
  isAllowedUpload(
    'docx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ),
  true,
);

assert.equal(isPreviewable('image/png'), true);
assert.equal(isPreviewable('application/pdf'), true);
assert.equal(isPreviewable('application/msword'), false);

assert.equal(isHeic('image/heic'), true);
assert.equal(isHeic('image/jpeg'), false);

console.log('work-log-file rules: OK');
