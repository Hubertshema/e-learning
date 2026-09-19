'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  Clock,
  Edit3,
  Award,
  AlertCircle,
  FileText,
  UserCheck,
  Send,
  Sparkles
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { RichTextEditor, RichTextRenderer } from '@/components/ui/rich-text-editor';


interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  skillType?: string;
  course?: {
    id: string;
    title: string;
    level: string;
  };
  _count?: {
    submissions: number;
  };
}

interface Submission {
  id: string;
  content: string;
  fileUrl?: string;
  score?: number;
  feedback?: string;
  status: 'PENDING' | 'GRADED';
  submittedAt: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface CourseOption {
  id: string;
  title: string;
  level: string;
}

const SKILL_CATEGORIES = [
  'WRITING',
  'SPEAKING',
  'READING',
  'LISTENING',
  'GRAMMAR',
  'VOCABULARY',
  'PRONUNCIATION'
];

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // Modals & Grading state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [gradeForm, setGradeForm] = useState({ score: 90, feedback: '' });
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    courseId: '',
    skillType: 'WRITING',
    maxScore: 100,
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const [assRes, courseRes] = await Promise.all([
        apiClient.get<{ assignments: Assignment[] }>('/teacher/assignments'),
        apiClient.get<CourseOption[]>('/teacher/courses')
      ]);

      const assignmentList: Assignment[] =
        (assRes as any)?.assignments ||
        (assRes as any)?.data?.assignments ||
        (Array.isArray(assRes) ? assRes : []);

      setAssignments(assignmentList);
      if (assignmentList.length > 0 && !selectedAssignment) {
        setSelectedAssignment(assignmentList[0]);
      }

      const courseList: CourseOption[] =
        Array.isArray(courseRes) ? courseRes : (courseRes as any)?.data || (courseRes as any)?.courses || [];

