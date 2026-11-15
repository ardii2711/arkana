import type { Metadata } from 'next';
import { Geist } from 'next/font/google';

import { QueryProvider } from '@/components/shared/query-provider';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'ARKANA',
  description: 'Arsip, Rekam Kinerja, dan Agenda',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="id" className={cn('font-sans', geist.variable)}>
      <body>
        <QueryProvider>{children}</QueryProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
