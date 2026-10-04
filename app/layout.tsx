import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PwaRegister } from '@/components/pwa-register'

export const metadata: Metadata = {
  title: 'Brain Dump — Clear your mind',
  description: 'Turn messy thoughts into a clear, organized plan.',
  applicationName: 'Brain Dump',
  appleWebApp: {
    capable: true,
    title: 'Brain Dump',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      {
url: '/brain-dump-icon-512.png',
      },
      {
url: '/brain-dump-icon-512.png',
    type: 'image/png',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f4f1ff',
  viewportFit: 'cover',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
      <html lang="en" className="light bg-background">
      <body className="antialiased">
        {children}
        <PwaRegister />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
