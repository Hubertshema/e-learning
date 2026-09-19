'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar as CalendarIcon,
  Clock,
  BookOpen,
  ClipboardList,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';
import { useCachedData } from '@/lib/cache';
import { apiClient } from '@/lib/api-client';

interface CalendarEvent {
  id: string;
  title: string;
  type: 'CLASS' | 'ASSIGNMENT_DUE' | 'EXPIRY';
  date: string;
  courseTitle: string;
}

export default function TeacherCalendarPage() {
  const {
    data: rawEvents,
    loading,
    refresh: fetchCalendar
  } = useCachedData<CalendarEvent[]>(
    'teacher_calendar_events',
    async () => {
      const res = await apiClient.get<CalendarEvent[]>('/teacher/calendar');
      return Array.isArray(res) ? res : (res as any)?.data || [];
    },
    { ttl: 120_000, initialData: [] }
  );

  const events = rawEvents || [];

  const getEventBadge = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'CLASS':
        return <Badge variant="primary">Cohort Session</Badge>;
      case 'ASSIGNMENT_DUE':
        return <Badge variant="warning">Assignment Due</Badge>;
      case 'EXPIRY':
        return <Badge variant="destructive">Access Expiry</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary-600" /> Teaching Schedule & Milestones
          </h1>
          <p className="text-xs text-slate-500">
            Upcoming live cohort sessions, assignment due dates, quiz milestones, and student access deadlines.
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/teacher/classes/create">
            <Button variant="outline" size="sm">
              <Plus className="h-3.5 w-3.5 mr-1" /> New Class
            </Button>
          </Link>
          <Link href="/teacher/assignments/create">
            <Button variant="gradient" size="sm">
              <Plus className="h-3.5 w-3.5 mr-1" /> New Assignment
            </Button>
          </Link>
        </div>
      </div>

      {/* Schedule Agenda View */}
      {loading ? (
        <Card className="p-8 animate-pulse h-64 bg-slate-100" />
      ) : events.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-950">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Scheduled Events</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Schedule live cohort sessions, create assignments with due dates, and monitor upcoming student milestones.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="divide-y divide-slate-100 dark:divide-slate-800">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold dark:bg-slate-800 dark:text-slate-300 shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{evt.title}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <BookOpen className="h-3.5 w-3.5 text-primary-500" /> {evt.courseTitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {new Date(evt.date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  {getEventBadge(evt.type)}
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
