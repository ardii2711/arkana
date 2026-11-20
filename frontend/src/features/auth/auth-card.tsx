import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type AuthCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <section className="w-full">
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
        {title}
      </h1>
      <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed text-pretty">
        {description}
      </p>
      <div className="mt-6">{children}</div>
      {footer ? (
        <div className="text-muted-foreground mt-6 text-center text-sm">{footer}</div>
      ) : null}
    </section>
  );
}

type AuthStatusProps = {
  icon: ReactNode;
  variant?: 'success' | 'error';
  children: ReactNode;
};

export function AuthStatus({ icon, variant = 'success', children }: AuthStatusProps) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full [&_svg]:size-5',
          variant === 'success'
            ? 'bg-primary/10 text-primary'
            : 'bg-destructive/10 text-destructive',
        )}
      >
        {icon}
      </span>
      <p className="text-muted-foreground text-sm leading-relaxed">{children}</p>
    </div>
  );
}
