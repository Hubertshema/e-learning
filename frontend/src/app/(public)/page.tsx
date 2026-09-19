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

export default function HomePage() {
  // 1. Interactive Flashcard Demo State
  const [isFlipped, setIsFlipped] = useState(false);

  // 2. Interactive CEFR Level Tab State
  const [activeLevelIndex, setActiveLevelIndex] = useState(3); // Default B1

  // 3. Interactive Quick Certificate Search
  const [certQuery, setCertQuery] = useState('ENG-2026-X7Y9');

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
          HERO SECTION — EXACT MODERN GEOMETRIC STYLE MATCHING REFERENCE DESIGN
      ========================================================================= */}
      <section className="relative w-full overflow-hidden bg-white pt-6 pb-12 sm:pt-10 sm:pb-16 lg:py-16 border-b border-slate-100">
        {/* Top-Right Decorative Dot Matrix Grid */}
        <div className="absolute top-6 right-[44%] hidden xl:grid grid-cols-6 gap-2 opacity-60 z-0 pointer-events-none">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="h-1.5 w-1.5 rounded-full bg-sky-500" />
          ))}
        </div>

        {/* Bottom-Center Decorative Dot Matrix Grid */}
        <div className="absolute bottom-4 left-[46%] hidden xl:grid grid-cols-6 gap-2 opacity-60 z-0 pointer-events-none">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="h-1.5 w-1.5 rounded-full bg-sky-500" />
          ))}
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            
            {/* LEFT COLUMN: HERO HEADLINE & CALL TO ACTIONS */}
            <div className="lg:col-span-6 space-y-6 sm:space-y-7 text-left">
              {/* Main Headline styled exactly as reference */}
              <div className="space-y-1">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-sky-500 leading-none">
                  E-Learning
                </h1>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#0f3d6a] leading-tight">
                  Online Courses
                </h2>
              </div>

              {/* Descriptive Summary */}
              <p className="max-w-xl text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                Master fluent English with structured CEFR curriculum from Pre-A1 to C2, certified instructor guidance, and 16 interactive multi-skill drills engineered for natural fluency and recognized certifications.
              </p>

              {/* Dual Action Buttons (Reference Design Style) */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href="/login">
                  <button className="rounded-xl bg-[#0f3d6a] text-white px-8 py-3.5 font-black text-xs uppercase tracking-wider shadow-lg hover:bg-[#0b2b4f] transition-all hover:scale-105 active:scale-95">
                    SIGN IN
                  </button>
                </Link>

                <Link href="/courses">
                  <button className="rounded-xl border-2 border-[#0f3d6a] text-[#0f3d6a] px-8 py-3 font-black text-xs uppercase tracking-wider hover:bg-[#0f3d6a] hover:text-white transition-all hover:scale-105 active:scale-95">
                    READ MORE
                  </button>
                </Link>

                <Link href="/quiz">
                  <button className="rounded-xl bg-sky-50 text-sky-700 border border-sky-200 px-5 py-3 font-bold text-xs hover:bg-sky-100 transition-all flex items-center gap-1.5 shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 text-sky-500" />
                    <span>Free Quick Diagnostic</span>
                  </button>
                </Link>
              </div>

              {/* Social Media Preview & Website Link Strip */}
              <div className="pt-6 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-3 text-slate-500 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-[10px] font-black">f</span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-[10px] font-black">in</span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-[10px] font-black">𝕏</span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-[10px] font-black">yt</span>
                  </div>
                  <span className="text-slate-600">/linguachris</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  For more information visit us at <span className="font-bold text-[#0f3d6a]">WWW.LINGUACHRIS.EDU</span>
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: CIRCULAR GRAPHIC COMPOSITION WITH CHRIS.PNG */}
            <div className="lg:col-span-6 relative flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-[480px] aspect-square flex items-center justify-center">
                
                {/* Outermost Concentric Deep Blue Ring */}
                <div className="absolute inset-0 rounded-full border-[28px] border-[#0f3d6a] opacity-95 shadow-2xl" />
                
                {/* Inner Solid Sky Blue Circle */}
                <div className="absolute inset-8 rounded-full bg-gradient-to-br from-sky-400 to-[#0284c7] opacity-90 overflow-hidden" />

                {/* Left Offset Partial Circle Ring */}
                <div className="absolute -left-10 top-1/3 h-28 w-28 rounded-full border-[12px] border-[#0f3d6a] hidden sm:block pointer-events-none opacity-80" />

                {/* Hero Photograph: chris.png */}
                <div className="relative z-10 w-[90%] h-[90%] rounded-full overflow-hidden flex items-center justify-center">
                  <img
                    src="/chris.png"
                    alt="Chris - LinguaChris Academy Instructor"
                    className="w-full h-full object-cover object-top scale-105"
                  />
                </div>

                {/* Prominent Floating "50% OFF" Badge */}
                <div className="absolute -top-2 -right-2 sm:top-2 sm:right-2 z-20 flex h-28 w-28 sm:h-32 sm:w-32 flex-col items-center justify-center rounded-full bg-sky-400 text-white shadow-xl border-4 border-white transform rotate-6 hover:rotate-0 transition-transform duration-300">
                  <span className="text-[11px] sm:text-xs font-bold italic tracking-tight">The best</span>
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider">courses</span>
                  <span className="text-lg sm:text-2xl font-black leading-none mt-0.5">50%</span>
                  <span className="text-[10px] sm:text-xs font-extrabold uppercase">OFF</span>
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
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900">7 Levels</p>
              <p className="text-xs text-slate-500 font-medium">Pre-A1 to C2 Framework</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900">16 Drills</p>
              <p className="text-xs text-slate-500 font-medium">Interactive Activity Suite</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900">100%</p>
              <p className="text-xs text-slate-500 font-medium">Certified CELTA Standards</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FileCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900">Verified</p>
              <p className="text-xs text-slate-500 font-medium">CEFR Digital Diplomas</p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7-SKILL MATRIX & INTERACTIVE CEFR LEVEL EXPLORER
      ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-8 sm:p-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Interactive CEFR Level Explorer
            </h2>
            <p className="text-sm text-slate-600">
              Click any level from Pre-A1 to C2 to inspect target competencies, core vocabulary, and native speaking audio models.
            </p>
          </div>

          {/* Level Selector Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {levels.map((lvl, idx) => (
              <button
                key={lvl.code}
                onClick={() => setActiveLevelIndex(idx)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  activeLevelIndex === idx
                    ? 'bg-[#0f3d6a] text-white shadow-md scale-105'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{lvl.code}</span>
                <span className="ml-1 text-[10px] opacity-80">({lvl.name})</span>
              </button>
            ))}
          </div>

          {/* Active Level Detail Showcase */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-md transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0f3d6a] text-white font-extrabold text-lg">
                    {levels[activeLevelIndex].code}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {levels[activeLevelIndex].name} Tier
                    </h3>
                    <p className="text-xs text-sky-600 font-semibold">
                      {levels[activeLevelIndex].targetSkill}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {levels[activeLevelIndex].desc}
                </p>
                <Link href={`/register?role=student&level=${levels[activeLevelIndex].code}`}>
                  <Button className="rounded-xl bg-[#0f3d6a] text-white hover:bg-[#0b2b4f] text-xs font-bold px-5">
                    Start Level {levels[activeLevelIndex].code} Syllabus
                  </Button>
                </Link>
              </div>

              {/* Interactive Audio Sample */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Native Speaking Model</span>
                  <button
                    onClick={() => playTts(levels[activeLevelIndex].samplePhrase)}
                    className="flex items-center gap-1 text-sky-600 hover:text-sky-700 font-semibold"
                  >
                    <Volume2 className="h-4 w-4" />
                    <span>Listen</span>
                  </button>
                </div>
                <p className="text-sm font-medium italic text-slate-900 leading-relaxed">
                  "{levels[activeLevelIndex].samplePhrase}"
                </p>
                <p className="text-[10px] text-slate-400">
                  Click 'Listen' to trigger real-time Web Speech synthesis.
                </p>
              </div>

              {/* Vocabulary Pill Cloud */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 space-y-3">
                <p className="text-xs font-bold text-slate-700">
                  Core Oxford Vocabulary Focus
                </p>
                <div className="flex flex-wrap gap-2">
                  {levels[activeLevelIndex].vocab.map((v, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm border border-slate-200"
                    >
                      {v}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">
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
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              16 Multi-Skill Interactive Activity Types
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every lesson combines 16 active cognitive drills: 3D spaced-repetition flashcards, dynamic gap filling, audio speed manipulation, drag-and-drop word scrambles, and live voice recording.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-2xl border border-slate-200 p-3.5 bg-white flex items-center gap-2.5">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-slate-800">3D Flashcard Flips</span>
              </div>
              <div className="rounded-2xl border border-slate-200 p-3.5 bg-white flex items-center gap-2.5">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-slate-800">Speaking Waveforms</span>
              </div>
              <div className="rounded-2xl border border-slate-200 p-3.5 bg-white flex items-center gap-2.5">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-slate-800">Matching Connectors</span>
              </div>
              <div className="rounded-2xl border border-slate-200 p-3.5 bg-white flex items-center gap-2.5">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-slate-800">Sentence Unscrambler</span>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/quiz">
                <Button className="rounded-xl bg-[#0f3d6a] text-white hover:bg-[#0b2b4f] text-xs font-bold px-6">
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
              className="cursor-pointer rounded-3xl border-2 border-dashed border-[#0f3d6a]/40 bg-gradient-to-br from-sky-50 to-blue-50/40 p-8 shadow-xl transition hover:shadow-2xl hover:scale-[1.01]"
            >
              <div className="flex items-center justify-between text-xs text-[#0f3d6a] font-bold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-sky-500" />
                  <span>Interactive 3D Flashcard (Click to flip)</span>
                </span>
                <button
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    playTts('Eloquent');
                  }}
                  className="p-1.5 rounded-xl bg-white text-[#0f3d6a] shadow hover:scale-110 transition"
                  title="Pronounce Word"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-8 text-center py-6">
                {!isFlipped ? (
                  <div className="space-y-2">
                    <p className="text-4xl font-black text-slate-900 tracking-tight">Eloquent</p>
                    <p className="text-sm text-slate-500 font-mono">/ˈel.ə.kwənt/</p>
                    <p className="text-xs font-bold text-sky-600 mt-4">
                      Click card to reveal Oxford definition & example ➔
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 animate-in fade-in">
                    <p className="text-sm font-bold text-slate-900">
                      Fluent or persuasive in speaking or writing.
                    </p>
                    <p className="text-xs text-slate-600 italic">
                      "She delivered an eloquent keynote on cross-border education."
                    </p>
                    <p className="text-[10px] text-slate-400 mt-3 font-semibold">Click to flip back</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          PUBLIC CERTIFICATE VERIFICATION WIDGET
      ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Tamper-Proof Certificate Verification Portal
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Employers and academic institutions worldwide can instantly verify student credentials, CEFR grade, issue date, and instructor accreditation without logging in.
              </p>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <label className="text-xs font-bold text-slate-700">
                  Enter Certificate Serial Code:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={certQuery}
                    onChange={(e) => setCertQuery(e.target.value.toUpperCase())}
                    placeholder="e.g. ENG-2026-X7Y9"
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f3d6a]"
                  />
                  <Link href={`/verify/certificate/${certQuery.trim() || 'ENG-2026-X7Y9'}`}>
                    <Button className="rounded-xl bg-[#0f3d6a] text-white hover:bg-[#0b2b4f] text-xs font-bold">
                      <Search className="h-3.5 w-3.5 mr-1" /> Verify
                    </Button>
                  </Link>
                </div>
                <p className="text-[11px] text-slate-500">
                  Sample verified code: <span className="font-mono font-bold text-sky-600">ENG-2026-X7Y9</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          STUDENT TESTIMONIALS & SUCCESS STORIES
      ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Trusted by Professionals & Learners Across East Africa
          </h2>
          <p className="text-sm text-slate-600">
            Real feedback from graduates who accelerated their global careers and passed CEFR accreditations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed italic">
                "The B2 Upper Intermediate course transformed my confidence in global sprint standups and async technical collaboration. I secured a remote role within 3 months."
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0f3d6a] text-white font-bold text-xs">
                EK
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Eric Karemera</p>
                <p className="text-[10px] text-slate-500">Full-Stack Developer, Kigali</p>
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed italic">
                "The structured grammar and speaking units gave me the natural fluency needed for international conferences and hospital exchange programs."
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white font-bold text-xs">
                CM
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Dr. Claire Mutoni</p>
                <p className="text-[10px] text-slate-500">Clinical Specialist, Rwanda</p>
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed italic">
                "The C1 Advanced course gave our executive team the vocabulary and precision needed to negotiate multi-million franc cross-border deals."
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-700 text-white font-bold text-xs">
                PN
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Patrick Ndahiro</p>
                <p className="text-[10px] text-slate-500">Managing Director, East Africa Logistics</p>
              </div>
            </div>
          </Card>
        </div>
      </section>



      {/* =========================================================================
          FINAL CALL TO ACTION BANNER (MATCHING THE 50% PROMO THEME)
      ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0f3d6a] via-[#0284c7] to-sky-500 p-8 sm:p-12 text-white shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="inline-block rounded-lg bg-white/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
              Limited Time 50% Discount Available
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Ready to Accelerate Your English Fluency & Career?
            </h2>
            <p className="text-sm text-sky-100 leading-relaxed">
              Take the free diagnostic placement quiz or register today to join hundreds of learners mastering English with LinguaChris Academy.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/register?role=student">
                <Button className="rounded-xl bg-white text-[#0f3d6a] hover:bg-slate-100 px-8 py-3 font-extrabold text-xs uppercase tracking-wider shadow-lg">
                  Join as a Student
                </Button>
              </Link>
              <Link href="/quiz">
                <Button variant="outline" className="rounded-xl border-2 border-white text-white hover:bg-white/20 px-6 py-3 font-extrabold text-xs uppercase tracking-wider">
                  Take Free Quick Test
                </Button>
              </Link>
              <Link href="/courses">
                <Button variant="ghost" className="rounded-xl text-white/90 hover:bg-white/10 text-xs font-bold">
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
