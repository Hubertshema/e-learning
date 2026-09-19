'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  MessageSquare,
  Search,
  CheckCircle2,
  TrendingUp,
  User,
  Calendar,
  Sparkles
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { RichTextRenderer } from '@/components/ui/rich-text-editor';

interface FeedbackItem {
  id: string;
  title: string;
  content: string;
  strengths: string[];
  improvements: string[];
  createdAt: string;
  student: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export default function TeacherFeedbackLogPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<FeedbackItem[]>('/teacher/feedback');
      if (res) {
        setFeedbacks(res);
      }
    } catch (err) {
      console.error('Failed to load teacher feedback history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const filtered = feedbacks.filter(
    (f) =>
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.content.toLowerCase().includes(search.toLowerCase()) ||
      f.student.user.firstName.toLowerCase().includes(search.toLowerCase()) ||
      f.student.user.lastName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary-600" /> Coaching Notes & Feedback Hub
          </h1>
          <p className="text-xs text-slate-500">
            Log of personalized pedagogical coaching, observed linguistic strengths, and targeted improvement plans.
          </p>
        </div>

        <Link href="/teacher/students">
          <Button variant="gradient" size="sm">
            <User className="h-3.5 w-3.5 mr-1" /> Open Student Directory
          </Button>
        </Link>
      </div>

      {/* Filter */}
      <Card className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search feedback notes by student name, topic, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </Card>

      {/* Feedback Feed */}
      {loading ? (
        <Card className="p-8 animate-pulse h-64 bg-slate-100" />
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-950">
            <MessageSquare className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Coaching Notes Recorded</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Provide feedback from any student profile page to leave targeted advice on grammar, pronunciation, and fluency.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((fb) => (
            <Card key={fb.id} className="p-6 space-y-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700 font-bold text-sm dark:bg-primary-950">
                    {fb.student.user.firstName[0]}
                    {fb.student.user.lastName[0]}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{fb.title}</h3>
                    <p className="text-xs text-slate-400">
                      Student:{' '}
                      <Link
                        href={`/teacher/students/${fb.student.id}`}
                        className="text-primary-600 font-semibold hover:underline"
                      >
                        {fb.student.user.firstName} {fb.student.user.lastName}
                      </Link>
                    </p>
                  </div>
                </div>

                <span className="text-xs text-slate-400">
                  {new Date(fb.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <RichTextRenderer content={fb.content} />
              </div>

              {(fb.strengths?.length > 0 || fb.improvements?.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  {fb.strengths?.length > 0 && (
                    <div className="rounded-xl bg-emerald-50/50 p-3 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30">
                      <p className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mb-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Strengths
                      </p>
                      <ul className="space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
                        {fb.strengths.map((s, idx) => (
                          <li key={idx}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {fb.improvements?.length > 0 && (
                    <div className="rounded-xl bg-amber-50/50 p-3 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30">
                      <p className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 mb-1">
                        <TrendingUp className="h-3.5 w-3.5" /> Growth Targets
                      </p>
                      <ul className="space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
                        {fb.improvements.map((imp, idx) => (
                          <li key={idx}>• {imp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
