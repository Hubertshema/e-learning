'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocketClient } from './socket-client';
import { apiClient, tokenStorage } from './api-client';

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
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
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

  // WebRTC Peer connections & ICE queues
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const videoSenders = useRef<Map<string, RTCRtpSender>>(new Map());

  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const isScreenSharingRef = useRef<boolean>(false);

  // Keep refs synchronized with state and attach tracks to any active PCs
  useEffect(() => {
    localStreamRef.current = localStream;
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      const videoTrack = isScreenSharingRef.current && screenStreamRef.current
        ? screenStreamRef.current.getVideoTracks()[0]
        : localStream.getVideoTracks()[0];

      peerConnections.current.forEach((pc, targetSocketId) => {
        const senders = pc.getSenders();
        if (audioTrack && !senders.find((s) => s.track && s.track.kind === 'audio')) {
          try {
            pc.addTrack(audioTrack, localStream);
          } catch (e) {
            console.warn('Track attach warning (audio):', e);
          }
        }
        if (videoTrack) {
          const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(videoTrack).catch(() => {});
          } else {
            try {
              const sender = pc.addTrack(videoTrack, localStream);
              videoSenders.current.set(targetSocketId, sender);
            } catch (e) {
              console.warn('Track attach warning (video):', e);
            }
          }
        }
      });
    }
  }, [localStream]);

  useEffect(() => {
    isScreenSharingRef.current = isScreenSharing;
  }, [isScreenSharing]);

  /**
   * Initialize Local Media (Camera & Mic)
   */
  const initLocalMedia = useCallback(async () => {
    try {
      if (typeof window === 'undefined') {
        return null;
      }

      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error(
          'Camera and microphone access is restricted. If accessing from another PC via HTTP IP, browsers require chrome://flags/#unsafely-treat-insecure-origin-as-secure or HTTPS.'
        );
      }

      let stream: MediaStream;
      try {
        // High-compatibility constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch (err: any) {
        console.warn('Could not get video+audio, trying audio only:', err.name, err.message);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          setIsVideoOff(true);
        } catch (audioErr: any) {
          console.warn('Audio failed, trying video only:', audioErr.message);
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
            setIsAudioMuted(true);
          } catch (allErr: any) {
            console.error('All media devices failed:', allErr.message);
            throw new Error(
              `Camera and microphone access was denied or unavailable (${err.message || allErr.message}). Please check browser permissions.`
            );
          }
        }
      }

      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (err: any) {
      console.error('Failed to initialize local media:', err);
      setError(err.message || 'Failed to initialize local media devices');
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

      // Determine active video track (screen or camera)
      const currentStream = localStreamRef.current;
      const screenStream = screenStreamRef.current;
      const activeVideoTrack = isScreenSharingRef.current && screenStream
        ? screenStream.getVideoTracks()[0]
        : currentStream?.getVideoTracks()[0];

      const activeAudioTrack = currentStream?.getAudioTracks()[0];

      if (activeAudioTrack && currentStream) {
        try {
          pc.addTrack(activeAudioTrack, currentStream);
        } catch (e) {
          console.warn('Error adding audio track:', e);
        }
      }

      if (activeVideoTrack && currentStream) {
        try {
          const sender = pc.addTrack(activeVideoTrack, currentStream);
          videoSenders.current.set(targetSocketId, sender);
        } catch (e) {
          console.warn('Error adding video track:', e);
        }
      }

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket?.emit) {
          socket.emit('live:signal', {
            targetSocketId,
            signalData: event.candidate.toJSON(),
            type: 'ice-candidate',
          });
        }
      };

      // Handle incoming remote tracks
      pc.ontrack = (event) => {
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

          const existingStream = currentPeer.stream;
          let allTracks: MediaStreamTrack[] = [];
          if (existingStream) {
            allTracks = [...existingStream.getTracks()];
            if (!allTracks.find((t) => t.id === event.track.id)) {
              allTracks.push(event.track);
            }
          } else {
            allTracks = event.streams?.[0] ? event.streams[0].getTracks() : [event.track];
          }

          // Create brand new MediaStream instance so React state change triggers video/audio attachment
          const freshStream = new MediaStream(allTracks);

          next.set(targetSocketId, {
            ...currentPeer,
            stream: freshStream,
          });
          return next;
        });
      };

      // Connection state logging
      pc.onconnectionstatechange = () => {
        console.log(`📡 Peer ${targetSocketId} connectionState:`, pc.connectionState);
      };

      return pc;
    },
    []
  );

  /**
   * Drain queued ICE candidates once remote description is set
   */
  const drainIceCandidates = useCallback(async (socketId: string, pc: RTCPeerConnection) => {
    const queue = pendingCandidates.current.get(socketId);
    if (!queue || queue.length === 0) return;

    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('Failed to add queued ICE candidate:', err);
      }
    }
    pendingCandidates.current.delete(socketId);
  }, []);

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
        await initLocalMedia();
        if (!isSubscribed) return;

        // 3. Connect to Socket.IO room with token
        const socket = getSocketClient();
        if (!socket) {
          throw new Error('Could not establish real-time socket connection');
        }

        const joinRoom = () => {
          const token = tokenStorage.getAccessToken();
          socket.emit('live:join-room', { sessionId, token }, (response: any) => {
            if (!response?.success) {
              console.warn('Join room callback:', response?.error);
              if (response?.error) {
                setError(response.error);
              }
            }
          });
        };

        socket.on('connect', joinRoom);
        if (socket.connected) {
          joinRoom();
        }

        // Event: Session successfully joined with existing peers
        socket.on('live:joined-success', async ({ peers }: { peers: ParticipantMedia[] }) => {
          if (!isSubscribed) return;

          // For each existing peer, create connection and initiate Offer
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
              const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
              });
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
          console.log('👤 Participant joined room:', newPeer.firstName, newPeer.socketId);

          setRemotePeers((prev) => {
            const next = new Map(prev);
            next.set(newPeer.socketId, newPeer);
            return next;
          });

          // Pre-create PC, we will answer their incoming offer
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
              await drainIceCandidates(fromSocketId, pc);

              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              socket.emit('live:signal', {
                targetSocketId: fromSocketId,
                signalData: answer,
                type: 'answer',
              });
            } else if (type === 'answer') {
              await pc.setRemoteDescription(new RTCSessionDescription(signalData));
              await drainIceCandidates(fromSocketId, pc);
            } else if (type === 'ice-candidate') {
              if (signalData) {
                if (pc.remoteDescription && pc.remoteDescription.type) {
                  await pc.addIceCandidate(new RTCIceCandidate(signalData));
                } else {
                  // Queue candidate until remote description is set
                  if (!pendingCandidates.current.has(fromSocketId)) {
                    pendingCandidates.current.set(fromSocketId, []);
                  }
                  pendingCandidates.current.get(fromSocketId)!.push(signalData);
                }
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
          pendingCandidates.current.delete(socketId);
          videoSenders.current.delete(socketId);

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
          setRemotePeers((prev) => {
            const next = new Map<string, ParticipantMedia>();
            Array.from(prev.entries()).forEach(([sId, peer]) => {
              if (peer.userId !== studentId) {
                next.set(sId, peer);
              } else {
                peerConnections.current.get(sId)?.close();
                peerConnections.current.delete(sId);
                pendingCandidates.current.delete(sId);
                videoSenders.current.delete(sId);
              }
            });
            return next;
          });
        });

        // Event: Session status changed
        socket.on('live:session-status-changed', ({ session: updatedSession }: any) => {
          if (updatedSession) {
            setSession(updatedSession);
            if (updatedSession.status === 'ENDED') {
              setIsEnded(true);
            }
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
        socket.off('connect');
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
      pendingCandidates.current.clear();
      videoSenders.current.clear();

      // Stop local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [sessionId, initLocalMedia, createPeerConnection, drainIceCandidates]);

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
   * Stop Screen Sharing and revert to Camera
   */
  const stopScreenShare = useCallback(async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }

    let cameraTrack: MediaStreamTrack | null = null;
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      });
      cameraTrack = cameraStream.getVideoTracks()[0];
    } catch (e) {
      console.warn('Could not restore camera track after screen share:', e);
    }

    // Replace track in all peer connections
    for (const [targetSocketId, pc] of peerConnections.current.entries()) {
      const videoSender =
        pc.getSenders().find((s) => s.track && s.track.kind === 'video') ||
        videoSenders.current.get(targetSocketId);

      if (videoSender && cameraTrack) {
        try {
          await videoSender.replaceTrack(cameraTrack);
        } catch (err) {
          console.error('Error replacing camera track:', err);
        }
      }
    }

    if (cameraTrack && localStreamRef.current) {
      const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
      if (oldVideoTrack) {
        localStreamRef.current.removeTrack(oldVideoTrack);
        oldVideoTrack.stop();
      }
      localStreamRef.current.addTrack(cameraTrack);
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    }

    setIsScreenSharing(false);
  }, []);

  /**
   * Toggle Screen Sharing
   */
  const toggleScreenShare = useCallback(async () => {
    try {
      if (isScreenSharingRef.current) {
        await stopScreenShare();
      } else {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        // Listen for user stopping screen share via browser stop button
        screenTrack.onended = () => {
          stopScreenShare();
        };

        // Replace video track in all active peer connections
        for (const [targetSocketId, pc] of peerConnections.current.entries()) {
          const videoSender =
            pc.getSenders().find((s) => s.track && s.track.kind === 'video') ||
            videoSenders.current.get(targetSocketId);

          if (videoSender) {
            try {
              await videoSender.replaceTrack(screenTrack);
            } catch (err) {
              console.error('Error replacing track with screen share:', err);
            }
          }
        }

        // Update localStream so local preview shows screen share
        if (localStreamRef.current) {
          const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
          if (oldVideoTrack) {
            localStreamRef.current.removeTrack(oldVideoTrack);
          }
          localStreamRef.current.addTrack(screenTrack);
          setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        }

        setIsScreenSharing(true);
      }
    } catch (err: any) {
      console.warn('Screen share toggle cancelled or failed:', err.message);
    }
  }, [stopScreenShare]);

  /**
   * Teacher ends the live session
   */
  const endSession = useCallback(async () => {
    try {
      await apiClient.post(`/live-sessions/${sessionId}/end`, {});
      setIsEnded(true);
    } catch (err: any) {
      console.error('Error ending session:', err);
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
