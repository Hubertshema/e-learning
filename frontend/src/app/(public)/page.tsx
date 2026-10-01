'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  BookOpen,
  Headphones,
  Mic,
  PenTool,
  BookMarked,
  Languages,
  Volume2,
  Sparkles,
  ArrowRight,
  CheckCircle,
  ShieldCheck,
  Award,
  Users,
  Star,
  ChevronRight,
  Check,
  Search,
  Zap,
  Globe,
  FileCheck,
} from 'lucide-react';
import { CertificateVerificationSection } from '@/components/certificate/certificate-verification-section';

export default function HomePage() {
  // 1. Interactive Flashcard Demo State
  const [isFlipped, setIsFlipped] = useState(false);

  // 2. Interactive CEFR Level Tab State
  const [activeLevelIndex, setActiveLevelIndex] = useState(3); // Default B1

  // Text to Speech Audio Helper
  const playTts = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const levels = [
    {
      code: 'Pre-A1',
      name: 'Foundations',
      desc: 'Alphabet, phonetic awareness, numbers 1-100, basic introductions, and survival greetings.',
      samplePhrase: 'Hello, my name is Eric. Nice to meet you.',
      vocab: ['Greeting', 'Alphabet', 'Number', 'Family'],
      targetSkill: 'Basic Phonetics & Recognition',
    },
    {
      code: 'A1',
      name: 'Beginner',
      desc: 'Everyday expressions, asking for directions, personal background, and simple shopping transactions.',
      samplePhrase: 'Where is the central library? How much is this notebook?',
      vocab: ['Direction', 'Price', 'Schedule', 'Occupation'],
      targetSkill: 'Daily Survival English',
    },
    {
      code: 'A2',
      name: 'Elementary',
      desc: 'Routine workplace exchanges, past experiences, describing surroundings, and simple work tasks.',
      samplePhrase: 'I worked as a project coordinator last year in Kigali.',
      vocab: ['Experience', 'Routine', 'Travel', 'Hobbies'],
      targetSkill: 'Routine Social Dialogue',
    },
    {
      code: 'B1',
      name: 'Intermediate',
      desc: 'Workplace interactions, agile standups, travel autonomy, explaining viewpoints, and writing clear emails.',
      samplePhrase: 'I believe we should reschedule our team sync to Tuesday morning.',
      vocab: ['Reschedule', 'Feedback', 'Proposal', 'Objective'],
      targetSkill: 'Independent Professional English',
    },
    {
      code: 'B2',
      name: 'Upper Intermediate',
      desc: 'Technical discussions, cross-functional collaboration, nuance comprehension, and spontaneous fluency.',
      samplePhrase: 'Let us leverage cross-functional synergies to optimize our deployment cycle.',
      vocab: ['Synergy', 'Constraint', 'Feasibility', 'Consensus'],
      targetSkill: 'Spontaneous Technical Discourse',
    },
    {
      code: 'C1',
      name: 'Advanced',
      desc: 'Complex executive negotiation, academic synthesis, subtle cultural idioms, and strategic persuasion.',
      samplePhrase: 'The proposed cross-border partnership hinges upon stringent compliance safeguards.',
      vocab: ['Safeguard', 'Nuance', 'Prerequisite', 'Bargaining'],
      targetSkill: 'Executive Strategic Fluency',
    },
    {
      code: 'C2',
      name: 'Mastery',
      desc: 'Native-level precision, effortless idiomatic expression, literary analysis, and diplomatic rhetoric.',
      samplePhrase: 'His argumentation was punctuated by eloquent rhetoric and uncompromising rigor.',
      vocab: ['Eloquent', 'Articulate', 'Impeccable', 'Rhetoric'],
      targetSkill: 'Mastery & Diplomatic Precision',
    },
  ];

  return (
    <div className="flex flex-col gap-16 md:gap-24 overflow-hidden bg-white">
      {/* =========================================================================
          HERO SECTION — MODERN GEOMETRIC STYLE MATCHING BRAND IDENTITY
      ========================================================================= */}
      <section className="relative w-full overflow-hidden bg-white pt-6 pb-12 sm:pt-10 sm:pb-16 lg:py-16 border-b border-slate-100">
        {/* Top-Right Decorative Dot Matrix Grid */}
        <div className="absolute top-6 right-[44%] hidden xl:grid grid-cols-6 gap-2 opacity-60 z-0 pointer-events-none">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="h-1.5 w-1.5 rounded-full bg-[#006EF3]/50" />
          ))}
        </div>

        {/* Bottom-Center Decorative Dot Matrix Grid */}
        <div className="absolute bottom-4 left-[46%] hidden xl:grid grid-cols-6 gap-2 opacity-60 z-0 pointer-events-none">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="h-1.5 w-1.5 rounded-full bg-[#F5B400]/60" />
          ))}
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">

            {/* LEFT COLUMN: HERO HEADLINE & CALL TO ACTIONS */}
            <div className="lg:col-span-6 space-y-6 sm:space-y-7 text-left">
              {/* Main Headline styled with official brand palette */}
              <div className="space-y-1">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#006EF3] leading-none">
                  E-Learning
                </h1>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#012970] leading-tight">
                  Online Courses
                </h2>
              </div>

              {/* Descriptive Summary */}
              <p className="max-w-xl text-sm sm:text-base text-[#667085] leading-relaxed font-normal">
                Master fluent English with structured CEFR curriculum from Pre-A1 to C2, certified instructor guidance, and 16 interactive multi-skill drills engineered for natural fluency and recognized certifications.
              </p>

              {/* Dual Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href="/login">
                  <button className="rounded-xl bg-[#012970] text-white px-8 py-3.5 font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-[#006EF3] transition-all hover:scale-105 active:scale-95">
                    SIGN IN
                  </button>
                </Link>

                <Link href="/courses">
                  <button className="rounded-xl border-2 border-[#012970] text-[#012970] px-8 py-3 font-bold text-xs uppercase tracking-wider hover:bg-[#012970] hover:text-white transition-all hover:scale-105 active:scale-95">
                    READ MORE
                  </button>
                </Link>

                <Link href="/apply">
                  <button className="rounded-xl bg-[#006EF3] text-white px-8 py-3.5 font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-[#005ed1] transition-all hover:scale-105 active:scale-95">
                    APPLY NOW
                  </button>
                </Link>

                <Link href="/quiz">
                  <button className="rounded-xl bg-[#F3F7FC] text-[#012970] border border-[#dbe7f8] px-5 py-3 font-bold text-xs hover:bg-[#dbe7f8] transition-all flex items-center gap-1.5 shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 text-[#F5B400]" />
                    <span>Free Quick Diagnostic</span>
                  </button>
                </Link>
              </div>
            </div>

            {/* RIGHT COLUMN: CIRCULAR GRAPHIC COMPOSITION WITH CHRIS.PNG */}
            <div className="lg:col-span-6 relative flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-[480px] aspect-square flex items-center justify-center">

                {/* Outermost Concentric Primary Navy Ring */}
                <div className="absolute inset-0 rounded-full border-[28px] border-[#012970] opacity-95 shadow-2xl" />

                {/* Inner Solid Blue Gradient Circle */}
                <div className="absolute inset-8 rounded-full bg-gradient-to-br from-[#006EF3] to-[#012970] opacity-90 overflow-hidden" />

                {/* Left Offset Partial Circle Ring in Brand Gold */}
                <div className="absolute -left-10 top-1/3 h-28 w-28 rounded-full border-[12px] border-[#F5B400] hidden sm:block pointer-events-none opacity-85" />

                {/* Hero Photograph: chris.png */}
                <div className="relative z-10 w-[90%] h-[90%] rounded-full overflow-hidden flex items-center justify-center">
                  <img
                    src="/chris.png"
                    alt="Chris - LinguaChris Academy Instructor"
                    className="w-full h-full object-cover object-top scale-105"
                  />
                </div>

                {/* Prominent Floating "50% OFF" Badge */}
                <div className="absolute -top-2 -right-2 sm:top-2 sm:right-2 z-20 flex h-28 w-28 sm:h-32 sm:w-32 flex-col items-center justify-center rounded-full bg-[#012970] text-white shadow-xl border-4 border-white transform rotate-6 hover:rotate-0 transition-transform duration-300">
                  <span className="text-[11px] sm:text-xs font-bold italic tracking-tight text-[#F3F7FC]">The best</span>
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">courses</span>
                  <span className="text-lg sm:text-2xl font-black leading-none mt-0.5 text-[#F5B400]">50%</span>
                  <span className="text-[10px] sm:text-xs font-bold uppercase text-white">OFF</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          KEY PLATFORM CAPABILITIES & STATS BAR
      ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm flex items-center gap-4 hover:border-[#006EF3]/40 transition-colors">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F3F7FC] text-[#012970]">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xl font-bold text-[#172033]">7 Levels</p>
              <p className="text-xs text-[#667085] font-medium">Pre-A1 to C2 Framework</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm flex items-center gap-4 hover:border-[#006EF3]/40 transition-colors">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F3F7FC] text-[#006EF3]">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xl font-bold text-[#172033]">16 Drills</p>
              <p className="text-xs text-[#667085] font-medium">Interactive Activity Suite</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm flex items-center gap-4 hover:border-[#006EF3]/40 transition-colors">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F3F7FC] text-[#012970]">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xl font-bold text-[#172033]">100%</p>
              <p className="text-xs text-[#667085] font-medium">Certified CELTA Standards</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm flex items-center gap-4 hover:border-[#006EF3]/40 transition-colors">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F3F7FC] text-[#006EF3]">
              <FileCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xl font-bold text-[#172033]">Verified</p>
              <p className="text-xs text-[#667085] font-medium">CEFR Digital Diplomas</p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7-SKILL MATRIX & INTERACTIVE CEFR LEVEL EXPLORER
      ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#E2E8F0] bg-[#F3F7FC] p-8 sm:p-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-[#172033] sm:text-4xl">
              Interactive CEFR Level Explorer
            </h2>
            <p className="text-sm text-[#667085]">
              Click any level from Pre-A1 to C2 to inspect target competencies, core vocabulary, and native speaking audio models.
            </p>
          </div>

          {/* Level Selector Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {levels.map((lvl, idx) => (
              <button
                key={lvl.code}
                onClick={() => setActiveLevelIndex(idx)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                  activeLevelIndex === idx
                    ? 'bg-[#012970] text-white shadow-md scale-105'
                    : 'bg-white text-[#172033] hover:bg-[#dbe7f8] border border-[#E2E8F0]'
                }`}
              >
                <span>{lvl.code}</span>
                <span className="ml-1 text-[10px] opacity-80">({lvl.name})</span>
              </button>
            ))}
          </div>

          {/* Active Level Detail Showcase */}
          <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 sm:p-8 shadow-md transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#006EF3] text-white font-bold text-lg shadow-sm">
                    {levels[activeLevelIndex].code}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-[#172033]">
                      {levels[activeLevelIndex].name} Tier
                    </h3>
                    <p className="text-xs text-[#006EF3] font-semibold">
                      {levels[activeLevelIndex].targetSkill}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-[#667085] leading-relaxed">
                  {levels[activeLevelIndex].desc}
                </p>
                <Link href={`/register?role=student&level=${levels[activeLevelIndex].code}`}>
                  <Button className="rounded-xl bg-[#012970] text-white hover:bg-[#006EF3] text-xs font-bold px-5 transition-colors">
                    Start Level {levels[activeLevelIndex].code} Syllabus
                  </Button>
                </Link>
              </div>

              {/* Interactive Audio Sample */}
              <div className="rounded-2xl border border-[#E2E8F0] bg-[#F3F7FC] p-6 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#172033]">
                  <span>Native Speaking Model</span>
                  <button
                    onClick={() => playTts(levels[activeLevelIndex].samplePhrase)}
                    className="flex items-center gap-1 text-[#006EF3] hover:text-[#012970] font-semibold"
                  >
                    <Volume2 className="h-4 w-4" />
                    <span>Listen</span>
                  </button>
                </div>
                <p className="text-sm font-medium italic text-[#172033] leading-relaxed">
                  "{levels[activeLevelIndex].samplePhrase}"
                </p>
                <p className="text-[10px] text-[#667085]">
                  Click 'Listen' to trigger real-time Web Speech synthesis.
                </p>
              </div>

              {/* Vocabulary Pill Cloud */}
              <div className="rounded-2xl border border-[#E2E8F0] bg-[#F3F7FC] p-6 space-y-3">
                <p className="text-xs font-bold text-[#172033]">
                  Core Oxford Vocabulary Focus
                </p>
                <div className="flex flex-wrap gap-2">
                  {levels[activeLevelIndex].vocab.map((v, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#172033] shadow-sm border border-[#E2E8F0]"
                    >
                      {v}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-[#667085]">
                  Includes spaced-repetition flashcards and contextual quizzes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          16 INTERACTIVE MULTI-SKILL ACTIVITIES DEMO & FLASHCARD
      ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-[#172033] sm:text-4xl">
              16 Multi-Skill Interactive Activity Types
            </h2>
            <p className="text-sm text-[#667085] leading-relaxed">
              Every lesson combines 16 active cognitive drills: 3D spaced-repetition flashcards, dynamic gap filling, audio speed manipulation, drag-and-drop word scrambles, and live voice recording.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-2xl border border-[#E2E8F0] p-3.5 bg-white flex items-center gap-2.5 hover:border-[#006EF3]/30 transition-colors">
                <CheckCircle className="h-4 w-4 text-[#006EF3] shrink-0" />
                <span className="text-xs font-bold text-[#172033]">3D Flashcard Flips</span>
              </div>
              <div className="rounded-2xl border border-[#E2E8F0] p-3.5 bg-white flex items-center gap-2.5 hover:border-[#006EF3]/30 transition-colors">
                <CheckCircle className="h-4 w-4 text-[#006EF3] shrink-0" />
                <span className="text-xs font-bold text-[#172033]">Speaking Waveforms</span>
              </div>
              <div className="rounded-2xl border border-[#E2E8F0] p-3.5 bg-white flex items-center gap-2.5 hover:border-[#006EF3]/30 transition-colors">
                <CheckCircle className="h-4 w-4 text-[#006EF3] shrink-0" />
                <span className="text-xs font-bold text-[#172033]">Matching Connectors</span>
              </div>
              <div className="rounded-2xl border border-[#E2E8F0] p-3.5 bg-white flex items-center gap-2.5 hover:border-[#006EF3]/30 transition-colors">
                <CheckCircle className="h-4 w-4 text-[#006EF3] shrink-0" />
                <span className="text-xs font-bold text-[#172033]">Sentence Unscrambler</span>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/quiz">
                <Button className="rounded-xl bg-[#006EF3] text-white hover:bg-[#005ed1] text-xs font-bold px-6 shadow-md transition-all">
                  Test Your English Now (Free Quiz)
                  <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Interactive 3D Flippable Flashcard Demo Box */}
          <div className="lg:col-span-6">
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="cursor-pointer rounded-3xl border-2 border-dashed border-[#006EF3]/30 bg-[#F3F7FC] p-8 shadow-xl transition hover:shadow-2xl hover:scale-[1.01]"
            >
              <div className="flex items-center justify-between text-xs text-[#012970] font-bold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#F5B400]" />
                  <span>Interactive 3D Flashcard (Click to flip)</span>
                </span>
                <button
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    playTts('Eloquent');
                  }}
                  className="p-1.5 rounded-xl bg-white text-[#006EF3] shadow hover:scale-110 transition border border-[#E2E8F0]"
                  title="Pronounce Word"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-8 text-center py-6">
                {!isFlipped ? (
                  <div className="space-y-2">
                    <p className="text-4xl font-bold text-[#172033] tracking-tight">Eloquent</p>
                    <p className="text-sm text-[#667085] font-mono">/ˈel.ə.kwənt/</p>
                    <p className="text-xs font-bold text-[#006EF3] mt-4">
                      Click card to reveal Oxford definition &amp; example ➔
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 animate-in fade-in">
                    <p className="text-sm font-bold text-[#172033]">
                      Fluent or persuasive in speaking or writing.
                    </p>
                    <p className="text-xs text-[#667085] italic">
                      "She delivered an eloquent keynote on cross-border education."
                    </p>
                    <p className="text-[10px] text-[#006EF3] mt-3 font-semibold">Click to flip back</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          OFFICIAL CERTIFICATE VERIFICATION SECTION
      ========================================================================= */}
      <CertificateVerificationSection />

      {/* =========================================================================
          STUDENT TESTIMONIALS & SUCCESS STORIES
      ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl font-bold tracking-tight text-[#172033] sm:text-4xl">
            Trusted by Professionals &amp; Learners Across East Africa
          </h2>
          <p className="text-sm text-[#667085]">
            Real feedback from graduates who accelerated their global careers and passed CEFR accreditations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="flex gap-1 text-[#F5B400]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-[#F5B400] text-[#F5B400]" />
                ))}
              </div>
              <p className="text-xs text-[#172033] leading-relaxed italic">
                "The B2 Upper Intermediate course transformed my confidence in global sprint standups and async technical collaboration. I secured a remote role within 3 months."
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#012970] text-white font-bold text-xs shadow-sm">
                EK
              </div>
              <div>
                <p className="text-xs font-bold text-[#172033]">Eric Karemera</p>
                <p className="text-[10px] text-[#667085]">Full-Stack Developer, Kigali</p>
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="flex gap-1 text-[#F5B400]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-[#F5B400] text-[#F5B400]" />
                ))}
              </div>
              <p className="text-xs text-[#172033] leading-relaxed italic">
                "The structured grammar and speaking units gave me the natural fluency needed for international conferences and hospital exchange programs."
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#006EF3] text-white font-bold text-xs shadow-sm">
                CM
              </div>
              <div>
                <p className="text-xs font-bold text-[#172033]">Dr. Claire Mutoni</p>
                <p className="text-[10px] text-[#667085]">Clinical Specialist, Rwanda</p>
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="flex gap-1 text-[#F5B400]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-[#F5B400] text-[#F5B400]" />
                ))}
              </div>
              <p className="text-xs text-[#172033] leading-relaxed italic">
                "The C1 Advanced course gave our executive team the vocabulary and precision needed to negotiate multi-million franc cross-border deals."
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#011b4a] text-white font-bold text-xs shadow-sm">
                PN
              </div>
              <div>
                <p className="text-xs font-bold text-[#172033]">Patrick Ndahiro</p>
                <p className="text-[10px] text-[#667085]">Managing Director, East Africa Logistics</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* =========================================================================
          FINAL CALL TO ACTION BANNER (MATCHING THE 50% PROMO THEME)
      ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#011b4a] via-[#012970] to-[#006EF3] p-8 sm:p-12 text-white shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-white">
              Ready to Accelerate Your English Fluency &amp; Career?
            </h2>
            <p className="text-sm text-[#F3F7FC] leading-relaxed">
              Take the free diagnostic placement quiz or register today to join hundreds of learners mastering English with LinguaChris Academy.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/register?role=student">
                <Button className="rounded-xl bg-[#F5B400] hover:bg-[#e0a400] text-[#011b4a] px-8 py-3 font-bold text-xs uppercase tracking-wider shadow-lg transition-transform hover:scale-105 active:scale-95">
                  Join as a Student
                </Button>
              </Link>
              <Link href="/quiz">
                <Button variant="outline" className="rounded-xl border-2 border-white text-white hover:bg-white/20 px-6 py-3 font-bold text-xs uppercase tracking-wider">
                  Take Free Quick Test
                </Button>
              </Link>
              <Link href="/courses">
                <Button variant="ghost" className="rounded-xl text-white hover:bg-white/10 text-xs font-bold">
                  Browse Catalog ➔
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
