'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  RotateCw,
  Play,
  Check,
  Search,
  Sparkle,
  Zap,
} from 'lucide-react';

interface Question {
  id: number;
  prompt: string;
  options: string[];
  correct: number;
  explanation: string;
}

const SAMPLE_QUIZ: Question[] = [
  {
    id: 1,
    prompt: 'Choose the correct form: "If she _____ earlier, she wouldn\'t have missed the flight."',
    options: ['had left', 'left', 'has left', 'would leave'],
    correct: 0,
    explanation: 'Third conditional requires "had + past participle" in the condition clause.',
  },
  {
    id: 2,
    prompt: 'Which word best completes the business context: "We need to _____ cross-functional synergies."',
    options: ['leverage', 'dissolve', 'stagnate', 'diminish'],
    correct: 0,
    explanation: '"Leverage" means to utilize something to maximum advantage in professional English.',
  },
  {
    id: 3,
    prompt: 'Select the correct preposition: "The executive team is committed _____ expanding in Kigali."',
    options: ['to', 'for', 'with', 'in'],
    correct: 0,
    explanation: 'The adjective "committed" takes the preposition "to" followed by a gerund (-ing).',
  },
];

export default function HomePage() {
  // 1. Interactive Micro Placement Diagnostic State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);

  // 2. Interactive Flashcard Demo State
  const [isFlipped, setIsFlipped] = useState(false);

  // 3. Interactive CEFR Level Tab State
  const [activeLevelIndex, setActiveLevelIndex] = useState(3); // Default B1

  // 4. Interactive Quick Certificate Search
  const [certQuery, setCertQuery] = useState('ENG-2026-X7Y9');

  // Text to Speech Audio Helper
  const playTts = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleOptionSelect = (index: number) => {
    if (hasAnswered) return;
    setSelectedOption(index);
    setHasAnswered(true);

    if (index === SAMPLE_QUIZ[currentQIndex].correct) {
      setQuizScore((prev: number) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQIndex + 1 < SAMPLE_QUIZ.length) {
      setCurrentQIndex((prev: number) => prev + 1);
      setSelectedOption(null);
      setHasAnswered(false);
    } else {
      setQuizFinished(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQIndex(0);
    setSelectedOption(null);
    setQuizScore(0);
    setQuizFinished(false);
    setHasAnswered(false);
  };

  const levels = [
    {
      code: 'Pre-A1',
      name: 'Foundations',
      desc: 'Alphabet, phonetic awareness, numbers 1-100, and essential greetings.',
      samplePhrase: 'Hello, my name is Eric. Nice to meet you.',
      vocab: ['Greeting', 'Alphabet', 'Number', 'Family'],
      targetSkill: 'Basic Phonetics & Recognition',
    },
    {
      code: 'A1',
      name: 'Beginner',
      desc: 'Everyday expressions, asking for directions, personal background, and simple shopping.',
      samplePhrase: 'Where is the library? How much is this book?',
      vocab: ['Direction', 'Price', 'Schedule', 'Occupation'],
      targetSkill: 'Daily Survival English',
    },
    {
      code: 'A2',
      name: 'Elementary',
      desc: 'Routine exchanges, past experiences, describing surroundings, and simple work tasks.',
      samplePhrase: 'I worked as a marketing assistant last year in Kigali.',
      vocab: ['Experience', 'Routine', 'Travel', 'Hobbies'],
      targetSkill: 'Routine Social Dialogue',
    },
    {
      code: 'B1',
      name: 'Intermediate',
      desc: 'Workplace interactions, travel readiness, explaining opinions, and writing coherent emails.',
      samplePhrase: 'I believe we should reschedule our team standup to Tuesday morning.',
      vocab: ['Reschedule', 'Feedback', 'Proposal', 'Opinion'],
      targetSkill: 'Independent Professional Communication',
    },
    {
      code: 'B2',
      name: 'Upper Intermediate',
      desc: 'Spontaneous fluency, technical discussions, negotiation, and complex text synthesis.',
      samplePhrase: 'Although the initial budget was tight, we mitigated the delay effectively.',
      vocab: ['Mitigate', 'Synergy', 'Feasibility', 'Consensus'],
      targetSkill: 'Spontaneous Executive Dialogue',
    },
    {
      code: 'C1',
      name: 'Advanced',
      desc: 'Nuanced professional discourse, complex academic arguments, and idiomatic precision.',
      samplePhrase: 'The empirical evidence corroborates our hypothesis on market expansion.',
      vocab: ['Corroborate', 'Empirical', 'Pragmatic', 'Paradigm'],
      targetSkill: 'High-Level Strategic Fluency',
    },
    {
      code: 'C2',
      name: 'Mastery',
      desc: 'Effortless native-level expression, subtle cultural humor, and persuasive eloquence.',
      samplePhrase: 'His extemporaneous address resonated profoundly across the symposium.',
      vocab: ['Extemporaneous', 'Nuance', 'Eloquence', 'Symposium'],
      targetSkill: 'Native Bilingual Mastery',
    },
  ];

  const skills = [
    { name: 'Reading', icon: BookOpen, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/50', example: 'Synthesizing complex editorial passages' },
    { name: 'Listening', icon: Headphones, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50', example: 'Deciphering rapid native podcasts & lectures' },
    { name: 'Speaking', icon: Mic, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/50', example: 'Boardroom impromptu pitching & STAR drills' },
    { name: 'Writing', icon: PenTool, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50', example: 'Drafting formal executive proposals & essays' },
    { name: 'Grammar', icon: BookMarked, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/50', example: 'Mastering conditionals, subjunctives & inversions' },
    { name: 'Vocabulary', icon: Languages, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/50', example: 'Building 5,000+ high-frequency industry terms' },
    { name: 'Pronunciation', icon: Volume2, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/50', example: 'Intonation contours & connected speech reduction' },
  ];

  const workflowSteps = [
    { step: '01', title: 'Create Account', desc: 'Register in seconds as a student or certified teacher.' },
    { step: '02', title: 'Find Course', desc: 'Browse CEFR-aligned courses tailored to your specific goals.' },
    { step: '03', title: 'Enroll & Pay', desc: 'Submit enrollment with Mobile Money or Bank Transfer.' },
    { step: '04', title: 'Teacher Activates', desc: 'Your instructor verifies payment and unlocks course modules.' },
    { step: '05', title: 'Start Learning', desc: 'Engage with 16 interactive exercise types and live feedback.' },
    { step: '06', title: 'Earn Diploma', desc: 'Measure skill benchmarks and receive accredited verifiable diplomas.' },
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section with Interactive Activity Preview */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.100),theme(colors.white))] dark:bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.950),theme(colors.slate.950))] opacity-60" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Hero Left Content */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50/80 px-3.5 py-1 text-xs font-semibold text-primary-700 dark:border-primary-800 dark:bg-primary-950/80 dark:text-primary-300">
                <Sparkles className="h-3.5 w-3.5 text-primary-600 animate-pulse" />
                <span>CEFR Pre-A1 to C2 • 16 Interactive Activity Types</span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl leading-[1.15]">
                Learn English. <br />
                <span className="text-gradient">Build Confidence.</span> <br />
                Lead Globally.
              </h1>

              <p className="max-w-xl text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                Connect with certified instructors, complete interactive multi-skill exercises, and earn accredited, verifiable certificates recognized worldwide.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link href="/register?role=student">
                  <Button variant="gradient" size="lg" className="w-full sm:w-auto shadow-lg shadow-primary-500/20">
                    <span>Start Free Placement Test</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/tracks">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Explore Specialized Tracks
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-4 text-left">
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">7 Levels</p>
                  <p className="text-xs text-slate-500">Pre-A1 to C2 Mastery</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">16 Types</p>
                  <p className="text-xs text-slate-500">Interactive Drills</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">100%</p>
                  <p className="text-xs text-slate-500">Verifiable Diplomas</p>
                </div>
              </div>
            </div>

            {/* Hero Right: Interactive Micro-Quiz & Flashcard Widget */}
            <div className="lg:col-span-6 space-y-6">
              {/* Interactive Micro Diagnostic Card */}
              <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-xs">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                        Try a Live English Placement Drill
                      </h3>
                      <p className="text-[10px] text-slate-500">
                        {quizFinished
                          ? 'Diagnostic Finished'
                          : `Question ${currentQIndex + 1} of ${SAMPLE_QUIZ.length}`}
                      </p>
                    </div>
                  </div>
                  <Badge variant="indigo" className="text-[10px]">
                    Interactive
                  </Badge>
                </div>

                {!quizFinished ? (
                  <div className="mt-4 space-y-4">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {SAMPLE_QUIZ[currentQIndex].prompt}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SAMPLE_QUIZ[currentQIndex].options.map((opt, idx) => {
                        let btnStyle = 'border-slate-200 hover:border-primary-400 bg-white dark:bg-slate-800 dark:border-slate-700';

                        if (hasAnswered) {
                          if (idx === SAMPLE_QUIZ[currentQIndex].correct) {
                            btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 font-bold';
                          } else if (idx === selectedOption) {
                            btnStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-700';
                          }
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => handleOptionSelect(idx)}
                            className={`flex items-center justify-between rounded-xl border p-3 text-left text-xs font-medium transition ${btnStyle}`}
                          >
                            <span>{opt}</span>
                            {hasAnswered && idx === SAMPLE_QUIZ[currentQIndex].correct && (
                              <Check className="h-4 w-4 text-emerald-600" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {hasAnswered && (
                      <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300 animate-in fade-in">
                        <p className="font-semibold text-slate-900 dark:text-white">Explanation:</p>
                        <p className="mt-0.5">{SAMPLE_QUIZ[currentQIndex].explanation}</p>
                        <Button
                          onClick={handleNextQuestion}
                          size="sm"
                          className="mt-3 w-full bg-primary-600 hover:bg-primary-700 text-white font-bold"
                        >
                          {currentQIndex + 1 < SAMPLE_QUIZ.length ? 'Next Question' : 'View Placement Result'}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 text-center space-y-3 py-4 animate-in zoom-in-95">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950">
                      <Award className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-900 dark:text-white">
                        Diagnostic Score: {quizScore} / {SAMPLE_QUIZ.length}
                      </p>
                      <p className="text-xs text-slate-500">
                        Recommended Entry Tier:{' '}
                        <span className="font-bold text-primary-600">
                          {quizScore === 3 ? 'B2 (Upper Intermediate)' : quizScore >= 1 ? 'B1 (Intermediate)' : 'A2 (Elementary)'}
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-2 justify-center pt-2">
                      <Button onClick={resetQuiz} variant="outline" size="sm" className="text-xs">
                        <RotateCw className="mr-1 h-3.5 w-3.5" /> Retake
                      </Button>
                      <Link href="/register?role=student">
                        <Button variant="gradient" size="sm" className="text-xs">
                          Save & Complete Full Diagnostic
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Interactive 3D Flippable Flashcard Demo */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="cursor-pointer rounded-2xl border border-indigo-200 bg-gradient-to-tr from-indigo-50 to-primary-50 p-5 shadow-md dark:border-indigo-900 dark:from-indigo-950/40 dark:to-slate-900 transition hover:shadow-lg"
              >
                <div className="flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Interactive 3D Flashcard Demo (Click to flip)</span>
                  </span>
                  <button
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      playTts('Eloquent');
                    }}
                    className="p-1 rounded-full bg-white text-indigo-600 shadow hover:scale-105 dark:bg-slate-800 dark:text-indigo-300"
                    title="Pronounce Word"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 text-center py-2">
                  {!isFlipped ? (
                    <div>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">Eloquent</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">/ˈel.ə.kwənt/</p>
                      <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-2 font-medium">
                        Click card to reveal definition & example ➔
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 animate-in fade-in">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        Fluent or persuasive in speaking or writing.
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                        "She gave an eloquent speech on cross-border education."
                      </p>
                      <p className="text-[10px] text-slate-400 mt-2">Click to flip back</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive CEFR Progression Framework */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="indigo">Global Standard Curriculum</Badge>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Interactive CEFR Level Explorer
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Click any level from Pre-A1 to C2 to inspect target competencies, core vocabulary, and interactive speaking prompts.
          </p>
        </div>

        {/* Level Selector Tabs */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {levels.map((lvl, idx) => (
            <button
              key={lvl.code}
              onClick={() => setActiveLevelIndex(idx)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeLevelIndex === idx
                  ? 'bg-primary-600 text-white shadow-md scale-105'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800'
              }`}
            >
              <span>{lvl.code}</span>
              <span className="ml-1 text-[10px] opacity-80">({lvl.name})</span>
            </button>
          ))}
        </div>

        {/* Active Level Detail Showcase */}
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900 transition-all">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-white font-extrabold text-lg">
                  {levels[activeLevelIndex].code}
                </span>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {levels[activeLevelIndex].name} Tier
                  </h3>
                  <p className="text-xs text-primary-600 font-semibold">
                    {levels[activeLevelIndex].targetSkill}
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {levels[activeLevelIndex].desc}
              </p>
              <Link href={`/register?role=student&level=${levels[activeLevelIndex].code}`}>
                <Button variant="gradient" size="sm" className="mt-2">
                  Start Level {levels[activeLevelIndex].code} Syllabus
                </Button>
              </Link>
            </div>

            {/* Interactive Audio Sample */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-800/50 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Sample Native Speaking Model</span>
                <button
                  onClick={() => playTts(levels[activeLevelIndex].samplePhrase)}
                  className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-semibold"
                >
                  <Volume2 className="h-4 w-4" />
                  <span>Listen</span>
                </button>
              </div>
              <p className="text-sm font-medium italic text-slate-900 dark:text-white leading-relaxed">
                "{levels[activeLevelIndex].samplePhrase}"
              </p>
            </div>

            {/* Vocabulary Pill Cloud */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-800/50 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Core Milestone Lexicon
              </h4>
              <div className="flex flex-wrap gap-2">
                {levels[activeLevelIndex].vocab.map((v) => (
                  <span
                    key={v}
                    onClick={() => playTts(v)}
                    className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-sm border border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 hover:border-primary-500"
                    title="Click to pronounce"
                  >
                    <Volume2 className="h-3 w-3 text-slate-400" />
                    <span>{v}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7 Core English Skills Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3">
          <Badge variant="indigo">Holistic Mastery</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            The 7 Core English Competencies
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Every lesson integrates receptive, productive, and communicative exercises to ensure complete fluency.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {skills.map((skill) => {
            const Icon = skill.icon;
            return (
              <div
                key={skill.name}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition group-hover:scale-110 ${skill.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">{skill.name}</h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">{skill.example}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Public Certificate Live Verification Teaser */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 sm:p-12 text-white shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <Badge variant="indigo" className="bg-primary-500/20 text-primary-300 border-primary-500/30">
                Instant Public Verification
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Accredited Digital Certificates with Instant Validation
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Employers and academic institutions can verify student credentials, final CEFR scores, and instructor seals in real time without login credentials.
              </p>
            </div>

            <div className="lg:col-span-5 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 space-y-3">
              <label className="text-xs font-semibold text-slate-200">
                Test Certificate Verification Lookup
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={certQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCertQuery(e.target.value)}
                  placeholder="Enter code (e.g. ENG-2026-X7Y9)"
                  className="flex-1 rounded-xl border border-white/20 bg-slate-900/80 px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Link href={`/verify/certificate/${certQuery}`}>
                  <Button size="sm" variant="gradient" className="font-bold">
                    <Search className="h-3.5 w-3.5 mr-1" />
                    Verify
                  </Button>
                </Link>
              </div>
              <p className="text-[10px] text-slate-400">
                Try default demo code: <span className="font-mono text-primary-300">ENG-2026-X7Y9</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3">
          <Badge variant="indigo">Transparent & Structured</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            How FluentEdge Works
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            A direct, teacher-moderated learning flow engineered for academic rigor and verifiable outcomes.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {workflowSteps.map((item) => (
            <div
              key={item.step}
              className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="text-3xl font-black text-primary-200 dark:text-primary-950">
                {item.step}
              </div>
              <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-white">{item.title}</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
