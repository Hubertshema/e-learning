'use client';

import { useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Clock, Pause, Play, RotateCcw, Volume2, Sparkles } from 'lucide-react';
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
  navigationMode = 'FREE',
  onProgress,
}: {
  lessonId: string;
  videoUrl: string;
  durationSeconds?: number;
  activities?: VideoActivity[];
  transcript?: Array<{ time: number; text: string }>;
  captions?: Array<{ time: number; text: string }>;
  initialPosition?: number;
  navigationMode?: string;
  onProgress?: (position: number, watched: number, percent: number) => void;
}) {
  const videoRef = useRef<UniversalVideoHandle>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  const [detectedDuration, setDetectedDuration] = useState(durationSeconds || 0);
  const [watched, setWatched] = useState(0);
  const [active, setActive] = useState<VideoActivity | null>(null);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [answer, setAnswer] = useState<any>('');
  const [feedback, setFeedback] = useState<any>(null);
  const [speed, setSpeed] = useState(1);

  const totalDuration = durationSeconds && durationSeconds > 0 ? durationSeconds : detectedDuration;
  const isYouTube = !!getYouTubeId(videoUrl);

  const handleTimeUpdate = (current: number) => {
    setPosition(current);
    setWatched((value) => Math.max(value, current));

    // Check for interactive checkpoints
    const next = activities.find(
      (item) =>
        item.timestampSeconds <= current + 0.5 &&
        item.timestampSeconds > current - 1.2 &&
        !completed[item.id]
    );

    if (next) {
      videoRef.current?.pause();
      setPlaying(false);
      setActive(next);
      setAnswer(next.type === 'MULTIPLE_SELECT' ? [] : '');
    }

    onProgress?.(
      current,
      Math.max(watched, current),
      totalDuration ? Math.min(100, (current / totalDuration) * 100) : 0
    );
  };

  const seek = (value: number) => {
    const next = navigationMode === 'FREE' ? value : Math.min(value, watched + 2);
    videoRef.current?.seekTo(next);
    setPosition(next);
  };

  const submit = async () => {
    if (!active) return;
    try {
      const result: any = await apiClient.post(
        `/student/interactive-videos/activities/${active.id}/attempts`,
        { answer }
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
    setActive(null);
    setFeedback(null);
    videoRef.current?.play();
    setPlaying(true);
  };

  return (
    <div className="space-y-4">
      {/* Video Container */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-950 shadow-xl border border-slate-800">
        <UniversalVideo
          ref={videoRef}
          url={videoUrl}
          controls={isYouTube}
          className="aspect-video w-full"
          initialTime={initialPosition}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onDurationChange={(dur) => setDetectedDuration(dur)}
          onTimeUpdate={handleTimeUpdate}
        />

        {/* Custom Bar for scrubbing and activity markers */}
        <div className="bg-slate-900/95 border-t border-slate-800 p-3 text-white">
          <div className="flex flex-wrap items-center gap-3">
            <button
              aria-label={playing ? 'Pause video' : 'Play video'}
              className="rounded-lg p-2 hover:bg-white/10 transition-colors"
              onClick={() => {
                if (playing) {
                  videoRef.current?.pause();
                } else {
                  videoRef.current?.play();
                }
              }}
            >
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>

            <button
              aria-label="Restart video"
              className="rounded-lg p-2 hover:bg-white/10 transition-colors"
              onClick={() => seek(0)}
            >
              <RotateCcw size={16} />
            </button>

            <input
              aria-label="Video progress"
              type="range"
              min={0}
              max={totalDuration || 100}
              value={position}
              onChange={(e) => seek(Number(e.target.value))}
              className="min-w-[120px] flex-1 accent-emerald-400 cursor-pointer"
            />

            <span className="text-xs font-mono tabular-nums text-slate-300">
              {formatVideoTime(position)} / {formatVideoTime(totalDuration || 0)}
            </span>

            <select
              aria-label="Playback speed"
              value={speed}
              onChange={(e) => {
                const s = Number(e.target.value);
                setSpeed(s);
                videoRef.current?.setPlaybackRate?.(s);
              }}
              className="rounded-lg bg-slate-800 px-2 py-1 text-xs text-white outline-none border border-slate-700"
            >
              <option value={0.75}>0.75×</option>
              <option value={1}>1×</option>
              <option value={1.25}>1.25×</option>
              <option value={1.5}>1.5×</option>
            </select>
          </div>

          {/* Interactive Checkpoint Markers */}
          {activities.length > 0 && totalDuration > 0 && (
            <div className="mt-2.5 relative w-full h-3 flex items-center bg-slate-800/80 rounded-full px-1">
              {activities.map((item) => {
                const leftPercent = Math.min(100, Math.max(0, (item.timestampSeconds / totalDuration) * 100));
                const isDone = !!completed[item.id];
                return (
                  <button
                    key={item.id}
                    aria-label={`Activity at ${formatVideoTime(item.timestampSeconds)}`}
                    onClick={() => seek(item.timestampSeconds)}
                    style={{ left: `${leftPercent}%` }}
                    className={`absolute -translate-x-1/2 h-3 w-3 rounded-full border-2 transition-transform hover:scale-125 ${
                      isDone
                        ? 'bg-emerald-400 border-emerald-200'
                        : 'bg-amber-400 border-amber-200 shadow-xs'
                    }`}
                    title={`${item.title} (${formatVideoTime(item.timestampSeconds)})`}
                  />
                );
              })}
            </div>
          )}
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
              className={`mt-4 rounded-xl p-3 text-xs md:text-sm font-medium ${
                feedback.isCorrect
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <strong>{feedback.isCorrect ? 'Correct! 🎉' : 'Not quite yet.'}</strong>{' '}
              {feedback.feedback}
              {feedback.explanation && <p className="mt-1 opacity-90">{feedback.explanation}</p>}
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            {feedback && (feedback.isCorrect || active.allowRetry === false) ? (
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
    const rawTokens =
      typeof content.tokens === 'string'
        ? content.tokens.split(',').map((t: string) => t.trim()).filter(Boolean)
        : Array.isArray(content.tokens)
        ? content.tokens
        : [];
    const selectedWords: string[] = Array.isArray(answer) ? answer : [];

    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          Tap words in the correct order to construct the sentence:
        </p>
        <div className="min-h-12 p-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap gap-1.5 items-center">
          {selectedWords.length === 0 ? (
            <span className="text-xs text-slate-400 italic">Constructed sentence will appear here...</span>
          ) : (
            selectedWords.map((word, i) => (
              <span
                key={i}
                onClick={() => setAnswer(selectedWords.filter((_, idx) => idx !== i))}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs cursor-pointer hover:bg-rose-100 hover:text-rose-800"
                title="Tap to remove"
              >
                {word} ×
              </span>
            ))
          )}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {rawTokens.map((token: string, idx: number) => {
            const usedCount = selectedWords.filter((w) => w === token).length;
            const availableCount = rawTokens.filter((t: string) => t === token).length;
            const isExhausted = usedCount >= availableCount;

            return (
              <button
                key={idx}
                type="button"
                disabled={isExhausted}
                onClick={() => setAnswer([...selectedWords, token])}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                  isExhausted
                    ? 'opacity-30 border-slate-200 bg-slate-100 cursor-not-allowed'
                    : 'border-slate-300 bg-white hover:border-emerald-400 hover:bg-emerald-50 dark:bg-slate-800 dark:border-slate-700'
                }`}
              >
                {token}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 7. ORDERING
  if (activity.type === 'ORDERING') {
    const items = content.items || [];
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          Review the sequential order:
        </p>
        <div className="space-y-1.5">
          {items.map((item: string, idx: number) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium"
            >
              <span className="h-5 w-5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-mono font-bold text-[10px]">
                {idx + 1}
              </span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 8. MATCHING
  if (activity.type === 'MATCHING') {
    const pairs = content.pairs || [];
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          Match each item on the left with its partner:
        </p>
        <div className="space-y-2">
          {pairs.map((pair: any, idx: number) => (
            <div
              key={idx}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
            >
              <span className="font-bold text-slate-800 dark:text-slate-200">{pair.left}</span>
              <span className="text-slate-400 font-bold">↔</span>
              <span className="font-medium text-emerald-700 dark:text-emerald-400">{pair.right}</span>
            </div>
          ))}
        </div>
      </div>
    );
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

