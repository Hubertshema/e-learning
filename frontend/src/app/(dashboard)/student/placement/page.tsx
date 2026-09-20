'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  CheckCircle2,
  Award,
  ArrowRight,
  BookOpen,
  RotateCcw,
  Volume2,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface PlacementQuestion {
  id: string;
  placementTestId: string;
  skill: string;
  level: string;
  question: string;
  prompt?: string;
  options: string[];
  orderIndex: number;
}

interface PlacementTest {
  id: string;
  title: string;
  description?: string | null;
  isActive: boolean;
  questions: PlacementQuestion[];
}

interface SubmitResult {
  attemptId: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  recommendedLevel: string;
  message: string;
  review?: Array<{
    questionId: string;
    prompt: string;
    skill: string;
    level: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
}

export default function StudentPlacementTestPage() {
  const [placementTest, setPlacementTest] = useState<PlacementTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  // Fetch active placement test dynamically from DB (randomized by backend)
  const fetchPlacementTest = async () => {
    try {
      setLoading(true);
      setError(null);

      const testData = await apiClient.get<PlacementTest>('/student/placement-test');

      if (testData && testData.id) {
        setPlacementTest(testData);
        setAnswers({});
        setCurrentIdx(0);
        setSubmitted(false);
        setResult(null);
      } else {
        setError('No active placement test found.');
      }
    } catch (err: any) {
      console.error('Failed to load placement test:', err);
      setError(err.message || 'Failed to load placement test from the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlacementTest();
  }, []);

  const questions = placementTest?.questions || [];
  const currentQ = questions[currentIdx];

  const handleSelectOption = (option: string) => {
    if (!currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: option }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleSubmitTest = async () => {
    if (!placementTest) return;
    try {
      setSubmitting(true);
      const formattedAnswers = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
        questionId,
        selectedAnswer,
      }));

      const res = await apiClient.post<SubmitResult>('/student/placement-test', {
        placementTestId: placementTest.id,
        answers: formattedAnswers,
      });

      if (res && res.attemptId) {
        setResult(res);
        setSubmitted(true);
      } else {
        throw new Error('Failed to evaluate assessment.');
      }
    } catch (err: any) {
      console.error('Failed to submit placement test:', err);
      setError(err.message || 'Error submitting your placement test. Please verify connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 p-4 sm:p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <Badge variant="indigo" className="px-3 py-1 text-xs font-bold">
          CEFR Placement Assessment
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          English Proficiency Placement Test
        </h1>
        <p className="text-xs text-slate-500 max-w-lg mx-auto">
          Assess your baseline across Grammar, Vocabulary, Reading Comprehension, and Functional Listening to determine your starting CEFR level.
        </p>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <Card className="p-6 sm:p-8 space-y-6 shadow-xl animate-pulse">
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full" />
          </div>
          <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            ))}
          </div>
        </Card>
      )}

      {/* Error Message */}
      {!loading && error && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 dark:bg-rose-950/40 p-6 text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-rose-600 mx-auto" />
          <p className="text-xs font-bold text-rose-900 dark:text-rose-200">{error}</p>
          <Button
            size="sm"
            onClick={() => fetchPlacementTest()}
            className="rounded-xl bg-primary-600 text-white text-xs font-bold"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      )}

      {/* Active Question View */}
      {!loading && !error && !submitted && currentQ && (
        <Card className="p-6 sm:p-8 space-y-6 shadow-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
          {/* Progress Bar & Question Counter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Question {currentIdx + 1} of {questions.length}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="indigo" className="text-[11px] font-bold">
                  {currentQ.skill}
                </Badge>
                <Badge variant="outline" className="text-[11px] font-bold">
                  {currentQ.level}
                </Badge>
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-primary-600 transition-all duration-300 rounded-full"
                style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Prompt */}
          <div className="py-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
              {currentQ.question || currentQ.prompt}
            </h2>
          </div>

          {/* Multiple Choice Options */}
          <div className="space-y-2.5">
            {currentQ.options.map((opt) => {
              const isSelected = answers[currentQ.id] === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelectOption(opt)}
                  className={`w-full text-left p-4 rounded-xl text-xs transition-all flex items-center justify-between border ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 text-primary-900 font-bold dark:bg-primary-950/60 dark:text-primary-200 ring-2 ring-primary-500/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <span className="font-medium">{opt}</span>
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              disabled={currentIdx === 0}
              onClick={handlePrev}
              className="rounded-xl text-xs font-bold"
            >
              Previous
            </Button>

            {currentIdx < questions.length - 1 ? (
              <Button
                variant="gradient"
                size="sm"
                disabled={!answers[currentQ.id]}
                onClick={handleNext}
                className="rounded-xl text-xs font-bold shadow-sm"
              >
                Next Question
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                variant="gradient"
                size="sm"
                disabled={submitting || Object.keys(answers).length < questions.length}
                onClick={handleSubmitTest}
                className="rounded-xl text-xs font-bold shadow-md"
              >
                {submitting ? (
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Evaluating...
                  </span>
                ) : (
                  'Complete & Calculate CEFR Level'
                )}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Results Card */}
      {submitted && result && (
        <Card className="p-8 text-center space-y-6 shadow-2xl border-2 border-[#3B6748]/30 bg-[#F4F7F4] dark:bg-emerald-950/20 rounded-3xl animate-in zoom-in-95">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300 shadow-sm">
            <Award className="h-8 w-8" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Recommended Starting CEFR Level
            </span>
            <div className="mt-2 inline-flex items-center justify-center rounded-2xl bg-[#3B6748] px-6 py-2 text-3xl font-black text-white shadow-lg">
              {result.recommendedLevel}
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-3">
              Diagnostic Score: {result.score}% ({result.correctCount}/{result.totalQuestions} correct)
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {result.message}
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSubmitted(false);
                setCurrentIdx(0);
                setAnswers({});
                fetchPlacementTest();
              }}
              className="rounded-xl text-xs font-bold"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Retake Test
            </Button>
            <Link href="/student/courses">
              <Button variant="gradient" size="sm" className="rounded-xl text-xs font-bold">
                <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                View Recommended Courses
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
