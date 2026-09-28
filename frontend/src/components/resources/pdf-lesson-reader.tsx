'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PanelLeft,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Download,
  Lock,
  X,
  ShieldAlert,
  List,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getApiBaseUrl, tokenStorage, downloadSecureResource } from '@/lib/api-client';

export interface PdfLessonReaderProps {
  title: string;
  url?: string;
  resourceId?: string;
  description?: string | null;
  canDownload?: boolean;
  isTeacher?: boolean;
  onClose?: () => void;
  totalPages?: number;
}

// ─── PDF.js Local / CDN Loader ────────────────────────────────────────────────

let pdfjsLoadingPromise: Promise<any> | null = null;

function loadPdfJs(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not available'));
  if ((window as any).pdfjsLib) return Promise.resolve((window as any).pdfjsLib);
  if (pdfjsLoadingPromise) return pdfjsLoadingPromise;

  pdfjsLoadingPromise = new Promise((resolve, reject) => {
    // Try local script first
    const script = document.createElement('script');
    script.id = 'pdfjs-script';
    script.src = '/pdfjs/pdf.min.js';
    script.async = true;

    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';
        resolve(pdfjsLib);
      } else {
        fallbackCdn(resolve, reject);
      }
    };

    script.onerror = () => {
      fallbackCdn(resolve, reject);
    };

    document.head.appendChild(script);
  });

  return pdfjsLoadingPromise;
}

function fallbackCdn(resolve: (lib: any) => void, reject: (err: any) => void) {
  const cdnScript = document.createElement('script');
  cdnScript.id = 'pdfjs-cdn-fallback';
  cdnScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  cdnScript.async = true;

  cdnScript.onload = () => {
    const pdfjsLib = (window as any).pdfjsLib;
    if (pdfjsLib) {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(pdfjsLib);
    } else {
      reject(new Error('PDF.js failed to initialize from CDN'));
    }
  };

  cdnScript.onerror = () => reject(new Error('Failed to load PDF.js engine'));
  document.head.appendChild(cdnScript);
}

// ─── Resolve Full URL for Uploads / Backend ───────────────────────────────────

function resolvePdfUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  const apiBase = getApiBaseUrl(); // e.g. http://localhost:5000/api/v1
  const origin = apiBase.replace(/\/api\/v1\/?$/, ''); // e.g. http://localhost:5000
  if (url.startsWith('/')) {
    return `${origin}${url}`;
  }
  return `${origin}/${url}`;
}

// ─── Thumbnail Component for Actual PDF Page ──────────────────────────────────

