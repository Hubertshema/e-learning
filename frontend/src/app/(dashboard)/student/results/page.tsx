'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Award,
  CheckCircle2,
  XCircle,
  FileText,
  Sparkles,
  TrendingUp,
  Download,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useCachedData } from '@/lib/cache';
import { Skeleton } from '@/components/ui/skeleton';
import { TableSkeleton } from '@/components/ui/table-skeleton';

interface ResultsData {
  profile: {
    id: string;
    currentLevel: string;
  };
  summary: {
    avgAssignmentScore: number | null;
    avgQuizScore: number | null;
    totalQuizzesPassed: number;
    totalAssignmentsGraded: number;
    currentCEFRLevel: string;
  };
  assignments: Array<{
    id: string;
    score: number | null;
    status: string;
    submittedAt: string;
    feedback?: string;
    assignment: {
      title: string;
      maxScore: number;
      lesson: {
        unit: {
          course: {
            title: string;
            level: string;
          };
        };
      };
    };
  }>;
  quizzes: Array<{
    id: string;
    score: number;
    passed: boolean;
    completedAt: string;
    quiz: {
      title: string;
      passingScore: number;
      lesson: {
        unit: {
          course: {
            title: string;
            level: string;
          };
        };
      };
    };
  }>;
  placementTests: Array<{
    id: string;
    score: number;
    recommendedLevel: string;
    createdAt: string;
  }>;
}

