'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { InteractiveVideoPlayer } from '@/components/interactive-video/interactive-video-player';

export default function StudentInteractiveVideoPage() {
  const { lessonId } = useParams<{ lessonId: string }>(); const [data, setData] = useState<any>(null); const [error, setError] = useState('');
  useEffect(() => { apiClient.get<any>(`/student/interactive-videos/lessons/${lessonId}`).then(setData).catch((e) => setError(e.message || 'This lesson is unavailable.')); }, [lessonId]);
  if (error) return <div className="mx-auto max-w-xl p-12 text-center text-sm text-rose-600">{error}</div>;
  if (!data) return <div className="p-8 text-sm text-slate-500">Loading lesson…</div>;
  return <main className="mx-auto max-w-6xl space-y-5 p-4 md:p-8"><header><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Interactive English lesson</p><h1 className="mt-1 text-2xl font-bold">{data.lessonTitle}</h1><p className="text-sm text-slate-500">Watch, listen and complete each checkpoint to build your skills.</p></header><InteractiveVideoPlayer lessonId={lessonId} videoUrl={data.videoUrl} durationSeconds={data.durationSeconds} navigationMode={data.navigationMode} activities={data.activities} transcript={data.transcript} initialPosition={data.progress?.lastPositionSeconds || 0} onProgress={(position, watched, percent) => { if (Math.round(position) % 10 === 0) apiClient.post(`/student/interactive-videos/lessons/${lessonId}/progress`, { lastPositionSeconds: Math.round(position), watchedSeconds: Math.round(watched), completionPercent: percent }).catch(() => undefined); }} /><section className="rounded-2xl border bg-white p-5 shadow-sm"><h2 className="font-bold">Lesson progress</h2><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-emerald-600 transition-all" style={{ width: `${data.progress?.completionPercent || 0}%` }} /></div><p className="mt-2 text-xs text-slate-500">{Math.round(data.progress?.completionPercent || 0)}% complete · Your position is saved automatically</p></section></main>;
}
