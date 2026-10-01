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
} from 'lucide-react';
import { useLiveSession, ParticipantMedia } from '@/lib/use-live-session';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';

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
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    endSession,
    kickParticipant,
  } = useLiveSession(sessionId);

  const [showParticipantsDrawer, setShowParticipantsDrawer] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [studentToKick, setStudentToKick] = useState<ParticipantMedia | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);

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

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-hidden select-none">
      {/* ─── Top Room Bar ─────────────────────────────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800/80 bg-slate-900/90 px-4 md:px-6 backdrop-blur-md z-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-red-400">LIVE</span>
          </div>

          <span className="text-slate-600 hidden sm:inline">|</span>

          <div className="truncate">
            <h1 className="text-sm font-bold text-white truncate">
              {session?.title || 'Live Classroom Session'}
            </h1>
            {session?.topic && (
              <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                {session.topic}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={copyRoomLink}
            title="Copy Session Link"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Invite Link'}</span>
          </button>

          <button
            onClick={() => setShowParticipantsDrawer(!showParticipantsDrawer)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
              showParticipantsDrawer
                ? 'bg-[#006EF3] border-[#006EF3] text-white'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>{totalParticipants}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors hidden sm:block"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* ─── Main Room Stage ──────────────────────────────────────────────── */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Video Grid Canvas */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto flex items-center justify-center">
          <div className={`grid gap-3 sm:gap-4 w-full h-full max-h-full ${getGridClasses()}`}>
            {/* 1. Local Video Tile */}
            <div className="relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg flex items-center justify-center group min-h-[180px]">
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
                <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-tr from-[#012970] to-[#006EF3] border-2 border-white/20 flex items-center justify-center text-xl sm:text-2xl font-black text-white shadow-xl">
                    {user?.firstName?.[0] || 'U'}
                  </div>
                  <p className="text-xs font-medium text-slate-400">Camera is paused</p>
                </div>
              )}

              {/* Status Badges Overlay */}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-semibold border border-white/10">
                <span className="text-white">
                  {user?.firstName} {user?.lastName} (You)
                </span>
                {isTeacher && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-[#F5B400] text-[#012970]">
                    HOST
                  </span>
                )}
              </div>

              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                {isAudioMuted && (
                  <div className="p-1.5 rounded-lg bg-red-600/90 text-white shadow-sm" title="Microphone Muted">
                    <MicOff className="h-3.5 w-3.5" />
                  </div>
                )}
                {isScreenSharing && (
                  <div className="p-1.5 rounded-lg bg-[#006EF3] text-white shadow-sm" title="Sharing Screen">
                    <ScreenShare className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            </div>

            {/* 2. Remote Peer Video Tiles */}
            {remotePeers.map((peer) => (
              <RemoteVideoTile
                key={peer.socketId}
                peer={peer}
                isTeacherViewer={isTeacher}
                onKick={() => setStudentToKick(peer)}
              />
            ))}
          </div>
        </div>

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
      </div>

      {/* ─── Bottom Floating Control Dock ─────────────────────────────────── */}
      <footer className="h-20 shrink-0 border-t border-slate-800/80 bg-slate-900/95 px-4 flex items-center justify-between backdrop-blur-md z-20">
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time WebRTC Mesh Active</span>
        </div>

        {/* Core Media Controls */}
        <div className="flex items-center gap-2.5 mx-auto">
          {/* Mic */}
          <button
            onClick={toggleAudio}
            title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            className={`h-11 w-11 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center transition-all ${
              isAudioMuted
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
          >
            {isAudioMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          {/* Camera */}
          <button
            onClick={toggleVideo}
            title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
            className={`h-11 w-11 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center transition-all ${
              isVideoOff
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
          >
            {isVideoOff ? <VideoOff className="h-5 w-5" /> : <VideoIcon className="h-5 w-5" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
            className={`h-11 w-11 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center transition-all ${
              isScreenSharing
                ? 'bg-[#006EF3] text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
          >
            <ScreenShare className="h-5 w-5" />
          </button>

          {/* Leave / End Button */}
          {isTeacher ? (
            <Button
              onClick={() => {
                if (window.confirm('Are you sure you want to end this live session for all participants?')) {
                  endSession();
                }
              }}
              className="h-11 sm:h-12 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold gap-2 shadow-lg shadow-red-600/30"
            >
              <PhoneOff className="h-4 w-4" />
              <span>End Session</span>
            </Button>
          ) : (
            <Button
              onClick={() => {
                if (window.confirm('Leave this live session?')) {
                  router.push('/student');
                }
              }}
              className="h-11 sm:h-12 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold gap-2 shadow-lg shadow-red-600/30"
            >
              <PhoneOff className="h-4 w-4" />
              <span>Leave</span>
            </Button>
          )}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {session?.type === 'ONE_ON_ONE' ? (
            <Badge variant="outline" className="text-slate-400 border-slate-700">
              1-to-1 Private
            </Badge>
          ) : (
            <Badge variant="outline" className="text-slate-400 border-slate-700">
              Group Classroom
            </Badge>
          )}
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
}: {
  peer: ParticipantMedia;
  isTeacherViewer: boolean;
  onKick: () => void;
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

  // Video element (muted so browser never blocks video stream autoplay)
  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl && peer.stream) {
      if (videoEl.srcObject !== peer.stream) {
        videoEl.srcObject = peer.stream;
      }
      videoEl.play().catch((err) => {
        console.warn('Playback error on remote video:', err);
      });
    }
  }, [peer.stream, peer.isVideoOff]);

  const hasVideoTrack = Boolean(
    peer.stream &&
    peer.stream.getVideoTracks().length > 0 &&
    !peer.isVideoOff
  );

  return (
    <div
      onClick={() => {
        if (audioBlocked && audioRef.current) {
          audioRef.current.play().then(() => setAudioBlocked(false)).catch(() => {});
        }
      }}
      className="relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg flex items-center justify-center group min-h-[180px]"
    >
      {/* Dedicated hidden audio playback element */}
      <audio ref={audioRef} autoPlay playsInline />

      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          hasVideoTrack ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'
        }`}
      />

      {audioBlocked && (
        <div className="absolute top-3 left-3 z-20 px-2 py-1 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-lg animate-pulse cursor-pointer shadow-lg">
          🔊 Click tile to enable sound
        </div>
      )}

      {!hasVideoTrack && (
        <div className="flex flex-col items-center justify-center gap-2 p-4 text-center z-10">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 border-2 border-slate-600 flex items-center justify-center text-xl sm:text-2xl font-black text-white shadow-xl">
            {peer.firstName?.[0] || 'P'}
          </div>
          <p className="text-xs font-medium text-slate-400">
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
