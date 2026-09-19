'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  BookOpen,
  ClipboardList,
  ArrowRight,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useCachedData } from '@/lib/cache';
import { Skeleton } from '@/components/ui/skeleton';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export default function StudentNotificationsPage() {
  const { data: rawNotifications, loading, refresh } = useCachedData<NotificationItem[]>(
    'student_notifications',
    async () => {
      const res = await apiClient.get<NotificationItem[]>('/notifications');
      return Array.isArray(res) ? res : (res as any)?.data || [];
    },
    { ttl: 60_000, initialData: [] }
  );

  const notifications = Array.isArray(rawNotifications) ? rawNotifications : [];

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      await refresh();
    } catch (err) {
      console.error('Failed to mark notifications read', err);
    }
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      await refresh();
    } catch (err) {
      console.error('Failed to mark notification read', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">Alerts & Milestones</Badge>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Notifications Center
          </h1>
          <p className="text-xs text-slate-500">
            Real-time alerts on payment approvals, evaluated assignments, quiz feedback, and course milestones.
          </p>
        </div>
        {notifications.some((n) => !n.isRead) && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-primary-600" />
            Mark All as Read
          </Button>
        )}
      </div>

      {loading && notifications.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 flex items-start gap-3">
              <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-3.5 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((item) => (
            <Card
              key={item.id}
              className={`p-4 transition-all ${
                !item.isRead
                  ? 'border-l-4 border-l-primary-600 bg-primary-50/20 dark:bg-primary-950/10'
                  : 'hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</h3>
                      {!item.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary-600 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {item.message}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.link && (
                    <Link href={item.link}>
                      <Button size="sm" variant="gradient" className="text-xs">
                        View
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                  {!item.isRead && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMarkOneRead(item.id)}
                      className="text-xs text-slate-500"
                    >
                      Dismiss
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Bell className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">All caught up!</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You don't have any unread notifications right now.
          </p>
        </Card>
      )}
    </div>
  );
}
