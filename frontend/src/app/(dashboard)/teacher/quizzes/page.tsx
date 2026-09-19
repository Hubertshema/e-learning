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
  Filter
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface QuizItem {
  id: string;
  title: string;
  description?: string;
  passingScore: number;
  timeLimitMinutes: number;
  maxAttempts: number;
  isPublished: boolean;
  lesson: {
    title: string;
    unit: {
      title: string;
      course: {
        title: string;
        level: string;
      };
    };
  };
  questions: any[];
  attempts: any[];
  createdAt: string;
}

export default function TeacherQuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<QuizItem[]>('/teacher/quizzes');
      if (res) {
        setQuizzes(res);
      }
    } catch (err) {
      console.error('Failed to load teacher quizzes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleDelete = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? Student attempts will also be removed.')) return;
    try {
      setDeletingId(quizId);
      await apiClient.delete(`/teacher/quizzes/${quizId}`);
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    } catch (err) {
      alert('Failed to delete quiz');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = quizzes.filter(
    (q) =>
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.lesson.unit.course.title.toLowerCase().includes(search.toLowerCase())
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 h-48 animate-pulse bg-slate-100 dark:bg-slate-900" />
          ))}
        </div>
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
            const totalAttempts = quiz.attempts.length;
            const passCount = quiz.attempts.filter((a) => a.isPassed).length;
            const passRate = totalAttempts > 0 ? Math.round((passCount / totalAttempts) * 100) : 0;

            return (
              <Card key={quiz.id} className="p-5 flex flex-col justify-between space-y-4 hover:shadow-lg transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">
                      {quiz.lesson.unit.course.level}
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
                    {quiz.lesson.unit.course.title} • {quiz.lesson.title}
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                    <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] text-slate-400">Questions</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{quiz.questions.length}</p>
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

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Link href={`/teacher/quizzes/${quiz.id}/analytics`}>
                    <Button variant="outline" size="sm" className="text-xs">
                      <BarChart3 className="h-3.5 w-3.5 mr-1" /> Analytics ({totalAttempts})
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(quiz.id)}
                    isLoading={deletingId === quiz.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
