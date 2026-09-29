'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  Layers,
  Sparkles,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Video,
  Edit2,
  AlertCircle,
  ExternalLink,
  BookOpen,
  Download,
  Play,
  Volume2,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { InteractiveVideoPlayer } from '@/components/interactive-video/interactive-video-player';
import { RichTextRenderer } from '@/components/ui/rich-text-editor';
import {
  ResourcePreviewModal,
  LessonResource,
} from '@/components/resources/resource-preview-modal';

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
  skills?: string[] | string;
  type?: string;
  estimatedMinutes?: number;
  orderIndex?: number;
  isPublished?: boolean;
  isFreePreview?: boolean;
  sections?: LessonSection[];
}

interface Unit {
  id: string;
  title: string;
  description?: string;
  orderIndex?: number;
  lessons: Lesson[];
}

interface CourseData {
  id: string;
  title: string;
  description?: string;
  level: string;
  isPublished?: boolean;
  units: Unit[];
}

export default function StudioCoursePreviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const targetLessonId = searchParams.get('lessonId') || searchParams.get('lesson');

  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [collapsedUnits, setCollapsedUnits] = useState<Record<string, boolean>>({});

  // Interactive video state for selected lesson
  const [interactiveVideoData, setInteractiveVideoData] = useState<any>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [previewResource, setPreviewResource] = useState<LessonResource | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load Course Details
  useEffect(() => {
    if (!courseId) return;
    const fetchCourse = async () => {
      try {
        setLoading(true);
        // Try teacher course endpoint first, fallback to student endpoint
        let res: any;
        try {
          res = await apiClient.get<CourseData>(`/teacher/courses/${courseId}`);
        } catch {
          res = await apiClient.get<CourseData>(`/student/courses/${courseId}`);
        }

        const courseData = (res as any)?.data?.course || (res as any)?.data || (res as any)?.course || res;
        if (courseData) {
          setCourse(courseData);

          const allLessons = (courseData.units || []).flatMap((u: Unit) => u.lessons || []);
          let initialLesson: Lesson | undefined;
          if (targetLessonId) {
            initialLesson = allLessons.find((l: Lesson) => l.id === targetLessonId);
          }
          if (!initialLesson && allLessons.length > 0) {
            initialLesson = allLessons[0];
          }
          if (initialLesson) {
            setSelectedLesson(initialLesson);
          }
        }
      } catch (err) {
        console.error('Failed to load course preview data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId, targetLessonId]);

  // Load Interactive Video Data whenever selectedLesson changes
  useEffect(() => {
    if (!selectedLesson) {
      setInteractiveVideoData(null);
      return;
    }

    const fetchVideoData = async () => {
      try {
        setLoadingVideo(true);
        // Fetch teacher interactive video lesson details
        const res: any = await apiClient.get(
          `/teacher/interactive-videos/lessons/${selectedLesson.id}`
        );
        const data = res?.data || res;
        if (data && data.videoUrl) {
          setInteractiveVideoData(data);
        } else {
          setInteractiveVideoData(null);
        }
      } catch {
        // Fallback: check if lesson sections contain a video
        setInteractiveVideoData(null);
      } finally {
        setLoadingVideo(false);
      }
    };

    fetchVideoData();
  }, [selectedLesson?.id]);

  // Flattened lesson list for prev / next navigation
  const allLessons = useMemo(() => {
    if (!course?.units) return [];
    return course.units.flatMap((u) => u.lessons || []);
  }, [course]);

  const currentIndex = allLessons.findIndex((l) => l.id === selectedLesson?.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const toggleUnitCollapse = (unitId: string) => {
    setCollapsedUnits((prev) => ({
      ...prev,
      [unitId]: !prev[unitId],
    }));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Loading Course Preview Simulator…
        </p>
      </div>
    );
  }

  if (!course) {
    return (
      <Card className="max-w-md mx-auto mt-12 p-8 text-center space-y-4 rounded-3xl border-slate-200 dark:border-slate-800">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Course Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">
            Unable to load course preview. Please check the course ID or return to your studio.
          </p>
        </div>
        <div className="pt-2 flex justify-center gap-2">
          <Link href={`/studio/${courseId}`}>
            <Button size="sm" variant="gradient">
              <Layers className="h-3.5 w-3.5 mr-1.5" />
              Curriculum Studio
            </Button>
          </Link>
          <Link href="/teacher/courses">
            <Button size="sm" variant="outline">
              Courses
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* ── TOP PREVIEW SIMULATOR BANNER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-emerald-100/40 to-teal-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/30 border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-emerald-950 dark:text-emerald-200">
                Course Preview Simulator
              </h2>
              <span className="rounded-full bg-emerald-200/70 dark:bg-emerald-800/60 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
                Sandbox Mode
              </span>
            </div>
            <p className="text-xs text-emerald-800/80 dark:text-emerald-300/70 mt-0.5">
              Viewing <strong>{course.title}</strong> as an enrolled student. No student grades or records will be affected.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={toggleFullscreen}
            className="text-xs h-8 px-2.5 bg-white/80 dark:bg-slate-900 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5 mr-1" /> : <Maximize2 className="h-3.5 w-3.5 mr-1" />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </Button>

          <Link href={`/studio/${courseId}`}>
            <Button
              size="sm"
              variant="gradient"
              className="text-xs h-8 px-3 font-bold shadow-xs"
              title="Return to Studio Editor"
            >
              <Layers className="h-3.5 w-3.5 mr-1.5" />
              <span>Studio Editor</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ── MAIN PREVIEW WORKSPACE (Curriculum Drawer + Active Lesson) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT SYLLABUS ACCORDION (Col 4) */}
        <div className="lg:col-span-4 space-y-3">
          <Card className="p-4 rounded-3xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Curriculum Syllabus
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                {allLessons.length} {allLessons.length === 1 ? 'Lesson' : 'Lessons'}
              </span>
            </div>

            {/* Units & Lessons List */}
            <div className="space-y-2 mt-3 max-h-[70vh] overflow-y-auto pr-1">
              {(course.units || []).length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No units available in this course.
                </div>
              ) : (
                course.units.map((unit, uIdx) => {
                  const unitLessons = unit.lessons || [];
                  const isCollapsed = !!collapsedUnits[unit.id];

                  return (
                    <div
                      key={unit.id}
                      className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40"
                    >
                      {/* Unit Header Button */}
                      <button
                        type="button"
                        onClick={() => toggleUnitCollapse(unit.id)}
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isCollapsed ? (
                            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          )}
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            Unit {uIdx + 1}: {unit.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 shrink-0 ml-1">
                          {unitLessons.length} lessons
                        </span>
                      </button>

                      {/* Lessons list inside Unit */}
                      {!isCollapsed && (
                        <div className="p-1.5 space-y-1 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                          {unitLessons.length === 0 ? (
                            <p className="text-[11px] text-slate-400 px-3 py-2 italic">
                              No lessons in this unit
                            </p>
                          ) : (
                            unitLessons.map((lesson, lIdx) => {
                              const isSelected = selectedLesson?.id === lesson.id;
                              return (
                                <button
                                  key={lesson.id}
                                  onClick={() => setSelectedLesson(lesson)}
                                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all ${
                                    isSelected
                                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                                      : 'text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800/80 hover:text-emerald-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate min-w-0">
                                    <span
                                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${
                                        isSelected
                                          ? 'bg-white/20 text-white'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                      }`}
                                    >
                                      {lIdx + 1}
                                    </span>
                                    <span className="truncate">{lesson.title}</span>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0 ml-1.5">
                                    {lesson.skill && (
                                      <span
                                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md ${
                                          isSelected
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                        }`}
                                      >
                                        {lesson.skill}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT ACTIVE LESSON STAGE (Col 8) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedLesson ? (
            <>
              {/* Active Lesson Header Info */}
              <Card className="p-5 sm:p-6 rounded-3xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedLesson.skill && (
                        <Badge variant="indigo" className="font-bold text-[11px] uppercase">
                          {selectedLesson.skill}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[11px] flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {selectedLesson.estimatedMinutes || 30} mins
                      </Badge>
                      {selectedLesson.isPublished && (
                        <Badge variant="success" className="text-[11px]">
                          Published
                        </Badge>
                      )}
                    </div>

                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                      {selectedLesson.title}
                    </h1>

                    {selectedLesson.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {selectedLesson.description}
                      </p>
                    )}
                  </div>

                  {/* Actions for Teacher in Preview */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/studio/${courseId}/lessons/video/${selectedLesson.id}/editor`}
                      target="_blank"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 px-2.5 font-bold hover:text-emerald-700 hover:border-emerald-300"
                        title="Open interactive video editor in a new tab"
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                        <span>Edit Lesson</span>
                      </Button>
                    </Link>

                    <Link
                      href={`/student/interactive-video/${selectedLesson.id}`}
                      target="_blank"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 px-2.5 font-bold hover:text-primary-700"
                        title="Open standalone student player"
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        <span>Student Tab</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>

              {/* Main Player Component */}
              {loadingVideo ? (
                <Card className="p-16 text-center rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
                  <p className="text-xs font-semibold text-slate-500">
                    Loading lesson video & checkpoint questions…
                  </p>
                </Card>
              ) : interactiveVideoData && interactiveVideoData.videoUrl ? (
                <div className="space-y-4">
                  <Card className="overflow-hidden rounded-3xl border-slate-200/90 dark:border-slate-800 bg-black shadow-lg">
                    <InteractiveVideoPlayer
                      lessonId={selectedLesson.id}
                      videoUrl={interactiveVideoData.videoUrl}
                      durationSeconds={interactiveVideoData.durationSeconds || 0}
                      activities={interactiveVideoData.activities || []}
                      transcript={interactiveVideoData.transcript || []}
                      navigationMode="FREE"
                      isTeacher={true}
                    />
                  </Card>

                  {/* Attached Handouts / PDF Resources */}
                  {interactiveVideoData.resources && interactiveVideoData.resources.length > 0 && (
                    <Card className="p-5 rounded-3xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-emerald-600" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Handouts & Learning Resources ({interactiveVideoData.resources.length})
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {interactiveVideoData.resources.map((res: LessonResource) => (
                          <div
                            key={res.id}
                            className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:border-emerald-300 transition-all"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 font-bold text-xs">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {res.title}
                                </p>
                                <p className="text-[10px] text-slate-400 uppercase font-semibold">
                                  {res.resourceType || 'DOCUMENT'}
                                </p>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setPreviewResource(res)}
                              className="h-7 px-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50"
                              title="Preview Document"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              Preview
                            </Button>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              ) : selectedLesson.sections && selectedLesson.sections.length > 0 ? (
                /* Lesson Sections (HTML / Rich Text / Audio) */
                <Card className="p-6 rounded-3xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
                  {selectedLesson.sections.map((sec, sIdx) => (
                    <div key={sec.id || sIdx} className="space-y-3 pb-6 border-b border-slate-100 dark:border-slate-800 last:border-b-0 last:pb-0">
                      {sec.title && (
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {sec.title}
                        </h3>
                      )}

                      {sec.mediaUrl && (
                        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                          {sec.mediaUrl.endsWith('.mp3') || sec.mediaUrl.endsWith('.wav') ? (
                            <audio controls className="w-full p-2" src={sec.mediaUrl} />
                          ) : (
                            <video controls className="w-full max-h-[400px] bg-black" src={sec.mediaUrl} />
                          )}
                        </div>
                      )}

                      {sec.content && (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed">
                          <RichTextRenderer content={sec.content} />
                        </div>
                      )}
                    </div>
                  ))}
                </Card>
              ) : (
                <Card className="p-12 text-center rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    <Video className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      No video or content configured
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      This lesson does not have a video attached yet. You can attach a video and configure checkpoints in the Video Studio.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link href={`/studio/${courseId}/lessons/video/${selectedLesson.id}/editor`}>
                      <Button size="sm" variant="gradient">
                        <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                        Configure Video & Checkpoints
                      </Button>
                    </Link>
                  </div>
                </Card>
              )}

              {/* Bottom Next / Prev Lesson Navigation */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800">
                {prevLesson ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedLesson(prevLesson)}
                    className="text-xs rounded-xl"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    <span>Previous: {prevLesson.title}</span>
                  </Button>
                ) : (
                  <div />
                )}

                {nextLesson && (
                  <Button
                    size="sm"
                    variant="gradient"
                    onClick={() => setSelectedLesson(nextLesson)}
                    className="text-xs rounded-xl font-bold shadow-xs"
                  >
                    <span>Next: {nextLesson.title}</span>
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </>
          ) : (
            <Card className="p-12 text-center rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <p className="text-xs text-slate-400">
                Select a lesson from the curriculum on the left to preview it.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* In-App Resource Preview Modal */}
      <ResourcePreviewModal
        resource={previewResource}
        isOpen={Boolean(previewResource)}
        onClose={() => setPreviewResource(null)}
      />
    </div>
  );
}
