'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  CheckCircle2,
  Clock,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  Sparkles,
  Lock,
  Unlock,
  AlertTriangle,
  ShieldAlert,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { UniversalVideo, UniversalVideoHandle, getYouTubeId } from './universal-video';

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
  completedActivityIds = [],
  onProgress,
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
  completedActivityIds?: string[];
  onProgress?: (position: number, watched: number, percent: number) => void;
}) {
  const videoRef = useRef<UniversalVideoHandle>(null);
  const watchedRef = useRef(Math.max(initialWatched, initialPosition));
  const lastTimeRef = useRef(initialPosition);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  const [detectedDuration, setDetectedDuration] = useState(durationSeconds || 0);
  const [watched, setWatched] = useState(Math.max(initialWatched, initialPosition));
  const [active, setActive] = useState<VideoActivity | null>(null);
  const [completed, setCompleted] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    (completedActivityIds || []).forEach((id) => {
      init[id] = true;
    });
    return init;
  });
  const [answer, setAnswer] = useState<any>('');
  const [feedback, setFeedback] = useState<any>(null);
  const [speed, setSpeed] = useState(1);
  const [allowFreeSeek, setAllowFreeSeek] = useState(false);
  const [isCompact, setIsCompact] = useState(true);
  const [restrictionNotice, setRestrictionNotice] = useState<string | null>(null);
  const noticeTimeoutRef = useRef<any>(null);

  const totalDuration = durationSeconds && durationSeconds > 0 ? durationSeconds : detectedDuration;
  const isYouTube = !!getYouTubeId(videoUrl);

  // Determine earliest uncompleted required checkpoint barrier
  const earliestUncompletedCheckpoint = activities
    .filter((a) => a.required !== false && !completed[a.id])
    .sort((a, b) => a.timestampSeconds - b.timestampSeconds)[0];

  const checkpointBarrier = earliestUncompletedCheckpoint
    ? earliestUncompletedCheckpoint.timestampSeconds
    : (totalDuration > 0 ? totalDuration : 999999);

  // Maximum timestamp the student is currently permitted to seek or play up to
  const maxAllowedTime = allowFreeSeek
    ? (totalDuration > 0 ? totalDuration : 999999)
    : Math.min(Math.max(watched, position), checkpointBarrier);

  const showNotice = (msg: string) => {
    setRestrictionNotice(msg);
    if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current);
    noticeTimeoutRef.current = setTimeout(() => {
      setRestrictionNotice(null);
    }, 3500);
  };

  const handleTimeUpdate = (current: number) => {
    // If an active required checkpoint is pending submission, keep paused
    if (active && active.required !== false && !completed[active.id]) {
      videoRef.current?.pause();
      setPlaying(false);
      return;
    }

    const prevTime = lastTimeRef.current;
    const delta = current - prevTime;

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

    // 2. Normal playback progress: advance watched position smoothly
    if (current > watchedRef.current) {
      if (!allowFreeSeek && checkpointBarrier < 999999 && current > checkpointBarrier + 0.5) {
        videoRef.current?.pause();
        setPlaying(false);
        videoRef.current?.seekTo(checkpointBarrier);
        lastTimeRef.current = checkpointBarrier;
        setPosition(checkpointBarrier);
        return;
      }
      watchedRef.current = current;
      setWatched(current);
    }

    lastTimeRef.current = current;
    setPosition(current);

    // 3. Trigger uncompleted checkpoints ONLY when the playback head crosses or reaches them
    const reachedCheckpoint = activities.find((item) => {
      if (completed[item.id]) return false;
      const crossed = prevTime < item.timestampSeconds && current >= item.timestampSeconds;
      const landing = Math.abs(current - item.timestampSeconds) < 0.35 && prevTime <= item.timestampSeconds;
      return (crossed || landing) && (!active || active.id !== item.id);
    });

    if (reachedCheckpoint) {
      videoRef.current?.pause();
      setPlaying(false);
      setActive(reachedCheckpoint);
      setAnswer(reachedCheckpoint.type === 'MULTIPLE_SELECT' ? [] : '');
      videoRef.current?.seekTo(reachedCheckpoint.timestampSeconds);
      lastTimeRef.current = reachedCheckpoint.timestampSeconds;
      setPosition(reachedCheckpoint.timestampSeconds);
      return;
    }

    onProgress?.(
      current,
      Math.max(watchedRef.current, current),
      totalDuration ? Math.min(100, (current / totalDuration) * 100) : 0
    );
  };

  const seek = (targetTime: number) => {
    const clampedTarget = Math.max(0, targetTime);
    const maxSeekable = allowFreeSeek
      ? (totalDuration > 0 ? totalDuration : 999999)
      : Math.min(watchedRef.current, checkpointBarrier);

    if (!allowFreeSeek && clampedTarget > maxSeekable + 0.5) {
      if (earliestUncompletedCheckpoint && clampedTarget >= earliestUncompletedCheckpoint.timestampSeconds) {
        showNotice(
          `🔒 Forward jump locked. Complete checkpoint at ${formatVideoTime(
            earliestUncompletedCheckpoint.timestampSeconds
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
    if (active && active.required !== false && !completed[active.id]) {
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
  }, [position, playing, active, completed, allowFreeSeek, maxAllowedTime]);

  const submit = async () => {
    if (!active) return;
    try {
      const finalAnswer =
        active.type === 'DRAG_DROP' && Array.isArray(answer)
          ? answer.join(' ')
          : answer;
      const result: any = await apiClient.post(
        `/student/interactive-videos/activities/${active.id}/attempts`,
        { answer: finalAnswer }
      );
      setFeedback(result);
      if (result.isCorrect || active.allowRetry === false) {
        setCompleted((v) => ({ ...v, [active.id]: true }));
      }
    } catch (error: any) {
      setFeedback({ feedback: error.message || 'Could not submit your answer.' });
    }
  };

  const continueVideo = () => {
    if (active) {
      setCompleted((v) => ({ ...v, [active.id]: true }));
    }
    setActive(null);
    setFeedback(null);
    videoRef.current?.play();
    setPlaying(true);
  };

  const unlockedPercent = totalDuration > 0 ? Math.min(100, (maxAllowedTime / totalDuration) * 100) : 0;
  const currentPercent = totalDuration > 0 ? Math.min(100, (position / totalDuration) * 100) : 0;
  const isCheckpointBlocking = !!(active && active.required !== false && !completed[active.id]);

  return (
    <div className={`mx-auto transition-all duration-300 space-y-4 ${isCompact ? 'max-w-3xl' : 'max-w-5xl'}`}>
      {/* Video Container */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-950 shadow-2xl border border-slate-800 select-none">
        <div className={`relative w-full bg-black transition-all duration-300 mx-auto aspect-video ${isCompact ? 'max-h-[380px] md:max-h-[420px]' : 'max-h-[560px]'}`}>
          <UniversalVideo
            ref={videoRef}
            url={videoUrl}
            controls={allowFreeSeek && isTeacher}
            className="w-full h-full"
            initialTime={initialPosition}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onDurationChange={(dur) => setDetectedDuration(dur)}
            onTimeUpdate={handleTimeUpdate}
          />

          {/* Transparent Interaction Shield (intercepts clicks & blocks direct iframe tampering) */}
          <div
            onClick={togglePlay}
            onContextMenu={(e) => e.preventDefault()}
            onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="absolute inset-0 z-10 cursor-pointer flex items-center justify-center group"
          >
            {/* Transient Restriction Warning Toast */}
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

            {/* Centered Play Button when Paused */}
            {!playing && !isCheckpointBlocking && (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-2xl transition-all transform group-hover:scale-110 group-hover:bg-emerald-600">
                <Play className="h-7 w-7 fill-white translate-x-0.5" />
              </div>
            )}

            {/* Checkpoint Blocking Badge */}
            {isCheckpointBlocking && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 rounded-2xl bg-amber-950/90 backdrop-blur-md px-5 py-3 text-amber-200 border border-amber-500/60 shadow-2xl"
              >
                <Lock className="h-4 w-4 text-amber-400 animate-pulse" />
                <span className="text-xs font-bold">Checkpoint Active · Complete answer below to continue</span>
              </div>
            )}
          </div>
        </div>

        {/* Custom Secured Control Bar */}
        <div className="bg-slate-900/95 border-t border-slate-800 p-3.5 text-white">
          {/* Integrated Visual Scrubber with Lock Zone & Markers */}
          <div className="relative mb-3 flex items-center group/scrubber">
            {/* Scrubber Track Container */}
            <div className="relative w-full h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700/60">
              {/* Unlocked / Watched Zone (Segment the student has unlocked) */}
              <div
                style={{ width: `${unlockedPercent}%` }}
                className="absolute left-0 top-0 bottom-0 bg-slate-700/80 transition-all duration-150"
              />

              {/* Current Progress Playhead */}
              <div
                style={{ width: `${currentPercent}%` }}
                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-150"
              />

              {/* Locked Zone (Forward portion restricted from skipping) */}
              {!allowFreeSeek && unlockedPercent < 100 && (
                <div
                  style={{ left: `${unlockedPercent}%`, width: `${100 - unlockedPercent}%` }}
                  className="absolute top-0 bottom-0 bg-slate-900/90 border-l-2 border-amber-500/60 flex items-center justify-end pr-2 overflow-hidden"
                  title="Forward skipping locked"
                >
                  <Lock className="h-2 w-2 text-slate-500 opacity-60" />
                </div>
              )}
            </div>

            {/* Interactive Checkpoint Markers along the scrubber */}
            {activities.length > 0 && totalDuration > 0 && (
              <div className="absolute inset-0 pointer-events-none flex items-center px-0.5">
                {activities.map((item) => {
                  const leftPercent = Math.min(100, Math.max(0, (item.timestampSeconds / totalDuration) * 100));
                  const isDone = !!completed[item.id];
                  const isLocked = !allowFreeSeek && item.timestampSeconds > maxAllowedTime + 0.5;

                  return (
                    <div
                      key={item.id}
                      style={{ left: `${leftPercent}%` }}
                      className="absolute -translate-x-1/2 pointer-events-auto"
                      title={`${item.title} (${formatVideoTime(item.timestampSeconds)}) ${
                        isDone ? '✓ Completed' : isLocked ? '🔒 Locked' : '⭐ Unlocked'
                      }`}
                    >
                      <button
                        type="button"
                        aria-label={`Activity: ${item.title}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          seek(item.timestampSeconds);
                        }}
                        className={`h-3 w-3 rounded-full border-2 transition-transform hover:scale-125 flex items-center justify-center ${
                          isDone
                            ? 'bg-emerald-400 border-white shadow-xs'
                            : isLocked
                            ? 'bg-slate-700 border-slate-500 shadow-xs'
                            : 'bg-amber-400 border-amber-100 ring-2 ring-amber-400/40 shadow-xs'
                        }`}
                      >
                        {isDone ? (
                          <span className="block h-1 w-1 rounded-full bg-white" />
                        ) : isLocked ? (
                          <Lock className="h-1.5 w-1.5 text-slate-300" />
                        ) : null}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Invisible native range input on top for drag and touch handling */}
            <input
              aria-label="Video scrubber"
              type="range"
              min={0}
              max={totalDuration > 0 ? totalDuration : 100}
              step={0.1}
              value={position}
              onChange={(e) => seek(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          {/* Control Buttons & Indicators */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* Play/Pause Button */}
              <button
                type="button"
                aria-label={playing ? 'Pause video' : 'Play video'}
                disabled={isCheckpointBlocking}
                className={`rounded-xl p-2.5 transition-colors ${
                  isCheckpointBlocking
                    ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
                    : 'hover:bg-white/10 text-white'
                }`}
                onClick={togglePlay}
                title={isCheckpointBlocking ? 'Please complete checkpoint to resume' : playing ? 'Pause' : 'Play'}
              >
                {playing ? <Pause size={18} /> : isCheckpointBlocking ? <Lock size={18} /> : <Play size={18} />}
              </button>

              {/* Rewind 10s Button */}
              <button
                type="button"
                aria-label="Rewind 10 seconds"
                className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors text-xs font-semibold"
                onClick={rewind10}
                title="Rewind 10 seconds"
              >
                <RotateCcw size={14} />
                <span>-10s</span>
              </button>

              {/* Restart Button */}
              <button
                type="button"
                aria-label="Restart from beginning"
                className="rounded-xl p-2 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                onClick={() => seek(0)}
                title="Restart from beginning"
              >
                <RotateCcw size={15} />
              </button>

              {/* Time Display */}
              <div className="ml-1 flex items-center gap-1.5 text-xs font-mono tabular-nums text-slate-300">
                <span className="font-semibold text-white">{formatVideoTime(position)}</span>
                <span className="text-slate-500">/</span>
                <span className="text-slate-400">{formatVideoTime(totalDuration || 0)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Anti-skip indicator pill */}
              {!allowFreeSeek ? (
                <span
                  title="Forward skipping is restricted until checkpoints are completed"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber-950/50 border border-amber-500/30 px-2.5 py-1 text-[11px] font-semibold text-amber-300"
                >
                  <Lock className="h-3 w-3 text-amber-400" />
                  Anti-skip enabled
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                  <Unlock className="h-3 w-3 text-emerald-400" />
                  Free seeking
                </span>
              )}

              {/* Teacher test mode toggle */}
              {isTeacher && (
                <button
                  type="button"
                  onClick={() => setAllowFreeSeek((v) => !v)}
                  className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition-all ${
                    allowFreeSeek
                      ? 'bg-indigo-600 border-indigo-400 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                  title="Teacher override for testing checkpoint transitions"
                >
                  {allowFreeSeek ? 'Testing Mode (Free Seek ON)' : 'Student Mode (Restricted)'}
                </button>
              )}

              {/* Playback Speed Selector */}
              <select
                aria-label="Playback speed"
                value={speed}
                onChange={(e) => {
                  const s = Number(e.target.value);
                  setSpeed(s);
                  videoRef.current?.setPlaybackRate?.(s);
                }}
                className="rounded-lg bg-slate-800 px-2 py-1 text-xs text-white outline-none border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <option value={0.75}>0.75×</option>
                <option value={1}>1×</option>
                <option value={1.25}>1.25×</option>
                <option value={1.5}>1.5×</option>
              </select>

              {/* Compact / Enlarge player size toggle */}
              <button
                type="button"
                onClick={() => setIsCompact((v) => !v)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-medium"
                title={isCompact ? 'Enlarge player' : 'Minimize player size'}
              >
                {isCompact ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
                <span className="hidden md:inline">{isCompact ? 'Expand' : 'Minimize'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Checkpoint Card */}
      {active && (
        <Card className="border-amber-200 bg-amber-50/80 p-5 dark:bg-amber-950/30 dark:border-amber-900/50 shadow-md animate-in fade-in zoom-in-95">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Interactive Checkpoint · {formatVideoTime(active.timestampSeconds)}
              </p>
              <h2 className="mt-1 text-base md:text-lg font-bold text-slate-900 dark:text-white">
                {active.title}
              </h2>
            </div>
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>

          {active.instructions && (
            <p className="mb-4 text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {active.instructions}
            </p>
          )}

          <ActivityAnswer activity={active} answer={answer} setAnswer={setAnswer} />

          {feedback && (
            <div
              role="status"
              className={`mt-4 rounded-xl p-4 text-xs md:text-sm font-medium transition-all ${
                feedback.isCorrect
                  ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-900 dark:bg-rose-950/70 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {feedback.isCorrect ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1.5 flex-1">
                  <p className="font-bold text-sm">
                    {feedback.isCorrect ? 'Correct! Well done! 🎉' : 'Incorrect — not quite right.'}
                  </p>
                  {feedback.feedback && <p className="opacity-90">{feedback.feedback}</p>}
                  {feedback.explanation && (
                    <p className="text-xs opacity-80 mt-1">
                      <strong>Explanation:</strong> {feedback.explanation}
                    </p>
                  )}
                  {feedback.correctAnswer && (
                    <div className="mt-2.5 pt-2 border-t border-black/10 dark:border-white/10 flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="font-bold opacity-75">Correct answer:</span>
                      <span className="font-bold text-emerald-800 dark:text-emerald-200 bg-white/80 dark:bg-black/40 px-2 py-0.5 rounded-md border border-emerald-300/50">
                        {Array.isArray(feedback.correctAnswer)
                          ? feedback.correctAnswer.join(', ')
                          : typeof feedback.correctAnswer === 'object'
                          ? Object.entries(feedback.correctAnswer)
                              .map(([k, v]) => `${k} → ${v}`)
                              .join('; ')
                          : String(feedback.correctAnswer)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            {feedback && !feedback.isCorrect && active.allowRetry !== false && (
              <Button
                variant="outline"
                onClick={() => {
                  setFeedback(null);
                  setAnswer(active.type === 'MULTIPLE_SELECT' ? [] : '');
                }}
                className="text-xs font-semibold rounded-xl"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Try Again
              </Button>
            )}

            {feedback && (feedback.isCorrect || active.allowRetry === false || feedback.correctAnswer) ? (
              <Button
                onClick={continueVideo}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Continue Video
              </Button>
            ) : (
              <Button
                onClick={submit}
                className="bg-[#1f4325] hover:bg-[#285730] text-white font-bold rounded-xl text-xs"
              >
                Submit Answer
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Transcript Card */}
      {transcript.length > 0 && (
        <Card className="p-5 rounded-2xl border-slate-200 dark:border-slate-800">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Transcript</h3>
          <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
            {transcript.map((line, i) => (
              <button
                key={i}
                onClick={() => seek(line.time)}
                className="flex w-full items-start gap-3 rounded-xl p-2 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="w-12 shrink-0 font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                  {formatVideoTime(line.time)}
                </span>
                <span className="text-slate-700 dark:text-slate-300">{line.text}</span>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function ActivityAnswer({
  activity,
  answer,
  setAnswer,
}: {
  activity: VideoActivity;
  answer: any;
  setAnswer: (v: any) => void;
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
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-400'
                : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 hover:bg-white text-slate-700 dark:text-slate-300'
            }`}
          >
            <input
              type="radio"
              name={activity.id}
              checked={String(answer) === value}
              onChange={() => setAnswer(value)}
              className="accent-emerald-600"
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
        <div className="grid gap-2">
          {(content.options || []).map((option: any, idx: number) => {
            const optText = typeof option === 'string' ? option : option?.text || '';
            return (
              <label
                key={idx}
                className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer text-xs font-medium transition-all ${
                  answer === optText
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-400'
                    : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 hover:border-emerald-300'
                }`}
              >
                <input
                  type="radio"
                  name={activity.id}
                  checked={answer === optText}
                  onChange={() => setAnswer(optText)}
                  className="accent-emerald-600"
                />
                <span>{optText}</span>
              </label>
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
      <div className="grid gap-2">
        {(content.options || []).map((option: any, idx: number) => {
          const optText = typeof option === 'string' ? option : option?.text || '';
          const isChecked = Array.isArray(answer) && answer.includes(optText);
          return (
            <label
              key={idx}
              className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer text-xs font-medium transition-all ${
                isChecked
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-400'
                  : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 hover:border-emerald-300'
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
                className="accent-emerald-600 h-4 w-4 rounded"
              />
              <span>{optText}</span>
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

        <div className="grid gap-2">
          {(content.options || []).map((option: any, idx: number) => {
            const optText = typeof option === 'string' ? option : option?.text || '';
            const isSelected = answer === optText;
            return (
              <label
                key={idx}
                className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer text-xs font-medium transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-400'
                    : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 hover:border-emerald-300'
                }`}
              >
                <input
                  type="radio"
                  name={activity.id}
                  checked={isSelected}
                  onChange={() => setAnswer(optText)}
                  className="accent-emerald-600"
                />
                <span>{optText}</span>
              </label>
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
            ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 ring-2 ring-emerald-400'
            : selectedWords.length === 0
            ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60'
            : 'border-emerald-300 dark:border-emerald-900 bg-white dark:bg-slate-900'
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm cursor-grab active:cursor-grabbing hover:bg-emerald-700 transition-all select-none animate-in zoom-in-95 duration-100"
              title="Drag to reorder, or click × to remove"
            >
              <span>{word}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeToken(i);
                }}
                className="h-4 w-4 rounded-full bg-emerald-800/80 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] leading-none transition-colors"
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
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-slate-700 cursor-grab active:cursor-grabbing hover:-translate-y-0.5'
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
            className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm cursor-grab active:cursor-grabbing hover:border-emerald-400 transition-all text-xs font-medium"
          >
            <div className="flex items-center gap-2.5">
              <span className="h-6 w-6 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-mono font-bold text-xs shrink-0">
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

