import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { dateOnlyUtc } from '../../lib/wita.js';
import type { AuthUser } from '../../types/auth.js';
import { formatDateTimeWita, resolveRange } from './report.period.js';
import { CATEGORY_LABELS, summarizeEvidence, type ReportData } from './report.rows.js';
import type { ReportQuery } from './report.schema.js';

function evidenceUrl(publicToken: string): string {
  const base = (env.PUBLIC_WEB_URL ?? env.CORS_ORIGIN).replace(/\/+$/, '');

  return `${base}/p/evidence/${publicToken}`;
}

export async function buildReport(user: AuthUser, query: ReportQuery): Promise<ReportData> {
  const range = resolveRange(query);

  const workLogs = await prisma.workLog.findMany({
    where: {
      userId: user.id,
      activityDate: { gte: dateOnlyUtc(range.from), lte: dateOnlyUtc(range.to) },
      ...(query.category && { category: query.category }),
      ...(query.onlyWithEvidence === 'true' && { files: { some: {} } }),
    },
    select: {
      activityDate: true,
      name: true,
      target: true,
      realisasi: true,
      category: true,
      publicToken: true,
      files: { select: { originalName: true }, orderBy: { createdAt: 'asc' } },
    },
    orderBy:
      query.groupBy === 'category'
        ? [{ category: 'asc' }, { activityDate: 'asc' }, { createdAt: 'asc' }]
        : [{ activityDate: 'asc' }, { createdAt: 'asc' }],
  });

  return {
    title: 'Rekap Kinerja',
    userName: user.name,
    periodLabel: range.label,
    from: range.from,
    to: range.to,
    generatedAt: formatDateTimeWita(),
    rows: workLogs.map((workLog, index) => ({
      no: index + 1,
      date: workLog.activityDate.toISOString().slice(0, 10),
      actionPlan: workLog.name,
      target: workLog.target,
      realisasi: workLog.realisasi,
      evidence: summarizeEvidence(workLog.files.map((file) => file.originalName)),
      link: evidenceUrl(workLog.publicToken),
      category: CATEGORY_LABELS[workLog.category],
    })),
  };
}
