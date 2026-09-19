'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  ArrowLeft,
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  Send,
  MessageSquare,
  Calendar,
  Layers,
  AlertCircle,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface DetailedProgressData {
  student: {
    id: string;
    userId: string;
    nativeLanguage?: string;
    currentLevel: string;
    targetLevel: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      avatarUrl?: string;
      createdAt: string;
    };
  };
  enrollments: Array<{
    id: string;
    status: string;
    enrolledAt: string;
    expiresAt?: string;
    course: {
      title: string;
      level: string;
    };
  }>;
  overallProgressPercentage: number;
  completedLessonsCount: number;
  totalAssignedLessons: number;
  skillBreakdown: Record<string, { averageScore: number; attemptsCount: number }>;
  recentSubmissions: Array<{
    id: string;
    assignment: { title: string; maxScore: number };
    score?: number;
    status: string;
    submittedAt: string;
  }>;
  recentQuizzes: Array<{
    id: string;
    quiz: { title: string; passingScore: number };
    scorePercentage: number;
    isPassed: boolean;
    startedAt: string;
  }>;
  attendanceHistory: Array<{
    id: string;
    date: string;
    status: string;
    class: { name: string };
  }>;
  feedbacks: Array<{
    id: string;
    title: string;
    content: string;
    strengths: string[];
    improvements: string[];
    createdAt: string;
  }>;
}

