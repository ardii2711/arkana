import PDFDocument from 'pdfkit';

import type { ReportData, ReportRow } from './report.rows.js';

const PAGE_MARGIN = 30;
const FONT_SIZE = 8;
const CELL_PADDING = 3;
const HEADER_HEIGHT = 18;
const MIN_ROW_HEIGHT = 16;

const COLUMNS: { key: keyof ReportRow; label: string; width: number }[] = [
  { key: 'no', label: 'No', width: 26 },
  { key: 'date', label: 'Tanggal', width: 58 },
  { key: 'actionPlan', label: 'Rencana Aksi', width: 168 },
  { key: 'target', label: 'Target', width: 58 },
  { key: 'realisasi', label: 'Realisasi', width: 58 },
  { key: 'evidence', label: 'Bukti Dukung', width: 168 },
  { key: 'link', label: 'Link', width: 146 },
  { key: 'category', label: 'Kategori', width: 82 },
];

const TABLE_WIDTH = COLUMNS.reduce((total, column) => total + column.width, 0);

function cellText(row: ReportRow, key: keyof ReportRow): string {
  const value = row[key];

  return value === null || value === undefined || value === '' ? '-' : String(value);
}

function drawTableHeader(doc: PDFKit.PDFDocument, y: number): number {
  doc.rect(PAGE_MARGIN, y, TABLE_WIDTH, HEADER_HEIGHT).fill('#E4E4E7');
  doc.font('Helvetica-Bold').fontSize(FONT_SIZE).fillColor('#18181B');

  let x = PAGE_MARGIN;
  for (const column of COLUMNS) {
    doc.text(column.label, x + CELL_PADDING, y + 5, { width: column.width - CELL_PADDING * 2 });
    x += column.width;
  }

  return y + HEADER_HEIGHT;
}

function measureRow(doc: PDFKit.PDFDocument, row: ReportRow): number {
  doc.font('Helvetica').fontSize(FONT_SIZE);

  const textHeight = COLUMNS.reduce((height, column) => {
    return Math.max(
      height,
      doc.heightOfString(cellText(row, column.key), { width: column.width - CELL_PADDING * 2 }),
    );
  }, 0);

  return Math.max(textHeight + CELL_PADDING * 2, MIN_ROW_HEIGHT);
}

function drawRow(doc: PDFKit.PDFDocument, row: ReportRow, y: number, height: number): void {
  let x = PAGE_MARGIN;

  for (const column of COLUMNS) {
    doc
      .font('Helvetica')
      .fontSize(FONT_SIZE)
      .fillColor(column.key === 'link' ? '#1D4ED8' : '#18181B')
      .text(cellText(row, column.key), x + CELL_PADDING, y + CELL_PADDING, {
        width: column.width - CELL_PADDING * 2,
        height: height - CELL_PADDING * 2,
        ellipsis: true,
      });

    doc.rect(x, y, column.width, height).lineWidth(0.5).strokeColor('#D4D4D8').stroke();
    x += column.width;
  }
}

export function createReportPdf(report: ReportData) {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: PAGE_MARGIN });

  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor('#18181B')
    .text(`${report.title} — ${report.userName}`, PAGE_MARGIN, PAGE_MARGIN);

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#525252')
    .text(
      `Periode: ${report.periodLabel} · Dicetak: ${report.generatedAt}`,
      PAGE_MARGIN,
      doc.y + 4,
    );

  let y = drawTableHeader(doc, doc.y + 12);

  if (report.rows.length === 0) {
    doc
      .font('Helvetica')
      .fontSize(FONT_SIZE)
      .fillColor('#525252')
      .text('Tidak ada kegiatan pada periode ini.', PAGE_MARGIN + CELL_PADDING, y + CELL_PADDING);

    return doc;
  }

  for (const row of report.rows) {
    const height = measureRow(doc, row);

    if (y + height > doc.page.height - PAGE_MARGIN) {
      doc.addPage();
      y = drawTableHeader(doc, PAGE_MARGIN);
    }

    drawRow(doc, row, y, height);
    y += height;
  }

  return doc;
}
