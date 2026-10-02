'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Award,
  ArrowLeft,
  ShieldCheck,
  Scale,
  GraduationCap,
  AlertTriangle,
  CreditCard,
  Ban,
  CheckCircle2,
  Printer,
  Calendar,
  Building,
  Mail,
  UserCheck,
  HelpCircle,
  HelpCircle as QuestionIcon,
} from 'lucide-react';

export default function TermsOfServicePage() {
  const [activeSection, setActiveSection] = useState('acceptance');

  const sections = [
    { id: 'acceptance', title: '1. Acceptance & Eligibility', icon: Scale },
    { id: 'accounts', title: '2. Student Accounts & Security', icon: UserCheck },
    { id: 'tuition', title: '3. Tuition, Pricing & Refunds', icon: CreditCard },
    { id: 'integrity', title: '4. Academic Honor Code & Anti-Cheating', icon: ShieldCheck },
    { id: 'teachers', title: '5. Faculty & Reviewer Standards', icon: GraduationCap },
    { id: 'certifications', title: '6. CEFR Diplomas & Revocation', icon: Award },
    { id: 'ip', title: '7. Intellectual Property Rights', icon: FileText },
    { id: 'conduct', title: '8. Prohibited Conduct', icon: Ban },
    { id: 'governing-law', title: '9. Governing Law & Jurisdiction', icon: Building },
    { id: 'contact', title: '10. Academic Inquiries', icon: Mail },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180;
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 100,
        behavior: 'smooth',
      });
      setActiveSection(id);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* =========================================================================
          HERO BANNER
      ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#011b4a] via-[#012970] to-[#006EF3] text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#006EF3]/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#F5B400]/20 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-semibold text-blue-200 hover:text-white transition-colors mb-6 group"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5 transition-transform group-hover:-translate-x-1" />
            Back to LinguaChris Home
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md border border-white/20 text-[#F5B400]">
                <Scale className="h-3.5 w-3.5 text-[#F5B400]" />
                Academic Terms &amp; Student Agreement
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Terms of Service &amp; Academic Code
              </h1>
              <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed font-normal">
                The standards, rights, and responsibilities governing student enrollment, faculty instruction, and recognized CEFR certifications at LinguaChris Academy.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white">
                <Calendar className="h-3.5 w-3.5 text-blue-200" />
                <span>Effective: October 2026</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => typeof window !== 'undefined' && window.print()}
                className="rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20 text-xs gap-1.5 backdrop-blur-md h-9"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Terms</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          KEY PILLARS AT A GLANCE
      ========================================================================= */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-lg space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3F7FC] text-[#012970]">
              <GraduationCap className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-bold text-[#172033]">CEFR Framework</h2>
            <p className="text-xs text-[#667085] leading-relaxed">
              Curriculum rigorously mapped to European standards from Pre-A1 beginner through C2 mastery.
            </p>
          </Card>

          <Card className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-lg space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3F7FC] text-[#006EF3]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-bold text-[#172033]">Strict Honor Code</h2>
            <p className="text-xs text-[#667085] leading-relaxed">
              Merit-based diplomas require authentic, independently recorded student speech and quiz answers.
            </p>
          </Card>

          <Card className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-lg space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3F7FC] text-emerald-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-bold text-[#172033]">Fair Enrollment</h2>
            <p className="text-xs text-[#667085] leading-relaxed">
              Transparent tuition without hidden fees, with full access to 16 cognitive interactive drill suites.
            </p>
          </Card>

          <Card className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-lg space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3F7FC] text-[#F5B400]">
              <Award className="h-5 w-5 text-[#F5B400]" />
            </div>
            <h2 className="text-sm font-bold text-[#172033]">Verifiable Diplomas</h2>
            <p className="text-xs text-[#667085] leading-relaxed">
              Cryptographically unique serial codes verifiable 24/7 by employers worldwide.
            </p>
          </Card>
        </div>
      </section>

      {/* =========================================================================
          MAIN TWO-COLUMN LEGAL CONTENT & NAVIGATION
      ========================================================================= */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Sticky Left Table of Contents */}
          <aside className="lg:col-span-4 sticky top-24 space-y-4">
            <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[#667085]">
                Table of Contents
              </p>
              <nav className="space-y-1">
                {sections.map((sec) => {
                  const Icon = sec.icon;
                  const isActive = activeSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => scrollTo(sec.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left ${
                        isActive
                          ? 'bg-[#012970] text-white shadow-sm'
                          : 'text-[#172033] hover:bg-[#F3F7FC] hover:text-[#006EF3]'
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#F5B400]' : 'text-[#667085]'}`} />
                      <span className="truncate">{sec.title}</span>
                    </button>
                  );
                })}
              </nav>
            </Card>

            <Card className="rounded-2xl border border-[#006EF3]/20 bg-gradient-to-br from-[#F3F7FC] to-white p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#012970]">
                <HelpCircle className="h-4 w-4 text-[#006EF3]" />
                <span>Academic Guidance</span>
              </div>
              <p className="text-xs text-[#667085] leading-relaxed">
                Need guidance regarding syllabus prerequisites, tuition, or certification eligibility?
              </p>
              <Link
                href="/about"
                className="inline-block text-xs font-bold text-[#006EF3] hover:underline"
              >
                Contact Academic Registry ➔
              </Link>
            </Card>
          </aside>

          {/* Main Article Content */}
          <main className="lg:col-span-8 space-y-8">
            <Card className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-10 text-slate-800 leading-relaxed text-sm">

              {/* 1. Acceptance */}
              <section id="acceptance" className="space-y-3 scroll-mt-24">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F3F7FC] text-[#012970] text-xs font-bold border border-[#E2E8F0]">
                  <Scale className="h-3.5 w-3.5 text-[#006EF3]" />
                  Section 1
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#012970]">
                  1. Acceptance of Terms &amp; Academic Eligibility
                </h2>
                <p className="text-[#667085]">
                  These Terms of Service constitute a legally binding educational agreement between you (&quot;Student&quot;, &quot;User&quot;, &quot;You&quot;) and LinguaChris Academy Ltd (&quot;LinguaChris&quot;, &quot;Academy&quot;). By creating an account, sitting for a diagnostic placement examination, or enrolling in any syllabus tier, you confirm that you have read, understood, and agreed to be bound by these Terms and our Privacy Policy.
                </p>
                <p className="text-[#667085]">
                  Students under 18 years of age must obtain verifiable parental or guardian consent before enrolling in paid course modules or submitting spoken audio recordings.
                </p>
              </section>

              <hr className="border-slate-100" />

              {/* 2. Accounts */}
              <section id="accounts" className="space-y-3 scroll-mt-24">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F3F7FC] text-[#012970] text-xs font-bold border border-[#E2E8F0]">
                  <UserCheck className="h-3.5 w-3.5 text-[#006EF3]" />
                  Section 2
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#012970]">
                  2. Student Accounts &amp; Security
                </h2>
                <p className="text-[#667085]">
                  When registering, you agree to provide accurate, current, and truthful personal identification information. Because your legal name is printed on official diplomas and registered on our cryptographic verification portal, account sharing, selling, or transferring student logins is strictly prohibited.
                </p>
                <p className="text-[#667085]">
                  You are solely responsible for safeguarding your login credentials. If you suspect unauthorized access to your student portal, notify <code className="text-xs bg-slate-100 px-2 py-0.5 rounded text-[#012970]">linguachrisltd@gmail.com</code> immediately.
                </p>
              </section>

              <hr className="border-slate-100" />

              {/* 3. Tuition */}
              <section id="tuition" className="space-y-4 scroll-mt-24">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F3F7FC] text-[#012970] text-xs font-bold border border-[#E2E8F0]">
                  <CreditCard className="h-3.5 w-3.5 text-[#006EF3]" />
                  Section 3
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#012970]">
                  3. Tuition, Pricing &amp; Refund Policy
                </h2>
                <p className="text-[#667085]">
                  Tuition grants access to all interactive curriculum modules, flashcard drills, certified teacher reviews, and certificate generation for the duration of the syllabus.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200/80 space-y-1">
                    <p className="font-bold text-xs text-[#012970]">Promotional Discounts</p>
                    <p className="text-xs text-[#667085]">
                      Special offers (such as our 50% discount launch campaign) apply strictly during designated promotional enrollment windows.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200/80 space-y-1">
                    <p className="font-bold text-xs text-[#012970]">Satisfaction Refund Window</p>
                    <p className="text-xs text-[#667085]">
                      Full refunds are available within 7 calendar days of enrollment provided the student has completed less than 20% of the course modules.
                    </p>
                  </div>
                </div>
              </section>

              <hr className="border-slate-100" />

              {/* 4. Honor Code */}
              <section id="integrity" className="space-y-3 scroll-mt-24">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F3F7FC] text-[#012970] text-xs font-bold border border-[#E2E8F0]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#006EF3]" />
                  Section 4
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#012970]">
                  4. Academic Honor Code &amp; Anti-Cheating Protocol
                </h2>
                <p className="text-[#667085]">
                  LinguaChris certificates carry prestige because they reflect authentic human linguistic competency. All enrolled students agree to uphold our non-negotiable Honor Code:
                </p>
                <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 space-y-2">
                  <p className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    Strict Academic Violations
                  </p>
                  <ul className="text-xs text-rose-800 space-y-1.5 list-disc pl-5">
                    <li>Submitting automated speech synthesizers, voice clones, or third-party audio for oral speaking drills.</li>
                    <li>Employing surrogate test-takers or unauthorized bots to complete grammar benchmarks and diagnostic quizzes.</li>
                    <li>Distributing proprietary syllabus questions, diagnostic test keys, or answer repositories.</li>
                  </ul>
                </div>
                <p className="text-xs text-[#667085]">
                  Violations result in immediate academic suspension, grade invalidation, and certificate cancellation without refund.
                </p>
              </section>

              <hr className="border-slate-100" />

              {/* 5. Teachers */}
              <section id="teachers" className="space-y-3 scroll-mt-24">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F3F7FC] text-[#012970] text-xs font-bold border border-[#E2E8F0]">
                  <GraduationCap className="h-3.5 w-3.5 text-[#006EF3]" />
                  Section 5
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#012970]">
                  5. Faculty &amp; Pedagogical Standards
                </h2>
                <p className="text-[#667085]">
                  All LinguaChris instructors hold CELTA, TEFL, or recognized university linguistic accreditations. Teachers are bound by our Faculty Code of Conduct: providing constructive oral and written feedback within 72 hours of assignment submission, upholding respectful pedagogical discourse, and adhering to strict anti-discrimination guidelines.
                </p>
              </section>

              <hr className="border-slate-100" />

              {/* 6. Certifications */}
              <section id="certifications" className="space-y-3 scroll-mt-24">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F3F7FC] text-[#012970] text-xs font-bold border border-[#E2E8F0]">
                  <Award className="h-3.5 w-3.5 text-[#006EF3]" />
                  Section 6
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#012970]">
                  6. CEFR Diplomas &amp; Revocation Policy
                </h2>
                <p className="text-[#667085]">
                  Graduation diplomas are awarded upon achieving an overall score of 70% or higher on the target syllabus, with mandatory passing marks in oral fluency. Each diploma receives a globally unique serial code verifiable at <code className="text-xs bg-slate-100 px-2 py-0.5 rounded text-[#012970]">/verify/certificate/:code</code>.
                </p>
                <p className="text-[#667085]">
                  LinguaChris Academy reserves the unilateral right to revoke and flag as &quot;REVOKED&quot; any certificate if post-issuance audits reveal evidence of cheating, proxy enrollment, or unauthorized modification.
                </p>
              </section>

              <hr className="border-slate-100" />

              {/* 7. IP */}
              <section id="ip" className="space-y-3 scroll-mt-24">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F3F7FC] text-[#012970] text-xs font-bold border border-[#E2E8F0]">
                  <FileText className="h-3.5 w-3.5 text-[#006EF3]" />
                  Section 7
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#012970]">
                  7. Intellectual Property Rights
                </h2>
                <p className="text-[#667085]">
                  All curriculum materials, 16-drill multi-skill activity engines, flashcards, Oxford vocabulary compilations, audio models, and video lessons are the exclusive intellectual property of LinguaChris Academy Ltd. You are granted a limited, personal, revocable, non-exclusive license to access and complete exercises. Commercial resale, scraping, or public mirroring of syllabus lessons is unlawful.
                </p>
              </section>

              <hr className="border-slate-100" />

              {/* 8. Prohibited Conduct */}
              <section id="conduct" className="space-y-3 scroll-mt-24">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F3F7FC] text-[#012970] text-xs font-bold border border-[#E2E8F0]">
                  <Ban className="h-3.5 w-3.5 text-[#006EF3]" />
                  Section 8
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#012970]">
                  8. Prohibited Conduct
                </h2>
                <p className="text-[#667085]">
                  Users agree never to engage in harassment of instructors or fellow students, distribution of malicious payloads or spyware, probing platform API endpoints without authorization, or reverse engineering client applications.
                </p>
              </section>

              <hr className="border-slate-100" />

              {/* 9. Governing Law */}
              <section id="governing-law" className="space-y-3 scroll-mt-24">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F3F7FC] text-[#012970] text-xs font-bold border border-[#E2E8F0]">
                  <Building className="h-3.5 w-3.5 text-[#006EF3]" />
                  Section 9
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#012970]">
                  9. Governing Law &amp; Jurisdiction
                </h2>
                <p className="text-[#667085]">
                  These Terms are governed by and construed in accordance with the substantive laws of the Republic of Rwanda. Any disputes arising out of or related to academic enrollment or certifications shall be subject to the exclusive jurisdiction of the competent courts of Kigali, Rwanda.
                </p>
              </section>

              <hr className="border-slate-100" />

              {/* 10. Contact */}
              <section id="contact" className="space-y-4 scroll-mt-24">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F3F7FC] text-[#012970] text-xs font-bold border border-[#E2E8F0]">
                  <Mail className="h-3.5 w-3.5 text-[#006EF3]" />
                  Section 10
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#012970]">
                  10. Academic Inquiries &amp; Legal Notices
                </h2>
                <p className="text-[#667085]">
                  For questions regarding these Terms or formal legal notices, please write to:
                </p>

                <div className="rounded-2xl border border-slate-200 bg-[#F3F7FC] p-5 space-y-2">
                  <p className="text-xs font-bold text-[#012970]">LinguaChris Academy Ltd — Legal &amp; Academic Governance</p>
                  <p className="text-xs text-[#667085]">Email:{' '}
                    <a href="mailto:linguachrisltd@gmail.com" className="text-[#006EF3] font-semibold hover:underline">
                      linguachrisltd@gmail.com
                    </a>
                  </p>
                  <p className="text-xs text-[#667085]">Official Registry Phone: +250 788 884 839</p>
                  <p className="text-xs text-[#667085]">Kigali, Rwanda</p>
                </div>
              </section>

            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
