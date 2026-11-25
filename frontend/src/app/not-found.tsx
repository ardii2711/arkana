import { ArrowLeftIcon, LogInIcon } from 'lucide-react';
import Link from 'next/link';

import { BrandLogo } from '@/components/shared/brand-logo';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="bg-background relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 py-16">
      <div
        aria-hidden="true"
        className="bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] pointer-events-none absolute inset-0 bg-size-[56px_56px] opacity-40 mask-[radial-gradient(ellipse_at_center,black,transparent_70%)]"
      />

      <div className="bg-background/80 relative flex w-full max-w-md flex-col items-center rounded-2xl border p-8 text-center backdrop-blur sm:p-10">
        <BrandLogo variant="lockup" iconClassName="h-8" wordmarkClassName="h-4" />

        <p className="text-muted-foreground mt-8 text-xs font-semibold tracking-[0.2em] uppercase">
          Error 404
        </p>
        <h1 className="font-heading mt-2 text-2xl font-semibold tracking-tight">
          Halaman tidak ditemukan
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Alamat yang Anda buka tidak tersedia atau sudah dipindahkan.
        </p>

        <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/">
              <ArrowLeftIcon aria-hidden="true" />
              Kembali ke beranda
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">
              <LogInIcon aria-hidden="true" />
              Masuk
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
