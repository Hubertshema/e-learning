'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  HelpCircle,
  Award,
  Sparkles,
  AlertCircle,
  RotateCcw,
  Link2,
  MoveHorizontal,
  GripVertical,
  Check
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { CardGridSkeleton } from '@/components/ui/card-grid-skeleton';
import { useCachedData } from '@/lib/cache';

interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  points: number;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  passingScore: number;
  timeLimitMin?: number;
  lesson: {
    title: string;
    unit: {
      course: {
        title: string;
        level: string;
      };
    };
  };
  questions: QuizQuestion[];
  attempts: Array<{
    id: string;
    score: number;
    passed: boolean;
    completedAt: string;
  }>;
}

interface QuizResult {
  scorePercentage: number;
  passed: boolean;
  passingScore: number;
  gradedAnswers: Array<{
    questionId: string;
    selectedAnswer: string;
    isCorrect: boolean;
    correctAnswer?: string;
    explanation?: string;
  }>;
}

export default function StudentQuizzesPage() {
  // Active Quiz Taker State
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  // Specialized interaction states for matching & ordering questions
  const [matchingSelections, setMatchingSelections] = useState<Record<string, Record<string, string>>>({});
  const [orderedTokens, setOrderedTokens] = useState<Record<string, string[]>>({});
  const [availableTokens, setAvailableTokens] = useState<Record<string, string[]>>({});

  const { data: rawQuizzes, loading, refresh } = useCachedData<Quiz[]>(
    'student_quizzes',
    async () => {
      const res = await apiClient.get<Quiz[]>('/student/quizzes');
      return (res as any)?.data || res || [];
    },
    { ttl: 120_000, initialData: [] }
  );

  const quizzes = Array.isArray(rawQuizzes) ? rawQuizzes : [];

  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setAnswers({});
    setResult(null);

    // Initialize interactive token banks and match structures
    const initialMatchSelections: Record<string, Record<string, string>> = {};
    const initialOrdered: Record<string, string[]> = {};
    const initialAvail: Record<string, string[]> = {};

    quiz.questions.forEach((q) => {
      const isMatching = q.options.some((o) => o.includes('::') || o.includes('➔'));
      const isOrdering = !isMatching && q.options.length > 0 && (
        q.questionText.toLowerCase().includes('order') ||
        q.questionText.toLowerCase().includes('drag') ||
        q.questionText.toLowerCase().includes('arrange') ||
        q.questionText.toLowerCase().includes('reconstruct') ||
        q.options.length > 4
      );

      if (isMatching) {
        initialMatchSelections[q.id] = {};
      } else if (isOrdering) {
        initialOrdered[q.id] = [];
        initialAvail[q.id] = [...q.options];
      }
    });

    setMatchingSelections(initialMatchSelections);
    setOrderedTokens(initialOrdered);
    setAvailableTokens(initialAvail);
  };

  // Multiple Choice Handler
  const handleSelectOption = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  // Matching Question Handler
  const handleMatchSelect = (questionId: string, leftTerm: string, rightMatch: string) => {
    setMatchingSelections((prev) => {
      const current = { ...(prev[questionId] || {}) };
      current[leftTerm] = rightMatch;
      const updatedAll = { ...prev, [questionId]: current };

      // Build serialized answer: left::right|left::right
      const serialized = Object.entries(current)
        .map(([l, r]) => `${l}::${r}`)
        .join('|');
      setAnswers((a) => ({ ...a, [questionId]: serialized }));

      return updatedAll;
    });
  };

  // Drag & Drop / Sentence Ordering Token Handlers
  const handlePickToken = (questionId: string, token: string, index: number) => {
    const curOrdered = [...(orderedTokens[questionId] || []), token];
    const curAvail = [...(availableTokens[questionId] || [])];
    curAvail.splice(index, 1);

    setOrderedTokens((prev) => ({ ...prev, [questionId]: curOrdered }));
    setAvailableTokens((prev) => ({ ...prev, [questionId]: curAvail }));

    // Serialize constructed sentence
    const sentence = curOrdered.join(' ');
    setAnswers((a) => ({ ...a, [questionId]: sentence }));
  };

  const handleReturnToken = (questionId: string, token: string, index: number) => {
    const curOrdered = [...(orderedTokens[questionId] || [])];
    curOrdered.splice(index, 1);
    const curAvail = [...(availableTokens[questionId] || []), token];

    setOrderedTokens((prev) => ({ ...prev, [questionId]: curOrdered }));
    setAvailableTokens((prev) => ({ ...prev, [questionId]: curAvail }));

    const sentence = curOrdered.join(' ');
    setAnswers((a) => ({ ...a, [questionId]: sentence }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    try {
      setSubmitting(true);
      const answerPayload = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
        questionId,
        selectedAnswer,
      }));

      const res = await apiClient.post<QuizResult>(`/student/quizzes/${activeQuiz.id}/submit`, {
        answers: answerPayload,
      });

      if (res) {
        setResult((res as any).data || res);
      }
      await refresh();
    } catch (err) {
      console.error('Failed to submit quiz', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">Knowledge Checks & Multi-Skill Exams</Badge>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Quizzes & Automated Tests
          </h1>
          <p className="text-xs text-slate-500">
            Reinforce vocabulary, grammar, matching pairs, and sentence syntax with instant grading.
          </p>
        </div>
      </div>

      {/* Main Quizzes List */}
      {!activeQuiz ? (
        <div className="space-y-4">
          {loading ? (
            <CardGridSkeleton count={4} columns="2" />
          ) : quizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quizzes.map((q) => {
                const latestAttempt = q.attempts?.[0];
                return (
                  <Card key={q.id} className="p-6 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="indigo">{q.lesson.unit.course.level}</Badge>
                        {latestAttempt ? (
                          <Badge variant={latestAttempt.passed ? 'success' : 'destructive'}>
                            Latest: {latestAttempt.score}% {latestAttempt.passed ? 'Passed' : 'Failed'}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Not attempted</Badge>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{q.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {q.lesson.unit.course.title} • {q.lesson.title}
                      </p>

                      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <HelpCircle className="h-3.5 w-3.5" />
                          {q.questions.length} Questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {q.timeLimitMin || 15} Mins
                        </span>
                        <span>Pass mark: {q.passingScore}%</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {q.attempts?.length || 0} attempts recorded
                      </span>
                      <Button
                        size="sm"
                        variant="gradient"
                        onClick={() => handleStartQuiz(q)}
                        className="text-xs"
                      >
                        <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                        {latestAttempt ? 'Retake Quiz' : 'Start Quiz'}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <HelpCircle className="mx-auto h-10 w-10 text-slate-300 mb-2" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">No quizzes available</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Quizzes will be unlocked as you complete lessons in your enrolled courses.
              </p>
            </Card>
          )}
        </div>
      ) : (
        /* Active Quiz Taking Interface */
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Quiz Header Bar */}
          <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl shadow-lg">
            <div>
              <span className="text-xs font-bold text-primary-300 uppercase tracking-wider">
                {activeQuiz.lesson.unit.course.level} Quiz
              </span>
              <h2 className="text-base font-bold">{activeQuiz.title}</h2>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setActiveQuiz(null);
                setResult(null);
              }}
              className="text-white border-white/20 hover:bg-white/10 text-xs"
            >
              Exit Quiz
            </Button>
          </div>

          {/* Results View */}
          {result ? (
            <Card className="p-8 text-center space-y-6 shadow-xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-900">
                {result.passed ? (
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                ) : (
                  <XCircle className="h-10 w-10 text-rose-500" />
                )}
              </div>

              <div>
                <Badge variant={result.passed ? 'success' : 'destructive'} className="text-sm py-1 px-4">
                  {result.scorePercentage}% • {result.passed ? 'Test Passed!' : 'Passing score not reached'}
                </Badge>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-3">
                  {result.passed
                    ? 'Congratulations! You demonstrated strong mastery.'
                    : `You scored ${result.scorePercentage}%. Passing mark is ${result.passingScore}%.`}
                </h3>
              </div>

              {/* Question breakdown */}
              <div className="text-left space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Question Review:
                </h4>
                {result.gradedAnswers.map((ga, idx) => (
                  <div
                    key={ga.questionId}
                    className={`p-4 rounded-xl border text-xs ${
                      ga.isCorrect
                        ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                        : 'bg-rose-50/50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">Question {idx + 1}</span>
                      <span className={ga.isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                        {ga.isCorrect ? 'Correct (+1 pt)' : 'Incorrect (0 pts)'}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                      Your answer: <strong>{ga.selectedAnswer || 'None'}</strong>
                    </p>
                    {!ga.isCorrect && ga.correctAnswer && (
                      <p className="text-emerald-700 dark:text-emerald-400 mt-1 font-semibold">
                        Correct answer: {ga.correctAnswer}
                      </p>
                    )}
                    {ga.explanation && (
                      <p className="text-[11px] text-slate-500 mt-1 italic">{ga.explanation}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-center gap-3 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setResult(null);
                    setAnswers({});
                  }}
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Try Again
                </Button>
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => {
                    setActiveQuiz(null);
                    setResult(null);
                  }}
                >
                  Return to Quizzes
                </Button>
              </div>
            </Card>
          ) : (
            /* Questions List */
            <div className="space-y-6">
              {activeQuiz.questions.map((q, idx) => {
                const isMatching = q.options.some((o) => o.includes('::') || o.includes('➔'));
                const isOrdering = !isMatching && q.options.length > 0 && (
                  q.questionText.toLowerCase().includes('order') ||
                  q.questionText.toLowerCase().includes('drag') ||
                  q.questionText.toLowerCase().includes('arrange') ||
                  q.questionText.toLowerCase().includes('reconstruct') ||
                  q.options.length > 4
                );

                // Parse matching pairs
                const matchPairs: Array<{ left: string; right: string }> = isMatching
                  ? q.options.map((opt) => {
                      if (opt.includes('::')) {
                        const [l, r] = opt.split('::');
                        return { left: l.trim(), right: r.trim() };
                      }
                      if (opt.includes('➔')) {
                        const [l, r] = opt.split('➔');
                        return { left: l.trim(), right: r.trim() };
                      }
                      return { left: opt, right: opt };
                    })
                  : [];
                const rightOptions = Array.from(new Set(matchPairs.map((p) => p.right))).sort();

                return (
                  <Card key={q.id} className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary-600">
                          Question {idx + 1} of {activeQuiz.questions.length}
                        </span>
                        {isMatching && (
                          <Badge variant="indigo" className="text-[10px]">
                            <Link2 className="h-3 w-3 mr-1" /> Match Pairs
                          </Badge>
                        )}
                        {isOrdering && (
                          <Badge variant="success" className="text-[10px]">
                            <MoveHorizontal className="h-3 w-3 mr-1" /> Drag & Drop Reorder
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">{q.points} pt</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                      {q.questionText}
                    </h3>

                    {/* 1. MATCHING QUESTION INTERFACE */}
                    {isMatching ? (
                      <div className="space-y-3 pt-2">
                        <p className="text-[11px] text-slate-500">
                          Select the matching definition for each term on the left:
                        </p>
                        <div className="space-y-2">
                          {matchPairs.map((pair, pIdx) => {
                            const currentChoice = matchingSelections[q.id]?.[pair.left] || '';
                            return (
                              <div
                                key={pIdx}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900"
                              >
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 sm:w-1/3">
                                  {pair.left}
                                </span>
                                <div className="sm:w-2/3">
                                  <select
                                    value={currentChoice}
                                    onChange={(e) => handleMatchSelect(q.id, pair.left, e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-900 outline-none focus:border-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                  >
                                    <option value="">-- Choose matching definition --</option>
                                    {rightOptions.map((rOpt) => (
                                      <option key={rOpt} value={rOpt}>
                                        {rOpt}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : isOrdering ? (
                      /* 2. DRAG & DROP / SENTENCE REORDERING INTERFACE */
                      <div className="space-y-4 pt-2">
                        {/* Sentence Reconstruction Dropzone */}
                        <div>
                          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                            Your Constructed Sentence (Click tokens to remove):
                          </label>
                          <div className="min-h-[54px] rounded-xl border-2 border-dashed border-primary-300 bg-primary-50/30 p-2.5 flex flex-wrap items-center gap-1.5 dark:border-primary-800 dark:bg-primary-950/20">
                            {(orderedTokens[q.id] || []).length === 0 ? (
                              <span className="text-xs text-slate-400 italic">
                                Click words from the bank below to build your sentence...
                              </span>
                            ) : (
                              (orderedTokens[q.id] || []).map((tok, tIdx) => (
                                <button
                                  key={tIdx}
                                  type="button"
                                  onClick={() => handleReturnToken(q.id, tok, tIdx)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary-600 text-white shadow hover:bg-primary-700 transition-all cursor-pointer"
                                >
                                  {tok}
                                </button>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Word Token Bank */}
                        <div>
                          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                            Available Word Bank (Click to add):
                          </label>
                          <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                            {(availableTokens[q.id] || []).length === 0 ? (
                              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                                <Check className="h-3.5 w-3.5" /> All words placed!
                              </span>
                            ) : (
                              (availableTokens[q.id] || []).map((tok, aIdx) => (
                                <button
                                  key={aIdx}
                                  type="button"
                                  onClick={() => handlePickToken(q.id, tok, aIdx)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 hover:border-primary-500 hover:bg-primary-50 hover:text-primary-700 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 transition-all cursor-pointer"
                                >
                                  <GripVertical className="h-3 w-3 text-slate-400" />
                                  {tok}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    ) : q.options.length === 0 ? (
                      /* 3. FILL IN THE BLANK INTERFACE */
                      <div className="pt-2">
                        <Input
                          placeholder="Type your answer here..."
                          value={answers[q.id] || ''}
                          onChange={(e) => handleSelectOption(q.id, e.target.value)}
                        />
                      </div>
                    ) : (
                      /* 4. MULTIPLE CHOICE INTERFACE */
                      <div className="space-y-2 pt-2">
                        {q.options.map((opt) => {
                          const isSelected = answers[q.id] === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleSelectOption(q.id, opt)}
                              className={`w-full text-left p-3.5 rounded-xl text-xs transition-all flex items-center justify-between border ${
                                isSelected
                                  ? 'border-primary-500 bg-primary-50 text-primary-900 font-bold dark:bg-primary-950/60 dark:text-primary-200 ring-2 ring-primary-500/20'
                                  : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                              }`}
                            >
                              <span>{opt}</span>
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
                    )}
                  </Card>
                );
              })}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveQuiz(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="gradient"
                  size="sm"
                  disabled={submitting || Object.keys(answers).length === 0}
                  onClick={handleSubmitQuiz}
                >
                  {submitting ? 'Evaluating...' : 'Submit Answers & Calculate Score'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
