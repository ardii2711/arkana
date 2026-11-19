import Link from 'next/link';
import type { ReactNode } from 'react';

import { PublicSessionCta } from './public-session-cta';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground font-heading flex size-8 items-center justify-center rounded-lg text-sm font-semibold">
              A
            </span>
            <span className="font-heading font-semibold">ARKANA</span>
          </Link>
          <PublicSessionCta size="sm" />
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>ARKANA — Arsip, Rekam Kinerja, dan Agenda.</span>
          <span>© {new Date().getFullYear()} ARKANA</span>
        </div>
      </footer>
    </div>
  );
}
