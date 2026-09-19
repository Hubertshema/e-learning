import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/superadmin/', '/teacher/', '/student/', '/api/'],
      },
    ],
    sitemap: 'https://fluentedge.edu/sitemap.xml',
  };
}
