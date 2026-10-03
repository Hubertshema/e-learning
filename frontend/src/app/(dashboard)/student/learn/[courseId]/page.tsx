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
  ChevronUp,
  Eye,
  Download,
  ShieldCheck,
  Mail
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { fastDeepEqual } from '@/lib/cache';
import {
  ResourcePreviewModal,
  ResourceTypeBadge,
  LessonResource,
} from '@/components/resources/resource-preview-modal';
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
  certificate?: any;
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
  const [previewResource, setPreviewResource] = useState<LessonResource | null>(null);

  // Flexible Classroom UI States
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState<'default' | 'wide'>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);
  const [collapsedUnits, setCollapsedUnits] = useState<Record<string, boolean>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [justCompletedLesson, setJustCompletedLesson] = useState<Lesson | null>(null);
  const [showCourseCompletionModal, setShowCourseCompletionModal] = useState(false);
  const [earnedCertificate, setEarnedCertificate] = useState<any>(null);
  const [claimingCert, setClaimingCert] = useState(false);
  const [resendingCertEmail, setResendingCertEmail] = useState(false);
  const [certEmailSentFeedback, setCertEmailSentFeedback] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [lessonToReset, setLessonToReset] = useState<Lesson | null>(null);
  const [resettingLesson, setResettingLesson] = useState(false);
  const [showCongratsLesson, setShowCongratsLesson] = useState<Lesson | null>(null);
  const [showVideoResourcesModal, setShowVideoResourcesModal] = useState(false);
  const autoCompleteTimerRef = useRef<any>(null);
  const autoAdvanceTimerRef = useRef<any>(null);
  const ivAutoAdvancedRef = useRef<string | null>(null); // tracks lessonId that already triggered IV auto-advance

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

  const fetchCourse = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await apiClient.get<CourseLearningData>(`/student/courses/${courseId}`);
      const learningData: CourseLearningData = (res as any)?.data || res;
      if (learningData && learningData.course) {
        if (!silent) {
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
          if (learningData.certificate) {
            setEarnedCertificate(learningData.certificate);
          }
        } else {
          // Silent background auto-sync: only update if data changed structurally
          if (learningData.certificate) {
            setEarnedCertificate(learningData.certificate);
          }
          setData((prev) => {
            if (!prev) return learningData;
            if (fastDeepEqual(prev, learningData)) return prev;
            return learningData;
          });
        }
      }
    } catch (err) {
      if (!silent) console.error('Failed to load course player', err);
    } finally {
      if (!silent) setLoading(false);
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

  // Periodic silent background auto-sync for course curriculum and progress
  useEffect(() => {
    if (!courseId) return;

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      fetchCourse(true);
    }, 30000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchCourse(true);
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
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

  // Auto-complete non-IV lessons when opened (if not already completed)
  useEffect(() => {
    if (!selectedLesson || selectedLesson.type === 'INTERACTIVE_VIDEO') return;
    const alreadyDone = data?.progressRecords?.some(
      (p) => p.lessonId === selectedLesson.id && p.isCompleted
    );
    if (alreadyDone) return;

    // Clear any pending timers from previous lesson
    if (autoCompleteTimerRef.current) clearTimeout(autoCompleteTimerRef.current);
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);

    // Wait 2s (let content render) then auto-complete
    autoCompleteTimerRef.current = setTimeout(async () => {
      try {
        const res = await apiClient.post(`/student/lessons/${selectedLesson.id}/complete`, {
          timeSpentSec: (selectedLesson.estimatedMinutes || 30) * 60,
        });

        // Update local progress
        setData((prev) => {
          if (!prev) return prev;
          const exists = prev.progressRecords?.some((p) => p.lessonId === selectedLesson.id);
          const updatedRecords = exists
            ? prev.progressRecords.map((p) =>
                p.lessonId === selectedLesson.id ? { ...p, isCompleted: true } : p
              )
            : [...(prev.progressRecords || []), { lessonId: selectedLesson.id, isCompleted: true, timeSpentSec: (selectedLesson.estimatedMinutes || 30) * 60 }];
          return { ...prev, progressRecords: updatedRecords };
        });

        setJustCompletedLesson(selectedLesson);
        const completionData: any = res || {};

        if (completionData.courseCompleted) {
          setEarnedCertificate(completionData.certificate);
          setShowCourseCompletionModal(true);
        } else {
          setShowCongratsLesson(selectedLesson);
          // Auto-advance to next lesson after 3s
          autoAdvanceTimerRef.current = setTimeout(() => {
            setShowCongratsLesson(null);
            const allL = (data?.course?.units || []).flatMap((u) => u.lessons || []);
            const idx = allL.findIndex((l) => l.id === selectedLesson.id);
            const next = idx < allL.length - 1 ? allL[idx + 1] : null;
            if (next) {
              setSelectedLesson(next);
              setActiveTab('CONTENT');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }, 3000);
        }
      } catch (err: any) {
        console.error('Auto-complete failed', err);
      }
    }, 500);

    return () => {
      if (autoCompleteTimerRef.current) clearTimeout(autoCompleteTimerRef.current);
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    };
  }, [selectedLesson?.id]);

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

      // Update local interactiveVideoData state immediately reflecting highest reached playtime
      setInteractiveVideoData((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          progress: {
            ...(prev.progress || {}),
            completionPercent: Math.max(prev.progress?.completionPercent || 0, Math.round(percent)),
            watchedSeconds: Math.max(prev.progress?.watchedSeconds || 0, Math.round(watched)),
            lastPositionSeconds: Math.round(position),
          },
        };
      });

      try {
        await apiClient.post(`/student/interactive-videos/lessons/${lessonId}/progress`, {
          lastPositionSeconds: Math.round(position),
          watchedSeconds: Math.round(watched),
          completionPercent: Math.round(percent),
        });

        // When 100% completed, update local progressRecords + auto-advance
        if (percent === 100) {
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
            return { ...prev, progressRecords: updated };
          });

          // Auto-advance to next lesson (only once per lesson)
          if (ivAutoAdvancedRef.current !== lessonId) {
            ivAutoAdvancedRef.current = lessonId;
            try {
              const res: any = await apiClient.post(`/student/lessons/${lessonId}/complete`, {
                timeSpentSec: Math.round(watched),
              });
              const lessons = (data?.course?.units || []).flatMap((u) => u.lessons || []);
              const lesson = lessons.find((l) => l.id === lessonId);
              if (res?.courseCompleted) {
                setEarnedCertificate(res.certificate);
                setShowCourseCompletionModal(true);
              } else if (lesson) {
                setJustCompletedLesson(lesson);
                setShowCongratsLesson(lesson);
                if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
                autoAdvanceTimerRef.current = setTimeout(() => {
                  setShowCongratsLesson(null);
                  const idx = lessons.findIndex((l) => l.id === lessonId);
                  const next = idx < lessons.length - 1 ? lessons[idx + 1] : null;
                  if (next) {
                    setSelectedLesson(next);
                    setActiveTab('CONTENT');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }, 3000);
              }
            } catch (e) {
              console.error('IV lesson complete failed', e);
            }
          }
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

  const allLessonIds = new Set(allLessons.map(l => l.id));
  const completedCount = (data?.progressRecords || []).filter((p) => p.isCompleted && allLessonIds.has(p.lessonId)).length;
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
      const res = await apiClient.post(`/student/lessons/${selectedLesson.id}/complete`, {
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

      const completionData: any = res || {};
      
      if (completionData.courseCompleted) {
        setEarnedCertificate(completionData.certificate);
        setShowCourseCompletionModal(true);
      } else if (andGoToNext && nextLesson) {
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

  const handleOpenCertificateModal = () => {
    setShowCourseCompletionModal(true);
    if (!earnedCertificate) {
      handleClaimCertificate();
    }
  };

  const handleClaimCertificate = async () => {
    // Open modal immediately so student has zero wait time
    setShowCourseCompletionModal(true);
    try {
      setClaimingCert(true);
      setCertEmailSentFeedback(null);
      const res = await apiClient.post<any>(`/student/courses/${courseId}/claim-certificate`);
      const cert = res?.certificate || (res as any)?.data?.certificate || res;
      setEarnedCertificate(cert);
      if (res?.emailSent) {
        setCertEmailSentFeedback(`Official accredited certificate credentials issued and sent to ${res?.recipientEmail || 'your email'}!`);
      } else {
        setCertEmailSentFeedback('Certificate officially issued and recorded in the academic registry!');
      }
    } catch (err: any) {
      console.error('Failed to claim certificate', err);
      setFeedback(err?.message || 'Failed to claim certificate. Please ensure all lessons are completed.');
    } finally {
      setClaimingCert(false);
    }
  };

  const handleResendCertEmail = async (code: string) => {
    try {
      setResendingCertEmail(true);
      await apiClient.post(`/student/certificates/${encodeURIComponent(code)}/resend-email`);
      setCertEmailSentFeedback('Certificate email re-sent successfully to your inbox!');
    } catch (err: any) {
      console.error('Failed to resend certificate email', err);
      setCertEmailSentFeedback(err?.message || 'Failed to resend email. Please try again.');
    } finally {
      setResendingCertEmail(false);
    }
  };

  const navigateToLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setActiveTab('CONTENT');
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmResetLesson = async (reset: boolean) => {
    if (!lessonToReset) return;
    if (reset) {
      try {
        setResettingLesson(true);
        await apiClient.post(`/student/lessons/${lessonToReset.id}/reset`);
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            progressRecords: prev.progressRecords?.filter((p) => p.lessonId !== lessonToReset.id) || [],
          };
        });
        setFeedback(`Progress reset for "${lessonToReset.title}".`);
      } catch (err: any) {
        console.error('Failed to reset lesson', err);
        setFeedback(err.message || 'Failed to reset lesson progress.');
      } finally {
        setResettingLesson(false);
      }
    }
    
    const target = lessonToReset;
    setShowResetModal(false);
    setLessonToReset(null);
    navigateToLesson(target);
  };

  const handleLessonClick = (lesson: Lesson) => {
    const unlocked = isLessonUnlocked(lesson);
    if (!unlocked) {
      const idx = allLessons.findIndex((l) => l.id === lesson.id);
      const prev = idx > 0 ? allLessons[idx - 1] : null;
      setFeedback(`🔒 This lesson is locked. Please complete "${prev?.title || 'the previous lesson'}" first to unlock.`);
      return;
    }
    const isCompleted = data?.progressRecords?.some(p => p.lessonId === lesson.id && p.isCompleted);
    if (isCompleted && lesson.id !== selectedLesson?.id) {
      setLessonToReset(lesson);
      setShowResetModal(true);
      return;
    }
    navigateToLesson(lesson);
  };

  const handleContinueToNextLesson = () => {
    setShowCompletionModal(false);
    if (nextLesson) {
      const isCompleted = data?.progressRecords?.some(p => p.lessonId === nextLesson.id && p.isCompleted);
      if (isCompleted) {
        setLessonToReset(nextLesson);
        setShowResetModal(true);
      } else {
        navigateToLesson(nextLesson);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F3F7FC]/50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#006EF3] border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500">Loading interactive classroom studio...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F7FC]/50 p-4 dark:bg-slate-950">
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
      <div className="flex min-h-screen items-center justify-center bg-[#F3F7FC]/50 p-4 dark:bg-slate-950">
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
            <Link href="/courses">
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

  const sidebarWidthClass = sidebarWidth === 'wide' ? 'w-80 lg:w-[320px]' : 'w-64 lg:w-72';

  return (
    <div className="flex h-[100dvh] flex-col bg-[#F3F7FC]/50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 relative overflow-hidden">
      {/* 1. Full-Screen Classroom Top Navigation Bar */}
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
        {/* Left: Back & Course Title */}
        <div className="flex items-center gap-3">
          <Link href="/student/my-courses">
            <Button
              size="sm"
              variant="outline"
              className="flex h-9 items-center gap-1.5 rounded-xl border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-[#F3F7FC] hover:text-[#006EF3] dark:border-slate-700 dark:text-slate-300"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">My Courses</span>
            </Button>
          </Link>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border-slate-200 text-slate-700 hover:bg-[#F3F7FC] hover:text-[#006EF3] transition-all dark:border-slate-700 dark:text-slate-300"
            title={sidebarOpen ? "Hide Curriculum" : "Show Curriculum"}
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </Button>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

          <div>
            {selectedLesson ? (
              <h1 className="truncate text-sm font-black text-slate-900 dark:text-white sm:text-base">
                {selectedLesson.title}
              </h1>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant="indigo" className="text-[10px] font-bold uppercase tracking-wider">
                    CEFR {data.course.level}
                  </Badge>
                </div>
                <h1 className="truncate text-sm font-black text-slate-900 dark:text-white sm:text-base">
                  {data.course.title}
                </h1>
              </>
            )}
          </div>
        </div>

        {/* Overall Progress Moved to Sidebar */}

        {/* Right: Actions (Syllabus Drawer) */}
        <div className="flex items-center gap-2">

          {/* Syllabus Toggle moved to the left side */}
        </div>
      </header>

      {/* Mobile Drawer Overlay Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity animate-in fade-in"
        />
      )}

      {/* 2. Main Classroom Container */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Column: Flexible & Collapsible Curriculum Syllabus Sidebar */}
        {sidebarOpen && (
          <aside
            className={`fixed inset-y-0 left-0 z-50 lg:static lg:z-20 ${sidebarWidthClass} shrink-0 border-r border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-all duration-300 ease-in-out select-none flex flex-col shadow-xs animate-in slide-in-from-left duration-200`}
          >
            <div className="flex h-full flex-col">
              {/* Sidebar Header with Width Resizer & Close Button */}
              <div className="flex items-center justify-between border-b border-slate-100 p-3.5 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#012970]" />
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
                                    ? 'bg-[#012970] font-bold text-white shadow-md'
                                    : isCompleted
                                    ? 'text-slate-800 hover:bg-[#F3F7FC] hover:text-[#006EF3] dark:text-slate-200 dark:hover:bg-slate-800'
                                    : unlocked
                                    ? 'text-slate-700 hover:bg-[#F3F7FC] hover:text-[#006EF3] dark:text-slate-300 dark:hover:bg-slate-800'
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
                                        isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 text-[#006EF3] dark:bg-blue-950/60'
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

                {/* Sidebar Footer: Lesson Actions & Progress */}
                <div className="mt-6 border-t border-slate-100 pt-6 pb-2 dark:border-slate-800 space-y-3">
                  {selectedLesson && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedLesson.skill && (
                        <Badge variant="indigo" className="text-[9px] font-bold uppercase tracking-wider bg-[#F3F7FC] text-[#012970] border-[#012970]/30 dark:bg-slate-800 dark:text-blue-300">
                          {selectedLesson.skill}
                        </Badge>
                      )}
                      <Badge variant="outline" className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-white dark:bg-slate-900">
                        <Clock className="h-3 w-3" />
                        {selectedLesson.estimatedMinutes || 30} mins
                      </Badge>
                      {isCurrentLessonCompleted && (
                        <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#012970] dark:bg-blue-950 dark:text-blue-300">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed
                        </span>
                      )}
                    </div>
                    {selectedLesson.type === 'INTERACTIVE_VIDEO' && interactiveVideoData && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                          <span>Video Progress</span>
                          <span className="text-[#012970] dark:text-[#006EF3]">{Math.round(interactiveVideoData.progress?.completionPercent || 0)}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                          <div
                            className="h-full bg-gradient-to-r from-[#006EF3] to-[#012970] transition-all duration-300"
                            style={{ width: `${interactiveVideoData.progress?.completionPercent || 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {selectedLesson.type === 'INTERACTIVE_VIDEO' && interactiveVideoData?.resources && interactiveVideoData.resources.length > 0 && (
                      <div className="rounded-2xl border border-blue-200/80 dark:border-blue-900/50 bg-[#F3F7FC]/70 dark:bg-blue-950/20 p-2.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#012970] dark:text-blue-300">
                            <FileText className="h-3.5 w-3.5 text-[#006EF3]" />
                            <span>PDF Resources ({interactiveVideoData.resources.length})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowVideoResourcesModal(true)}
                            className="text-[10px] font-semibold text-[#006EF3] hover:underline cursor-pointer"
                          >
                            Expand
                          </button>
                        </div>
                        <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar pr-0.5">
                          {interactiveVideoData.resources.map((res: LessonResource) => (
                            <div
                              key={res.id}
                              className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-[11px]"
                            >
                              <div className="truncate flex-1 mr-1.5" title={res.title}>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">{res.title}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setPreviewResource(res)}
                                  className="p-1 rounded text-slate-500 hover:text-[#006EF3] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Preview PDF"
                                >
                                  <Eye className="h-3 w-3" />
                                </button>
                                {res.canDownload && (
                                  <a
                                    href={res.url}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 rounded text-slate-500 hover:text-[#006EF3] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    title="Download PDF"
                                  >
                                    <Download className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="space-y-2">
                  {totalLessonsCount > 0 && completedCount === totalLessonsCount && (
                    <Button
                      size="sm"
                      disabled={claimingCert}
                      onClick={handleOpenCertificateModal}
                      className="w-full flex h-8 items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-[#012970] hover:from-amber-600 hover:to-[#006EF3] text-white text-xs font-bold gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Award className="h-3.5 w-3.5" />
                      <span>{earnedCertificate ? 'View Certificate' : 'Claim Certificate'}</span>
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={toggleFullscreen}
                    className="w-full flex h-8 items-center justify-center rounded-xl border-slate-200 text-xs text-slate-700 hover:bg-[#F3F7FC] hover:text-[#006EF3] dark:border-slate-700 dark:text-slate-300"
                  >
                    {isFullscreen ? <Minimize2 className="mr-1.5 h-3.5 w-3.5" /> : <Maximize2 className="mr-1.5 h-3.5 w-3.5" />}
                    {isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
                  </Button>

                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Right Main Content Area - Expands to 100% when sidebar is closed */}
        <main className={`flex-1 ${selectedLesson?.type === 'INTERACTIVE_VIDEO' ? 'overflow-y-auto lg:overflow-hidden p-2 sm:p-3 lg:p-4' : 'overflow-y-auto p-4 sm:p-6 lg:p-8'} min-w-0 transition-all duration-300`}>
          <div className={`mx-auto w-full ${selectedLesson?.type === 'INTERACTIVE_VIDEO' ? 'max-w-[1650px] h-full flex flex-col justify-start space-y-2' : 'max-w-[1600px] space-y-6'}`}>
            {/* The congratulations overlay is now rendered over the lesson content below */}
            {/* General feedback banner - Responsive */}
            {feedback && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 rounded-2xl border border-blue-200 bg-[#F3F7FC] p-3 text-xs font-semibold text-[#012970] shadow-sm animate-in fade-in dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200 w-full">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <CheckCircle2 className="h-4 w-4 text-[#006EF3] shrink-0" />
                  <span className="break-words leading-relaxed">{feedback}</span>
                </div>
                <button onClick={() => setFeedback(null)} className="text-[11px] underline text-[#006EF3] hover:text-[#012970] font-semibold cursor-pointer shrink-0 self-end sm:self-auto">
                  Dismiss
                </button>
              </div>
            )}

            {/* Course Completed Certificate Banner - Responsive on PC & Mobile */}
            {totalLessonsCount > 0 && completedCount === totalLessonsCount && (
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 rounded-2xl border-2 border-amber-300 dark:border-amber-500/40 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-100/70 dark:from-amber-950/40 dark:via-yellow-950/20 dark:to-slate-900 p-3.5 sm:p-4 text-slate-900 dark:text-white shadow-md animate-in fade-in w-full">
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md ring-4 ring-amber-200 dark:ring-amber-900/40">
                    <Award className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-900/50 px-2 py-0.5 rounded-full shrink-0">
                        Curriculum Completed 100%
                      </span>
                      {earnedCertificate && (
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Certificate Ready
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-1 break-words">
                      {earnedCertificate
                        ? `Congratulations! Your official CEFR Certificate has been issued and emailed.`
                        : `Congratulations! You completed all lessons. Claim your official CEFR Certificate now.`}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                  <Button
                    size="sm"
                    disabled={claimingCert}
                    onClick={handleOpenCertificateModal}
                    className="w-full md:w-auto h-9 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-[#012970] hover:from-amber-600 hover:to-[#006EF3] text-white font-bold text-xs shadow-md gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    {claimingCert ? (
                      <>
                        <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Claiming & Emailing...</span>
                      </>
                    ) : (
                      <>
                        <Award className="h-4 w-4" />
                        <span>{earnedCertificate ? 'View & Download Certificate' : 'Claim Certificate'}</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {selectedLesson ? (
              <div className="relative">
                {showCongratsLesson && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm rounded-2xl animate-in fade-in duration-500 m-1">
                    <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/30 dark:border-emerald-500/20 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center transform scale-100 animate-in zoom-in-95">
                      <div className="mx-auto w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mb-5 ring-8 ring-emerald-50 dark:ring-emerald-900/20">
                        <Trophy className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Lesson Completed!</h2>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-8">
                        Great job! You've finished <strong>&quot;{showCongratsLesson.title}&quot;</strong>.
                      </p>
                      
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center justify-center gap-2.5 text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-5 py-2.5 rounded-full">
                          <div className="w-4 h-4 rounded-full border-2 border-emerald-600 dark:border-emerald-400 border-t-transparent animate-spin" />
                          Moving to next lesson in 3 seconds...
                        </div>
                        <button
                          onClick={() => {
                            if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
                            setShowCongratsLesson(null);
                          }}
                          className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2 transition-colors mt-2 cursor-pointer"
                        >
                          Stay on this lesson
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Lesson Body: Interactive Video OR Theory + Drills */}
                {selectedLesson.type === 'INTERACTIVE_VIDEO' ? (
                  loadingInteractive ? (
                    <Card className="p-16 text-center text-slate-500">
                      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#006EF3] border-t-transparent" />
                      <p className="text-xs font-semibold">Loading interactive video studio...</p>
                    </Card>
                  ) : interactiveVideoData ? (
                    <div className="w-full h-full flex flex-col justify-start">
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
                        layoutMode="student-hub"
                        navigationMode={interactiveVideoData.navigationMode}
                        isLessonCompleted={!!data.progressRecords?.some((p) => p.lessonId === selectedLesson.id && p.isCompleted)}
                        onProgress={(position, watched, percent) => {
                          handleVideoProgressUpdate(selectedLesson.id, position, watched, percent);
                        }}
                      />
                    </div>
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
                            ? 'border-[#006EF3] text-[#012970] dark:text-[#006EF3]'
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
                            ? 'border-[#006EF3] text-[#012970] dark:text-[#006EF3]'
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
                                    <FileText className="h-4 w-4 text-[#012970]" />
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
                        <Button size="default" variant="outline" disabled className="rounded-xl text-xs font-bold opacity-60">
                          <Lock className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                          Next lesson locked
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
              </div>
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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F3F7FC] text-[#012970] shadow-md dark:bg-slate-800 dark:text-blue-400">
            <Trophy className="h-8 w-8 animate-bounce text-[#F5B400]" />
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

          <div className="my-5 rounded-2xl border border-slate-200 bg-[#F3F7FC]/50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600 dark:text-slate-300">Course Progress</span>
              <span className="text-[#012970] dark:text-[#006EF3]">
                {completedCount} / {totalLessonsCount} Lessons ({progressPercent}%)
              </span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full bg-[#006EF3] transition-all duration-500 ease-out"
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

      {/* Course Completion & Congratulatory Certificate Modal */}
      {/* Course Completion & Congratulatory Certificate Modal */}
      <Modal
        isOpen={showCourseCompletionModal}
        onClose={() => setShowCourseCompletionModal(false)}
        title="Official CEFR Certificate"
        size="lg"
        className="w-full sm:max-w-xl md:max-w-2xl"
      >
        <div className="py-2 sm:py-3 text-center flex flex-col items-center w-full max-w-xl mx-auto">
          {/* Radiant Celebration Emblem */}
          <div className="relative mb-3 sm:mb-4">
            <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-emerald-400/30 to-green-300/30 blur-md animate-pulse" />
            <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-emerald-500 to-green-400 text-white flex items-center justify-center shadow-lg ring-4 sm:ring-8 ring-emerald-100 dark:ring-emerald-950/60">
              <Award className="h-8 w-8 sm:h-10 sm:w-10 text-white stroke-[2.2]" />
            </div>
          </div>

          <div className="space-y-1 mb-3.5 w-full">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
              <Sparkles className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              CEFR Graduation Unlocked
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Congratulations!
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
              You have successfully completed 100% of the lessons and checkpoints in{' '}
              <strong className="text-slate-900 dark:text-white">{data?.course?.title}</strong>.
            </p>
          </div>

          {/* Certificate Showcase Card */}
          {earnedCertificate ? (
            <div className="w-full mb-3.5 rounded-2xl border-2 border-emerald-300/80 dark:border-emerald-700/60 bg-gradient-to-b from-emerald-50/80 via-white to-emerald-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-3 sm:p-4 text-left shadow-md">
              <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-emerald-200/60 dark:border-slate-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                    <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider truncate">
                      Accredited Certificate
                    </h4>
                    <p className="text-[11px] sm:text-xs font-mono font-bold text-[#006EF3] dark:text-blue-400 truncate">
                      {earnedCertificate.certificateCode}
                    </p>
                  </div>
                </div>
                <Badge variant="indigo" className="text-[10px] font-bold uppercase shrink-0">
                  {earnedCertificate.levelCompleted || data?.course?.level || 'CEFR'}
                </Badge>
              </div>

              {/* Direct Email Confirmation Box - Responsive on PC & Mobile */}
              <div className="mt-2.5 p-2.5 sm:p-3 rounded-xl bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 flex items-start sm:items-center gap-2.5 w-full">
                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-[#006EF3] shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="space-y-0.5 flex-1 min-w-0 text-left">
                  <p className="font-bold text-[11px] sm:text-xs text-blue-950 dark:text-blue-100">
                    Directly Sent to Your Email
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed break-words">
                    Your official accredited certificate credentials and graduation verification link have been dispatched directly to your registered student email address.
                  </p>
                </div>
              </div>

              {certEmailSentFeedback && (
                <div className="mt-2 text-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                  ✓ {certEmailSentFeedback}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full mb-3.5 p-3.5 sm:p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                Click below to claim your certificate and have it generated and sent directly to your email.
              </p>
              <Button
                size="sm"
                disabled={claimingCert}
                onClick={handleClaimCertificate}
                className="w-full sm:w-auto min-w-[200px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-8.5 rounded-lg text-xs shadow-xs mx-auto cursor-pointer"
              >
                {claimingCert ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Claiming & Emailing...
                  </span>
                ) : (
                  'Claim Certificate Now'
                )}
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="w-full flex flex-wrap items-center justify-center gap-2 pt-1">
            {earnedCertificate && (
              <>
                <Link href="/student/certificates" onClick={() => setShowCourseCompletionModal(false)} className="w-full sm:w-auto inline-flex">
                  <Button size="sm" className="w-full sm:w-auto h-8 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95">
                    <Award className="h-3.5 w-3.5" />
                    <span>View in My Certificates</span>
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={resendingCertEmail}
                  onClick={() => earnedCertificate?.certificateCode && handleResendCertEmail(earnedCertificate.certificateCode)}
                  className="w-full sm:w-auto h-8 px-3 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold rounded-lg gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <Mail className="h-3.5 w-3.5 text-[#006EF3]" />
                  <span>{resendingCertEmail ? 'Sending...' : 'Resend to Email'}</span>
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCourseCompletionModal(false)}
              className="w-full sm:w-auto h-8 px-3 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-all"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reset Lesson Modal */}
      <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)} title="Revisit Completed Lesson">
        <div className="py-6 px-2 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <CheckCircle2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Lesson Already Completed</h3>
          <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
            You have already completed <strong>&quot;{lessonToReset?.title}&quot;</strong>. <br/><br/>
            Do you want to reset your progress and study it again, or just review it without resetting?
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              variant="outline"
              disabled={resettingLesson}
              onClick={() => confirmResetLesson(false)}
            >
              Just Review
            </Button>
            <Button
              variant="gradient"
              disabled={resettingLesson}
              onClick={() => confirmResetLesson(true)}
            >
              {resettingLesson ? 'Resetting...' : 'Reset & Study Again'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Interactive Video PDF Resources Modal */}
      {showVideoResourcesModal && interactiveVideoData?.resources && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#F3F7FC] dark:bg-blue-950/50 text-[#006EF3] border border-blue-200 dark:border-blue-800">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Lesson PDF Resources ({interactiveVideoData.resources.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Handouts, worksheets, and reference PDF materials for this lesson.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVideoResourcesModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-3 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {interactiveVideoData.resources.map((res: LessonResource) => {
                  const canDownload = Boolean(res.canDownload);
                  return (
                    <div
                      key={res.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-white dark:hover:bg-slate-900 hover:border-[#006EF3] dark:hover:border-blue-500 transition-all flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <ResourceTypeBadge
                            resource={res}
                            onClick={() => {
                              setShowVideoResourcesModal(false);
                              setPreviewResource(res);
                            }}
                            className="hover:scale-105 active:scale-95 transition-transform"
                          />
                          {canDownload ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#006EF3] dark:text-blue-400">
                              <CheckCircle2 className="h-3 w-3" /> Downloadable
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                              <Lock className="h-3 w-3" /> View Only
                            </span>
                          )}
                        </div>
                        <div>
                          <h4
                            className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 cursor-pointer hover:text-[#006EF3] dark:hover:text-blue-400 transition-colors"
                            onClick={() => {
                              setShowVideoResourcesModal(false);
                              setPreviewResource(res);
                            }}
                            title={res.title}
                          >
                            {res.title}
                          </h4>
                          {res.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                              {res.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-7 text-xs font-semibold gap-1 hover:border-[#006EF3] hover:text-[#006EF3] dark:hover:text-blue-400"
                          onClick={() => {
                            setShowVideoResourcesModal(false);
                            setPreviewResource(res);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Preview PDF
                        </Button>
                        {canDownload && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2.5 text-xs font-semibold gap-1 text-[#012970] hover:bg-[#F3F7FC] dark:text-blue-400 dark:hover:bg-slate-800"
                            onClick={() => {
                              const a = document.createElement('a');
                              a.href = res.url;
                              a.download = res.title ? `${res.title}.pdf` : 'download.pdf';
                              a.target = '_blank';
                              a.rel = 'noopener noreferrer';
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                            }}
                            title="Download PDF document"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Save</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-App Resource Preview Modal */}
      <ResourcePreviewModal
        resource={previewResource}
        isOpen={Boolean(previewResource)}
        onClose={() => setPreviewResource(null)}
        isTeacher={false}
      />
    </div>
  );
}
