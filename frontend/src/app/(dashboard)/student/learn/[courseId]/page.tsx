'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Play,
  Layers,
  FileText,
  Video,
  Headphones,
  Award,
  Sparkles,
  Lock,
  RotateCcw,
  Clock,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Lesson {
  id: string;
  title: string;
  description?: string;
  skill?: string;
  estimatedMinutes: number;
  orderIndex: number;
  sections?: Array<{
    id: string;
    title: string;
    contentType: 'TEXT' | 'VIDEO' | 'AUDIO' | 'EXERCISE';
    contentData: string;
    mediaUrl?: string;
  }>;
}

interface Unit {
  id: string;
  title: string;
  description?: string;
  orderIndex: number;
  lessons: Lesson[];
}

interface CourseLearningData {
  course: {
    id: string;
    title: string;
    level: string;
    description: string;
    units: Unit[];
    teacher: {
      user: {
        firstName: string;
        lastName: string;
      };
    };
  };
  access: {
    isEnrolled: boolean;
    isAccessActive: boolean;
    isExpired: boolean;
    status: string;
  };
  progressRecords: Array<{
    lessonId: string;
    isCompleted: boolean;
    timeSpentSec: number;
  }>;
}

export default function StudentLearnPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [data, setData] = useState<CourseLearningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [completing, setCompleting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<CourseLearningData>(`/students/courses/${courseId}`);
      const learningData: CourseLearningData = (res as any)?.data || res;
      if (learningData && learningData.course) {
        setData(learningData);

        // Find first incomplete lesson or first lesson
        const allLessons = learningData.course.units.flatMap((u) => u.lessons);
        const completedIds = (learningData.progressRecords || []).filter((p) => p.isCompleted).map((p) => p.lessonId);
        const nextLesson = allLessons.find((l) => !completedIds.includes(l.id)) || allLessons[0];

        if (nextLesson && !selectedLesson) {
          setSelectedLesson(nextLesson);
        }
      }
    } catch (err) {
      console.error('Failed to load course player', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const handleMarkComplete = async () => {
    if (!selectedLesson) return;
    try {
      setCompleting(true);
      await apiClient.post(`/students/lessons/${selectedLesson.id}/complete`, {
        timeSpentSec: (selectedLesson.estimatedMinutes || 30) * 60,
      });
      setFeedback('Lesson marked as completed! Study time and progress updated.');
      await fetchCourse();
    } catch (err: any) {
      console.error('Failed to complete lesson', err);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center text-xs text-slate-400">Loading learning studio...</div>
      </div>
    );
  }

  if (!data || !data.course) {
    return (
      <Card className="p-12 text-center">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Course not found</h3>
        <Link href="/student/my-courses">
          <Button size="sm" variant="outline" className="mt-3">
            Back to My Courses
          </Button>
        </Link>
      </Card>
    );
  }

  // If not enrolled or expired
  if (!data.access?.isAccessActive) {
    return (
      <Card className="max-w-xl mx-auto p-8 text-center shadow-2xl mt-12 border-rose-200 dark:border-rose-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4 dark:bg-rose-950/40">
          <Lock className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {data.access?.isExpired ? 'Course Access Expired' : 'Enrollment Required'}
        </h2>
        <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
          {data.access?.isExpired
            ? 'Your paid enrollment period has concluded. You can renew access to continue studying lessons and quizzes.'
            : 'You must submit verification payment to unlock this interactive English curriculum.'}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href={`/student/payments?courseId=${data.course.id}`}>
            <Button variant="gradient" size="sm">
              {data.access?.isExpired ? 'Renew Course Access' : 'Submit Payment Proof'}
            </Button>
          </Link>
          <Link href="/student/my-courses">
            <Button variant="outline" size="sm">
              Back to My Courses
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  const allLessons = data.course.units.flatMap((u) => u.lessons);
  const currentIndex = allLessons.findIndex((l) => l.id === selectedLesson?.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const isCurrentLessonCompleted = data.progressRecords?.some(
    (p) => p.lessonId === selectedLesson?.id && p.isCompleted
  );

  return (
    <div className="space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link href="/student/my-courses">
            <Button size="sm" variant="ghost" className="p-2">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="indigo">Level {data.course.level}</Badge>
              <span className="text-xs text-slate-400">
                Instructor: {data.course.teacher.user.firstName} {data.course.teacher.user.lastName}
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {data.course.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {prevLesson && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedLesson(prevLesson)}
              className="text-xs"
            >
              <ChevronLeft className="mr-1 h-3.5 w-3.5" />
              Previous
            </Button>
          )}
          {nextLesson && (
            <Button
              size="sm"
              variant="gradient"
              onClick={() => setSelectedLesson(nextLesson)}
              className="text-xs"
            >
              Next Lesson
              <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="underline text-[11px]">Dismiss</button>
        </div>
      )}

      {/* Main Split Player Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Curriculum Units Sidebar Navigator */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Curriculum Syllabus
          </h2>

          <div className="space-y-3">
            {data.course.units.map((unit, uIdx) => (
              <Card key={unit.id} className="overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Unit {uIdx + 1}: {unit.title}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {unit.lessons.length} lessons
                  </span>
                </div>
                <div className="p-2 space-y-1">
                  {unit.lessons.map((lesson, lIdx) => {
                    const isSelected = selectedLesson?.id === lesson.id;
                    const isCompleted = data.progressRecords?.some(
                      (p) => p.lessonId === lesson.id && p.isCompleted
                    );

                    return (
                      <div
                        key={lesson.id}
                        onClick={() => setSelectedLesson(lesson)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-all ${
                          isSelected
                            ? 'bg-primary-50 text-primary-900 font-bold dark:bg-primary-950/60 dark:text-primary-300'
                            : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          ) : (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[9px] text-slate-500 shrink-0">
                              {lIdx + 1}
                            </span>
                          )}
                          <span className="truncate">{lesson.title}</span>
                        </div>
                        {lesson.skill && (
                          <Badge variant="outline" className="text-[9px] py-0 shrink-0 ml-1">
                            {lesson.skill}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Column (3 cols): Selected Lesson Content & Interactive Player */}
        <div className="lg:col-span-3 space-y-6">
          {selectedLesson ? (
            <>
              {/* Lesson Overview Card */}
              <Card className="p-6 border-l-4 border-l-primary-600 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {selectedLesson.skill && <Badge variant="indigo">{selectedLesson.skill}</Badge>}
                      <Badge variant="outline" className="flex items-center gap-1 text-[10px]">
                        <Clock className="h-3 w-3" />
                        {selectedLesson.estimatedMinutes || 30} mins
                      </Badge>
                      {isCurrentLessonCompleted && (
                        <Badge variant="success">Completed</Badge>
                      )}
                    </div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                      {selectedLesson.title}
                    </h2>
                    {selectedLesson.description && (
                      <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                        {selectedLesson.description}
                      </p>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant={isCurrentLessonCompleted ? 'outline' : 'gradient'}
                    disabled={completing}
                    onClick={handleMarkComplete}
                    className="shrink-0"
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    {isCurrentLessonCompleted ? 'Completed' : completing ? 'Saving...' : 'Mark as Completed'}
                  </Button>
                </div>
              </Card>

              {/* Lesson Media & Sections */}
              <Card className="p-6 space-y-6">
                {/* Embedded Video/Audio if present in sections */}
                {selectedLesson.sections && selectedLesson.sections.length > 0 ? (
                  selectedLesson.sections.map((sec) => (
                    <div key={sec.id} className="space-y-3 pt-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {sec.contentType === 'VIDEO' ? (
                          <Video className="h-4 w-4 text-blue-500" />
                        ) : sec.contentType === 'AUDIO' ? (
                          <Headphones className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-primary-600" />
                        )}
                        {sec.title}
                      </h3>

                      {sec.contentType === 'VIDEO' && sec.mediaUrl && (
                        <div className="aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
                          <iframe
                            src={sec.mediaUrl}
                            title={sec.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full border-0"
                          />
                        </div>
                      )}

                      {sec.contentType === 'AUDIO' && sec.mediaUrl && (
                        <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                          <audio controls className="w-full">
                            <source src={sec.mediaUrl} />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      )}

                      <div className="prose dark:prose-invert max-w-none text-xs text-slate-700 dark:text-slate-300 font-normal leading-relaxed whitespace-pre-wrap">
                        {sec.contentData}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-slate-50 p-6 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300 font-mono whitespace-pre-wrap border border-slate-100 dark:border-slate-800">
                      {`### Learning Objectives for ${selectedLesson.title}

1. Master key grammatical structures and contextual phrases.
2. Review essential CEFR ${data.course.level} vocabulary and pronunciation notes.
3. Complete practice drills and interactive speaking/writing exercises.

Refer to the sidebar to navigate units or complete assignments for this unit.`}
                    </div>
                  </div>
                )}
              </Card>

              {/* Bottom Navigation */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                {prevLesson ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedLesson(prevLesson)}
                    className="text-xs"
                  >
                    <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                    Previous: {prevLesson.title}
                  </Button>
                ) : <div />}

                {nextLesson ? (
                  <Button
                    size="sm"
                    variant="gradient"
                    onClick={() => setSelectedLesson(nextLesson)}
                    className="text-xs"
                  >
                    Next: {nextLesson.title}
                    <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Link href="/student/progress">
                    <Button size="sm" variant="gradient" className="text-xs">
                      <Award className="mr-1.5 h-3.5 w-3.5" />
                      View 7-Skill Mastery Matrix
                    </Button>
                  </Link>
                )}
              </div>
            </>
          ) : (
            <Card className="p-12 text-center text-slate-400">
              Select a lesson from the syllabus on the left to begin studying.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
