'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Settings, Globe, Trash2, CheckCircle2, AlertCircle, X, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api-client';
import { clientCache } from '@/lib/cache';

interface CourseData {
  id: string;
  title: string;
  description?: string;
  level: string;
  published: boolean;
  price?: number;
  durationDays?: number;
}

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function StudioSettingsPage() {
  const { courseId } = useParams() as { courseId: string };

  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('A1');
  const [published, setPublished] = useState(false);
  const [price, setPrice] = useState('');
  const [durationDays, setDurationDays] = useState('');

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    apiClient
      .get<CourseData>(`/teacher/courses/${courseId}`)
      .then((res: any) => {
        const data: CourseData = (res as any)?.data || res;
        setCourse(data);
        setTitle(data.title || '');
        setDescription(data.description || '');
        setLevel(data.level || 'A1');
        setPublished(Boolean(data.published));
        setPrice(data.price !== undefined ? String(data.price) : '');
        setDurationDays(data.durationDays !== undefined ? String(data.durationDays) : '');
      })
      .catch(() => setCourse(null))
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      setSaving(true);
      await apiClient.put(`/teacher/courses/${courseId}`, {
        title: title.trim(),
        description: description.trim(),
        level,
        published,
        ...(price !== '' && { price: Number(price) }),
        ...(durationDays !== '' && { durationDays: Number(durationDays) }),
      });
      clientCache.invalidate('teacher_');
      clientCache.invalidate('studio_course_');
      setCourse((prev) => prev ? { ...prev, title, description, level, published } : prev);
      showToast('success', 'Course settings saved successfully!');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    try {
      const endpoint = published ? 'unpublish' : 'publish';
      await apiClient.post(`/teacher/courses/${courseId}/${endpoint}`);
      const next = !published;
      setPublished(next);
      clientCache.invalidate('teacher_');
      showToast('success', next ? 'Course is now published!' : 'Course set to draft.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update publish status.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded-xl bg-slate-200" />
        <div className="h-64 rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <AlertCircle className="h-7 w-7 text-rose-400" />
        <p className="text-sm font-semibold text-slate-700">Could not load course settings</p>
        <Link href={`/studio/${courseId}`}>
          <Button variant="outline" size="sm">Back to Curriculum</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6 pb-16">

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg animate-in slide-in-from-bottom-4 duration-300 bg-white ${
            toast.type === 'success' ? 'border-emerald-200 text-emerald-800' : 'border-rose-200 text-rose-700'
          }`}
        >
          {toast.type === 'success'
            ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            : <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings className="h-5 w-5 text-[#315b36]" />
          <h1 className="text-2xl font-black text-slate-900">Course Settings</h1>
        </div>
        <p className="text-xs text-slate-500">Update title, description, level and publish status</p>
      </div>

      {/* Publish Status Banner */}
      <div
        className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
          published
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-amber-50 border-amber-200'
        }`}
      >
        <div className="flex items-center gap-2">
          {published
            ? <Globe className="h-4 w-4 text-emerald-600 shrink-0" />
            : <EyeOff className="h-4 w-4 text-amber-600 shrink-0" />}
          <div>
            <p className={`text-xs font-bold ${published ? 'text-emerald-800' : 'text-amber-800'}`}>
              {published ? 'Published — visible to students' : 'Draft — not visible to students'}
            </p>
            <p className={`text-[11px] ${published ? 'text-emerald-600' : 'text-amber-600'}`}>
              {published ? 'Students can enroll and access this course.' : 'Finish building before publishing.'}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleTogglePublish}
          className={`text-[11px] font-bold shrink-0 ${
            published
              ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-100'
              : 'border-amber-300 text-amber-700 hover:bg-amber-100'
          }`}
        >
          {published ? <EyeOff className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
          {published ? 'Unpublish' : 'Publish Now'}
        </Button>
      </div>

      {/* Settings Form */}
      <Card className="border-[#e2ebe2] shadow-sm p-6">
        <form onSubmit={handleSave} className="space-y-5">

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Course Title <span className="text-rose-400">*</span></label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. English for Business Communication"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Description <span className="font-normal text-slate-400">(optional)</span></label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will students learn? Who is this course for?"
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 outline-none focus:border-[#315b36] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">CEFR Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 font-semibold outline-none focus:border-[#315b36]"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Price (USD) <span className="font-normal text-slate-400">(0 = free)</span></label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Duration (days) <span className="font-normal text-slate-400">(optional)</span></label>
            <Input
              type="number"
              min="1"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              placeholder="e.g. 30"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#e2ebe2]">
            <Link href={`/studio/${courseId}`}>
              <Button type="button" variant="ghost" size="sm" className="text-xs text-slate-500">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Back
              </Button>
            </Link>
            <Button type="submit" variant="gradient" size="sm" disabled={saving} className="font-bold text-xs px-5">
              {saving ? 'Saving…' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Danger Zone */}
      <Card className="border-rose-200 shadow-sm p-5">
        <h3 className="text-xs font-bold text-rose-700 mb-1 flex items-center gap-1.5">
          <Trash2 className="h-3.5 w-3.5" /> Danger Zone
        </h3>
        <p className="text-[11px] text-slate-500 mb-3">
          Deleting this course is permanent. All units, lessons, and enrollments will be removed.
        </p>
        {!showDeleteConfirm ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-xs border-rose-300 text-rose-600 hover:bg-rose-50 font-semibold"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete this course
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-xs text-rose-700 font-semibold">Are you sure?</p>
            <Button
              variant="destructive"
              size="sm"
              className="text-xs"
              onClick={async () => {
                try {
                  await apiClient.delete(`/teacher/courses/${courseId}`);
                  clientCache.invalidate('teacher_');
                  window.location.href = '/teacher/courses';
                } catch (err: any) {
                  showToast('error', err.message || 'Failed to delete course.');
                  setShowDeleteConfirm(false);
                }
              }}
            >
              Yes, Delete
            </Button>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
