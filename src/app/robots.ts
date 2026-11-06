import type { MetadataRoute } from 'next'
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/projects', '/admin', '/settings', '/dashboard', '/mobile', '/share/', '/api/'] },
    sitemap: 'https://designer.nextqtechnology.com/sitemap.xml',
  }
}
