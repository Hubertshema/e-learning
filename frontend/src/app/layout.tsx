import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  metadataBase: new URL('https://fluentedge.edu'),
  title: {
    default: 'FluentEdge Academy — Professional English Learning & Teacher Platform',
    template: '%s | FluentEdge Academy',
  },
  description:
    'Master English with structured CEFR curriculum (Pre-A1 to C2), specialized tracks for Business, Tech & Healthcare, teacher-guided interactive lessons, and accredited certificates.',
  keywords: [
    'English Learning Platform',
    'CEFR English Courses',
    'Business English',
    'English for IT & Software Engineers',
    'Medical English',
    'Online English Teacher Management',
    'Verified English Certificate',
    'English for Rwanda',
  ],
  authors: [{ name: 'FluentEdge Academic Council' }],
  creator: 'FluentEdge Academy',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://fluentedge.edu',
    title: 'FluentEdge Academy — Master English from Pre-A1 to C2',
    description:
      'Learn English with certified instructors, interactive multi-skill exercises, adaptive placement tests, and industry-recognized credentials.',
    siteName: 'FluentEdge Academy',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FluentEdge Academy English Learning Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FluentEdge Academy — Learn English & Empower Instructors',
    description:
      'CEFR English learning platform with interactive multi-skill activities, cohort management, and verified certificates.',
    creator: '@FluentEdgeLMS',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLdData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'EducationalOrganization',
      name: 'FluentEdge Academy',
      url: 'https://fluentedge.edu',
      logo: 'https://fluentedge.edu/logo.png',
      description: 'Premier English Learning & Teacher Management Platform',
      sameAs: [
        'https://twitter.com/FluentEdgeLMS',
        'https://linkedin.com/company/fluentedge-academy',
      ],
    },
    {
      '@type': 'Course',
      name: 'Comprehensive CEFR English Mastery Program',
      description:
        'Structured 7-skill English curriculum from Pre-A1 Foundations to C2 Executive Fluency with verified accreditation.',
      provider: {
        '@type': 'EducationalOrganization',
        name: 'FluentEdge Academy',
      },
      educationalCredentialAwarded: 'Verified CEFR Diploma & Digital Certificate',
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
