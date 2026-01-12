import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { Providers } from '@/components/providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: {
    default: 'MyAutoWhiz - AI-Powered Vehicle Intelligence',
    template: '%s | MyAutoWhiz',
  },
  description:
    'Your AI-powered vehicle intelligence platform. Decode VINs, check recalls, get repair estimates, and find trusted shops.',
  keywords: [
    'vehicle',
    'VIN decoder',
    'recalls',
    'safety ratings',
    'car repair',
    'auto shop finder',
    'AI assistant',
  ],
  authors: [{ name: 'MyAutoWhiz' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'MyAutoWhiz',
    title: 'MyAutoWhiz - AI-Powered Vehicle Intelligence',
    description:
      'Your AI-powered vehicle intelligence platform. Decode VINs, check recalls, get repair estimates, and find trusted shops.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MyAutoWhiz - AI-Powered Vehicle Intelligence',
    description:
      'Your AI-powered vehicle intelligence platform. Decode VINs, check recalls, get repair estimates, and find trusted shops.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
