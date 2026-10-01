'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocketClient } from './socket-client';
import { apiClient } from './api-client';

export interface ParticipantMedia {
  socketId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  isTeacher: boolean;
  isAudioMuted: boolean;
  isVideoOff: boolean;
  stream?: MediaStream;
}

export interface LiveSessionData {
  id: string;
  title: string;
  topic?: string;
  type: 'ONE_ON_ONE' | 'GROUP';
  status: 'UPCOMING' | 'LIVE' | 'ENDED';
  teacherId: string;
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
  participants: Array<{
    participantId: string;
    studentId: string;
    status: 'INVITED' | 'JOINED' | 'LEFT' | 'REMOVED';
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  }>;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export function useLiveSession(sessionId: string) {
  const [session, setSession] = useState<LiveSessionData | null>(null);
  const [isTeacher, setIsTeacher] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnded, setIsEnded] = useState<boolean>(false);
  const [isKicked, setIsKicked] = useState<boolean>(false);

  // Local media state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);

  // Remote participants map: socketId -> ParticipantMedia
  const [remotePeers, setRemotePeers] = useState<Map<string, ParticipantMedia>>(new Map());

  // WebRTC Peer connections map: socketId -> RTCPeerConnection
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Sync ref with state
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  /**
   * Initialize User Media (Camera & Mic)
   */
  const initLocalMedia = useCallback(async () => {
    try {
      if (typeof window === 'undefined' || !navigator?.mediaDevices) {
        return null;
      }

      // Try camera + mic first
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (err: any) {
        console.warn('Could not get video+audio, trying audio only:', err.message);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
        } catch {
          // If no devices available at all, create an empty dummy canvas stream
          console.warn('No media devices available, creating fallback blank stream');
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 360;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#012970';
            ctx.fillRect(0, 0, 640, 360);
          }
          stream = (canvas as any).captureStream ? (canvas as any).captureStream(10) : new MediaStream();
        }
      }

      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (err: any) {
      console.error('Failed to initialize local media:', err);
      return null;
    }
  }, []);

  /**
   * Create Peer Connection for a specific peer socket
   */
  const createPeerConnection = useCallback(
    (targetSocketId: string, peerInfo: Partial<ParticipantMedia>) => {
      if (peerConnections.current.has(targetSocketId)) {
        return peerConnections.current.get(targetSocketId)!;
      }

      const socket = getSocketClient();
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnections.current.set(targetSocketId, pc);

      // Add local stream tracks to PC
      const activeStream = localStreamRef.current;
      if (activeStream) {
        activeStream.getTracks().forEach((track) => {
          pc.addTrack(track, activeStream);
        });
      }

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket?.emit) {
          socket.emit('live:signal', {
            targetSocketId,
            signalData: event.candidate,
            type: 'ice-candidate',
          });
        }
      };

      // Handle remote incoming tracks
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setRemotePeers((prev) => {
          const next = new Map(prev);
          const currentPeer = next.get(targetSocketId) || {
            socketId: targetSocketId,
            userId: peerInfo.userId || '',
            firstName: peerInfo.firstName || 'Participant',
            lastName: peerInfo.lastName || '',
            email: peerInfo.email || '',
            avatarUrl: peerInfo.avatarUrl,
            isTeacher: Boolean(peerInfo.isTeacher),
            isAudioMuted: Boolean(peerInfo.isAudioMuted),
            isVideoOff: Boolean(peerInfo.isVideoOff),
          };

          next.set(targetSocketId, {
            ...currentPeer,
            stream: remoteStream,
          });
          return next;
        });
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          console.log(`Peer ${targetSocketId} connection state: ${pc.connectionState}`);
        }
      };

      return pc;
    },
    []
  );

  /**
   * Main Setup: Fetch Session & Wire Socket Events
   */
  useEffect(() => {
    let isSubscribed = true;

    async function setupRoom() {
      try {
        setIsLoading(true);
        setError(null);

        // 1. Fetch session details from backend API
        const data = await apiClient.get<LiveSessionData & { isTeacher: boolean }>(
          `/live-sessions/${sessionId}`
        );

        if (!isSubscribed) return;
        setSession(data);
        setIsTeacher(Boolean(data.isTeacher));

        if (data.status === 'ENDED') {
          setIsEnded(true);
          setIsLoading(false);
          return;
        }

        // 2. Initialize local camera/mic stream
        const stream = await initLocalMedia();
        if (!isSubscribed) return;

        // 3. Connect to Socket.IO room
        const socket = getSocketClient();
        if (!socket) {
          throw new Error('Could not establish real-time socket connection');
        }

        socket.emit('live:join-room', { sessionId }, (response: any) => {
          if (!response?.success) {
            console.warn('Join room callback:', response?.error);
            if (response?.error) {
              setError(response.error);
            }
          }
        });

        // Event: Session successfully joined with existing peers
        socket.on('live:joined-success', async ({ peers }: { peers: ParticipantMedia[] }) => {
          if (!isSubscribed) return;

          // For each existing peer, create a peer connection and send an Offer
          for (const peer of peers) {
            const pc = createPeerConnection(peer.socketId, peer);

            setRemotePeers((prev) => {
              const next = new Map(prev);
              next.set(peer.socketId, {
                ...peer,
              });
              return next;
            });

            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);

              socket.emit('live:signal', {
                targetSocketId: peer.socketId,
                signalData: offer,
                type: 'offer',
              });
            } catch (err) {
              console.error('Error creating offer for peer:', peer.socketId, err);
            }
          }

          setIsLoading(false);
        });

        // Event: A new user joined the room
        socket.on('live:user-joined', (newPeer: ParticipantMedia) => {
          if (!isSubscribed) return;
          console.log('Peer joined room:', newPeer.firstName);

          setRemotePeers((prev) => {
            const next = new Map(prev);
            next.set(newPeer.socketId, newPeer);
            return next;
          });

          // Pre-create PC, we'll wait for their offer
          createPeerConnection(newPeer.socketId, newPeer);
        });

        // Event: WebRTC Signaling incoming (Offer, Answer, ICE Candidate)
        socket.on('live:signal', async ({ fromSocketId, fromUser, signalData, type }: any) => {
          if (!isSubscribed) return;
          let pc = peerConnections.current.get(fromSocketId);
          if (!pc) {
            pc = createPeerConnection(fromSocketId, fromUser || {});
          }

          try {
            if (type === 'offer') {
              await pc.setRemoteDescription(new RTCSessionDescription(signalData));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              socket.emit('live:signal', {
                targetSocketId: fromSocketId,
                signalData: answer,
                type: 'answer',
              });
            } else if (type === 'answer') {
              await pc.setRemoteDescription(new RTCSessionDescription(signalData));
            } else if (type === 'ice-candidate') {
              if (signalData) {
                await pc.addIceCandidate(new RTCIceCandidate(signalData));
              }
            }
          } catch (err) {
            console.error('Signaling handling error:', err);
          }
        });

        // Event: Peer media state toggled
        socket.on('live:peer-media-toggled', ({ socketId, isAudioMuted, isVideoOff }: any) => {
          setRemotePeers((prev) => {
            const next = new Map(prev);
            const peer = next.get(socketId);
            if (peer) {
              next.set(socketId, {
                ...peer,
                isAudioMuted: Boolean(isAudioMuted),
                isVideoOff: Boolean(isVideoOff),
              });
            }
            return next;
          });
        });

        // Event: User left room
        socket.on('live:user-left', ({ socketId }: { socketId: string }) => {
          if (peerConnections.current.has(socketId)) {
            peerConnections.current.get(socketId)?.close();
            peerConnections.current.delete(socketId);
          }
          setRemotePeers((prev) => {
            const next = new Map(prev);
            next.delete(socketId);
            return next;
          });
        });

        // Event: Teacher ended session
        socket.on('live:session-ended', ({ session: updatedSession }: any) => {
          setIsEnded(true);
          if (updatedSession) {
            setSession(updatedSession);
          }
        });

        // Event: Kicked by teacher
        socket.on('live:kicked', () => {
          setIsKicked(true);
          setIsEnded(true);
        });

        // Event: Participant removed from session
        socket.on('live:participant-removed', ({ studentId }: { studentId: string }) => {
          // Remove peer matching studentId
          setRemotePeers((prev) => {
            const next = new Map<string, ParticipantMedia>();
            Array.from(prev.entries()).forEach(([sId, peer]) => {
              if (peer.userId !== studentId) {
                next.set(sId, peer);
              } else {
                peerConnections.current.get(sId)?.close();
                peerConnections.current.delete(sId);
              }
            });
            return next;
          });
        });

        // Event: Session status changed (e.g. from UPCOMING to LIVE)
        socket.on('live:session-status-changed', ({ session: updatedSession }: any) => {
          if (updatedSession) {
            setSession(updatedSession);
          }
        });

        // Event: Error
        socket.on('live:error', ({ message }: { message: string }) => {
          setError(message);
        });
      } catch (err: any) {
        if (!isSubscribed) return;
        setError(err.message || 'Failed to initialize live session');
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    }

    setupRoom();

    return () => {
      isSubscribed = false;
      const socket = getSocketClient();
      if (socket) {
        socket.emit('live:leave-room', { sessionId });
        socket.off('live:joined-success');
        socket.off('live:user-joined');
        socket.off('live:signal');
        socket.off('live:peer-media-toggled');
        socket.off('live:user-left');
        socket.off('live:session-ended');
        socket.off('live:kicked');
        socket.off('live:participant-removed');
        socket.off('live:session-status-changed');
        socket.off('live:error');
      }

      // Close all peer connections
      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();

      // Stop local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [sessionId, initLocalMedia, createPeerConnection]);

  /**
   * Toggle Audio Mute
   */
  const toggleAudio = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      const newMuted = !audioTrack.enabled;
      setIsAudioMuted(newMuted);

      const socket = getSocketClient();
      if (socket?.emit) {
        socket.emit('live:media-toggle', {
          sessionId,
          isAudioMuted: newMuted,
          isVideoOff,
        });
      }
    }
  }, [sessionId, isVideoOff]);

  /**
   * Toggle Video On/Off
   */
  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      const newVideoOff = !videoTrack.enabled;
      setIsVideoOff(newVideoOff);

      const socket = getSocketClient();
      if (socket?.emit) {
        socket.emit('live:media-toggle', {
          sessionId,
          isAudioMuted,
          isVideoOff: newVideoOff,
        });
      }
    }
  }, [sessionId, isAudioMuted]);

  /**
   * Toggle Screen Sharing
   */
  const toggleScreenShare = useCallback(async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing and revert to camera
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((t) => t.stop());
          screenStreamRef.current = null;
        }

        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newVideoTrack = cameraStream.getVideoTracks()[0];

        // Replace track in all peer connections
        peerConnections.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(newVideoTrack);
          }
        });

        // Update localStream
        if (localStreamRef.current) {
          const oldTrack = localStreamRef.current.getVideoTracks()[0];
          if (oldTrack) {
            localStreamRef.current.removeTrack(oldTrack);
            oldTrack.stop();
          }
          localStreamRef.current.addTrack(newVideoTrack);
        }

        setIsScreenSharing(false);
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        // Listen for user stopping screen share via browser UI
        screenTrack.onended = () => {
          toggleScreenShare();
        };

        // Replace track in all peer connections
        peerConnections.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        // Update localStream
        if (localStreamRef.current) {
          const oldTrack = localStreamRef.current.getVideoTracks()[0];
          if (oldTrack) {
            localStreamRef.current.removeTrack(oldTrack);
            oldTrack.stop();
          }
          localStreamRef.current.addTrack(screenTrack);
        }

        setIsScreenSharing(true);
      }
    } catch (err: any) {
      console.warn('Screen share toggle failed/cancelled:', err.message);
    }
  }, [isScreenSharing]);

  /**
   * Teacher ends the live session
   */
  const endSession = useCallback(async () => {
    try {
      await apiClient.post(`/live-sessions/${sessionId}/end`, {});
      setIsEnded(true);
    } catch (err: any) {
      console.error('Error ending session:', err);
      // Fallback via socket
      const socket = getSocketClient();
      if (socket?.emit) {
        socket.emit('live:end-session', { sessionId });
      }
    }
  }, [sessionId]);

  /**
   * Teacher removes/kicks a participant
   */
  const kickParticipant = useCallback(
    async (studentId: string) => {
      try {
        await apiClient.post(`/live-sessions/${sessionId}/remove-participant`, { studentId });
      } catch (err: any) {
        console.error('Error kicking participant via API, trying socket:', err);
        const socket = getSocketClient();
        if (socket?.emit) {
          socket.emit('live:kick-participant', { sessionId, studentId });
        }
      }
    },
    [sessionId]
  );

  return {
    session,
    isTeacher,
    isLoading,
    error,
    isEnded,
    isKicked,
    localStream,
    remotePeers: Array.from(remotePeers.values()),
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    endSession,
    kickParticipant,
  };
}
