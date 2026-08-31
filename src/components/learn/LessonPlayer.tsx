import { useEffect, useRef, useState } from "react";

/**
 * Unified lesson player. Handles three sources transparently and
 * surfaces normalized {currentTime, duration, isPlaying} state to the
 * parent so the lesson page can show progress, save it, and auto-mark
 * complete at the configured threshold.
 *
 *   - YouTube  → IFrame Player API, created inside a placeholder <div>.
 *                We never give YouTube an existing iframe to take over;
 *                that swap pattern silently breaks click-to-play when
 *                `origin` is missing or postMessage is blocked.
 *   - Vimeo    → Player API via postMessage helper.
 *   - MP4 / HLS → native <video>.
 *
 * The component is intentionally controlled-only-out: callers can't
 * seek the player from React. Keeps the contract simple and tracking
 * deterministic.
 */

type Provider = "youtube" | "vimeo" | "native" | null;

export interface PlaybackState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  ended: boolean;
}

interface Props {
  videoUrl: string;
  title: string;
  /** Fired every ~1s while playing + on pause/end. */
  onProgress?: (state: PlaybackState) => void;
  /** Fired once when the video ends. */
  onEnded?: () => void;
}

function detect(url: string): { provider: Provider; id: string | null } {
  if (!url) return { provider: null, id: null };
  let m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/i);
  if (m?.[1]) return { provider: "youtube", id: m[1] };
  m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (m?.[1]) return { provider: "vimeo", id: m[1] };
  return { provider: "native", id: null };
}

// ── YouTube IFrame API loader (singleton) ────────────────────────────
let ytApiPromise: Promise<unknown> | null = null;
function loadYouTubeApi(): Promise<unknown> {
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const w = window as unknown as { YT?: { Player?: unknown }; onYouTubeIframeAPIReady?: () => void };
    if (w.YT?.Player) return resolve(w.YT);
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve((window as unknown as { YT: unknown }).YT);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return ytApiPromise;
}

interface MinimalYTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  destroy(): void;
}

interface MinimalYTNamespace {
  Player: new (
    el: HTMLElement | string,
    cfg: {
      videoId: string;
      width?: string | number;
      height?: string | number;
      host?: string;
      playerVars?: Record<string, string | number>;
      events: {
        onReady?: (e: { target: MinimalYTPlayer }) => void;
        onStateChange?: (e: { data: number; target: MinimalYTPlayer }) => void;
      };
    },
  ) => MinimalYTPlayer;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
}

