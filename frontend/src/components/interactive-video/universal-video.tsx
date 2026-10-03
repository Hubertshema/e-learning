'use client';

import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from 'react';

export function getYouTubeId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = trimmed.match(regExp);
  return match && match[1] ? match[1] : null;
}

export interface UniversalVideoHandle {
  play: () => void;
  pause: () => void;
  seekTo: (timeSeconds: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  setPlaybackRate?: (rate: number) => void;
  mute?: () => void;
  unMute?: () => void;
  isMuted?: () => boolean;
}

export interface UniversalVideoProps {
  url: string;
  className?: string;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  initialTime?: number;
  controls?: boolean;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

let ytApiPromise: Promise<any> | null = null;

function loadYouTubeIframeApi(): Promise<any> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.YT && window.YT.Player) {
    return Promise.resolve(window.YT);
  }

  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(checkInterval);
        resolve(window.YT);
      }
    }, 100);

    const prevOnReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevOnReady) prevOnReady();
      clearInterval(checkInterval);
      resolve(window.YT);
    };

    if (!document.getElementById('yt-iframe-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  });

  return ytApiPromise;
}

export const UniversalVideo = forwardRef<UniversalVideoHandle, UniversalVideoProps>(
  (
    {
      url,
      className,
      onTimeUpdate,
      onDurationChange,
      onPlay,
      onPause,
      onEnded,
      initialTime = 0,
      controls = true,
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const ytPlayerRef = useRef<any>(null);
    const timerRef = useRef<any>(null);

    const onTimeUpdateRef = useRef(onTimeUpdate);
    onTimeUpdateRef.current = onTimeUpdate;
    const onDurationChangeRef = useRef(onDurationChange);
    onDurationChangeRef.current = onDurationChange;
    const onPlayRef = useRef(onPlay);
    onPlayRef.current = onPlay;
    const onPauseRef = useRef(onPause);
    onPauseRef.current = onPause;
    const onEndedRef = useRef(onEnded);
    onEndedRef.current = onEnded;

    const youtubeId = getYouTubeId(url);

    const startTimer = () => {
      stopTimer();
      timerRef.current = setInterval(() => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
          try {
            const cur = ytPlayerRef.current.getCurrentTime() || 0;
            onTimeUpdateRef.current?.(cur);
            const dur = ytPlayerRef.current.getDuration() || 0;
            if (dur > 0) onDurationChangeRef.current?.(dur);
          } catch {}
        }
      }, 250);
    };

    const stopTimer = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    // YouTube setup
    useEffect(() => {
      if (!youtubeId || !wrapperRef.current) return;

      let isCancelled = false;

      loadYouTubeIframeApi().then((YT) => {
        if (isCancelled || !YT || !wrapperRef.current) return;

        // Cleanup existing player
        if (ytPlayerRef.current) {
          try {
            ytPlayerRef.current.destroy();
          } catch {}
          ytPlayerRef.current = null;
        }

        // Clean wrapper and add a fresh mount target node
        wrapperRef.current.innerHTML = '';
        const mountNode = document.createElement('div');
        mountNode.style.width = '100%';
        mountNode.style.height = '100%';
        wrapperRef.current.appendChild(mountNode);

        try {
          const currentOrigin =
            typeof window !== 'undefined' && window.location?.origin
              ? window.location.origin
              : 'https://linguachris.vercel.app';

          ytPlayerRef.current = new YT.Player(mountNode, {
            width: '100%',
            height: '100%',
            videoId: youtubeId,
            host: 'https://www.youtube.com',
            playerVars: {
              autoplay: 0,
              controls: controls ? 1 : 0,
              disablekb: controls ? 0 : 1,
              fs: controls ? 1 : 0,
              iv_load_policy: 3,
              rel: 0,
              modestbranding: 1,
              playsinline: 1,
              enablejsapi: 1,
              origin: currentOrigin,
              widget_referrer: currentOrigin,
            },
            events: {
              onReady: (event: any) => {
                if (isCancelled) return;
                try {
                  // Ensure proper referrerpolicy attribute on the rendered iframe
                  if (wrapperRef.current) {
                    const iframe = wrapperRef.current.querySelector('iframe');
                    if (iframe) {
                      iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
                    }
                  }
                  const dur = event.target.getDuration();
                  if (dur && dur > 0) onDurationChangeRef.current?.(dur);
                  if (initialTime && initialTime > 0) {
                    event.target.seekTo(initialTime, true);
                  }
                } catch {}
              },
              onStateChange: (event: any) => {
                if (isCancelled) return;
                try {
                  const dur = event.target.getDuration();
                  if (dur && dur > 0) onDurationChangeRef.current?.(dur);
                } catch {}
                // YT.PlayerState: 1 = PLAYING, 2 = PAUSED, 0 = ENDED
                if (event.data === 1) {
                  onPlayRef.current?.();
                  startTimer();
                } else if (event.data === 2) {
                  onPauseRef.current?.();
                  stopTimer();
                } else if (event.data === 0) {
                  onEndedRef.current?.();
                  stopTimer();
                }
              },
            },
          });
        } catch (err) {
          console.error('Failed to create YouTube player', err);
        }
      });

      return () => {
        isCancelled = true;
        stopTimer();
        if (ytPlayerRef.current) {
          try {
            ytPlayerRef.current.destroy();
          } catch {}
          ytPlayerRef.current = null;
        }
        if (wrapperRef.current) {
          wrapperRef.current.innerHTML = '';
        }
      };
    }, [youtubeId, controls]);

    useImperativeHandle(ref, () => ({
      play: () => {
        if (youtubeId && ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
          ytPlayerRef.current.playVideo();
        } else if (videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
      },
      pause: () => {
        if (youtubeId && ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
          ytPlayerRef.current.pauseVideo();
        } else if (videoRef.current) {
          videoRef.current.pause();
        }
      },
      seekTo: (timeSeconds: number) => {
        if (youtubeId && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
          ytPlayerRef.current.seekTo(timeSeconds, true);
        } else if (videoRef.current) {
          videoRef.current.currentTime = timeSeconds;
        }
      },
      getCurrentTime: () => {
        if (youtubeId && ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
          try {
            return ytPlayerRef.current.getCurrentTime() || 0;
          } catch {
            return 0;
          }
        }
        return videoRef.current ? videoRef.current.currentTime : 0;
      },
      getDuration: () => {
        if (youtubeId && ytPlayerRef.current && typeof ytPlayerRef.current.getDuration === 'function') {
          try {
            return ytPlayerRef.current.getDuration() || 0;
          } catch {
            return 0;
          }
        }
        return videoRef.current ? videoRef.current.duration : 0;
      },
      setPlaybackRate: (rate: number) => {
        if (youtubeId && ytPlayerRef.current && typeof ytPlayerRef.current.setPlaybackRate === 'function') {
          try {
            ytPlayerRef.current.setPlaybackRate(rate);
          } catch {}
        } else if (videoRef.current) {
          videoRef.current.playbackRate = rate;
        }
      },
      mute: () => {
        if (youtubeId && ytPlayerRef.current && typeof ytPlayerRef.current.mute === 'function') {
          try {
            ytPlayerRef.current.mute();
          } catch {}
        } else if (videoRef.current) {
          videoRef.current.muted = true;
        }
      },
      unMute: () => {
        if (youtubeId && ytPlayerRef.current && typeof ytPlayerRef.current.unMute === 'function') {
          try {
            ytPlayerRef.current.unMute();
          } catch {}
        } else if (videoRef.current) {
          videoRef.current.muted = false;
        }
      },
      isMuted: () => {
        if (youtubeId && ytPlayerRef.current && typeof ytPlayerRef.current.isMuted === 'function') {
          try {
            return ytPlayerRef.current.isMuted();
          } catch {
            return false;
          }
        }
        return videoRef.current ? videoRef.current.muted : false;
      },
    }));

    if (youtubeId) {
      return (
        <div
          ref={wrapperRef}
          className={`relative aspect-video w-full h-full bg-black overflow-hidden [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0 ${className || ''}`}
        />
      );
    }

    return (
      <video
        ref={videoRef}
        src={url}
        controls={controls}
        playsInline
        onContextMenu={(e) => e.preventDefault()}
        className={className || 'aspect-video w-full h-full object-contain bg-black'}
        onPlay={() => onPlayRef.current?.()}
        onPause={() => onPauseRef.current?.()}
        onEnded={() => onEndedRef.current?.()}
        onTimeUpdate={() => {
          if (videoRef.current) onTimeUpdateRef.current?.(videoRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            onDurationChangeRef.current?.(videoRef.current.duration);
            if (initialTime && initialTime > 0) {
              videoRef.current.currentTime = initialTime;
            }
          }
        }}
      />
    );
  }
);

UniversalVideo.displayName = 'UniversalVideo';
