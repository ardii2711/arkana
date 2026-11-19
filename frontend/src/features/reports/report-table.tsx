'use client';

import { ClipboardListIcon, CopyIcon, ExternalLinkIcon, FileTextIcon } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/date';
import type { ReportRow } from './report.api';

function Cell({ children }: { children: ReactNode }) {
  return <td className="border-b px-3 py-2 align-top">{children}</td>;
}

async function copyLink(href: string) {
  try {
    await navigator.clipboard.writeText(href);
    toast.success('Tautan publik disalin.');
  } catch {
    toast.error('Tautan gagal disalin.');
  }
}

function LinkActions({ href }: { href: string }) {
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Salin tautan"
        title="Salin tautan"
        onClick={() => void copyLink(href)}
      >
        <CopyIcon />
      </Button>
      <Button variant="ghost" size="icon-sm" asChild>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label="Buka tautan"
          title="Buka tautan"
        >
          <ExternalLinkIcon />
        </a>
      </Button>
    </div>
  );
}

function EmptyReport() {
  return (
    <Card className="border border-dashed ring-0">
      <CardContent className="flex min-h-48 flex-col items-center justify-center gap-4 py-10 text-center">
        <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-xl">
          <FileTextIcon aria-hidden="true" className="size-5" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">Belum ada kegiatan pada periode ini</p>
          <p className="text-muted-foreground max-w-sm text-sm">
            Pilih periode lain, lalu catat kegiatan pada menu Kegiatan.
          </p>
        </div>
        <Button asChild>
          <Link href="/kegiatan">
            <ClipboardListIcon />
            Catat kegiatan
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function DesktopRow({ row }: { row: ReportRow }) {
  return (
    <tr className="align-top">
      <Cell>{row.no}</Cell>
      <Cell>{formatDate(row.date)}</Cell>
      <Cell>{row.actionPlan}</Cell>
      <Cell>{row.target || '-'}</Cell>
      <Cell>{row.realisasi || '-'}</Cell>
      <Cell>
        <p className="line-clamp-2" title={row.evidence}>
          {row.evidence}
        </p>
      </Cell>
      <Cell>
        <LinkActions href={row.link} />
      </Cell>
      <Cell>
        <Badge variant="secondary">{row.category}</Badge>
      </Cell>
    </tr>
  );
}

function MobileCard({ row }: { row: ReportRow }) {
  return (
    <Card>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium">
            {row.no}. {row.actionPlan}
          </p>
          <Badge variant="secondary" className="shrink-0">
            {row.category}
          </Badge>
        </div>
        <p className="text-muted-foreground">{formatDate(row.date)}</p>
        <dl className="grid grid-cols-[6rem_minmax(0,1fr)] gap-x-2 gap-y-1">
          <dt className="text-muted-foreground">Target</dt>
          <dd>{row.target || '-'}</dd>
          <dt className="text-muted-foreground">Realisasi</dt>
          <dd>{row.realisasi || '-'}</dd>
          <dt className="text-muted-foreground">Bukti dukung</dt>
          <dd className="line-clamp-3 break-words">{row.evidence}</dd>
        </dl>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="button" variant="outline" size="sm" onClick={() => void copyLink(row.link)}>
            <CopyIcon />
            Salin tautan
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={row.link} target="_blank" rel="noreferrer">
              <ExternalLinkIcon />
              Buka tautan
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ReportTable({ rows }: { rows: ReportRow[] }) {
  if (rows.length === 0) {
    return <EmptyReport />;
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border lg:block">
        <table
          aria-label="Rekap kinerja kegiatan"
          className="w-full min-w-[64rem] border-collapse text-sm"
        >
          <thead>
            <tr className="bg-muted/50 text-muted-foreground text-left">
              <th scope="col" className="px-3 py-2 font-medium">
                No
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Tanggal
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Rencana Aksi
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Target
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Realisasi
              </th>
              <th scope="col" className="max-w-64 px-3 py-2 font-medium">
                Bukti Dukung
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Link
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Kategori
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <DesktopRow key={row.no} row={row} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 lg:hidden">
        {rows.map((row) => (
          <MobileCard key={row.no} row={row} />
        ))}
      </div>
    </>
  );
}
