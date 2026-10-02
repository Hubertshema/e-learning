'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  Lock,
  ArrowLeft,
  FileText,
  UserCheck,
  Mic,
  Database,
  Globe2,
  Bell,
  Mail,
  Printer,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Building,
  KeyRound,
  Eye,
  AlertCircle,
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: '1. Overview & Data Controller', icon: Building },
    { id: 'data-collection', title: '2. Information We Collect', icon: Database },
    { id: 'audio-data', title: '3. Student Audio & Voice Recordings', icon: Mic },
    { id: 'pedagogical-use', title: '4. How We Use Academic Data', icon: UserCheck },
    { id: 'security-measures', title: '5. Encryption & Security Safeguards', icon: Lock },
    { id: 'third-parties', title: '6. Sub-Processors & Infrastructure', icon: Globe2 },
    { id: 'student-rights', title: '7. Your Privacy Rights (GDPR & Local Laws)', icon: KeyRound },
    { id: 'retention', title: '8. Data Retention & Diploma Ledger', icon: FileText },
    { id: 'contact', title: '9. Contact Data Protection Officer', icon: Mail },
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
        {/* Ambient Glow Orbs */}
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
                <ShieldCheck className="h-3.5 w-3.5 text-[#F5B400]" />
                Official Privacy & Data Protection Policy
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Privacy Policy &amp; Data Safeguards
              </h1>
              <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed font-normal">
                How LinguaChris Academy Ltd protects your personal identity, oral audio submissions, learning analytics, and CEFR credential records.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white">
                <Calendar className="h-3.5 w-3.5 text-blue-200" />
                <span>Updated: October 2026</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => typeof window !== 'undefined' && window.print()}
                className="rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20 text-xs gap-1.5 backdrop-blur-md h-9"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Policy</span>
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3F7FC] text-[#006EF3]">
              <Eye className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-bold text-[#172033]">Zero Commercial Sale</h2>
            <p className="text-xs text-[#667085] leading-relaxed">
              We never sell, rent, or trade student records or contact details to third-party advertisers.
            </p>
          </Card>

          <Card className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-lg space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3F7FC] text-[#012970]">
              <Mic className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-bold text-[#172033]">Protected Voice Data</h2>
            <p className="text-xs text-[#667085] leading-relaxed">
              Audio submissions are analyzed solely for pronunciation grading and pedagogical feedback.
            </p>
          </Card>

          <Card className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-lg space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3F7FC] text-emerald-600">
              <Lock className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-bold text-[#172033]">256-Bit SSL/TLS</h2>
            <p className="text-xs text-[#667085] leading-relaxed">
              All interactive drills, quizzes, and credential exchanges are encrypted end-to-end.
            </p>
          </Card>

          <Card className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-lg space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3F7FC] text-[#F5B400]">
              <CheckCircle2 className="h-5 w-5 text-[#F5B400]" />
            </div>
            <h2 className="text-sm font-bold text-[#172033]">GDPR & Law No 058/2021</h2>
            <p className="text-xs text-[#667085] leading-relaxed">
              Full compliance with international data privacy rights and Rwandan personal data protections.
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
                <Mail className="h-4 w-4 text-[#006EF3]" />
                <span>Privacy Inquiries</span>
              </div>
              <p className="text-xs text-[#667085] leading-relaxed">
                Have questions or need to request your learning data archive? Contact our academic privacy team.
              </p>
              <a
                href="mailto:linguachrisltd@gmail.com"
                className="inline-block text-xs font-bold text-[#006EF3] hover:underline"
              >
                linguachrisltd@gmail.com ➔
              </a>
            </Card>
          </aside>

          {/* Main Article Content */}
          <main className="lg:col-span-8 space-y-8">
            <Card className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-10 text-slate-800 leading-relaxed text-sm">

              {/* 1. Overview */}
              <section id="overview" className="space-y-3 scroll-mt-24">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F3F7FC] text-[#012970] text-xs font-bold border border-[#E2E8F0]">
                  <Building className="h-3.5 w-3.5 text-[#006EF3]" />
                  Section 1
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#012970]">
                  1. Overview &amp; Data Controller
                </h2>
                <p className="text-[#667085]">
                  LinguaChris Academy Ltd (&quot;LinguaChris&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is a professional English language educational institution registered in Kigali, Republic of Rwanda. We operate the LinguaChris digital learning platform, placement diagnostic examinations, interactive multi-skill drills, and official CEFR digital diploma verification registry.
                </p>
                <p className="text-[#667085]">
                  As the designated Data Controller, LinguaChris is dedicated to handling your personal data in accordance with international standards, including the General Data Protection Regulation (GDPR) and Rwandan Law No 058/2021 on the Protection of Personal Data and Privacy.
                </p>
              </section>

              <hr className="border-slate-100" />

              {/* 2. Information We Collect */}
              <section id="data-collection" className="space-y-4 scroll-mt-24">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F3F7FC] text-[#012970] text-xs font-bold border border-[#E2E8F0]">
                  <Database className="h-3.5 w-3.5 text-[#006EF3]" />
                  Section 2
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#012970]">
                  2. Information We Collect
                </h2>
                <p className="text-[#667085]">
                  To provide accredited instruction and measure your fluency growth from Pre-A1 to C2, we collect the following categories of information:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200/80 space-y-1.5">
                    <p className="font-bold text-xs text-[#012970]">Personal Identification</p>
                    <p className="text-xs text-[#667085]">
                      Full legal name (for diploma rendering), email address, contact phone number, nationality, and profile avatar.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200/80 space-y-1.5">
                    <p className="font-bold text-xs text-[#012970]">Academic &amp; Quiz Data</p>
                    <p className="text-xs text-[#667085]">
                      Diagnostic placement quiz submissions, CEFR target levels, assignment submissions, module checkpoints, and completion timestamps.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200/80 space-y-1.5">
                    <p className="font-bold text-xs text-[#012970]">Interactive Drill Telemetry</p>
                    <p className="text-xs text-[#667085]">
                      Flashcard review intervals, listening comprehension replay metrics, grammar unscramble attempts, and time spent per syllabus lesson.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200/80 space-y-1.5">
                    <p className="font-bold text-xs text-[#012970]">Payment &amp; Billing Records</p>
                    <p className="text-xs text-[#667085]">
                      Transaction reference IDs, currency amounts, and course tier. Note: Raw payment card numbers are processed directly by certified payment gateways.
                    </p>
                  </div>
                </div>
              </section>

              <hr className="border-slate-100" />

              {/* 3. Audio Data */}
              <section id="audio-data" className="space-y-3 scroll-mt-24">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F3F7FC] text-[#012970] text-xs font-bold border border-[#E2E8F0]">
                  <Mic className="h-3.5 w-3.5 text-[#006EF3]" />
                  Section 3
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#012970]">
                  3. Student Audio &amp; Voice Recordings
                </h2>
                <p className="text-[#667085]">
                  The LinguaChris curriculum places substantial emphasis on natural speaking fluency. In speaking activities, our platform prompts you to record audio clips to assess phonetics, stress patterns, and intonation against native models.
                </p>
                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 space-y-2">
                  <p className="font-bold text-xs text-[#012970] flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#006EF3]" />
                    Voice Recording Safeguards
                  </p>
                  <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-5">
                    <li>Audio recordings are never used to train generalized third-party commercial AI voice cloning models.</li>
                    <li>Audio is restricted to your assigned certified pedagogical instructors and personal review playback.</li>
                    <li>You have the option to delete practice audio clips from your student portfolio at any time.</li>
                  </ul>
                </div>
              </section>

              <hr className="border-slate-100" />

              {/* 4. How We Use Academic Data */}
              <section id="pedagogical-use" className="space-y-3 scroll-mt-24">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F3F7FC] text-[#012970] text-xs font-bold border border-[#E2E8F0]">
                  <UserCheck className="h-3.5 w-3.5 text-[#006EF3]" />
                  Section 4
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#012970]">
                  4. How We Use Academic Data
                </h2>
                <p className="text-[#667085]">
                  We process personal information under the legal basis of contractual necessity to deliver your enrolled courses, legitimate educational interests, and express consent:
                </p>
                <ul className="space-y-2 text-[#667085] text-xs">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#006EF3] shrink-0 mt-0.5" />
                    <span><strong>Pedagogical Progression:</strong> Adapting spaced-repetition drills to address weak grammar concepts and vocabulary gaps.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#006EF3] shrink-0 mt-0.5" />
                    <span><strong>Human Instructor Review:</strong> Enabling instructors to assign scores, leave voice annotations, and evaluate spoken responses.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#006EF3] shrink-0 mt-0.5" />
                    <span><strong>Credential Validation:</strong> Registering your final grade and CEFR tier in the public certificate registry for employer validation.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#006EF3] shrink-0 mt-0.5" />
                    <span><strong>Service Notifications:</strong> Sending course milestone updates, scheduled teacher reviews, and administrative notices.</span>
                  </li>
                </ul>
              </section>

              <hr className="border-slate-100" />

              {/* 5. Security Measures */}
              <section id="security-measures" className="space-y-3 scroll-mt-24">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F3F7FC] text-[#012970] text-xs font-bold border border-[#E2E8F0]">
                  <Lock className="h-3.5 w-3.5 text-[#006EF3]" />
                  Section 5
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#012970]">
                  5. Encryption &amp; Security Safeguards
                </h2>
                <p className="text-[#667085]">
                  We enforce technical and administrative protections to prevent unauthorized access, tampering, or data leakage:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-[#F8FAFC] space-y-1">
                    <p className="text-xs font-bold text-[#012970]">Transit Encryption</p>
                    <p className="text-[11px] text-[#667085]">TLS 1.3 cryptographic protocols with HTTPS everywhere.</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-[#F8FAFC] space-y-1">
                    <p className="text-xs font-bold text-[#012970]">Storage Encryption</p>
                    <p className="text-[11px] text-[#667085]">AES-256 encrypted database volumes and salted hash passwords.</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-[#F8FAFC] space-y-1">
                    <p className="text-xs font-bold text-[#012970]">Role-Based Access</p>
                    <p className="text-[11px] text-[#667085]">Strict authorization restricting student records to assigned teachers.</p>
                  </div>
                </div>
              </section>

              <hr className="border-slate-100" />

              {/* 6. Sub-Processors & Infrastructure */}
              <section id="third-parties" className="space-y-3 scroll-mt-24">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F3F7FC] text-[#012970] text-xs font-bold border border-[#E2E8F0]">
                  <Globe2 className="h-3.5 w-3.5 text-[#006EF3]" />
                  Section 6
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#012970]">
                  6. Sub-Processors &amp; Infrastructure
                </h2>
                <p className="text-[#667085]">
                  We partner with enterprise cloud providers bound by strict Data Processing Agreements (DPAs):
                </p>
                <ul className="text-xs text-[#667085] space-y-2 list-disc pl-5">
                  <li><strong>Cloud Infrastructure:</strong> Managed cloud servers with automatic failover and security isolation.</li>
                  <li><strong>Media Delivery:</strong> Secure Content Delivery Networks (CDNs) for rapid lesson video streaming and audio playback.</li>
                  <li><strong>Transactional Email:</strong> High-deliverability notification gateways for password resets and verification codes.</li>
                  <li><strong>Payment Processors:</strong> PCI-DSS Level 1 compliant financial gateways.</li>
                </ul>
              </section>

              <hr className="border-slate-100" />

              {/* 7. Student Rights */}
              <section id="student-rights" className="space-y-3 scroll-mt-24">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F3F7FC] text-[#012970] text-xs font-bold border border-[#E2E8F0]">
                  <KeyRound className="h-3.5 w-3.5 text-[#006EF3]" />
                  Section 7
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#012970]">
                  7. Your Privacy Rights (GDPR &amp; Local Laws)
                </h2>
                <p className="text-[#667085]">
                  Regardless of your geographical residence, LinguaChris provides all learners with robust privacy rights:
                </p>
                <div className="space-y-2 text-xs text-[#667085]">
                  <p><strong>Right to Access:</strong> Request a full machine-readable export of all quizzes, grades, and audio submissions.</p>
                  <p><strong>Right to Rectification:</strong> Update legal name spelling on issued certificates and profile records.</p>
                  <p><strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Request complete account deletion, subject to regulatory retention obligations for academic certification.</p>
                  <p><strong>Right to Object &amp; Restrict:</strong> Opt out of non-essential communications and promotional newsletters with a single click.</p>
                </div>
              </section>

              <hr className="border-slate-100" />

              {/* 8. Retention */}
              <section id="retention" className="space-y-3 scroll-mt-24">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F3F7FC] text-[#012970] text-xs font-bold border border-[#E2E8F0]">
                  <FileText className="h-3.5 w-3.5 text-[#006EF3]" />
                  Section 8
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#012970]">
                  8. Data Retention &amp; Diploma Ledger
                </h2>
                <p className="text-[#667085]">
                  To guarantee that future employers and institutions can continuously verify your academic credential, awarded CEFR certificates and associated verification codes remain permanently verifiable in our cryptographic registry unless legally revoked. Inactive student drill logs and temporary audio drafts are purged after 24 months of continuous account inactivity.
                </p>
              </section>

              <hr className="border-slate-100" />

              {/* 9. Contact */}
              <section id="contact" className="space-y-4 scroll-mt-24">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F3F7FC] text-[#012970] text-xs font-bold border border-[#E2E8F0]">
                  <Mail className="h-3.5 w-3.5 text-[#006EF3]" />
                  Section 9
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#012970]">
                  9. Contact Data Protection Officer (DPO)
                </h2>
                <p className="text-[#667085]">
                  For questions about this Privacy Policy, data subject rights, or formal privacy inquiries, please reach out to our academic legal department:
                </p>

                <div className="rounded-2xl border border-slate-200 bg-[#F3F7FC] p-5 space-y-2">
                  <p className="text-xs font-bold text-[#012970]">LinguaChris Academy Ltd — Data Governance Office</p>
                  <p className="text-xs text-[#667085]">Email:{' '}
                    <a href="mailto:linguachrisltd@gmail.com" className="text-[#006EF3] font-semibold hover:underline">
                      linguachrisltd@gmail.com
                    </a>
                  </p>
                  <p className="text-xs text-[#667085]">Telephone / WhatsApp Support: +250 788 884 839</p>
                  <p className="text-xs text-[#667085]">Location: Kigali, Republic of Rwanda</p>
                  <p className="text-[11px] text-[#667085] italic pt-1">
                    All formal requests receive confirmation within 48 business hours.
                  </p>
                </div>
              </section>

            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
