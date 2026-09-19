'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Award,
  RotateCw,
  CheckCircle2,
  XCircle,
  Volume2,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  GraduationCap,
  ShieldCheck,
  Check,
  ChevronRight,
  HelpCircle,
  BarChart3,
  Clock,
} from 'lucide-react';

interface QuizQuestion {
  id: number;
  category: string;
  skill: string;
  difficulty: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  prompt: string;
  audioText?: string;
  options: string[];
  correct: number;
  explanation: string;
}

const EXTENDED_DIAGNOSTIC_QUIZ: QuizQuestion[] = [
  {
    id: 1,
    category: 'Grammar & Conditional Structures',
    skill: 'Grammar',
    difficulty: 'B2',
    prompt: 'Choose the correct form: "If she _____ earlier, she wouldn\'t have missed the flight."',
    options: ['had left', 'left', 'has left', 'would leave'],
    correct: 0,
    explanation: 'Third conditional requires "had + past participle" in the if-clause to describe an unreal past situation.',
  },
  {
    id: 2,
    category: 'Professional Workplace Vocabulary',
    skill: 'Vocabulary',
    difficulty: 'B2',
    prompt: 'Which word best completes the business context: "We need to _____ cross-functional synergies to optimize output."',
    options: ['leverage', 'dissolve', 'stagnate', 'diminish'],
    correct: 0,
    explanation: '"Leverage" means to utilize existing resources or strengths to maximum advantage.',
  },
  {
    id: 3,
    category: 'Dependent Prepositions & Collocations',
    skill: 'Grammar',
    difficulty: 'B1',
    prompt: 'Select the correct preposition: "The executive team is committed _____ expanding in East Africa."',
    options: ['to', 'for', 'with', 'in'],
    correct: 0,
    explanation: 'The adjective "committed" is followed by the preposition "to" and a gerund (-ing).',
  },
  {
    id: 4,
    category: 'Listening & Spoken Phrasing',
    skill: 'Listening',
    difficulty: 'B1',
    prompt: 'Listen to the audio prompt. Which response represents the most polite clarification during a conference call?',
    audioText: 'Could you please elaborate on the projected quarterly timeline?',
    options: [
      '"Certainly, let me walk you through our Phase 2 milestones."',
      '"No, I already explained that earlier."',
      '"Why do you want to know?"',
      '"I will think if I want to tell you."',
    ],
    correct: 0,
    explanation: '"Certainly, let me walk you through..." demonstrates professional courtesy and clear business communication etiquette.',
  },
  {
    id: 5,
    category: 'Tenses & Narrative Discourse',
    skill: 'Reading & Syntax',
    difficulty: 'A2',
    prompt: 'Choose the correct sentence for habitual workplace actions:',
    options: [
      'We usually conduct our team sprint retrospectives every alternate Friday.',
      'We are usually conducting our sprint retrospectives every alternate Friday.',
      'We conducted usually sprint retrospectives every alternate Friday.',
      'We will be conduct sprint retrospectives every alternate Friday.',
    ],
    correct: 0,
    explanation: 'Present Simple with the frequency adverb "usually" describes regular, repeating routines.',
  },
  {
    id: 6,
    category: 'Executive Discourse & Idiomatic Precision',
    skill: 'Advanced Fluency',
    difficulty: 'C1',
    prompt: 'In executive negotiation, what does "playing devil\'s advocate" mean?',
    options: [
      'Arguing an opposing viewpoint to test the strength of a business case',
      'Attacking colleagues personally during a disagreement',
      'Refusing to compromise under any condition',
      'Signing a legally binding NDA before talks',
    ],
    correct: 0,
    explanation: '"Playing devil\'s advocate" means intentionally advocating an opposite stance to identify potential blind spots.',
  },
];

