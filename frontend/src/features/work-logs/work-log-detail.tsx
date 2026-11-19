'use client';

import {
  ArrowLeftIcon,
  EllipsisIcon,
  ExternalLinkIcon,
  LinkIcon,
  PencilIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from 'lucide-react';
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
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/api-error';
import { formatDate } from '@/lib/date';
import { WORK_CATEGORY_LABELS } from '@/lib/work-category';
import { WorkLogEvidence } from './work-log-evidence';
import { WorkLogEvidenceBadge } from './work-log-evidence-badge';
import { WorkLogFormDialog } from './work-log-form-dialog';
import { useDeleteWorkLog, useWorkLog } from './use-work-logs';

export function WorkLogDetail({ id }: { id: string }) {
  const router = useRouter();
  const query = useWorkLog(id);
  const remove = useDeleteWorkLog(id);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
            <time dateTime={workLog.activityDate}>{formatDate(workLog.activityDate)}</time>
            <WorkLogEvidenceBadge fileCount={workLog.fileCount} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => void handleCopyLink()}>
            <LinkIcon />
            Salin tautan
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/p/evidence/${workLog.publicToken}`} target="_blank" rel="noreferrer">
              <ExternalLinkIcon />
              Buka tautan
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Aksi kegiatan">
                <EllipsisIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                <PencilIcon aria-hidden="true" />
                Ubah
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                <Trash2Icon aria-hidden="true" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
        </CardContent>
      </Card>

      {editOpen ? <WorkLogFormDialog workLog={workLog} onOpenChange={setEditOpen} /> : null}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kegiatan?</AlertDialogTitle>
            <AlertDialogDescription>
              Kegiatan beserta bukti dukungnya akan dihapus permanen dan tautan publiknya tidak
              dapat dibuka lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction disabled={remove.isPending} onClick={handleDelete}>
              {remove.isPending ? 'Menghapus…' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <WorkLogEvidence workLogId={id} />
    </div>
  );
}
