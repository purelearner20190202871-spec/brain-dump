import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PwaRegister } from '@/components/pwa-register'

const siteUrl = 'https://brain-dump-gray-tau.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Brain Dump — Turn Messy Thoughts into Organized Tasks',
  description: 'Brain Dump is an AI-powered productivity app that turns your messy, unstructured thoughts into organized, prioritized tasks. Private by design.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: 'Brain Dump — Turn Messy Thoughts into Organized Tasks',
    description: 'Brain Dump is an AI-powered productivity app that turns your messy, unstructured thoughts into organized, prioritized tasks. Private by design.',
    images: [{ url: '/brain-dump-icon-512.png', width: 512, height: 512, alt: 'Brain Dump logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brain Dump — Turn Messy Thoughts into Organized Tasks',
    description: 'Brain Dump is an AI-powered productivity app that turns your messy, unstructured thoughts into organized, prioritized tasks. Private by design.',
    images: ['/brain-dump-icon-512.png'],
  },
  manifest: '/manifest.json',
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    title: 'Brain Dump',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="antialiased">
        <PwaRegister />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
