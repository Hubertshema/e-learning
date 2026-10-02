import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ShieldCheck, CheckCircle2, QrCode, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Verification Standards — LinguaChris Academy',
  description: 'Learn about our tamper-proof CEFR certificate verification protocol and standards.',
};

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <div>
        <Link href="/" className="inline-flex items-center text-xs font-semibold text-[#006EF3] hover:underline mb-4">
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Home
        </Link>
        <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#006EF3] bg-[#F3F7FC] rounded-full border border-[#E2E8F0]">
          Academic Standards
        </span>
        <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-[#172033]">
          Credential Verification Standards
        </h1>
        <p className="mt-2 text-sm text-[#667085]">CEFR Accreditation & Tamper-Proof Digital Diplomas</p>
      </div>

      <Card className="p-6 sm:p-8 bg-white border border-[#E2E8F0] shadow-sm rounded-2xl space-y-6 text-[#172033] leading-relaxed text-sm">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#012970] flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#006EF3]" />
            1. Unique Serial Number Cryptography
          </h2>
          <p className="text-[#667085]">
            Every certificate issued by LinguaChris Academy receives an immutable, globally unique serial code (e.g., <code className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-[#012970]">FE-2026-6NEW</code>) generated directly at the time of academic grade finalization.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#012970] flex items-center gap-2">
            <QrCode className="h-5 w-5 text-[#006EF3]" />
            2. 24/7 Real-Time Public Registry
          </h2>
          <p className="text-[#667085]">
            Recruiters, university admission officers, and employers worldwide can verify any student's final score, CEFR level tier, graduation date, and instructor endorsement instantaneously via our public portal or direct QR scan without requiring login access.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#012970] flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[#006EF3]" />
            3. CEFR Tier Alignment
          </h2>
          <p className="text-[#667085]">
            Diplomas are awarded only when students satisfy the rigorous Common European Framework of Reference competencies across 4 core modalities: Listening, Speaking, Reading, and Functional Grammar.
          </p>
        </section>

        <div className="pt-4 border-t border-[#E2E8F0]">
          <Link href="/#verify-certificate">
            <button className="rounded-xl bg-[#006EF3] text-white hover:bg-[#005ed1] px-5 py-2.5 text-xs font-bold shadow-sm transition">
              Verify a Certificate Now ➔
            </button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
