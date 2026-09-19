'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardList,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  Sparkles,
  Award,
  User,
  Clock
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface SubmissionItem {
  id: string;
  content: string;
  attachmentUrl?: string;
  score?: number;
  feedback?: string;
  status: 'PENDING' | 'SUBMITTED' | 'GRADED';
  submittedAt: string;
  student: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export default function TeacherAssignmentSubmissionsPage() {
  const params = useParams();
  const assignmentId = params.assignmentId as string;

  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubmission, setActiveSubmission] = useState<SubmissionItem | null>(null);
  const [gradingScore, setGradingScore] = useState(85);
  const [gradingFeedback, setGradingFeedback] = useState('');
  const [submittingGrade, setSubmittingGrade] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<SubmissionItem[]>(`/teacher/assignments/${assignmentId}/submissions`);
      if (res) {
        setSubmissions(res);
        if (res.length > 0) {
          setActiveSubmission(res[0]);
          setGradingScore(res[0].score || 85);
          setGradingFeedback(res[0].feedback || '');
        }
      }
    } catch (err) {
      console.error('Failed to load assignment submissions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [assignmentId]);

  const handleSelectSubmission = (sub: SubmissionItem) => {
    setActiveSubmission(sub);
    setGradingScore(sub.score || 85);
    setGradingFeedback(sub.feedback || '');
    setSuccessMsg(null);
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmission) return;

    try {
      setSubmittingGrade(true);
      await apiClient.post(`/teacher/submissions/${activeSubmission.id}/grade`, {
        score: Number(gradingScore),
        feedback: gradingFeedback,
      });

      setSuccessMsg(`Submission for ${activeSubmission.student.user.firstName} successfully graded!`);
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === activeSubmission.id
            ? { ...s, score: Number(gradingScore), feedback: gradingFeedback, status: 'GRADED' }
            : s
        )
      );
      if (activeSubmission) {
        setActiveSubmission({
          ...activeSubmission,
          score: Number(gradingScore),
          feedback: gradingFeedback,
          status: 'GRADED',
        });
      }
    } catch (err) {
      alert('Failed to submit grade.');
    } finally {
      setSubmittingGrade(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/teacher/assignments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Submission Evaluation Queue
          </h1>
          <p className="text-xs text-slate-500">
            Review submitted student responses, assign scores, and leave constructive coaching notes.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="h-96 animate-pulse bg-slate-100" />
          <Card className="md:col-span-2 h-96 animate-pulse bg-slate-100" />
        </div>
      ) : submissions.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-950">
            <ClipboardList className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Submissions Yet</h3>
          <p className="text-xs text-slate-500">
            Students enrolled in this course have not turned in work for this assignment yet.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Submissions List */}
          <Card className="p-3 space-y-2 h-fit">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 pt-1">
              Students ({submissions.length})
            </h3>

            <div className="space-y-1">
              {submissions.map((sub) => {
                const isSelected = activeSubmission?.id === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => handleSelectSubmission(sub)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-primary-600 text-white font-semibold shadow-md'
                        : 'hover:bg-slate-100 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">
                        {sub.student.user.firstName} {sub.student.user.lastName}
                      </p>
                      <p className={`text-[10px] ${isSelected ? 'text-primary-100' : 'text-slate-400'}`}>
                        {new Date(sub.submittedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <Badge
                      variant={sub.status === 'GRADED' ? 'success' : 'warning'}
                      className="text-[10px]"
                    >
                      {sub.status === 'GRADED' ? `${sub.score} pts` : 'Needs Grade'}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Submission Review & Grading Form */}
          {activeSubmission && (
            <Card className="md:col-span-2 p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700 font-bold text-sm dark:bg-primary-950">
                    {activeSubmission.student.user.firstName[0]}
                    {activeSubmission.student.user.lastName[0]}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {activeSubmission.student.user.firstName} {activeSubmission.student.user.lastName}
                    </h2>
                    <p className="text-xs text-slate-400">{activeSubmission.student.user.email}</p>
                  </div>
                </div>

                <Badge variant={activeSubmission.status === 'GRADED' ? 'success' : 'warning'}>
                  {activeSubmission.status === 'GRADED' ? 'GRADED' : 'AWAITING EVALUATION'}
                </Badge>
              </div>

              {/* Student Response Content */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Student Written Response
                </label>
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200 whitespace-pre-wrap leading-relaxed min-h-[120px]">
                  {activeSubmission.content}
                </div>
              </div>

              {activeSubmission.attachmentUrl && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-primary-50 text-primary-700 text-xs font-semibold dark:bg-primary-950/40">
                  <FileText className="h-4 w-4" />
                  <a
                    href={activeSubmission.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-primary-800"
                  >
                    View Attached Student Submission File
                  </a>
                </div>
              )}

              {/* Grading Form */}
              <form onSubmit={handleGradeSubmit} className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                  Instructor Grading & Rubric Feedback
                </h3>

                <div className="w-48">
                  <Input
                    label="Score (0–100)"
                    type="number"
                    min={0}
                    max={100}
                    value={gradingScore}
                    onChange={(e) => setGradingScore(parseInt(e.target.value, 10) || 0)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Constructive Feedback & Coaching Notes
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Provide specific feedback on vocabulary precision, grammatical accuracy, and tone..."
                    value={gradingFeedback}
                    onChange={(e) => setGradingFeedback(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white leading-relaxed"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" variant="gradient" isLoading={submittingGrade}>
                    <Send className="h-4 w-4 mr-1.5" /> Save Score & Send Feedback
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
