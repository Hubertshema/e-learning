'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar as CalendarIcon,
  Clock,
  BookOpen,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useCachedData } from '@/lib/cache';
import { Skeleton } from '@/components/ui/skeleton';

interface CalendarEvent {
  id: string;
  title: string;
  type: 'CLASS_SESSION' | 'ASSIGNMENT_DEADLINE' | 'QUIZ_DATE' | 'EXPIRATION_ALERT';
  date: string;
  courseTitle: string;
  description?: string;
}

export default function StudentCalendarPage() {
  const [filterType, setFilterType] = useState<string>('ALL');

  const { data: rawEvents, loading } = useCachedData<CalendarEvent[]>(
    'student_calendar',
    async () => {
      const res = await apiClient.get<CalendarEvent[]>('/students/calendar');
      return Array.isArray(res) ? res : (res as any)?.data || [];
    },
    { ttl: 120_000, initialData: [] }
  );

  const events = Array.isArray(rawEvents) ? rawEvents : [];

  const filteredEvents = events.filter((e) => {
    if (filterType === 'ALL') return true;
    return e.type === filterType;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">Syllabus Milestones & Schedule</Badge>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Learning Calendar & Agenda
          </h1>
          <p className="text-xs text-slate-500">
            Keep track of live cohort sessions, assignment deadlines, upcoming quizzes, and enrollment access expiry.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
          {[
            { label: 'All Agenda', value: 'ALL' },
            { label: 'Assignments', value: 'ASSIGNMENT_DEADLINE' },
            { label: 'Quizzes', value: 'QUIZ_DATE' },
            { label: 'Access Expiry', value: 'EXPIRATION_ALERT' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterType(f.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filterType === f.value
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading && events.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-5 w-64" />
                <Skeleton className="h-3.5 w-40" />
              </div>
              <Skeleton className="h-8 w-28 rounded-lg" />
            </Card>
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="space-y-4">
          {filteredEvents.map((evt) => {
            const isExpiry = evt.type === 'EXPIRATION_ALERT';
            const isAssignment = evt.type === 'ASSIGNMENT_DEADLINE';
            const isQuiz = evt.type === 'QUIZ_DATE';

            return (
              <Card
                key={evt.id}
                className={`p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isExpiry
                    ? 'border-l-4 border-l-rose-500 bg-rose-50/20 dark:bg-rose-950/10'
                    : isAssignment
                    ? 'border-l-4 border-l-emerald-500'
                    : 'border-l-4 border-l-primary-600'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-black text-sm shadow-sm ${
                      isExpiry
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : isAssignment
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                    }`}
                  >
                    <CalendarIcon className="h-6 w-6" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{evt.title}</h3>
                      {isExpiry ? (
                        <Badge variant="destructive">Access Expiry</Badge>
                      ) : isAssignment ? (
                        <Badge variant="success">Task Deadline</Badge>
                      ) : (
                        <Badge variant="indigo">Quiz Available</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {evt.courseTitle} • {evt.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {new Date(evt.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-[11px] text-slate-400">Scheduled Date</span>
                  </div>

                  {isAssignment && (
                    <Link href="/student/assignments">
                      <Button size="sm" variant="outline" className="text-xs">
                        Open Task
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  )}

                  {isQuiz && (
                    <Link href="/student/quizzes">
                      <Button size="sm" variant="gradient" className="text-xs">
                        Take Quiz
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  )}

                  {isExpiry && (
                    <Link href="/student/payments">
                      <Button size="sm" variant="destructive" className="text-xs">
                        Renew Now
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <CalendarIcon className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No upcoming events</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Your learning agenda is currently clear. Enrolled class sessions, quiz dates, and task deadlines will appear here.
          </p>
        </Card>
      )}
    </div>
  );
}
