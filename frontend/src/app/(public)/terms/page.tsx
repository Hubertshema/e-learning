import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { FileText, Award, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service — LinguaChris Academy',
  description: 'Understand the terms and academic standards governing enrollment, courses, and certifications.',
};

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <div>
        <Link href="/" className="inline-flex items-center text-xs font-semibold text-[#006EF3] hover:underline mb-4">
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Home
        </Link>
        <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#006EF3] bg-[#F3F7FC] rounded-full border border-[#E2E8F0]">
          Terms of Service
        </span>
        <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-[#172033]">
          Terms of Service & Academic Standards
        </h1>
        <p className="mt-2 text-sm text-[#667085]">Effective date: October 2026</p>
      </div>

      <Card className="p-6 sm:p-8 bg-white border border-[#E2E8F0] shadow-sm rounded-2xl space-y-6 text-[#172033] leading-relaxed text-sm">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#012970] flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#006EF3]" />
            1. Enrollment & Account Responsibility
          </h2>
          <p className="text-[#667085]">
            By registering for an account or enrolling in a syllabus with LinguaChris Academy Ltd, you agree to provide truthful credentials and safeguard your access passwords. Student accounts are non-transferable.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#012970] flex items-center gap-2">
            <Award className="h-5 w-5 text-[#006EF3]" />
            2. Academic Integrity & Anti-Cheating
          </h2>
          <p className="text-[#667085]">
            LinguaChris certificates are strictly merit-based. Students must complete video checkpoints, grammar quizzes, and oral speaking recordings independently. Any submission of third-party voice cloning or unapproved automated tools for graded assignments will result in academic disqualification.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#012970]">3. Tuition Fees & Cancellation Policy</h2>
          <p className="text-[#667085]">
            Course fees grant access to digital interactive learning materials, teacher review sessions, and certificate processing for the duration specified per syllabus. Special promotional pricing (e.g. 50% discount) applies to active terms only.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#012970]">4. Certification & Revocation</h2>
          <p className="text-[#667085]">
            Digital diplomas remain verifiable on our public ledger so long as issued credentials satisfy CEFR graduation thresholds. LinguaChris Academy reserves the right to revoke certificates found to have breached integrity guidelines.
          </p>
        </section>
      </Card>
    </div>
  );
}
