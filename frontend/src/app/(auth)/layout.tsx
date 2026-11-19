import type { ReactNode } from 'react';

import { BrandLogo } from '@/components/shared/brand-logo';
import { ThemeToggle } from '@/components/shared/theme-toggle';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="bg-background relative flex min-h-svh items-center justify-center overflow-hidden p-4 sm:p-8">
      <div
        aria-hidden="true"
        className="bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[56px_56px] pointer-events-none absolute inset-0 opacity-50 mask-[radial-gradient(ellipse_at_center,black,transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-48 left-1/2 size-128 -translate-x-1/2 rounded-full bg-[#14bba6]/10 blur-3xl"
      />

      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      <div className="relative mx-auto grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div className="hidden items-center justify-center rounded-3xl bg-[#0B2D52] p-10 lg:flex">
          <BrandLogo variant="lockup" tone="dark" iconClassName="h-14" wordmarkClassName="h-9" />
        </div>

        <div className="flex w-full flex-col items-center">
          <div className="mb-6 lg:hidden">
            <BrandLogo variant="lockup" iconClassName="h-8" wordmarkClassName="h-6" />
          </div>
          <div className="w-full max-w-md min-w-0">{children}</div>
        </div>
      </div>
    </main>
  );
}
