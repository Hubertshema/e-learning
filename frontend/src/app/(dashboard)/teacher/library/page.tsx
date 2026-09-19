'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  FolderOpen,
  FileText,
  Music,
  Video,
  Image as ImageIcon,
  Upload,
  Plus,
  Trash2,
  ExternalLink,
  Search,
  Filter
} from 'lucide-react';

interface LibraryResource {
  id: string;
  title: string;
  type: 'PDF' | 'AUDIO' | 'VIDEO' | 'WORKSHEET';
  size: string;
  category: string;
  url: string;
  uploadedAt: string;
}

import { clientCache } from '@/lib/cache';

const DEFAULT_RESOURCES: LibraryResource[] = [
  {
    id: 'res-1',
    title: 'A2 Essential Workplace English - Grammar Cheat Sheet.pdf',
    type: 'PDF',
    size: '1.4 MB',
    category: 'Worksheets',
    url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8',
    uploadedAt: '2026-09-10',
  },
  {
    id: 'res-2',
    title: 'Airport Check-in & Boarding Dialogue Clip.mp3',
    type: 'AUDIO',
    size: '4.8 MB',
    category: 'Listening Dialogues',
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
    uploadedAt: '2026-09-12',
  },
  {
    id: 'res-3',
    title: 'Business Negotiation & Email Etiquette Guide.pdf',
    type: 'PDF',
    size: '2.1 MB',
    category: 'Business English',
    url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952',
    uploadedAt: '2026-09-15',
  },
];

export default function TeacherLibraryPage() {
  const [resources, setResourcesState] = useState<LibraryResource[]>(() => {
    const cached = clientCache.get<LibraryResource[]>('teacher_library_resources');
    return cached || DEFAULT_RESOURCES;
  });

  const setResources = (newRes: LibraryResource[] | ((prev: LibraryResource[]) => LibraryResource[])) => {
    setResourcesState((prev) => {
      const updated = typeof newRes === 'function' ? newRes(prev) : newRes;
      clientCache.set('teacher_library_resources', updated, 86400000);
      return updated;
    });
  };

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // New Resource Upload Form
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'PDF' | 'AUDIO' | 'VIDEO' | 'WORKSHEET'>('PDF');
  const [newCategory, setNewCategory] = useState('General');
  const [newUrl, setNewUrl] = useState('');

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    const newRes: LibraryResource = {
      id: `res-${Date.now()}`,
      title: newTitle,
      type: newType,
      size: '2.5 MB',
      category: newCategory,
      url: newUrl,
      uploadedAt: new Date().toISOString().split('T')[0],
    };

    setResources([newRes, ...resources]);
    setShowUploadModal(false);
    setNewTitle('');
    setNewUrl('');
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to remove this resource?')) return;
    setResources(resources.filter((r) => r.id !== id));
  };

  const getIcon = (type: LibraryResource['type']) => {
    switch (type) {
      case 'PDF':
      case 'WORKSHEET':
        return <FileText className="h-5 w-5 text-rose-500" />;
      case 'AUDIO':
        return <Music className="h-5 w-5 text-amber-500" />;
      case 'VIDEO':
        return <Video className="h-5 w-5 text-primary-500" />;
    }
  };

  const filtered = resources.filter((r) => {
    const matchesType = filterType === 'ALL' || r.type === filterType;
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-primary-600" /> Teaching Content & Media Library
          </h1>
          <p className="text-xs text-slate-500">
            Store and organize reusable PDF worksheets, listening clips, dialogues, and video assets for lessons.
          </p>
        </div>

        <Button variant="gradient" onClick={() => setShowUploadModal(true)}>
          <Upload className="h-4 w-4 mr-1.5" /> Upload New Asset
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search assets by file name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex gap-2">
            {['ALL', 'PDF', 'AUDIO', 'VIDEO', 'WORKSHEET'].map((t) => (
              <Button
                key={t}
                variant={filterType === t ? 'gradient' : 'outline'}
                size="sm"
                onClick={() => setFilterType(t)}
                className="text-xs font-bold"
              >
                {t}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Resource Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <Card key={item.id} className="p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  {getIcon(item.type)}
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {item.category}
                </Badge>
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                {item.title}
              </h3>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{item.size}</span>
                <span>Uploaded: {item.uploadedAt}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <a href={item.url} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" className="text-xs">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Preview Asset
                </Button>
              </a>

              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => handleDelete(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Upload Educational Resource
            </h3>

            <form onSubmit={handleAddResource} className="space-y-3">
              <Input
                label="Resource Title & Extension"
                placeholder="e.g. Unit 3 Medical English Dialogue.mp3"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Resource Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full mt-1 rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="AUDIO">Audio MP3</option>
                    <option value="VIDEO">Video MP4</option>
                    <option value="WORKSHEET">Worksheet</option>
                  </select>
                </div>

                <Input
                  label="Category / Tag"
                  placeholder="e.g. Grammar, Medical"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  required
                />
              </div>

              <Input
                label="File URL / Cloud Storage Link"
                placeholder="https://..."
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                required
              />

              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="outline" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="gradient">
                  Save to Library
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
