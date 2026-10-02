import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Brain Dump',
    short_name: 'Brain Dump',
    description: 'Turn messy thoughts into a clear, organized plan.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8f7ff',
    theme_color: '#f4f1ff',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icon-light-32x32.png', sizes: '32x32', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
      { src: '/brain-dump-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
