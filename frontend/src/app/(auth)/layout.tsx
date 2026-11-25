import { ArrowLeftIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { BrandLogo } from '@/components/shared/brand-logo';
import { ThemeToggle } from '@/components/shared/theme-toggle';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 py-20 sm:px-6">
      <div
        aria-hidden="true"
        className="bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] pointer-events-none absolute inset-0 bg-size-[56px_56px] opacity-40 mask-[radial-gradient(ellipse_at_center,black,transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="bg-primary/5 pointer-events-none absolute -top-40 left-1/2 size-96 -translate-x-1/2 rounded-full blur-3xl"
      />

      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeftIcon aria-hidden="true" className="size-4" />
          Beranda
        </Link>
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md rounded-2xl border p-6 sm:p-8">
        <BrandLogo variant="lockup" className="mb-6" iconClassName="h-8" wordmarkClassName="h-4" />
        {children}
      </div>
    </div>
  );
}