export default function StudentResultsPage() {
  const [activeTab, setActiveTab] = useState<'ALL' | 'ASSIGNMENTS' | 'QUIZZES' | 'DIAGNOSTICS'>('ALL');

  const { data, loading } = useCachedData<ResultsData | null>(
    'student_results',
    async () => {
      const res = await apiClient.get<ResultsData>('/students/results');
      return (res as any)?.data || res || null;
    },
    { ttl: 120_000 }
  );

  const handleExportTranscript = () => {
    if (!data) return;
    const headers = ['Assessment Type', 'Title', 'Course', 'Score (%)', 'Result', 'Date'];
    const rows: string[][] = [];

    data.assignments.forEach((a) => {
      rows.push([
        'Assignment',
        `"${a.assignment.title.replace(/"/g, '""')}"`,
        `"${a.assignment.lesson.unit.course.title.replace(/"/g, '""')}"`,
        a.score !== null ? `${a.score}/${a.assignment.maxScore}` : 'Pending',
        a.score !== null ? 'Graded' : 'Submitted',
        new Date(a.submittedAt).toLocaleDateString(),
      ]);
    });

    data.quizzes.forEach((q) => {
      rows.push([
        'Quiz',
        `"${q.quiz.title.replace(/"/g, '""')}"`,
        `"${q.quiz.lesson.unit.course.title.replace(/"/g, '""')}"`,
        `${q.score}%`,
        q.passed ? 'Passed' : 'Failed',
        new Date(q.completedAt).toLocaleDateString(),
      ]);
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `academic_results_transcript_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">Official Academic Record</Badge>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Academic Performance & Results Transcript
          </h1>
          <p className="text-xs text-slate-500">
            View verified grades, quiz attempt scores, and diagnostic test evaluations across your courses.
          </p>
        </div>
        {data && (
          <Button variant="outline" size="sm" onClick={handleExportTranscript}>
            <Download className="mr-1.5 h-3.5 w-3.5 text-primary-600" />
            Export Official Transcript
          </Button>
        )}
      </div>

      {loading && !data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-5 space-y-2">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-2.5 w-32" />
              </Card>
            ))}
          </div>
          <Card className="p-6 space-y-4">
            <Skeleton className="h-5 w-48" />
            <TableSkeleton rows={5} columns={5} />
          </Card>
        </div>
      ) : data ? (
        <>
          {/* Top KPI Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Average Quiz Score</span>
                <Award className="h-5 w-5 text-indigo-600" />
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {data.summary?.avgQuizScore ? `${data.summary.avgQuizScore}%` : 'N/A'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {data.summary?.totalQuizzesPassed || 0} quizzes passed
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Assignment Grade Avg</span>
                <FileText className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {data.summary?.avgAssignmentScore ? `${data.summary.avgAssignmentScore}%` : 'N/A'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {data.summary?.totalAssignmentsGraded || 0} evaluated tasks
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Active CEFR Standing</span>
                <Sparkles className="h-5 w-5 text-amber-500" />
              </div>
              <p className="mt-2 text-2xl font-black text-primary-600 dark:text-primary-400">
                Level {data.summary?.currentCEFRLevel || 'B1'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">European Language Framework</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Assessments Total</span>
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {(data.assignments?.length || 0) + (data.quizzes?.length || 0)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Total academic submissions</p>
            </Card>
          </div>

          {/* Filter Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
            {(['ALL', 'ASSIGNMENTS', 'QUIZZES', 'DIAGNOSTICS'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab === 'ALL'
                  ? 'All Records'
                  : tab === 'ASSIGNMENTS'
                  ? `Assignments (${data.assignments.length})`
                  : tab === 'QUIZZES'
                  ? `Quizzes (${data.quizzes.length})`
                  : `Placement Tests (${data.placementTests.length})`}
              </button>
            ))}
          </div>

          {/* Results Tables */}
          <div className="space-y-6">
            {/* Assignments Table */}
            {(activeTab === 'ALL' || activeTab === 'ASSIGNMENTS') && data.assignments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    Assignment Evaluated Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
                          <th className="pb-3 font-semibold">Task Title</th>
                          <th className="pb-3 font-semibold">Course</th>
                          <th className="pb-3 font-semibold">Submitted Date</th>
                          <th className="pb-3 font-semibold">Grade</th>
                          <th className="pb-3 font-semibold text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {data.assignments.map((a) => (
                          <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="py-3 font-bold text-slate-900 dark:text-white">
                              {a.assignment.title}
                            </td>
                            <td className="py-3 text-slate-600 dark:text-slate-400">
                              {a.assignment.lesson.unit.course.title}
                            </td>
                            <td className="py-3 text-slate-500">
                              {new Date(a.submittedAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 font-black text-slate-900 dark:text-white">
                              {a.score !== null ? `${a.score} / ${a.assignment.maxScore}` : 'Pending Grade'}
                            </td>
                            <td className="py-3 text-right">
                              {a.score !== null ? (
                                <Badge variant="success">Graded</Badge>
                              ) : (
                                <Badge variant="warning">Under Review</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quizzes Table */}
            {(activeTab === 'ALL' || activeTab === 'QUIZZES') && data.quizzes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-4 w-4 text-indigo-600" />
                    Quiz & Test Evaluated Attempts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
                          <th className="pb-3 font-semibold">Quiz Title</th>
                          <th className="pb-3 font-semibold">Course</th>
                          <th className="pb-3 font-semibold">Completed Date</th>
                          <th className="pb-3 font-semibold">Passing Target</th>
                          <th className="pb-3 font-semibold text-right">Your Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {data.quizzes.map((q) => (
                          <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="py-3 font-bold text-slate-900 dark:text-white">
                              {q.quiz.title}
                            </td>
                            <td className="py-3 text-slate-600 dark:text-slate-400">
                              {q.quiz.lesson.unit.course.title}
                            </td>
                            <td className="py-3 text-slate-500">
                              {new Date(q.completedAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 text-slate-500">
                              {q.quiz.passingScore}%
                            </td>
                            <td className="py-3 text-right">
                              <Badge variant={q.passed ? 'success' : 'destructive'}>
                                {q.score}% {q.passed ? 'Passed' : 'Failed'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Diagnostics Table */}
            {(activeTab === 'ALL' || activeTab === 'DIAGNOSTICS') && data.placementTests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    CEFR Placement Diagnostic History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
                          <th className="pb-3 font-semibold">Date</th>
                          <th className="pb-3 font-semibold">Diagnostic Score</th>
                          <th className="pb-3 font-semibold text-right">Recommended CEFR Level</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {data.placementTests.map((pt) => (
                          <tr key={pt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="py-3 text-slate-500">
                              {new Date(pt.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 font-bold text-slate-900 dark:text-white">
                              {pt.score}%
                            </td>
                            <td className="py-3 text-right">
                              <Badge variant="indigo">Level {pt.recommendedLevel}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      ) : (
        <Card className="p-12 text-center text-slate-400">
          No academic results recorded yet. Complete course quizzes and assignments to build your transcript.
        </Card>
      )}
    </div>
  );
}
