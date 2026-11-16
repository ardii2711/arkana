'use client';

import { ExternalLinkIcon, FileTextIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatActivityDate } from '@/features/work-logs/work-log.format';
import type { ReportRow } from './report.api';

function Cell({ children }: { children: ReactNode }) {
  return <td className="border-b px-3 py-2 align-top">{children}</td>;
}

function LinkCell({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-primary inline-flex items-center gap-1 font-medium hover:underline"
    >
      Buka
      <ExternalLinkIcon className="size-3.5" />
    </a>
  );
}

function EmptyReport() {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <FileTextIcon className="text-muted-foreground size-8" />
      <p className="font-medium">Belum ada kegiatan pada periode ini</p>
      <p className="text-muted-foreground text-sm">
        Ubah periode atau filter, lalu catat kegiatan pada menu Kegiatan.
      </p>
    </div>
  );
}

export function ReportTable({ rows }: { rows: ReportRow[] }) {
  if (rows.length === 0) {
    return <EmptyReport />;
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <table className="w-full min-w-[64rem] border-collapse text-sm">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground text-left">
              <th className="px-3 py-2 font-medium">No</th>
              <th className="px-3 py-2 font-medium">Tanggal</th>
              <th className="px-3 py-2 font-medium">Rencana Aksi</th>
              <th className="px-3 py-2 font-medium">Target</th>
              <th className="px-3 py-2 font-medium">Realisasi</th>
              <th className="px-3 py-2 font-medium">Bukti Dukung</th>
              <th className="px-3 py-2 font-medium">Link</th>
              <th className="px-3 py-2 font-medium">Kategori</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.no} className="align-top">
                <Cell>{row.no}</Cell>
                <Cell>{formatActivityDate(row.date)}</Cell>
                <Cell>{row.actionPlan}</Cell>
                <Cell>{row.target || '-'}</Cell>
                <Cell>{row.realisasi || '-'}</Cell>
                <Cell>{row.evidence}</Cell>
                <Cell>
                  <LinkCell href={row.link} />
                </Cell>
                <Cell>
                  <Badge variant="secondary">{row.category}</Badge>
                </Cell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <Card key={row.no}>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">
                  {row.no}. {row.actionPlan}
                </p>
                <Badge variant="secondary" className="shrink-0">
                  {row.category}
                </Badge>
              </div>
              <p className="text-muted-foreground">{formatActivityDate(row.date)}</p>
              <dl className="grid grid-cols-[6rem_minmax(0,1fr)] gap-x-2 gap-y-1">
                <dt className="text-muted-foreground">Target</dt>
                <dd>{row.target || '-'}</dd>
                <dt className="text-muted-foreground">Realisasi</dt>
                <dd>{row.realisasi || '-'}</dd>
                <dt className="text-muted-foreground">Bukti dukung</dt>
                <dd className="break-words">{row.evidence}</dd>
                <dt className="text-muted-foreground">Link</dt>
                <dd>
                  <LinkCell href={row.link} />
                </dd>
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