export function LessonPlayer({ videoUrl, title, onProgress, onEnded }: Props) {
  const { provider, id } = detect(videoUrl);
  const vimeoIframeRef = useRef<HTMLIFrameElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ytHostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<MinimalYTPlayer | null>(null);
  const pollRef = useRef<number | null>(null);
  const stateRef = useRef<PlaybackState>({ currentTime: 0, duration: 0, isPlaying: false, ended: false });
  const [mountKey] = useState(() => Math.random().toString(36).slice(2, 9));

  // Stash callbacks in refs so the player effects don't re-run (and tear
  // down the YT/Vimeo session) every time the parent passes a fresh
  // callback identity from useState updates.
  const onProgressRef = useRef(onProgress);
  const onEndedRef = useRef(onEnded);
  useEffect(() => { onProgressRef.current = onProgress; }, [onProgress]);
  useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);
  const fireProgress = (s: PlaybackState) => onProgressRef.current?.(s);
  const fireEnded = () => onEndedRef.current?.();

  // ── YouTube wiring (placeholder div → YT creates its own iframe) ──
  useEffect(() => {
    if (provider !== "youtube" || !ytHostRef.current || !id) return;
    let cancelled = false;
    let createdPlayer: MinimalYTPlayer | null = null;
    void loadYouTubeApi().then((YTns) => {
      if (cancelled || !ytHostRef.current) return;
      const YT = YTns as MinimalYTNamespace;
      // Create a fresh inner element each mount; YT replaces it with its
      // iframe. We DO NOT pass our top-level container so cleanup works.
      const inner = document.createElement("div");
      ytHostRef.current.replaceChildren(inner);
      createdPlayer = new YT.Player(inner, {
        videoId: id,
        width: "100%",
        height: "100%",
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (e) => {
            stateRef.current.duration = e.target.getDuration();
          },
          onStateChange: (e) => {
            const isPlaying = e.data === YT.PlayerState.PLAYING;
            const ended = e.data === YT.PlayerState.ENDED;
            stateRef.current = {
              currentTime: e.target.getCurrentTime(),
              duration: e.target.getDuration(),
              isPlaying,
              ended,
            };
            fireProgress(stateRef.current);
            if (ended) fireEnded();
          },
        },
      });
      playerRef.current = createdPlayer;
      pollRef.current = window.setInterval(() => {
        const p = playerRef.current;
        if (!p || !stateRef.current.isPlaying) return;
        stateRef.current = {
          ...stateRef.current,
          currentTime: p.getCurrentTime(),
          duration: p.getDuration(),
        };
        fireProgress(stateRef.current);
      }, 1000);
    });
    return () => {
      cancelled = true;
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
      try { createdPlayer?.destroy?.(); } catch { /* ignore */ }
      playerRef.current = null;
      if (ytHostRef.current) ytHostRef.current.replaceChildren();
    };
    // Player lifecycle is bound to the video identity only — callbacks
    // flow through refs so they never tear this down.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, id]);

  // ── Vimeo wiring (postMessage) ───────────────────────────────────
  useEffect(() => {
    if (provider !== "vimeo" || !vimeoIframeRef.current) return;
    const iframe = vimeoIframeRef.current;
    const post = (method: string, value?: unknown) => {
      iframe.contentWindow?.postMessage(
        JSON.stringify(value === undefined ? { method } : { method, value }),
        "*",
      );
    };
    const onLoad = () => {
      post("addEventListener", "play");
      post("addEventListener", "pause");
      post("addEventListener", "ended");
      post("addEventListener", "timeupdate");
    };
    const onMessage = (ev: MessageEvent) => {
      if (typeof ev.data !== "string") return;
      let parsed: { event?: string; data?: { seconds?: number; duration?: number } };
      try { parsed = JSON.parse(ev.data); } catch { return; }
      if (!parsed.event) return;
      if (parsed.event === "play") {
        stateRef.current.isPlaying = true;
        fireProgress(stateRef.current);
      } else if (parsed.event === "pause") {
        stateRef.current.isPlaying = false;
        fireProgress(stateRef.current);
      } else if (parsed.event === "ended") {
        stateRef.current = { ...stateRef.current, ended: true, isPlaying: false };
        fireEnded();
      } else if (parsed.event === "timeupdate" && parsed.data) {
        stateRef.current = {
          ...stateRef.current,
          currentTime: parsed.data.seconds ?? 0,
          duration: parsed.data.duration ?? stateRef.current.duration,
        };
        fireProgress(stateRef.current);
      }
    };
    iframe.addEventListener("load", onLoad);
    window.addEventListener("message", onMessage);
    return () => {
      iframe.removeEventListener("load", onLoad);
      window.removeEventListener("message", onMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, videoUrl]);

  // ── Native <video> wiring ────────────────────────────────────────
  useEffect(() => {
    if (provider !== "native" || !videoRef.current) return;
    const video = videoRef.current;
    const onTime = () => {
      stateRef.current = {
        currentTime: video.currentTime,
        duration: video.duration || 0,
        isPlaying: !video.paused,
        ended: video.ended,
      };
      fireProgress(stateRef.current);
    };
    const onEnd = () => fireEnded();
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("play", onTime);
    video.addEventListener("pause", onTime);
    video.addEventListener("ended", onEnd);
    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("play", onTime);
      video.removeEventListener("pause", onTime);
      video.removeEventListener("ended", onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, videoUrl]);

  if (provider === "youtube") {
    return <div key={`yt-${mountKey}`} ref={ytHostRef} className="lp-iframe" />;
  }
  if (provider === "vimeo") {
    return (
      <iframe
        key={`vm-${mountKey}`}
        ref={vimeoIframeRef}
        src={`https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0&dnt=1`}
        title={title}
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        className="lp-iframe"
      />
    );
  }
  if (provider === "native") {
    return (
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        playsInline
        className="lp-video"
      />
    );
  }
  return null;
}
