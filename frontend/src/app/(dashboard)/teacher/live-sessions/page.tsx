'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Video,
  Plus,
  Users,
  User,
  Clock,
  Calendar,
  Play,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StartLiveSessionModal } from '@/components/live-session/start-live-session-modal';
import { getSocketClient } from '@/lib/socket-client';

interface LiveSessionItem {
  id: string;
  title: string;
  topic?: string;
  type: 'ONE_ON_ONE' | 'GROUP';
  status: 'UPCOMING' | 'LIVE' | 'ENDED';
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  participantCount: number;
  activeParticipantCount: number;
  participants: Array<{
    studentId: string;
    status: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  }>;
}

export default function TeacherLiveSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<LiveSessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'LIVE' | 'UPCOMING' | 'ENDED'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'NOW' | 'SCHEDULED'>('NOW');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get<LiveSessionItem[]>('/live-sessions/teacher');
      if (Array.isArray(data)) {
        setSessions(data);
      }
    } catch (err: any) {
      console.error('Failed to load teacher live sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();

    // Wire real-time socket updates so page doesn't need refresh
    const socket = getSocketClient();
    if (socket) {
      const handleUpdate = () => {
        fetchSessions();
      };

      socket.on('live:session-created', handleUpdate);
      socket.on('live:session-status-changed', handleUpdate);
      socket.on('live:session-ended', handleUpdate);

      return () => {
        socket.off('live:session-created', handleUpdate);
        socket.off('live:session-status-changed', handleUpdate);
        socket.off('live:session-ended', handleUpdate);
      };
    }
  }, []);

  const handleStartSessionNow = async (sessionId: string) => {
    try {
      await apiClient.post(`/live-sessions/${sessionId}/start`, {});
      router.push(`/live/${sessionId}`);
    } catch (err: any) {
      console.error('Failed to start live session:', err);
      // Fallback navigation
      router.push(`/live/${sessionId}`);
    }
  };

  const copySessionLink = (sessionId: string) => {
    if (typeof window !== 'undefined') {
      const link = `${window.location.origin}/live/${sessionId}`;
      navigator.clipboard.writeText(link);
      setCopiedId(sessionId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (activeTab === 'ALL') return true;
    return s.status === activeTab;
  });

  const liveCount = sessions.filter((s) => s.status === 'LIVE').length;
  const upcomingCount = sessions.filter((s) => s.status === 'UPCOMING').length;

  return (
    <div className="p-4 sm:p-6 space-y-5 animate-in fade-in duration-300">
      {/* ─── Hero Header ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#011538] via-[#012970] to-[#006EF3] p-4 sm:p-6 text-white shadow-lg border border-blue-500/25">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-white border border-white/20 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F5B400] animate-pulse" />
                Live Video Classrooms
              </span>
              {liveCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {liveCount} Session Active Now
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Interactive Live Sessions
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Host high-definition 1-to-1 oral sessions or cohort group classes with real-time video,
              mic controls, and instantaneous participant updates.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto pt-1 sm:pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSessions}
              disabled={isLoading}
              title="Refresh sessions"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md h-9 w-9 p-0 flex items-center justify-center shrink-0"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>

            <Button
              onClick={() => {
                setModalMode('NOW');
                setIsModalOpen(true);
              }}
              className="flex-1 sm:flex-initial bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black h-9 px-3 sm:px-4 shadow-lg shadow-black/20 gap-1.5 text-xs justify-center whitespace-nowrap"
            >
              <Play className="h-3.5 w-3.5 fill-current shrink-0" />
              <span>Start Live Now</span>
            </Button>

            <Button
              onClick={() => {
                setModalMode('SCHEDULED');
                setIsModalOpen(true);
              }}
              className="flex-1 sm:flex-initial bg-[#F5B400] hover:bg-[#d99f00] active:scale-95 text-[#012970] font-black h-9 px-3 sm:px-4 shadow-lg shadow-black/20 gap-1.5 text-xs justify-center whitespace-nowrap"
            >
              <Calendar className="h-4 w-4 shrink-0" />
              <span>Schedule</span>
              <span className="hidden min-[380px]:inline">Session</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Filter Tabs & Summary ────────────────────────────────────────── */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-2.5 sm:pb-3">
        <div
          className="flex items-center gap-2 overflow-x-auto py-0.5 -mx-4 px-4 sm:mx-0 sm:px-0"
          style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
        >
          {(['ALL', 'LIVE', 'UPCOMING', 'ENDED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                activeTab === tab
                  ? 'bg-[#006EF3] text-white shadow-sm ring-1 ring-blue-400/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              {tab === 'ALL' && `All Sessions (${sessions.length})`}
              {tab === 'LIVE' && `Live Now (${liveCount})`}
              {tab === 'UPCOMING' && `Upcoming (${upcomingCount})`}
              {tab === 'ENDED' && 'Ended'}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Sessions List ────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 sm:p-10 text-center bg-white/50 dark:bg-slate-900/50 space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#006EF3] mx-auto flex items-center justify-center">
            <Video className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No live sessions found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === 'ALL'
              ? 'You have not created any live sessions yet. Click below to launch your first session!'
              : `No sessions currently marked as ${activeTab.toLowerCase()}.`}
          </p>
          <Button
            onClick={() => {
              setModalMode('NOW');
              setIsModalOpen(true);
            }}
            size="sm"
            className="bg-[#006EF3] hover:bg-[#0057c2] active:scale-95 text-white font-bold gap-1.5 shadow-md shadow-blue-600/20"
          >
            <Plus className="h-4 w-4" />
            Start Live Session
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className="relative flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all p-4 sm:p-5 group"
            >
              {/* Card Header: Badges & Format */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center flex-wrap gap-1.5 min-w-0">
                    {session.status === 'LIVE' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 animate-pulse">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        LIVE NOW
                      </span>
                    ) : session.status === 'UPCOMING' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        <Clock className="h-3 w-3" />
                        UPCOMING
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                        <CheckCircle2 className="h-3 w-3" />
                        ENDED
                      </span>
                    )}

                    <Badge
                      variant="outline"
                      className="text-[10px] font-semibold border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    >
                      {session.type === 'ONE_ON_ONE' ? '1-to-1' : 'Group'}
                    </Badge>
                  </div>

                  <button
                    onClick={() => copySessionLink(session.id)}
                    title="Copy Session Link"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#006EF3] hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors shrink-0"
                  >
                    {copiedId === session.id ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Title & Topic & Scheduled Time */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#006EF3] transition-colors line-clamp-2 leading-snug">
                    {session.title}
                  </h3>
                  {session.topic && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{session.topic}</p>
                  )}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2 font-medium">
                    <Calendar className="h-3.5 w-3.5 text-[#006EF3] shrink-0" />
                    <span className="truncate">
                      {session.scheduledAt
                        ? new Date(session.scheduledAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Scheduled'}
                    </span>
                  </div>
                </div>

                {/* Participants Preview */}
                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="flex items-center gap-1 font-medium">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      {session.participantCount}{' '}
                      {session.participantCount === 1 ? 'Student' : 'Students'}
                    </span>
                    {session.status === 'LIVE' && session.activeParticipantCount > 0 && (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {session.activeParticipantCount} connected
                      </span>
                    )}
                  </div>

                  <div className="flex items-center -space-x-1.5 overflow-hidden py-0.5">
                    {session.participants?.slice(0, 5).map((p, idx) => (
                      <div
                        key={p.studentId || idx}
                        title={`${p.firstName} ${p.lastName}`}
                        className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] font-bold text-slate-700 dark:text-slate-200 shrink-0"
                      >
                        {p.avatarUrl && !p.avatarUrl.includes('facebook.com') ? (
                          <img
                            src={p.avatarUrl}
                            alt=""
                            className="h-full w-full rounded-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          `${p.firstName?.[0] || 'S'}`
                        )}
                      </div>
                    ))}
                    {(session.participantCount || 0) > 5 && (
                      <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] font-bold text-slate-600 shrink-0">
                        +{(session.participantCount || 0) - 5}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3.5 mt-3 border-t border-slate-100 dark:border-slate-800/80">
                {session.status === 'LIVE' ? (
                  <Link href={`/live/${session.id}`} className="w-full block">
                    <Button
                      size="sm"
                      className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold gap-2 shadow-md shadow-emerald-600/20"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      <span>Join Live Room</span>
                    </Button>
                  </Link>
                ) : session.status === 'UPCOMING' ? (
                  <Button
                    size="sm"
                    onClick={() => handleStartSessionNow(session.id)}
                    className="w-full h-10 bg-[#006EF3] hover:bg-[#0057c2] active:scale-[0.98] text-white font-bold gap-2 shadow-md shadow-blue-600/20"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    <span>Start Session Now</span>
                  </Button>
                ) : (
                  <Link href={`/live/${session.id}`} className="w-full block">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-10 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <span>View Session Summary</span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Start / Schedule Live Session Modal */}
      <StartLiveSessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialMode={modalMode}
        onSessionCreated={() => fetchSessions()}
      />
    </div>
  );
}
