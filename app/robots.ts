import type { MetadataRoute } from 'next'

const siteUrl = 'https://brain-dump-gray-tau.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: ['/', '/sign-in', '/sign-up'], disallow: ['/api/', '/today', '/this-week', '/calendar', '/tasks', '/inbox'] }],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
