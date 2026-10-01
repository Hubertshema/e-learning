'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Video,
  Play,
  Users,
  Clock,
  Calendar,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getSocketClient } from '@/lib/socket-client';

interface StudentLiveSession {
  id: string;
  title: string;
  topic?: string;
  type: 'ONE_ON_ONE' | 'GROUP';
  status: 'UPCOMING' | 'LIVE' | 'ENDED';
  participantStatus: 'INVITED' | 'JOINED' | 'LEFT' | 'REMOVED';
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  participantCount: number;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
}

export default function StudentLiveSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<StudentLiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'LIVE' | 'UPCOMING' | 'ENDED'>('ALL');

  const fetchStudentSessions = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get<StudentLiveSession[]>('/live-sessions/student');
      if (Array.isArray(data)) {
        setSessions(data);
      }
    } catch (err: any) {
      console.error('Failed to load student live sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentSessions();

    const socket = getSocketClient();
    if (socket) {
      const handleUpdate = () => {
        fetchStudentSessions();
      };

      socket.on('live:session-created', handleUpdate);
      socket.on('live:session-started', handleUpdate);
      socket.on('live:session-status-changed', handleUpdate);
      socket.on('live:session-ended', handleUpdate);

      return () => {
        socket.off('live:session-created', handleUpdate);
        socket.off('live:session-started', handleUpdate);
        socket.off('live:session-status-changed', handleUpdate);
        socket.off('live:session-ended', handleUpdate);
      };
    }
  }, []);

  const liveSessions = sessions.filter((s) => s.status === 'LIVE');
  const upcomingSessions = sessions.filter((s) => s.status === 'UPCOMING');
  const endedSessions = sessions.filter((s) => s.status === 'ENDED');

  const filteredSessions = sessions.filter((s) => {
    if (activeTab === 'ALL') return true;
    return s.status === activeTab;
  });

  return (
    <div className="p-4 sm:p-6 space-y-5 animate-in fade-in duration-300">
      {/* ─── Hero Header ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#011538] via-[#012970] to-[#006EF3] p-5 sm:p-6 text-white shadow-lg border border-blue-500/25">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-white border border-white/20 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F5B400] animate-pulse" />
                Live Classroom Hub
              </span>
              {liveSessions.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {liveSessions.length} Live Session Active Now
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Join Live Sessions
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-normal">
              Participate in live oral training, real-time teacher coaching, and interactive group
              speaking exercises directly with your instructor.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchStudentSessions}
            disabled={isLoading}
            className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md h-9 px-3 shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ─── Priority Active Live Banner (If session is live right now!) ──── */}
      {liveSessions.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-4 sm:p-5 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-400/40 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center shrink-0 backdrop-blur-md">
              <Radio className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white text-emerald-800 uppercase tracking-wide">
                  Live Right Now
                </span>
                <span className="text-xs text-emerald-100 font-medium">
                  {liveSessions[0].teacher?.firstName} is currently hosting
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black mt-0.5">{liveSessions[0].title}</h2>
              {liveSessions[0].topic && (
                <p className="text-xs text-emerald-100/90 line-clamp-1">{liveSessions[0].topic}</p>
              )}
            </div>
          </div>

          <Link href={`/live/${liveSessions[0].id}`} className="shrink-0">
            <Button className="w-full sm:w-auto bg-white hover:bg-emerald-50 text-emerald-900 font-black px-5 py-2.5 h-auto shadow-lg shadow-black/20 gap-2">
              <Play className="h-4 w-4 fill-current" />
              <span>Join Live Session Now</span>
            </Button>
          </Link>
        </div>
      )}

      {/* ─── Filter Tabs ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {(['ALL', 'LIVE', 'UPCOMING', 'ENDED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab
                ? 'bg-[#006EF3] text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {tab === 'ALL' && `All Invitations (${sessions.length})`}
            {tab === 'LIVE' && `Live Now (${liveSessions.length})`}
            {tab === 'UPCOMING' && `Upcoming (${upcomingSessions.length})`}
            {tab === 'ENDED' && 'Archive'}
          </button>
        ))}
      </div>

      {/* ─── Sessions Grid ────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-44 rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-10 text-center bg-white/50 dark:bg-slate-900/50 space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#006EF3] mx-auto flex items-center justify-center">
            <Video className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No live session invitations
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === 'ALL'
              ? 'Your instructor has not scheduled any live sessions with you yet. Check back soon or message your teacher.'
              : `No sessions currently found under ${activeTab.toLowerCase()}.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className="relative flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all p-5 group"
            >
              <div className="space-y-3">
                {/* Status Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
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
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                        <CheckCircle2 className="h-3 w-3" />
                        ENDED
                      </span>
                    )}

                    <Badge
                      variant="outline"
                      className="text-[10px] font-semibold border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    >
                      {session.type === 'ONE_ON_ONE' ? '1-to-1' : 'Group Cohort'}
                    </Badge>
                  </div>
                </div>

                {/* Session Title & Agenda */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#006EF3] transition-colors line-clamp-1">
                    {session.title}
                  </h3>
                  {session.topic && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{session.topic}</p>
                  )}
                </div>

                {/* Teacher Profile Card */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-[#006EF3] text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {session.teacher?.avatarUrl ? (
                        <img
                          src={session.teacher.avatarUrl}
                          alt=""
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        `${session.teacher?.firstName?.[0] || 'T'}`
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {session.teacher?.firstName} {session.teacher?.lastName}
                      </p>
                      <p className="text-[10px] text-slate-400">Instructor</p>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 font-medium">
                    {session.participantCount}{' '}
                    {session.participantCount === 1 ? 'Attendee' : 'Attendees'}
                  </span>
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 mt-3">
                {session.status === 'LIVE' ? (
                  <Link href={`/live/${session.id}`} className="w-full block">
                    <Button
                      size="sm"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-md shadow-emerald-600/20"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Join Live Session</span>
                    </Button>
                  </Link>
                ) : session.status === 'UPCOMING' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="w-full border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 font-semibold gap-1.5"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Awaiting Teacher to Start</span>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="w-full border-slate-200 dark:border-slate-800 text-slate-400 font-semibold"
                  >
                    <span>Session Concluded</span>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
