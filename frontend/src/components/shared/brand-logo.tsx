import { cn } from '@/lib/utils';

type BrandLogoProps = {
  variant: 'icon' | 'wordmark' | 'wordmarkOnly' | 'lockup';
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
  tone?: 'auto' | 'dark';
};

const sources = {
  icon: {
    light: '/brand/arkana-icon.svg',
    dark: '/brand/arkana-icon-dark.svg',
  },
  wordmark: {
    light: '/brand/arkana-wordmark.svg',
    dark: '/brand/arkana-wordmark-dark.svg',
  },
  wordmarkOnly: {
    light: '/brand/arkana-wordmark-only.svg',
    dark: '/brand/arkana-wordmark-only-dark.svg',
  },
} as const;

export function BrandLogo({
  variant,
  className,
  iconClassName,
  wordmarkClassName,
  tone = 'auto',
}: BrandLogoProps) {
  if (variant === 'lockup') {
    return (
      <span className={cn('flex items-center gap-2.5', className)}>
        <BrandLogo variant="icon" tone={tone} className={cn('h-8 w-auto', iconClassName)} />
        <BrandLogo
          variant="wordmarkOnly"
          tone={tone}
          className={cn('h-6 w-auto', wordmarkClassName)}
        />
      </span>
    );
  }

  const { light, dark } = sources[variant];

  if (tone === 'dark') {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={dark} alt="ARKANA" className={className} draggable={false} />;
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={light} alt="ARKANA" className={cn('dark:hidden', className)} draggable={false} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dark}
        alt=""
        aria-hidden="true"
        className={cn('hidden dark:block', className)}
        draggable={false}
      />
    </>
  );
}