export default function DiagnosticQuizPage() {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<Array<{ questionId: number; selected: number; isCorrect: boolean }>>([]);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);

  const currentQ = EXTENDED_DIAGNOSTIC_QUIZ[currentQIndex];

  // Text-to-speech helper
  const playTts = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
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

    const isCorrect = index === currentQ.correct;
    if (isCorrect) {
      setQuizScore((prev) => prev + 1);
    }

    setUserAnswers((prev) => [
      ...prev,
      {
        questionId: currentQ.id,
        selected: index,
        isCorrect,
      },
    ]);
  };

  const handleNextQuestion = () => {
    if (currentQIndex + 1 < EXTENDED_DIAGNOSTIC_QUIZ.length) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOption(null);
      setHasAnswered(false);
    } else {
      setQuizFinished(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQIndex(0);
    setSelectedOption(null);
    setUserAnswers([]);
    setQuizScore(0);
    setQuizFinished(false);
    setHasAnswered(false);
  };

  // Tier calculation based on score
  const getRecommendedTier = (score: number) => {
    const percentage = (score / EXTENDED_DIAGNOSTIC_QUIZ.length) * 100;
    if (percentage >= 85) {
      return {
        level: 'C1',
        title: 'C1 Advanced & Executive Fluency',
        description: 'You possess strong command of nuanced grammar, executive idiom, and complex sentence structures.',
        recommendedCourse: 'Executive Business English & Cross-Border Negotiation',
        slug: 'c1-executive-business-english',
        badgeColor: 'indigo',
      };
    } else if (percentage >= 65) {
      return {
        level: 'B2',
        title: 'B2 Upper Intermediate Fluency',
        description: 'You have solid grasp of conditionals, collocations, and spontaneous conversational English.',
        recommendedCourse: 'English for IT, Software Engineering & Global Tech',
        slug: 'b2-tech-software-engineering',
        badgeColor: 'primary',
      };
    } else if (percentage >= 45) {
      return {
        level: 'B1',
        title: 'B1 Intermediate Operational English',
        description: 'You communicate well in standard workplace scenarios, with room to refine complex tenses.',
        recommendedCourse: 'B1 Intermediate Professional English Communication',
        slug: 'b1-intermediate-workplace-english',
        badgeColor: 'success',
      };
    } else {
      return {
        level: 'A2',
        title: 'A2 Elementary English Foundations',
        description: 'You understand everyday phrases and basic sentence structures. Ready for structured mastery!',
        recommendedCourse: 'A2 Practical Everyday & Workplace Fluency',
        slug: 'a2-elementary-practical-english',
        badgeColor: 'warning',
      };
    }
  };

  const resultTier = getRecommendedTier(quizScore);

  return (
    <div className="min-h-screen bg-slate-50 py-12 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header Title Section */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1 text-xs font-semibold text-sky-700 dark:border-sky-900 dark:bg-sky-950/60 dark:text-sky-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Official CEFR Diagnostic Assessment</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Free English Placement & Diagnostic Quiz
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Take this 6-question interactive assessment to discover your estimated CEFR English level (Pre-A1 to C2) and receive personalized course recommendations.
          </p>
        </div>

        {!quizFinished ? (
          <div className="space-y-6">
            {/* Progress & Meta Info Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f3d6a] text-white font-bold text-sm">
                  {currentQIndex + 1}/{EXTENDED_DIAGNOSTIC_QUIZ.length}
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {currentQ.category}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Skill: <span className="font-semibold text-primary-600">{currentQ.skill}</span> • Target: <span className="font-semibold">{currentQ.difficulty}</span>
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full sm:w-48">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(((currentQIndex + 1) / EXTENDED_DIAGNOSTIC_QUIZ.length) * 100)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-[#0f3d6a] transition-all duration-300"
                    style={{
                      width: `${((currentQIndex + 1) / EXTENDED_DIAGNOSTIC_QUIZ.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Question Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    Question {currentQIndex + 1} of {EXTENDED_DIAGNOSTIC_QUIZ.length}
                  </Badge>
                  {currentQ.audioText && (
                    <button
                      onClick={() => playTts(currentQ.audioText!)}
                      className="flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300"
                    >
                      <Volume2 className="h-4 w-4" />
                      <span>Play Audio Prompt</span>
                    </button>
                  )}
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
                  {currentQ.prompt}
                </h2>

                {currentQ.audioText && (
                  <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-3.5 dark:border-sky-950 dark:bg-sky-950/30">
                    <p className="text-xs italic text-slate-700 dark:text-slate-300">
                      🎧 Audio dialogue: "{currentQ.audioText}"
                    </p>
                  </div>
                )}

                {/* Multiple Choice Options */}
                <div className="mt-6 space-y-3">
                  {currentQ.options.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrectOption = idx === currentQ.correct;

                    let btnStyle =
                      'border-slate-200 bg-white hover:border-[#0f3d6a]/40 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/80';

                    if (hasAnswered) {
                      if (isCorrectOption) {
                        btnStyle =
                          'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100 dark:border-emerald-700';
                      } else if (isSelected && !isCorrectOption) {
                        btnStyle =
                          'border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/60 dark:text-rose-100 dark:border-rose-700';
                      } else {
                        btnStyle = 'opacity-50 border-slate-200 dark:border-slate-800';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={hasAnswered}
                        onClick={() => handleOptionSelect(idx)}
                        className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left text-sm font-medium transition-all duration-150 ${btnStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                              isSelected
                                ? 'bg-[#0f3d6a] text-white'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="text-slate-900 dark:text-white font-medium">{option}</span>
                        </div>

                        {hasAnswered && (
                          <div>
                            {isCorrectOption && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                            {isSelected && !isCorrectOption && <XCircle className="h-5 w-5 text-rose-600" />}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Feedback Banner */}
                {hasAnswered && (
                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60 animate-in fade-in">
                    <div className="flex items-start gap-3">
                      <HelpCircle className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          Academic Explanation
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          {currentQ.explanation}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={handleNextQuestion}
                        className="rounded-full bg-[#0f3d6a] text-white hover:bg-[#0b2b4f] px-6 text-xs font-bold"
                      >
                        <span>
                          {currentQIndex + 1 < EXTENDED_DIAGNOSTIC_QUIZ.length
                            ? 'Next Question'
                            : 'Calculate CEFR Result'}
                        </span>
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Results Assessment View */
          <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95">
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-sky-50 text-sky-600 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800">
                <Award className="h-10 w-10" />
              </div>

              <div>
                <Badge variant="indigo" className="mb-2">Diagnostic Assessment Report</Badge>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  Your CEFR Benchmark: <span className="text-sky-600">{resultTier.level}</span>
                </h2>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">
                  {resultTier.title}
                </p>
              </div>

              {/* Score Display Card */}
              <div className="mx-auto max-w-md rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/50">
                <div className="flex items-center justify-around">
                  <div className="text-center">
                    <p className="text-[11px] text-slate-500">Correct Answers</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {quizScore} / {EXTENDED_DIAGNOSTIC_QUIZ.length}
                    </p>
                  </div>
                  <div className="h-10 w-px bg-slate-200 dark:bg-slate-700" />
                  <div className="text-center">
                    <p className="text-[11px] text-slate-500">Accuracy Rate</p>
                    <p className="text-2xl font-black text-emerald-600">
                      {Math.round((quizScore / EXTENDED_DIAGNOSTIC_QUIZ.length) * 100)}%
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  {resultTier.description}
                </p>
              </div>

              {/* Recommended Course Box */}
              <div className="mx-auto max-w-lg rounded-2xl border border-sky-200 bg-sky-50/70 p-6 text-left dark:border-sky-900 dark:bg-sky-950/40">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-800 dark:text-sky-300">
                  <GraduationCap className="h-4 w-4" />
                  <span>Recommended Curriculum Path</span>
                </div>
                <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {resultTier.recommendedCourse}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Complete with teacher instruction, 16 multi-skill drills, and verified accreditation diploma.
                </p>
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <Link href={`/register?role=student&level=${resultTier.level}`} className="flex-1">
                    <Button className="w-full rounded-full bg-[#0f3d6a] text-white hover:bg-[#0b2b4f] text-xs font-bold shadow-md">
                      Enroll with {resultTier.level} Placement
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Link href="/courses">
                    <Button variant="outline" className="w-full rounded-full text-xs font-semibold">
                      Explore All Courses
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-3 pt-4">
                <Button onClick={resetQuiz} variant="ghost" size="sm" className="text-xs text-slate-500">
                  <RotateCw className="mr-1.5 h-3.5 w-3.5" /> Retake Diagnostic
                </Button>
                <Link href="/">
                  <Button variant="ghost" size="sm" className="text-xs text-slate-500">
                    Return to Homepage
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
