'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  CheckCircle2,
  Check,
  Clock,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Lock,
  Unlock,
  AlertTriangle,
  ShieldAlert,
  Maximize2,
  Minimize2,
  X,
  FileText,
} from 'lucide-react';
import { UniversalVideo, UniversalVideoHandle, getYouTubeId } from './universal-video';

// Mobile drag-and-drop is handled natively by modern browsers

export type VideoActivity = {
  id: string;
  timestampSeconds: number;
  type: string;
  title: string;
  instructions?: string;
  content: any;
  points: number;
  required: boolean;
  explanation?: string;
  feedback?: string;
  allowRetry?: boolean;
};

export function formatVideoTime(seconds: number) {
  const value = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}

function ResumeBanner({
  position,
  onResume,
  onStartOver,
  onMount,
}: {
  position: number;
  onResume: () => void;
  onStartOver: () => void;
  onMount: () => void;
}) {
  useEffect(() => {
    onMount();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 px-4 py-3 text-xs text-teal-950 dark:text-teal-200 shadow-xs animate-in fade-in">
      <div className="flex items-center gap-2.5">
        <Clock className="h-4 w-4 text-teal-600 shrink-0" />
        <span>
          Resume where you stopped at <strong>{formatVideoTime(position)}</strong>?
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          onClick={onResume}
          className="h-7 text-xs bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg px-3"
        >
          Resume at {formatVideoTime(position)}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onStartOver}
          className="h-7 text-xs border-teal-200 dark:border-teal-800 text-slate-600 dark:text-slate-400 rounded-lg px-2.5"
        >
          Start from 0:00
        </Button>
      </div>
    </div>
  );
}

