'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bell,
  CheckCircle2,
  Clock,
  ShieldAlert,
  CreditCard,
  Users,
  Megaphone,
  ArrowRight,
  Trash2,
  Check,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { getSocketClient } from '@/lib/socket-client';
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

function getAdminNotificationIcon(type: string) {
  switch (type) {
    case 'SECURITY_ALERT':
      return <ShieldAlert className="h-4 w-4 text-rose-500" />;
    case 'PAYMENT_PENDING':
    case 'PAYMENT_VERIFIED':
      return <CreditCard className="h-4 w-4 text-emerald-500" />;
    case 'TEACHER_APPLICATION':
    case 'STUDENT_ADMISSION':
      return <Users className="h-4 w-4 text-blue-500" />;
    case 'PLATFORM_ANNOUNCEMENT':
      return <Megaphone className="h-4 w-4 text-amber-500" />;
    default:
      return <Bell className="h-4 w-4 text-primary-500" />;
  }
}

export default function SuperadminNotificationsPage() {
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD'>('ALL');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<any>('/notifications?limit=100');
      const list = res?.notifications || res?.data?.notifications || res || [];
      setNotifications(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load superadmin notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const socket = getSocketClient();
    if (socket && typeof socket.on === 'function') {
      const handleNewNotification = (notif: NotificationItem) => {
        if (!notif) return;
        setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);
      };
      socket.on('notification:new', handleNewNotification);

      return () => {
        socket.off('notification:new', handleNewNotification);
      };
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'UNREAD') return !item.isRead;
    return true;
  });

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await apiClient.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  const handleClearAll = async () => {
    try {
      await apiClient.delete('/notifications/clear-all');
      setNotifications([]);
    } catch (err) {
      console.error('Failed to clear notifications', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="indigo">System & Operations</Badge>
            <span className="text-[11px] font-semibold text-slate-400">Master Audit Logs</span>
          </div>
          <h1 className="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Superadmin Notifications Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Platform-wide administrative alerts, verification requests, transactions, and security signals.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="text-xs h-8">
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-primary-600" />
              Mark All as Read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-xs h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Clear All
            </Button>
          )}
        </div>
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
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-72" />
            </Card>
          ))}
        </div>
      ) : filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map((item) => (
            <Card
              key={item.id}
              className={`p-4 transition-all duration-200 ${
                !item.isRead
                  ? 'border-l-4 border-l-primary-600 bg-primary-50/20 dark:bg-primary-950/10 shadow-xs'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="mt-0.5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                    {getAdminNotificationIcon(item.type)}
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </h3>
                      {!item.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 break-words leading-relaxed">
                      {item.message}
                    </p>
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimeAgo(item.createdAt)}</span>
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80 w-full sm:w-auto justify-end">
                  {item.link && (
                    <Link href={item.link}>
                      <Button size="sm" variant="gradient" className="text-xs h-8 px-3 gap-1">
                        <span>Inspect</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                  {!item.isRead && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMarkOneRead(item.id)}
                      className="text-xs text-slate-500 hover:text-emerald-600 h-8 px-2"
                      title="Mark as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteNotification(item.id)}
                    className="text-xs text-slate-400 hover:text-rose-500 h-8 px-2"
                    title="Delete notification"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Bell className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {activeTab === 'UNREAD' ? 'All caught up!' : 'No administrative notifications'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {activeTab === 'UNREAD'
              ? 'All system alerts have been reviewed.'
              : 'You will receive operations, payments, and platform notifications here.'}
          </p>
        </Card>
      )}
    </div>
  );
}
