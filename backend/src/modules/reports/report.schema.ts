import { z } from 'zod';

import { WorkCategory } from '../../generated/prisma/enums.js';

const period = z.enum(['daily', 'weekly', 'monthly', 'yearly', 'custom']);

export const reportExportQuerySchema = z
  .object({
    format: z.enum(['xlsx', 'pdf']).default('xlsx'),
    period,
    date: z.iso.date().optional(),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
    category: z.enum(WorkCategory).optional(),
    groupBy: z.enum(['category']).optional(),
    onlyWithEvidence: z.enum(['true', 'false']).optional(),
  })
  .superRefine((query, ctx) => {
    if (query.period === 'custom') {
      if (!query.from) {
        ctx.addIssue({ code: 'custom', path: ['from'], message: 'from wajib untuk period=custom' });
      }
      if (!query.to) {
        ctx.addIssue({ code: 'custom', path: ['to'], message: 'to wajib untuk period=custom' });
      }
      if (query.date) {
        ctx.addIssue({
          code: 'custom',
          path: ['date'],
          message: 'date tidak dipakai untuk period=custom',
        });
      }
    } else if (query.from || query.to) {
      ctx.addIssue({
        code: 'custom',
        path: ['from'],
        message: 'from/to hanya untuk period=custom',
      });
    }

    if (query.from && query.to && query.from > query.to) {
      ctx.addIssue({ code: 'custom', path: ['from'], message: 'Rentang tanggal tidak valid' });
    }
  });

export type ReportPeriod = z.infer<typeof period>;
export type ReportExportQuery = z.infer<typeof reportExportQuerySchema>;
