'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  User,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface TeacherFeedbackItem {
  id: string;
  title: string;
  content: string;
  strengths?: string[];
  improvements?: string[];
  createdAt: string;
  teacher: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
      avatarUrl?: string;
    };
  };
}

export default function StudentFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<TeacherFeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<TeacherFeedbackItem[]>('/students/feedback');
        const list: TeacherFeedbackItem[] = Array.isArray(res) ? res : (res as any)?.data || [];
        setFeedbacks(list);
      } catch (err) {
        console.error('Failed to load teacher feedback', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Badge variant="indigo">Instructor Mentorship</Badge>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Teacher Coaching & Feedback Hub
        </h1>
        <p className="text-xs text-slate-500">
          Review personalized evaluation notes, identified strengths, and recommended focus areas from your teachers.
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-slate-400">Loading coaching notes...</div>
      ) : feedbacks.length > 0 ? (
        <div className="space-y-4">
          {feedbacks.map((item) => (
            <Card key={item.id} className="p-6 border-l-4 border-l-primary-600 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 font-bold text-sm text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                    {item.teacher.user.firstName[0]}{item.teacher.user.lastName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.title || 'Instructor Coaching Note'}
                      </h3>
                      <Badge variant="indigo">Teacher Advice</Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      From {item.teacher.user.firstName} {item.teacher.user.lastName} ({item.teacher.user.email}) • {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Feedback Content */}
              <div className="mt-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                {item.content}
              </div>

              {/* Strengths & Improvements Grid if present */}
              {((item.strengths && item.strengths.length > 0) || (item.improvements && item.improvements.length > 0)) && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {item.strengths && item.strengths.length > 0 && (
                    <div className="rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 p-3">
                      <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Demonstrated Strengths
                      </span>
                      <ul className="list-disc list-inside text-xs text-emerald-700 dark:text-emerald-400 space-y-1">
                        {item.strengths.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {item.improvements && item.improvements.length > 0 && (
                    <div className="rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3">
                      <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-1.5">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Recommended Next Steps
                      </span>
                      <ul className="list-disc list-inside text-xs text-amber-700 dark:text-amber-400 space-y-1">
                        {item.improvements.map((imp, idx) => (
                          <li key={idx}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <MessageSquare className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No coaching notes yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            When your instructors review your assignments, speaking submissions, or live class participation, their personalized feedback will appear here.
          </p>
        </Card>
      )}
    </div>
  );
}
