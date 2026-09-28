'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  FolderOpen,
  FileText,
  Video,
  Search,
  RefreshCw,
  ExternalLink,
  Download,
  Play,
  Eye,
  BookOpen,
  GraduationCap,
  ChevronRight,
  Lock,
  Layers,
  X,
} from 'lucide-react';
import { useCachedData } from '@/lib/cache';
import { apiClient } from '@/lib/api-client';
import { ResourcePreviewModal } from '@/components/resources/resource-preview-modal';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LibraryItem {
  id: string;
  resourceId: string;
  title: string;
  description?: string | null;
  url: string;
  fileType: 'PDF' | 'VIDEO';
  resourceType: string;
  canDownload: boolean;
  canView: boolean;
  thumbnail?: string | null;
  durationSeconds?: number | null;
  cefrLevel?: string | null;
  lessonTitle: string;
  lessonId: string;
  courseTitle: string;
  courseId: string;
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(secs?: number | null) {
  if (!secs) return '';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function isYouTube(url: string) {
  return /youtu\.be|youtube\.com/.test(url);
}

function isLocalUpload(url: string) {
  return url.startsWith('/uploads/') || url.startsWith('blob:') || (!url.startsWith('http') && !url.startsWith('//'));
}

function ytThumbnail(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, bg }: { label: string; value: number; icon: React.ElementType; color: string; bg: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div>
        <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{value}</p>
        <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Resource Card ────────────────────────────────────────────────────────────

function ResourceCard({ item, onPreview }: { item: LibraryItem; onPreview: (item: LibraryItem) => void }) {
  const isPDF = item.fileType === 'PDF';
  const thumb = item.thumbnail || (item.url && isYouTube(item.url) ? ytThumbnail(item.url) : null);

  return (
    <div className="group relative flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800">
      {/* Thumbnail / Type Banner */}
      {!isPDF && thumb ? (
        <div className="relative h-36 bg-slate-900 overflow-hidden">
          <img src={thumb} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {item.durationSeconds && (
            <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
              {formatDuration(item.durationSeconds)}
            </span>
          )}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg">
              <Play className="h-5 w-5 text-slate-900 fill-slate-900 ml-0.5" />
            </div>
          </div>
        </div>
      ) : (
        <div className={`h-20 flex items-center justify-center ${isPDF ? 'bg-rose-50 dark:bg-rose-950/20' : 'bg-indigo-50 dark:bg-indigo-950/20'}`}>
          {isPDF ? (
            <FileText className="h-10 w-10 text-rose-400" />
          ) : (
            <Video className="h-10 w-10 text-indigo-400" />
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col gap-2.5 p-4 flex-1">
        {/* Type pill */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
            isPDF
              ? 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
              : 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
          }`}>
            {isPDF ? <FileText className="h-3 w-3" /> : <Video className="h-3 w-3" />}
            {item.fileType}
          </span>
          {item.cefrLevel && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md dark:bg-slate-800 dark:text-slate-300">
              {item.cefrLevel}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight flex-1">
          {item.title}
        </h3>

        {/* Lesson / Course breadcrumb */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <BookOpen className="h-3 w-3 shrink-0 text-indigo-400" />
            <span className="truncate font-medium text-slate-700 dark:text-slate-300">{item.courseTitle}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Layers className="h-3 w-3 shrink-0" />
            <span className="truncate">{item.lessonTitle}</span>
          </div>
        </div>

        {/* Permissions */}
        <div className="flex items-center gap-1.5">
          {item.canView ? (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-md">
              <Eye className="h-2.5 w-2.5" /> View
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
              <Lock className="h-2.5 w-2.5" /> Hidden
            </span>
          )}
          {item.canDownload ? (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30 px-1.5 py-0.5 rounded-md">
              <Download className="h-2.5 w-2.5" /> Download ON
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded-md">
              <Lock className="h-2.5 w-2.5" /> Download OFF
            </span>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-1.5 px-4 pb-4">
        <Button
          size="sm"
          className="flex-1 text-xs h-8 gap-1.5"
          onClick={() => onPreview(item)}
        >
          {isPDF ? <Eye className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {isPDF ? 'Preview PDF' : 'Play Video'}
        </Button>
        <Link href={`/teacher/courses/${item.courseId}`}>
          <Button size="sm" variant="outline" className="h-8 w-8 p-0 shrink-0" title="Open in course">
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* Date */}
      <div className="px-4 pb-3 text-[10px] text-slate-400">
        Added {new Date(item.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}

// ─── Video Preview Modal ──────────────────────────────────────────────────────

function VideoPreviewModal({ item, onClose }: { item: LibraryItem; onClose: () => void }) {
  const isYT = isYouTube(item.url);
  const ytId = item.url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1];
  const embedSrc = isYT ? `https://www.youtube.com/embed/${ytId}?autoplay=1` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between bg-slate-900 px-4 py-3">
          <p className="text-sm font-bold text-white truncate">{item.title}</p>
          <button
            onClick={onClose}
            className="ml-4 shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="aspect-video bg-black">
          {isYT && embedSrc ? (
            <iframe
              src={embedSrc}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video src={item.url} controls autoPlay className="w-full h-full" />
          )}
        </div>
        <div className="bg-slate-900 px-4 py-2.5 flex items-center gap-3 text-xs text-slate-400">
          <BookOpen className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
          <span>{item.courseTitle}</span>
          <span className="text-slate-600">·</span>
          <span>{item.lessonTitle}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type FileFilter = 'ALL' | 'PDF' | 'VIDEO';

export default function TeacherLibraryPage() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FileFilter>('ALL');
  const [previewPDF, setPreviewPDF] = useState<LibraryItem | null>(null);
  const [previewVideo, setPreviewVideo] = useState<LibraryItem | null>(null);

  const handlePreview = (item: LibraryItem) => {
    if (item.fileType === 'VIDEO') {
      setPreviewVideo(item);
    } else {
      setPreviewPDF(item);
    }
  };

  const { data: rawItems, loading, refresh } = useCachedData<LibraryItem[]>(
    'teacher_library_v2',
    async () => {
      const res = await apiClient.get<any>('/teacher/library');
      return (res as any)?.items || (res as any)?.data?.items || (Array.isArray(res) ? res : []);
    },
    { ttl: 180_000, initialData: [] }
  );

  const items = rawItems || [];

  const filtered = useMemo(() => items.filter((item) => {
    const matchType = filterType === 'ALL' || item.fileType === filterType;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      item.title.toLowerCase().includes(q) ||
      item.courseTitle.toLowerCase().includes(q) ||
      item.lessonTitle.toLowerCase().includes(q);
    return matchType && matchSearch;
  }), [items, filterType, search]);

  const pdfCount = items.filter((i) => i.fileType === 'PDF').length;
  const videoCount = items.filter((i) => i.fileType === 'VIDEO').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800">
              <FolderOpen className="h-3 w-3" /> Library
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Resource Library</h1>
          <p className="text-xs text-slate-500">All PDFs and videos across every lesson you own — in one place.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs shrink-0" onClick={() => refresh()}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Total Files" value={items.length} icon={Layers} color="text-indigo-600 dark:text-indigo-400" bg="bg-indigo-50 dark:bg-indigo-950/40" />
        <StatCard label="PDF Documents" value={pdfCount} icon={FileText} color="text-rose-600 dark:text-rose-400" bg="bg-rose-50 dark:bg-rose-950/40" />
        <StatCard label="Videos" value={videoCount} icon={Video} color="text-sky-600 dark:text-sky-400" bg="bg-sky-50 dark:bg-sky-950/40" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1.5">
          {(['ALL', 'PDF', 'VIDEO'] as FileFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                filterType === t
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, course, or lesson..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <FolderOpen className="h-7 w-7 text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No files found</p>
          <p className="text-xs text-slate-400 mt-1">
            {items.length === 0
              ? 'Upload PDFs or add videos to your lessons — they'll appear here automatically.'
              : 'Try adjusting your search or filter.'}
          </p>
          {items.length === 0 && (
            <Link href="/teacher/courses" className="mt-4">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                <GraduationCap className="h-3.5 w-3.5" /> Go to Courses
                <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <ResourceCard key={item.id} item={item} onPreview={handlePreview} />
          ))}
        </div>
      )}

      {/* PDF Preview Modal */}
      {previewPDF && (
        <ResourcePreviewModal
          isOpen={true}
          onClose={() => setPreviewPDF(null)}
          resource={{
            id: previewPDF.resourceId,
            title: previewPDF.title,
            url: previewPDF.url,
            resourceType: 'PDF',
            canDownload: previewPDF.canDownload,
            canView: previewPDF.canView,
            description: previewPDF.description ?? undefined,
          }}
          isTeacher={true}
        />
      )}

      {/* Video Preview Modal */}
      {previewVideo && (
        <VideoPreviewModal item={previewVideo} onClose={() => setPreviewVideo(null)} />
      )}
    </div>
  );
}
