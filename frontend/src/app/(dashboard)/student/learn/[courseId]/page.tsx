'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
  AlertCircle,
  Activity as ActivityIcon
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { RichTextRenderer } from '@/components/ui/rich-text-editor';
import { ActivityContainer, ActivityData } from '@/components/activities/activity-container';

interface LessonSection {
  id: string;
  title: string;
  contentType: string;
  content: string;
  mediaUrl?: string;
  orderIndex?: number;
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  skill?: string;
  estimatedMinutes: number;
  orderIndex: number;
  objectives?: string[];
  sections?: LessonSection[];
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
    teacher?: {
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const targetLessonId = searchParams.get('lesson');

  const [data, setData] = useState<CourseLearningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState<'CONTENT' | 'PRACTICE'>('CONTENT');
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [completing, setCompleting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<CourseLearningData>(`/student/courses/${courseId}`);
      const learningData: CourseLearningData = (res as any)?.data || res;
      if (learningData && learningData.course) {
        setData(learningData);

        const allLessons = (learningData.course.units || []).flatMap((u) => u.lessons || []);
        const completedIds = (learningData.progressRecords || []).filter((p) => p.isCompleted).map((p) => p.lessonId);

        let initialLesson: Lesson | undefined;
        if (targetLessonId) {
          initialLesson = allLessons.find((l) => l.id === targetLessonId);
        }
        if (!initialLesson) {
          initialLesson = allLessons.find((l) => !completedIds.includes(l.id)) || allLessons[0];
        }

        if (initialLesson) {
          setSelectedLesson(initialLesson);
        }
      }
    } catch (err) {
      console.error('Failed to load course player', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessonActivities = async (lessonId: string, lessonSkill?: string) => {
    try {
      const res = await apiClient.get<ActivityData[]>(`/activities/lesson/${lessonId}`);
      if (res && res.length > 0) {
        setActivities(res);
      } else {
        // Fallback default interactive practice activity for skill
        const defaultActivity: ActivityData = {
          id: `act-${lessonId}`,
          title: `${lessonSkill || 'Grammar'} Contextual Practice Drill`,
          type: lessonSkill === 'VOCABULARY' ? 'FLASHCARD' : lessonSkill === 'SPEAKING' ? 'SPEAKING_PRACTICE' : lessonSkill === 'READING' ? 'READING_PASSAGE' : 'FILL_BLANKS',
          skillType: lessonSkill || 'GRAMMAR',
          instructions: 'Complete this interactive drill to reinforce your learning.',
          questions: [
            {
              id: 'q1',
              prompt: 'Select the option that best completes the sentence in standard English.',
              options: [
                'I have been preparing for this presentation since early morning.',
                'I am prepare for this presentation since morning.',
                'I was been prepare for presentation since morning.',
                'I has preparing presentation morning.',
              ],
              correctAnswer: 'I have been preparing for this presentation since early morning.',
              explanation: 'Present perfect continuous expresses ongoing actions that began in the past.',
            },
            {
              id: 'q2',
              prompt: 'Which phrase is most appropriate for a formal email closing?',
              options: ['Best regards,', 'Later,', 'Cheers buddy,', 'Take care dude,'],
              correctAnswer: 'Best regards,',
              explanation: '"Best regards" is the standard professional sign-off.',
            },
          ],
        };
        setActivities([defaultActivity]);
      }
    } catch (err) {
      console.error('Failed to fetch lesson activities', err);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  useEffect(() => {
    if (selectedLesson) {
      fetchLessonActivities(selectedLesson.id, selectedLesson.skill);
    }
  }, [selectedLesson]);

  const handleMarkComplete = async () => {
    if (!selectedLesson) return;
    try {
      setCompleting(true);
      await apiClient.post(`/student/lessons/${selectedLesson.id}/complete`, {
        timeSpentSec: (selectedLesson.estimatedMinutes || 30) * 60,
      });
      setFeedback(`🎉 "${selectedLesson.title}" marked as completed! 7-Skill Progress & attendance updated.`);
      await fetchCourse();
    } catch (err: any) {
      console.error('Failed to complete lesson', err);
      setFeedback(err.message || 'Failed to update lesson completion status.');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[75vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          <p className="text-xs text-slate-500 font-medium">Loading interactive learning studio...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.course) {
    return (
      <Card className="p-12 text-center max-w-md mx-auto my-12">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-500 mb-2" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Course Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">The requested curriculum could not be retrieved.</p>
        <Link href="/student/my-courses">
          <Button size="sm" variant="outline">Back to My Courses</Button>
        </Link>
      </Card>
    );
  }

  // If not enrolled or access inactive
  if (!data.access?.isAccessActive) {
    return (
      <Card className="max-w-xl mx-auto p-8 text-center shadow-2xl mt-12 border-rose-200 dark:border-rose-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4 dark:bg-rose-950/40">
          <Lock className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {data.access?.isExpired ? 'Course Access Expired' : 'Enrollment & Payment Required'}
        </h2>
        <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
          {data.access?.isExpired
            ? 'Your enrollment period has concluded. You can renew access to continue studying lessons and quizzes.'
            : 'In accordance with academy access policies, curriculum materials are unlocked once your payment proof is verified by the instructor.'}
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

  const allLessons = (data.course.units || []).flatMap((u) => u.lessons || []);
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
              <Badge variant="indigo">CEFR {data.course.level}</Badge>
              {data.course.teacher?.user && (
                <span className="text-xs text-slate-400">
                  Instructor: {data.course.teacher.user.firstName} {data.course.teacher.user.lastName}
                </span>
              )}
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
              onClick={() => {
                setSelectedLesson(prevLesson);
                setActiveTab('CONTENT');
              }}
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
              onClick={() => {
                setSelectedLesson(nextLesson);
                setActiveTab('CONTENT');
              }}
              className="text-xs"
            >
              Next Lesson
              <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="underline text-[11px]">Dismiss</button>
        </div>
      )}

      {/* Main Split Player Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: Curriculum Units Sidebar Navigator */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-primary-600" /> Curriculum Syllabus ({data.course.units?.length || 0} Units)
          </h2>

          <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
            {(data.course.units || []).map((unit, uIdx) => (
              <Card key={unit.id} className="overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Unit {uIdx + 1}: {unit.title}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {unit.lessons?.length || 0} lessons
                  </span>
                </div>
                <div className="p-2 space-y-1">
                  {(unit.lessons || []).map((lesson, lIdx) => {
                    const isSelected = selectedLesson?.id === lesson.id;
                    const isCompleted = data.progressRecords?.some(
                      (p) => p.lessonId === lesson.id && p.isCompleted
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
                          {isCompleted ? (
                            <CheckCircle2 className={`h-4 w-4 shrink-0 ${isSelected ? 'text-white' : 'text-emerald-500'}`} />
                          ) : (
                            <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold shrink-0 ${isSelected ? 'bg-primary-700 text-white' : 'border border-slate-300 text-slate-500'}`}>
                              {lIdx + 1}
                            </span>
                          )}
                          <span className="truncate">{lesson.title}</span>
                        </div>
                        {lesson.skill && (
                          <Badge variant="outline" className={`text-[9px] py-0 shrink-0 ml-1 ${isSelected ? 'border-white text-white' : ''}`}>
                            {lesson.skill}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right 8 Cols: Selected Lesson Content & Interactive Player */}
        <div className="lg:col-span-8 space-y-6">
          {selectedLesson ? (
            <>
              {/* Lesson Header Card */}
              <Card className="p-6 border-l-4 border-l-primary-600 shadow-sm">
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
                      <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
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
                    {isCurrentLessonCompleted ? 'Marked Completed' : completing ? 'Saving...' : 'Mark as Completed'}
                  </Button>
                </div>
              </Card>

              {/* Learning Tab Switcher */}
              <div className="flex border-b border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setActiveTab('CONTENT')}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
                    activeTab === 'CONTENT'
                      ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
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
                      : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Interactive Practice Drills ({activities.length})</span>
                </button>
              </div>

              {/* Tab 1: Theory & Content */}
              {activeTab === 'CONTENT' && (
                <div className="space-y-6">
                  {selectedLesson.sections && selectedLesson.sections.length > 0 ? (
                    selectedLesson.sections.map((sec: any) => (
                      <Card key={sec.id} className="p-6 space-y-3">
                        <div className="flex items-center justify-between">
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
                          <Badge variant="outline" className="text-[10px]">
                            {sec.contentType}
                          </Badge>
                        </div>

                        {sec.mediaUrl && (
                          <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                            {sec.contentType === 'VIDEO' ? (
                              sec.mediaUrl.includes('youtube.com') || sec.mediaUrl.includes('vimeo.com') || sec.mediaUrl.includes('youtu.be') ? (
                                <div className="aspect-video w-full">
                                  <iframe
                                    src={sec.mediaUrl.replace('watch?v=', 'embed/')}
                                    title={sec.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full border-0"
                                  />
                                </div>
                              ) : (
                                <video controls className="w-full max-h-80 bg-black">
                                  <source src={sec.mediaUrl} type="video/mp4" />
                                  Your browser does not support video playback.
                                </video>
                              )
                            ) : sec.contentType === 'AUDIO' ? (
                              <div className="p-4 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                                <audio controls className="w-full">
                                  <source src={sec.mediaUrl} />
                                  Your browser does not support audio playback.
                                </audio>
                              </div>
                            ) : null}
                          </div>
                        )}

                        <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-1">
                          <RichTextRenderer content={sec.content || (sec as any).contentData || ''} />
                        </div>
                      </Card>
                    ))
                  ) : (
                    <Card className="p-8 text-center text-xs text-slate-500 space-y-2">
                      <p>No standalone lecture notes provided for this lesson.</p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setActiveTab('PRACTICE')}
                        className="mt-2 font-bold"
                      >
                        Start Interactive Practice Drill <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </Card>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button
                      variant="secondary"
                      onClick={() => setActiveTab('PRACTICE')}
                      className="font-bold text-xs"
                    >
                      Proceed to Interactive Practice
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Tab 2: Interactive Activities Drill */}
              {activeTab === 'PRACTICE' && (
                <div className="space-y-6">
                  {activities.map((act) => (
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

              {/* Bottom Nav Bar */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                {prevLesson ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedLesson(prevLesson);
                      setActiveTab('CONTENT');
                    }}
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
                    onClick={() => {
                      setSelectedLesson(nextLesson);
                      setActiveTab('CONTENT');
                    }}
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