export function InteractiveVideoPlayer({
  lessonId,
  videoUrl,
  durationSeconds,
  activities = [],
  transcript = [],
  captions = [],
  initialPosition = 0,
  initialWatched = 0,
  navigationMode = 'FREE',
  isTeacher = false,
  layoutMode = 'default',
  completedActivityIds = [],
  isLessonCompleted = false,
  onProgress,
  onEnded,
}: {
  lessonId: string;
  videoUrl: string;
  durationSeconds?: number;
  activities?: VideoActivity[];
  transcript?: Array<{ time: number; text: string }>;
  captions?: Array<{ time: number; text: string }>;
  initialPosition?: number;
  initialWatched?: number;
  navigationMode?: string;
  isTeacher?: boolean;
  layoutMode?: 'default' | 'student-hub';
  completedActivityIds?: string[];
  isLessonCompleted?: boolean;
  onProgress?: (position: number, watched: number, percent: number) => void;
  onEnded?: () => void;
}) {
  // Check localStorage for saved position if initialPosition is 0
  const savedLocalPos = useMemo(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const val = Number(localStorage.getItem(`iv_pos_${lessonId}`));
      return val && val > 0 ? val : 0;
    } catch {
      return 0;
    }
  }, [lessonId]);

  const effectiveInitialPosition = initialPosition && initialPosition > 0 ? initialPosition : savedLocalPos;
  const [showResumeBanner, setShowResumeBanner] = useState(effectiveInitialPosition > 5);
  const resumeBannerTimerRef = useRef<any>(null);
  const [showLessonCompletedPrompt, setShowLessonCompletedPrompt] = useState(isLessonCompleted && !isTeacher);
  const [showManualResetPrompt, setShowManualResetPrompt] = useState(false);

  const videoRef = useRef<UniversalVideoHandle>(null);
  const watchedRef = useRef(Math.max(initialWatched, effectiveInitialPosition));
  const lastTimeRef = useRef(effectiveInitialPosition);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(effectiveInitialPosition);
  const [detectedDuration, setDetectedDuration] = useState(durationSeconds || 0);
  const [watched, setWatched] = useState(Math.max(initialWatched, effectiveInitialPosition));

  // Loop & recursion prevention refs
  const isTriggeringCheckpointRef = useRef(false);
  const recentlyTriggeredCheckpointRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (position > 0 && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`iv_pos_${lessonId}`, String(Math.floor(position)));
      } catch {}
    }
  }, [position, lessonId]);

  const activitiesRef = useRef<VideoActivity[]>(activities || []);
  activitiesRef.current = activities || [];

  const [active, setActive] = useState<VideoActivity | null>(null);
  const activeRef = useRef<VideoActivity | null>(null);

  const initialCompletedMap = useMemo(() => {
    const init: Record<string, boolean> = {};
    (completedActivityIds || []).forEach((id) => {
      init[id] = true;
    });
    return init;
  }, [completedActivityIds]);

  const [completed, setCompleted] = useState<Record<string, boolean>>(initialCompletedMap);
  const completedRef = useRef<Record<string, boolean>>(initialCompletedMap);

  useEffect(() => {
    if (completedActivityIds && completedActivityIds.length > 0) {
      completedActivityIds.forEach((id) => {
        completedRef.current[id] = true;
      });
      setCompleted((prev) => {
        const next = { ...prev };
        completedActivityIds.forEach((id) => {
          next[id] = true;
        });
        return next;
      });
    }
  }, [completedActivityIds]);

  const [answer, setAnswer] = useState<any>('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [speed, setSpeed] = useState(1);
  const [allowFreeSeek, setAllowFreeSeek] = useState(false);
  const [isCompact, setIsCompact] = useState(true);
  const [restrictionNotice, setRestrictionNotice] = useState<string | null>(null);
  const noticeTimeoutRef = useRef<any>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleMute = () => {
    if (isMuted) {
      videoRef.current?.unMute?.();
      setIsMuted(false);
    } else {
      videoRef.current?.mute?.();
      setIsMuted(true);
    }
  };

  const speeds = [0.75, 1, 1.25, 1.5];
  const cycleSpeed = () => {
    const currentIdx = speeds.indexOf(speed);
    const nextSpeed = speeds[(currentIdx + 1) % speeds.length];
    setSpeed(nextSpeed);
    videoRef.current?.setPlaybackRate?.(nextSpeed);
  };

  const startVoiceInput = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showNotice('🎙️ Speech recognition not supported in this browser. Please tap an option.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const spoken = event.results?.[0]?.[0]?.transcript?.trim()?.toLowerCase() || '';
        setIsListening(false);

        if (active?.content?.options) {
          const options = active.content.options.map((opt: any) =>
            typeof opt === 'string' ? opt : opt.text || ''
          );

          let matchedOption: string | null = null;
          if (spoken.includes('option a') || spoken === 'a' || spoken.startsWith('a ')) {
            matchedOption = options[0];
          } else if (spoken.includes('option b') || spoken === 'b' || spoken.startsWith('b ')) {
            matchedOption = options[1];
          } else if (spoken.includes('option c') || spoken === 'c' || spoken.startsWith('c ')) {
            matchedOption = options[2];
          } else if (spoken.includes('option d') || spoken === 'd' || spoken.startsWith('d ')) {
            matchedOption = options[3];
          } else {
            const match = options.find((opt: string) =>
              spoken.includes(opt.toLowerCase()) || opt.toLowerCase().includes(spoken)
            );
            if (match) matchedOption = match;
          }

          if (matchedOption) {
            setAnswer(matchedOption);
            showNotice(`🎙️ Heard: "${spoken}"`);
          } else {
            showNotice(`🎙️ Heard: "${spoken}". Please select your choice.`);
          }
        } else {
          setAnswer(spoken);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      try {
        recognitionRef.current?.abort();
      } catch {}
      setIsListening(false);
    } else {
      startVoiceInput();
    }
  };

  const [autoResumeSeconds, setAutoResumeSeconds] = useState<number | null>(null);
  const autoResumeTimerRef = useRef<any>(null);

  const clearAutoResume = () => {
    if (autoResumeTimerRef.current) {
      clearInterval(autoResumeTimerRef.current);
      autoResumeTimerRef.current = null;
    }
    setAutoResumeSeconds(null);
  };

  useEffect(() => {
    return () => {
      clearAutoResume();
      if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current);
      if (resumeBannerTimerRef.current) clearTimeout(resumeBannerTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const maxActivityTime = useMemo(() => {
    if (!activities || activities.length === 0) return 0;
    return Math.max(...activities.map((a) => a.timestampSeconds || 0));
  }, [activities]);

  const totalDuration =
    durationSeconds && durationSeconds > 0
      ? durationSeconds
      : detectedDuration > 0
      ? detectedDuration
      : Math.max(maxActivityTime + 10, 45);
  const isYouTube = !!getYouTubeId(videoUrl);

  // Synchronous barrier helper: always relies on completedRef
  const getDynamicBarrier = () => {
    const uncompleted = (activitiesRef.current || [])
      .filter((a) => a.required !== false && !completedRef.current[a.id])
      .sort((a, b) => a.timestampSeconds - b.timestampSeconds);
    return uncompleted[0]
      ? uncompleted[0].timestampSeconds
      : (totalDuration > 0 ? totalDuration : 999999);
  };

  // Determine earliest uncompleted required checkpoint barrier for scrubber UI
  const earliestUncompletedCheckpoint = (activities || [])
    .filter((a) => a.required !== false && !completed[a.id])
    .sort((a, b) => a.timestampSeconds - b.timestampSeconds)[0];

  const checkpointBarrier = earliestUncompletedCheckpoint
    ? earliestUncompletedCheckpoint.timestampSeconds
    : (totalDuration > 0 ? totalDuration : 999999);

  // Maximum timestamp the student is currently permitted to seek or play up to
  const maxAllowedTime = allowFreeSeek
    ? (totalDuration > 0 ? totalDuration : 999999)
    : Math.min(Math.max(watched, position), checkpointBarrier);

  const nextUpcomingCheckpoint = useMemo(() => {
    return (activities || [])
      .filter((a) => !completed[a.id])
      .sort((a, b) => a.timestampSeconds - b.timestampSeconds)[0];
  }, [activities, completed]);

  const activeCheckpointIndex = useMemo(() => {
    if (!active) return -1;
    return (activities || []).findIndex((a) => a.id === active.id);
  }, [active, activities]);

  const currentTranscriptLine = useMemo(() => {
    if (!transcript || transcript.length === 0) return null;
    return (
      [...transcript]
        .reverse()
        .find((line) => line.time <= position + 0.5) || transcript[0]
    );
  }, [transcript, position]);

  const showNotice = (msg: string) => {
    setRestrictionNotice(msg);
    if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current);
    noticeTimeoutRef.current = setTimeout(() => {
      setRestrictionNotice(null);
    }, 3500);
  };

  const openCheckpoint = (item: VideoActivity) => {
    if (isTriggeringCheckpointRef.current && activeRef.current?.id === item.id) return;
    isTriggeringCheckpointRef.current = true;

    clearAutoResume();
    recentlyTriggeredCheckpointRef.current[item.id] = Date.now();

    activeRef.current = item;
    setActive(item);
    setShowHint(false);

    // Stop playback immediately
    videoRef.current?.pause();
    setPlaying(false);

    const targetTime = Number(item.timestampSeconds || 0);
    videoRef.current?.seekTo(targetTime);
    lastTimeRef.current = targetTime;
    setPosition(targetTime);

    if (completedRef.current[item.id]) {
      setFeedback({
        isCorrect: true,
        feedback: '✓ Checkpoint completed! You can review your response or continue the video.',
        correctAnswer: item.content?.correctAnswer,
        explanation: item.explanation,
      });
    } else {
      setFeedback(null);
      setAnswer(item.type === 'MULTIPLE_SELECT' ? [] : '');
    }

    if (window.innerWidth < 1024) {
      setTimeout(() => {
        document.getElementById('interactive-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }

    setTimeout(() => {
      isTriggeringCheckpointRef.current = false;
    }, 400);
  };

  const handleTimeUpdate = (current: number) => {
    // 0. If an active required checkpoint is pending submission, enforce pause
    if (
      activeRef.current &&
      activeRef.current.required !== false &&
      !completedRef.current[activeRef.current.id]
    ) {
      videoRef.current?.pause();
      setPlaying(false);
      return;
    }

    const prevTime = lastTimeRef.current;
    const delta = current - prevTime;
    const dynamicBarrier = getDynamicBarrier();

    // 1. Guard against external or unauthorized sudden forward jumps (> 3s without seek())
    if (!allowFreeSeek && delta > 3.0) {
      const safeTarget = Math.max(0, watchedRef.current);
      videoRef.current?.pause();
      setPlaying(false);
      videoRef.current?.seekTo(safeTarget);
      lastTimeRef.current = safeTarget;
      setPosition(safeTarget);
      showNotice('🔒 Fast-forwarding is restricted. Playback snapped back to your current position.');
      return;
    }

    // 2. Barrier Check: If playback reached or is crossing the earliest uncompleted required checkpoint
    if (!allowFreeSeek && dynamicBarrier < 999999 && current >= dynamicBarrier - 0.2) {
      const barrierCheckpoint = (activitiesRef.current || []).find(
        (a) =>
          a.required !== false &&
          !completedRef.current[a.id] &&
          Number(a.timestampSeconds || 0) <= dynamicBarrier + 0.5
      );
      if (barrierCheckpoint) {
        openCheckpoint(barrierCheckpoint);
        return;
      }
    }

    // 3. Normal playback progress: advance watched position smoothly
    if (current > watchedRef.current) {
      watchedRef.current = current;
      setWatched(current);
    }

    lastTimeRef.current = current;
    setPosition(current);

    // 4. Trigger uncompleted checkpoints when playback crosses or is within threshold of their timestamp
    const reachedCheckpoint = (activitiesRef.current || []).find((item) => {
      const itemTime = Number(item.timestampSeconds || 0);
      if (completedRef.current[item.id]) return false;
      if (activeRef.current && activeRef.current.id === item.id) return false;

      // Skip only if this exact checkpoint was triggered within the last 1.8s
      const recently = recentlyTriggeredCheckpointRef.current[item.id];
      if (recently && Date.now() - recently < 1800) return false;

      // Has playback reached or crossed this checkpoint?
      const crossed = (prevTime <= itemTime + 0.1 && current >= itemTime);
      const inRange = Math.abs(current - itemTime) <= 0.4;
      const jumpedPast = !allowFreeSeek && current > itemTime;

      return crossed || inRange || jumpedPast;
    });

    if (reachedCheckpoint) {
      openCheckpoint(reachedCheckpoint);
      return;
    }

    // Report curriculum progress to parent using highest reached playtime as numerator
    const highestReachedPlaytime = Math.max(watchedRef.current || 0, current || 0);
    const totalActs = (activitiesRef.current || []).length;
    const nowCompletedActs = Object.keys(completedRef.current).filter(
      (k) => completedRef.current[k]
    ).length;
    const checkPct = totalActs > 0 ? (nowCompletedActs / totalActs) * 50 : 0;
    const watchPct = totalDuration > 0 ? Math.min(50, (highestReachedPlaytime / totalDuration) * 50) : 0;
    const progressPercent = totalActs > 0
      ? Math.min(100, Math.round(checkPct + watchPct))
      : (totalDuration > 0 ? Math.min(100, Math.round((highestReachedPlaytime / totalDuration) * 100)) : 0);

    // Prevent auto-advance (reaching >= 90%) if there is an active checkpoint blocking the user
    const finalPercent = activeRef.current ? Math.min(89, progressPercent) : progressPercent;

    onProgress?.(
      current,
      highestReachedPlaytime,
      finalPercent
    );
  };

  const seek = (targetTime: number) => {
    if (
      activeRef.current &&
      activeRef.current.required !== false &&
      !completedRef.current[activeRef.current.id]
    ) {
      showNotice('🔒 Checkpoint reached: Please submit your answer to unlock the timeline.');
      return;
    }

    const clampedTarget = Math.max(0, targetTime);
    const dynamicBarrier = getDynamicBarrier();
    const maxSeekable = allowFreeSeek
      ? (totalDuration > 0 ? totalDuration : 999999)
      : Math.min(watchedRef.current, dynamicBarrier);

    if (!allowFreeSeek && clampedTarget > maxSeekable + 0.5) {
      const nextUncompleted = (activitiesRef.current || []).find(
        (a) => a.required !== false && !completedRef.current[a.id]
      );
      if (nextUncompleted && clampedTarget >= nextUncompleted.timestampSeconds) {
        showNotice(
          `🔒 Forward jump locked. Complete checkpoint at ${formatVideoTime(
            nextUncompleted.timestampSeconds
          )} first.`
        );
      } else {
        showNotice('🔒 Skipping ahead is restricted. Please watch the video sequentially.');
      }
      const safeTarget = Math.max(0, maxSeekable);
      videoRef.current?.seekTo(safeTarget);
      lastTimeRef.current = safeTarget;
      setPosition(safeTarget);
      return;
    }

    videoRef.current?.seekTo(clampedTarget);
    lastTimeRef.current = clampedTarget;
    setPosition(clampedTarget);
  };

  const togglePlay = () => {
    if (
      activeRef.current &&
      activeRef.current.required !== false &&
      !completedRef.current[activeRef.current.id]
    ) {
      showNotice('⚠️ Checkpoint required: Please submit your answer before continuing.');
      return;
    }
    if (playing) {
      videoRef.current?.pause();
      setPlaying(false);
    } else {
      videoRef.current?.play();
      setPlaying(true);
    }
  };

  const rewind10 = () => {
    seek(Math.max(0, position - 10));
  };

  // Keyboard shortcut restrictions (intercept ArrowRight, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.key === 'ArrowRight' || e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        if (allowFreeSeek) {
          seek(position + 5);
        } else {
          showNotice('🔒 Skipping forward is disabled.');
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        seek(Math.max(0, position - 5));
      } else if (e.key === ' ' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [position, playing, allowFreeSeek]);

  const submit = async (overrideAnswer?: any) => {
    if (!active || submitting) return;
    try {
      setSubmitting(true);
      const valToSubmit = overrideAnswer !== undefined ? overrideAnswer : answer;
      const finalAnswer =
        active.type === 'DRAG_DROP' && Array.isArray(valToSubmit)
          ? valToSubmit.join(' ')
          : valToSubmit;
      const result: any = await apiClient.post(
        `/student/interactive-videos/activities/${active.id}/attempts`,
        { answer: finalAnswer }
      );
      setFeedback(result);
      if (result.isCorrect || active.allowRetry === false) {
        completedRef.current[active.id] = true;
        setCompleted((v) => ({ ...v, [active.id]: true }));

        // Update progress immediately using highest reached playtime as numerator
        const highestReachedPlaytime = Math.max(watchedRef.current || 0, position || 0);
        const totalActs = (activitiesRef.current || []).length;
        const nowCompletedActs = Object.keys(completedRef.current).filter(
          (k) => completedRef.current[k]
        ).length;
        const checkPct = totalActs > 0 ? (nowCompletedActs / totalActs) * 50 : 0;
        const watchPct = totalDuration > 0 ? Math.min(50, (highestReachedPlaytime / totalDuration) * 50) : 0;
        const calculatedPercent = Math.min(100, Math.round(checkPct + watchPct));
        // Prevent auto-advance if somehow another checkpoint is instantly active
        const finalPercent = activeRef.current ? Math.min(89, calculatedPercent) : calculatedPercent;
        onProgress?.(position, highestReachedPlaytime, finalPercent);

        // Gentle auto-resume timer giving student time to review response
        clearAutoResume();
        let secondsLeft = 1;
        setAutoResumeSeconds(secondsLeft);
        autoResumeTimerRef.current = setInterval(() => {
          secondsLeft -= 1;
          if (secondsLeft <= 0) {
            clearAutoResume();
            continueVideo();
          } else {
            setAutoResumeSeconds(secondsLeft);
          }
        }, 1000);
      }
    } catch (error: any) {
      setFeedback({ feedback: error.message || 'Could not submit your answer.' });
    } finally {
      setSubmitting(false);
    }
  };

  const continueVideo = () => {
    clearAutoResume();
    const currentActive = activeRef.current || active;
    if (currentActive) {
      completedRef.current[currentActive.id] = true;
      setCompleted((v) => ({ ...v, [currentActive.id]: true }));
      recentlyTriggeredCheckpointRef.current[currentActive.id] = Date.now();
    }
    activeRef.current = null;
    setActive(null);
    setFeedback(null);

    // Smoothly resume playback +0.4s forward to clear checkpoint trigger zone and eliminate loop
    const safeResumeTime = currentActive ? Number(currentActive.timestampSeconds || 0) + 0.4 : position + 0.1;
    lastTimeRef.current = safeResumeTime;
    setPosition(safeResumeTime);
    watchedRef.current = Math.max(watchedRef.current, safeResumeTime);
    setWatched(watchedRef.current);
    videoRef.current?.seekTo(safeResumeTime);
    videoRef.current?.play();
    setPlaying(true);
  };

  const handleResetLesson = async () => {
    try {
      await apiClient.post(`/student/interactive-videos/lessons/${lessonId}/reset`);
      
      // Reset local state without refreshing the page
      setCompleted({});
      completedRef.current = {};
      setWatched(0);
      watchedRef.current = 0;
      setPosition(0);
      lastTimeRef.current = 0;
      setActive(null);
      activeRef.current = null;
      setAnswer('');
      setFeedback(null);
      recentlyTriggeredCheckpointRef.current = {};
      
      try {
        localStorage.removeItem(`iv_pos_${lessonId}`);
      } catch {}

      // Reset the video player
      videoRef.current?.seekTo(0);
      videoRef.current?.pause();
      setPlaying(false);

      // Notify parent of reset
      onProgress?.(0, 0, 0);

    } catch (error) {
      console.error('Failed to reset lesson', error);
      alert('Failed to reset lesson. Please try again.');
    }
  };

  const unlockedPercent = totalDuration > 0 ? Math.min(100, (maxAllowedTime / totalDuration) * 100) : 0;
  const currentPercent = totalDuration > 0 ? Math.min(100, (position / totalDuration) * 100) : 0;
  const isCheckpointBlocking = !!(active && active.required !== false && !completed[active.id]);

  return (
    <div className="w-full flex flex-col justify-start">
      {/* Resume playback banner — auto-dismisses after 3 s */}
      {showResumeBanner && effectiveInitialPosition > 5 && (
        <ResumeBanner
          position={effectiveInitialPosition}
          onResume={() => {
            if (resumeBannerTimerRef.current) clearTimeout(resumeBannerTimerRef.current);
            seek(effectiveInitialPosition);
            setShowResumeBanner(false);
          }}
          onStartOver={() => {
            if (resumeBannerTimerRef.current) clearTimeout(resumeBannerTimerRef.current);
            seek(0);
            setShowResumeBanner(false);
          }}
          onMount={() => {
            resumeBannerTimerRef.current = setTimeout(() => setShowResumeBanner(false), 3000);
          }}
        />
      )}

      {/* Main Screen Stage: Full Width Video by Default, Split Screen When Checkpoint or Transcript Active */}
      <div className={`grid grid-cols-1 gap-4 lg:gap-6 items-start ${active || (showTranscript && transcript.length > 0) ? 'lg:grid-cols-12' : ''} transition-all duration-300 w-full`}>
        {/* VIDEO COLUMN: Full width normally, side-by-side when checkpoint or transcript is active */}
        <div className={`${active || (showTranscript && transcript.length > 0) ? 'lg:col-span-7 xl:col-span-8' : 'w-full'} flex flex-col justify-start transition-all duration-300 sticky top-0 z-40 bg-white dark:bg-slate-950 pt-1 pb-2 lg:p-0 lg:static lg:bg-transparent`}>
          <div className="relative overflow-hidden rounded-2xl bg-black shadow-2xl border border-slate-800 select-none">
            
            {/* Completion Reset Prompt Overlay */}
            {showLessonCompletedPrompt && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl shadow-2xl max-w-sm text-center border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
                  <div className="mx-auto w-14 h-14 bg-[#F3F7FC] border border-blue-200 dark:bg-blue-950/40 rounded-full flex items-center justify-center mb-5">
                    <CheckCircle2 className="w-8 h-8 text-[#006EF3]" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Lesson Completed!</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                    Do you want to reset this lesson and study it again?
                  </p>
                  <div className="flex flex-col gap-3">
                    <Button 
                      onClick={() => { setShowLessonCompletedPrompt(false); handleResetLesson(); }} 
                      className="w-full bg-[#012970] hover:bg-[#006EF3] text-white font-bold h-11 transition-colors"
                    >
                      Yes
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowLessonCompletedPrompt(false)} 
                      className="w-full h-11 border-slate-200 dark:border-slate-700 font-semibold"
                    >
                      No
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Manual Reset Prompt Overlay */}
            {showManualResetPrompt && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl shadow-2xl max-w-sm text-center border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
                  <div className="mx-auto w-14 h-14 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mb-5">
                    <RotateCcw className="w-7 h-7 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Reset Progress?</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                    Are you sure you want to reset your progress? This will clear your checkpoint answers and watched time so you can review from scratch.
                  </p>
                  <div className="flex flex-col gap-3">
                    <Button 
                      onClick={() => { setShowManualResetPrompt(false); handleResetLesson(); }} 
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-11"
                    >
                      Yes, reset my progress
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowManualResetPrompt(false)} 
                      className="w-full h-11 border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 16:9 Aspect Video Canvas clamped to viewport height so that video + controls + feedback NEVER scroll */}
            <div className={`relative w-full aspect-video ${
              active
                ? feedback
                  ? 'max-h-[28vh] sm:max-h-[35vh] lg:max-h-[calc(100dvh-18.5rem)]'
                  : 'max-h-[30vh] sm:max-h-[38vh] lg:max-h-[calc(100dvh-13.5rem)]'
                : 'max-h-[35vh] sm:max-h-[45vh] lg:max-h-[calc(100dvh-9.5rem)]'
            } bg-black flex items-center justify-center overflow-hidden`}>
              <UniversalVideo
                ref={videoRef}
                url={videoUrl}
                controls={allowFreeSeek && isTeacher}
                className="w-full h-full max-h-full object-contain"
                initialTime={initialPosition}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onDurationChange={(dur) => setDetectedDuration(dur)}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => {
                  setPlaying(false);
                  
                  // YouTube API sometimes fires 'ended' before the final second's timeupdate.
                  // Visually sync the timer to the exact total duration so it doesn't say 3:19 / 3:20.
                  if (totalDuration > 0) {
                    setPosition(totalDuration);
                    lastTimeRef.current = totalDuration;
                    watchedRef.current = Math.max(watchedRef.current, totalDuration);
                    setWatched(watchedRef.current);
                  }
                  
                  const totalActs = (activitiesRef.current || []).length;
                  const nowCompletedActs = Object.keys(completedRef.current).filter(
                    (k) => completedRef.current[k]
                  ).length;
                  const checkPct = totalActs > 0 ? (nowCompletedActs / totalActs) * 50 : 0;
                  // Force watchPct to 50 since video ended (bypassing YT 1s polling gap)
                  const progressPercent = totalActs > 0
                    ? Math.min(100, Math.round(checkPct + 50))
                    : 100;
                  
                  // Crucial: If a checkpoint is active at the very end of the video,
                  // do NOT send >= 90%, otherwise the parent will auto-advance and skip it.
                  const finalPercent = activeRef.current ? Math.min(89, progressPercent) : progressPercent;

                  onProgress?.(totalDuration, totalDuration, finalPercent);
                  onEnded?.();
                }}
              />

              {/* Interaction Shield & Centered Circular Play Overlay */}
              <div
                onClick={togglePlay}
                onContextMenu={(e) => e.preventDefault()}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="absolute inset-0 z-10 cursor-pointer flex items-center justify-center group"
              >
                {/* Restriction Notice Banner */}
                {restrictionNotice && (
                  <div
                    role="alert"
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-slate-900/95 backdrop-blur-md px-4 py-2 text-xs font-semibold text-amber-300 border border-amber-500/50 shadow-2xl animate-in fade-in slide-in-from-top-2"
                  >
                    <Lock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>{restrictionNotice}</span>
                  </div>
                )}

                {/* Centered Circular Play Button overlay (matches screenshot) */}
                {!playing && !isCheckpointBlocking && (
                  <div className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-black/60 backdrop-blur-xs text-white border border-white/20 shadow-2xl transition-all transform group-hover:scale-105 group-hover:bg-black/80">
                    <Play className="h-6 w-6 md:h-7 md:w-7 fill-white translate-x-0.5" />
                  </div>
                )}

                {/* Checkpoint Blocking Badge */}
                {isCheckpointBlocking && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 rounded-2xl bg-amber-950/90 backdrop-blur-md px-4 py-2 text-amber-200 border border-amber-500/60 shadow-2xl"
                  >
                    <Lock className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                    <span className="text-xs font-bold">
                      Checkpoint Active · <span className="hidden lg:inline">Answer on the right</span><span className="lg:hidden">Answer below</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Sleek Minimalist Control Bar (matches screenshot) */}
            <div className="bg-slate-950 border-t border-slate-900 px-3.5 py-3 text-white flex items-center gap-3">
              {/* Play/Pause Button */}
              <button
                type="button"
                aria-label={playing ? 'Pause video' : 'Play video'}
                disabled={isCheckpointBlocking}
                onClick={togglePlay}
                className="text-white hover:text-emerald-400 transition-colors shrink-0"
              >
                {playing ? (
                  <Pause size={17} className="fill-white" />
                ) : isCheckpointBlocking ? (
                  <Lock size={16} className="text-slate-500" />
                ) : (
                  <Play size={17} className="fill-white" />
                )}
              </button>

              {/* Current Time (0:03) */}
              <span className="font-mono text-xs font-bold text-slate-200 shrink-0 tabular-nums">
                {formatVideoTime(position)}
              </span>

              {/* Timeline Scrubber Container with Interactive Diamond Checkpoints */}
              <div className="relative flex-1 h-6 flex items-center group/scrubber">
                {/* Visual Track */}
                <div className="relative w-full h-1.5 rounded-full bg-slate-800 pointer-events-none">
                  {/* Unlocked zone */}
                  <div
                    style={{ width: `${unlockedPercent}%` }}
                    className="absolute left-0 top-0 bottom-0 bg-slate-700/60 rounded-full"
                  />
                  {/* Progress bar */}
                  <div
                    style={{ width: `${currentPercent}%` }}
                    className="absolute left-0 top-0 bottom-0 bg-teal-400 rounded-full"
                  />
                </div>

                {/* Native range input for scrubber dragging - z-10 */}
                <input
                  aria-label="Video scrubber"
                  type="range"
                  min={0}
                  max={totalDuration > 0 ? totalDuration : 100}
                  step={0.1}
                  value={position}
                  disabled={isCheckpointBlocking}
                  onChange={(e) => {
                    if (isCheckpointBlocking) return;
                    seek(Number(e.target.value));
                  }}
                  className={`absolute inset-0 w-full h-full opacity-0 z-10 ${
                    isCheckpointBlocking ? 'cursor-not-allowed pointer-events-none' : 'cursor-pointer'
                  }`}
                />

                {/* Checkpoint Diamonds on Scrubber - z-20 for direct clicks */}
                {activities && activities.length > 0 && totalDuration > 0 && (
                  <div className={`absolute inset-0 z-20 ${isCheckpointBlocking ? 'pointer-events-none opacity-60' : 'pointer-events-none'}`}>
                    {activities.map((item, idx) => {
                      const leftPercent = Math.min(
                        100,
                        Math.max(0, (item.timestampSeconds / totalDuration) * 100)
                      );
                      const isDone = !!completed[item.id];
                      const isActive = active?.id === item.id;
                      const isLocked = (!allowFreeSeek && item.timestampSeconds > maxAllowedTime + 1.0) || isCheckpointBlocking;

                      return (
                        <div
                          key={item.id}
                          style={{ left: `${leftPercent}%` }}
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-auto group/diamond"
                        >
                          <button
                            type="button"
                            disabled={isLocked || isCheckpointBlocking}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (isLocked || isCheckpointBlocking) return;
                              openCheckpoint(item);
                            }}
                            className={`relative w-7 h-7 flex items-center justify-center focus:outline-none ${
                              isLocked || isCheckpointBlocking ? 'cursor-not-allowed pointer-events-none' : 'cursor-pointer'
                            }`}
                            aria-label={`Checkpoint ${idx + 1}: ${item.title || 'Question'} at ${formatVideoTime(item.timestampSeconds)}`}
                          >
                            {/* Visual Diamond */}
                            <span
                              className={`block rotate-45 transition-all duration-150 ${
                                isActive
                                  ? 'w-2.5 h-2.5 bg-white border-2 border-teal-400 ring-4 ring-teal-400/60 shadow-lg scale-110'
                                  : isDone
                                  ? 'w-2.5 h-2.5 bg-teal-400 border border-white hover:scale-150 hover:bg-teal-300 shadow-sm'
                                  : isLocked
                                  ? 'w-2.5 h-2.5 bg-slate-500 border border-slate-700 opacity-60'
                                  : 'w-2.5 h-2.5 bg-slate-200 border border-slate-600 hover:scale-150 hover:bg-white shadow-sm'
                              }`}
                            />

                            {/* Rich Hover Tooltip */}
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/diamond:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap">
                              <div className="rounded-lg bg-slate-950/95 text-white text-[11px] font-semibold px-2.5 py-1 shadow-2xl border border-slate-800 flex items-center gap-1.5 backdrop-blur-md">
                                <span className={isDone ? 'text-teal-400' : isActive ? 'text-white' : 'text-slate-400'}>
                                  {isDone ? '✓' : isActive ? '📍' : isLocked ? '🔒' : '◆'}
                                </span>
                                <span className="font-bold">
                                  Checkpoint {idx + 1}
                                </span>
                                <span className="text-slate-400 font-mono text-[10px]">
                                  · {formatVideoTime(item.timestampSeconds)}
                                </span>
                                {item.title && (
                                  <span className="text-slate-300 font-normal max-w-[150px] truncate text-[10px]">
                                    ({item.title})
                                  </span>
                                )}
                              </div>
                              <div className="w-1.5 h-1.5 bg-slate-950 rotate-45 -mt-1 border-r border-b border-slate-800" />
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Total Duration (0:45) */}
              <span className="font-mono text-xs font-medium text-slate-400 shrink-0 tabular-nums">
                {formatVideoTime(totalDuration || 0)}
              </span>

              {/* Speed Toggle (1x) */}
              <button
                type="button"
                onClick={cycleSpeed}
                className="text-xs font-bold text-slate-300 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors shrink-0"
                title="Click to cycle playback speed"
              >
                {speed}x
              </button>

              {/* Transcript Toggle Button */}
              {transcript && transcript.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowTranscript((v) => !v)}
                  className={`text-xs font-bold px-2 py-0.5 rounded transition-colors flex items-center gap-1 shrink-0 ${
                    showTranscript ? 'bg-teal-500/20 text-teal-300' : 'text-slate-300 hover:text-white'
                  }`}
                  title={showTranscript ? 'Hide transcript' : 'Show transcript'}
                >
                  <FileText size={13} />
                  <span className="hidden sm:inline">Transcript</span>
                </button>
              )}

              {/* Volume Mute Toggle */}
              <button
                type="button"
                onClick={toggleMute}
                className="text-slate-300 hover:text-white transition-colors shrink-0"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
              </button>
            </div>
          </div>

          {/* Teacher override mode banner */}
          {isTeacher && (
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-2">
              <span>Teacher Mode</span>
              <button
                type="button"
                onClick={() => setAllowFreeSeek((v) => !v)}
                className="underline hover:text-white"
              >
                {allowFreeSeek ? 'Free Seek ON (testing)' : 'Student Restriction ON'}
              </button>
            </div>
          )}
          
          {!isTeacher && (
            <div className="mt-2 flex items-center justify-end text-[11px] text-slate-400 px-2">
              <button
                type="button"
                onClick={() => setShowManualResetPrompt(true)}
                className="underline hover:text-red-400 flex items-center gap-1 transition-colors"
                title="Reset your progress for this lesson and start over"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Lesson
              </button>
            </div>
          )}

          {/* Answer Feedback Directly Below Video */}
          {active && feedback && (
            <div className={`mt-2.5 rounded-2xl p-3 sm:p-3.5 text-xs font-medium transition-all flex flex-col sm:flex-row gap-3 sm:items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2 duration-300 ${
              feedback.isCorrect
                ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-900 dark:bg-rose-950/70 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
            }`}>
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                {feedback.isCorrect ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 w-full min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-sm">
                      {feedback.isCorrect ? 'Correct!' : 'Incorrect — not quite right.'}
                    </p>
                    {feedback.isCorrect && autoResumeSeconds !== null && (
                      <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse shrink-0">
                        <Sparkles className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        Resuming in {autoResumeSeconds}s...
                      </span>
                    )}
                  </div>
                  {feedback.feedback && !feedback.isCorrect && (
                    <p className="opacity-90 leading-tight">{feedback.feedback}</p>
                  )}
                  {feedback.explanation && (
                    <p className="text-xs opacity-80 mt-0.5 leading-tight">
                      <strong>Explanation:</strong> {feedback.explanation}
                    </p>
                  )}
                  {feedback.correctAnswer && (
                    <div className="mt-1 pt-1 border-t border-black/10 dark:border-white/10 flex flex-wrap items-center gap-1 text-xs">
                      <span className="font-bold opacity-75">Correct answer:</span>
                      <span className="font-bold text-emerald-800 dark:text-emerald-200 bg-white/80 dark:bg-black/40 px-2 py-0.5 rounded-md border border-emerald-300/50">
                        {Array.isArray(feedback.correctAnswer)
                          ? feedback.correctAnswer.join(', ')
                          : typeof feedback.correctAnswer === 'object'
                          ? Object.entries(feedback.correctAnswer).map(([k, v]) => `${k} → ${v}`).join('; ')
                          : String(feedback.correctAnswer)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {!feedback.isCorrect && active.allowRetry !== false && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      clearAutoResume();
                      setFeedback(null);
                      setAnswer(active.type === 'MULTIPLE_SELECT' ? [] : '');
                    }}
                    className="text-xs font-bold h-8 px-3 rounded-xl border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs cursor-pointer"
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Try Again
                  </Button>
                )}
                {(feedback.isCorrect || active.allowRetry === false || feedback.correctAnswer) ? (
                  <Button
                    onClick={continueVideo}
                    className="bg-[#012970] hover:bg-[#006EF3] text-white font-bold rounded-xl text-xs h-8 px-4 shadow-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5 fill-white" />
                    Continue Video
                  </Button>
                ) : null}
              </div>
            </div>
          )}

          {/* Guidance Hint Below Video if Toggled */}
          {active && showHint && (
            <div className="mt-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in">
              <p className="font-bold flex items-center gap-1.5 mb-1">
                <span>💡</span> Guidance:
              </p>
              <p className="opacity-90 leading-relaxed">
                {active.explanation || active.instructions || active.content?.guidance || 'Listen to what the speaker mentions and choose the option that fits best.'}
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Question & Interaction Panel - ONLY visible when checkpoint is active, OR Transcript panel */}
        {active ? (
          <div id="interactive-panel" className="lg:col-span-5 xl:col-span-4 relative flex flex-col w-full min-h-0 lg:h-[calc(100dvh-6.5rem)] lg:max-h-[calc(100dvh-6.5rem)] scroll-mt-[350px] lg:scroll-mt-0 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="w-full flex-1 flex flex-col overflow-hidden rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-md p-4 sm:p-5 max-h-[55vh] lg:max-h-full">
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto pr-1.5 custom-scrollbar pb-3 touch-auto">
                  {/* Question Header */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800/80 px-2.5 py-0.5 rounded-full shadow-2xs">
                          <span className="w-2 h-2 rotate-45 bg-teal-500 shrink-0 inline-block" />
                          Checkpoint {activeCheckpointIndex >= 0 ? `${activeCheckpointIndex + 1} of ${activities.length}` : ''}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-400">
                          {formatVideoTime(active.timestampSeconds)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Checkpoint Previous / Next Switcher */}
                        {activities && activities.length > 1 && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={activeCheckpointIndex <= 0}
                              onClick={() => {
                                if (activeCheckpointIndex > 0) {
                                  openCheckpoint(activities[activeCheckpointIndex - 1]);
                                }
                              }}
                              className="px-2 py-0.5 rounded text-[11px] font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Previous checkpoint"
                            >
                              ← Prev
                            </button>
                            <button
                              type="button"
                              disabled={
                                activeCheckpointIndex >= activities.length - 1 ||
                                (!allowFreeSeek &&
                                  activities[activeCheckpointIndex + 1]?.timestampSeconds > maxAllowedTime + 1)
                              }
                              onClick={() => {
                                if (activeCheckpointIndex < activities.length - 1) {
                                  openCheckpoint(activities[activeCheckpointIndex + 1]);
                                }
                              }}
                              className="px-2 py-0.5 rounded text-[11px] font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Next checkpoint"
                            >
                              Next →
                            </button>
                          </div>
                        )}

                        {/* Close Checkpoint Panel & Return to Full Video */}
                        <button
                          type="button"
                          onClick={() => {
                            if (active.required !== false && !completed[active.id] && !isTeacher && !allowFreeSeek) {
                              showNotice('🔒 Checkpoint required: Please submit your answer before continuing.');
                              return;
                            }
                            continueVideo();
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Close checkpoint and return to full video"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                      {active.title || 'Choose the best response:'}
                    </h2>
                    {active.instructions && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {active.instructions}
                      </p>
                    )}
                  </div>

                  {/* Top Action Bar */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/95 dark:bg-slate-900/95 z-10 -mx-2 px-2 py-1.5">
                    {!feedback ? (
                      ['FILL_BLANK', 'FILL_IN_BLANK', 'VOCABULARY', 'DRAG_DROP', 'ORDERING', 'MULTIPLE_SELECT', 'SPEAKING'].includes(active.type) ? (
                        <Button
                          onClick={() => submit()}
                          disabled={submitting || (!answer && answer !== 0 && (!Array.isArray(answer) || answer.length === 0))}
                          className="bg-[#012970] hover:bg-[#006EF3] text-white font-bold rounded-xl text-xs h-8 px-4 shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer"
                        >
                          {submitting && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                          {submitting ? 'Checking...' : 'Submit Answer'}
                        </Button>
                      ) : (
                        <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                          Select an option below
                        </div>
                      )
                    ) : (
                      <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Answer Submitted
                      </div>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => setShowHint((v) => !v)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>💡</span> {showHint ? 'Hide hint' : 'Need a hint?'}
                    </button>
                  </div>

                  {/* Question Answer Options */}
                  <ActivityAnswer activity={active} answer={answer} setAnswer={setAnswer} feedback={feedback} onSubmit={submit} submitting={submitting} />
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
                  <span>{activities?.length || 0} checkpoints total</span>
                  <span className="font-semibold text-emerald-600">
                    {Object.keys(completed).length} / {activities?.length || 0} completed
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : showTranscript && transcript.length > 0 ? (
          <div id="transcript-panel" className="lg:col-span-5 xl:col-span-4 relative flex flex-col w-full min-h-0 lg:h-[calc(100dvh-6.5rem)] lg:max-h-[calc(100dvh-6.5rem)] animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="w-full flex-1 flex flex-col overflow-hidden rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-md p-4 sm:p-5 max-h-[55vh] lg:max-h-full">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                    <FileText className="h-4 w-4" />
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Lesson Transcript
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTranscript(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Close transcript"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto pr-1.5 mt-3 space-y-1.5 custom-scrollbar">
                {transcript.map((line, i) => (
                  <button
                    key={i}
                    onClick={() => seek(line.time)}
                    className="flex w-full items-start gap-2.5 rounded-xl p-2 text-left text-xs hover:bg-[#F3F7FC] dark:hover:bg-slate-800 transition-colors cursor-pointer group"
                  >
                    <span className="w-12 shrink-0 font-mono text-teal-600 dark:text-teal-400 font-bold group-hover:underline">
                      {formatVideoTime(line.time)}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{line.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ActivityAnswer({
  activity,
  answer,
  setAnswer,
  feedback,
  onSubmit,
  submitting,
}: {
  activity: VideoActivity;
  answer: any;
  setAnswer: (v: any) => void;
  feedback?: any;
  onSubmit?: (val?: any) => void;
  submitting?: boolean;
}) {
  const content = activity.content || {};

  // 1. TRUE_FALSE
  if (activity.type === 'TRUE_FALSE') {
    return (
      <div className="flex gap-4">
        {['true', 'false'].map((value) => (
          <label
            key={value}
            className={`flex-1 flex items-center justify-center gap-2 cursor-pointer rounded-xl border p-3.5 transition-all text-xs font-bold uppercase tracking-wider ${
              String(answer) === value
                ? 'border-[#006EF3] bg-[#F3F7FC] dark:bg-blue-950/60 text-[#012970] dark:text-blue-300 ring-2 ring-blue-400'
                : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 hover:bg-white text-slate-700 dark:text-slate-300'
            }`}
          >
            <input
              type="radio"
              name={activity.id}
              disabled={feedback?.isCorrect || submitting}
              checked={String(answer) === value}
              onChange={() => {
                setAnswer(value);
                onSubmit?.(value);
              }}
              className="accent-[#006EF3]"
            />
            {value === 'true' ? 'True' : 'False'}
          </label>
        ))}
      </div>
    );
  }

  // 2. FILL_BLANK
  if (activity.type === 'FILL_BLANK' || activity.type === 'FILL_IN_BLANK') {
    return (
      <div className="space-y-3">
        {content.sentenceTemplate && (
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs md:text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed font-mono">
            {content.sentenceTemplate}
          </div>
        )}
        <div>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
            Type the missing word:
          </label>
          <input
            type="text"
            value={answer || ''}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs md:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>
    );
  }

  // 3. IMAGE
  if (activity.type === 'IMAGE') {
    return (
      <div className="space-y-3">
        {content.imageUrl && (
          <div className="w-full max-h-56 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black flex items-center justify-center">
            <img
              src={content.imageUrl}
              alt="Question Visual"
              className="max-h-56 w-auto object-contain"
            />
          </div>
        )}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 border-y border-slate-100 dark:border-slate-800">
          {(content.options || []).map((option: any, idx: number) => {
            const optText = typeof option === 'string' ? option : option?.text || '';
            const letter = String.fromCharCode(65 + idx);
            const isSelected = answer === optText;
            return (
              <button
                type="button"
                key={idx}
                disabled={feedback?.isCorrect || submitting}
                onClick={() => {
                  setAnswer(optText);
                  onSubmit?.(optText);
                }}
                className={`w-full text-left py-3.5 px-3 flex items-start gap-4 transition-all rounded-lg ${
                  isSelected
                    ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white font-medium ring-1 ring-slate-300 dark:ring-slate-700'
                    : 'text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white min-w-[24px]">
                  {letter}.
                </span>
                <span className="text-sm md:text-base leading-snug">
                  {optText}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 4. SPEAKING
  if (activity.type === 'SPEAKING') {
    return (
      <div className="space-y-3">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-xs uppercase font-bold text-amber-600 dark:text-amber-400 mb-1">
            Read aloud or repeat:
          </p>
          <p className="text-sm md:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
            "{content.targetSentence || content.prompt || activity.title}"
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAnswer(content.targetSentence || 'Spoken recorded answer')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
              answer
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
            }`}
          >
            <span>🎙️</span>
            <span>{answer ? 'Recording Saved ✓' : 'Practice Speaking (Tap when done)'}</span>
          </button>
        </div>
      </div>
    );
  }

  // 5. VOCABULARY
  if (activity.type === 'VOCABULARY') {
    return (
      <div className="space-y-3">
        {content.targetWord && (
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-base font-black text-slate-900 dark:text-white">
                {content.targetWord}
              </span>
              {content.partOfSpeech && (
                <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  {content.partOfSpeech}
                </span>
              )}
            </div>
            {content.definition && (
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                <strong>Meaning:</strong> {content.definition}
              </p>
            )}
            {content.exampleSentence && (
              <p className="text-[11px] text-slate-500 italic mt-1">
                "{content.exampleSentence}"
              </p>
            )}
          </div>
        )}
        <input
          type="text"
          value={answer || ''}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type the meaning or target word..."
          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs md:text-sm outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
    );
  }

  // 6. DRAG_DROP / SENTENCE BUILDER
  if (activity.type === 'DRAG_DROP') {
    return <DragDropSentenceBuilder activity={activity} answer={answer} setAnswer={setAnswer} />;
  }

  // 7. ORDERING
  if (activity.type === 'ORDERING') {
    return <OrderingActivity activity={activity} answer={answer} setAnswer={setAnswer} />;
  }

  // 8. MATCHING
  if (activity.type === 'MATCHING') {
    return <MatchingActivity activity={activity} answer={answer} setAnswer={setAnswer} />;
  }

  // 9. MULTIPLE_SELECT
  if (activity.type === 'MULTIPLE_SELECT') {
    return (
      <div className="divide-y divide-slate-100 dark:divide-slate-800 border-y border-slate-100 dark:border-slate-800">
        {(content.options || []).map((option: any, idx: number) => {
          const optText = typeof option === 'string' ? option : option?.text || '';
          const letter = String.fromCharCode(65 + idx);
          const isChecked = Array.isArray(answer) && answer.includes(optText);
          return (
            <label
              key={idx}
              className={`w-full text-left py-3.5 px-3 flex items-start gap-4 cursor-pointer transition-all rounded-lg ${
                isChecked
                  ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white font-medium ring-1 ring-slate-300 dark:ring-slate-700'
                  : 'text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) =>
                  setAnswer(
                    e.target.checked
                      ? [...(Array.isArray(answer) ? answer : []), optText]
                      : (Array.isArray(answer) ? answer : []).filter((x: string) => x !== optText)
                  )
                }
                className="accent-slate-900 dark:accent-emerald-500 h-4 w-4 rounded mt-1 shrink-0"
              />
              <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white min-w-[24px]">
                {letter}.
              </span>
              <span className="text-sm md:text-base leading-snug flex-1">
                {optText}
              </span>
            </label>
          );
        })}
      </div>
    );
  }

  // 10. OBJECTIVE CHOICES (MULTIPLE_CHOICE, LISTENING, GRAMMAR, READING)
  if (
    [
      'MULTIPLE_CHOICE',
      'LISTENING',
      'GRAMMAR',
      'READING',
    ].includes(activity.type) &&
    content.options &&
    content.options.length > 0
  ) {
    return (
      <div className="space-y-3">
        {/* Reading Passage if available */}
        {activity.type === 'READING' && content.passage && (
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-h-40 overflow-y-auto">
            {content.passage}
          </div>
        )}

        {/* Listening Cue if available */}
        {activity.type === 'LISTENING' && content.audioCue && (
          <div className="p-3 bg-sky-50 dark:bg-sky-950/50 rounded-xl border border-sky-200 dark:border-sky-800 text-xs text-sky-800 dark:text-sky-300 flex items-center gap-2">
            <span>🎧</span>
            <span>{content.audioCue}</span>
          </div>
        )}

        {/* Grammar Focus if available */}
        {activity.type === 'GRAMMAR' && content.sentence && (
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs font-mono font-bold text-indigo-900 dark:text-indigo-200">
            {content.sentence}
          </div>
        )}

        <div className="space-y-2.5 mt-3">
          {(content.options || []).map((option: any, idx: number) => {
            const optText = typeof option === 'string' ? option : option?.text || '';
            const letter = String.fromCharCode(65 + idx);
            const isSelected = answer === optText;
            const showSuccess = feedback?.isCorrect && isSelected;
            const showError = feedback && !feedback.isCorrect && isSelected;

            return (
              <button
                type="button"
                key={idx}
                disabled={feedback?.isCorrect || submitting}
                onClick={() => {
                  setAnswer(optText);
                  onSubmit?.(optText);
                }}
                className={`w-full text-left p-3.5 flex items-center justify-between gap-3 transition-all rounded-2xl border ${
                  showSuccess
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/40 font-bold shadow-xs'
                    : showError
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/40 font-bold shadow-xs'
                    : isSelected
                    ? 'bg-[#F3F7FC] dark:bg-slate-800 border-[#006EF3] text-[#012970] dark:text-blue-300 font-bold ring-2 ring-[#006EF3]/30 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-black transition-colors ${
                      showSuccess
                        ? 'bg-emerald-500 text-white'
                        : showError
                        ? 'bg-rose-500 text-white'
                        : isSelected
                        ? 'bg-[#012970] text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="text-xs sm:text-sm leading-relaxed">{optText}</span>
                </div>

                {showSuccess && (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300">
                    <Check className="h-4 w-4 stroke-[3]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 11. WRITING or SHORT_ANSWER Fallback
  return (
    <div className="space-y-2">
      {activity.type === 'WRITING' && content.guidance && (
        <p className="text-xs text-slate-500 italic">Guidance: {content.guidance}</p>
      )}
      <textarea
        value={answer || ''}
        onChange={(e) => setAnswer(e.target.value)}
        rows={activity.type === 'WRITING' ? 4 : 2}
        placeholder={
          activity.type === 'WRITING'
            ? 'Write your response here...'
            : 'Type your answer here...'
        }
        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
      />
      {activity.type === 'WRITING' && content.minWords && (
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>Target: {content.minWords} words</span>
          <span>
            Current:{' '}
            {String(answer || '')
              .trim()
              .split(/\s+/)
              .filter(Boolean).length}{' '}
            words
          </span>
        </div>
      )}
    </div>
  );
}

function DragDropSentenceBuilder({
  activity,
  answer,
  setAnswer,
}: {
  activity: VideoActivity;
  answer: any;
  setAnswer: (val: any) => void;
}) {
  const content = activity.content || {};
  const rawTokens: string[] = useMemo(() => {
    if (typeof content.tokens === 'string') {
      return content.tokens.split(',').map((t: string) => t.trim()).filter(Boolean);
    }
    if (Array.isArray(content.tokens)) {
      return content.tokens.map((t: any) => String(t).trim()).filter(Boolean);
    }
    return [];
  }, [content.tokens]);

  const selectedWords: string[] = Array.isArray(answer) ? answer : [];
  const [isOverDropZone, setIsOverDropZone] = useState(false);

  const addToken = (tok: string) => {
    setAnswer([...selectedWords, tok]);
  };

  const removeToken = (idxToRemove: number) => {
    setAnswer(selectedWords.filter((_, idx) => idx !== idxToRemove));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsOverDropZone(true);
  };

  const handleDragLeave = () => {
    setIsOverDropZone(false);
  };

  const handleDropOnZone = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverDropZone(false);
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        if (parsed.type === 'bank' && parsed.token) {
          addToken(parsed.token);
          return;
        }
      }
    } catch {
      // Fallback
    }
    const plainToken = e.dataTransfer.getData('text/plain');
    if (plainToken) {
      addToken(plainToken);
    }
  };

  const handleDropOnToken = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOverDropZone(false);
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        if (parsed.type === 'reorder' && typeof parsed.index === 'number') {
          const fromIdx = parsed.index;
          if (fromIdx === targetIdx) return;
          const next = [...selectedWords];
          const [moved] = next.splice(fromIdx, 1);
          next.splice(targetIdx, 0, moved);
          setAnswer(next);
          return;
        }
        if (parsed.type === 'bank' && parsed.token) {
          const next = [...selectedWords];
          next.splice(targetIdx, 0, parsed.token);
          setAnswer(next);
          return;
        }
      }
    } catch {
      // ignore
    }
    const plainToken = e.dataTransfer.getData('text/plain');
    if (plainToken) {
      const next = [...selectedWords];
      next.splice(targetIdx, 0, plainToken);
      setAnswer(next);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          Drag & drop or click words into place to build the correct sentence:
        </p>
        {selectedWords.length > 0 && (
          <button
            type="button"
            onClick={() => setAnswer([])}
            className="text-[11px] font-bold text-rose-500 hover:text-rose-600 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Interactive Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDropOnZone}
        className={`min-h-16 p-3.5 rounded-2xl border-2 border-dashed transition-all flex flex-wrap gap-2 items-center ${
          isOverDropZone
            ? 'border-[#006EF3] bg-[#F3F7FC] dark:bg-blue-950/40 ring-2 ring-blue-400'
            : selectedWords.length === 0
            ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60'
            : 'border-blue-300 dark:border-blue-900 bg-white dark:bg-slate-900'
        }`}
      >
        {selectedWords.length === 0 ? (
          <div className="w-full text-center py-2 flex flex-col items-center justify-center gap-1 text-slate-400 dark:text-slate-500 select-none">
            <span className="text-base">✋ 🧩</span>
            <span className="text-xs font-medium">Drag words here or tap them below</span>
          </div>
        ) : (
          selectedWords.map((word, i) => (
            <span
              key={`${word}-${i}`}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(
                  'application/json',
                  JSON.stringify({ type: 'reorder', token: word, index: i })
                );
                e.dataTransfer.setData('text/plain', word);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDropOnToken(e, i)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#012970] text-white font-bold text-xs shadow-sm cursor-grab active:cursor-grabbing hover:bg-[#006EF3] transition-all select-none animate-in zoom-in-95 duration-100"
              title="Drag to reorder, or click × to remove"
            >
              <span>{word}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeToken(i);
                }}
                className="h-4 w-4 rounded-full bg-[#006EF3] hover:bg-rose-600 text-white flex items-center justify-center text-[10px] leading-none transition-colors"
                title="Remove"
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>

      {/* Draggable Word Token Bank */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
          Word Bank (drag or click):
        </span>
        <div className="flex flex-wrap gap-2">
          {rawTokens.map((token: string, idx: number) => {
            const usedCount = selectedWords.filter((w) => w === token).length;
            const totalCount = rawTokens.filter((t: string) => t === token).length;
            const isExhausted = usedCount >= totalCount;

            return (
              <div
                key={idx}
                draggable={!isExhausted}
                onDragStart={(e) => {
                  if (isExhausted) return;
                  e.dataTransfer.setData(
                    'application/json',
                    JSON.stringify({ type: 'bank', token, index: idx })
                  );
                  e.dataTransfer.setData('text/plain', token);
                  e.dataTransfer.effectAllowed = 'copyMove';
                }}
                onClick={() => {
                  if (!isExhausted) addToken(token);
                }}
                className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all select-none ${
                  isExhausted
                    ? 'opacity-30 border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 cursor-not-allowed line-through'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm hover:border-[#006EF3] hover:bg-[#F3F7FC] dark:hover:bg-slate-700 cursor-grab active:cursor-grabbing hover:-translate-y-0.5'
                }`}
                title={isExhausted ? 'Already used' : 'Drag or click to add'}
              >
                {token}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function OrderingActivity({
  activity,
  answer,
  setAnswer,
}: {
  activity: VideoActivity;
  answer: any;
  setAnswer: (val: any) => void;
}) {
  const content = activity.content || {};
  const originalItems: string[] = useMemo(() => {
    return Array.isArray(content.items) ? content.items : [];
  }, [content.items]);

  useEffect(() => {
    if (!answer || !Array.isArray(answer) || answer.length === 0) {
      setAnswer([...originalItems]);
    }
  }, [originalItems]);

  const currentList: string[] = Array.isArray(answer) && answer.length > 0 ? answer : originalItems;

  const move = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= currentList.length) return;
    const next = [...currentList];
    const [item] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, item);
    setAnswer(next);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    const fromIdx = Number(e.dataTransfer.getData('text/plain'));
    if (!isNaN(fromIdx) && fromIdx !== targetIdx) {
      move(fromIdx, targetIdx);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
        Drag items or use the arrows to arrange them in the correct sequence:
      </p>
      <div className="space-y-2">
        {currentList.map((item: string, idx: number) => (
          <div
            key={`${item}-${idx}`}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, idx)}
            className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-400 transition-all text-xs font-medium"
          >
            <div className="flex items-center gap-2.5">
              <span className="h-6 w-6 rounded-lg bg-[#F3F7FC] text-[#012970] border border-blue-200 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                {idx + 1}
              </span>
              <span className="text-slate-800 dark:text-slate-200">{item}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                disabled={idx === 0}
                onClick={() => move(idx, idx - 1)}
                className="h-7 w-7 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-slate-600 dark:text-slate-300"
                title="Move Up"
              >
                ▲
              </button>
              <button
                type="button"
                disabled={idx === currentList.length - 1}
                onClick={() => move(idx, idx + 1)}
                className="h-7 w-7 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-slate-600 dark:text-slate-300"
                title="Move Down"
              >
                ▼
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchingActivity({
  activity,
  answer,
  setAnswer,
}: {
  activity: VideoActivity;
  answer: any;
  setAnswer: (val: any) => void;
}) {
  const content = activity.content || {};
  const pairs: Array<{ left: string; right: string }> = useMemo(() => {
    return Array.isArray(content.pairs) ? content.pairs : [];
  }, [content.pairs]);

  const rightOptions = useMemo(() => {
    return Array.from(new Set(pairs.map((p) => p.right).filter(Boolean)));
  }, [pairs]);

  const currentAnswers: Record<string, string> =
    answer && typeof answer === 'object' && !Array.isArray(answer) ? answer : {};

  const handleSelect = (left: string, right: string) => {
    setAnswer({ ...currentAnswers, [left]: right });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
        Match each item on the left with its correct partner:
      </p>
      <div className="space-y-2">
        {pairs.map((pair, idx) => (
          <div
            key={idx}
            className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1.2fr] items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs shadow-sm"
          >
            <span className="font-bold text-slate-900 dark:text-slate-100">{pair.left}</span>
            <span className="hidden sm:inline text-slate-400 font-bold">➔</span>
            <select
              aria-label={`Match for ${pair.left}`}
              value={currentAnswers[pair.left] || ''}
              onChange={(e) => handleSelect(pair.left, e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Choose match --</option>
              {rightOptions.map((opt, oIdx) => (
                <option key={oIdx} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

