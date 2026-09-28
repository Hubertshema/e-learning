'use client';

import React, { useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Video, UploadCloud, Save, Loader2, Link as LinkIcon } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function CreateVideoLessonPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const courseId = params.courseId as string;
  const unitId = searchParams.get('unitId');

  const [title, setTitle] = useState('');
  const [skill, setSkill] = useState('LISTENING');
  const [cefrLevel, setCefrLevel] = useState('B1');
  const [videoUrl, setVideoUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

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
                <label className="block text-sm font-semibold text-slate-900 mb-1">CEFR Level</label>
                <select 
                  className="w-full flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={cefrLevel}
                  onChange={(e) => setCefrLevel(e.target.value)}
                >
                  <option value="A1">A1 - Beginner</option>
                  <option value="A2">A2 - Elementary</option>
                  <option value="B1">B1 - Intermediate</option>
                  <option value="B2">B2 - Upper Intermediate</option>
                  <option value="C1">C1 - Advanced</option>
                </select>
              </div>
            </div>
            
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-sm font-semibold text-slate-900 mb-1">Video Source *</label>
              <p className="text-xs text-slate-500 mb-3">Provide a direct MP4 link or a YouTube URL.</p>
              
              <div className="relative">
                <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-9"
                  placeholder="https://example.com/video.mp4"
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
