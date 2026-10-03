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

  const [showResourcesList, setShowResourcesList] = useState(false);

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
    <div className="flex h-[100dvh] max-h-[100dvh] w-full flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Compact Top Navigation Bar */}
      <header className="h-14 shrink-0 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/95 px-3 sm:px-5 backdrop-blur-md z-30">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleExitPreview}
            className="h-8 px-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl gap-1.5 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{isTeacherOrAdmin ? 'Exit Preview' : 'Back'}</span>
          </Button>

          <div className="h-5 w-px bg-slate-800 shrink-0" />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                Interactive Video
              </span>
              {isTeacherOrAdmin && (
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-semibold">
                  <Sparkles className="h-2.5 w-2.5" /> Preview Mode
                </span>
              )}
            </div>
            <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-md lg:max-w-xl">
              {data.lessonTitle || 'Interactive Lesson'}
            </h1>
          </div>
        </div>

        {/* Right Actions: PDF Resources & Progress */}
        <div className="flex items-center gap-2.5 shrink-0">
          {data.resources && data.resources.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowResourcesList(true)}
              className="h-8 px-2.5 sm:px-3 text-xs font-semibold gap-1.5 rounded-xl border-slate-700 bg-slate-800/90 text-slate-200 hover:bg-slate-700 hover:text-white"
            >
              <FileText className="h-3.5 w-3.5 text-blue-400" />
              <span>PDFs ({data.resources.length})</span>
            </Button>
          )}

          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700/60">
            <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">Progress</span>
            <span className="text-xs font-bold text-emerald-400">
              {Math.round(data.progress?.completionPercent || 0)}%
            </span>
          </div>
        </div>
      </header>

      {/* Main Studio Canvas - Takes 100% remaining viewport height without vertical scroll */}
      <main className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden flex flex-col justify-start p-2 sm:p-4 w-full max-w-[1700px] mx-auto">
        {!data.videoUrl ? (
          <Card className="m-auto p-12 text-center border-dashed border-slate-800 bg-slate-900 rounded-3xl max-w-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
              <Video className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-white">No Video Configured Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
              This lesson does not have a video URL or interactive checkpoints configured yet.
            </p>
            <Button variant="outline" size="sm" onClick={handleExitPreview} className="text-xs font-bold">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to Curriculum
            </Button>
          </Card>
        ) : (
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
        )}
      </main>

      {/* Lesson PDF Resources Dialog Modal */}
      {showResourcesList && data.resources && data.resources.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#F3F7FC] dark:bg-blue-950/50 text-[#006EF3] border border-blue-200 dark:border-blue-800">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Lesson PDF Resources ({data.resources.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Handouts, worksheets, and reference PDF materials for this lesson.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResourcesList(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-3 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.resources.map((res: LessonResource) => {
                  const canDownload = Boolean(res.canDownload);
                  return (
                    <div
                      key={res.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-white dark:hover:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <ResourceTypeBadge
                            resource={res}
                            onClick={() => {
                              setShowResourcesList(false);
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
                              setShowResourcesList(false);
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
                          className="flex-1 h-7 text-xs font-semibold gap-1 hover:border-blue-300 hover:text-[#006EF3] dark:hover:text-blue-400"
                          onClick={() => {
                            setShowResourcesList(false);
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
        isTeacher={isTeacherOrAdmin}
      />
    </div>
  );
}

