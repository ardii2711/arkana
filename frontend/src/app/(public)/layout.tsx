import Link from 'next/link';
import type { ReactNode } from 'react';

import { BrandLogo } from '@/components/shared/brand-logo';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { env } from '@/config/env';

import { PublicSessionCta } from './public-session-cta';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex h-15 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" aria-label="ARKANA" className="flex items-center">
            <BrandLogo variant="lockup" iconClassName="h-7" wordmarkClassName="h-3.5" />
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
          <span>Arsip, Rekam Kinerja, dan Agenda.</span>
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
            <a
              href={`mailto:${env.NEXT_PUBLIC_CONTACT_EMAIL}`}
              className="hover:text-foreground transition-colors"
            >
              {env.NEXT_PUBLIC_CONTACT_EMAIL}
            </a>
            <span>© {new Date().getFullYear()} ARKANA</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
