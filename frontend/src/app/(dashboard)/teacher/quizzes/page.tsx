'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  HelpCircle,
  Plus,
  BarChart3,
  Trash2,
  BookOpen,
  Clock,
  Award,
  Users,
  CheckCircle2,
  Search,
  Filter,
  Eye,
  Check,
  Layers,
  FileQuestion,
  ExternalLink
} from 'lucide-react';
import { useCachedData, clientCache } from '@/lib/cache';
import { apiClient } from '@/lib/api-client';
import { CardGridSkeleton } from '@/components/ui/card-grid-skeleton';
import { Modal } from '@/components/ui/modal';

interface QuizItem {
  id: string;
  title: string;
  description?: string;
  passingScore: number;
  timeLimitMinutes: number;
  maxAttempts: number;
  isPublished: boolean;
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
  questions?: any[];
  questionCount?: number;
  attemptCount?: number;
  attempts?: any[];
  createdAt: string;
}

export default function TeacherQuizzesPage() {
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingQuiz, setViewingQuiz] = useState<QuizItem | null>(null);

  const {
    data: rawQuizzes,
    loading,
    refresh: fetchQuizzes
  } = useCachedData<QuizItem[]>(
    'teacher_quizzes_list',
    async () => {
      const res = await apiClient.get<QuizItem[]>('/teacher/quizzes');
      return Array.isArray(res) ? res : (res as any)?.data || [];
    },
    { ttl: 120_000, initialData: [] }
  );

  const quizzes = rawQuizzes || [];

  const handleDelete = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? Student attempts will also be removed.')) return;
    try {
      setDeletingId(quizId);
      await apiClient.delete(`/teacher/quizzes/${quizId}`);
      clientCache.invalidate('teacher_');
      fetchQuizzes();
    } catch (err) {
      alert('Failed to delete quiz');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = quizzes.filter(
    (q) =>
      q.title?.toLowerCase().includes(search.toLowerCase()) ||
      q.lesson?.unit?.course?.title?.toLowerCase().includes(search.toLowerCase()) ||
      q.lesson?.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Quiz Management Studio
          </h1>
          <p className="text-xs text-slate-500">
            Build interactive CEFR assessments, set passing benchmarks, and analyze student attempt metrics.
          </p>
        </div>

        <Link href="/teacher/quizzes/create">
          <Button variant="gradient">
            <Plus className="h-4 w-4 mr-1.5" /> Create New Quiz
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <Card className="p-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search quizzes by title or course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>
      </Card>

      {/* Quizzes Table / List */}
      {loading ? (
        <CardGridSkeleton count={3} columns="3" />
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-950">
            <HelpCircle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Quizzes Created Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Design multiple-choice, fill-in-blanks, or true/false quizzes for your lessons to test comprehension.
          </p>
          <div className="pt-2">
            <Link href="/teacher/quizzes/create">
              <Button variant="gradient" size="sm">
                <Plus className="h-4 w-4 mr-1.5" /> Create First Quiz
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((quiz) => {
            const attempts = Array.isArray(quiz.attempts) ? quiz.attempts : [];
            const totalAttempts = typeof quiz.attemptCount === 'number' ? quiz.attemptCount : attempts.length;
            const passCount = attempts.filter((a) => a.isPassed).length;
            const passRate = totalAttempts > 0 ? (attempts.length > 0 ? Math.round((passCount / attempts.length) * 100) : 0) : 0;
            const questionCount = typeof quiz.questionCount === 'number' ? quiz.questionCount : (Array.isArray(quiz.questions) ? quiz.questions.length : 0);

            return (
              <Card key={quiz.id} className="p-5 flex flex-col justify-between space-y-4 hover:shadow-lg transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">
                      {quiz.lesson?.unit?.course?.level || 'CEFR'}
                    </Badge>
                    <Badge variant={quiz.isPublished ? 'success' : 'secondary'} className="text-[10px]">
                      {quiz.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                    {quiz.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-1 flex items-center gap-1">
                    <BookOpen className="h-3 w-3 text-primary-500" />
                    {quiz.lesson?.unit?.course?.title || 'Course'} • {quiz.lesson?.title || 'Lesson'}
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                    <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] text-slate-400">Questions</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{questionCount}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] text-slate-400">Passing</p>
                      <p className="font-bold text-emerald-600">{quiz.passingScore}%</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] text-slate-400">Pass Rate</p>
                      <p className="font-bold text-primary-600">{passRate}%</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 px-2.5 font-medium border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      onClick={() => setViewingQuiz(quiz)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1 text-primary-600 dark:text-primary-400" /> View
                    </Button>

                    <Link href={`/teacher/quizzes/${quiz.id}/analytics`}>
                      <Button variant="ghost" size="sm" className="text-xs h-8 px-2 text-slate-600 dark:text-slate-400">
                        <BarChart3 className="h-3.5 w-3.5 mr-1" /> Analytics ({totalAttempts})
                      </Button>
                    </Link>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                    onClick={() => handleDelete(quiz.id)}
                    isLoading={deletingId === quiz.id}
                    title="Delete Quiz"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* View Quiz Details Modal */}
      {viewingQuiz && (
        <Modal
          isOpen={Boolean(viewingQuiz)}
          onClose={() => setViewingQuiz(null)}
          size="full"
          title={
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono">
                {viewingQuiz.lesson?.unit?.course?.level || 'CEFR'}
              </Badge>
              <span className="text-lg font-black text-slate-900 dark:text-white">
                {viewingQuiz.title}
              </span>
              <Badge variant={viewingQuiz.isPublished ? 'success' : 'secondary'} className="text-[10px]">
                {viewingQuiz.isPublished ? 'Published' : 'Draft'}
              </Badge>
            </div>
          }
          description={
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <BookOpen className="h-3.5 w-3.5 text-primary-500" />
              <span>{viewingQuiz.lesson?.unit?.course?.title || 'Course'}</span>
              <span>•</span>
              <span>{viewingQuiz.lesson?.title || 'Lesson'}</span>
            </div>
          }
          footer={
            <div className="flex items-center justify-between w-full">
              <Link href={`/teacher/quizzes/${viewingQuiz.id}`}>
                <Button variant="ghost" size="sm" className="text-xs text-slate-500">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open Full Page
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Link href={`/teacher/quizzes/${viewingQuiz.id}/analytics`}>
                  <Button variant="outline" size="sm" className="text-xs font-bold">
                    <BarChart3 className="h-3.5 w-3.5 mr-1 text-primary-600" /> Analytics ({typeof viewingQuiz.attemptCount === 'number' ? viewingQuiz.attemptCount : (viewingQuiz.attempts || []).length})
                  </Button>
                </Link>
                <Button variant="default" size="sm" className="text-xs" onClick={() => setViewingQuiz(null)}>
                  Done
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {viewingQuiz.description && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-800 dark:text-slate-200">Instructions: </span>
                {viewingQuiz.description}
              </div>
            )}

            {/* Quick Metrics */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-2.5 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Questions</p>
                <p className="font-black text-slate-900 dark:text-white text-base mt-0.5">
                  {(viewingQuiz.questions || []).length}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-2.5 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Passing</p>
                <p className="font-black text-emerald-600 text-base mt-0.5">{viewingQuiz.passingScore}%</p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-2.5 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Time Limit</p>
                <p className="font-black text-slate-900 dark:text-white text-base mt-0.5">{viewingQuiz.timeLimitMinutes || 15}m</p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-2.5 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Attempts</p>
                <p className="font-black text-primary-600 text-base mt-0.5">
                  {typeof viewingQuiz.attemptCount === 'number' ? viewingQuiz.attemptCount : (viewingQuiz.attempts || []).length}
                </p>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-primary-600" />
                Questions & Answer Key:
              </h4>

              {(!viewingQuiz.questions || viewingQuiz.questions.length === 0) ? (
                <div className="p-6 text-center border-dashed border rounded-xl text-xs text-slate-400">
                  No questions found for this quiz.
                </div>
              ) : (
                viewingQuiz.questions.map((q: any, idx: number) => {
                  const prompt = q.prompt || q.questionText || '';
                  const options: string[] = Array.isArray(q.options) ? q.options : [];
                  const correctAnswer = q.correctAnswer || '';

                  return (
                    <div
                      key={q.id || idx}
                      className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-2.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="indigo" className="text-[10px] font-bold py-0">
                          Question #{idx + 1}
                        </Badge>
                        <span className="text-[11px] font-bold text-slate-400">
                          {q.points || 10} pts
                        </span>
                      </div>

                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {prompt}
                      </p>

                      {options.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                          {options.map((opt, optIdx) => {
                            const isCorrect = correctAnswer === opt || (correctAnswer && correctAnswer.split('|').includes(opt));
                            return (
                              <div
                                key={optIdx}
                                className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
                                  isCorrect
                                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200 font-bold'
                                    : 'border-slate-200 bg-slate-50/50 text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300'
                                }`}
                              >
                                <span>{opt}</span>
                                {isCorrect && (
                                  <Badge variant="success" className="text-[9px] py-0 shrink-0">
                                    <Check className="h-2.5 w-2.5 mr-0.5" /> Correct
                                  </Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : correctAnswer ? (
                        <div className="p-2 rounded-lg border border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/40 text-xs">
                          <span className="font-bold text-emerald-800 dark:text-emerald-300">Correct Answer: </span>
                          <span className="font-mono font-bold text-emerald-900 dark:text-emerald-200">{correctAnswer}</span>
                        </div>
                      ) : null}

                      {q.explanation && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800/60">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Feedback: </span>
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
