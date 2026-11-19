'use client';

import { MoonIcon, SunIcon } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';

function subscribe() {
  return () => {};
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon-sm" aria-label="Ganti tema" disabled>
        <SunIcon aria-hidden="true" />
      </Button>
    );
  }

  const isDark = resolvedTheme === 'dark';
  const label = isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap';

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <SunIcon aria-hidden="true" /> : <MoonIcon aria-hidden="true" />}
    </Button>
  );
}
