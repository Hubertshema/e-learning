import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ShieldCheck, Lock, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — LinguaChris Academy',
  description: 'Learn how LinguaChris Academy protects your personal data, learning progress, and privacy.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <div>
        <Link href="/" className="inline-flex items-center text-xs font-semibold text-[#006EF3] hover:underline mb-4">
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Home
        </Link>
        <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#006EF3] bg-[#F3F7FC] rounded-full border border-[#E2E8F0]">
          Legal & Privacy
        </span>
        <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-[#172033]">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-[#667085]">Last updated: October 2026</p>
      </div>

      <Card className="p-6 sm:p-8 bg-white border border-[#E2E8F0] shadow-sm rounded-2xl space-y-6 text-[#172033] leading-relaxed text-sm">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#012970] flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#006EF3]" />
            1. Overview & Data Ownership
          </h2>
          <p className="text-[#667085]">
            LinguaChris Academy Ltd respects your personal privacy. We collect only information necessary to deliver, evaluate, and certify your English language education, including your name, contact details, CEFR assessment performance, and speaking submissions.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#012970] flex items-center gap-2">
            <Lock className="h-5 w-5 text-[#006EF3]" />
            2. How We Use Your Information
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-[#667085]">
            <li>Personalizing your CEFR diagnostic progression and multi-skill drills.</li>
            <li>Teacher reviews, human audio grading, and personalized pedagogical feedback.</li>
            <li>Issuing tamper-proof verified digital certificates and CEFR diplomas.</li>
            <li>Account security, password recovery, and transactional notifications.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#012970]">3. Protection of Student Audio & Submissions</h2>
          <p className="text-[#667085]">
            Audio recordings submitted during speaking drills and oral exams are accessible only to certified LinguaChris pedagogical reviewers and system administrators. We do not sell or license your voice recordings or personal details to third-party data brokers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#012970]">4. Contact Our Data Protection Team</h2>
          <p className="text-[#667085]">
            For data inquiries, access requests, or deletion assistance, contact our academic office at{' '}
            <a href="mailto:linguachrisltd@gmail.com" className="font-semibold text-[#006EF3] hover:underline">
              linguachrisltd@gmail.com
            </a>.
          </p>
        </section>
      </Card>
    </div>
  );
}
