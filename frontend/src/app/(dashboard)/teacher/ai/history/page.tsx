'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AIHeaderTabs } from '@/components/ai/ai-header-tabs';
import {
  History,
  Sparkles,
  ArrowLeft,
  Search,
  Trash2,
  Eye,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Award,
  MessageSquare,
  FileText,
  X,
} from 'lucide-react';

interface GenerationRecord {
  id: string;
  type: string;
  title: string;
  prompt: string;
  output: any;
  status: string;
  model: string;
  tokensUsed: number;
  createdAt: string;
}

export default function AIHistoryArchivePage() {
  const [items, setItems] = useState<GenerationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [activeModalItem, setActiveModalItem] = useState<GenerationRecord | null>(null);
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const types = ['ALL', 'LESSON', 'ACTIVITY', 'ASSESSMENT', 'EXAM', 'RUBRIC', 'FEEDBACK', 'CHAT'];

  const loadHistory = async () => {
    try {
      setLoading(true);
      let query = `/ai/history?page=${page}&limit=12`;
      if (selectedType !== 'ALL') query += `&type=${selectedType}`;
      if (search.trim()) query += `&search=${encodeURIComponent(search.trim())}`;

      const res = await api.get<{
        items: GenerationRecord[];
        total: number;
        totalPages: number;
      }>(query);

      setItems(res.items || []);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [page, selectedType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadHistory();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this AI generation record?')) return;
    try {
      setDeletingId(id);
      await api.delete(`/ai/history/${id}`);
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (activeModalItem?.id === id) setActiveModalItem(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete record');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyJson = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'LESSON':
        return <BookOpen className="h-4 w-4 text-blue-500" />;
      case 'ACTIVITY':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'ASSESSMENT':
      case 'EXAM':
        return <ClipboardList className="h-4 w-4 text-purple-500" />;
      case 'FEEDBACK':
      case 'RUBRIC':
        return <Award className="h-4 w-4 text-amber-500" />;
      case 'CHAT':
        return <MessageSquare className="h-4 w-4 text-cyan-500" />;
      default:
        return <Sparkles className="h-4 w-4 text-primary-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Unified AI Studio Navigation Tabs */}
      <AIHeaderTabs />

      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/teacher/ai">
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-white">
              <ArrowLeft className="h-4 w-4" /> AI Hub
            </Button>
          </Link>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="h-5 w-5 text-primary-500" />
            AI Generations & Drafts Archive
          </h1>
        </div>

        <Badge variant="outline" className="border-primary-500/30 bg-primary-500/10 text-primary-400">
          {totalCount} Total Records
        </Badge>
      </div>

      {/* Filter & Search Toolbar */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Type Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setSelectedType(t);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  selectedType === t
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-sm w-full">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or topic..."
              className="text-xs h-9"
            />
            <Button type="submit" size="sm" variant="outline" className="h-9 px-3">
              <Search className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </Card>

      {/* Generation Cards Grid */}
      {loading ? (
        <div className="p-16 text-center text-sm text-slate-500">
          <RotateCcw className="mx-auto h-6 w-6 animate-spin text-primary-500 mb-2" />
          Loading your AI curriculum drafts...
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-400 mb-3 opacity-60" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">No AI Generations Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Try adjusting your search query or generate new materials using the AI Studio tools.
          </p>
          <Link href="/teacher/ai">
            <Button size="sm" className="bg-primary-600 hover:bg-primary-700">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Go to AI Hub
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card
              key={item.id}
              className="flex flex-col justify-between border-slate-200 dark:border-slate-800 hover:border-primary-500/40 transition-all p-5 shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {getTypeIcon(item.type)}
                    <Badge variant="secondary" className="text-[10px] font-mono uppercase">
                      {item.type}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2">
                  {item.title}
                </h4>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                  "{item.prompt}"
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                  {item.status}
                </span>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveModalItem(item)}
                    className="h-7 text-xs text-primary-600 hover:text-primary-700 gap-1 px-2"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="h-7 text-xs text-red-500 hover:text-red-700 px-2"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="text-xs"
          >
            Previous
          </Button>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 px-2">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="text-xs"
          >
            Next
          </Button>
        </div>
      )}

      {/* Detailed Modal Viewer */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4">
              <div className="flex items-center gap-2">
                {getTypeIcon(activeModalItem.type)}
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                    {activeModalItem.title}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Created {new Date(activeModalItem.createdAt).toLocaleString()} • {activeModalItem.model}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveModalItem(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">Prompt Context:</span>
                {activeModalItem.prompt}
              </div>

              <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-96">
                <pre>{JSON.stringify(activeModalItem.output, null, 2)}</pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyJson(activeModalItem.output)}
                className="text-xs gap-1.5"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied JSON' : 'Copy JSON Payload'}
              </Button>

              <Button
                size="sm"
                onClick={() => setActiveModalItem(null)}
                className="bg-primary-600 hover:bg-primary-700 text-white text-xs"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
