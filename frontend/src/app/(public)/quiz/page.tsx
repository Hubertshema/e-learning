'use client';

import React, { useState, useEffect } from 'react';
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
  GraduationCap,
  HelpCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  BookOpen,
  Check,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Lock,
  ArrowLeft,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface DiagnosticQuestion {
  id: string;
  placementTestId?: string;
  category: string;
  skill: string;
  difficulty: string;
  prompt: string;
  audioText?: string | null;
  options: string[];
  orderIndex: number;
}

interface ReviewItem {
  questionId: string;
  prompt: string;
  category: string;
  skill: string;
  difficulty: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
}

interface SubmitResult {
  attemptId: string;
  attemptNumber: number;
  score: number;
  totalQuestions: number;
  percentage: number;
  recommendedLevel: string;
  ipAddress: string;
  userAgent?: string;
  captchaVerified?: boolean;
  recommendedCourse?: {
    id: string;
    title: string;
    slug: string;
    level: string;
    price: number;
    currency: string;
    description: string;
    instructorName?: string;
  } | null;
  review: ReviewItem[];
}

export default function DiagnosticQuizPage() {
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<Array<{ questionId: string; selectedOption: number }>>([]);
  
  // Anti-bot CAPTCHA state
  const [isVerifying, setIsVerifying] = useState(false);
  const [captcha, setCaptcha] = useState<{ challenge: string; token: string } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  // Fetch live questions directly from PostgreSQL database (no client-side caching)
  const fetchQuestions = async () => {
    setError(null);
    setLoading(true);

    try {
      const data = await apiClient.get<DiagnosticQuestion[]>('/public/diagnostic-quiz', { requiresAuth: false });
      if (Array.isArray(data) && data.length > 0) {
        setQuestions(data);
      } else {
        setError('Failed to load assessment questions from the database. Please try again.');
      }
    } catch (err: any) {
      console.error('Error fetching database questions:', err);
      setError('Unable to connect to the examination server. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch cryptographic CAPTCHA challenge
  const fetchCaptcha = async () => {
    try {
      setCaptchaLoading(true);
      setCaptchaError(null);
      const data = await apiClient.get<{ challenge: string; token: string }>('/public/captcha', { requiresAuth: false });
      if (data && data.challenge && data.token) {
        setCaptcha(data);
        setCaptchaAnswer('');
      }
    } catch (err: any) {
      console.error('Error fetching CAPTCHA challenge:', err);
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
    fetchCaptcha();
  }, []);

  const currentQ = questions[currentQIndex];

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

  const handleOptionSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
  };

  const handleNextOrProceedToCaptcha = () => {
    if (selectedOption === null) return;

    const updatedAnswers = [
      ...userAnswers.filter((a) => a.questionId !== currentQ.id),
      {
        questionId: currentQ.id,
        selectedOption,
      },
    ];
    setUserAnswers(updatedAnswers);

    if (currentQIndex + 1 < questions.length) {
      setCurrentQIndex((prev) => prev + 1);
      // Pre-select if previously answered
      const nextQ = questions[currentQIndex + 1];
      const existing = updatedAnswers.find((a) => a.questionId === nextQ?.id);
      setSelectedOption(existing ? existing.selectedOption : null);
    } else {
      // Final question answered: transition to CAPTCHA verification step
      setIsVerifying(true);
      if (!captcha) {
        fetchCaptcha();
      }
    }
  };

  const handlePrevQuestion = () => {
    if (currentQIndex > 0) {
      const prevIndex = currentQIndex - 1;
      setCurrentQIndex(prevIndex);
      const prevQ = questions[prevIndex];
      const existing = userAnswers.find((a) => a.questionId === prevQ?.id);
      setSelectedOption(existing !== undefined ? existing.selectedOption : null);
    }
  };

  // Submit test with CAPTCHA answer and client verification
  const handleFinalSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!captchaAnswer.trim()) {
      setCaptchaError('Please answer the security verification challenge.');
      return;
    }

    setIsSubmitting(true);
    setCaptchaError(null);

    try {
      const data = await apiClient.post<SubmitResult>(
        '/public/diagnostic-quiz/submit',
        {
          answers: userAnswers,
          captchaAnswer: captchaAnswer.trim(),
          captchaToken: captcha?.token,
          placementTestId: questions[0]?.placementTestId || null,
        },
        { requiresAuth: false }
      );

      if (data && data.attemptId) {
        setResult(data);
        setIsVerifying(false);
      } else {
        setCaptchaError('Failed to calculate your assessment benchmark. Please try again.');
      }
    } catch (err: any) {
      console.error('Error submitting quiz answers:', err);
      setCaptchaError(err.message || 'Security verification failed. Please try a new challenge.');
      fetchCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setCurrentQIndex(0);
    setSelectedOption(null);
    setUserAnswers([]);
    setResult(null);
    setIsVerifying(false);
    setCaptchaAnswer('');
    setCaptchaError(null);
    fetchQuestions();
    fetchCaptcha();
  };

  const getTierDetails = (level: string) => {
    switch (level) {
      case 'C1':
      case 'C2':
        return {
          title: 'C1/C2 Advanced & Executive Mastery',
          description:
            'You possess strong command of nuanced grammar, strategic executive idiom, and complex discourse.',
          recommendedCourse: 'Executive Business English & Cross-Border Negotiation',
        };
      case 'B2':
        return {
          title: 'B2 Upper Intermediate Fluency',
          description:
            'You demonstrate solid command of conditionals, collocations, and spontaneous conversational English.',
          recommendedCourse: 'English for IT, Software Engineering & Global Tech',
        };
      case 'B1':
        return {
          title: 'B1 Intermediate Operational English',
          description:
            'You communicate well in standard workplace scenarios, with room to refine complex tenses and idiom.',
          recommendedCourse: 'B1 Intermediate Professional English Communication',
        };
      default:
        return {
          title: 'A2 Practical Elementary English',
          description:
            'You understand everyday routines and basic sentence structures. Ready for structured mastery!',
          recommendedCourse: 'A2 Practical Everyday & Workplace Fluency',
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#eff4ec]/30 py-10 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header Title Section */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#7ba27a]/40 bg-white px-3.5 py-1 text-xs font-bold text-[#315b36] shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#315b36]" />
            <span>Database-Driven Adaptive Placement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#2e3339]">
            English Placement & Diagnostic Assessment
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-slate-600 font-medium">
            Take this interactive placement assessment powered by live database evaluation to discover your official CEFR English benchmark and personalized curriculum path.
          </p>
        </div>

        {/* Rich Skeleton Loading State */}
        {loading && (
          <div className="space-y-6 animate-pulse">
            {/* Header / Meta Skeleton Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#e2ebe2] bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#e2ebe2]" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 rounded bg-[#e2ebe2]" />
                  <div className="h-3 w-28 rounded bg-[#eff4ec]" />
                </div>
              </div>
              <div className="w-full sm:w-48 space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-3 w-12 rounded bg-[#eff4ec]" />
                  <div className="h-3 w-8 rounded bg-[#eff4ec]" />
                </div>
                <div className="h-2 w-full rounded-full bg-[#e2ebe2]" />
              </div>
            </div>

            {/* Question Card Skeleton */}
            <div className="rounded-3xl border border-[#e2ebe2] bg-white p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="h-5 w-28 rounded-full bg-[#eff4ec]" />
                <div className="h-6 w-32 rounded-full bg-[#eff4ec]" />
              </div>

              <div className="space-y-2">
                <div className="h-6 w-11/12 rounded-lg bg-[#e2ebe2]" />
                <div className="h-6 w-3/4 rounded-lg bg-[#e2ebe2]" />
              </div>

              {/* Multiple Choice Option Skeletons */}
              <div className="space-y-3 pt-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-2xl border border-[#e2ebe2] bg-[#eff4ec]/30 p-4"
                  >
                    <div className="h-7 w-7 rounded-lg bg-[#e2ebe2]" />
                    <div className="h-4 w-2/3 rounded bg-[#e2ebe2]" />
                  </div>
                ))}
              </div>

              {/* Action Button Skeleton */}
              <div className="flex justify-end pt-4 border-t border-[#e2ebe2]">
                <div className="h-10 w-40 rounded-xl bg-[#e2ebe2]" />
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center shadow-sm space-y-4">
            <AlertCircle className="h-8 w-8 text-rose-600 mx-auto" />
            <p className="text-sm font-bold text-rose-900">{error}</p>
            <Button
              onClick={fetchQuestions}
              className="bg-[#315b36] hover:bg-[#254629] text-white text-xs font-bold rounded-xl"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Retry Loading
            </Button>
          </div>
        )}

        {/* Active Quiz Taking View */}
        {!loading && !error && !result && !isVerifying && questions.length > 0 && (
          <div className="space-y-6">
            {/* Progress & Meta Info Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#e2ebe2] bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#315b36] text-white font-bold text-sm shadow-sm">
                  {currentQIndex + 1}/{questions.length}
                </span>
                <div>
                  <p className="text-xs font-bold text-[#2e3339]">{currentQ.category}</p>
                  <p className="text-[11px] text-slate-500">
                    Skill: <span className="font-semibold text-[#315b36]">{currentQ.skill}</span> • Target Level: <span className="font-bold text-[#315b36]">{currentQ.difficulty}</span>
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full sm:w-48">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(((currentQIndex + 1) / questions.length) * 100)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#e2ebe2]">
                  <div
                    className="h-full bg-[#315b36] transition-all duration-300 rounded-full"
                    style={{
                      width: `${((currentQIndex + 1) / questions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Question Card */}
            <div className="rounded-3xl border border-[#e2ebe2] bg-white p-6 sm:p-8 shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs border-[#7ba27a]/40 text-[#315b36] font-bold">
                    Question {currentQIndex + 1} of {questions.length}
                  </Badge>
                  {currentQ.audioText && (
                    <button
                      onClick={() => playTts(currentQ.audioText!)}
                      className="flex items-center gap-1.5 rounded-full border border-[#7ba27a]/40 bg-[#eff4ec] px-3 py-1 text-xs font-bold text-[#315b36] transition hover:bg-[#e2ebe2]"
                    >
                      <Volume2 className="h-4 w-4" />
                      <span>Play Audio Dialogue</span>
                    </button>
                  )}
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-[#2e3339] leading-relaxed">
                  {currentQ.prompt}
                </h2>

                {currentQ.audioText && (
                  <div className="rounded-2xl border border-[#7ba27a]/30 bg-[#eff4ec]/50 p-3.5">
                    <p className="text-xs italic text-[#2e3339]">
                      🎧 Spoken prompt: "{currentQ.audioText}"
                    </p>
                  </div>
                )}

                {/* Multiple Choice Options */}
                <div className="mt-6 space-y-3">
                  {currentQ.options.map((option, idx) => {
                    const isSelected = selectedOption === idx;

                    return (
                      <button
                        key={idx}
                        onClick={() => handleOptionSelect(idx)}
                        className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left text-sm font-medium transition-all duration-150 ${
                          isSelected
                            ? 'border-[#315b36] bg-[#eff4ec] text-[#2e3339] shadow-sm ring-1 ring-[#315b36]'
                            : 'border-[#e2ebe2] bg-white hover:border-[#7ba27a]/60 hover:bg-[#eff4ec]/30 text-[#2e3339]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition ${
                              isSelected
                                ? 'bg-[#315b36] text-white'
                                : 'bg-[#e2ebe2] text-[#2e3339]'
                            }`}
                          >
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="font-semibold">{option}</span>
                        </div>

                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 text-[#315b36]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Navigation Buttons */}
                <div className="mt-8 flex items-center justify-between pt-4 border-t border-[#e2ebe2]">
                  <Button
                    variant="outline"
                    disabled={currentQIndex === 0}
                    onClick={handlePrevQuestion}
                    className="rounded-xl border-[#e2ebe2] text-[#2e3339] text-xs font-bold hover:bg-[#eff4ec] disabled:opacity-40"
                  >
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    Previous
                  </Button>

                  <Button
                    disabled={selectedOption === null}
                    onClick={handleNextOrProceedToCaptcha}
                    className="rounded-xl bg-[#315b36] hover:bg-[#254629] text-white px-7 py-2.5 text-xs font-bold shadow-md transition hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <span className="flex items-center gap-1.5">
                      {currentQIndex + 1 < questions.length
                        ? 'Next Question'
                        : 'Proceed to Security Verification'}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Anti-Bot Security & CAPTCHA Verification Step */}
        {!loading && !result && isVerifying && (
          <div className="space-y-6 animate-in fade-in-50 zoom-in-95">
            <div className="rounded-3xl border border-[#e2ebe2] bg-white p-6 sm:p-10 shadow-xl space-y-6">
              <div className="text-center space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eff4ec] text-[#315b36] border border-[#7ba27a]/40 shadow-sm">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-black text-[#2e3339]">
                  Anti-Bot Security & Human Verification
                </h2>
                <p className="mx-auto max-w-lg text-xs text-slate-600 font-medium">
                  All {questions.length} questions completed! Please solve the security check below to verify your submission. Your evaluation will be graded and registered permanently in the database.
                </p>
              </div>

              {/* Security Audit Note Card */}
              <div className="rounded-2xl border border-[#7ba27a]/30 bg-[#eff4ec]/50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#315b36]">
                  <Globe className="h-4 w-4" />
                  <span>Candidate Integrity & Audit Trail</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  To prevent automated spam and preserve benchmark validity, your candidate IP address, device verification status, and completed answer review are securely logged in the system records.
                </p>
              </div>

              {/* Challenge Box */}
              <form onSubmit={handleFinalSubmit} className="space-y-4 max-w-md mx-auto">
                <div className="rounded-2xl border border-[#e2ebe2] bg-[#eff4ec]/30 p-5 space-y-3 text-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Security Challenge
                  </span>
                  
                  {captchaLoading ? (
                    <div className="flex items-center justify-center gap-2 py-3 text-xs text-slate-500 font-medium">
                      <RefreshCw className="h-4 w-4 animate-spin text-[#315b36]" />
                      Generating challenge...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <p className="text-lg font-black text-[#2e3339] tracking-wide">
                        {captcha?.challenge || 'Security Check: What is 5 + 3?'}
                      </p>
                      <button
                        type="button"
                        onClick={fetchCaptcha}
                        title="Get a new challenge"
                        className="rounded-lg p-1.5 text-slate-400 hover:text-[#315b36] hover:bg-[#e2ebe2] transition"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  <div className="pt-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value)}
                      placeholder="Enter number here..."
                      className="w-full text-center text-lg font-bold tracking-widest rounded-xl border border-[#e2ebe2] bg-white py-3 px-4 text-[#2e3339] shadow-inner focus:border-[#315b36] focus:outline-none focus:ring-2 focus:ring-[#315b36]/20 transition"
                      autoFocus
                    />
                  </div>
                </div>

                {captchaError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-center">
                    <p className="text-xs font-bold text-rose-700">{captchaError}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsVerifying(false)}
                    className="w-full sm:w-auto rounded-xl border-[#e2ebe2] text-[#2e3339] text-xs font-bold hover:bg-[#eff4ec]"
                  >
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    Review Answers
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSubmitting || !captchaAnswer.trim()}
                    className="flex-1 rounded-xl bg-[#315b36] hover:bg-[#254629] text-white py-3 text-xs font-bold shadow-md transition hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Evaluating & Registering in Database...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        <Lock className="h-3.5 w-3.5" />
                        Verify & Reveal Official CEFR Result
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* RESULTS ASSESSMENT VIEW */}
        {result && (
          <div className="space-y-8 animate-in zoom-in-95">
            {/* Primary Placement Card */}
            <div className="rounded-3xl border border-[#e2ebe2] bg-white p-8 sm:p-10 shadow-2xl text-center space-y-6">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#eff4ec] text-[#315b36] border border-[#7ba27a]/40 shadow-sm">
                <Award className="h-10 w-10" />
              </div>

              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#eff4ec] px-3.5 py-1 text-xs font-bold text-[#315b36] mb-2 border border-[#7ba27a]/40">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Verified Database Attempt • Try #{result.attemptNumber}</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-[#2e3339]">
                  Your CEFR Benchmark:{' '}
                  <span className="text-[#315b36]">{result.recommendedLevel}</span>
                </h2>
                <p className="text-sm font-bold text-slate-600 mt-1">
                  {getTierDetails(result.recommendedLevel).title}
                </p>
              </div>

              {/* Security Audit Badge */}
              <div className="inline-flex items-center gap-3 rounded-xl border border-[#e2ebe2] bg-[#eff4ec]/30 px-4 py-2 text-xs text-slate-600">
                <span className="flex items-center gap-1 font-semibold text-[#315b36]">
                  <Globe className="h-3.5 w-3.5" /> IP: {result.ipAddress}
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" /> Security CAPTCHA Passed
                </span>
              </div>

              {/* Score Statistics Box */}
              <div className="mx-auto max-w-md rounded-2xl border border-[#e2ebe2] bg-[#eff4ec]/40 p-5">
                <div className="flex items-center justify-around">
                  <div className="text-center">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Correct Answers
                    </p>
                    <p className="text-2xl font-black text-[#2e3339] mt-0.5">
                      {result.score} / {result.totalQuestions}
                    </p>
                  </div>
                  <div className="h-10 w-px bg-[#e2ebe2]" />
                  <div className="text-center">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Accuracy Rate
                    </p>
                    <p className="text-2xl font-black text-[#315b36] mt-0.5">
                      {result.percentage}%
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-3 pt-3 border-t border-[#e2ebe2] font-medium">
                  {getTierDetails(result.recommendedLevel).description}
                </p>
              </div>

              {/* Recommended Course Box from Database */}
              <div className="mx-auto max-w-lg rounded-2xl border border-[#7ba27a]/50 bg-[#eff4ec] p-6 text-left shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#315b36]">
                    <GraduationCap className="h-4 w-4 text-[#315b36]" />
                    <span>Recommended Curriculum Path</span>
                  </div>
                  {result.recommendedCourse && (
                    <span className="rounded-lg bg-white px-2.5 py-0.5 text-[11px] font-bold text-[#315b36] border border-[#e2ebe2]">
                      {result.recommendedCourse.level || result.recommendedLevel}
                    </span>
                  )}
                </div>

                <p className="text-base font-bold text-[#2e3339] mt-2">
                  {result.recommendedCourse?.title || getTierDetails(result.recommendedLevel).recommendedCourse}
                </p>

                <p className="text-xs text-slate-600 mt-1">
                  {result.recommendedCourse?.description ||
                    'Includes certified teacher coaching, 16 multi-skill activities, and verified CEFR certificate upon completion.'}
                </p>

                {result.recommendedCourse?.instructorName && (
                  <p className="text-[11px] font-semibold text-[#315b36] mt-2">
                    Instructor: {result.recommendedCourse.instructorName}
                  </p>
                )}

                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <Link
                    href={
                      result.recommendedCourse
                        ? `/register?role=student&course=${result.recommendedCourse.id}&level=${result.recommendedLevel}`
                        : `/register?role=student&level=${result.recommendedLevel}`
                    }
                    className="flex-1"
                  >
                    <Button className="w-full rounded-xl bg-[#315b36] text-white hover:bg-[#254629] text-xs font-bold shadow-md py-2.5">
                      Enroll with {result.recommendedLevel} Placement
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Link href="/courses">
                    <Button
                      variant="outline"
                      className="w-full rounded-xl border-[#e2ebe2] text-[#2e3339] text-xs font-semibold py-2.5 hover:bg-[#e2ebe2]"
                    >
                      Explore Courses Catalog
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Retake & Return actions */}
              <div className="flex justify-center gap-4 pt-2">
                <Button
                  onClick={resetQuiz}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-slate-600 hover:text-[#315b36] hover:bg-[#eff4ec] rounded-xl font-bold"
                >
                  <RotateCw className="mr-1.5 h-3.5 w-3.5" />
                  Retake Diagnostic Assessment
                </Button>
                <Link href="/">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-slate-600 hover:text-[#315b36] hover:bg-[#eff4ec] rounded-xl font-bold"
                  >
                    Return to Homepage
                  </Button>
                </Link>
              </div>
            </div>

            {/* Question By Question Academic Feedback Review */}
            <div className="rounded-3xl border border-[#e2ebe2] bg-white p-6 sm:p-8 shadow-lg space-y-6">
              <div className="border-b border-[#e2ebe2] pb-4">
                <h3 className="text-lg font-black text-[#2e3339]">
                  Detailed Academic Question Review
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Review your answers alongside official academic rationale and grammatical rules.
                </p>
              </div>

              <div className="space-y-4">
                {result.review.map((item, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl border p-4 space-y-2.5 ${
                      item.isCorrect
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : 'border-rose-200 bg-rose-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500">
                        Question {idx + 1} • {item.category} ({item.difficulty})
                      </span>
                      {item.isCorrect ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" /> Correct (+1)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-rose-700">
                          <XCircle className="h-4 w-4" /> Incorrect (0)
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-bold text-[#2e3339]">{item.prompt}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                        <span className="text-[10px] font-bold text-slate-500 block">
                          Your Selected Answer:
                        </span>
                        <span
                          className={`font-bold ${
                            item.isCorrect ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {item.selectedAnswer || '(No answer selected)'}
                        </span>
                      </div>

                      <div className="rounded-xl border border-[#7ba27a]/40 bg-[#eff4ec] p-2.5">
                        <span className="text-[10px] font-bold text-[#315b36] block">
                          Official Correct Answer:
                        </span>
                        <span className="font-bold text-[#315b36]">{item.correctAnswer}</span>
                      </div>
                    </div>

                    {item.explanation && (
                      <p className="text-[11px] text-slate-600 italic pt-1 border-t border-slate-200/60">
                        💡 {item.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