function PdfThumbnail({
  pdfDoc,
  pageNumber,
  isActive,
  onClick,
}: {
  pdfDoc: any;
  pageNumber: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    if (!pdfDoc) return;

    pdfDoc
      .getPage(pageNumber)
      .then((page: any) => {
        if (isCancelled || !canvasRef.current) return;
        const unscaledViewport = page.getViewport({ scale: 1 });
        const targetWidth = 140; // crisp thumbnail resolution
        const scale = targetWidth / unscaledViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        page.render({ canvasContext: ctx, viewport }).promise.then(() => {
          if (!isCancelled) setRendered(true);
        }).catch(() => {});
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, pageNumber]);

  return (
    <div
      data-thumb-page={pageNumber}
      onClick={onClick}
      className="flex items-start gap-2.5 cursor-pointer group"
    >
      {/* Page Number Label */}
      <span
        className={`text-xs font-bold pt-1.5 w-4 text-right shrink-0 transition-colors ${
          isActive
            ? 'text-sky-600 dark:text-sky-400 font-black'
            : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
        }`}
      >
        {pageNumber}
      </span>

      {/* Actual Page Canvas Card */}
      <div
        className={`flex-1 aspect-[8.5/11] rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center transition-all duration-150 relative overflow-hidden ${
          isActive
            ? 'border-2 border-[#0091ff] ring-2 ring-[#0091ff]/20 shadow-md'
            : 'border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs'
        }`}
      >
        <canvas ref={canvasRef} className="w-full h-full object-contain block" />
        {!rendered && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-800">
            <span className="text-[10px] text-slate-300 font-medium">Page {pageNumber}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Reader Canvas for Actual PDF Page ───────────────────────────────────

function PdfMainCanvas({
  pdfDoc,
  activePage,
  zoomLevel,
  canDownload,
}: {
  pdfDoc: any;
  activePage: number;
  zoomLevel: number;
  canDownload: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rendering, setRendering] = useState(false);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    let isCancelled = false;
    if (!pdfDoc || !canvasRef.current) return;

    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {}
    }

    setRendering(true);

    pdfDoc
      .getPage(activePage)
      .then((page: any) => {
        if (isCancelled || !canvasRef.current) return;
        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
        const baseScale = (zoomLevel / 100) * 1.5;
        const viewport = page.getViewport({ scale: baseScale * dpr });

        const canvas = canvasRef.current;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const renderTask = page.render({ canvasContext: ctx, viewport });
        renderTaskRef.current = renderTask;

        renderTask.promise
          .then(() => {
            if (!isCancelled) setRendering(false);
          })
          .catch((err: any) => {
            if (err?.name !== 'RenderingCancelledException') {
              console.warn('PDF render error:', err);
            }
          });
      })
      .catch((err: any) => {
        console.warn('Page get error:', err);
        if (!isCancelled) setRendering(false);
      });

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }
    };
  }, [pdfDoc, activePage, zoomLevel]);

  return (
    <div className="relative bg-white rounded-lg shadow-2xl border border-slate-200/80 overflow-hidden">
      <canvas ref={canvasRef} className="block" />

      {rendering && (
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Rendering...</span>
        </div>
      )}

      {/* High-security watermark overlay if view-only */}
      {!canDownload && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
          <p className="text-slate-400/20 font-black text-4xl sm:text-6xl -rotate-45 select-none tracking-widest uppercase">
            Protected Document &bull; View Only
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main Component: PdfLessonReader ──────────────────────────────────────────

export function PdfLessonReader({
  title,
  url,
  resourceId,
  description,
  canDownload: propCanDownload,
  isTeacher = false,
  onClose,
}: PdfLessonReaderProps) {
  // STRICT SECURITY: Only allow downloads if explicitly permitted on this resource
  const canDownload = Boolean(propCanDownload);

  const [activePage, setActivePage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [securityNotice, setSecurityNotice] = useState<string | null>(null);

  // PDF.js State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const thumbnailListRef = useRef<HTMLDivElement | null>(null);

  const resolvedUrl = resolvePdfUrl(url);

  // ─── Load Actual PDF via PDF.js ─────────────────────────────────────────────

  const loadActualPdf = useCallback(async () => {
    if (!resolvedUrl) {
      setErrorMessage('No PDF file URL provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const pdfjsLib = await loadPdfJs();
      const token = tokenStorage.getAccessToken();

      let pdfLoadingTask: any;

      // Try fetching bytes first with authorization
      try {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(resolvedUrl, { headers });
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          pdfLoadingTask = pdfjsLib.getDocument({
            data: arrayBuffer,
            cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
            cMapPacked: true,
          });
        } else {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
      } catch {
        // Fallback to direct URL loading in PDF.js
        pdfLoadingTask = pdfjsLib.getDocument({
          url: resolvedUrl,
          withCredentials: true,
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          cMapPacked: true,
        });
      }

      const doc = await pdfLoadingTask.promise;
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setActivePage(1);
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to load actual PDF:', err);
      setErrorMessage(err?.message || 'Could not parse PDF document.');
      setLoading(false);
    }
  }, [resolvedUrl]);

  useEffect(() => {
    loadActualPdf();
  }, [loadActualPdf]);

  // ─── Auto-scroll Active Thumbnail into view ─────────────────────────────────

  useEffect(() => {
    if (!thumbnailListRef.current) return;
    const activeEl = thumbnailListRef.current.querySelector(`[data-thumb-page="${activePage}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activePage]);

  // ─── Security Enforcement ───────────────────────────────────────────────────

  useEffect(() => {
    if (canDownload) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'S', 'P'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        setSecurityNotice('Saving and printing are restricted for this protected lesson reader.');
        setTimeout(() => setSecurityNotice(null), 4000);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [canDownload]);

  // ─── Keyboard Navigation ────────────────────────────────────────────────────

  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        setActivePage((p) => Math.min(totalPages, p + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setActivePage((p) => Math.max(1, p - 1));
      } else if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [totalPages, onClose]);

  // ─── Download Handler ───────────────────────────────────────────────────────

  const handleDownload = async () => {
    if (!canDownload) return;
    try {
      setIsDownloading(true);
      if (resourceId) {
        await downloadSecureResource(resourceId, `${title || 'document'}.pdf`);
      } else if (resolvedUrl) {
        const a = document.createElement('a');
        a.href = resolvedUrl;
        a.download = `${title || 'document'}.pdf`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch {
      window.open(resolvedUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const scrollThumbnails = (direction: 'up' | 'down') => {
    if (!thumbnailListRef.current) return;
    const delta = direction === 'up' ? -220 : 220;
    thumbnailListRef.current.scrollBy({ top: delta, behavior: 'smooth' });
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col w-full h-full bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 select-none overflow-hidden"
      onContextMenu={!canDownload ? (e) => e.preventDefault() : undefined}
    >
      {/* ─── Top Header Bar (Matches Screenshot) ────────────────────────────── */}
      <header className="h-13 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-3 sm:px-4 flex items-center justify-between shrink-0 shadow-2xs z-20">
        {/* Left: Pages count + Toggle Sidebar Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            <List className="h-3.5 w-3.5 text-slate-500" />
            <span>Pages {loading ? '...' : totalPages}</span>
          </div>

          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className={`p-1.5 rounded-lg border transition-all text-slate-600 dark:text-slate-300 ${
              sidebarOpen
                ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={sidebarOpen ? 'Hide thumbnail sidebar' : 'Show thumbnail sidebar'}
            aria-label="Toggle thumbnail sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Center: Title */}
        <div className="flex items-center gap-2 text-center min-w-0 px-2">
          <h1 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white truncate tracking-tight">
            {title || 'Document'} <span className="font-medium text-slate-400">— Lesson Reader</span>
          </h1>
        </div>

        {/* Right: Navigation, Zoom, Download, Close */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Page Navigator */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setActivePage((p) => Math.max(1, p - 1))}
              disabled={activePage <= 1 || loading}
              className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 disabled:opacity-30 transition-all"
              title="Previous page (Left Arrow)"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="px-1.5 font-bold text-[11px] text-slate-700 dark:text-slate-200 whitespace-nowrap">
              {loading ? '...' : `${activePage} / ${totalPages}`}
            </span>
            <button
              onClick={() => setActivePage((p) => Math.min(totalPages, p + 1))}
              disabled={activePage >= totalPages || loading}
              className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 disabled:opacity-30 transition-all"
              title="Next page (Right Arrow)"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="hidden md:flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
              className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="px-1 font-semibold text-[10px] text-slate-500 w-9 text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(250, z + 25))}
              className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Download Button (Only visible if download is permitted) */}
          {canDownload && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              disabled={isDownloading}
              className="h-7 px-2.5 text-xs font-bold gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300"
              title="Download PDF"
            >
              <Download className="h-3 w-3" />
              <span className="hidden sm:inline">{isDownloading ? 'Saving...' : 'Download'}</span>
            </Button>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 transition-colors ml-1"
              title="Close Reader (Esc)"
              aria-label="Close reader"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Security Notice Toast */}
      {securityNotice && (
        <div className="bg-rose-500 text-white text-xs font-semibold px-4 py-1.5 text-center flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>{securityNotice}</span>
        </div>
      )}

      {/* ─── Reader Workspace (Sidebar + Main View) ─────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ─── Left Sidebar: Actual Page Thumbnails ───────────────────────── */}
        {sidebarOpen && (
          <aside className="w-56 sm:w-64 bg-slate-50/90 dark:bg-slate-900/90 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 select-none relative z-10 transition-all duration-200">
            {/* Scroll Up Button */}
            <button
              onClick={() => scrollThumbnails('up')}
              className="h-6 flex items-center justify-center bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 transition-colors border-b border-slate-200 dark:border-slate-800"
              title="Scroll Up"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>

            {/* Thumbnail Scroll Container */}
            <div
              ref={thumbnailListRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth"
            >
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                      <div className="flex-1 aspect-[8.5/11] bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : pdfDoc ? (
                Array.from({ length: totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <PdfThumbnail
                      key={pNum}
                      pdfDoc={pdfDoc}
                      pageNumber={pNum}
                      isActive={activePage === pNum}
                      onClick={() => setActivePage(pNum)}
                    />
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">No pages loaded</p>
              )}
            </div>

            {/* Scroll Down Button */}
            <button
              onClick={() => scrollThumbnails('down')}
              className="h-6 flex items-center justify-center bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 transition-colors border-t border-slate-200 dark:border-slate-800"
              title="Scroll Down"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </aside>
        )}

        {/* ─── Main Reader Canvas: Actual PDF Page ─────────────────────────── */}
        <main className="flex-1 overflow-auto p-4 sm:p-8 flex items-start justify-center bg-[#eaeff5] dark:bg-slate-950">
          <div
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            className="transition-transform duration-150 ease-out"
          >
            {loading ? (
              <div className="w-[620px] h-[880px] bg-white rounded-lg shadow-xl flex flex-col items-center justify-center gap-3 border border-slate-200/80">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <p className="text-xs font-semibold text-slate-500">Loading PDF document...</p>
                <p className="text-[11px] text-slate-400 truncate max-w-xs">{title}</p>
              </div>
            ) : errorMessage ? (
              <div className="w-[620px] min-h-[400px] bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center justify-center text-center gap-4 border border-rose-200">
                <div className="p-3 rounded-2xl bg-rose-50 text-rose-600">
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Failed to load PDF</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">{errorMessage}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={loadActualPdf} className="text-xs gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" /> Retry
                  </Button>
                  {resolvedUrl && canDownload && (
                    <Button
                      size="sm"
                      onClick={() => window.open(resolvedUrl, '_blank')}
                      className="text-xs gap-1.5 bg-indigo-600 text-white"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Open in New Tab
                    </Button>
                  )}
                </div>
              </div>
            ) : pdfDoc ? (
              <PdfMainCanvas
                pdfDoc={pdfDoc}
                activePage={activePage}
                zoomLevel={zoomLevel}
                canDownload={canDownload}
              />
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
