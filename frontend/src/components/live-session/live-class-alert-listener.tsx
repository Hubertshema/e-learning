'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSocketClient } from '@/lib/socket-client';
import { Video, X, Radio, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LiveClassAlert {
  sessionId: string;
  title: string;
  teacherName?: string;
  joinUrl?: string;
  message?: string;
}

function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12); // A5
    gain2.gain.setValueAtTime(0.15, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch {
    // Audio context may be restricted by browser policy before first interaction
  }
}

export function LiveClassAlertListener() {
  const [activeAlert, setActiveAlert] = useState<LiveClassAlert | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const socket = getSocketClient();
    if (!socket) return;

    const handleSessionStarted = (data: any) => {
      if (!data?.sessionId) return;

      // Don't show banner if the user is already inside the live room
      if (pathname.startsWith(`/live/${data.sessionId}`)) {
        return;
      }

      setActiveAlert({
        sessionId: data.sessionId,
        title: data.title || data.session?.title || 'Interactive Live Class',
        teacherName: data.teacherName || data.session?.teacher?.firstName || 'Your Teacher',
        joinUrl: data.joinUrl || `/live/${data.sessionId}`,
        message: data.message || 'Your live class has been activated and is waiting for you to join.',
      });

      playNotificationChime();
    };

    const handleNewNotification = (notif: any) => {
      if (notif?.type === 'LIVE_SESSION' && notif?.link) {
        const match = notif.link.match(/\/live\/([a-zA-Z0-9_-]+)/);
        const sId = match ? match[1] : null;
        if (sId && !pathname.startsWith(`/live/${sId}`)) {
          setActiveAlert({
            sessionId: sId,
            title: notif.title || 'Live Class Active',
            teacherName: 'Instructor',
            joinUrl: notif.link,
            message: notif.message,
          });
          playNotificationChime();
        }
      }
    };

    socket.on('live:session-started', handleSessionStarted);
    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('live:session-started', handleSessionStarted);
      socket.off('notification:new', handleNewNotification);
    };
  }, [pathname]);

  if (!activeAlert) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-[calc(100vw-2rem)] sm:w-auto animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#011538] via-[#012970] to-[#006EF3] text-white p-4 sm:p-5 shadow-2xl border border-blue-400/40 backdrop-blur-md">
        {/* Glow ambient accent */}
        <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-cyan-400/20 blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-400/30">
              Live Class Active Now
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveAlert(null)}
            className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            title="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2.5 relative z-10 space-y-1">
          <h4 className="text-sm sm:text-base font-bold text-white tracking-tight line-clamp-1">
            {activeAlert.title}
          </h4>
          <p className="text-xs text-blue-100/90 leading-snug line-clamp-2">
            {activeAlert.message || `Classroom is open with ${activeAlert.teacherName}. Everyone is joining!`}
          </p>
        </div>

        <div className="mt-3.5 pt-3 border-t border-white/15 flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-1.5 text-[11px] text-cyan-200 font-medium">
            <Radio className="h-3.5 w-3.5 animate-pulse text-cyan-300" />
            <span>Waiting room open</span>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => {
              const url = activeAlert.joinUrl || `/live/${activeAlert.sessionId}`;
              setActiveAlert(null);
              router.push(url);
            }}
            className="h-8 px-3.5 text-xs font-bold bg-white text-[#012970] hover:bg-blue-50 shadow-md gap-1.5 rounded-xl transition-transform active:scale-95"
          >
            <Video className="h-3.5 w-3.5 text-[#006EF3]" />
            <span>Join Class Now</span>
            <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