      setCourses(courseList);
      if (courseList.length > 0 && !createForm.courseId) {
        setCreateForm(prev => ({ ...prev, courseId: courseList[0].id }));
      }
    } catch (err) {
      console.error('Failed to load assignments', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (assignmentId: string) => {
    try {
      setSubmissionsLoading(true);
      const res = await apiClient.get<Submission[]>(`/teacher/assignments/${assignmentId}/submissions`);
      const submissionList: Submission[] =
        Array.isArray(res) ? res : (res as any)?.data || (res as any)?.submissions || [];
      setSubmissions(submissionList);
    } catch (err) {
      console.error('Failed to load submissions', err);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (selectedAssignment) {
      fetchSubmissions(selectedAssignment.id);
    }
  }, [selectedAssignment]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await apiClient.post('/teacher/assignments', createForm);
      setFeedback({ type: 'success', message: 'Assignment created and published to students!' });
      setShowCreateModal(false);
      setCreateForm({
        title: '',
        description: '',
        courseId: courses[0]?.id || '',
        skillType: 'WRITING',
        maxScore: 100,
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      });
      await fetchAssignments();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create assignment' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;
    try {
      setActionLoading(true);
      await apiClient.post(`/teacher/submissions/${gradingSubmission.id}/grade`, gradeForm);
      setFeedback({ type: 'success', message: 'Evaluation recorded and student progress updated!' });
      setGradingSubmission(null);
      if (selectedAssignment) {
        await fetchSubmissions(selectedAssignment.id);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to grade submission' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">Assessment & Rubrics</Badge>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Assignments & Student Evaluation
          </h1>
          <p className="text-xs text-slate-500">
            Create 7-skill prompts (essays, speaking recordings, grammar quizzes) and grade student work.
          </p>
        </div>
        <Button variant="gradient" size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Create New Assignment
        </Button>
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

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Assignment Catalog */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Assignments ({assignments.length})
          </h2>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </Card>
              ))}
            </div>
          ) : assignments.length > 0 ? (
            <div className="space-y-3">
              {assignments.map((ass) => {
                const isSelected = selectedAssignment?.id === ass.id;
                return (
                  <Card
                    key={ass.id}
                    onClick={() => setSelectedAssignment(ass)}
                    className={`cursor-pointer p-4 transition-all ${
                      isSelected
                        ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-md dark:border-primary-400'
                        : 'hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {ass.skillType && <Badge variant="indigo">{ass.skillType}</Badge>}
                          <Badge variant="outline">{ass.maxScore} pts</Badge>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{ass.title}</h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ass.description}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Due: {new Date(ass.dueDate).toLocaleDateString()}</span>
                      <span className="font-semibold text-primary-600">
                        {ass._count?.submissions || 0} Submissions
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <ClipboardList className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No assignments yet</p>
              <p className="text-[11px] text-slate-500 mb-3">Create your first task for student practice.</p>
              <Button size="sm" variant="gradient" onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                New Task
              </Button>
            </Card>
          )}
        </div>

        {/* Right Column (2 cols): Selected Assignment Submissions Workspace */}
        <div className="lg:col-span-2 space-y-6">
          {selectedAssignment ? (
            <>
              {/* Assignment Overview */}
              <Card className="p-5 border-l-4 border-l-primary-600">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="indigo">{selectedAssignment.skillType || 'WRITING'}</Badge>
                      <span className="text-xs font-bold text-slate-500">{selectedAssignment.course?.title}</span>
                    </div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                      {selectedAssignment.title}
                    </h2>
                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-1.5">
                      <RichTextRenderer content={selectedAssignment.description} />
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      Max Score: {selectedAssignment.maxScore}
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* Submissions List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-emerald-600" />
                    Student Submissions ({submissions.length})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Review and grade submitted answers, essays, and speaking clips
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {submissionsLoading ? (
                    <div className="py-12 text-center text-xs text-slate-400">Loading submissions...</div>
                  ) : submissions.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {submissions.map((sub) => (
                        <div key={sub.id} className="py-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">
                                {sub.student.firstName} {sub.student.lastName}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Submitted {new Date(sub.submittedAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {sub.status === 'GRADED' ? (
                                <Badge variant="success">
                                  Score: {sub.score} / {selectedAssignment.maxScore}
                                </Badge>
                              ) : (
                                <Badge variant="warning">Needs Grading</Badge>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setGradingSubmission(sub);
                                  setGradeForm({
                                    score: sub.score || 85,
                                    feedback: sub.feedback || 'Well structured! Notice the subject-verb agreement on paragraph 2.',
                                  });
                                }}
                                className="text-xs"
                              >
                                <Edit3 className="mr-1 h-3.5 w-3.5" />
                                {sub.status === 'GRADED' ? 'Edit Grade' : 'Grade Work'}
                              </Button>
                            </div>
                          </div>

                          {/* Student Content Snippet */}
                          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                            <RichTextRenderer content={sub.content} />
                          </div>

                          {sub.feedback && (
                            <div className="rounded-lg bg-emerald-50/50 p-3 text-xs text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900">
                              <strong className="block mb-1">Teacher Feedback:</strong>
                              <RichTextRenderer content={sub.feedback} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No student submissions received for this assignment yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="p-12 text-center text-slate-400">
              Select or create an assignment on the left to grade submissions.
            </Card>
          )}
        </div>
      </div>

      {/* Modal: Create Assignment */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary-600" />
                Create 7-Skill English Assignment
              </CardTitle>
              <CardDescription className="text-xs">
                Set prompt instructions, skill target, and grading criteria.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Assignment Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Essay: Pros and Cons of Remote Work"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Target Course
                    </label>
                    <select
                      value={createForm.courseId}
                      onChange={(e) => setCreateForm({ ...createForm, courseId: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>[{c.level}] {c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      7-Skill Domain
                    </label>
                    <select
                      value={createForm.skillType}
                      onChange={(e) => setCreateForm({ ...createForm, skillType: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                    >
                      {SKILL_CATEGORIES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Max Score / Points
                    </label>
                    <input
                      type="number"
                      required
                      value={createForm.maxScore}
                      onChange={(e) => setCreateForm({ ...createForm, maxScore: parseInt(e.target.value) || 100 })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Submission Deadline
                    </label>
                    <input
                      type="date"
                      required
                      value={createForm.dueDate}
                      onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                    />
                  </div>
                </div>

                <RichTextEditor
                  label="Instructions, Prompt Guidelines & Rubric"
                  placeholder="Write 200-250 words arguing both perspectives. Use at least 3 formal connectors (e.g. Furthermore, In contrast)..."
                  value={createForm.description}
                  onChange={(val) => setCreateForm({ ...createForm, description: val })}
                  minRows={5}
                  category="assignment"
                />

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="gradient" size="sm" disabled={actionLoading}>
                    {actionLoading ? 'Publishing...' : 'Publish Assignment'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal: Grade Submission */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4 text-primary-600" />
                Grade Student Submission
              </CardTitle>
              <CardDescription className="text-xs">
                Student: {gradingSubmission.student.firstName} {gradingSubmission.student.lastName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-900 border border-slate-100 dark:border-slate-800 max-h-40 overflow-y-auto">
                <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Student Answer:</p>
                <p className="font-mono text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{gradingSubmission.content}</p>
              </div>

              <form onSubmit={handleGradeSubmission} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Score (out of {selectedAssignment?.maxScore || 100})
                  </label>
                  <input
                    type="number"
                    max={selectedAssignment?.maxScore || 100}
                    min={0}
                    required
                    value={gradeForm.score}
                    onChange={(e) => setGradeForm({ ...gradeForm, score: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>
                <RichTextEditor
                  label="Constructive Teacher Feedback, Rubric Scores & Corrections"
                  placeholder="Praise strengths and note specific grammar/vocabulary improvements..."
                  value={gradeForm.feedback}
                  onChange={(val) => setGradeForm({ ...gradeForm, feedback: val })}
                  minRows={4}
                  category="feedback"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setGradingSubmission(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="gradient" size="sm" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : 'Submit Evaluation'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
