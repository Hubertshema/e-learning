'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  FileText,
  Sparkles,
  Award,
  Link2,
  ExternalLink
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Assignment {
  id: string;
  title: string;
  description: string;
  maxScore: number;
  dueDate?: string;
  lesson: {
    title: string;
    skill: string;
    unit: {
      course: {
        title: string;
        level: string;
      };
    };
  };
  submissions: Array<{
    id: string;
    content: string;
    attachmentUrl?: string;
    score?: number;
    feedback?: string;
    status: 'SUBMITTED' | 'GRADED';
    submittedAt: string;
    gradedAt?: string;
  }>;
}

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null);
  const [viewingEvaluation, setViewingEvaluation] = useState<Assignment | null>(null);

  const [form, setForm] = useState({
    content: '',
    attachmentUrl: '',
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<Assignment[]>('/student/assignments');
      if (res) {
        const payload = (res as any).data || res;
        setAssignments(Array.isArray(payload) ? payload : []);
      }
    } catch (err) {
      console.error('Failed to load assignments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingAssignment) return;

    try {
      setSaving(true);
      await apiClient.post(`/student/assignments/${submittingAssignment.id}/submit`, form);
      setFeedback({ type: 'success', message: 'Assignment submitted! Your instructor has been notified for grading.' });
      setSubmittingAssignment(null);
      setForm({ content: '', attachmentUrl: '' });
      await fetchAssignments();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to submit assignment' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">Practice & Assessments</Badge>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Assignments & Skill Exercises
          </h1>
          <p className="text-xs text-slate-500">
            Submit essays, speaking recordings, and exercises for individualized instructor review.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl p-4 text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="underline text-[11px]">Dismiss</button>
        </div>
      )}

      {/* Assignment Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading assignments...</div>
        ) : assignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assignments.map((ass) => {
              const submission = ass.submissions?.[0];
              const isGraded = submission?.status === 'GRADED';
              const isSubmitted = submission?.status === 'SUBMITTED';

              return (
                <Card key={ass.id} className="p-6 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="indigo">{ass.lesson.unit.course.level}</Badge>
                        <Badge variant="outline">{ass.lesson.skill}</Badge>
                      </div>
                      {isGraded ? (
                        <Badge variant="success">
                          Score: {submission.score} / {ass.maxScore}
                        </Badge>
                      ) : isSubmitted ? (
                        <Badge variant="warning">Under Review</Badge>
                      ) : (
                        <Badge variant="outline">Pending Submission</Badge>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{ass.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {ass.lesson.unit.course.title} • {ass.lesson.title}
                    </p>

                    <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                      <p className="font-medium">{ass.description}</p>
                    </div>

                    {isGraded && submission.feedback && (
                      <div className="mt-3 rounded-xl bg-emerald-50/50 p-3 text-xs text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900">
                        <strong className="block text-[11px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
                          Teacher Evaluation:
                        </strong>
                        <p>{submission.feedback}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    {ass.dueDate ? (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Due: {new Date(ass.dueDate).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Self-paced task</span>
                    )}

                    {isGraded ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewingEvaluation(ass)}
                        className="text-xs"
                      >
                        <Award className="mr-1 h-3.5 w-3.5 text-primary-600" />
                        View Full Grade
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant={isSubmitted ? 'outline' : 'gradient'}
                        onClick={() => {
                          setSubmittingAssignment(ass);
                          setForm({
                            content: submission?.content || '',
                            attachmentUrl: submission?.attachmentUrl || '',
                          });
                        }}
                        className="text-xs"
                      >
                        <Send className="mr-1 h-3.5 w-3.5" />
                        {isSubmitted ? 'Update Submission' : 'Submit Assignment'}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No assignments assigned yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              As you progress through your course syllabus, assignments from your instructor will appear here.
            </p>
          </Card>
        )}
      </div>

      {/* Submission Modal */}
      {submittingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="indigo">{submittingAssignment.lesson.skill}</Badge>
                <span className="text-xs text-slate-500">Max Score: {submittingAssignment.maxScore} pts</span>
              </div>
              <CardTitle className="text-base mt-1">Submit Assignment: {submittingAssignment.title}</CardTitle>
              <CardDescription className="text-xs">
                {submittingAssignment.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitAssignment} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Your Response / Written Solution <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={6}
                    required
                    placeholder="Write your essay, sentences, or exercise responses here..."
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Audio Recording / Document URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://vocaroo.com/... or Google Docs link"
                    value={form.attachmentUrl}
                    onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    For speaking exercises, you can record on Vocaroo and paste the link.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setSubmittingAssignment(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="gradient" size="sm" disabled={saving}>
                    {saving ? 'Submitting...' : 'Submit to Instructor'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grade Details Modal */}
      {viewingEvaluation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="success">Graded</Badge>
                <span className="text-base font-black text-emerald-600">
                  {viewingEvaluation.submissions[0]?.score} / {viewingEvaluation.maxScore} pts
                </span>
              </div>
              <CardTitle className="text-base mt-1">{viewingEvaluation.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Your Submitted Work:</p>
                <div className="rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-900 border border-slate-100 dark:border-slate-800 whitespace-pre-wrap">
                  {viewingEvaluation.submissions[0]?.content}
                </div>
              </div>

              {viewingEvaluation.submissions[0]?.feedback && (
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Instructor Feedback:</p>
                  <div className="rounded-lg bg-emerald-50/50 p-3 text-xs text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {viewingEvaluation.submissions[0]?.feedback}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={() => setViewingEvaluation(null)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
