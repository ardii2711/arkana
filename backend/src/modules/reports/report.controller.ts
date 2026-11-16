import type { RequestHandler } from 'express';

import { logger } from '../../lib/logger.js';
import { ApiError } from '../../utils/api-error.js';
import { sendSuccess } from '../../utils/api-response.js';
import { currentUser } from '../../utils/current-user.js';
import { createReportPdf } from './report.pdf.js';
import type { ReportExportQuery, ReportQuery } from './report.schema.js';
import { buildReport } from './report.service.js';
import { buildReportXlsx } from './report.xlsx.js';

const FORMAT_META = {
  xlsx: { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  pdf: { contentType: 'application/pdf' },
} as const;

function fileName(query: ReportExportQuery, from: string, to: string): string {
  const range = from === to ? from : `${from}_${to}`;

  return `rekap-kinerja-${range}.${query.format}`;
}

export const getReportHandler: RequestHandler = async (req, res) => {
  const query = res.locals.input.query as ReportQuery;

  sendSuccess(res, await buildReport(currentUser(req), query));
};

export const exportReportHandler: RequestHandler = async (req, res) => {
  const query = res.locals.input.query as ReportExportQuery;
  const report = await buildReport(currentUser(req), query);
  const meta = FORMAT_META[query.format];

  if (query.format === 'pdf') {
    const doc = createReportPdf(report);

    res.setHeader('Content-Type', meta.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName(query, report.from, report.to)}"`,
    );
    doc.on('error', (error) => {
      logger.error({ err: error }, 'Gagal membuat laporan PDF');
      res.destroy(error);
    });
    doc.pipe(res);
    doc.end();

    return;
  }

  let buffer: Buffer;

  try {
    buffer = await buildReportXlsx(report);
  } catch (error) {
    logger.error({ err: error }, 'Gagal membuat laporan XLSX');
    throw new ApiError(500, 'EXPORT_FAILED', 'Gagal membuat berkas laporan');
  }

  res.setHeader('Content-Type', meta.contentType);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${fileName(query, report.from, report.to)}"`,
  );
  res.send(buffer);
};
