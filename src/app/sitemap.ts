import type { MetadataRoute } from 'next'
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: 'https://designer.nextqtechnology.com', changeFrequency: 'monthly', priority: 1 }]
}
