import type { MetadataRoute } from 'next'

const siteUrl = 'https://brain-dump-gray-tau.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/sign-in`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/sign-up`, changeFrequency: 'monthly', priority: 0.6 },
  ]
}
