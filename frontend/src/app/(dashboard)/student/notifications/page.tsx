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

function formatTimeAgo(dateStr: string) {
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function StudentNotificationsPage() {
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD'>('ALL');

  const { data: rawNotifications, loading, refresh } = useCachedData<NotificationItem[]>(
    'student_notifications',
    async () => {
      const res = await apiClient.get<any>('/notifications?limit=100');
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.notifications)) return res.notifications;
      if (Array.isArray(res?.data?.notifications)) return res.data.notifications;
      if (Array.isArray(res?.data)) return res.data;
      return [];
    },
    { ttl: 30_000, initialData: [] }
  );

  const notifications = Array.isArray(rawNotifications) ? rawNotifications : [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'UNREAD') return !item.isRead;
    return true;
  });

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
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">Alerts & Milestones</Badge>
          <h1 className="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Notifications Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time alerts on payment approvals, evaluated assignments, quiz feedback, and course milestones.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="self-start sm:self-auto text-xs h-8">
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-primary-600" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'ALL'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>All</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold">
            {notifications.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('UNREAD')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'UNREAD'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-600 text-white font-bold">
              {unreadCount}
            </span>
          )}
        </button>
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
      ) : filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map((item) => (
            <Card
              key={item.id}
              className={`p-3.5 sm:p-5 transition-all ${
                !item.isRead
                  ? 'border-l-4 border-l-primary-600 bg-primary-50/20 dark:bg-primary-950/10'
                  : 'hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white break-words">
                        {item.title}
                      </h3>
                      {!item.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary-600 animate-pulse shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 break-words leading-relaxed">
                      {item.message}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(item.createdAt)}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700 text-[10px]">•</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80 w-full sm:w-auto justify-end">
                  {item.link && (
                    <Link href={item.link}>
                      <Button size="sm" variant="gradient" className="text-xs h-8 px-3">
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
                      className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white h-8 px-2.5"
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
          <Bell className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {activeTab === 'UNREAD' ? 'All caught up!' : 'No notifications yet'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {activeTab === 'UNREAD'
              ? "You don't have any unread notifications right now."
              : 'You will receive real-time updates and announcements here.'}
          </p>
        </Card>
      )}
    </div>
  );
}
