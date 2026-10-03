'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import {
  ArrowLeft,
  Plus,
  Settings,
  CheckCircle2,
  PlayCircle,
  Trash2,
  FileText,
  Download,
  Lock,
  Shield,
  Link2,
  ExternalLink,
  Edit2,
  Sparkles,
  Layers,
  HelpCircle,
  Eye,
  CheckSquare,
  RotateCcw,
  Volume2,
  Mic,
  BookOpen,
  Image as ImageIcon,
  Clock,
  X,
  AlertCircle,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  UniversalVideo,
  UniversalVideoHandle,
  getYouTubeId,
} from '@/components/interactive-video/universal-video';
import {
  ResourcePreviewModal,
  ResourceTypeBadge,
  LessonResource,
} from '@/components/resources/resource-preview-modal';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

const ALL_ACTIVITY_TYPES = [
  { id: 'MULTIPLE_CHOICE', label: 'Multiple Choice', category: 'Objective Quizzes', icon: '🔘', desc: 'Single correct answer from options' },
  { id: 'TRUE_FALSE', label: 'True / False', category: 'Objective Quizzes', icon: '⚖️', desc: 'Binary true or false proposition' },
];

export default function InteractiveVideoEditorPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;

  const videoRef = useRef<UniversalVideoHandle>(null);

  const [lesson, setLesson] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Video state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Editor tabs
  const [activeTab, setActiveTab] = useState<'ACTIVITIES' | 'TRANSCRIPT' | 'RESOURCES' | 'ANALYTICS'>('ACTIVITIES');
  const [editingActivity, setEditingActivity] = useState<any | null>(null);

  // Video Source / Settings Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    videoUrl: '',
    title: '',
    thumbnailUrl: '',
    cefrLevel: 'Level 1',
    skill: 'LISTENING',
    navigationMode: 'FREE',
  });
  const DEFAULT_LEVELS = [
    { id: 1, name: 'Level 1', code: 'L1', description: 'Beginner Level' },
    { id: 2, name: 'Level 2', code: 'L2', description: 'Intermediate Level' },
    { id: 3, name: 'Level 3', code: 'L3', description: 'Advanced Level' },
  ];
  const [dbLevels, setDbLevels] = useState<Array<{ id: number | string; name: string; code: string; description?: string }>>(DEFAULT_LEVELS);
  const [savingSettings, setSavingSettings] = useState(false);

  // Analytics state
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // New Resource Form & Preview
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [newResource, setNewResource] = useState({
    title: '',
    url: '',
    resourceType: 'PDF',
    canDownload: false,
  });
  const [previewResource, setPreviewResource] = useState<LessonResource | null>(null);
  const [isUploadingResource, setIsUploadingResource] = useState(false);
  const [uploadedResourceName, setUploadedResourceName] = useState('');
  const resourceFileInputRef = useRef<HTMLInputElement>(null);

  // Local Video Upload in Settings
  const [isUploadingVideoFile, setIsUploadingVideoFile] = useState(false);
  const videoSettingsFileInputRef = useRef<HTMLInputElement>(null);

  const handleVideoSettingsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingVideoFile(true);
      const formData = new FormData();
      formData.append('file', file);
      const res: any = await apiClient.upload('/upload/media', formData);
      const url = res?.url;
      if (url) {
        setSettingsForm((prev) => ({
          ...prev,
          videoUrl: url,
        }));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to upload video file');
    } finally {
      setIsUploadingVideoFile(false);
      if (videoSettingsFileInputRef.current) videoSettingsFileInputRef.current.value = '';
    }
  };

  const handleResourceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingResource(true);
      const formData = new FormData();
      formData.append('file', file);
      const res: any = await apiClient.upload('/upload/media', formData);
      const uploadedUrl = res?.url;
      if (uploadedUrl) {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        let detectedType = 'DOC';
        if (ext === 'pdf') detectedType = 'PDF';
        else if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) detectedType = 'IMAGE';
        else if (['mp4', 'webm', 'mov', 'mkv'].includes(ext)) detectedType = 'VIDEO';
        else if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext)) detectedType = 'AUDIO';

        setUploadedResourceName(file.name);
        setNewResource((prev) => ({
          ...prev,
          url: uploadedUrl,
          title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
          resourceType: detectedType,
        }));
      }
    } catch (err: any) {
      alert(err.message || 'File upload failed');
    } finally {
      setIsUploadingResource(false);
      if (resourceFileInputRef.current) resourceFileInputRef.current.value = '';
    }
  };

  // Custom Interactive Delete Modal State
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'ACTIVITY' | 'RESOURCE';
    id: string;
    title?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteResource = async (resourceId: string) => {
    const res = resources.find((r) => r.id === resourceId);
    setItemToDelete({ type: 'RESOURCE', id: resourceId, title: res?.title || 'Resource PDF' });
  };

  const [updatingResourceId, setUpdatingResourceId] = useState<string | null>(null);
  const [editingResource, setEditingResource] = useState<{
    id: string;
    title: string;
    description: string;
    canDownload: boolean;
  } | null>(null);
  const [isSavingEditResource, setIsSavingEditResource] = useState(false);

  const handleToggleResourceDownload = async (resourceId: string, currentCanDownload: boolean) => {
    const newCanDownload = !currentCanDownload;
    setUpdatingResourceId(resourceId);
    try {
      await apiClient.patch(`/teacher/interactive-videos/resources/${resourceId}`, {
        canDownload: newCanDownload,
      });
      setResources((prev) =>
        prev.map((r) => (r.id === resourceId ? { ...r, canDownload: newCanDownload } : r))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update resource download permission');
    } finally {
      setUpdatingResourceId(null);
    }
  };

  const handleSaveResourceEdit = async () => {
    if (!editingResource) return;
    setIsSavingEditResource(true);
    try {
      const res: any = await apiClient.patch(
        `/teacher/interactive-videos/resources/${editingResource.id}`,
        {
          title: editingResource.title,
          description: editingResource.description,
          canDownload: editingResource.canDownload,
        }
      );
      const updated = res?.data || res;
      setResources((prev) =>
        prev.map((r) =>
          r.id === editingResource.id
            ? { ...r, title: editingResource.title, description: editingResource.description, canDownload: editingResource.canDownload, ...updated }
            : r
        )
      );
      setEditingResource(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update resource details');
    } finally {
      setIsSavingEditResource(false);
    }
  };

  // Publishing
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    fetchLesson();
    apiClient
      .get<any[]>('/levels')
      .then((res: any) => {
        const data = Array.isArray(res) ? res : res?.data || [];
        if (data.length > 0) setDbLevels(data);
      })
      .catch(() => {});
  }, [lessonId]);

  const fetchLesson = async () => {
    try {
      const data = await apiClient.get(`/teacher/interactive-videos/lessons/${lessonId}`);
      const lessonData = (data as any).data || data;
      setLesson(lessonData);
      setActivities(lessonData.activities || []);
      setResources(lessonData.resources || []);
      setSettingsForm({
        videoUrl: lessonData.videoUrl || '',
        title: lessonData.lessonTitle || lessonData.title || '',
        thumbnailUrl: lessonData.thumbnailUrl || '',
        cefrLevel: lessonData.cefrLevel || 'B1',
        skill: lessonData.skill || 'LISTENING',
        navigationMode: lessonData.navigationMode || 'FREE',
      });
      if (lessonData.durationSeconds > 0) {
        setDuration(lessonData.durationSeconds);
      }
    } catch (err) {
      console.error('Failed to load interactive video', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVideoSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm.videoUrl.trim()) {
      alert('Please enter a valid video link.');
      return;
    }
    setSavingSettings(true);
    try {
      await apiClient.put(`/teacher/interactive-videos/lessons/${lessonId}`, {
        ...lesson,
        videoUrl: settingsForm.videoUrl.trim(),
        thumbnailUrl: settingsForm.thumbnailUrl.trim() || null,
        cefrLevel: settingsForm.cefrLevel,
        skill: settingsForm.skill,
        navigationMode: settingsForm.navigationMode,
      });
      await fetchLesson();
      setIsSettingsOpen(false);
    } catch (err: any) {
      console.error('Failed to update video settings', err);
      alert(err.message || 'Failed to update video settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleDurationChange = (dur: number) => {
    setDuration(dur);
  };

  const seekTo = (timeSeconds: number) => {
    if (videoRef.current) {
      videoRef.current.seekTo(timeSeconds);
    }
    setCurrentTime(timeSeconds);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seekTo(percent * duration);
  };

  const createInitialContentForType = (type: string) => {
    switch (type) {
      case 'MULTIPLE_CHOICE':
        return {
          options: [
            { text: '', isCorrect: true },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
          ],
        };
      case 'MULTIPLE_SELECT':
        return {
          options: [
            { text: '', isCorrect: true },
            { text: '', isCorrect: true },
            { text: '', isCorrect: false },
          ],
        };
      case 'TRUE_FALSE':
        return { correctAnswer: 'true' };
      case 'FILL_BLANK':
        return {
          sentenceTemplate: 'She usually ______ to work by bus.',
          expectedText: 'goes',
          acceptableAnswers: 'goes, travels',
        };
      case 'SHORT_ANSWER':
        return {
          expectedAnswer: '',
          keywords: '',
        };
      case 'MATCHING':
        return {
          pairs: [
            { left: 'Breakfast', right: 'Morning meal' },
            { left: 'Library', right: 'Place for books' },
          ],
        };
      case 'ORDERING':
        return {
          items: ['Step 1: Wake up', 'Step 2: Brush teeth', 'Step 3: Eat breakfast'],
        };
      case 'DRAG_DROP':
        return {
          tokens: 'She, goes, to, school, every, day',
          correctSentence: 'She goes to school every day',
        };
      case 'IMAGE':
        return {
          imageUrl: '',
          options: [
            { text: 'Option A', isCorrect: true },
            { text: 'Option B', isCorrect: false },
          ],
        };
      case 'SPEAKING':
        return {
          targetSentence: 'I usually wake up at seven o\'clock.',
          promptType: 'REPEAT',
        };
      case 'LISTENING':
        return {
          audioCue: 'Listen carefully to what the speaker says at this timestamp.',
          options: [
            { text: '', isCorrect: true },
            { text: '', isCorrect: false },
          ],
        };
      case 'VOCABULARY':
        return {
          targetWord: '',
          partOfSpeech: 'noun',
          definition: '',
          exampleSentence: '',
        };
      case 'GRAMMAR':
        return {
          grammarTopic: 'Present Simple',
          sentence: 'He ______ English every morning.',
          options: [
            { text: 'studies', isCorrect: true },
            { text: 'study', isCorrect: false },
          ],
        };
      case 'READING':
        return {
          passage: 'Read this transcript excerpt...',
          question: 'What is the main topic?',
          options: [
            { text: '', isCorrect: true },
            { text: '', isCorrect: false },
          ],
        };
      case 'WRITING':
        return {
          prompt: 'Write 2-3 sentences responding to the video prompt.',
          minWords: 15,
          guidance: 'Use correct punctuation and grammar.',
        };
      default:
        return {};
    }
  };

  const handleStartAddActivity = () => {
    setEditingActivity({
      timestampSeconds: Math.floor(currentTime),
      type: 'MULTIPLE_CHOICE',
      title: '',
      instructions: '',
      content: createInitialContentForType('MULTIPLE_CHOICE'),
      points: 1,
      required: true,
      feedback: '',
      explanation: '',
    });
    setActiveTab('ACTIVITIES');
  };

  const handleStartEditActivity = (act: any) => {
    setEditingActivity({
      ...act,
      content: act.content || createInitialContentForType(act.type),
    });
    seekTo(act.timestampSeconds);
    setActiveTab('ACTIVITIES');
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity.title.trim()) {
      alert('Question title is required.');
      return;
    }
    try {
      await apiClient.post(`/teacher/interactive-videos/lessons/${lessonId}/activities`, {
        ...editingActivity,
        timestampSeconds: Number(editingActivity.timestampSeconds) || 0,
        points: Number(editingActivity.points) || 1,
      });
      setEditingActivity(null);
      fetchLesson();
    } catch (err: any) {
      console.error('Failed to save activity', err);
      alert(err.message || 'Failed to save activity');
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    const act = activities.find((a) => a.id === activityId);
    setItemToDelete({ type: 'ACTIVITY', id: activityId, title: act?.title || 'Interactive Activity' });
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      if (itemToDelete.type === 'RESOURCE') {
        await apiClient.delete(`/teacher/interactive-videos/resources/${itemToDelete.id}`);
        setResources((prev) => prev.filter((r) => r.id !== itemToDelete.id));
        fetchLesson();
      } else {
        await apiClient.delete(`/teacher/interactive-videos/activities/${itemToDelete.id}`);
        if (editingActivity?.id === itemToDelete.id) setEditingActivity(null);
        fetchLesson();
      }
    } catch (err: any) {
      console.error('Failed to delete item:', err);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const handleTogglePublish = async () => {
    setIsPublishing(true);
    try {
      const newStatus = lesson.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      await apiClient.put(`/teacher/interactive-videos/lessons/${lessonId}`, {
        ...lesson,
        status: newStatus,
      });
      setLesson({ ...lesson, status: newStatus });
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Failed to change publish status');
    } finally {
      setIsPublishing(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ANALYTICS' && !analytics && !loadingAnalytics) {
      const fetchAnalytics = async () => {
        setLoadingAnalytics(true);
        try {
          const data = await apiClient.get(`/teacher/interactive-videos/lessons/${lessonId}/analytics`);
          setAnalytics((data as any).data || data);
        } catch (err) {
          console.error('Failed to load analytics', err);
        } finally {
          setLoadingAnalytics(false);
        }
      };
      fetchAnalytics();
    }
  }, [activeTab, analytics, loadingAnalytics, lessonId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <p className="text-xs font-semibold text-slate-500">Loading interactive video studio…</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="p-8 text-center max-w-md mx-auto mt-16">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-900">Lesson not found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">Could not load this interactive video lesson.</p>
        <Link href={`/studio/${courseId}`}>
          <Button variant="outline" size="sm">Back to Curriculum</Button>
        </Link>
      </div>
    );
  }

  const youtubeId = getYouTubeId(lesson.videoUrl);

  return (
    <div className="flex flex-col min-h-screen md:h-screen md:max-h-screen overflow-y-auto md:overflow-hidden bg-slate-50">
      {/* ── TOP HEADER ──────────────────────────────────────────────── */}
      <header className="min-h-[56px] py-2 sm:h-14 shrink-0 border-b border-slate-200 bg-white flex flex-wrap sm:flex-nowrap items-center justify-between px-3 sm:px-4 z-20 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Link href={`/studio/${courseId}`}>
            <Button variant="ghost" size="sm" className="text-slate-500 px-2 hover:bg-slate-100 h-8 text-xs shrink-0">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              <span className="hidden xs:inline">Courses</span>
            </Button>
          </Link>
          <div className="h-4 w-px bg-slate-200 shrink-0" />
          <h1 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5 truncate min-w-0">
            <PlayCircle className="h-4 w-4 text-indigo-500 shrink-0" />
            <span className="truncate">{lesson.lessonTitle || lesson.title || 'Untitled Interactive Video'}</span>
          </h1>

          {lesson.status === 'DRAFT' ? (
            <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
              DRAFT
            </span>
          ) : (
            <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-wider text-[#006EF3] bg-[#F3F7FC] border border-blue-200 px-1.5 py-0.5 rounded shrink-0">
              PUBLISHED
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Video Link / Settings Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            className="h-8 px-2.5 text-xs font-semibold border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100/60"
            title="Access, change or configure the video link"
          >
            <Link2 className="h-3.5 w-3.5 sm:mr-1.5 text-indigo-600" />
            <span className="hidden sm:inline">Video Link & Info</span>
          </Button>

          {/* Student Preview Link */}
          <Link href={`/student/interactive-video/${lessonId}`} target="_blank">
            <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs text-slate-600 hover:text-[#006EF3] hover:bg-[#F3F7FC]">
              <Eye className="h-3.5 w-3.5 sm:mr-1 text-[#006EF3]" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
          </Link>

          {/* Publish Toggle */}
          <Button
            variant={lesson.status === 'PUBLISHED' ? 'outline' : 'gradient'}
            size="sm"
            onClick={handleTogglePublish}
            disabled={isPublishing}
            className="h-8 px-3 text-xs font-bold"
          >
            {lesson.status === 'PUBLISHED' ? (
              'Unpublish'
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Publish
              </>
            )}
          </Button>
        </div>
      </header>

      {/* ── MAIN WORKSPACE ───────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col md:flex-row md:overflow-hidden">
        {/* Left Column: Video Player & Timeline */}
        <section className="flex-1 flex flex-col min-w-0 border-r border-slate-200 bg-slate-100 md:overflow-y-auto">
          {/* Active Video Info Bar */}
          <div className="px-4 py-2 bg-white border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-slate-500">Video Source:</span>
              {lesson.videoUrl ? (
                <div className="flex items-center gap-1.5 truncate">
                  {youtubeId ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold border border-rose-200 text-[11px]">
                      ▶ YouTube
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-bold border border-sky-200 text-[11px]">
                      🎬 Direct MP4
                    </span>
                  )}
                  <a
                    href={lesson.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-slate-600 hover:text-indigo-600 hover:underline truncate max-w-[140px] sm:max-w-[240px] md:max-w-[320px] flex items-center gap-1"
                    title={lesson.videoUrl}
                  >
                    {lesson.videoUrl}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </div>
              ) : (
                <span className="text-rose-500 font-medium italic">No video linked yet</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-600 text-[10px]">
                {lesson.cefrLevel || 'B1'}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-600 text-[10px]">
                {lesson.skill || 'LISTENING'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSettingsOpen(true)}
                className="h-6 px-2 text-[11px] text-indigo-600 hover:bg-indigo-50"
              >
                Change Link
              </Button>
            </div>
          </div>

          {/* Video Player Display */}
          <div className="flex-1 flex flex-col items-center justify-center bg-black/5 p-4 relative overflow-hidden">
            <div className="aspect-video w-full max-w-4xl bg-black rounded-2xl overflow-hidden relative shadow-xl border border-slate-800">
              {lesson.videoUrl ? (
                <UniversalVideo
                  ref={videoRef}
                  url={lesson.videoUrl}
                  controls
                  className="w-full h-full object-contain"
                  onTimeUpdate={handleTimeUpdate}
                  onDurationChange={handleDurationChange}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white/70">
                  <PlayCircle className="h-12 w-12 text-indigo-400 mb-2 opacity-80" />
                  <p className="text-sm font-semibold text-white">No Video Source Attached</p>
                  <p className="text-xs text-white/50 max-w-xs mt-1 mb-4">
                    Paste a YouTube link or direct video link to start designing interactive checkpoints.
                  </p>
                  <Button
                    onClick={() => setIsSettingsOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                  >
                    <Link2 className="h-3.5 w-3.5 mr-1.5" /> Configure Video Link
                  </Button>
                </div>
              )}
            </div>

            {/* Current Timestamp pill */}
            <div className="absolute top-6 left-6 bg-black/70 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full font-mono shadow-md border border-white/10">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Interactive Timeline Scrubbing Bar */}
          <div className="min-h-44 shrink-0 bg-white border-t border-slate-200 p-3 sm:p-4 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Interactive Timeline</h3>
                <p className="text-[11px] text-slate-500">
                  Click along the bar to scrub. Place checkpoints at specific timestamps.
                </p>
              </div>
              <Button
                onClick={handleStartAddActivity}
                className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white h-8 text-xs font-bold rounded-lg shadow-sm w-full sm:w-auto justify-center"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Activity at {formatTime(currentTime)}
              </Button>
            </div>

            {/* Timeline Track */}
            <div className="w-full h-20 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-center px-4 relative select-none">
              <div
                className="w-full h-3 bg-slate-200 rounded-full relative cursor-pointer"
                onClick={handleTimelineClick}
              >
                {/* Playhead progress */}
                <div
                  className="absolute left-0 top-0 h-full bg-indigo-500/40 rounded-full pointer-events-none"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />

                {/* Scrubber Knob */}
                <div
                  className="absolute top-1/2 -mt-3 w-6 h-6 bg-indigo-600 rounded-full shadow-md border-2 border-white pointer-events-none transition-all ease-out duration-75"
                  style={{ left: `calc(${duration > 0 ? (currentTime / duration) * 100 : 0}% - 12px)` }}
                />

                {/* Checkpoint Markers */}
                {activities.map((act) => {
                  const leftPercent = duration > 0 ? (act.timestampSeconds / duration) * 100 : 0;
                  const isSelected = editingActivity?.id === act.id;
                  return (
                    <div
                      key={act.id}
                      className={`absolute top-1/2 -mt-2.5 w-5 h-5 rounded-full shadow border-2 cursor-pointer transition-all hover:scale-125 z-10 ${
                        isSelected
                          ? 'bg-indigo-600 border-white ring-2 ring-indigo-400 scale-125'
                          : 'bg-amber-400 border-white'
                      }`}
                      style={{ left: `calc(${leftPercent}% - 10px)` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEditActivity(act);
                      }}
                      title={`${act.title} (${formatTime(act.timestampSeconds)})`}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block w-max bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded shadow pointer-events-none">
                        {act.title}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Time Ruler Marks */}
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-2 px-0.5">
                <span>0:00</span>
                <span>{formatTime(duration * 0.25)}</span>
                <span>{formatTime(duration * 0.5)}</span>
                <span>{formatTime(duration * 0.75)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Activities, Transcript, Resources & Analytics */}
        <aside className="w-full md:w-[420px] shrink-0 bg-white flex flex-col border-l border-slate-200 md:overflow-y-auto">
          {/* Tab Navigation */}
          <div
            className="flex overflow-x-auto border-b border-slate-200 shrink-0 bg-slate-50/50"
            style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
          >
            {(['ACTIVITIES', 'TRANSCRIPT', 'RESOURCES', 'ANALYTICS'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setEditingActivity(null);
                }}
                className={`flex-1 sm:flex-none whitespace-nowrap shrink-0 px-3.5 sm:px-4 py-3 text-xs font-bold transition-colors ${
                  activeTab === tab
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                }`}
              >
                {tab === 'ACTIVITIES' && `Activities (${activities.length})`}
                {tab === 'TRANSCRIPT' && 'Transcript'}
                {tab === 'RESOURCES' && `Resources (${resources.length})`}
                {tab === 'ANALYTICS' && 'Analytics'}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4">
            {/* ── TAB 1: ACTIVITIES ─────────────────────────────────── */}
            {activeTab === 'ACTIVITIES' && !editingActivity && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Checkpoints</h3>
                    <p className="text-[11px] text-slate-400">{activities.length} interactive questions configured</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      onClick={handleStartAddActivity}
                      className="h-8 px-3 text-xs bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold gap-1 shadow-sm"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Activity</span>
                    </Button>
                  </div>
                </div>

                {activities.length === 0 ? (
                  <div className="text-center py-16 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <HelpCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <h4 className="text-xs font-bold text-slate-700">No Interactive Questions Yet</h4>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-1 mb-4">
                      Scrub the video timeline to a desired timestamp and add a learning checkpoint.
                    </p>
                    <Button
                      size="sm"
                      onClick={handleStartAddActivity}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add First Question
                    </Button>
                  </div>
                ) : (
                  activities.map((act) => {
                    const typeDef = ALL_ACTIVITY_TYPES.find((t) => t.id === act.type);

                    return (
                      <div
                        key={act.id}
                        className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/70 hover:bg-white hover:border-indigo-300 hover:shadow-xs transition-all relative group"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <button
                            onClick={() => seekTo(act.timestampSeconds)}
                            className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200 shadow-xs hover:bg-indigo-50"
                            title="Jump video to this timestamp"
                          >
                            <Clock className="h-3 w-3 text-indigo-500" />
                            {formatTime(act.timestampSeconds)}
                          </button>
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span>{typeDef?.icon || '🔘'}</span>
                            <span>{typeDef?.label || act.type}</span>
                          </span>
                        </div>

                        <p className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                          {act.title}
                        </p>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-400">
                            {act.points || 1} pt · {act.required ? 'Required' : 'Optional'}
                          </span>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStartEditActivity(act)}
                              className="h-6 px-2 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 rounded"
                            >
                              <Edit2 className="h-3 w-3 mr-1" /> Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteActivity(act.id)}
                              className="h-6 px-2 text-[11px] font-semibold text-rose-500 hover:bg-rose-50 rounded"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── ACTIVITY EDITOR FORM (ALL 15 TYPES) ──────────────── */}
            {activeTab === 'ACTIVITIES' && editingActivity && (
              <form onSubmit={handleSaveActivity} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingActivity.id ? 'Edit Activity' : 'New Checkpoint Activity'}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingActivity(null)}
                    className="h-6 px-2 text-xs text-slate-500"
                  >
                    Cancel
                  </Button>
                </div>

                {/* Activity Type Selector with categories */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Activity / Question Type *
                  </label>
                  <select
                    className="w-full text-xs font-semibold border-slate-200 rounded-xl py-2 px-3 bg-white focus:ring-2 focus:ring-indigo-500"
                    value={editingActivity.type}
                    onChange={(e) => {
                      const type = e.target.value;
                      setEditingActivity({
                        ...editingActivity,
                        type,
                        content: createInitialContentForType(type),
                      });
                    }}
                  >
                    {ALL_ACTIVITY_TYPES.map((typeItem) => (
                      <option key={typeItem.id} value={typeItem.id}>
                        {typeItem.icon} {typeItem.label} ({typeItem.category})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {ALL_ACTIVITY_TYPES.find((t) => t.id === editingActivity.type)?.desc}
                  </p>
                </div>

                {/* Timestamp & Playhead helper */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Timestamp (seconds)</label>
                    <Input
                      type="number"
                      min={0}
                      className="h-9 text-xs font-mono w-full"
                      value={editingActivity.timestampSeconds}
                      onChange={(e) =>
                        setEditingActivity({
                          ...editingActivity,
                          timestampSeconds: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1 invisible sm:visible">Sync with video</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEditingActivity({
                          ...editingActivity,
                          timestampSeconds: Math.floor(currentTime),
                        })
                      }
                      className="h-9 w-full text-xs font-semibold text-indigo-700 bg-indigo-50/50 border-indigo-200 hover:bg-indigo-100 flex items-center justify-center gap-1.5"
                    >
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>Use Playhead ({formatTime(currentTime)})</span>
                    </Button>
                  </div>
                </div>

                {/* Question Title / Prompt */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Question / Prompt *</label>
                  <Input
                    required
                    value={editingActivity.title}
                    onChange={(e) => setEditingActivity({ ...editingActivity, title: e.target.value })}
                    placeholder="e.g. What does Sarah do every morning?"
                    className="text-xs font-medium"
                  />
                </div>

                {/* Instructions / Context (optional) */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Instructions / Hint (Optional)</label>
                  <Input
                    value={editingActivity.instructions || ''}
                    onChange={(e) =>
                      setEditingActivity({ ...editingActivity, instructions: e.target.value })
                    }
                    placeholder="e.g. Listen carefully to the conversation before answering."
                    className="text-xs"
                  />
                </div>

                {/* ── DYNAMIC TYPE-SPECIFIC CONTROLS ──────────────── */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  {/* MULTIPLE CHOICE */}
                  {editingActivity.type === 'MULTIPLE_CHOICE' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">Options (Select the correct one)</label>
                        <span className="text-[10px] text-slate-400">Radio button marks correct answer</span>
                      </div>
                      {(editingActivity.content?.options || []).map((opt: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="correct_option"
                            checked={opt.isCorrect}
                            onChange={() => {
                              const newOpts = editingActivity.content.options.map((o: any, i: number) => ({
                                ...o,
                                isCorrect: i === idx,
                              }));
                              setEditingActivity({
                                ...editingActivity,
                                content: { ...editingActivity.content, options: newOpts },
                              });
                            }}
                            className="accent-indigo-600"
                          />
                          <Input
                            className="h-8 text-xs flex-1"
                            value={opt.text}
                            onChange={(e) => {
                              const newOpts = [...editingActivity.content.options];
                              newOpts[idx].text = e.target.value;
                              setEditingActivity({
                                ...editingActivity,
                                content: { ...editingActivity.content, options: newOpts },
                              });
                            }}
                            placeholder={`Option ${idx + 1}`}
                          />
                          {(editingActivity.content?.options || []).length > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newOpts = editingActivity.content.options.filter(
                                  (_: any, i: number) => i !== idx
                                );
                                setEditingActivity({
                                  ...editingActivity,
                                  content: { ...editingActivity.content, options: newOpts },
                                });
                              }}
                              className="text-rose-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs w-full mt-1 border border-dashed border-slate-300"
                        onClick={() => {
                          const newOpts = [
                            ...(editingActivity.content?.options || []),
                            { text: '', isCorrect: false },
                          ];
                          setEditingActivity({
                            ...editingActivity,
                            content: { ...editingActivity.content, options: newOpts },
                          });
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Option
                      </Button>
                    </div>
                  )}

                  {/* MULTIPLE SELECT */}
                  {editingActivity.type === 'MULTIPLE_SELECT' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">Checkboxes (Select all correct ones)</label>
                        <span className="text-[10px] text-slate-400">Checkboxes mark correct answers</span>
                      </div>
                      {(editingActivity.content?.options || []).map((opt: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={opt.isCorrect}
                            onChange={(e) => {
                              const newOpts = [...editingActivity.content.options];
                              newOpts[idx].isCorrect = e.target.checked;
                              setEditingActivity({
                                ...editingActivity,
                                content: { ...editingActivity.content, options: newOpts },
                              });
                            }}
                            className="accent-indigo-600"
                          />
                          <Input
                            className="h-8 text-xs flex-1"
                            value={opt.text}
                            onChange={(e) => {
                              const newOpts = [...editingActivity.content.options];
                              newOpts[idx].text = e.target.value;
                              setEditingActivity({
                                ...editingActivity,
                                content: { ...editingActivity.content, options: newOpts },
                              });
                            }}
                            placeholder={`Choice ${idx + 1}`}
                          />
                          {(editingActivity.content?.options || []).length > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newOpts = editingActivity.content.options.filter(
                                  (_: any, i: number) => i !== idx
                                );
                                setEditingActivity({
                                  ...editingActivity,
                                  content: { ...editingActivity.content, options: newOpts },
                                });
                              }}
                              className="text-rose-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs w-full mt-1 border border-dashed border-slate-300"
                        onClick={() => {
                          const newOpts = [
                            ...(editingActivity.content?.options || []),
                            { text: '', isCorrect: false },
                          ];
                          setEditingActivity({
                            ...editingActivity,
                            content: { ...editingActivity.content, options: newOpts },
                          });
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Option
                      </Button>
                    </div>
                  )}

                  {/* TRUE / FALSE */}
                  {editingActivity.type === 'TRUE_FALSE' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">Correct Answer</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                          <input
                            type="radio"
                            checked={String(editingActivity.content?.correctAnswer) === 'true'}
                            onChange={() =>
                              setEditingActivity({
                                ...editingActivity,
                                content: { correctAnswer: 'true' },
                              })
                            }
                            className="accent-indigo-600"
                          />
                          True
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                          <input
                            type="radio"
                            checked={String(editingActivity.content?.correctAnswer) === 'false'}
                            onChange={() =>
                              setEditingActivity({
                                ...editingActivity,
                                content: { correctAnswer: 'false' },
                              })
                            }
                            className="accent-indigo-600"
                          />
                          False
                        </label>
                      </div>
                    </div>
                  )}

                  {/* FILL IN THE BLANK */}
                  {editingActivity.type === 'FILL_BLANK' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">Sentence Template</label>
                      <Input
                        className="h-8 text-xs font-mono"
                        value={editingActivity.content?.sentenceTemplate || ''}
                        onChange={(e) =>
                          setEditingActivity({
                            ...editingActivity,
                            content: { ...editingActivity.content, sentenceTemplate: e.target.value },
                          })
                        }
                        placeholder="e.g. I usually ______ breakfast at 7:00."
                      />
                      <label className="text-xs font-bold text-slate-700 block mt-2">Expected Answer *</label>
                      <Input
                        className="h-8 text-xs"
                        value={editingActivity.content?.expectedText || ''}
                        onChange={(e) =>
                          setEditingActivity({
                            ...editingActivity,
                            content: { ...editingActivity.content, expectedText: e.target.value },
                          })
                        }
                        placeholder="e.g. eat"
                      />
                      <label className="text-xs font-bold text-slate-700 block mt-2">
                        Alternative Acceptable Answers (comma separated)
                      </label>
                      <Input
                        className="h-8 text-xs"
                        value={editingActivity.content?.acceptableAnswers || ''}
                        onChange={(e) =>
                          setEditingActivity({
                            ...editingActivity,
                            content: { ...editingActivity.content, acceptableAnswers: e.target.value },
                          })
                        }
                        placeholder="e.g. have, make"
                      />
                    </div>
                  )}

                  {/* SHORT ANSWER */}
                  {editingActivity.type === 'SHORT_ANSWER' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">Model Expected Answer</label>
                      <Input
                        className="h-8 text-xs"
                        value={editingActivity.content?.expectedAnswer || ''}
                        onChange={(e) =>
                          setEditingActivity({
                            ...editingActivity,
                            content: { ...editingActivity.content, expectedAnswer: e.target.value },
                          })
                        }
                        placeholder="e.g. He wakes up at seven o'clock."
                      />
                      <label className="text-xs font-bold text-slate-700 block mt-2">
                        Key Concepts / Grading Keywords (comma separated)
                      </label>
                      <Input
                        className="h-8 text-xs"
                        value={editingActivity.content?.keywords || ''}
                        onChange={(e) =>
                          setEditingActivity({
                            ...editingActivity,
                            content: { ...editingActivity.content, keywords: e.target.value },
                          })
                        }
                        placeholder="e.g. seven, wakes up, morning"
                      />
                    </div>
                  )}

                  {/* MATCHING PAIRS */}
                  {editingActivity.type === 'MATCHING' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">Matching Pairs</label>
                      {(editingActivity.content?.pairs || []).map((pair: any, idx: number) => (
                        <div key={idx} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-1.5">
                          <Input
                            className="h-8 text-xs"
                            placeholder="Item A (e.g. Breakfast)"
                            value={pair.left}
                            onChange={(e) => {
                              const newPairs = [...editingActivity.content.pairs];
                              newPairs[idx].left = e.target.value;
                              setEditingActivity({
                                ...editingActivity,
                                content: { ...editingActivity.content, pairs: newPairs },
                              });
                            }}
                          />
                          <span className="text-slate-400 text-xs">↔</span>
                          <Input
                            className="h-8 text-xs"
                            placeholder="Match B (e.g. Morning meal)"
                            value={pair.right}
                            onChange={(e) => {
                              const newPairs = [...editingActivity.content.pairs];
                              newPairs[idx].right = e.target.value;
                              setEditingActivity({
                                ...editingActivity,
                                content: { ...editingActivity.content, pairs: newPairs },
                              });
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newPairs = editingActivity.content.pairs.filter(
                                (_: any, i: number) => i !== idx
                              );
                              setEditingActivity({
                                ...editingActivity,
                                content: { ...editingActivity.content, pairs: newPairs },
                              });
                            }}
                            className="text-rose-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs w-full mt-1 border border-dashed border-slate-300"
                        onClick={() => {
                          const newPairs = [
                            ...(editingActivity.content?.pairs || []),
                            { left: '', right: '' },
                          ];
                          setEditingActivity({
                            ...editingActivity,
                            content: { ...editingActivity.content, pairs: newPairs },
                          });
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Pair
                      </Button>
                    </div>
                  )}

                  {/* ORDERING / SEQUENCING */}
                  {editingActivity.type === 'ORDERING' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">
                        Correct Sequence (Items will be shuffled for students)
                      </label>
                      {(editingActivity.content?.items || []).map((item: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="h-6 w-6 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                            {idx + 1}
                          </span>
                          <Input
                            className="h-8 text-xs flex-1"
                            value={item}
                            onChange={(e) => {
                              const newItems = [...editingActivity.content.items];
                              newItems[idx] = e.target.value;
                              setEditingActivity({
                                ...editingActivity,
                                content: { ...editingActivity.content, items: newItems },
                              });
                            }}
                            placeholder={`Step ${idx + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newItems = editingActivity.content.items.filter(
                                (_: any, i: number) => i !== idx
                              );
                              setEditingActivity({
                                ...editingActivity,
                                content: { ...editingActivity.content, items: newItems },
                              });
                            }}
                            className="text-rose-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs w-full mt-1 border border-dashed border-slate-300"
                        onClick={() => {
                          const newItems = [...(editingActivity.content?.items || []), ''];
                          setEditingActivity({
                            ...editingActivity,
                            content: { ...editingActivity.content, items: newItems },
                          });
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Step / Item
                      </Button>
                    </div>
                  )}

                  {/* DRAG & DROP SENTENCE BUILDER */}
                  {editingActivity.type === 'DRAG_DROP' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">
                        Draggable Word Tokens (comma separated)
                      </label>
                      <Input
                        className="h-8 text-xs font-mono"
                        value={editingActivity.content?.tokens || ''}
                        onChange={(e) =>
                          setEditingActivity({
                            ...editingActivity,
                            content: { ...editingActivity.content, tokens: e.target.value },
                          })
                        }
                        placeholder="e.g. She, goes, to, school, every, day"
                      />
                      <label className="text-xs font-bold text-slate-700 block mt-2">
                        Complete Correct Sentence
                      </label>
                      <Input
                        className="h-8 text-xs"
                        value={editingActivity.content?.correctSentence || ''}
                        onChange={(e) =>
                          setEditingActivity({
                            ...editingActivity,
                            content: { ...editingActivity.content, correctSentence: e.target.value },
                          })
                        }
                        placeholder="e.g. She goes to school every day"
                      />
                    </div>
                  )}

                  {/* IMAGE-BASED QUESTION */}
                  {editingActivity.type === 'IMAGE' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">Image URL</label>
                      <Input
                        className="h-8 text-xs font-mono"
                        value={editingActivity.content?.imageUrl || ''}
                        onChange={(e) =>
                          setEditingActivity({
                            ...editingActivity,
                            content: { ...editingActivity.content, imageUrl: e.target.value },
                          })
                        }
                        placeholder="https://images.unsplash.com/..."
                      />
                      {editingActivity.content?.imageUrl && (
                        <div className="h-28 w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                          <img
                            src={editingActivity.content.imageUrl}
                            alt="Preview"
                            className="h-full w-full object-contain"
                          />
                        </div>
                      )}
                      <label className="text-xs font-bold text-slate-700 block mt-2">Image Question Options</label>
                      {(editingActivity.content?.options || []).map((opt: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="image_option"
                            checked={opt.isCorrect}
                            onChange={() => {
                              const newOpts = editingActivity.content.options.map((o: any, i: number) => ({
                                ...o,
                                isCorrect: i === idx,
                              }));
                              setEditingActivity({
                                ...editingActivity,
                                content: { ...editingActivity.content, options: newOpts },
                              });
                            }}
                          />
                          <Input
                            className="h-8 text-xs flex-1"
                            value={opt.text}
                            onChange={(e) => {
                              const newOpts = [...editingActivity.content.options];
                              newOpts[idx].text = e.target.value;
                              setEditingActivity({
                                ...editingActivity,
                                content: { ...editingActivity.content, options: newOpts },
                              });
                            }}
                            placeholder={`Option ${idx + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* SPEAKING PROMPT */}
                  {editingActivity.type === 'SPEAKING' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">
                        Target Sentence to Read Aloud / Repeat
                      </label>
                      <Input
                        className="h-8 text-xs"
                        value={editingActivity.content?.targetSentence || ''}
                        onChange={(e) =>
                          setEditingActivity({
                            ...editingActivity,
                            content: { ...editingActivity.content, targetSentence: e.target.value },
                          })
                        }
                        placeholder="e.g. I usually wake up at seven o'clock."
                      />
                      <label className="text-xs font-bold text-slate-700 block mt-2">Speaking Mode</label>
                      <select
                        className="w-full text-xs border-slate-200 rounded-lg py-1.5 px-2 bg-white"
                        value={editingActivity.content?.promptType || 'REPEAT'}
                        onChange={(e) =>
                          setEditingActivity({
                            ...editingActivity,
                            content: { ...editingActivity.content, promptType: e.target.value },
                          })
                        }
                      >
                        <option value="REPEAT">Repeat After Speaker</option>
                        <option value="READ_ALOUD">Read Aloud</option>
                        <option value="ORAL_RESPONSE">Open Oral Response</option>
                      </select>
                    </div>
                  )}

                  {/* LISTENING */}
                  {editingActivity.type === 'LISTENING' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">Listening Cue / Note</label>
                      <Input
                        className="h-8 text-xs"
                        value={editingActivity.content?.audioCue || ''}
                        onChange={(e) =>
                          setEditingActivity({
                            ...editingActivity,
                            content: { ...editingActivity.content, audioCue: e.target.value },
                          })
                        }
                        placeholder="e.g. Listen for what Sarah orders for lunch."
                      />
                      <label className="text-xs font-bold text-slate-700 block mt-2">Listening Options</label>
                      {(editingActivity.content?.options || []).map((opt: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="listening_opt"
                            checked={opt.isCorrect}
                            onChange={() => {
                              const newOpts = editingActivity.content.options.map((o: any, i: number) => ({
                                ...o,
                                isCorrect: i === idx,
                              }));
                              setEditingActivity({
                                ...editingActivity,
                                content: { ...editingActivity.content, options: newOpts },
                              });
                            }}
                          />
                          <Input
                            className="h-8 text-xs flex-1"
                            value={opt.text}
                            onChange={(e) => {
                              const newOpts = [...editingActivity.content.options];
                              newOpts[idx].text = e.target.value;
                              setEditingActivity({
                                ...editingActivity,
                                content: { ...editingActivity.content, options: newOpts },
                              });
                            }}
                            placeholder={`Choice ${idx + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* VOCABULARY */}
                  {editingActivity.type === 'VOCABULARY' && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block">Target Word *</label>
                          <Input
                            className="h-8 text-xs"
                            value={editingActivity.content?.targetWord || ''}
                            onChange={(e) =>
                              setEditingActivity({
                                ...editingActivity,
                                content: { ...editingActivity.content, targetWord: e.target.value },
                              })
                            }
                            placeholder="e.g. Breakfast"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block">Part of Speech</label>
                          <select
                            className="w-full h-8 text-xs border-slate-200 rounded-md px-2 bg-white"
                            value={editingActivity.content?.partOfSpeech || 'noun'}
                            onChange={(e) =>
                              setEditingActivity({
                                ...editingActivity,
                                content: { ...editingActivity.content, partOfSpeech: e.target.value },
                              })
                            }
                          >
                            <option value="noun">Noun</option>
                            <option value="verb">Verb</option>
                            <option value="adjective">Adjective</option>
                            <option value="adverb">Adverb</option>
                            <option value="idiom">Idiom / Phrase</option>
                          </select>
                        </div>
                      </div>
                      <label className="text-xs font-bold text-slate-700 block mt-2">Definition</label>
                      <Input
                        className="h-8 text-xs"
                        value={editingActivity.content?.definition || ''}
                        onChange={(e) =>
                          setEditingActivity({
                            ...editingActivity,
                            content: { ...editingActivity.content, definition: e.target.value },
                          })
                        }
                        placeholder="The first meal of the day eaten in the morning"
                      />
                      <label className="text-xs font-bold text-slate-700 block mt-2">Example Sentence</label>
                      <Input
                        className="h-8 text-xs"
                        value={editingActivity.content?.exampleSentence || ''}
                        onChange={(e) =>
                          setEditingActivity({
                            ...editingActivity,
                            content: { ...editingActivity.content, exampleSentence: e.target.value },
                          })
                        }
                        placeholder="They ate a healthy breakfast before leaving."
                      />
                    </div>
                  )}

                  {/* GRAMMAR */}
                  {editingActivity.type === 'GRAMMAR' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">Grammar Topic Focus</label>
                      <Input
                        className="h-8 text-xs"
                        value={editingActivity.content?.grammarTopic || ''}
                        onChange={(e) =>
                          setEditingActivity({
                            ...editingActivity,
                            content: { ...editingActivity.content, grammarTopic: e.target.value },
                          })
                        }
                        placeholder="e.g. Present Simple (3rd person singular -s)"
                      />
                      <label className="text-xs font-bold text-slate-700 block mt-2">Drill Sentence</label>
                      <Input
                        className="h-8 text-xs"
                        value={editingActivity.content?.sentence || ''}
                        onChange={(e) =>
                          setEditingActivity({
                            ...editingActivity,
                            content: { ...editingActivity.content, sentence: e.target.value },
                          })
                        }
                        placeholder="She ______ to school every day."
                      />
                      <label className="text-xs font-bold text-slate-700 block mt-2">Grammar Choices</label>
                      {(editingActivity.content?.options || []).map((opt: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="grammar_opt"
                            checked={opt.isCorrect}
                            onChange={() => {
                              const newOpts = editingActivity.content.options.map((o: any, i: number) => ({
                                ...o,
                                isCorrect: i === idx,
                              }));
                              setEditingActivity({
                                ...editingActivity,
                                content: { ...editingActivity.content, options: newOpts },
                              });
                            }}
                          />
                          <Input
                            className="h-8 text-xs flex-1"
                            value={opt.text}
                            onChange={(e) => {
                              const newOpts = [...editingActivity.content.options];
                              newOpts[idx].text = e.target.value;
                              setEditingActivity({
                                ...editingActivity,
                                content: { ...editingActivity.content, options: newOpts },
                              });
                            }}
                            placeholder={`Form ${idx + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* READING */}
                  {editingActivity.type === 'READING' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">Transcript Passage / Excerpt</label>
                      <textarea
                        rows={3}
                        className="w-full rounded-xl border border-slate-200 p-2 text-xs"
                        value={editingActivity.content?.passage || ''}
                        onChange={(e) =>
                          setEditingActivity({
                            ...editingActivity,
                            content: { ...editingActivity.content, passage: e.target.value },
                          })
                        }
                        placeholder="Paste or write the reading excerpt here..."
                      />
                      <label className="text-xs font-bold text-slate-700 block mt-2">Comprehension Options</label>
                      {(editingActivity.content?.options || []).map((opt: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="reading_opt"
                            checked={opt.isCorrect}
                            onChange={() => {
                              const newOpts = editingActivity.content.options.map((o: any, i: number) => ({
                                ...o,
                                isCorrect: i === idx,
                              }));
                              setEditingActivity({
                                ...editingActivity,
                                content: { ...editingActivity.content, options: newOpts },
                              });
                            }}
                          />
                          <Input
                            className="h-8 text-xs flex-1"
                            value={opt.text}
                            onChange={(e) => {
                              const newOpts = [...editingActivity.content.options];
                              newOpts[idx].text = e.target.value;
                              setEditingActivity({
                                ...editingActivity,
                                content: { ...editingActivity.content, options: newOpts },
                              });
                            }}
                            placeholder={`Choice ${idx + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* WRITING */}
                  {editingActivity.type === 'WRITING' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">Writing Task Prompt</label>
                      <Input
                        className="h-8 text-xs"
                        value={editingActivity.content?.prompt || ''}
                        onChange={(e) =>
                          setEditingActivity({
                            ...editingActivity,
                            content: { ...editingActivity.content, prompt: e.target.value },
                          })
                        }
                        placeholder="e.g. Write 2-3 sentences about your favourite morning meal."
                      />
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block">Target Word Count</label>
                          <Input
                            type="number"
                            min={5}
                            className="h-8 text-xs"
                            value={editingActivity.content?.minWords || 15}
                            onChange={(e) =>
                              setEditingActivity({
                                ...editingActivity,
                                content: {
                                  ...editingActivity.content,
                                  minWords: Number(e.target.value) || 15,
                                },
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block">Guidance / Rubric</label>
                          <Input
                            className="h-8 text-xs"
                            value={editingActivity.content?.guidance || ''}
                            onChange={(e) =>
                              setEditingActivity({
                                ...editingActivity,
                                content: { ...editingActivity.content, guidance: e.target.value },
                              })
                            }
                            placeholder="e.g. Check spelling and past tense"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Explanation & Feedback */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Explanation / Solution Notes (Shown after submission)
                  </label>
                  <Input
                    value={editingActivity.explanation || ''}
                    onChange={(e) =>
                      setEditingActivity({ ...editingActivity, explanation: e.target.value })
                    }
                    placeholder="e.g. In English, we say 'eats breakfast' for third-person singular."
                    className="text-xs"
                  />
                </div>

                {/* Points & Required Checkbox */}
                <div className="flex items-center gap-4 pt-1">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-slate-700 block mb-1">Points</label>
                    <Input
                      type="number"
                      min={0}
                      className="h-8 text-xs w-24"
                      value={editingActivity.points}
                      onChange={(e) =>
                        setEditingActivity({
                          ...editingActivity,
                          points: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <input
                      type="checkbox"
                      id="required-check"
                      checked={editingActivity.required}
                      onChange={(e) =>
                        setEditingActivity({ ...editingActivity, required: e.target.checked })
                      }
                      className="accent-indigo-600 h-4 w-4 rounded"
                    />
                    <label htmlFor="required-check" className="text-xs font-bold text-slate-700 cursor-pointer">
                      Required Checkpoint
                    </label>
                  </div>
                </div>

                {/* Submit Action */}
                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-9 text-xs rounded-xl shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  {editingActivity.id ? 'Save Changes' : 'Add Activity to Timeline'}
                </Button>
              </form>
            )}

            {/* ── TAB 2: TRANSCRIPT ─────────────────────────────────── */}
            {activeTab === 'TRANSCRIPT' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Transcript</h3>
                  <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                    <Plus className="h-3 w-3 mr-1" /> Add Lines
                  </Button>
                </div>
                <div className="text-center py-12 text-slate-400 text-xs border-2 border-dashed border-slate-100 rounded-xl">
                  {lesson.transcript && lesson.transcript.length > 0 ? (
                    <div className="space-y-1.5 text-left">
                      {lesson.transcript.map((item: any, i: number) => (
                        <div key={i} className="flex gap-2 text-xs p-1 hover:bg-slate-50 rounded">
                          <span className="font-mono text-indigo-600 font-bold">{formatTime(item.time)}</span>
                          <span className="text-slate-700">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    'No transcript recorded yet. You can paste lines or auto-generate.'
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 3: RESOURCES ──────────────────────────────────── */}
            {activeTab === 'RESOURCES' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Lesson PDF Resources</h3>
                    <p className="text-[11px] text-slate-500">
                      Upload PDF handouts, worksheets, and study notes. Click the PDF badge to preview.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs font-semibold gap-1.5"
                    onClick={() => {
                      setNewResource({ title: '', url: '', resourceType: 'PDF', canDownload: false });
                      setUploadedResourceName('');
                      setIsAddingResource(!isAddingResource);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add PDF
                  </Button>
                </div>

                {isAddingResource && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Add PDF Resource</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingResource(false);
                          setUploadedResourceName('');
                        }}
                        className="text-slate-400 hover:text-slate-600 text-xs"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">Document Title</label>
                      <Input
                        className="h-8 text-xs bg-white"
                        placeholder="e.g. Vocabulary Study Sheet, Exercise Notes"
                        value={newResource.title}
                        onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1.5">
                        <label className="text-[11px] font-semibold text-slate-600">PDF File or Link</label>
                        <div className="flex items-center gap-2">
                          <input
                            ref={resourceFileInputRef}
                            type="file"
                            accept=".pdf,application/pdf"
                            className="hidden"
                            onChange={handleResourceFileUpload}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isUploadingResource}
                            className="h-7 px-2.5 text-xs gap-1.5 font-semibold border-rose-200 text-rose-700 hover:bg-rose-50"
                            onClick={() => resourceFileInputRef.current?.click()}
                          >
                            <Upload className="h-3.5 w-3.5" />
                            {isUploadingResource ? 'Uploading PDF...' : 'Upload Local PDF'}
                          </Button>
                        </div>
                      </div>

                      {uploadedResourceName && (
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-[#F3F7FC] border border-blue-200 text-[#012970] text-[11px]">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#006EF3] shrink-0" />
                          <span className="font-semibold truncate">Uploaded: {uploadedResourceName}</span>
                        </div>
                      )}

                      <Input
                        className="h-8 text-xs font-mono bg-white w-full"
                        placeholder="e.g. https://...file.pdf or click Upload Local PDF above"
                        value={newResource.url}
                        onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                      />
                    </div>

                    <div className="pt-1 border-t border-slate-200/60">
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none py-1">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          checked={newResource.canDownload}
                          onChange={(e) => setNewResource({ ...newResource, canDownload: e.target.checked })}
                        />
                        <span>Allow Students to Download PDF</span>
                      </label>
                      <span className="text-[10px] text-slate-400 pl-6 block">
                        If unchecked, students can only view/read the PDF in-app (downloads disabled).
                      </span>
                    </div>

                    <Button
                      size="sm"
                      className="w-full h-8 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                      onClick={async () => {
                        if (!newResource.title || !newResource.url) {
                          alert('Title and PDF file URL are required.');
                          return;
                        }
                        try {
                          await apiClient.post(`/teacher/interactive-videos/lessons/${lessonId}/resources`, {
                            ...newResource,
                            resourceType: 'PDF',
                          });
                          setNewResource({ title: '', url: '', resourceType: 'PDF', canDownload: false });
                          setUploadedResourceName('');
                          setIsAddingResource(false);
                          fetchLesson();
                        } catch (err: any) {
                          alert(err.message || 'Failed to add PDF resource');
                        }
                      }}
                    >
                      Save PDF Resource
                    </Button>
                  </div>
                )}

                {resources.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs border-2 border-dashed border-slate-100 rounded-xl">
                    No PDF resources added yet. Click &quot;Add PDF&quot; to upload handouts or worksheets.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {resources.map((res: any) => (
                      <div
                        key={res.id}
                        className="p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                          {/* PDF Badge is CLICKABLE to preview */}
                          <ResourceTypeBadge
                            resource={res}
                            onClick={() => setPreviewResource(res)}
                            className="hover:scale-105 active:scale-95 transition-transform shrink-0 mt-0.5 sm:mt-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className="text-xs font-bold text-slate-900 truncate hover:text-indigo-600 cursor-pointer"
                              onClick={() => setPreviewResource(res)}
                              title={res.title}
                            >
                              {res.title}
                            </p>
                            {res.description && (
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {res.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {/* Direct Permission Toggle Button */}
                              <button
                                type="button"
                                onClick={() => handleToggleResourceDownload(res.id, res.canDownload)}
                                disabled={updatingResourceId === res.id}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                                  res.canDownload
                                    ? 'bg-[#F3F7FC] text-[#006EF3] border-blue-200 hover:bg-blue-50 hover:border-blue-300'
                                    : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300'
                                }`}
                                title={
                                  res.canDownload
                                    ? 'Students can download this PDF. Click to restrict to high-security View-Only.'
                                    : 'Protected view-only mode. Click to allow student downloads.'
                                }
                              >
                                {updatingResourceId === res.id ? (
                                  <span className="text-[10px]">Updating...</span>
                                ) : res.canDownload ? (
                                  <>
                                    <Download className="h-3 w-3 text-[#006EF3]" />
                                    <span>Download Allowed</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="h-3 w-3 text-amber-600" />
                                    <span>View Only (Restricted)</span>
                                  </>
                                )}
                                <span className="opacity-60 font-normal underline ml-0.5">(Click to change)</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                            onClick={() => setPreviewResource(res)}
                            title="Preview PDF"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Preview
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                            onClick={() => setEditingResource({
                              id: res.id,
                              title: res.title,
                              description: res.description || '',
                              canDownload: Boolean(res.canDownload),
                            })}
                            title="Edit Resource & Permissions"
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            onClick={() => handleDeleteResource(res.id)}
                            title="Delete PDF"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 4: ANALYTICS ──────────────────────────────────── */}
            {activeTab === 'ANALYTICS' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Performance Analytics</h3>
                {loadingAnalytics ? (
                  <div className="text-center py-8 text-slate-500 animate-pulse text-xs">Loading analytics...</div>
                ) : analytics ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Students Started</p>
                      <p className="text-2xl font-black text-slate-900">{analytics.studentsStarted || 0}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Completed</p>
                      <p className="text-2xl font-black text-[#006EF3]">{analytics.completed || 0}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Avg Completion</p>
                      <p className="text-2xl font-black text-indigo-600">{analytics.averageCompletion || 0}%</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Avg Score</p>
                      <p className="text-2xl font-black text-amber-600">{analytics.averageScore || 0}</p>
                    </div>
                    <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Total Attempts</p>
                      <p className="text-xl font-black text-slate-900">{analytics.attempts || 0}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs border-2 border-dashed border-slate-100 rounded-xl">
                    No student performance data recorded yet.
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* ── VIDEO LINK & SETTINGS MODAL ─────────────────────────────── */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Link2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Video Link & Settings</h3>
                  <p className="text-[11px] text-slate-400">Configure the video source link and pedagogical metadata</p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVideoSettings} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              {/* Video URL */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Video Source / Local File *</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      ref={videoSettingsFileInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
                      className="hidden"
                      onChange={handleVideoSettingsUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploadingVideoFile}
                      className="h-7 sm:h-6 px-2.5 sm:px-2 text-xs sm:text-[10px] gap-1 font-semibold border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      onClick={() => videoSettingsFileInputRef.current?.click()}
                    >
                      <Upload className="h-3 w-3" />
                      {isUploadingVideoFile ? 'Uploading...' : 'Upload Local Video'}
                    </Button>
                    {getYouTubeId(settingsForm.videoUrl) ? (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                        YouTube
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400">MP4 / Local</span>
                    )}
                  </div>
                </div>
                <Input
                  required
                  placeholder="https://youtu.be/... or https://...video.mp4 or upload local file above"
                  value={settingsForm.videoUrl}
                  onChange={(e) => setSettingsForm({ ...settingsForm, videoUrl: e.target.value })}
                  className="font-mono text-xs w-full"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Supports local video files (MP4/WebM), YouTube URLs, Shorts, or remote hosted video streams.
                </p>
              </div>

              {/* CEFR Level & Skill */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Level</label>
                  <select
                    className="w-full h-9 text-xs font-semibold border-slate-200 rounded-xl px-3 bg-white"
                    value={settingsForm.cefrLevel}
                    onChange={(e) => setSettingsForm({ ...settingsForm, cefrLevel: e.target.value })}
                  >
                    {dbLevels.length > 0 ? (
                      dbLevels.map((lvl) => (
                        <option key={lvl.id} value={lvl.name}>
                          {lvl.name} ({lvl.code}){lvl.description ? ` - ${lvl.description}` : ''}
                        </option>
                      ))
                    ) : (
                      ['Level 1', 'Level 2', 'Level 3', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">English Skill Focus</label>
                  <select
                    className="w-full h-9 text-xs font-semibold border-slate-200 rounded-xl px-3 bg-white"
                    value={settingsForm.skill}
                    onChange={(e) => setSettingsForm({ ...settingsForm, skill: e.target.value })}
                  >
                    {['LISTENING', 'SPEAKING', 'READING', 'WRITING', 'GRAMMAR', 'VOCABULARY'].map((sk) => (
                      <option key={sk} value={sk}>
                        {sk}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Navigation Mode */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Navigation & Anti-Skip Mode
                </label>
                <select
                  className="w-full h-9 text-xs font-semibold border-slate-200 rounded-xl px-3 bg-white"
                  value={settingsForm.navigationMode}
                  onChange={(e) => setSettingsForm({ ...settingsForm, navigationMode: e.target.value })}
                >
                  <option value="FREE">Free Navigation (Students seek freely)</option>
                  <option value="GUIDED">Guided Learning (Cannot skip past required checkpoints)</option>
                  <option value="REQUIRED_COMPLETION">Required Completion (Must watch & complete all)</option>
                </select>
              </div>

              {/* Thumbnail URL (optional) */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Thumbnail Image URL (Optional)
                </label>
                <Input
                  placeholder="https://...thumbnail.jpg"
                  value={settingsForm.thumbnailUrl}
                  onChange={(e) => setSettingsForm({ ...settingsForm, thumbnailUrl: e.target.value })}
                  className="text-xs font-mono w-full"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-xs w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={savingSettings}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs w-full sm:w-auto"
                >
                  {savingSettings ? 'Saving...' : 'Save & Update Video'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Resource Modal */}
      {editingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
                  <Edit2 className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit Resource & Permissions</h3>
              </div>
              <button
                onClick={() => setEditingResource(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Resource Title
                </label>
                <Input
                  value={editingResource.title}
                  onChange={(e) => setEditingResource({ ...editingResource, title: e.target.value })}
                  className="text-xs"
                  placeholder="e.g. Vocabulary Summary Sheet"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={editingResource.description}
                  onChange={(e) => setEditingResource({ ...editingResource, description: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent resize-none h-20 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                  placeholder="Brief description for students..."
                />
              </div>

              {/* Download Permission Toggle Box */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {editingResource.canDownload ? (
                      <div className="p-2 rounded-xl bg-[#F3F7FC] text-[#006EF3] border border-blue-200 dark:bg-blue-950/50 dark:text-blue-400">
                        <Download className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                        <Lock className="h-4 w-4" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {editingResource.canDownload ? 'Downloads: Permitted' : 'Downloads: Strictly Blocked (View Only)'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {editingResource.canDownload
                          ? 'Students can download and save this PDF file.'
                          : 'High-security mode: direct downloads & printing are blocked.'}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    id="edit-canDownload-toggle"
                    checked={editingResource.canDownload}
                    onChange={(e) => setEditingResource({ ...editingResource, canDownload: e.target.checked })}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingResource(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveResourceEdit}
                disabled={isSavingEditResource || !editingResource.title.trim()}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                {isSavingEditResource ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Resource In-App Preview Modal */}
      <ResourcePreviewModal
        resource={previewResource}
        isOpen={Boolean(previewResource)}
        onClose={() => setPreviewResource(null)}
        isTeacher={true}
      />

      {/* ─── Custom Interactive Delete Confirmation Modal ───────────────────── */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/50">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Delete {itemToDelete.type === 'RESOURCE' ? 'Resource' : 'Activity'}?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {itemToDelete.title || 'This item will be permanently removed.'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete this {itemToDelete.type === 'RESOURCE' ? 'resource' : 'interactive checkpoint'}? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={executeDelete}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs h-9 gap-1.5 shadow-md shadow-rose-600/20"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
