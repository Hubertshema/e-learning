'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  Lock,
  ArrowLeft,
  QrCode,
  CheckCircle2,
  Server,
  FileCheck,
  Search,
  KeyRound,
  Printer,
  Calendar,
  Building,
  Mail,
  Zap,
  Award,
  Database,
  ExternalLink,
} from 'lucide-react';

export default function SecurityPage() {
  const [activeSection, setActiveSection] = useState('cryptography');

  const sections = [
    { id: 'cryptography', title: '1. Cryptographic Serial Architecture', icon: KeyRound },
    { id: 'registry', title: '2. 24/7 Real-Time Verification Portal', icon: Search },
    { id: 'cefr-standards', title: '3. CEFR 4-Skill Mastery Criteria', icon: Award },
    { id: 'infra-security', title: '4. Cloud & Network Security Safeguards', icon: Server },
    { id: 'audio-sandbox', title: '5. Voice Biometric & Audio Protection', icon: Lock },
    { id: 'vulnerability-reporting', title: '6. Responsible Vulnerability Disclosure', icon: ShieldCheck },
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
                <ShieldCheck className="h-3.5 w-3.5 text-[#F5B400]" />
                Trust, Verification &amp; Security Standards
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Academic Credential Verification &amp; Security
              </h1>
              <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed font-normal">
                How LinguaChris Academy prevents counterfeit English certificates through tamper-proof cryptographic serials, public registries, and enterprise-grade data protection.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white">
                <Calendar className="h-3.5 w-3.5 text-blue-200" />
                <span>Protocol v2.4</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => typeof window !== 'undefined' && window.print()}
                className="rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20 text-xs gap-1.5 backdrop-blur-md h-9"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Specification</span>
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
              <KeyRound className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-bold text-[#172033]">Cryptographic Serials</h2>
            <p className="text-xs text-[#667085] leading-relaxed">
              Every diploma is generated with a collision-free, immutable alphanumeric serial identifier.
            </p>
          </Card>

          <Card className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-lg space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3F7FC] text-[#006EF3]">
              <Search className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-bold text-[#172033]">Instant Public Registry</h2>
            <p className="text-xs text-[#667085] leading-relaxed">
              Recruiters and universities can verify grades, honors, and CEFR level 24/7 in real-time.
            </p>
          </Card>

          <Card className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-lg space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3F7FC] text-emerald-600">
              <Server className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-bold text-[#172033]">SOC2-Aligned Cloud</h2>
            <p className="text-xs text-[#667085] leading-relaxed">
              Strict isolation, automated daily encrypted backups, and TLS 1.3 high-cipher transport.
            </p>
          </Card>

          <Card className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-lg space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3F7FC] text-[#F5B400]">
              <Award className="h-5 w-5 text-[#F5B400]" />
            </div>
            <h2 className="text-sm font-bold text-[#172033]">Zero Counterfeits</h2>
            <p className="text-xs text-[#667085] leading-relaxed">
              Direct database query cross-checks prevent modified PDF transcripts or forged credentials.
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

            <Card className="rounded-2xl border border-[#006EF3]/30 bg-gradient-to-br from-[#012970] to-[#006EF3] p-5 shadow-md text-white space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#F5B400]">
                <FileCheck className="h-4 w-4" />
                <span>Verify a Diploma</span>
              </div>
              <p className="text-xs text-blue-100 leading-relaxed">
                Have a LinguaChris certificate code? Test our cryptographic verification engine directly.
              </p>
              <Link href="/#verify-certificate">
                <Button className="w-full rounded-xl bg-[#F5B400] hover:bg-[#e0a400] text-[#011b4a] text-xs font-bold">
                  Launch Verification Portal ➔
                </Button>
              </Link>
            </Card>
          </aside>

          {/* Main Article Content */}
          <main className="lg:col-span-8 space-y-8">
            <Card className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-10 text-slate-800 leading-relaxed text-sm">

              {/* 1. Cryptography */}
              <section id="cryptography" className="space-y-3 scroll-mt-24">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F3F7FC] text-[#012970] text-xs font-bold border border-[#E2E8F0]">
                  <KeyRound className="h-3.5 w-3.5 text-[#006EF3]" />
                  Section 1
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#012970]">
                  1. Cryptographic Serial Architecture
                </h2>
                <p className="text-[#667085]">
                  Paper certificates and non-verifiable PDFs are historically vulnerable to forgery. To establish absolute trust for employers, embassies, and academic admissions, LinguaChris Academy binds every completed graduation diploma to a tamper-proof cryptographic ledger.
                </p>
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-2">
                  <p className="text-xs font-bold text-[#012970]">Serial Code Structure (Example: FE-2026-6NEW)</p>
                  <ul className="text-xs text-[#667085] space-y-1 list-disc pl-5">
                    <li><span className="font-mono font-semibold text-[#006EF3]">FE</span> — Fluency English Academic Curriculum</li>
                    <li><span className="font-mono font-semibold text-[#006EF3]">2026</span> — Year of Academic Accreditation</li>
                    <li><span className="font-mono font-semibold text-[#006EF3]">6NEW</span> — High-entropy cryptographic token cross-referencing student marks, oral reviews, and faculty signatures.</li>
                  </ul>
                </div>
              </section>

              <hr className="border-slate-100" />

              {/* 2. Public Registry */}
              <section id="registry" className="space-y-3 scroll-mt-24">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F3F7FC] text-[#012970] text-xs font-bold border border-[#E2E8F0]">
                  <Search className="h-3.5 w-3.5 text-[#006EF3]" />
                  Section 2
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#012970]">
                  2. 24/7 Real-Time Public Verification Portal
                </h2>
                <p className="text-[#667085]">
                  Employers, multinational corporations, and visa processing agencies can instantly query our official registry at <code className="text-xs bg-slate-100 px-2 py-0.5 rounded text-[#012970]">/verify/certificate/:code</code> or via the embedded scanner on the home page.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200/80 space-y-1">
                    <p className="font-bold text-xs text-[#012970]">Immutability</p>
                    <p className="text-xs text-[#667085]">
                      Once awarded, graduation metadata (student name, final score, CEFR level, instructor) cannot be edited or fabricated.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200/80 space-y-1">
                    <p className="font-bold text-xs text-[#012970]">Instant Revocation Alerts</p>
                    <p className="text-xs text-[#667085]">
                      Should any certificate be revoked due to honor code violations, our public ledger immediately reports the status as &quot;REVOKED&quot;.
                    </p>
                  </div>
                </div>
              </section>

              <hr className="border-slate-100" />

              {/* 3. CEFR Standards */}
              <section id="cefr-standards" className="space-y-3 scroll-mt-24">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F3F7FC] text-[#012970] text-xs font-bold border border-[#E2E8F0]">
                  <Award className="h-3.5 w-3.5 text-[#006EF3]" />
                  Section 3
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#012970]">
                  3. CEFR 4-Skill Mastery Criteria
                </h2>
                <p className="text-[#667085]">
                  LinguaChris certificates are not participation trophies. To earn an official CEFR digital diploma, students must prove measurable competency across 4 core modalities:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-[#F8FAFC] space-y-1">
                    <p className="text-xs font-bold text-[#012970]">1. Oral Fluency &amp; Pronunciation</p>
                    <p className="text-xs text-[#667085]">Independent recording submissions scored by CELTA-certified reviewers.</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-[#F8FAFC] space-y-1">
                    <p className="text-xs font-bold text-[#012970]">2. Listening Comprehension</p>
                    <p className="text-xs text-[#667085]">Audio drills at natural native speeds with dynamic contextual gap-filling.</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-[#F8FAFC] space-y-1">
                    <p className="text-xs font-bold text-[#012970]">3. Functional Grammar &amp; Syntax</p>
                    <p className="text-xs text-[#667085]">Sentence unscrambler drills, connector matching, and syntax tests.</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-[#F8FAFC] space-y-1">
                    <p className="text-xs font-bold text-[#012970]">4. Oxford 3000/5000 Lexis</p>
                    <p className="text-xs text-[#667085]">Spaced-repetition mastery of Tier-specific high-frequency vocabulary.</p>
                  </div>
                </div>
              </section>

              <hr className="border-slate-100" />

              {/* 4. Infrastructure Security */}
              <section id="infra-security" className="space-y-3 scroll-mt-24">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F3F7FC] text-[#012970] text-xs font-bold border border-[#E2E8F0]">
                  <Server className="h-3.5 w-3.5 text-[#006EF3]" />
                  Section 4
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#012970]">
                  4. Cloud &amp; Network Security Safeguards
                </h2>
                <p className="text-[#667085]">
                  Our production infrastructure is hardened against malicious traffic, automated scrapers, and data exfiltration:
                </p>
                <ul className="text-xs text-[#667085] space-y-2 list-disc pl-5">
                  <li><strong>TLS 1.3 Transport:</strong> Enforced HTTPS encryption on all incoming and internal API microservices.</li>
                  <li><strong>Encrypted Database Storage:</strong> Automated daily snapshots encrypted with AES-256 keys.</li>
                  <li><strong>Rate-Limiting &amp; Anti-DDoS:</strong> Edge protection filtering out credential stuffing and abusive traffic.</li>
                  <li><strong>Secure JWT Sessions:</strong> Cryptographically signed session tokens with secure, HTTP-only cookie flags.</li>
                </ul>
              </section>

              <hr className="border-slate-100" />

              {/* 5. Audio Sandboxing */}
              <section id="audio-sandbox" className="space-y-3 scroll-mt-24">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F3F7FC] text-[#012970] text-xs font-bold border border-[#E2E8F0]">
                  <Lock className="h-3.5 w-3.5 text-[#006EF3]" />
                  Section 5
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#012970]">
                  5. Voice Biometric &amp; Audio Protection
                </h2>
                <p className="text-[#667085]">
                  Because speaking audio contains biometric vocal characteristics, student speech recordings are stored in sandboxed object storage with access control policies restricted exclusively to the authenticated learner and their pedagogical mentors. We do not license, sell, or allow third parties to train generalized commercial voice models on student speech.
                </p>
              </section>

              <hr className="border-slate-100" />

              {/* 6. Vulnerability Disclosure */}
              <section id="vulnerability-reporting" className="space-y-4 scroll-mt-24">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F3F7FC] text-[#012970] text-xs font-bold border border-[#E2E8F0]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#006EF3]" />
                  Section 6
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#012970]">
                  6. Responsible Vulnerability Disclosure
                </h2>
                <p className="text-[#667085]">
                  We welcome ethical security researchers to evaluate our defenses. If you identify a potential security vulnerability or ledger bug:
                </p>

                <div className="rounded-2xl border border-slate-200 bg-[#F3F7FC] p-5 space-y-2">
                  <p className="text-xs font-bold text-[#012970]">LinguaChris Academy Security Team</p>
                  <p className="text-xs text-[#667085]">Security Contact Email:{' '}
                    <a href="mailto:linguachrisltd@gmail.com" className="text-[#006EF3] font-semibold hover:underline">
                      linguachrisltd@gmail.com
                    </a>
                  </p>
                  <p className="text-xs text-[#667085]">Subject Line: <code className="text-xs bg-slate-200/80 px-2 py-0.5 rounded text-[#012970]">[SECURITY DISCLOSURE] - Vulnerability Report</code></p>
                  <p className="text-[11px] text-[#667085] italic pt-1">
                    We commit to acknowledging all responsible disclosures within 24 business hours.
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
