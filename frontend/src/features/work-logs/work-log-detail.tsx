'use client';

import { ArrowLeftIcon, LinkIcon, PencilIcon, Trash2Icon, TriangleAlertIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/api-error';
import { WORK_CATEGORY_LABELS } from './work-log.api';
import { formatActivityDate } from './work-log.format';
import { WorkLogEvidence } from './work-log-evidence';
import { WorkLogFormDialog } from './work-log-form-dialog';
import { useDeleteWorkLog, useWorkLog } from './use-work-logs';

export function WorkLogDetail({ id }: { id: string }) {
  const router = useRouter();
  const query = useWorkLog(id);
  const remove = useDeleteWorkLog(id);
  const [editOpen, setEditOpen] = useState(false);

  if (query.isPending) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="w-full space-y-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/kegiatan">
            <ArrowLeftIcon />
            Kembali
          </Link>
        </Button>
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertDescription>{getErrorMessage(query.error)}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => query.refetch()}>
          Coba lagi
        </Button>
      </div>
    );
  }

  const workLog = query.data;

  function handleDelete() {
    remove.mutate(undefined, {
      onSuccess: () => {
        toast.success('Kegiatan dihapus.');
        router.replace('/kegiatan');
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/p/evidence/${workLog.publicToken}`,
      );
      toast.success('Tautan publik disalin.');
    } catch {
      toast.error('Tautan gagal disalin.');
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/kegiatan">
              <ArrowLeftIcon />
              Kembali
            </Link>
          </Button>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{workLog.name}</h1>
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary">{WORK_CATEGORY_LABELS[workLog.category]}</Badge>
            <time dateTime={workLog.activityDate}>{formatActivityDate(workLog.activityDate)}</time>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => void handleCopyLink()}>
            <LinkIcon />
            Salin tautan
          </Button>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <PencilIcon />
            Ubah
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={remove.isPending}>
                <Trash2Icon />
                Hapus
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus kegiatan?</AlertDialogTitle>
                <AlertDialogDescription>
                  Kegiatan beserta bukti dukungnya akan dihapus permanen dan tautan publiknya tidak
                  dapat dibuka lagi.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction disabled={remove.isPending} onClick={handleDelete}>
                  {remove.isPending ? 'Menghapus…' : 'Hapus'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-6">
          <section className="space-y-2">
            <h2 className="text-sm font-medium">Uraian pekerjaan</h2>
            <p className="text-sm whitespace-pre-line">{workLog.description}</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-medium">Hasil atau output</h2>
            <p className="text-sm whitespace-pre-line">{workLog.output}</p>
          </section>

          {workLog.target || workLog.realisasi ? (
            <section className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <h2 className="text-sm font-medium">Target</h2>
                <p className="text-sm">{workLog.target || '-'}</p>
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-medium">Realisasi</h2>
                <p className="text-sm">{workLog.realisasi || '-'}</p>
              </div>
            </section>
          ) : null}
        </CardContent>
      </Card>

      {editOpen ? <WorkLogFormDialog workLog={workLog} onOpenChange={setEditOpen} /> : null}

      <WorkLogEvidence workLogId={id} />
    </div>
  );
}
