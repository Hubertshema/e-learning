'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  ArrowLeft,
  Award,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface AnalyticsData {
  quiz: {
    id: string;
    title: string;
    passingScore: number;
    courseTitle: string;
  };
  totalAttempts: number;
  avgScore: number;
  maxScore: number;
  minScore: number;
  passRate: number;
  recentAttempts: Array<{
    id: string;
    student: {
      user: {
        firstName: string;
        lastName: string;
        email: string;
      };
    };
    scorePercentage: number;
    isPassed: boolean;
    timeSpentSec: number;
    startedAt: string;
  }>;
}

export default function TeacherQuizAnalyticsPage() {
  const params = useParams();
  const quizId = params.quizId as string;
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<AnalyticsData>(`/teacher/quizzes/${quizId}/analytics`);
        if (res) {
          setData(res);
        }
      } catch (err) {
        console.error('Failed to load quiz analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [quizId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-100 rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 h-28 animate-pulse bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="p-12 text-center space-y-3">
        <p className="text-xs text-slate-500">Quiz analytics not found.</p>
        <Link href="/teacher/quizzes">
          <Button variant="outline" size="sm">Back to Quizzes</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/teacher/quizzes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            {data.quiz.title} — Analytics
          </h1>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <BookOpen className="h-3 w-3 text-primary-500" /> {data.quiz.courseTitle} • Passing Target: {data.quiz.passingScore}%
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-5 text-center space-y-1">
          <p className="text-xs text-slate-400 font-medium">Total Attempts</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{data.totalAttempts}</p>
        </Card>

        <Card className="p-5 text-center space-y-1">
          <p className="text-xs text-slate-400 font-medium">Average Score</p>
          <p className="text-2xl font-black text-primary-600">{data.avgScore}%</p>
        </Card>

        <Card className="p-5 text-center space-y-1">
          <p className="text-xs text-slate-400 font-medium">Pass Rate</p>
          <p className="text-2xl font-black text-emerald-600">{data.passRate}%</p>
        </Card>

        <Card className="p-5 text-center space-y-1">
          <p className="text-xs text-slate-400 font-medium">Score Range</p>
          <p className="text-2xl font-black text-slate-700 dark:text-slate-300">
            {data.minScore}% – {data.maxScore}%
          </p>
        </Card>
      </div>

      {/* Student Attempts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Student Attempt Log</CardTitle>
          <CardDescription>
            Individual student results, completion durations, and pass/fail evaluation.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {(!data.recentAttempts || data.recentAttempts.length === 0) ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No students have taken this quiz yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th className="p-3 font-semibold">Student</th>
                    <th className="p-3 font-semibold">Score</th>
                    <th className="p-3 font-semibold">Evaluation</th>
                    <th className="p-3 font-semibold">Duration</th>
                    <th className="p-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.recentAttempts.map((attempt) => (
                    <tr key={attempt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                      <td className="p-3 font-medium text-slate-900 dark:text-white">
                        {attempt.student?.user?.firstName || 'Student'} {attempt.student?.user?.lastName || ''}
                        <span className="block text-[10px] text-slate-400">{attempt.student?.user?.email || ''}</span>
                      </td>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                        {attempt.scorePercentage}%
                      </td>
                      <td className="p-3">
                        <Badge variant={attempt.isPassed ? 'success' : 'destructive'} className="text-[10px]">
                          {attempt.isPassed ? 'PASSED' : 'FAILED'}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-500">
                        {Math.round((attempt.timeSpentSec || 0) / 60)} mins
                      </td>
                      <td className="p-3 text-slate-500">
                        {attempt.startedAt ? new Date(attempt.startedAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
