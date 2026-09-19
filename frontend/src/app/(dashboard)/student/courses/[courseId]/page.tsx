'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  CheckCircle2,
  Lock,
  Play,
  ArrowRight,
  ArrowLeft,
  Video,
  Headphones,
  FileText,
  Clock,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Layers,
  Activity,
  Award
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ActivityContainer, ActivityData } from '@/components/activities/activity-container';

interface LessonSection {
  id: string;
  title: string;
  contentType: string;
  content: string;
  mediaUrl?: string;
  orderIndex: number;
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  skill: string;
  estimatedMinutes: number;
  orderIndex: number;
  objectives?: string[];
  sections: LessonSection[];
}

interface Unit {
  id: string;
  title: string;
  description?: string;
  orderIndex: number;
  lessons: Lesson[];
}

interface ProgressRecord {
  id?: string;
  lessonId: string;
  isCompleted: boolean;
  timeSpentSec?: number;
}

interface CourseAccess {
  isEnrolled: boolean;
  isAccessActive: boolean;
  isExpired: boolean;
  status: string;
  expiresAt?: string | null;
  latestPayment?: any;
}

interface CourseData {
  course: {
    id: string;
    title: string;
    description: string;
    level: string;
    category: string;
    teacher?: {
      user: {
        firstName: string;
        lastName: string;
      };
    };
    units: Unit[];
  };
  enrollment?: {
    id: string;
    progressPercentage: number;
    status: string;
  } | null;
  access: CourseAccess;
  progressRecords: ProgressRecord[];
}

