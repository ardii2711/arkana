import Link from 'next/link';
import type { ReactNode } from 'react';

import { BrandLogo } from '@/components/shared/brand-logo';
import { ThemeToggle } from '@/components/shared/theme-toggle';

import { PublicSessionCta } from './public-session-cta';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex h-15 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" aria-label="ARKANA" className="flex items-center">
            <BrandLogo variant="lockup" iconClassName="h-7.5" wordmarkClassName="h-4" />
          </Link>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <PublicSessionCta size="sm" />
          </div>
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
