'use client';

import { useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Clock, Pause, Play, RotateCcw, Volume2 } from 'lucide-react';

export type VideoActivity = {
  id: string; timestampSeconds: number; type: string; title: string;
  instructions?: string; content: any; points: number; required: boolean;
  explanation?: string; feedback?: string; allowRetry?: boolean;
};

export function formatVideoTime(seconds: number) {
  const value = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}

export function InteractiveVideoPlayer({ lessonId, videoUrl, durationSeconds, activities = [],
  transcript = [], captions = [], initialPosition = 0, navigationMode = 'FREE', onProgress }: {
  lessonId: string; videoUrl: string; durationSeconds?: number; activities?: VideoActivity[];
  transcript?: Array<{ time: number; text: string }>; captions?: Array<{ time: number; text: string }>;
  initialPosition?: number; navigationMode?: string; onProgress?: (position: number, watched: number, percent: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  const [watched, setWatched] = useState(0);
  const [active, setActive] = useState<VideoActivity | null>(null);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [answer, setAnswer] = useState<any>('');
  const [feedback, setFeedback] = useState<any>(null);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTime = () => {
      const current = video.currentTime;
      setPosition(current);
      setWatched((value) => Math.max(value, current));
      const next = activities.find((item) => item.timestampSeconds <= current + 0.5 &&
        item.timestampSeconds > current - 1.2 && !completed[item.id]);
      if (next) { video.pause(); setPlaying(false); setActive(next); setAnswer(next.type === 'MULTIPLE_SELECT' ? [] : ''); }
      onProgress?.(current, Math.max(watched, current), durationSeconds ? Math.min(100, current / durationSeconds * 100) : 0);
    };
    video.addEventListener('timeupdate', onTime);
    return () => video.removeEventListener('timeupdate', onTime);
  }, [activities, completed, durationSeconds, onProgress, watched]);

  const seek = (value: number) => {
    const next = navigationMode === 'FREE' ? value : Math.min(value, watched + 2);
    if (videoRef.current) videoRef.current.currentTime = next;
    setPosition(next);
  };
  const submit = async () => {
    if (!active) return;
    try {
      const result: any = await apiClient.post(`/student/interactive-videos/activities/${active.id}/attempts`, { answer });
      setFeedback(result); if (result.isCorrect || active.allowRetry === false) setCompleted((v) => ({ ...v, [active.id]: true }));
    } catch (error: any) { setFeedback({ feedback: error.message || 'Could not submit your answer.' }); }
  };
  const continueVideo = () => { setActive(null); setFeedback(null); if (videoRef.current) { videoRef.current.play(); setPlaying(true); } };

  return <div className="space-y-4">
    <div className="relative overflow-hidden rounded-2xl bg-slate-950 shadow-xl">
      <video ref={videoRef} src={videoUrl} poster="" preload="metadata" className="aspect-video w-full"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onLoadedMetadata={(e) => {
          if (initialPosition) e.currentTarget.currentTime = initialPosition;
        }} />
      <div className="flex flex-wrap items-center gap-3 bg-slate-900 p-3 text-white">
        <button aria-label={playing ? 'Pause video' : 'Play video'} className="rounded-lg p-2 hover:bg-white/10"
          onClick={() => videoRef.current?.paused ? videoRef.current.play() : videoRef.current?.pause()}>{playing ? <Pause size={18} /> : <Play size={18} />}</button>
        <button aria-label="Restart video" className="rounded-lg p-2 hover:bg-white/10" onClick={() => seek(0)}><RotateCcw size={16} /></button>
        <Volume2 size={17} />
        <input aria-label="Video progress" type="range" min={0} max={durationSeconds || 100} value={position}
          onChange={(e) => seek(Number(e.target.value))} className="min-w-[120px] flex-1 accent-emerald-400" />
        <span className="text-xs tabular-nums">{formatVideoTime(position)} / {formatVideoTime(durationSeconds || 0)}</span>
        <select aria-label="Playback speed" value={speed} onChange={(e) => { const s = Number(e.target.value); setSpeed(s); if (videoRef.current) videoRef.current.playbackRate = s; }}
          className="rounded bg-slate-800 px-2 py-1 text-xs"><option value={0.75}>0.75×</option><option value={1}>1×</option><option value={1.25}>1.25×</option><option value={1.5}>1.5×</option></select>
      </div>
      <div className="absolute bottom-14 left-4 right-4 flex gap-1">{activities.map((item) =>
        <button key={item.id} aria-label={`Activity at ${formatVideoTime(item.timestampSeconds)}`} onClick={() => seek(item.timestampSeconds)}
          className="h-2 flex-1 rounded-full bg-amber-400/80 hover:bg-amber-300" title={item.title} />)}</div>
    </div>
    {active && <Card className="border-amber-200 bg-amber-50 p-5 dark:bg-amber-950/30">
      <div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-amber-700">Interactive checkpoint · {formatVideoTime(active.timestampSeconds)}</p><h2 className="mt-1 text-lg font-bold">{active.title}</h2></div><Clock className="text-amber-600" /></div>
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">{active.instructions}</p>
      <ActivityAnswer activity={active} answer={answer} setAnswer={setAnswer} />
      {feedback && <div role="status" className={`mt-4 rounded-xl p-3 text-sm ${feedback.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-white text-slate-700'}`}>
        <strong>{feedback.isCorrect ? 'Correct!' : 'Not quite yet.'}</strong> {feedback.feedback} {feedback.explanation && <p className="mt-1">{feedback.explanation}</p>}
      </div>}
      <div className="mt-4 flex justify-end gap-2">{feedback && (feedback.isCorrect || active.allowRetry === false) ? <Button onClick={continueVideo}><CheckCircle2 className="mr-2 h-4 w-4" />Continue video</Button> : <Button onClick={submit}>Submit answer</Button>}</div>
    </Card>}
    {transcript.length > 0 && <Card className="p-5"><h3 className="mb-3 font-bold">Transcript</h3><div className="max-h-56 space-y-2 overflow-y-auto">{transcript.map((line, i) => <button key={i} onClick={() => seek(line.time)} className="flex w-full gap-3 rounded-lg p-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"><span className="w-12 shrink-0 font-mono text-xs text-emerald-700">{formatVideoTime(line.time)}</span><span>{line.text}</span></button>)}</div></Card>}
  </div>;
}

function ActivityAnswer({ activity, answer, setAnswer }: { activity: VideoActivity; answer: any; setAnswer: (v: any) => void }) {
  const content = activity.content || {};
  if (activity.type === 'TRUE_FALSE') return <div className="flex gap-3">{['true', 'false'].map((value) => <label key={value} className="flex items-center gap-2"><input type="radio" name={activity.id} checked={answer === value} onChange={() => setAnswer(value)} />{value}</label>)}</div>;
  if (['MULTIPLE_CHOICE', 'LISTENING', 'GRAMMAR', 'VOCABULARY'].includes(activity.type)) return <div className="grid gap-2">{(content.options || []).map((option: string) => <label key={option} className="flex items-center gap-2 rounded-lg border p-3"><input type="radio" name={activity.id} checked={answer === option} onChange={() => setAnswer(option)} />{option}</label>)}</div>;
  if (activity.type === 'MULTIPLE_SELECT') return <div className="grid gap-2">{(content.options || []).map((option: string) => <label key={option} className="flex items-center gap-2 rounded-lg border p-3"><input type="checkbox" checked={answer.includes(option)} onChange={(e) => setAnswer(e.target.checked ? [...answer, option] : answer.filter((x: string) => x !== option))} />{option}</label>)}</div>;
  return <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3} placeholder="Write your answer..." className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />;
}
