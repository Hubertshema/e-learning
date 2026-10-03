'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  ScreenShare,
  PhoneOff,
  Users,
  Shield,
  UserX,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  X,
  Volume2,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Radio,
  Lock,
  Smile,
  Hand,
  MessageSquare,
  Send,
  ArrowLeft,
} from 'lucide-react';
import { useLiveSession, ParticipantMedia } from '@/lib/use-live-session';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';

interface FloatingParticle {
  id: string;
  emoji: string;
  left: number;
  bottom: number;
  size: number;
  duration: number;
  delay: number;
  swayMid: number;
  swayEnd: number;
}

// 10 Essential & Expressive Reactions (Google Meet experience)
const REACTIONS = ['💖', '👍', '👏', '🎉', '🔥', '😂', '😮', '😢', '🤔', '💯'];

export default function LiveSessionRoomPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = (params?.sessionId as string) || '';
  const { user } = useAuth();

  const {
    session,
    isTeacher,
    isLoading,
    error,
    isEnded,
    isKicked,
    localStream,
    remotePeers,
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    isHandRaised,
    toggleHandRaise,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    endSession,
    kickParticipant,
    chatMessages,
    sendChatMessage,
    sendReaction,
    activeReaction,
  } = useLiveSession(sessionId);

  const [showParticipantsDrawer, setShowParticipantsDrawer] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [floatingParticles, setFloatingParticles] = useState<FloatingParticle[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [studentToKick, setStudentToKick] = useState<ParticipantMedia | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const reactionPickerRef = useRef<HTMLDivElement>(null);

  // Exact 1 Click = 1 Reaction Flying Upwards
  const spawnSingleFloatingEmoji = (emoji: string) => {
    const baseLeft = 50 + (Math.random() * 32 - 16);
    const particle: FloatingParticle = {
      id: `${Date.now()}-${Math.random()}`,
      emoji,
      left: Math.max(8, Math.min(92, baseLeft + (Math.random() * 20 - 10))),
      bottom: 80,
      size: 22 + Math.floor(Math.random() * 8), // 22px - 30px
      duration: 1.1 + Math.random() * 0.4, // 1.1s - 1.5s
      delay: 0,
      swayMid: (Math.random() - 0.5) * 50,
      swayEnd: (Math.random() - 0.5) * 90,
    };

    setFloatingParticles((prev) => [...prev, particle]);

    setTimeout(() => {
      setFloatingParticles((prev) => prev.filter((p) => p.id !== particle.id));
    }, 1800);
  };

  const handleReactionClick = (emoji: string) => {
    sendReaction(emoji);
    spawnSingleFloatingEmoji(emoji);
  };

  // Trigger floating emoji whenever an incoming reaction is received from another peer
  useEffect(() => {
    if (activeReaction?.emoji) {
      spawnSingleFloatingEmoji(activeReaction.emoji);
    }
  }, [activeReaction?.id]);

  // Close reaction picker on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        reactionPickerRef.current &&
        !reactionPickerRef.current.contains(event.target as Node)
      ) {
        setShowReactionPicker(false);
      }
    }
    if (showReactionPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showReactionPicker]);

  // Attach local stream to local video element
  useEffect(() => {
    const videoEl = localVideoRef.current;
    if (videoEl && localStream) {
      if (videoEl.srcObject !== localStream) {
        videoEl.srcObject = localStream;
      }
      videoEl.play().catch(() => {});
    }
  }, [localStream, isVideoOff, isScreenSharing]);

  // Handle Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const copyRoomLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // If user is kicked
  if (isKicked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-4 text-white">
        <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900 border border-red-500/40 text-center space-y-4 shadow-2xl">
          <div className="h-14 w-14 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
            <UserX className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-red-200">Removed from Session</h2>
          <p className="text-sm text-slate-400">
            You have been removed from this live session by the instructor.
          </p>
          <Button
            onClick={() => router.push(user?.role === 'TEACHER' ? '/teacher' : '/student')}
            className="w-full bg-[#006EF3] hover:bg-[#0057c2] text-white font-bold"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // If session ended
  if (isEnded) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-4 text-white">
        <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900 border border-blue-500/40 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="h-14 w-14 rounded-full bg-blue-500/20 text-[#006EF3] mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-[#F5B400]" />
          </div>
          <h2 className="text-xl font-bold text-white">Live Session Concluded</h2>
          <p className="text-sm text-slate-400">
            {isTeacher
              ? 'You have ended this live session. Participant attendance and session duration have been stored.'
              : 'The teacher has concluded this live session. Thank you for attending!'}
          </p>
          <Button
            onClick={() => router.push(user?.role === 'TEACHER' ? '/teacher' : '/student')}
            className="w-full bg-[#006EF3] hover:bg-[#0057c2] text-white font-bold"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-4 text-white">
        <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900 border border-red-500/40 text-center space-y-4 shadow-2xl">
          <div className="h-14 w-14 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-red-200">Unable to Join Session</h2>
          <p className="text-sm text-slate-400">{error}</p>
          <Button
            onClick={() => router.push(user?.role === 'TEACHER' ? '/teacher' : '/student')}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const totalParticipants = remotePeers.length + 1;

  // Compute adaptive grid columns
  const getGridClasses = () => {
    if (totalParticipants === 1) return 'grid-cols-1';
    if (totalParticipants === 2) return 'grid-cols-1 md:grid-cols-2';
    if (totalParticipants <= 4) return 'grid-cols-1 sm:grid-cols-2';
    if (totalParticipants <= 6) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
  };

  const sharedRemotePeer = remotePeers.find(p => p.isScreenSharing);
  const isAnyScreenShared = isScreenSharing || !!sharedRemotePeer;

  // Local Video Tile Renderer
  const renderLocalVideoTile = (isSmall = false, isPip = false) => (
    <div
      className={`relative rounded-2xl bg-slate-900 border overflow-hidden shadow-lg flex items-center justify-center group transition-all duration-200 ${
        isHandRaised
          ? 'border-amber-400 ring-2 ring-amber-400 shadow-amber-500/20 shadow-xl'
          : 'border-slate-800'
      } ${isSmall ? 'w-full h-full' : isPip ? 'w-full h-full' : 'min-h-[180px] w-full h-full'}`}
    >
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${
          isScreenSharing ? '' : 'transform -scale-x-100'
        } ${isVideoOff ? 'hidden' : 'block'}`}
      />

      {isVideoOff && (
        <div className="flex flex-col items-center justify-center gap-2 p-2 sm:p-4 text-center z-10">
          <div className="relative h-14 w-14 sm:h-20 sm:w-20 rounded-full bg-gradient-to-tr from-[#012970] to-[#006EF3] border-2 border-white/20 overflow-hidden shadow-2xl flex items-center justify-center">
            {user?.avatarUrl && !user.avatarUrl.includes('facebook.com') ? (
              <img
                src={user.avatarUrl}
                alt={`${user.firstName || 'Student'}'s profile picture`}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="text-lg sm:text-2xl font-black text-white">
                {user?.firstName?.[0] || 'U'}
              </span>
            )}
          </div>
          {!isPip && (
            <p className="text-[11px] sm:text-xs font-semibold text-slate-300">
              {user?.firstName} {user?.lastName}
            </p>
          )}
        </div>
      )}

      {/* Persistent Hand Raised Badge on Local Tile (Google Meet experience) */}
      {isHandRaised && (
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-amber-500 text-slate-950 text-[11px] sm:text-xs font-bold shadow-lg animate-pulse">
          <span>✋</span>
          {!isPip && <span>Hand Raised</span>}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleHandRaise();
            }}
            className="ml-0.5 text-[9px] sm:text-[10px] bg-slate-950/20 hover:bg-slate-950/40 px-1 py-0.5 rounded uppercase font-black text-slate-950 transition-colors"
            title="Lower your hand"
          >
            Lower
          </button>
        </div>
      )}

      {/* Status Badges Overlay */}
      <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 flex items-center gap-1.5 bg-slate-950/70 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-semibold border border-white/10">
        <span className="text-white truncate max-w-[110px] sm:max-w-none">
          {user?.firstName} {user?.lastName} (You)
        </span>
        {isTeacher && (
          <span className="px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] font-black bg-[#F5B400] text-[#012970]">
            HOST
          </span>
        )}
      </div>

      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex items-center gap-1 sm:gap-1.5">
        {isAudioMuted && (
          <div className="p-1 sm:p-1.5 rounded-lg bg-red-600/90 text-white shadow-sm" title="Microphone Muted">
            <MicOff className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </div>
        )}
        {isScreenSharing && (
          <div className="p-1 sm:p-1.5 rounded-lg bg-[#006EF3] text-white shadow-sm" title="Sharing Screen">
            <ScreenShare className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-hidden select-none">
      {/* ─── Minimalist Floating Top Overlay (Removed bulky header - Google Meet experience) ─── */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => {
              if (window.confirm('Leave this live session?')) {
                router.push(user?.role === 'TEACHER' ? '/teacher' : '/student');
              }
            }}
            title="Leave session"
            className="h-9 w-9 rounded-full bg-slate-900/80 border border-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-slate-800 transition-colors shadow-lg"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-white/10 backdrop-blur-md text-xs font-semibold text-white shadow-lg">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="font-bold truncate max-w-[140px] sm:max-w-xs">
              {session?.title || 'Team meeting'}
            </span>
            <span className="text-slate-400">({totalParticipants})</span>
          </div>
        </div>
      </div>

      {/* ─── Main Room Stage ──────────────────────────────────────────────── */}
      <div className="relative flex-1 flex flex-col sm:flex-row overflow-hidden pt-12 sm:pt-0">
        {/* Stage Content */}
        {isAnyScreenShared ? (
          /* Presentation Screen Share Layout (Desktop Side-by-Side as in Image 1, Mobile Stacking) */
          <div className="flex-1 flex flex-col md:flex-row h-full w-full gap-3 p-2 sm:p-3 overflow-hidden">
            {/* 1. Large Presentation View */}
            <div className="flex-1 min-w-0 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center relative h-full">
              {isScreenSharing ? (
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
              ) : (
                sharedRemotePeer && (
                  <RemoteVideoTile
                    peer={sharedRemotePeer}
                    isTeacherViewer={isTeacher}
                    onKick={() => setStudentToKick(sharedRemotePeer)}
                    onLowerHand={() => toggleHandRaise(sharedRemotePeer.userId)}
                    isLarge={true}
                  />
                )
              )}

              {/* Presenter Pill Badge (Google Meet style in Image 1) */}
              <div className="absolute top-3 left-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/85 border border-white/10 backdrop-blur-md text-xs font-semibold text-white shadow-xl pointer-events-none">
                <div className="h-5 w-5 rounded-full bg-[#006EF3] flex items-center justify-center text-[10px] font-bold">
                  {isScreenSharing ? (user?.firstName?.[0] || 'Y') : (sharedRemotePeer?.firstName?.[0] || 'P')}
                </div>
                <span>
                  {isScreenSharing
                    ? 'You are presenting'
                    : `${sharedRemotePeer?.firstName || 'Participant'} is presenting`}
                </span>
              </div>
            </div>

            {/* 2. Desktop Vertical Participant Sidebar (Image 1 experience) */}
            <div className="hidden md:flex md:w-72 lg:w-80 shrink-0 h-full flex-col gap-2 overflow-y-auto custom-scrollbar">
              {!isScreenSharing && (
                <div className="h-44 shrink-0 relative rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
                  {renderLocalVideoTile(true)}
                </div>
              )}
              {remotePeers
                .filter((p) => p.socketId !== sharedRemotePeer?.socketId)
                .map((peer) => (
                  <div key={peer.socketId} className="h-44 shrink-0 relative rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
                    <RemoteVideoTile
                      peer={peer}
                      isTeacherViewer={isTeacher}
                      onKick={() => setStudentToKick(peer)}
                      onLowerHand={() => toggleHandRaise(peer.userId)}
                      isSmall={true}
                    />
                  </div>
                ))}
            </div>

            {/* 3. Mobile Horizontal Participant Strip */}
            <div className="md:hidden h-28 shrink-0 flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {!isScreenSharing && (
                <div className="w-36 shrink-0 relative rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
                  {renderLocalVideoTile(true)}
                </div>
              )}
              {remotePeers
                .filter((p) => p.socketId !== sharedRemotePeer?.socketId)
                .map((peer) => (
                  <div key={peer.socketId} className="w-36 shrink-0 relative rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
                    <RemoteVideoTile
                      peer={peer}
                      isTeacherViewer={isTeacher}
                      onKick={() => setStudentToKick(peer)}
                      onLowerHand={() => toggleHandRaise(peer.userId)}
                      isSmall={true}
                    />
                  </div>
                ))}
            </div>
          </div>
        ) : (
          /* Normal Grid Video Stage */
          <div className="flex-1 w-full h-full p-2 sm:p-4 overflow-y-auto flex flex-col relative">
            {/* 1-on-1 Call Layout: Mobile Fullscreen + Floating PiP (Image 3) */}
            {totalParticipants === 2 && remotePeers.length === 1 ? (
              <>
                {/* Mobile View (< sm): Remote is full screen, local user is in a compact bottom-right PiP card */}
                <div className="sm:hidden absolute inset-0 w-full h-full overflow-hidden">
                  <RemoteVideoTile
                    peer={remotePeers[0]}
                    isTeacherViewer={isTeacher}
                    onKick={() => setStudentToKick(remotePeers[0])}
                    onLowerHand={() => toggleHandRaise(remotePeers[0].userId)}
                    isLarge={true}
                  />
                  {/* Floating Picture-in-Picture Local User Card (Image 3) */}
                  <div className="absolute bottom-20 right-3 w-28 h-40 rounded-2xl shadow-2xl overflow-hidden z-20">
                    {renderLocalVideoTile(false, true)}
                  </div>
                </div>

                {/* Desktop View (>= sm): Balanced side-by-side grid */}
                <div className="hidden sm:grid sm:grid-cols-2 gap-4 w-full h-full max-h-full">
                  {renderLocalVideoTile()}
                  <RemoteVideoTile
                    peer={remotePeers[0]}
                    isTeacherViewer={isTeacher}
                    onKick={() => setStudentToKick(remotePeers[0])}
                    onLowerHand={() => toggleHandRaise(remotePeers[0].userId)}
                  />
                </div>
              </>
            ) : (
              /* Group Adaptive Grid (2+ remote peers) */
              <div className={`grid gap-2 sm:gap-4 w-full h-full max-h-full ${getGridClasses()}`}>
                {renderLocalVideoTile()}
                {remotePeers.map((peer) => (
                  <RemoteVideoTile
                    key={peer.socketId}
                    peer={peer}
                    isTeacherViewer={isTeacher}
                    onKick={() => setStudentToKick(peer)}
                    onLowerHand={() => toggleHandRaise(peer.userId)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Slide-out Participants Drawer ─────────────────────────────── */}
        {showParticipantsDrawer && (
          <aside className="w-72 sm:w-80 border-l border-slate-800 bg-slate-900/95 backdrop-blur-md flex flex-col z-30 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#006EF3]" />
                <h3 className="text-sm font-bold text-white">Participants ({totalParticipants})</h3>
              </div>
              <button
                onClick={() => setShowParticipantsDrawer(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Participants list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {/* You */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-[#006EF3] flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {user?.firstName?.[0] || 'U'}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-white truncate">
                      {user?.firstName} {user?.lastName} <span className="text-slate-400 text-[10px] font-normal">(You)</span>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {isTeacher ? 'Session Host' : 'Participant'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isHandRaised && (
                    <button
                      onClick={() => toggleHandRaise()}
                      title="Click to lower your hand"
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 flex items-center gap-1 hover:bg-amber-400 transition-colors shadow"
                    >
                      <span>✋ Raised</span>
                      <span className="text-[9px] underline">Lower</span>
                    </button>
                  )}
                  {isAudioMuted ? (
                    <MicOff className="h-3.5 w-3.5 text-red-400" />
                  ) : (
                    <Mic className="h-3.5 w-3.5 text-emerald-400" />
                  )}
                </div>
              </div>

              {/* Remote Participants */}
              {remotePeers.map((peer) => (
                <div
                  key={peer.socketId}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0 overflow-hidden">
                      {peer.avatarUrl && !peer.avatarUrl.includes('facebook.com') ? (
                        <img
                          src={peer.avatarUrl}
                          alt=""
                          className="h-full w-full rounded-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        `${peer.firstName?.[0] || 'P'}`
                      )}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-white truncate">
                        {peer.firstName} {peer.lastName}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {peer.isTeacher ? 'Host Instructor' : 'Enrolled Student'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {peer.isHandRaised && (
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 flex items-center gap-1 shadow">
                          ✋ Raised
                        </span>
                        {isTeacher && (
                          <button
                            onClick={() => toggleHandRaise(peer.userId)}
                            title="Lower student's hand"
                            className="text-[10px] text-amber-400 hover:text-amber-300 underline font-semibold px-1 transition-colors"
                          >
                            Lower
                          </button>
                        )}
                      </div>
                    )}

                    {peer.isAudioMuted ? (
                      <MicOff className="h-3.5 w-3.5 text-red-400" />
                    ) : (
                      <Mic className="h-3.5 w-3.5 text-emerald-400" />
                    )}

                    {/* Teacher can kick participant */}
                    {isTeacher && !peer.isTeacher && (
                      <button
                        onClick={() => setStudentToKick(peer)}
                        title="Remove Participant"
                        className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors"
                      >
                        <UserX className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* ─── Slide-out Chat Drawer ─────────────────────────────── */}
        {showChatDrawer && (
          <aside className="w-full sm:w-80 border-l border-slate-800 bg-slate-900/95 backdrop-blur-md flex flex-col z-30 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#006EF3]" />
                <h3 className="text-sm font-bold text-white">Live Chat</h3>
              </div>
              <button
                onClick={() => setShowChatDrawer(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center text-slate-500 text-xs mt-10">No messages yet. Say hello!</div>
              ) : (
                chatMessages.map(msg => (
                  <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.isLocal ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                    <span className="text-[10px] text-slate-400 mb-1">{msg.firstName} {msg.lastName}</span>
                    <div className={`px-3 py-2 rounded-2xl text-sm ${msg.isLocal ? 'bg-[#006EF3] text-white rounded-br-sm' : 'bg-slate-800 text-slate-200 rounded-bl-sm'}`}>
                      {msg.message}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-slate-800 shrink-0 bg-slate-900">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (chatInput.trim()) {
                    sendChatMessage(chatInput.trim());
                    setChatInput('');
                  }
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-800 border-none rounded-xl text-sm text-white px-3 py-2 outline-none focus:ring-2 focus:ring-[#006EF3]"
                />
                <button type="submit" disabled={!chatInput.trim()} className="p-2 bg-[#006EF3] text-white rounded-xl disabled:opacity-50">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </aside>
        )}
      </div>

      {/* ─── Upper Rower of 10 Reactions (Google Meet style) ─────────────── */}
      {showReactionPicker && (
        <div
          ref={reactionPickerRef}
          className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-slate-700/80 rounded-full px-3 py-2 shadow-2xl backdrop-blur-md flex items-center gap-1 sm:gap-2 animate-in fade-in zoom-in-95 duration-150 max-w-[95vw] overflow-x-auto custom-scrollbar"
        >
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReactionClick(emoji)}
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full hover:bg-slate-800 flex items-center justify-center text-lg sm:text-xl hover:scale-125 active:scale-75 transition-all select-none"
              title={`React ${emoji}`}
            >
              {emoji}
            </button>
          ))}
          <button
            onClick={() => setShowReactionPicker(false)}
            className="p-1.5 ml-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
            title="Close reactions"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ─── Bottom Floating Control Dock (Google Meet style) ──────────────── */}
      <footer className="h-16 sm:h-20 shrink-0 bg-slate-950/95 border-t border-slate-800/80 px-3 sm:px-6 flex items-center justify-between backdrop-blur-md z-30">
        {/* Left: Meeting Title */}
        <div className="hidden md:flex items-center gap-2.5 text-xs text-slate-300 min-w-0 max-w-[200px] truncate">
          <span className="font-bold text-white truncate">{session?.title || 'Team meeting'}</span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px]">Active</span>
          </span>
        </div>

        {/* Center: Core Controls */}
        <div className="flex items-center gap-2 sm:gap-3 mx-auto">
          {/* Mic */}
          <button
            onClick={toggleAudio}
            title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center transition-all ${
              isAudioMuted
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
          >
            {isAudioMuted ? <MicOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Mic className="h-4 w-4 sm:h-5 sm:w-5" />}
          </button>

          {/* Camera */}
          <button
            onClick={toggleVideo}
            title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
            className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center transition-all ${
              isVideoOff
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
          >
            {isVideoOff ? <VideoOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <VideoIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
          </button>

          {/* Screen Share (With shared tab/system audio) */}
          <button
            onClick={toggleScreenShare}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen (includes tab audio)'}
            className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center transition-all ${
              isScreenSharing
                ? 'bg-[#006EF3] text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
          >
            <ScreenShare className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* Raise Hand Toggle (Persistent like Google Meet) */}
          <button
            onClick={() => {
              toggleHandRaise();
              if (!isHandRaised) {
                spawnSingleFloatingEmoji('✋');
              }
            }}
            title={isHandRaised ? 'Lower Hand (✋ Raised)' : 'Raise Hand'}
            className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center transition-all ${
              isHandRaised
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/30 ring-2 ring-amber-300 ring-offset-2 ring-offset-slate-900 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700'
            }`}
          >
            <Hand className={`h-4 w-4 sm:h-5 sm:w-5 ${isHandRaised ? 'fill-slate-950 text-slate-950' : ''}`} />
          </button>
          
          {/* Reaction Button (Toggles Upper Rower) */}
          <button
            onClick={() => setShowReactionPicker((prev) => !prev)}
            title="Choose Reaction"
            className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center transition-all border ${
              showReactionPicker
                ? 'bg-[#006EF3] text-white border-[#006EF3]'
                : 'bg-slate-800 hover:bg-slate-700 text-pink-400 border-slate-700'
            }`}
          >
            <Smile className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* Red Leave / End Call Button */}
          {isTeacher ? (
            <Button
              onClick={() => {
                if (window.confirm('Are you sure you want to end this live session for all participants?')) {
                  endSession();
                }
              }}
              className="h-10 sm:h-12 px-4 sm:px-6 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold gap-2 shadow-lg shadow-red-600/30"
            >
              <PhoneOff className="h-4 w-4" />
              <span className="hidden sm:inline">End Session</span>
            </Button>
          ) : (
            <Button
              onClick={() => {
                if (window.confirm('Leave this live session?')) {
                  router.push('/student');
                }
              }}
              className="h-10 sm:h-12 px-4 sm:px-6 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold gap-2 shadow-lg shadow-red-600/30"
            >
              <PhoneOff className="h-4 w-4" />
              <span className="hidden sm:inline">Leave</span>
            </Button>
          )}
        </div>

        {/* Right: Drawer Toggles & Link */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={copyRoomLink}
            title="Copy Session Link"
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-full text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span className="hidden lg:inline">{copiedLink ? 'Copied' : 'Invite'}</span>
          </button>

          <button
            onClick={() => {
              setShowParticipantsDrawer(false);
              setShowChatDrawer(!showChatDrawer);
            }}
            title="Chat"
            className={`p-2 sm:px-2.5 sm:py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center gap-1.5 ${
              showChatDrawer
                ? 'bg-[#006EF3] border-[#006EF3] text-white'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            {chatMessages.length > 0 && (
              <span className="h-2 w-2 rounded-full bg-blue-400" />
            )}
          </button>

          <button
            onClick={() => {
              setShowChatDrawer(false);
              setShowParticipantsDrawer(!showParticipantsDrawer);
            }}
            title="Participants"
            className={`p-2 sm:px-2.5 sm:py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center gap-1.5 ${
              showParticipantsDrawer
                ? 'bg-[#006EF3] border-[#006EF3] text-white'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <Users className="h-4 w-4" />
            <span className="text-xs">{totalParticipants}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors hidden sm:flex items-center justify-center"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </footer>

      {/* ─── Kick Participant Confirmation Modal ──────────────────────────── */}
      {studentToKick && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="max-w-sm w-full p-5 rounded-2xl bg-slate-900 border border-slate-800 text-white space-y-4 shadow-2xl">
            <div className="h-10 w-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <UserX className="h-5 w-5" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-bold text-white">Remove Participant?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to remove {studentToKick.firstName} {studentToKick.lastName} from this live session?
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStudentToKick(null)}
                className="text-slate-300 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  kickParticipant(studentToKick.userId);
                  setStudentToKick(null);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Floating Quick Emoji Particles Stream ────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingParticles.map((particle) => (
          <div
            key={particle.id}
            className="absolute select-none pointer-events-none animate-float-up-quick"
            style={{
              left: `${particle.left}%`,
              bottom: `${particle.bottom}px`,
              fontSize: `${particle.size}px`,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`,
              // @ts-ignore
              '--sway-mid': `${particle.swayMid}px`,
              '--sway-end': `${particle.swayEnd}px`,
            }}
          >
            {particle.emoji}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Subcomponent for Rendering Remote Video Track
 */
function RemoteVideoTile({
  peer,
  isTeacherViewer,
  onKick,
  onLowerHand,
  isLarge,
  isSmall,
}: {
  peer: ParticipantMedia;
  isTeacherViewer: boolean;
  onKick: () => void;
  onLowerHand?: () => void;
  isLarge?: boolean;
  isSmall?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);

  // Dedicated Audio element for remote sound
  useEffect(() => {
    const audioEl = audioRef.current;
    if (audioEl && peer.stream) {
      if (audioEl.srcObject !== peer.stream) {
        audioEl.srcObject = peer.stream;
      }
      audioEl.play().catch((err) => {
        if (err.name === 'NotAllowedError') {
          setAudioBlocked(true);
        }
      });
    }
  }, [peer.stream]);

  // Video element plays both video and audio
  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl && peer.stream) {
      if (videoEl.srcObject !== peer.stream) {
        videoEl.srcObject = peer.stream;
      }
      videoEl.play().catch((err) => {
        if (err.name === 'NotAllowedError') {
          setAudioBlocked(true);
        }
      });
    }
  }, [peer.stream, peer.isVideoOff]);

  const hasVideoTrack = Boolean(
    peer.stream &&
    peer.stream.getVideoTracks().length > 0 &&
    !peer.isVideoOff
  );

  const unlockAudio = () => {
    if (videoRef.current) {
      videoRef.current.play().then(() => setAudioBlocked(false)).catch(() => {});
    }
    if (audioRef.current) {
      audioRef.current.play().then(() => setAudioBlocked(false)).catch(() => {});
    }
  };

  return (
    <div
      onClick={unlockAudio}
      className={`relative rounded-2xl bg-slate-900 border overflow-hidden shadow-lg flex items-center justify-center group transition-all duration-200 ${
        peer.isHandRaised
          ? 'border-amber-400 ring-2 ring-amber-400 shadow-amber-500/20 shadow-xl'
          : 'border-slate-800'
      } ${isLarge ? 'w-full h-full' : isSmall ? 'w-full h-full' : 'min-h-[180px]'}`}
    >
      {/* Hand Raised Persistent Google Meet Badge */}
      {peer.isHandRaised && (
        <div
          className={`absolute z-20 flex items-center gap-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold shadow-lg animate-pulse ${
            isSmall
              ? 'top-1.5 left-1.5 px-1.5 py-0.5 text-[10px]'
              : 'top-3 left-3 px-2.5 py-1 text-xs'
          }`}
        >
          <span>✋</span>
          {!isSmall && <span>Hand Raised</span>}
          {isTeacherViewer && onLowerHand && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLowerHand();
              }}
              className="ml-1 text-[10px] bg-slate-950/20 hover:bg-slate-950/40 px-1.5 py-0.5 rounded uppercase font-black tracking-wide text-slate-950 transition-colors"
              title="Lower student's hand"
            >
              Lower
            </button>
          )}
        </div>
      )}

      {/* Dedicated hidden audio playback fallback */}
      <audio ref={audioRef} autoPlay playsInline />

      {/* Video element (unmuted so remote voice plays directly) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          hasVideoTrack ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'
        }`}
      />

      {audioBlocked && (
        <button
          onClick={unlockAudio}
          className="absolute top-3 left-3 z-20 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-2xl animate-bounce flex items-center gap-1.5"
        >
          <Volume2 className="h-3.5 w-3.5" />
          Click to enable voice
        </button>
      )}

      {!hasVideoTrack && (
        <div className="flex flex-col items-center justify-center gap-2 p-4 text-center z-10">
          <div className="relative h-16 w-16 sm:h-24 sm:w-24 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 border-2 border-slate-600/80 overflow-hidden shadow-2xl flex items-center justify-center">
            {peer.avatarUrl && !peer.avatarUrl.includes('facebook.com') ? (
              <img
                src={peer.avatarUrl}
                alt={`${peer.firstName || 'Participant'}'s profile picture`}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="text-xl sm:text-3xl font-black text-white">
                {peer.firstName?.[0] || 'P'}
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-slate-300">
            {peer.firstName} {peer.lastName}
          </p>
          <span className="text-[10px] text-slate-500">Camera is paused</span>
        </div>
      )}

      {/* Participant Name Tag */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-semibold border border-white/10">
        <span className="text-white">
          {peer.firstName} {peer.lastName}
        </span>
        {peer.isTeacher && (
          <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-[#F5B400] text-[#012970]">
            TEACHER
          </span>
        )}
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        {peer.isAudioMuted && (
          <div className="p-1.5 rounded-lg bg-red-600/90 text-white shadow-sm" title="Muted">
            <MicOff className="h-3.5 w-3.5" />
          </div>
        )}

        {isTeacherViewer && !peer.isTeacher && (
          <button
            onClick={onKick}
            title="Remove Student"
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-600/90 hover:bg-red-700 text-white transition-opacity shadow-sm"
          >
            <UserX className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
