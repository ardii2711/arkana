'use client';

import { useEffect, useMemo, useRef } from 'react';

/**
 * Object URL untuk blob. Pencabutan ditunda satu tick agar tetap valid saat
 * StrictMode menjalankan cleanup lalu setup ulang pada mount yang sama.
 */
export function useObjectUrl(blob: Blob | undefined) {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
  const activeUrl = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const previous = activeUrl.current;
    activeUrl.current = url;

    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    if (previous && previous !== url) {
      URL.revokeObjectURL(previous);
    }

    return () => {
      if (!url) return;

      timer.current = setTimeout(() => {
        if (activeUrl.current === url) {
          activeUrl.current = null;
        }

        URL.revokeObjectURL(url);
        timer.current = null;
      }, 0);
    };
  }, [url]);

  return url;
}
