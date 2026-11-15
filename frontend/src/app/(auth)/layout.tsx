import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="bg-muted/30 relative flex min-h-svh items-center justify-center overflow-hidden p-6 sm:p-10">
      <div
        aria-hidden="true"
        className="[background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:56px_56px] pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="bg-primary/5 pointer-events-none absolute -top-48 left-1/2 size-[32rem] -translate-x-1/2 rounded-full blur-3xl"
      />
      <div className="relative w-full max-w-md min-w-0">{children}</div>
    </main>
  );
}