export default function TeacherStudentDetailPage() {
  const params = useParams();
  const studentId = params.studentId as string;

  const [data, setData] = useState<DetailedProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  // Feedback Modal Form
  const [feedbackTitle, setFeedbackTitle] = useState('Instructor Coaching');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [strengthsText, setStrengthsText] = useState('Active verbal participation, accurate vocabulary choice');
  const [improvementsText, setImprovementsText] = useState('Focus on past perfect vs simple past distinctions');
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Extend Modal
  const [extensionDays, setExtensionDays] = useState(30);
  const [extending, setExtending] = useState(false);
  const [extendSuccess, setExtendSuccess] = useState<string | null>(null);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<DetailedProgressData>(`/teacher/students/${studentId}/progress`);
      if (res) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load student detailed progress', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentDetails();
  }, [studentId]);

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackContent.trim()) return;

    try {
      setSendingFeedback(true);
      await apiClient.post(`/teacher/students/${studentId}/feedback`, {
        title: feedbackTitle,
        content: feedbackContent,
        strengths: strengthsText.split(',').map((s) => s.trim()).filter(Boolean),
        improvements: improvementsText.split(',').map((s) => s.trim()).filter(Boolean),
      });

      setFeedbackSuccess('Coaching feedback sent to student successfully!');
      setFeedbackContent('');
      fetchStudentDetails();
    } catch (err) {
      alert('Failed to send coaching feedback.');
    } finally {
      setSendingFeedback(false);
    }
  };

  const handleExtendEnrollment = async (enrollmentId: string) => {
    try {
      setExtending(true);
      await apiClient.post(`/teacher/enrollments/${enrollmentId}/extend`, {
        extensionDays: Number(extensionDays),
        reason: 'Teacher extended curriculum study window',
      });
      setExtendSuccess(`Access extended by ${extensionDays} days!`);
      fetchStudentDetails();
    } catch (err) {
      alert('Failed to extend enrollment.');
    } finally {
      setExtending(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-100 rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-6">
          <Card className="h-64 animate-pulse bg-slate-100" />
          <Card className="col-span-2 h-64 animate-pulse bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="p-12 text-center space-y-3">
        <p className="text-xs text-slate-500">Student profile not found.</p>
        <Link href="/teacher/students">
          <Button variant="outline" size="sm">Back to Students</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/teacher/students">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            {data.student.user.firstName} {data.student.user.lastName} — Student Portfolio
          </h1>
          <p className="text-xs text-slate-500">
            Comprehensive CEFR skill mastery, assessment analytics, and direct coaching history.
          </p>
        </div>
      </div>

      {feedbackSuccess && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{feedbackSuccess}</span>
        </div>
      )}

      {extendSuccess && (
        <div className="flex items-center gap-2 rounded-xl bg-primary-50 p-3 text-xs font-semibold text-primary-600 dark:bg-primary-950/50 dark:text-primary-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{extendSuccess}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile Card & Quick Actions */}
        <div className="space-y-6">
          <Card className="p-6 text-center space-y-4">
            <Avatar className="mx-auto w-20 h-20 text-xl border-4 border-primary-50 shadow">
              <AvatarImage src={data.student.user.avatarUrl || ''} />
              <AvatarFallback className="bg-primary-600 text-white font-bold">
                {data.student.user.firstName[0]}{data.student.user.lastName[0]}
              </AvatarFallback>
            </Avatar>

            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {data.student.user.firstName} {data.student.user.lastName}
              </h2>
              <p className="text-xs text-slate-400">{data.student.user.email}</p>
            </div>

            <div className="flex justify-center gap-2">
              <Badge variant="primary" className="text-xs font-bold">
                Current Level: {data.student.currentLevel}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Goal: {data.student.targetLevel}
              </Badge>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 text-left text-xs space-y-2 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Overall Course Progress:</span>
                <span className="font-bold text-primary-600">{data.overallProgressPercentage}%</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Completed Lessons:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {data.completedLessonsCount} / {data.totalAssignedLessons}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Native Language:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {data.student.nativeLanguage || 'English / French / Kinyarwanda'}
                </span>
              </div>
            </div>
          </Card>

          {/* Active Enrollments & Extend Action */}
          <Card className="p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Enrolled Courses & Access
            </h3>

            {data.enrollments.map((enr) => (
              <div
                key={enr.id}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                    {enr.course.title}
                  </p>
                  <Badge variant={enr.status === 'ACTIVE' ? 'success' : 'warning'} className="text-[10px]">
                    {enr.status}
                  </Badge>
                </div>

                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {enr.expiresAt ? `Expires: ${new Date(enr.expiresAt).toLocaleDateString()}` : 'Lifetime'}
                </p>

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => handleExtendEnrollment(enr.id)}
                    isLoading={extending}
                  >
                    +30 Days Extension
                  </Button>
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* Right Columns: 7-Skill CEFR Matrix & Coaching Notes */}
        <div className="md:col-span-2 space-y-6">
          {/* 7-Skill Matrix */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary-600" /> 7-Skill CEFR Mastery Matrix
              </h3>
              <Badge variant="outline" className="text-xs">
                Real-Time Diagnostics
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(data.skillBreakdown).map(([skill, val]) => (
                <div
                  key={skill}
                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-center dark:border-slate-800 dark:bg-slate-900/50 space-y-1"
                >
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{skill}</p>
                  <p className="text-lg font-black text-primary-600">{val.averageScore}%</p>
                  <p className="text-[10px] text-slate-400">{val.attemptsCount} activities</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Assessment & Attendance Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Recent Submissions */}
            <Card className="p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Recent Assignment Submissions
              </h3>

              {data.recentSubmissions.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No submissions yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.recentSubmissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 text-xs"
                    >
                      <div className="truncate pr-2">
                        <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {sub.assignment.title}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(sub.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={sub.status === 'GRADED' ? 'success' : 'warning'} className="text-[10px]">
                        {sub.status === 'GRADED' ? `${sub.score}/${sub.assignment.maxScore}` : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Recent Quizzes */}
            <Card className="p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Recent Quiz Attempts
              </h3>

              {data.recentQuizzes.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No quiz attempts yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.recentQuizzes.map((q) => (
                    <div
                      key={q.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 text-xs"
                    >
                      <div className="truncate pr-2">
                        <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {q.quiz.title}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(q.startedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={q.isPassed ? 'success' : 'destructive'} className="text-[10px]">
                        {q.scorePercentage}%
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Coaching Feedback Form & History */}
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary-600" /> Send Coaching Feedback
            </h3>

            <form onSubmit={handleSendFeedback} className="space-y-3">
              <Input
                label="Feedback Topic"
                value={feedbackTitle}
                onChange={(e) => setFeedbackTitle(e.target.value)}
                required
              />

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Direct Coaching Note
                </label>
                <textarea
                  rows={3}
                  placeholder="Leave actionable insights to help the student advance their CEFR level..."
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Observed Strengths (comma-separated)"
                  value={strengthsText}
                  onChange={(e) => setStrengthsText(e.target.value)}
                />
                <Input
                  label="Target Improvements (comma-separated)"
                  value={improvementsText}
                  onChange={(e) => setImprovementsText(e.target.value)}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="gradient" size="sm" isLoading={sendingFeedback}>
                  <Send className="h-3.5 w-3.5 mr-1" /> Send Feedback Note
                </Button>
              </div>
            </form>

            {/* Previous Coaching Notes History */}
            {data.feedbacks.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Past Coaching History
                </h4>

                <div className="space-y-2">
                  {data.feedbacks.map((fb) => (
                    <div
                      key={fb.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-900 dark:text-white">{fb.title}</p>
                        <span className="text-[10px] text-slate-400">
                          {new Date(fb.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{fb.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
