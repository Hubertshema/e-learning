'use client';

import React from 'react';
import { FileText, Eye } from 'lucide-react';
import { PdfLessonReader } from './pdf-lesson-reader';

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
  if (!resource || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog Container - Full Reader Window */}
      <div className="relative w-full max-w-[1400px] h-[94vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        <PdfLessonReader
          title={resource.title}
          url={resource.url}
          resourceId={resource.id}
          description={resource.description}
          canDownload={Boolean(resource.canDownload)}
          isTeacher={isTeacher}
          onClose={onClose}
          totalPages={6}
        />
      </div>
    </div>
  );
}
