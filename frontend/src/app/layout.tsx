import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';

import { QueryProvider } from '@/components/shared/query-provider';
import { ThemeProvider } from '@/components/shared/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { siteDescription, siteName, siteUrl } from '@/config/site';
import { cn } from '@/lib/utils';

import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s · ${siteName}`,
  },
  applicationName: siteName,
  description: siteDescription,
  icons: {
    icon: [
      { url: '/brand/favicon.svg', type: 'image/svg+xml' },
      {
        url: '/brand/favicon-dark.svg',
        type: 'image/svg+xml',
        media: '(prefers-color-scheme: dark)',
      },
      { url: '/brand/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/brand/apple-touch-icon.png', sizes: '180x180' }],
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName,
    title: 'ARKANA — Arsip, Rekam Kinerja, dan Agenda',
    description: siteDescription,
    images: [{ url: '/brand/og-image.png', width: 1200, height: 630, alt: 'ARKANA' }],
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="id" className={cn('font-sans', geist.variable)} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
