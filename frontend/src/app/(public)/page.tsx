'use client';

import React, { useState, useEffect } from 'react';
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
import { apiClient } from '@/lib/api-client';

function CountUpNumber({ end, duration = 1800, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (end <= 0) {
      setCount(0);
      return;
    }
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic: 1 - (1 - t)^3
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * end));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [end, duration]);

  return (
    <span>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

const VOCABULARY_LIST = [
  {
    word: 'Mellifluous',
    phonetic: '/məˈlɪf.lu.əs/',
    pos: 'Adjective • Advanced (C2)',
    meaning: 'Sweet or musical; pleasant to hear.',
    example: 'Her mellifluous voice captivated everyone in the auditorium.',
  },
  {
    word: 'Eloquent',
    phonetic: '/ˈel.ə.kwənt/',
    pos: 'Adjective • Advanced (C1)',
    meaning: 'Fluent or persuasive in speaking or writing.',
    example: 'She delivered an eloquent keynote on global bilingual education.',
  },
  {
    word: 'Serendipity',
    phonetic: '/ˌser.ənˈdɪp.ə.ti/',
    pos: 'Noun • Upper-Intermediate (B2)',
    meaning: 'The occurrence and development of events by chance in a happy or beneficial way.',
    example: 'Discovering LinguaChris Academy at this turning point was pure serendipity.',
  },
  {
    word: 'Ephemeral',
    phonetic: '/ɪˈfem.ər.əl/',
    pos: 'Adjective • Advanced (C1)',
    meaning: 'Lasting for a very short time; fleeting.',
    example: 'Online trends are ephemeral, but strong communication skills last forever.',
  },
  {
    word: 'Luminous',
    phonetic: '/ˈluː.mɪ.nəs/',
    pos: 'Adjective • Intermediate (B1)',
    meaning: 'Full of or shedding light; bright or shining, especially in the dark.',
    example: 'The students shared luminous ideas during the interactive discussion.',
  },
  {
    word: 'Petrichor',
    phonetic: '/ˈpet.rɪ.kɔːr/',
    pos: 'Noun • Advanced (C1)',
    meaning: 'A pleasant earthy smell that frequently accompanies the first rain after dry weather.',
    example: 'The scent of petrichor drifted in through the open windows after the afternoon shower.',
  },
  {
    word: 'Halcyon',
    phonetic: '/ˈhæl.si.ən/',
    pos: 'Adjective • Advanced (C2)',
    meaning: 'Denoting a period of time in the past that was idyllically happy and peaceful.',
    example: 'He fondly recalled the halcyon days of youth and discovery.',
  },
  {
    word: 'Sonorous',
    phonetic: '/ˈsɒn.ər.əs/',
    pos: 'Adjective • Advanced (C1)',
    meaning: 'Imposingly deep, rich, and full-sounding.',
    example: 'His sonorous voice resonated clearly through the conference hall.',
  },
  {
    word: 'Ineffable',
    phonetic: '/ɪnˈef.ə.bəl/',
    pos: 'Adjective • Advanced (C2)',
    meaning: 'Too great, beautiful, or extreme to be expressed in words.',
    example: 'She felt an ineffable sense of achievement as she completed her final level.',
  },
  {
    word: 'Alacrity',
    phonetic: '/əˈlæk.rə.ti/',
    pos: 'Noun • Advanced (C1)',
    meaning: 'Brisk and cheerful readiness; enthusiastic promptness.',
    example: 'The class embarked on their oral presentations with inspiring alacrity.',
  },
];

export default function HomePage() {
  // 1. Interactive Vocabulary Flashcard State
  const [vocabIndex, setVocabIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const currentVocab = VOCABULARY_LIST[vocabIndex];

  const handleNextWord = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsFlipped(false);
    setVocabIndex((prev) => (prev + 1) % VOCABULARY_LIST.length);
  };

  // 2. Interactive CEFR Level Tab State
  const [activeLevelIndex, setActiveLevelIndex] = useState(3); // Default B1

  // 3. Dynamic Real DB Platform Stats
  const [platformStats, setPlatformStats] = useState({
    enrolledStudents: 33,
    courses: 8,
    lessons: 4,
  });

  useEffect(() => {
    let isMounted = true;
    apiClient
      .get<any>('/public/stats')
      .then((res) => {
        if (!isMounted) return;
        const data = res?.data || res;
        if (data && typeof data === 'object') {
          setPlatformStats({
            enrolledStudents: Number(data.enrolledStudents) || 33,
            courses: Number(data.courses) || 8,
            lessons: Number(data.lessons) || 4,
          });
        }
      })
      .catch((err) => {
        console.warn('Failed to load dynamic platform statistics:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
    <div className="flex flex-col gap-12 sm:gap-16 md:gap-24 overflow-x-hidden w-full max-w-full bg-white">
      {/* =========================================================================
          HERO SECTION — MODERN GEOMETRIC STYLE MATCHING BRAND IDENTITY
      ========================================================================= */}
      <section className="relative w-full overflow-hidden bg-white pt-4 pb-10 sm:pt-10 sm:pb-16 lg:py-16 border-b border-slate-100">
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">

            {/* LEFT COLUMN: HERO HEADLINE & CALL TO ACTIONS */}
            <div className="lg:col-span-6 space-y-5 sm:space-y-7 text-left">
              {/* Main Headline styled with official brand palette */}
              <div className="space-y-1">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#006EF3] leading-none">
                  E-Learning
                </h1>
                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#012970] leading-tight">
                  Online Courses
                </h2>
              </div>

              {/* Descriptive Summary */}
              <p className="max-w-xl text-xs sm:text-base text-[#667085] leading-relaxed font-normal">
                Master fluent English with structured CEFR curriculum from Pre-A1 to C2, certified instructor guidance, and 16 interactive multi-skill drills engineered for natural fluency and recognized certifications.
              </p>

              {/* Dual Action Buttons: 2x2 grid on mobile, horizontal flex on tablet/desktop */}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-3 pt-1 sm:pt-2 w-full">
                <Link href="/login" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto rounded-xl bg-[#012970] text-white px-4 sm:px-8 py-3 sm:py-3.5 font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-[#006EF3] transition-all hover:scale-105 active:scale-95 text-center">
                    SIGN IN
                  </button>
                </Link>

                <Link href="/apply" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto rounded-xl bg-[#006EF3] text-white px-4 sm:px-8 py-3 sm:py-3.5 font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-[#005ed1] transition-all hover:scale-105 active:scale-95 text-center">
                    APPLY NOW
                  </button>
                </Link>

                <Link href="/courses" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto rounded-xl border-2 border-[#012970] text-[#012970] px-4 sm:px-8 py-2.5 sm:py-3 font-bold text-xs uppercase tracking-wider hover:bg-[#012970] hover:text-white transition-all hover:scale-105 active:scale-95 text-center">
                    READ MORE
                  </button>
                </Link>
              </div>
            </div>

            {/* RIGHT COLUMN: CIRCULAR GRAPHIC COMPOSITION WITH CHRIS.PNG */}
            <div className="lg:col-span-6 relative flex items-center justify-center lg:justify-end mt-4 lg:mt-0">
              <div className="relative w-full max-w-[300px] sm:max-w-[400px] lg:max-w-[480px] aspect-square flex items-center justify-center">

                {/* Outermost Concentric Primary Navy Ring */}
                <div className="absolute inset-0 rounded-full border-[14px] sm:border-[20px] lg:border-[28px] border-[#012970] opacity-95 shadow-2xl" />

                {/* Inner Solid Blue Gradient Circle */}
                <div className="absolute inset-3 sm:inset-6 lg:inset-8 rounded-full bg-gradient-to-br from-[#006EF3] to-[#012970] opacity-90 overflow-hidden" />

                {/* Left Offset Partial Circle Ring in Brand Gold */}
                <div className="absolute -left-6 sm:-left-10 top-1/3 h-20 w-20 sm:h-28 sm:w-28 rounded-full border-[8px] sm:border-[12px] border-[#F5B400] hidden sm:block pointer-events-none opacity-85" />

                {/* Hero Photograph: chris.png */}
                <div className="relative z-10 w-[90%] h-[90%] rounded-full overflow-hidden flex items-center justify-center">
                  <img
                    src="/chris.png"
                    alt="Chris - LinguaChris Academy Instructor"
                    className="w-full h-full object-cover object-top scale-105"
                  />
                </div>

                {/* Prominent Floating "50% OFF" Badge */}
                <div className="absolute -top-1 -right-1 sm:top-2 sm:right-2 z-20 flex h-22 w-22 sm:h-28 sm:w-28 lg:h-32 lg:w-32 flex-col items-center justify-center rounded-full bg-[#012970] text-white shadow-xl border-3 sm:border-4 border-white transform rotate-6 hover:rotate-0 transition-transform duration-300">
                  <span className="text-[10px] sm:text-xs font-bold italic tracking-tight text-[#F3F7FC]">The best</span>
                  <span className="text-[11px] sm:text-sm font-bold uppercase tracking-wider text-white">courses</span>
                  <span className="text-base sm:text-xl lg:text-2xl font-black leading-none mt-0.5 text-[#F5B400]">50%</span>
                  <span className="text-[9px] sm:text-xs font-bold uppercase text-white">OFF</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          KEY PLATFORM CAPABILITIES & STATS BAR
      ========================================================================= */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-6 min-w-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-3.5 sm:p-5 shadow-sm flex items-center gap-3 sm:gap-4 hover:border-[#006EF3]/40 transition-colors">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-[#F3F7FC] text-[#012970]">
              <Award className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-base sm:text-xl font-bold text-[#172033]">7 Levels</p>
              <p className="text-[10px] sm:text-xs text-[#667085] font-medium leading-tight">Pre-A1 to C2 Framework</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-3.5 sm:p-5 shadow-sm flex items-center gap-3 sm:gap-4 hover:border-[#006EF3]/40 transition-colors">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-[#F3F7FC] text-[#006EF3]">
              <Zap className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-base sm:text-xl font-bold text-[#172033]">16 Drills</p>
              <p className="text-[10px] sm:text-xs text-[#667085] font-medium leading-tight">Multi-Skill Activity Suite</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-3.5 sm:p-5 shadow-sm flex items-center gap-3 sm:gap-4 hover:border-[#006EF3]/40 transition-colors">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-[#F3F7FC] text-[#012970]">
              <Users className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-base sm:text-xl font-bold text-[#172033]">100%</p>
              <p className="text-[10px] sm:text-xs text-[#667085] font-medium leading-tight">Certified CELTA Standards</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-3.5 sm:p-5 shadow-sm flex items-center gap-3 sm:gap-4 hover:border-[#006EF3]/40 transition-colors">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-[#F3F7FC] text-[#006EF3]">
              <FileCheck className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-base sm:text-xl font-bold text-[#172033]">Verified</p>
              <p className="text-[10px] sm:text-xs text-[#667085] font-medium leading-tight">CEFR Digital Diplomas</p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7-SKILL MATRIX & INTERACTIVE CEFR LEVEL EXPLORER
      ========================================================================= */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0">
        <div className="w-full max-w-full min-w-0 rounded-2xl sm:rounded-3xl border border-[#E2E8F0] bg-[#F3F7FC] p-4 sm:p-8 lg:p-10 overflow-hidden">
          <div className="text-center space-y-2 sm:space-y-3 max-w-2xl mx-auto mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#172033] break-words">
              Interactive CEFR Level Explorer
            </h2>
            <p className="text-xs sm:text-sm text-[#667085]">
              Click any level from Pre-A1 to C2 to inspect target competencies, core vocabulary, and native speaking audio models.
            </p>
          </div>

          {/* Level Selector Tabs: horizontally scrollable with touch-friendly pills on mobile */}
          <div className="w-full max-w-full min-w-0 overflow-x-auto pb-2 sm:pb-0 mb-6 sm:mb-8 scrollbar-none">
            <div className="inline-flex sm:flex sm:flex-wrap items-center sm:justify-center gap-1.5 sm:gap-2 min-w-max sm:min-w-0 px-1 py-1">
              {levels.map((lvl, idx) => (
                <button
                  key={lvl.code}
                  onClick={() => setActiveLevelIndex(idx)}
                  className={`shrink-0 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold transition-all ${activeLevelIndex === idx
                      ? 'bg-[#012970] text-white shadow-md scale-105'
                      : 'bg-white text-[#172033] hover:bg-[#dbe7f8] border border-[#E2E8F0]'
                    }`}
                >
                  <span>{lvl.code}</span>
                  <span className="ml-1 text-[10px] opacity-80">({lvl.name})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Level Detail Showcase */}
          <div className="w-full max-w-full min-w-0 rounded-2xl sm:rounded-3xl border border-[#E2E8F0] bg-white p-4 sm:p-8 shadow-md transition-all overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-center min-w-0">
              <div className="space-y-4 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#006EF3] text-white font-bold text-lg shadow-sm shrink-0">
                    {levels[activeLevelIndex].code}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-[#172033] truncate">
                      {levels[activeLevelIndex].name} Tier
                    </h3>
                    <p className="text-xs text-[#006EF3] font-semibold truncate">
                      {levels[activeLevelIndex].targetSkill}
                    </p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-[#667085] leading-relaxed break-words">
                  {levels[activeLevelIndex].desc}
                </p>
                <Link href={`/apply?level=${levels[activeLevelIndex].code}`} className="block sm:inline-block w-full sm:w-auto">
                  <Button className="w-full sm:w-auto rounded-xl bg-[#012970] text-white hover:bg-[#006EF3] text-xs font-bold px-5 transition-colors">
                    Start Level {levels[activeLevelIndex].code} Syllabus
                  </Button>
                </Link>
              </div>

              {/* Interactive Audio Sample */}
              <div className="w-full min-w-0 rounded-2xl border border-[#E2E8F0] bg-[#F3F7FC] p-4 sm:p-6 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#172033]">
                  <span>Native Speaking Model</span>
                  <button
                    onClick={() => playTts(levels[activeLevelIndex].samplePhrase)}
                    className="flex items-center gap-1 text-[#006EF3] hover:text-[#012970] font-semibold shrink-0"
                  >
                    <Volume2 className="h-4 w-4" />
                    <span>Listen</span>
                  </button>
                </div>
                <p className="text-xs sm:text-sm font-medium italic text-[#172033] leading-relaxed break-words">
                  "{levels[activeLevelIndex].samplePhrase}"
                </p>
                <p className="text-[10px] text-[#667085]">
                  Click 'Listen' to trigger real-time Web Speech synthesis.
                </p>
              </div>

              {/* Vocabulary Pill Cloud */}
              <div className="w-full min-w-0 rounded-2xl border border-[#E2E8F0] bg-[#F3F7FC] p-4 sm:p-6 space-y-3">
                <p className="text-xs font-bold text-[#172033]">
                  Core Oxford Vocabulary Focus
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {levels[activeLevelIndex].vocab.map((v, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-white px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold text-[#172033] shadow-sm border border-[#E2E8F0]"
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
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-6 space-y-5 sm:space-y-6">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#172033]">
              16 Multi-Skill Interactive Activity Types
            </h2>
            <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
              Every lesson combines 16 active cognitive drills: 3D spaced-repetition flashcards, dynamic gap filling, audio speed manipulation, drag-and-drop word scrambles, and live voice recording.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1 sm:pt-2">
              <div className="rounded-2xl border border-[#E2E8F0] p-3 sm:p-3.5 bg-white flex items-center gap-2.5 hover:border-[#006EF3]/30 transition-colors">
                <CheckCircle className="h-4 w-4 text-[#006EF3] shrink-0" />
                <span className="text-xs font-bold text-[#172033]">3D Flashcard Flips</span>
              </div>
              <div className="rounded-2xl border border-[#E2E8F0] p-3 sm:p-3.5 bg-white flex items-center gap-2.5 hover:border-[#006EF3]/30 transition-colors">
                <CheckCircle className="h-4 w-4 text-[#006EF3] shrink-0" />
                <span className="text-xs font-bold text-[#172033]">Speaking Waveforms</span>
              </div>
              <div className="rounded-2xl border border-[#E2E8F0] p-3 sm:p-3.5 bg-white flex items-center gap-2.5 hover:border-[#006EF3]/30 transition-colors">
                <CheckCircle className="h-4 w-4 text-[#006EF3] shrink-0" />
                <span className="text-xs font-bold text-[#172033]">Matching Connectors</span>
              </div>
              <div className="rounded-2xl border border-[#E2E8F0] p-3 sm:p-3.5 bg-white flex items-center gap-2.5 hover:border-[#006EF3]/30 transition-colors">
                <CheckCircle className="h-4 w-4 text-[#006EF3] shrink-0" />
                <span className="text-xs font-bold text-[#172033]">Sentence Unscrambler</span>
              </div>
            </div>
          </div>

          {/* Interactive 3D Flippable Flashcard Demo Box */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="cursor-pointer relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-dashed border-[#006EF3]/30 bg-[#F3F7FC] p-5 sm:p-7 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] select-none"
            >
              {/* Card Header: Word of the Moment & Audio Pronunciation */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-black tracking-wider uppercase bg-[#006EF3] text-white shadow-xs">
                    <Sparkles className="h-3.5 w-3.5 text-[#F5B400] animate-pulse" />
                    Word of the Moment
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    Interactive 3D Flashcard &bull; {vocabIndex + 1}/{VOCABULARY_LIST.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    playTts(currentVocab.word);
                  }}
                  className="p-2 rounded-xl bg-white text-[#006EF3] shadow-xs hover:scale-110 active:scale-95 transition border border-[#E2E8F0] hover:bg-blue-50"
                  title={`Pronounce ${currentVocab.word}`}
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>

              {/* Flashcard Body */}
              <div className="mt-5 sm:mt-7 text-center py-6 sm:py-8 min-h-[180px] sm:min-h-[210px] flex flex-col items-center justify-center">
                {!isFlipped ? (
                  <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
                    <p className="text-3xl sm:text-5xl font-black text-[#172033] tracking-tight">
                      {currentVocab.word}
                    </p>
                    <p className="text-xs sm:text-sm font-mono text-[#006EF3] font-semibold">
                      {currentVocab.phonetic}
                    </p>
                    <p className="text-xs font-bold text-[#006EF3] pt-3 hover:underline">
                      Click card to reveal Oxford definition &amp; example &rarr;
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300 max-w-md mx-auto">
                    <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-[#012970]">
                      {currentVocab.pos}
                    </span>
                    <p className="text-sm sm:text-base font-bold text-[#172033] leading-relaxed">
                      &ldquo;{currentVocab.meaning}&rdquo;
                    </p>
                    <p className="text-xs text-[#667085] italic leading-relaxed">
                      &ldquo;{currentVocab.example}&rdquo;
                    </p>
                    <p className="text-[10px] text-[#006EF3] font-bold mt-2">
                      Click to flip back
                    </p>
                  </div>
                )}
              </div>

              {/* Card Footer Controls: Next Word */}
              <div className="pt-3 border-t border-[#006EF3]/15 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs text-[#667085]">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-medium text-slate-500">Tap card to flip definition</span>
                </div>

                <Button
                  type="button"
                  onClick={handleNextWord}
                  size="sm"
                  className="rounded-xl bg-[#006EF3] hover:bg-[#005ed1] text-white text-xs font-black px-4 h-8 shadow-sm transition-all hover:scale-105 active:scale-95 gap-1.5"
                >
                  <span>Next Word</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
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
          STATISTICS SECTION
      ========================================================================= */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0 py-8">
        <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 sm:p-10 shadow-sm space-y-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#172033]">
              Join our growing community
            </h2>
            <p className="text-sm text-[#667085] mt-1">
              Empowering learners across East Africa with world-class education.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Card className="p-6 border border-[#E2E8F0] shadow-sm flex flex-col items-center justify-center text-center">
              <Users className="h-8 w-8 text-[#006EF3] mb-3" />
              <span className="text-3xl font-black text-[#172033]">
                <CountUpNumber end={platformStats.enrolledStudents} suffix="+" />
              </span>
              <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider mt-1">Enrolled Students</span>
            </Card>

            <Card className="p-6 border border-[#E2E8F0] shadow-sm flex flex-col items-center justify-center text-center">
              <BookOpen className="h-8 w-8 text-[#006EF3] mb-3" />
              <span className="text-3xl font-black text-[#172033]">
                <CountUpNumber end={platformStats.courses} />
              </span>
              <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider mt-1">Courses</span>
            </Card>

            <Card className="p-6 border border-[#E2E8F0] shadow-sm flex flex-col items-center justify-center text-center">
              <FileCheck className="h-8 w-8 text-[#006EF3] mb-3" />
              <span className="text-3xl font-black text-[#172033]">
                <CountUpNumber end={platformStats.lessons} suffix="+" />
              </span>
              <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider mt-1">Lessons</span>
            </Card>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FINAL CALL TO ACTION BANNER (MATCHING THE 50% PROMO THEME)
      ========================================================================= */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 min-w-0">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#011b4a] via-[#012970] to-[#006EF3] p-6 sm:p-10 lg:p-12 text-white shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight text-white">
              Ready to Accelerate Your English Fluency &amp; Career?
            </h2>
            <p className="text-xs sm:text-sm text-[#F3F7FC] leading-relaxed">
              Register today to join hundreds of learners mastering English with LinguaChris Academy.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-2">
              <Link href="/apply" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto rounded-xl bg-[#F5B400] hover:bg-[#e0a400] text-[#011b4a] px-6 sm:px-8 py-3 font-bold text-xs uppercase tracking-wider shadow-lg transition-transform hover:scale-105 active:scale-95 text-center">
                  Join as a Student
                </Button>
              </Link>
              <Link href="/courses" className="w-full sm:w-auto">
                <Button variant="ghost" className="w-full sm:w-auto rounded-xl text-white hover:bg-white/10 text-xs font-bold text-center">
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
