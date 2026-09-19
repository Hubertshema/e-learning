import React from 'react';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Poppins } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';

const fontMain = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-main',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

const fontDisplay = Poppins({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://linguachris.edu'),
  title: {
    default: 'LinguaChris Academy — Professional English Learning & Teacher Platform',
    template: '%s | LinguaChris Academy',
  },
  description:
    'Master English with structured CEFR curriculum (Pre-A1 to C2), specialized tracks for Business, Tech & Healthcare, teacher-guided interactive lessons, and accredited certificates.',
  icons: {
    icon: '/logo.png',
    shortcut: '/favicon.ico',
    apple: '/logo.png',
  },
  keywords: [
    'LinguaChris Academy',
    'English Learning Platform',
    'CEFR English Courses',
    'Business English',
    'English for IT & Software Engineers',
    'Medical English',
    'Online English Teacher Management',
    'Verified English Certificate',
  ],
  authors: [{ name: 'LinguaChris Academic Council' }],
  creator: 'LinguaChris Academy',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://linguachris.edu',
    title: 'LinguaChris Academy — Master English from Pre-A1 to C2',
    description:
      'Learn English with certified instructors, interactive multi-skill exercises, adaptive placement tests, and industry-recognized credentials.',
    siteName: 'LinguaChris Academy',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'LinguaChris Academy Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LinguaChris Academy — Learn English & Empower Instructors',
    description:
      'CEFR English learning platform with interactive multi-skill activities, cohort management, and verified certificates.',
    creator: '@LinguaChrisLMS',
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
      name: 'LinguaChris Academy',
      url: 'https://linguachris.edu',
      logo: 'https://linguachris.edu/logo.png',
      description: 'Premier English Learning & Teacher Management Platform',
    },
    {
      '@type': 'Course',
      name: 'Comprehensive CEFR English Mastery Program',
      description:
        'Structured 7-skill English curriculum from Pre-A1 Foundations to C2 Executive Fluency with verified accreditation.',
      provider: {
        '@type': 'EducationalOrganization',
        name: 'LinguaChris Academy',
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
    <html
      lang="en"
      className={`${fontMain.variable} ${fontDisplay.variable}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen bg-white text-slate-900 antialiased font-sans"
        suppressHydrationWarning
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