export default function StudentCoursePlayerPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [data, setData] = useState<CourseData | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState<'CONTENT' | 'PRACTICE'>('CONTENT');
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<CourseData>(`/student/courses/${courseId}`);
      if (res) {
        setData(res);
        if (res.course?.units?.length > 0 && res.course.units[0].lessons?.length > 0) {
          setSelectedLesson(res.course.units[0].lessons[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load course player', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessonActivities = async (lessonId: string) => {
    try {
      const res = await apiClient.get<ActivityData[]>(`/activities/lesson/${lessonId}`);
      if (res && res.length > 0) {
        setActivities(res);
      } else {
        // Provide dynamic default interactive activities for this lesson's skill
        const defaultActivity: ActivityData = {
          id: `act-${lessonId}`,
          title: `${selectedLesson?.skill || 'Grammar'} Interactive Mastery Drill`,
          type: selectedLesson?.skill === 'VOCABULARY' ? 'FLASHCARD' : selectedLesson?.skill === 'SPEAKING' ? 'SPEAKING_PRACTICE' : selectedLesson?.skill === 'READING' ? 'READING_PASSAGE' : 'FILL_BLANKS',
          skillType: selectedLesson?.skill || 'GRAMMAR',
          instructions: 'Complete all steps to reinforce your comprehension.',
          questions: [
            {
              id: 'q1',
              prompt: 'The team completed the quarterly report ___ time.',
              options: ['on', 'at', 'in', 'by'],
              correctAnswer: 'on',
              explanation: 'Use "on time" to denote punctuality.',
            },
            {
              id: 'q2',
              prompt: 'We look forward to ___ with your organization next month.',
              options: ['collaborating', 'collaborate', 'collaborated', 'collaboration'],
              correctAnswer: 'collaborating',
              explanation: '"Look forward to" is followed by a gerund (-ing).',
            },
            {
              id: 'q3',
              prompt: 'Neither the manager nor the employees ___ aware of the schedule change.',
              options: ['were', 'was', 'is', 'be'],
              correctAnswer: 'were',
              explanation: 'When subjects are connected by "neither... nor", the verb agrees with the closer subject ("employees").',
            },
          ],
        };
        setActivities([defaultActivity]);
      }
    } catch (err) {
      console.error('Failed to load lesson activities', err);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  useEffect(() => {
    if (selectedLesson) {
      fetchLessonActivities(selectedLesson.id);
    }
  }, [selectedLesson]);

  const handleMarkComplete = async () => {
    if (!selectedLesson) return;
    try {
      setCompleting(true);
      await apiClient.post(`/student/lessons/${selectedLesson.id}/complete`, {
        timeSpentSec: selectedLesson.estimatedMinutes * 60 || 180,
      });
      setFeedback('Lesson marked as completed! 7-Skill progress incremented.');
      await fetchCourseData();
    } catch (err: any) {
      setFeedback(err.message || 'Failed to update lesson completion');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          <p className="text-xs text-slate-500">Loading interactive lesson player...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="p-12 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-500 mb-2" />
        <h3 className="text-sm font-bold">Course Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">The requested course could not be loaded.</p>
        <Link href="/student/courses">
          <Button size="sm" variant="outline">Back to My Courses</Button>
        </Link>
      </Card>
    );
  }

  if (!data.access.isAccessActive) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="p-8 text-center space-y-4 border-amber-200 bg-amber-50/40 dark:border-amber-900/40 dark:bg-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/60">
            <Lock className="h-7 w-7 text-amber-600" />
          </div>
          <div>
            <Badge variant="warning">
              {data.access.status === 'PAYMENT_SUBMITTED'
                ? 'Payment Proof Under Instructor Review'
                : data.access.isExpired
                ? 'Course Access Expired'
                : 'Enrollment & Payment Required'}
            </Badge>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
              {data.course.title}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-md mx-auto">
              In accordance with academy access policies, curriculum materials are unlocked once your payment proof is verified by the instructor.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Link href="/student/courses">
              <Button variant="outline" size="sm">Back to Courses</Button>
            </Link>
            <Link href="/student/payments">
              <Button variant="gradient" size="sm">Check Payment Status</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const isCurrentLessonCompleted = data.progressRecords.some(
    (p: { lessonId: string; isCompleted: boolean }) => p.lessonId === selectedLesson?.id && p.isCompleted
  );

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link href="/student/courses">
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="indigo">{data.course.level}</Badge>
              <span className="text-xs font-bold text-slate-500">{data.course.title}</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {selectedLesson?.title || 'Interactive Lesson Player'}
            </h1>
          </div>
        </div>

        {selectedLesson && (
          <div className="flex items-center gap-2">
            {isCurrentLessonCompleted ? (
              <Badge variant="success" className="text-xs py-1 px-3">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                Completed
              </Badge>
            ) : (
              <Button
                variant="gradient"
                size="sm"
                disabled={completing}
                onClick={handleMarkComplete}
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                {completing ? 'Saving...' : 'Mark as Complete'}
              </Button>
            )}
          </div>
        )}
      </div>

      {feedback && (
        <div className="p-3 text-xs bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 flex justify-between items-center">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="underline text-[11px]">Dismiss</button>
        </div>
      )}

      {/* Main Learning Split: Sidebar Syllabus + Content Player */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: Syllabus Drawer */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary-600" />
            Course Syllabus ({data.course.units.length} Units)
          </h2>

          <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
            {data.course.units.map((unit: any, uIdx: number) => (
              <Card key={unit.id} className="overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100 text-xs font-bold text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>Unit {uIdx + 1}: {unit.title}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {unit.lessons.length} Lessons
                  </span>
                </div>
                <div className="p-2 space-y-1">
                  {unit.lessons.map((lesson: any, lIdx: number) => {
                    const isSelected = selectedLesson?.id === lesson.id;
                    const isCompleted = data.progressRecords.some(
                      (p: { lessonId: string; isCompleted: boolean }) => p.lessonId === lesson.id && p.isCompleted
                    );
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => {
                          setSelectedLesson(lesson);
                          setActiveTab('CONTENT');
                        }}
                        className={`w-full text-left rounded-lg p-2.5 text-xs transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-primary-600 text-white font-semibold shadow-sm'
                            : 'hover:bg-slate-100 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="opacity-70 text-[10px]">{uIdx + 1}.{lIdx + 1}</span>
                          <span className="truncate">{lesson.title}</span>
                        </div>
                        {isCompleted ? (
                          <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-emerald-500'}`} />
                        ) : (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${isSelected ? 'bg-primary-700 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                            {lesson.estimatedMinutes}m
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right 8 Cols: Content & Activities Player */}
        <div className="lg:col-span-8">
          {selectedLesson ? (
            <div className="space-y-6">
              {/* Tab Selector */}
              <div className="flex border-b border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setActiveTab('CONTENT')}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
                    activeTab === 'CONTENT'
                      ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Theory & Content</span>
                </button>
                <button
                  onClick={() => setActiveTab('PRACTICE')}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
                    activeTab === 'PRACTICE'
                      ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Interactive Activities ({activities.length})</span>
                </button>
              </div>

              {/* Tab 1: Theory / Lesson Sections */}
              {activeTab === 'CONTENT' && (
                <div className="space-y-6">
                  {/* Lesson Overview Card */}
                  <Card className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        {selectedLesson.title}
                      </h2>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {selectedLesson.estimatedMinutes} mins
                        </span>
                      </div>
                    </div>

                    {selectedLesson.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {selectedLesson.description}
                      </p>
                    )}

                    {selectedLesson.objectives && selectedLesson.objectives.length > 0 && (
                      <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50 space-y-2">
                        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Lesson Objectives
                        </h3>
                        <ul className="space-y-1">
                          {selectedLesson.objectives.map((obj: string, idx: number) => (
                            <li key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary-600 shrink-0" />
                              <span>{obj}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>

                  {/* Lesson Sections (Video, Audio, Text, Vocabulary) */}
                  {selectedLesson.sections && selectedLesson.sections.length > 0 ? (
                    <div className="space-y-4">
                      {selectedLesson.sections.map((section: any) => (
                        <Card key={section.id} className="p-6 space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                              {section.title}
                            </h3>
                            <Badge variant="outline" className="text-[10px]">
                              {section.contentType}
                            </Badge>
                          </div>

                          {section.content && (
                            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {section.content}
                            </div>
                          )}

                          {section.mediaUrl && (
                            <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                              {section.contentType === 'VIDEO' ? (
                                <video controls className="w-full max-h-80 bg-black">
                                  <source src={section.mediaUrl} type="video/mp4" />
                                  Your browser does not support video playback.
                                </video>
                              ) : section.contentType === 'AUDIO' ? (
                                <div className="p-4 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                                  <audio controls className="w-full">
                                    <source src={section.mediaUrl} />
                                    Your browser does not support audio playback.
                                  </audio>
                                </div>
                              ) : null}
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="p-6 text-center text-xs text-slate-500">
                      No explicit theory sections provided for this lesson. Proceed directly to interactive activities.
                    </Card>
                  )}

                  {/* Call to action to start activities */}
                  <div className="flex justify-end">
                    <Button
                      variant="secondary"
                      onClick={() => setActiveTab('PRACTICE')}
                      className="font-bold text-xs"
                    >
                      Start Interactive Drill
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Tab 2: Interactive Activities Engine */}
              {activeTab === 'PRACTICE' && (
                <div className="space-y-6">
                  {activities.map((act: any) => (
                    <ActivityContainer
                      key={act.id}
                      activity={act}
                      onFinished={() => {
                        handleMarkComplete();
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Bottom Complete Button */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800">
                <Link href="/student/assignments">
                  <Button variant="outline" size="sm" className="text-xs">
                    View Lesson Assignments
                  </Button>
                </Link>
                <Button
                  variant="gradient"
                  size="sm"
                  disabled={completing}
                  onClick={handleMarkComplete}
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  {isCurrentLessonCompleted ? 'Re-mark Completed' : 'Complete Lesson'}
                </Button>
              </div>
            </div>
          ) : (
            <Card className="p-12 text-center text-slate-400">
              Select a lesson from the syllabus on the left to begin learning.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
