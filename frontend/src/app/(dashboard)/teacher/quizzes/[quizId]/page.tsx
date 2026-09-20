'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Clock,
  Award,
  CheckCircle2,
  HelpCircle,
  FileQuestion,
  Layers,
  Link2,
  MoveHorizontal,
  Check,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface QuestionItem {
  id: string;
  prompt?: string;
  questionText?: string;
  questionType?: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  points?: number;
  orderIndex?: number;
}

interface QuizDetails {
  id: string;
  title: string;
  description?: string;
  passingScore: number;
  timeLimitMinutes: number;
  maxAttempts: number;
  isPublished: boolean;
  createdAt: string;
  lesson?: {
    id?: string;
    title: string;
    unit?: {
      title: string;
      course?: {
        title: string;
        level: string;
      };
    };
  };
  questionCount?: number;
  attemptCount?: number;
  questions?: QuestionItem[];
}

export default function TeacherQuizViewPage() {
  const params = useParams();
  const quizId = params.quizId as string;
  const [quiz, setQuiz] = useState<QuizDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<QuizDetails>(`/teacher/quizzes/${quizId}`);
        const data = (res as any)?.data || res;
        setQuiz(data);
      } catch (err: any) {
        console.error('Failed to load quiz details', err);
        setError(err.message || 'Failed to load quiz details');
      } finally {
        setLoading(false);
      }
    };
    if (quizId) {
      fetchQuiz();
    }
  }, [quizId]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl animate-fade-in">
        <div className="h-8 w-48 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-5 h-24 bg-slate-50 dark:bg-slate-800/60 animate-pulse rounded-2xl" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 h-40 bg-slate-50 dark:bg-slate-800/60 animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <Card className="p-12 text-center space-y-4 max-w-lg mx-auto mt-12 rounded-2xl border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950">
          <HelpCircle className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Quiz Not Found</h3>
        <p className="text-xs text-slate-500">
          {error || 'The assessment you are looking for does not exist or has been removed.'}
        </p>
        <Link href="/teacher/quizzes">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Quizzes
          </Button>
        </Link>
      </Card>
    );
  }

  const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
  const totalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 10), 0);

  return (
    <div className="space-y-6 max-w-5xl pb-24 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/teacher/quizzes">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono py-0">
                {quiz.lesson?.unit?.course?.level || 'CEFR'}
              </Badge>
              <Badge variant={quiz.isPublished ? 'success' : 'secondary'} className="text-[10px] py-0">
                {quiz.isPublished ? 'Published' : 'Draft'}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
              {quiz.title}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <BookOpen className="h-3.5 w-3.5 text-primary-500" />
              {quiz.lesson?.unit?.course?.title || 'Course'} • {quiz.lesson?.title || 'Lesson'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href={`/teacher/quizzes/${quiz.id}/analytics`}>
            <Button variant="outline" size="sm" className="font-bold">
              <BarChart3 className="h-4 w-4 mr-1.5 text-primary-600" /> View Analytics ({quiz.attemptCount || 0})
            </Button>
          </Link>
        </div>
      </div>

      {/* Description if present */}
      {quiz.description && (
        <Card className="p-4 rounded-2xl border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            <span className="font-bold text-slate-800 dark:text-slate-200">Instructions: </span>
            {quiz.description}
          </p>
        </Card>
      )}

      {/* Scorecard / Parameters Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center rounded-2xl border-slate-200/80 dark:border-slate-800">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Questions</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{questions.length}</p>
        </Card>
        <Card className="p-4 text-center rounded-2xl border-slate-200/80 dark:border-slate-800">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Score</p>
          <p className="text-2xl font-black text-primary-600 dark:text-primary-400 mt-0.5">{totalPoints} Pts</p>
        </Card>
        <Card className="p-4 text-center rounded-2xl border-slate-200/80 dark:border-slate-800">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pass Benchmark</p>
          <p className="text-2xl font-black text-emerald-600 mt-0.5">{quiz.passingScore}%</p>
        </Card>
        <Card className="p-4 text-center rounded-2xl border-slate-200/80 dark:border-slate-800">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Time Limit</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{quiz.timeLimitMinutes || 15} Mins</p>
        </Card>
      </div>

      {/* Questions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary-600" /> Quiz Questions ({questions.length})
          </h2>
        </div>

        {questions.length === 0 ? (
          <Card className="p-8 text-center border-dashed rounded-2xl">
            <FileQuestion className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No questions found for this quiz.</p>
          </Card>
        ) : (
          questions.map((q, qIdx) => {
            const prompt = q.prompt || q.questionText || '';
            const options = Array.isArray(q.options) ? q.options : [];
            const correctAnswer = q.correctAnswer || '';

            return (
              <Card
                key={q.id || qIdx}
                className="p-5 space-y-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs"
              >
                {/* Question Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="indigo" className="text-xs font-bold px-2.5 py-0.5">
                      Question #{qIdx + 1}
                    </Badge>
                    <span className="text-xs font-bold text-slate-500">
                      {q.points || 10} Points
                    </span>
                  </div>
                </div>

                {/* Prompt */}
                <div className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                  {prompt}
                </div>

                {/* Options / Answers Display */}
                {options.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Options & Designated Answer
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {options.map((opt, optIdx) => {
                        const isCorrect = correctAnswer === opt || (correctAnswer && correctAnswer.split('|').includes(opt));
                        return (
                          <div
                            key={optIdx}
                            className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all ${
                              isCorrect
                                ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200 font-bold shadow-xs'
                                : 'border-slate-200 bg-slate-50/40 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300'
                            }`}
                          >
                            <span>{opt}</span>
                            {isCorrect && (
                              <Badge variant="success" className="text-[10px] py-0 shrink-0 ml-2">
                                <Check className="h-3 w-3 mr-1" /> Correct
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : correctAnswer ? (
                  <div className="p-3 rounded-xl border border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/40 text-xs">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">Correct Answer: </span>
                    <span className="font-mono font-bold text-emerald-900 dark:text-emerald-200">{correctAnswer}</span>
                  </div>
                ) : null}

                {/* Explanation */}
                {q.explanation && (
                  <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200">
                    <span className="font-bold">Pedagogical Feedback: </span>
                    {q.explanation}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
