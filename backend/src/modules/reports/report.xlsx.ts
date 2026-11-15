import ExcelJS from 'exceljs';

import type { ReportData } from './report.rows.js';

const COLUMN_WIDTHS = [6, 12, 40, 14, 14, 45, 40, 22];
const HEADERS = [
  'No',
  'Tanggal',
  'Rencana Aksi',
  'Target',
  'Realisasi',
  'Bukti Dukung',
  'Link',
  'Kategori',
];
const LAST_COLUMN = HEADERS.length;

const thinBorder = {
  top: { style: 'thin' as const },
  left: { style: 'thin' as const },
  bottom: { style: 'thin' as const },
  right: { style: 'thin' as const },
};

export async function buildReportXlsx(report: ReportData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ARKANA';

  const sheet = workbook.addWorksheet('Rekap Kinerja', {
    pageSetup: { paperSize: 9, orientation: 'landscape' },
  });
  sheet.columns = COLUMN_WIDTHS.map((width) => ({ width }));

  const titleRow = sheet.addRow([`${report.title} — ${report.userName}`]);
  sheet.mergeCells(titleRow.number, 1, titleRow.number, LAST_COLUMN);
  titleRow.getCell(1).font = { bold: true, size: 14 };

  const metaRow = sheet.addRow([`Periode: ${report.periodLabel} · Dicetak: ${report.generatedAt}`]);
  sheet.mergeCells(metaRow.number, 1, metaRow.number, LAST_COLUMN);
  metaRow.getCell(1).font = { size: 10, color: { argb: 'FF525252' } };

  sheet.addRow([]);

  const headerRow = sheet.addRow(HEADERS);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE4E4E7' } };
    cell.border = thinBorder;
  });

  for (const row of report.rows) {
    const excelRow = sheet.addRow([
      row.no,
      row.date,
      row.actionPlan,
      row.target ?? '',
      row.realisasi ?? '',
      row.evidence,
      { text: row.link, hyperlink: row.link },
      row.category,
    ]);

    excelRow.eachCell((cell) => {
      cell.alignment = { vertical: 'top', wrapText: true };
      cell.border = thinBorder;
    });
  }

  const headerNumber = headerRow.number;
  sheet.autoFilter = {
    from: { row: headerNumber, column: 1 },
    to: { row: headerNumber, column: LAST_COLUMN },
  };
  sheet.views = [{ state: 'frozen', ySplit: headerNumber }];

  const buffer = await workbook.xlsx.writeBuffer();

  return Buffer.from(buffer);
}
