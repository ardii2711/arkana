import { prisma } from '../../lib/prisma.js';
import { dateKey } from '../../lib/wita.js';
import { ApiError } from '../../utils/api-error.js';
import type { FileContent } from '../../utils/file-response.js';
import { fileSelect, getPublicWorkLogFileContent, toFileItem } from './work-log-file.service.js';

export async function getPublicWorkLog(publicToken: string) {
  const workLog = await prisma.workLog.findUnique({
    where: { publicToken },
    select: {
      name: true,
      activityDate: true,
      category: true,
      description: true,
      output: true,
      files: { select: fileSelect, orderBy: { createdAt: 'asc' } },
    },
  });

  if (!workLog) {
    throw new ApiError(404, 'NOT_FOUND', 'Tautan bukti dukung tidak ditemukan');
  }

  return {
    ...workLog,
    activityDate: dateKey(workLog.activityDate),
    files: workLog.files.map(toFileItem),
  };
}

export function getPublicFileContent(
  publicToken: string,
  fileId: string,
  wantsInline: boolean,
): Promise<FileContent> {
  return getPublicWorkLogFileContent(publicToken, fileId, wantsInline);
}
