'use client';

import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Bell, Check, Trash2, ExternalLink, Sparkles, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';

import { fastDeepEqual } from '@/lib/cache';

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
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filterTab, setFilterTab] = useState<'ALL' | 'UNREAD'>('ALL');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number; maxHeight: number }>({
    top: 64,
    left: 8,
    width: 360,
    maxHeight: 500,
  });

  useEffect(() => setMounted(true), []);

  // Compute a viewport-clamped position anchored to the bell button
  const updatePosition = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn || typeof window === 'undefined') return;
    const rect = btn.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 8;
    const width = Math.min(410, vw - margin * 2);
    // Align panel's right edge with the bell's right edge, then clamp inside viewport
    let left = rect.right - width;
    left = Math.max(margin, Math.min(left, vw - width - margin));
    const top = rect.bottom + 8;
    const maxHeight = Math.max(240, Math.min(520, vh - top - 12));
    setPanelPos({ top, left, width, maxHeight });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  const fetchNotifications = async (silent = false) => {
    try {
      if (!silent && notifications.length === 0) setLoading(true);
      const res = await apiClient.get<{ notifications: NotificationItem[]; unreadCount: number }>(
        '/notifications'
      );
      if (res) {
        const payload = (res as any).data || res;
        const newNotifs: NotificationItem[] = payload.notifications || (res as any).notifications || [];
        const newCount: number = payload.unreadCount ?? (res as any).unreadCount ?? 0;

        setNotifications((prev) => (fastDeepEqual(prev, newNotifs) ? prev : newNotifs));
        setUnreadCount((prev) => (prev === newCount ? prev : newCount));
      }
    } catch (err) {
      // Graceful silent fallback
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(false);

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      fetchNotifications(true);
    }, 15000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications(true);
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideTrigger = dropdownRef.current?.contains(target);
      const insidePanel = panelRef.current?.contains(target);
      if (!insideTrigger && !insidePanel) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        aria-label="View Notifications"
        aria-expanded={isOpen}
        className="relative rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Portal: Backdrop + Panel rendered on <body> so header transforms/blur/overflow can't clip it */}
      {isOpen && mounted && createPortal(
        <>
        <div
          className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-[2px] sm:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
        <div
          ref={panelRef}
          style={{
            top: panelPos.top,
            left: panelPos.left,
            width: panelPos.width,
            maxHeight: panelPos.maxHeight,
          }}
          className="fixed rounded-2xl bg-white shadow-2xl border border-slate-200/90 dark:bg-slate-900 dark:border-slate-800 z-[100] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/90 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Notifications</span>
              {unreadCount > 0 ? (
                <Badge variant="indigo" className="text-[10px] py-0 px-2 font-bold">
                  {unreadCount} New
                </Badge>
              ) : (
                <span className="text-[10px] text-slate-400 font-medium">All caught up</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-[11px] text-primary-600 hover:text-primary-700 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Quick Filter Tabs */}
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            <button
              type="button"
              onClick={() => setFilterTab('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                filterTab === 'ALL'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('UNREAD')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                filterTab === 'UNREAD'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 overscroll-contain">
            {loading && notifications.length === 0 ? (
              <div className="p-4 space-y-3.5">
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-52" />
                </div>
              </div>
            ) : notifications.filter(n => filterTab === 'UNREAD' ? !n.isRead : true).length > 0 ? (
              notifications.filter(n => filterTab === 'UNREAD' ? !n.isRead : true).map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 sm:p-4 transition-colors flex items-start justify-between gap-3 ${
                    !n.isRead
                      ? 'bg-primary-50/40 dark:bg-primary-950/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug break-words">
                        {n.title}
                      </h4>
                      {!n.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary-600 shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-[11.5px] text-slate-600 dark:text-slate-400 leading-relaxed break-words">
                      {n.message}
                    </p>
                    <div className="flex items-center justify-between gap-2 pt-1.5 mt-1 border-t border-slate-100/60 dark:border-slate-800/60">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formatTimeAgo(n.createdAt)}
                      </span>
                      {n.link && (
                        <Link
                          href={n.link}
                          onClick={() => setIsOpen(false)}
                          className="text-[11px] text-primary-600 dark:text-blue-400 font-semibold flex items-center hover:underline"
                        >
                          View <ExternalLink className="ml-1 h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>

                  {!n.isRead && (
                    <button
                      type="button"
                      title="Mark as read"
                      onClick={(e) => handleMarkAsRead(n.id, e)}
                      className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer self-start"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="py-12 px-4 text-center">
                <Bell className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700 mb-2 opacity-60" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {filterTab === 'UNREAD' ? 'No unread notifications' : 'No notifications'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {filterTab === 'UNREAD' ? "You're all caught up with your updates." : 'You have no notifications yet.'}
                </p>
              </div>
            )}
          </div>

          {/* Footer: View All Link */}
          <div className="px-4 py-2.5 text-center border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 shrink-0">
            <Link
              href="/student/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-primary-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              See all notifications →
            </Link>
          </div>
        </div>
        </>,
        document.body
      )}
    </div>
  );
}
