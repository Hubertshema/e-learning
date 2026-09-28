'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { InteractiveVideoPlayer } from '@/components/interactive-video/interactive-video-player';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Video, ArrowLeft, Edit2, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export default function StudentInteractiveVideoPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lessonId) return;
    setLoading(true);
    apiClient
      .get<any>(`/student/interactive-videos/lessons/${lessonId}`)
      .then((res: any) => {
        setData(res?.data || res);
        setError('');
      })
      .catch((e) => {
        setError(e.message || 'This interactive video lesson is unavailable.');
      })
      .finally(() => setLoading(false));
  }, [lessonId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        <p className="text-xs font-semibold text-slate-500">Loading interactive lesson…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg p-10 mt-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-950/50">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Lesson Unavailable</h2>
        <p className="mt-1 text-xs text-slate-500">{error}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="text-xs">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'SUPERADMIN';

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      {/* Teacher Preview Banner */}
      {isTeacherOrAdmin && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="font-semibold">
              Preview Mode · You are previewing this lesson as enrolled students see it.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.back()}
            className="h-7 text-xs border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200"
          >
            Exit Preview
          </Button>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
            Interactive Video Lesson
          </p>
          <h1 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {data.lessonTitle || 'Interactive Lesson'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Watch, listen, and interact with checkpoints to master the core concepts.
          </p>
        </div>
      </header>

      {/* Video Player or Empty State */}
      {!data.videoUrl ? (
        <Card className="p-12 text-center border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
            <Video className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Video Configured Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            This lesson does not have a video URL or interactive checkpoints configured yet.
          </p>
          <Button variant="outline" size="sm" onClick={() => router.back()} className="text-xs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to Curriculum
          </Button>
        </Card>
      ) : (
        <>
          <InteractiveVideoPlayer
            lessonId={lessonId}
            videoUrl={data.videoUrl}
            durationSeconds={data.durationSeconds}
            navigationMode={data.navigationMode}
            activities={data.activities || []}
            transcript={data.transcript || []}
            captions={data.captions || []}
            initialPosition={data.progress?.lastPositionSeconds || 0}
            initialWatched={data.progress?.watchedSeconds || 0}
            completedActivityIds={data.completedActivityIds || []}
            isTeacher={false}
            onProgress={(position, watched, percent) => {
              if (Math.round(position) % 10 === 0) {
                apiClient
                  .post(`/student/interactive-videos/lessons/${lessonId}/progress`, {
                    lastPositionSeconds: Math.round(position),
                    watchedSeconds: Math.round(watched),
                    completionPercent: percent,
                  })
                  .catch(() => undefined);
              }
            }}
          />

          {/* Progress Card */}
          <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Lesson Progress</h2>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {Math.round(data.progress?.completionPercent || 0)}%
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-500 transition-all duration-300"
                style={{ width: `${data.progress?.completionPercent || 0}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Your checkpoint scores and playback position are saved automatically.
            </p>
          </section>
        </>
      )}
    </main>
  );
}

