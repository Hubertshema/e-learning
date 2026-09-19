'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardList,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Calendar,
  Award,
  Users
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface CourseOption {
  id: string;
  title: string;
  level: string;
  units: Array<{
    id: string;
    title: string;
    lessons: Array<{
      id: string;
      title: string;
    }>;
  }>;
}

export default function TeacherCreateAssignmentPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxScore, setMaxScore] = useState(100);
  const [dueDate, setDueDate] = useState('');
  const [submissionType, setSubmissionType] = useState('TEXT');

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoadingCourses(true);
        const res = await apiClient.get<CourseOption[]>('/teacher/courses');
        if (res && res.length > 0) {
          setCourses(res);
          setSelectedCourseId(res[0].id);
          if (res[0].units?.[0]?.lessons?.[0]) {
            setSelectedLessonId(res[0].units[0].lessons[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load courses', err);
      } finally {
        setLoadingCourses(false);
      }
    };
    loadCourses();
  }, []);

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    const crs = courses.find((c) => c.id === courseId);
    if (crs && crs.units?.[0]?.lessons?.[0]) {
      setSelectedLessonId(crs.units[0].lessons[0].id);
    } else {
      setSelectedLessonId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedLessonId) {
      setError('Please select a lesson to assign this task to.');
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError('Please provide a title and detailed instructions.');
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post('/teacher/assignments', {
        lessonId: selectedLessonId,
        title,
        description,
        maxScore: Number(maxScore),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        submissionType,
      });

      router.push('/teacher/assignments');
    } catch (err: any) {
      setError(err.message || 'Failed to create assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentCourse = courses.find((c) => c.id === selectedCourseId);
  const availableLessons = currentCourse?.units?.flatMap((u) => u.lessons) || [];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/teacher/assignments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Create Writing / Speaking Assignment
          </h1>
          <p className="text-xs text-slate-500">
            Assign essay prompts, dialogue recording exercises, or case study responses to your cohorts.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs font-semibold text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Target Course
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="w-full mt-1 rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              >
                {courses.map((crs) => (
                  <option key={crs.id} value={crs.id}>
                    [{crs.level}] {crs.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Attach to Lesson
              </label>
              <select
                value={selectedLessonId}
                onChange={(e) => setSelectedLessonId(e.target.value)}
                className="w-full mt-1 rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              >
                {availableLessons.length === 0 ? (
                  <option value="">No lessons found</option>
                ) : (
                  availableLessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <Input
            label="Assignment Title"
            placeholder="e.g. Formal Business Email: Requesting Budget Approval"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Prompt & Task Instructions
            </label>
            <textarea
              rows={5}
              placeholder="Provide clear guidelines, expected word count, rubric criteria, and sample vocabulary..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white leading-relaxed"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Maximum Score"
              type="number"
              min={10}
              max={100}
              value={maxScore}
              onChange={(e) => setMaxScore(parseInt(e.target.value, 10) || 100)}
            />

            <Input
              label="Due Date (Optional)"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Submission Format
              </label>
              <select
                value={submissionType}
                onChange={(e) => setSubmissionType(e.target.value)}
                className="w-full mt-1 rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              >
                <option value="TEXT">Text Workspace</option>
                <option value="FILE">File / PDF Upload</option>
                <option value="AUDIO">Audio Voice Recording</option>
                <option value="BOTH">Text & File Upload</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link href="/teacher/assignments">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>

            <Button type="submit" variant="gradient" isLoading={submitting}>
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Publish Assignment
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
