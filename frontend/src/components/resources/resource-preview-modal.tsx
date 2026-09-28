'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  ExternalLink,
  Download,
  Eye,
  Lock,
  X,
  CheckCircle2,
  Shield,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadSecureResource } from '@/lib/api-client';

export interface LessonResource {
  id: string;
  lessonId?: string;
  title: string;
  description?: string | null;
  url: string;
  resourceType?: string;
  canView?: boolean;
  canDownload?: boolean;
  orderIndex?: number;
}

/**
 * Metadata info for PDF lesson resources.
 */
export function getResourceTypeInfo(_resource?: { url?: string; resourceType?: string; title?: string }) {
  return {
    type: 'PDF' as const,
    label: 'PDF',
    fullLabel: 'PDF Document',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    icon: FileText,
    iconColor: 'text-rose-600',
    previewSupported: true,
  };
}

/**
 * Clickable badge component for displaying the PDF type on teacher and student views.
 */
export function ResourceTypeBadge({
  resource,
  onClick,
  showLabel = true,
  className = '',
}: {
  resource: { url: string; resourceType?: string; title?: string };
  onClick?: () => void;
  showLabel?: boolean;
  className?: string;
}) {
  const info = getResourceTypeInfo(resource);
  const Icon = info.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer select-none shadow-2xs ${info.badgeClass} ${className}`}
      title="Click to preview PDF Document"
      role="button"
      tabIndex={0}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {showLabel && <span>{info.label}</span>}
      <Eye className="h-3 w-3 opacity-60 ml-0.5" />
    </span>
  );
}

/**
 * Modal dialog for previewing PDF resources with support for local file streaming,
 * fallback tabs, and strict download permissions.
 */
export function ResourcePreviewModal({
  resource,
  isOpen,
  onClose,
  isTeacher = false,
}: {
  resource: LessonResource | null;
  isOpen: boolean;
  onClose: () => void;
  isTeacher?: boolean;
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [securityNotice, setSecurityNotice] = useState<string | null>(null);

  // Teachers always have download access; students only if canDownload is true
  const canDownload = isTeacher || Boolean(resource?.canDownload);

  // Intercept Ctrl+S / Ctrl+P / Cmd+S / Cmd+P when view-only
  useEffect(() => {
    if (!isOpen || canDownload) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'S', 'P'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        setSecurityNotice('Save & print are restricted for this protected document.');
        setTimeout(() => setSecurityNotice(null), 4000);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, canDownload]);

  if (!resource || !isOpen) return null;

  const info = getResourceTypeInfo(resource);
  const Icon = info.icon;

  // Normalize URL to absolute path if needed
  const rawUrl = resource.url || '';
  const pdfUrl = rawUrl.startsWith('/') && !rawUrl.startsWith('//')
    ? (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5000${rawUrl}` : rawUrl)
    : rawUrl;

  // Strip toolbar/navpanes when download is restricted
  const embedUrl = pdfUrl.includes('#')
    ? pdfUrl
    : canDownload
    ? `${pdfUrl}#toolbar=1`
    : `${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`;

  const handleDownload = async () => {
    if (!canDownload) return;
    try {
      setIsDownloading(true);
      await downloadSecureResource(
        resource.id,
        resource.title ? `${resource.title}.pdf` : 'document.pdf'
      );
    } catch {
      // fallback
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = resource.title ? `${resource.title}.pdf` : 'document.pdf';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenTab = () => {
    if (!canDownload && !isTeacher) return;
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog Container */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className={`p-2 rounded-xl border ${info.badgeClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {resource.title}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${info.badgeClass}`}>
                  PDF Document
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {resource.description || (canDownload ? 'Full preview & download authorized' : 'View-only access')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Open in New Tab — only for teachers or when download is allowed */}
            {(canDownload || isTeacher) && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenTab}
                className="h-8 px-2.5 text-xs font-semibold gap-1 text-slate-600 hover:text-slate-900 border-slate-200 dark:border-slate-700"
                title="Open PDF directly in a new browser tab"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Open in Tab</span>
              </Button>
            )}

            {/* Download Button (Respects configuration) */}
            {canDownload ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                disabled={isDownloading}
                className="h-8 px-3 text-xs font-semibold gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
              </Button>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <Lock className="h-3 w-3" />
                <span>View Only</span>
              </span>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* High-Security Protected Mode Banner */}
        {!canDownload && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
              <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>High-Security View-Only Mode:</strong> Saving, downloading, and printing are disabled by the instructor.
              </span>
            </div>
            {securityNotice && (
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 animate-pulse whitespace-nowrap">
                {securityNotice}
              </span>
            )}
          </div>
        )}

        {/* Modal Body: PDF Preview Container */}
        <div
          className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-100/50 dark:bg-slate-950/50 flex flex-col items-center justify-center min-h-[420px] print:hidden"
          onContextMenu={!canDownload ? (e) => { e.preventDefault(); e.stopPropagation(); } : undefined}
        >
          <div className="w-full h-[70vh] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-inner flex flex-col relative select-none">
            <object
              data={pdfUrl}
              type="application/pdf"
              className="w-full h-full"
            >
              <iframe
                src={embedUrl}
                className="w-full h-full border-0"
                title={resource.title}
              >
                <div className="flex flex-col items-center justify-center p-8 text-center h-full space-y-3">
                  <div className="p-3 bg-rose-50 rounded-2xl text-rose-600">
                    <FileText className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      {resource.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Click below to view this PDF document directly in your browser.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold gap-2 text-xs"
                    onClick={handleOpenTab}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open PDF in New Window
                  </Button>
                </div>
              </iframe>
            </object>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            {canDownload ? (
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" /> PDF downloads permitted
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
                <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                Protected document &middot; Saving &amp; printing blocked
              </span>
            )}
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-7 text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
