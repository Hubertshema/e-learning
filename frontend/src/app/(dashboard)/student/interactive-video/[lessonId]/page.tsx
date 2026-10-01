'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { InteractiveVideoPlayer } from '@/components/interactive-video/interactive-video-player';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Video, ArrowLeft, Edit2, AlertCircle, Sparkles, FileText, Download, Lock, Eye, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import {
  ResourcePreviewModal,
  ResourceTypeBadge,
  LessonResource,
} from '@/components/resources/resource-preview-modal';

export default function StudentInteractiveVideoPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [previewResource, setPreviewResource] = useState<LessonResource | null>(null);

  const lastSavedPosRef = useRef<number>(-1);
  const saveTimeoutRef = useRef<any>(null);

  const handleProgress = (position: number, watched: number, percent: number) => {
    const roundedPos = Math.round(position);
    if (Math.abs(roundedPos - lastSavedPosRef.current) < 2) return;
    lastSavedPosRef.current = roundedPos;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      apiClient
        .post(`/student/interactive-videos/lessons/${lessonId}/progress`, {
          lastPositionSeconds: roundedPos,
          watchedSeconds: Math.round(watched),
          completionPercent: Math.round(percent),
        })
        .catch(() => undefined);
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#006EF3] border-t-transparent" />
        <p className="text-xs font-semibold text-slate-500">Loading interactive lesson…</p>
      </div>
    );
  }

  const handleExitPreview = () => {
    if (typeof window !== 'undefined' && window.opener) {
      try {
        window.close();
        return;
      } catch {}
    }
    if (data?.courseId) {
      router.push(`/studio/${data.courseId}`);
      return;
    }
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/teacher/courses');
  };

  if (error) {
    return (
      <div className="mx-auto max-w-lg p-10 mt-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-950/50">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Lesson Unavailable</h2>
        <p className="mt-1 text-xs text-slate-500">{error}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" size="sm" onClick={handleExitPreview} className="text-xs">
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
            onClick={handleExitPreview}
            className="h-7 text-xs border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200 font-bold hover:bg-amber-100 dark:hover:bg-slate-800"
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
          <Button variant="outline" size="sm" onClick={handleExitPreview} className="text-xs font-bold">
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
            isLessonCompleted={data.progress?.status === 'COMPLETED'}
            onProgress={handleProgress}
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

          {/* Lesson Resources Section */}
          {((data.resources && data.resources.length > 0) || isTeacherOrAdmin) && (
            <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#F3F7FC] dark:bg-blue-950/50 text-[#006EF3] border border-blue-200 dark:border-blue-800">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Lesson PDF Resources
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {data.resources?.length || 0}
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Study handouts, worksheets, and reference PDF materials uploaded for this lesson.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> Click PDF badge to preview
                  </span>
                </div>
              </div>

              {!data.resources || data.resources.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                  No PDF resources uploaded for this lesson yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.resources.map((res: LessonResource) => {
                    const canDownload = Boolean(res.canDownload);

                    return (
                      <div
                        key={res.id}
                        className="group p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-white dark:hover:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            {/* Clickable PDF Badge */}
                            <ResourceTypeBadge
                              resource={res}
                              onClick={() => setPreviewResource(res)}
                              className="hover:scale-105 active:scale-95 transition-transform"
                            />

                            {/* Download Permission Status */}
                            {canDownload ? (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#006EF3] dark:text-blue-400"
                                title="Downloads allowed"
                              >
                                <CheckCircle2 className="h-3 w-3" /> Downloadable
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400"
                                title="Downloads restricted by teacher (View Only)"
                              >
                                <Lock className="h-3 w-3" /> View Only
                              </span>
                            )}
                          </div>

                          <div>
                            <h4
                              className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 cursor-pointer hover:text-[#006EF3] dark:hover:text-blue-400 transition-colors"
                              onClick={() => setPreviewResource(res)}
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

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-7 text-xs font-semibold gap-1 hover:border-blue-300 hover:text-[#006EF3] dark:hover:text-blue-400"
                            onClick={() => setPreviewResource(res)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Preview PDF
                          </Button>

                          {canDownload && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2.5 text-xs font-semibold gap-1 text-[#006EF3] hover:bg-[#F3F7FC] dark:text-blue-400 dark:hover:bg-blue-950/50"
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
                              <span className="hidden sm:inline">Save PDF</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </>
      )}

      {/* In-App Resource Preview Modal */}
      <ResourcePreviewModal
        resource={previewResource}
        isOpen={Boolean(previewResource)}
        onClose={() => setPreviewResource(null)}
        isTeacher={isTeacherOrAdmin}
      />
    </main>
  );
}

