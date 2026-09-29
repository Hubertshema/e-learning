'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
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
  Clock,
  ArrowRight,
  AlertCircle,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  GraduationCap,
  Trophy,
  Check,
  Sidebar,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { RichTextRenderer } from '@/components/ui/rich-text-editor';
import { ActivityContainer, ActivityData } from '@/components/activities/activity-container';
import { InteractiveVideoPlayer } from '@/components/interactive-video/interactive-video-player';
import { UniversalVideo } from '@/components/interactive-video/universal-video';

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
  type?: string;
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
  const [interactiveVideoData, setInteractiveVideoData] = useState<any>(null);
  const [loadingInteractive, setLoadingInteractive] = useState(false);

  // Flexible Classroom UI States
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState<'default' | 'wide'>('default');
  const [collapsedUnits, setCollapsedUnits] = useState<Record<string, boolean>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [justCompletedLesson, setJustCompletedLesson] = useState<Lesson | null>(null);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Fullscreen request error:', err);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleUnitCollapse = (unitId: string) => {
    setCollapsedUnits((prev) => ({
      ...prev,
      [unitId]: !prev[unitId],
    }));
  };

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
        const defaultActivity: ActivityData = {
          id: `act-${lessonId}`,
          title: `${lessonSkill || 'Grammar'} Interactive Mastery Drill`,
          type:
            lessonSkill === 'VOCABULARY'
              ? 'FLASHCARD'
              : lessonSkill === 'SPEAKING'
              ? 'SPEAKING_PRACTICE'
              : lessonSkill === 'READING'
              ? 'READING_PASSAGE'
              : 'FILL_BLANKS',
          skillType: lessonSkill || 'GRAMMAR',
          instructions: 'Complete this interactive drill to reinforce your learning.',
          questions: [
            {
              id: 'q1',
              prompt: 'Select the sentence that demonstrates standard professional business English.',
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

  const fetchInteractiveVideo = async (lessonId: string) => {
    try {
      setLoadingInteractive(true);
      setInteractiveVideoData(null);
      const res = await apiClient.get<any>(`/student/interactive-videos/lessons/${lessonId}`);
      setInteractiveVideoData(res || { videoUrl: '', activities: [] });
    } catch {
      setInteractiveVideoData({ videoUrl: '', activities: [] });
    } finally {
      setLoadingInteractive(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  useEffect(() => {
    if (selectedLesson) {
      if (selectedLesson.type === 'INTERACTIVE_VIDEO') {
        fetchInteractiveVideo(selectedLesson.id);
      } else {
        fetchLessonActivities(selectedLesson.id, selectedLesson.skill);
      }
    }
  }, [selectedLesson]);

  const lastProgressSyncRef = useRef<{ time: number; pos: number }>({ time: 0, pos: -1 });

  const handleVideoProgressUpdate = async (
    lessonId: string,
    position: number,
    watched: number,
    percent: number
  ) => {
    const now = Date.now();
    const timeDelta = now - lastProgressSyncRef.current.time;
    const posDelta = Math.abs(position - lastProgressSyncRef.current.pos);

    // Save every 5s, or when crossing 90%, or upon significant forward step (>= 15s)
    if (timeDelta > 5000 || (percent >= 90 && timeDelta > 2000) || posDelta >= 15) {
      lastProgressSyncRef.current = { time: now, pos: position };
      try {
        await apiClient.post(`/student/interactive-videos/lessons/${lessonId}/progress`, {
          lastPositionSeconds: Math.round(position),
          watchedSeconds: Math.round(watched),
          completionPercent: Math.round(percent),
        });

        // When >= 90% completed, update local progressRecords immediately to unlock curriculum
        if (percent >= 90) {
          setData((prev) => {
            if (!prev) return prev;
            const exists = prev.progressRecords?.some((p) => p.lessonId === lessonId);
            const updated = exists
              ? prev.progressRecords.map((p) =>
                  p.lessonId === lessonId ? { ...p, isCompleted: true } : p
                )
              : [
                  ...(prev.progressRecords || []),
                  { lessonId, isCompleted: true, timeSpentSec: Math.round(watched) },
                ];
            return {
              ...prev,
              progressRecords: updated,
            };
          });
        }
      } catch (err) {
        console.error('Failed to sync video progress', err);
      }
    }
  };

  const allLessons = (data?.course?.units || []).flatMap((u) => u.lessons || []);
  const currentIndex = allLessons.findIndex((l) => l.id === selectedLesson?.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const completedCount = (data?.progressRecords || []).filter((p) => p.isCompleted).length;
  const totalLessonsCount = allLessons.length;
  const progressPercent = totalLessonsCount > 0 ? Math.round((completedCount / totalLessonsCount) * 100) : 0;

  const isCurrentLessonCompleted = data?.progressRecords?.some(
    (p) => p.lessonId === selectedLesson?.id && p.isCompleted
  );

  // Helper: Checks if a lesson is unlocked sequentially
  const isLessonUnlocked = (lesson: Lesson) => {
    const idx = allLessons.findIndex((l) => l.id === lesson.id);
    if (idx <= 0) return true; // First lesson is always unlocked

    // Check if the lesson itself is already completed
    const isThisCompleted = data?.progressRecords?.some(
      (p) => p.lessonId === lesson.id && p.isCompleted
    );
    if (isThisCompleted) return true;

    // Must have completed the previous lesson
    const previousLesson = allLessons[idx - 1];
    const isPreviousCompleted = data?.progressRecords?.some(
      (p) => p.lessonId === previousLesson.id && p.isCompleted
    );
    return !!isPreviousCompleted;
  };

  const isNextLessonUnlocked = nextLesson ? isLessonUnlocked(nextLesson) : false;

  const handleMarkComplete = async (andGoToNext = false) => {
    if (!selectedLesson) return;
    try {
      setCompleting(true);
      await apiClient.post(`/student/lessons/${selectedLesson.id}/complete`, {
        timeSpentSec: (selectedLesson.estimatedMinutes || 30) * 60,
      });

      // Update local progressRecords immediately
      setData((prev) => {
        if (!prev) return prev;
        const exists = prev.progressRecords?.some((p) => p.lessonId === selectedLesson.id);
        const updatedRecords = exists
          ? prev.progressRecords.map((p) =>
              p.lessonId === selectedLesson.id ? { ...p, isCompleted: true } : p
            )
          : [...(prev.progressRecords || []), { lessonId: selectedLesson.id, isCompleted: true, timeSpentSec: 1800 }];
        return {
          ...prev,
          progressRecords: updatedRecords,
        };
      });

      setJustCompletedLesson(selectedLesson);

      if (andGoToNext && nextLesson) {
        setFeedback(`🎉 "${selectedLesson.title}" completed! Proceeding to "${nextLesson.title}"...`);
        setSelectedLesson(nextLesson);
        setActiveTab('CONTENT');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setShowCompletionModal(true);
        setFeedback(`🎉 "${selectedLesson.title}" marked as completed! Next lesson unlocked.`);
      }
    } catch (err: any) {
      console.error('Failed to complete lesson', err);
      setFeedback(err.message || 'Failed to update lesson completion status.');
    } finally {
      setCompleting(false);
    }
  };

  const handleLessonClick = (lesson: Lesson) => {
    const unlocked = isLessonUnlocked(lesson);
    if (!unlocked) {
      const idx = allLessons.findIndex((l) => l.id === lesson.id);
      const prev = idx > 0 ? allLessons[idx - 1] : null;
      setFeedback(`🔒 This lesson is locked. Please complete "${prev?.title || 'the previous lesson'}" first to unlock.`);
      return;
    }
    setSelectedLesson(lesson);
    setActiveTab('CONTENT');
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContinueToNextLesson = () => {
    setShowCompletionModal(false);
    if (nextLesson) {
      setSelectedLesson(nextLesson);
      setActiveTab('CONTENT');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f8faf8] dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#315b36] border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500">Loading interactive classroom studio...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8faf8] p-4 dark:bg-slate-950">
        <Card className="max-w-md p-8 text-center shadow-lg">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-rose-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Course Not Found</h3>
          <p className="mt-1 mb-4 text-xs text-slate-500">The requested curriculum could not be retrieved.</p>
          <Link href="/student/my-courses">
            <Button size="sm" variant="outline">
              Back to My Courses
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // If not enrolled or access inactive
  if (!data.access?.isAccessActive) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8faf8] p-4 dark:bg-slate-950">
        <Card className="max-w-xl p-8 text-center shadow-2xl border-rose-200 dark:border-rose-900">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {data.access?.isExpired ? 'Course Access Expired' : 'Enrollment & Payment Required'}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-500">
            {data.access?.isExpired
              ? 'Your enrollment period has concluded. You can renew access to continue studying lessons and quizzes.'
              : 'In accordance with academy access policies, curriculum materials are unlocked once your payment proof is verified by the instructor.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/student/courses">
              <Button variant="gradient" size="sm">
                Explore Courses
              </Button>
            </Link>
            <Link href="/student/my-courses">
              <Button variant="outline" size="sm">
                Back to My Courses
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const sidebarWidthClass = sidebarWidth === 'wide' ? 'w-80 sm:w-96 xl:w-[420px]' : 'w-72 sm:w-80 xl:w-84';

  return (
    <div className="flex min-h-screen flex-col bg-[#f8faf8] text-slate-900 dark:bg-slate-950 dark:text-slate-100 relative">
      {/* 1. Full-Screen Classroom Top Navigation Bar */}
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
        {/* Left: Back & Course Title */}
        <div className="flex items-center gap-3">
          <Link href="/student/my-courses">
            <Button
              size="sm"
              variant="outline"
              className="flex h-9 items-center gap-1.5 rounded-xl border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-[#eff4ec] hover:text-[#315b36] dark:border-slate-700 dark:text-slate-300"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">My Courses</span>
            </Button>
          </Link>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

          <div>
            <div className="flex items-center gap-2">
              <Badge variant="indigo" className="text-[10px] font-bold uppercase tracking-wider">
                CEFR {data.course.level}
              </Badge>
              {data.course.teacher?.user && (
                <span className="hidden text-[11px] text-slate-400 md:inline">
                  Instructor: {data.course.teacher.user.firstName} {data.course.teacher.user.lastName}
                </span>
              )}
            </div>
            <h1 className="truncate text-sm font-black text-slate-900 dark:text-white sm:text-base">
              {data.course.title}
            </h1>
          </div>
        </div>

        {/* Center: Overall Progress */}
        <div className="hidden items-center gap-3 lg:flex">
          <div className="flex flex-col items-end">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
              {completedCount} of {totalLessonsCount} Lessons Completed
            </span>
            <div className="mt-1 h-2 w-36 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full bg-[#315b36] transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <span className="rounded-full bg-[#eff4ec] px-2 py-0.5 text-xs font-black text-[#315b36] dark:bg-emerald-950 dark:text-emerald-300">
            {progressPercent}%
          </span>
        </div>

        {/* Right: Actions (Syllabus Drawer, Fullscreen, Next Lesson) */}
        <div className="flex items-center gap-2">
          {/* Flexible Syllabus Toggle */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className={`flex h-9 items-center gap-1.5 rounded-xl border-slate-200 text-xs font-semibold transition-all ${
              sidebarOpen
                ? 'bg-[#eff4ec] text-[#315b36] border-[#315b36]/30 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'text-slate-700 hover:bg-[#eff4ec] hover:text-[#315b36] dark:border-slate-700 dark:text-slate-300'
            }`}
            title={sidebarOpen ? 'Hide Syllabus Sidebar' : 'Show Syllabus Sidebar'}
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            <span className="hidden md:inline">{sidebarOpen ? 'Hide Syllabus' : 'Curriculum'}</span>
          </Button>

          {/* Fullscreen Mode Toggle */}
          <Button
            size="sm"
            variant="outline"
            onClick={toggleFullscreen}
            className="flex h-9 w-9 items-center justify-center rounded-xl border-slate-200 text-slate-700 hover:bg-[#eff4ec] hover:text-[#315b36] dark:border-slate-700 dark:text-slate-300"
            title={isFullscreen ? 'Exit Full Screen' : 'Full Screen Mode'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          {/* Quick Next Lesson CTA */}
          {nextLesson && (
            <Button
              size="sm"
              variant={isNextLessonUnlocked ? 'gradient' : 'outline'}
              disabled={!isNextLessonUnlocked}
              onClick={() => {
                if (isNextLessonUnlocked) {
                  setSelectedLesson(nextLesson);
                  setActiveTab('CONTENT');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className={`hidden h-9 items-center gap-1 rounded-xl text-xs font-bold sm:flex ${
                !isNextLessonUnlocked ? 'opacity-60 cursor-not-allowed' : ''
              }`}
              title={!isNextLessonUnlocked ? 'Complete current lesson to unlock' : 'Go to next lesson'}
            >
              {!isNextLessonUnlocked && <Lock className="h-3 w-3 mr-0.5 text-slate-400" />}
              <span>Next Lesson</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </header>

      {/* Floating Syllabus Re-opener Button when Sidebar is Closed */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-4 top-20 z-40 flex items-center gap-2 rounded-full bg-[#315b36] px-4 py-2.5 text-xs font-black text-white shadow-2xl hover:bg-[#254629] transition-all transform hover:scale-105 animate-in fade-in slide-in-from-left-4"
          title="Open Curriculum Syllabus"
        >
          <Layers className="h-4 w-4 text-emerald-300" />
          <span>Curriculum ({data.course.units?.length || 0} Units)</span>
        </button>
      )}

      {/* Mobile Drawer Overlay Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-35 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity animate-in fade-in"
        />
      )}

      {/* 2. Main Classroom Container */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Column: Flexible & Collapsible Curriculum Syllabus Sidebar */}
        {sidebarOpen && (
          <aside
            className={`fixed inset-y-0 left-0 z-40 lg:static lg:z-20 ${sidebarWidthClass} shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-all duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none animate-in slide-in-from-left duration-200`}
          >
            <div className="flex h-full flex-col">
              {/* Sidebar Header with Width Resizer & Close Button */}
              <div className="flex items-center justify-between border-b border-slate-100 p-3.5 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#315b36]" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Curriculum ({data.course.units?.length || 0} Units)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {/* Width Toggle: Compact vs Wide */}
                  <button
                    onClick={() => setSidebarWidth((prev) => (prev === 'default' ? 'wide' : 'default'))}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-[10px] font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title={sidebarWidth === 'default' ? 'Expand Sidebar Width' : 'Compact Sidebar Width'}
                  >
                    {sidebarWidth === 'default' ? 'Wide' : 'Standard'}
                  </button>

                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Close Sidebar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Units List */}
              <div className="flex-1 space-y-3 overflow-y-auto p-3">
                {(data.course.units || []).map((unit, uIdx) => {
                  const unitLessons = unit.lessons || [];
                  const unitCompleted = unitLessons.filter((l) =>
                    data.progressRecords?.some((p) => p.lessonId === l.id && p.isCompleted)
                  ).length;
                  const isUnitCollapsed = !!collapsedUnits[unit.id];

                  return (
                    <div
                      key={unit.id}
                      className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 transition-all"
                    >
                      {/* Flexible Collapsible Unit Header */}
                      <button
                        type="button"
                        onClick={() => toggleUnitCollapse(unit.id)}
                        className="w-full flex items-center justify-between border-b border-slate-100 bg-slate-50/90 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-900/70 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isUnitCollapsed ? (
                            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          )}
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            Unit {uIdx + 1}: {unit.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 shrink-0 ml-1">
                          {unitCompleted}/{unitLessons.length}
                        </span>
                      </button>

                      {/* Unit Lessons List */}
                      {!isUnitCollapsed && (
                        <div className="space-y-1 p-2 animate-in fade-in duration-150">
                          {unitLessons.map((lesson, lIdx) => {
                            const isSelected = selectedLesson?.id === lesson.id;
                            const isCompleted = data.progressRecords?.some(
                              (p) => p.lessonId === lesson.id && p.isCompleted
                            );
                            const unlocked = isLessonUnlocked(lesson);

                            return (
                              <button
                                key={lesson.id}
                                onClick={() => handleLessonClick(lesson)}
                                className={`flex w-full items-center justify-between rounded-xl p-2.5 text-left text-xs transition-all ${
                                  isSelected
                                    ? 'bg-[#315b36] font-bold text-white shadow-md'
                                    : isCompleted
                                    ? 'text-slate-800 hover:bg-[#eff4ec] hover:text-[#315b36] dark:text-slate-200 dark:hover:bg-slate-800'
                                    : unlocked
                                    ? 'text-slate-700 hover:bg-[#eff4ec] hover:text-[#315b36] dark:text-slate-300 dark:hover:bg-slate-800'
                                    : 'text-slate-400 bg-slate-50/50 hover:bg-slate-100/60 dark:bg-slate-900/40 dark:text-slate-600'
                                }`}
                                title={
                                  !unlocked
                                    ? 'Locked: Complete previous lesson to unlock'
                                    : isCompleted
                                    ? 'Completed'
                                    : 'Available'
                                }
                              >
                                <div className="flex min-w-0 items-center gap-2.5">
                                  {isCompleted ? (
                                    <div
                                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                                        isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60'
                                      }`}
                                    >
                                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                                    </div>
                                  ) : unlocked ? (
                                    <span
                                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                                        isSelected
                                          ? 'bg-white/20 text-white'
                                          : 'border border-slate-300 text-slate-500 dark:border-slate-700'
                                      }`}
                                    >
                                      {lIdx + 1}
                                    </span>
                                  ) : (
                                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200/60 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                      <Lock className="h-3 w-3" />
                                    </div>
                                  )}
                                  <span className="truncate font-medium">{lesson.title}</span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                  {!unlocked && (
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                                      Locked
                                    </span>
                                  )}
                                  {lesson.skill && (
                                    <span
                                      className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                        isSelected
                                          ? 'bg-white/20 text-white'
                                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                      }`}
                                    >
                                      {lesson.skill}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        )}

        {/* Right Main Content Area - Expands to 100% when sidebar is closed */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-w-0 transition-all duration-300">
          <div className="mx-auto max-w-5xl space-y-6">
            {feedback && (
              <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 shadow-sm animate-in fade-in dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{feedback}</span>
                </div>
                <button onClick={() => setFeedback(null)} className="text-[11px] underline">
                  Dismiss
                </button>
              </div>
            )}

            {selectedLesson ? (
              <>
                {/* Active Lesson Header Card */}
                <Card className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {selectedLesson.skill && (
                          <Badge variant="indigo" className="font-black uppercase tracking-wider">
                            {selectedLesson.skill}
                          </Badge>
                        )}
                        <Badge variant="outline" className="flex items-center gap-1 text-[11px] font-semibold">
                          <Clock className="h-3 w-3" />
                          {selectedLesson.estimatedMinutes || 30} mins
                        </Badge>
                        {isCurrentLessonCompleted ? (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Completed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            In Progress
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
                        {selectedLesson.title}
                      </h2>
                      {selectedLesson.description && (
                        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                          {selectedLesson.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {nextLesson && !isCurrentLessonCompleted && (
                        <Button
                          size="default"
                          variant="gradient"
                          disabled={completing}
                          onClick={() => handleMarkComplete(true)}
                          className="rounded-xl font-bold shadow-sm"
                        >
                          <Sparkles className="mr-1.5 h-4 w-4" />
                          {completing ? 'Completing...' : 'Complete & Continue'}
                          <ArrowRight className="ml-1.5 h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        size="default"
                        variant={isCurrentLessonCompleted ? 'outline' : 'secondary'}
                        disabled={completing}
                        onClick={() => handleMarkComplete(false)}
                        className="rounded-xl font-bold shadow-sm"
                      >
                        <CheckCircle2 className="mr-1.5 h-4 w-4" />
                        {isCurrentLessonCompleted
                          ? 'Marked Completed'
                          : completing
                          ? 'Saving...'
                          : 'Mark as Completed'}
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Lesson Body: Interactive Video OR Theory + Drills */}
                {selectedLesson.type === 'INTERACTIVE_VIDEO' ? (
                  loadingInteractive ? (
                    <Card className="p-16 text-center text-slate-500">
                      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#315b36] border-t-transparent" />
                      <p className="text-xs font-semibold">Loading interactive video studio...</p>
                    </Card>
                  ) : interactiveVideoData ? (
                    <InteractiveVideoPlayer
                      lessonId={selectedLesson.id}
                      videoUrl={interactiveVideoData.videoUrl}
                      durationSeconds={interactiveVideoData.durationSeconds}
                      activities={interactiveVideoData.activities}
                      transcript={interactiveVideoData.transcript}
                      captions={interactiveVideoData.captions}
                      initialPosition={interactiveVideoData.progress?.lastPositionSeconds || 0}
                      initialWatched={interactiveVideoData.progress?.watchedSeconds || 0}
                      completedActivityIds={interactiveVideoData.completedActivityIds || []}
                      isTeacher={false}
                      navigationMode={interactiveVideoData.navigationMode}
                      onProgress={(position, watched, percent) => {
                        handleVideoProgressUpdate(selectedLesson.id, position, watched, percent);
                      }}
                    />
                  ) : (
                    <Card className="p-12 text-center text-rose-500">
                      Failed to load interactive video content.
                    </Card>
                  )
                ) : (
                  <>
                    {/* Tab Navigation for Standard Lessons */}
                    <div className="flex border-b border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => setActiveTab('CONTENT')}
                        className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-black transition-all ${
                          activeTab === 'CONTENT'
                            ? 'border-[#315b36] text-[#315b36] dark:text-emerald-400'
                            : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <BookOpen className="h-4 w-4" />
                        <span>Theory & Lecture Notes</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('PRACTICE')}
                        className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-black transition-all ${
                          activeTab === 'PRACTICE'
                            ? 'border-[#315b36] text-[#315b36] dark:text-emerald-400'
                            : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>Interactive Practice Drills ({activities.length})</span>
                      </button>
                    </div>

                    {/* Tab 1: Theory & Lecture Content */}
                    {activeTab === 'CONTENT' && (
                      <div className="space-y-6">
                        {selectedLesson.sections && selectedLesson.sections.length > 0 ? (
                          selectedLesson.sections.map((sec: any) => (
                            <Card key={sec.id} className="space-y-3 rounded-2xl p-6 shadow-sm">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                                  {sec.contentType === 'VIDEO' ? (
                                    <Video className="h-4 w-4 text-blue-500" />
                                  ) : sec.contentType === 'AUDIO' ? (
                                    <Headphones className="h-4 w-4 text-emerald-500" />
                                  ) : (
                                    <FileText className="h-4 w-4 text-[#315b36]" />
                                  )}
                                  {sec.title}
                                </h3>
                                <Badge variant="outline" className="text-[10px]">
                                  {sec.contentType}
                                </Badge>
                              </div>

                              {sec.mediaUrl && (
                                <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                                  {sec.contentType === 'VIDEO' ? (
                                    <UniversalVideo url={sec.mediaUrl} controls className="aspect-video w-full" />
                                  ) : sec.contentType === 'AUDIO' ? (
                                    <div className="flex items-center justify-center bg-slate-50 p-4 dark:bg-slate-900">
                                      <audio controls className="w-full">
                                        <source src={sec.mediaUrl} />
                                        Your browser does not support audio playback.
                                      </audio>
                                    </div>
                                  ) : null}
                                </div>
                              )}

                              <div className="pt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                                <RichTextRenderer content={sec.content || (sec as any).contentData || ''} />
                              </div>
                            </Card>
                          ))
                        ) : (
                          <Card className="space-y-3 rounded-2xl p-8 text-center text-xs text-slate-500">
                            <p>No standalone lecture notes provided for this lesson.</p>
                            <Button
                              variant="gradient"
                              size="sm"
                              onClick={() => setActiveTab('PRACTICE')}
                              className="font-bold"
                            >
                              Start Interactive Practice Drill <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                            </Button>
                          </Card>
                        )}

                        <div className="flex justify-end pt-2">
                          <Button
                            variant="secondary"
                            onClick={() => setActiveTab('PRACTICE')}
                            className="rounded-xl font-bold text-xs"
                          >
                            Proceed to Interactive Practice
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Interactive Practice Drills */}
                    {activeTab === 'PRACTICE' && (
                      <div className="space-y-6">
                        {activities.map((act) => (
                          <ActivityContainer
                            key={act.id}
                            activity={act}
                            onFinished={() => {
                              handleMarkComplete(false);
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Bottom Navigation Toolbar */}
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
                  {prevLesson ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleLessonClick(prevLesson)}
                      className="rounded-xl text-xs font-semibold"
                    >
                      <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                      Previous: {prevLesson.title}
                    </Button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    {nextLesson ? (
                      isNextLessonUnlocked ? (
                        <Button
                          size="default"
                          variant="gradient"
                          onClick={() => {
                            setSelectedLesson(nextLesson);
                            setActiveTab('CONTENT');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="rounded-xl text-xs font-bold shadow-md"
                        >
                          Next: {nextLesson.title}
                          <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button
                          size="default"
                          variant="gradient"
                          disabled={completing}
                          onClick={() => handleMarkComplete(true)}
                          className="rounded-xl text-xs font-bold shadow-md"
                        >
                          <CheckCircle2 className="mr-1.5 h-4 w-4" />
                          Complete & Continue to Next Lesson
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                      )
                    ) : (
                      <Link href="/student/my-courses">
                        <Button size="default" variant="gradient" className="rounded-xl text-xs font-bold shadow-md">
                          <Award className="mr-1.5 h-4 w-4" />
                          Course Complete • Return to Courses
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <Card className="p-12 text-center text-slate-400">
                Select a lesson from the syllabus to begin studying.
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* 3. Lesson Completed Celebratory Modal */}
      <Modal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        size="md"
        showCloseButton={true}
      >
        <div className="text-center">
          {/* Confetti / Trophy Icon */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#eff4ec] text-[#315b36] shadow-md dark:bg-emerald-950/60 dark:text-emerald-400">
            <Trophy className="h-8 w-8 animate-bounce" />
          </div>

          <Badge variant="indigo" className="mb-2 font-black uppercase tracking-wider">
            Lesson Completed!
          </Badge>

          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            {justCompletedLesson?.title || 'Great Job!'}
          </h3>

          <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            You have successfully completed this lesson and your 7-Skill CEFR progress and attendance record
            have been recorded. The next lesson is now unlocked!
          </p>

          <div className="my-5 rounded-2xl border border-[#e2ebe2] bg-[#f8faf8] p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600 dark:text-slate-300">Course Progress</span>
              <span className="text-[#315b36] dark:text-emerald-400">
                {completedCount} / {totalLessonsCount} Lessons ({progressPercent}%)
              </span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full bg-[#315b36] transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            {nextLesson ? (
              <Button
                variant="gradient"
                size="default"
                onClick={handleContinueToNextLesson}
                className="w-full rounded-xl font-bold shadow-md sm:w-auto"
              >
                <span>Continue to Next Lesson</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Link href="/student/my-courses" className="w-full sm:w-auto">
                <Button
                  variant="gradient"
                  size="default"
                  className="w-full rounded-xl font-bold shadow-md sm:w-auto"
                >
                  <Award className="mr-2 h-4 w-4" />
                  View All Completed Courses
                </Button>
              </Link>
            )}

            <Button
              variant="outline"
              size="default"
              onClick={() => setShowCompletionModal(false)}
              className="w-full rounded-xl text-xs font-semibold sm:w-auto"
            >
              Review Current Lesson
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
