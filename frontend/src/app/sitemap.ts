import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://linguachris.com';

  const publicRoutes = [
    '',
    '/courses',
    '/tracks',
    '/levels',
    '/teachers',
    '/pricing',
    '/about',
    '/login',
    '/apply',
    '/verify/certificate/ENG-2026-001',
  ];

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : route === '/courses' || route === '/tracks' ? 0.9 : 0.7,
  }));
}
