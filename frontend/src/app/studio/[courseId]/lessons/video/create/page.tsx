'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Video, UploadCloud, Save, Loader2, Link as LinkIcon, Upload, CheckCircle2, Film } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface LevelItem {
  id: number | string;
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}

const DEFAULT_LEVELS: LevelItem[] = [
  { id: 1, name: 'Level 1', code: 'L1', description: 'Beginner Level' },
  { id: 2, name: 'Level 2', code: 'L2', description: 'Intermediate Level' },
  { id: 3, name: 'Level 3', code: 'L3', description: 'Advanced Level' },
];

export default function CreateVideoLessonPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const courseId = params.courseId as string;
  const unitId = searchParams.get('unitId');

  const [title, setTitle] = useState('');
  const [skill, setSkill] = useState('LISTENING');
  const [cefrLevel, setCefrLevel] = useState('Level 1');
  const [videoUrl, setVideoUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Local Video Upload State
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadedVideoName, setUploadedVideoName] = useState('');
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingVideo(true);
      setError('');
      const formData = new FormData();
      formData.append('file', file);
      const res: any = await apiClient.upload('/upload/media', formData);
      const url = res?.url;
      if (url) {
        setVideoUrl(url);
        setUploadedVideoName(file.name);
        if (!title.trim()) {
          setTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload video');
    } finally {
      setIsUploadingVideo(false);
      if (videoFileInputRef.current) videoFileInputRef.current.value = '';
    }
  };

  // Pre-load default database levels instantly (zero wait time for user)
  const [levels, setLevels] = useState<LevelItem[]>(DEFAULT_LEVELS);
  const [loadingLevels, setLoadingLevels] = useState(false);

  // Sync with live database in background and match current course level
  useEffect(() => {
    let isMounted = true;

    async function syncLevelsAndCourse() {
      try {
        const [levelsRes, courseRes] = await Promise.allSettled([
          apiClient.get<LevelItem[]>('/levels'),
          courseId ? apiClient.get<any>(`/teacher/courses/${courseId}`) : Promise.resolve(null),
        ]);

        let fetchedLevels: LevelItem[] = [];
        if (levelsRes.status === 'fulfilled') {
          const raw = levelsRes.value as any;
          const data = Array.isArray(raw) ? raw : raw?.data || [];
          if (data.length > 0) fetchedLevels = data;
        }

        let courseLevel = '';
        if (courseRes.status === 'fulfilled' && courseRes.value) {
          const c = (courseRes.value as any)?.data || courseRes.value;
          if (c?.level) {
            courseLevel = String(c.level).trim();
          }
        }

        if (isMounted) {
          const activeLevels = fetchedLevels.length > 0 ? fetchedLevels : DEFAULT_LEVELS;
          setLevels(activeLevels);

          if (courseLevel) {
            const matched = activeLevels.find((lvl) => {
              const lvlName = (lvl.name || '').toLowerCase();
              const lvlCode = (lvl.code || '').toLowerCase();
              const cLvl = courseLevel.toLowerCase();
              return (
                String(lvl.id) === courseLevel ||
                lvlName === cLvl ||
                lvlCode === cLvl ||
                lvlName.includes(`level ${cLvl}`) ||
                lvlName.replace(/\s+/g, '') === cLvl.replace(/\s+/g, '')
              );
            });

            if (matched) {
              setCefrLevel(matched.name);
            } else {
              setCefrLevel(courseLevel.startsWith('Level') ? courseLevel : `Level ${courseLevel}`);
            }
          }
        }
      } catch (err) {
        console.error('Failed to sync database levels:', err);
      }
    }

    syncLevelsAndCourse();

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!title.trim() || !videoUrl.trim() || !unitId) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setIsSaving(true);
      
      // 1. Create the base lesson in the unit
      const lessonRes = await apiClient.post(`/teacher/courses/${courseId}/units/${unitId}/lessons`, {
        title,
        skill,
        type: 'INTERACTIVE_VIDEO',
        estimatedMinutes: 30, // Default
      });
      
      const lessonId = (lessonRes as any).id || (lessonRes as any).data?.id;
      if (!lessonId) throw new Error('Failed to create base lesson');

      // 2. Initialize the interactive video metadata
      await apiClient.put(`/teacher/interactive-videos/lessons/${lessonId}`, {
        videoUrl,
        cefrLevel,
        skill,
        durationSeconds: 0, // Will be updated by player later
      });

      // Redirect to the interactive timeline editor
      router.push(`/studio/${courseId}/lessons/video/${lessonId}/editor`);
    } catch (err: any) {
      setError(err.message || 'Failed to create lesson');
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="mb-6">
        <Link href={`/studio/${courseId}`}>
          <Button variant="ghost" size="sm" className="text-slate-500 mb-2 px-0 hover:bg-transparent hover:text-slate-900">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Curriculum
          </Button>
        </Link>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Video className="h-6 w-6 text-indigo-500" />
          Create Interactive Video
        </h1>
        <p className="text-slate-500 text-sm mt-1">Start by adding a video and basic lesson details.</p>
      </div>

      <Card className="p-6">
        {error && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">Lesson Title *</label>
              <Input
                placeholder="e.g. Ordering Food at a Restaurant"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">Primary Skill</label>
                <select 
                  className="w-full flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={skill}
                  onChange={(e) => setSkill(e.target.value)}
                >
                  <option value="LISTENING">Listening</option>
                  <option value="SPEAKING">Speaking</option>
                  <option value="GRAMMAR">Grammar</option>
                  <option value="VOCABULARY">Vocabulary</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">Level *</label>
                <select 
                  className="w-full flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  value={cefrLevel}
                  onChange={(e) => setCefrLevel(e.target.value)}
                >
                  {levels.map((lvl) => (
                    <option key={lvl.id} value={lvl.name}>
                      {lvl.name} ({lvl.code}){lvl.description ? ` - ${lvl.description}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-semibold text-slate-900">Video Source *</label>
                  <p className="text-xs text-slate-500">
                    Upload a video file from your computer (MP4, WebM) or paste a direct video / YouTube link.
                  </p>
                </div>
                <div>
                  <input
                    ref={videoFileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
                    className="hidden"
                    onChange={handleVideoFileUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploadingVideo}
                    className="h-8 px-3 text-xs font-semibold gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    onClick={() => videoFileInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {isUploadingVideo ? 'Uploading Video...' : 'Upload Local Video'}
                  </Button>
                </div>
              </div>

              {uploadedVideoName && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F3F7FC] border border-blue-200 text-[#012970] text-xs">
                  <CheckCircle2 className="h-4 w-4 text-[#006EF3] shrink-0" />
                  <span className="font-semibold truncate">Uploaded Local Video: {uploadedVideoName}</span>
                </div>
              )}

              <div className="relative">
                <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-9 font-mono text-xs"
                  placeholder="https://example.com/video.mp4 or YouTube URL or upload above"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Link href={`/studio/${courseId}`}>
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button type="submit" variant="gradient" disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save and Continue to Editor
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
