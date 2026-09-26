'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Mic,
  Square,
  Play,
  RotateCcw,
  Film,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Volume2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  MoreVertical,
  Columns,
  Check,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { registerPendingMedia } from '@/lib/pending-media';

interface MediaUploadResult {
  url: string;
  publicId?: string;
  format?: string;
  bytes?: number;
  duration?: number;
}

export const MEDIA_WIDTH_CLASSES: Record<string, string> = {
  small: 'max-w-xs',
  medium: 'max-w-md',
  large: 'max-w-xl',
  full: 'w-full max-w-full',
};

export const MEDIA_ALIGN_CLASSES: Record<string, string> = {
  left: 'justify-start mr-auto',
  center: 'justify-center mx-auto',
  right: 'justify-end ml-auto',
};

// ─────────────────────────────────────────────────────────────────────────────
// 3-DOTS HOVER DROPDOWN MENU
// ─────────────────────────────────────────────────────────────────────────────

interface MediaMoreMenuProps {
  layout?: 'stacked' | 'media-left' | 'media-right';
  width?: 'small' | 'medium' | 'large' | 'full';
  align?: 'left' | 'center' | 'right';
  objectFit?: 'contain' | 'cover';
  showFit?: boolean;
  onUpdateSettings: (settingsUpdates: Record<string, any>) => void;
  onReplace?: () => void;
  onRemove?: () => void;
}

function MediaMoreMenu({
  layout = 'stacked',
  width = 'full',
  align = 'center',
  objectFit = 'contain',
  showFit = false,
  onUpdateSettings,
  onReplace,
  onRemove,
}: MediaMoreMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click without any full-screen blocking backdrop
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative inline-flex items-center">
      {/* 3-Dots Trigger Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`p-1.5 rounded-lg border shadow-sm backdrop-blur transition-all active:scale-95 cursor-pointer ${
          isOpen
            ? 'bg-[#315b36] text-white border-[#315b36]'
            : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-700/90 hover:bg-white dark:hover:bg-slate-800'
        }`}
        title="Media Options & Layout"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {/* Sleek Floating Icon-Only Toolbar */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full mt-2 z-30 flex items-center gap-0.5 p-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xl rounded-xl animate-in fade-in zoom-in-95 duration-100 select-none whitespace-nowrap"
        >
          {/* 1. Layout Mode (Icons Only) */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onUpdateSettings({ layout: 'stacked' })}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                layout === 'stacked'
                  ? 'bg-[#315b36] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Stacked Full Layout"
            >
              <Square className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ layout: 'media-left' })}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                layout === 'media-left'
                  ? 'bg-[#315b36] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Media on Left + Notes on Right"
            >
              <Columns className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ layout: 'media-right' })}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                layout === 'media-right'
                  ? 'bg-[#315b36] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Notes on Left + Media on Right"
            >
              <Columns className="h-3.5 w-3.5 rotate-180" />
            </button>
          </div>

          <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* 2. Size / Width (Icons / Pills Only) */}
          <div className="flex items-center gap-0.5">
            {(
              [
                { id: 'small', label: 'S', title: 'Small (33% width)' },
                { id: 'medium', label: 'M', title: 'Medium (50% width)' },
                { id: 'large', label: 'L', title: 'Large (75% width)' },
              ] as const
            ).map((sz) => (
              <button
                key={sz.id}
                type="button"
                onClick={() => onUpdateSettings({ width: sz.id })}
                className={`w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                  width === sz.id
                    ? 'bg-[#315b36] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={sz.title}
              >
                {sz.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onUpdateSettings({ width: 'full' })}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                width === 'full'
                  ? 'bg-[#315b36] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Full Width (100%)"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* 3. Alignment (Icons Only) */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onUpdateSettings({ align: 'left' })}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                align === 'left'
                  ? 'bg-[#315b36] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Align Left"
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ align: 'center' })}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                align === 'center'
                  ? 'bg-[#315b36] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Align Center"
            >
              <AlignCenter className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ align: 'right' })}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                align === 'right'
                  ? 'bg-[#315b36] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Align Right"
            >
              <AlignRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* 4. Fit Mode for Images (Icons Only) */}
          {showFit && (
            <>
              <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ objectFit: 'contain' })}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    objectFit === 'contain'
                      ? 'bg-[#315b36] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="Fit Entire Image (Contain)"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ objectFit: 'cover' })}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    objectFit === 'cover'
                      ? 'bg-[#315b36] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="Fill Frame (Cover)"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          )}

          {/* 5. Replace / Delete Actions (Icons Only) */}
          {(onReplace || onRemove) && (
            <>
              <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
              <div className="flex items-center gap-0.5">
                {onReplace && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onReplace();
                    }}
                    className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-[#315b36] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Replace Media"
                  >
                    <Upload className="h-3.5 w-3.5" />
                  </button>
                )}
                {onRemove && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onRemove();
                    }}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Remove Media"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPANION SIDE CONTENT (Left or Right of Media)
// ─────────────────────────────────────────────────────────────────────────────

interface SideContentProps {
  sideTitle?: string;
  sideText?: string;
  onChangeTitle: (title: string) => void;
  onChangeText: (text: string) => void;
  mediaTypeLabel?: string;
}

function CompanionSideContent({
  sideTitle,
  sideText,
  onChangeTitle,
  onChangeText,
  mediaTypeLabel = 'Media',
}: SideContentProps) {
  const insertTemplate = (prefix: string, template: string) => {
    const current = sideText ? sideText + '\n\n' : '';
    onChangeText(`${current}**${prefix}:** ${template}`);
  };

  return (
    <div className="h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 sm:p-5 flex flex-col justify-between shadow-xs space-y-3 min-w-0">
      <div className="space-y-2.5">
        <input
          type="text"
          value={sideTitle || ''}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder={`Notes / Analysis for this ${mediaTypeLabel}...`}
          className="w-full font-bold text-sm bg-transparent outline-none text-slate-900 dark:text-white placeholder-slate-400"
        />

        <textarea
          rows={5}
          value={sideText || ''}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder="Write accompanying explanations, questions, vocabulary definitions, or instructions here..."
          className="w-full text-xs leading-relaxed text-slate-700 dark:text-slate-300 bg-transparent outline-none resize-none placeholder-slate-400"
        />
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Quick Starters:
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => insertTemplate('Key Vocabulary', '1. Word: Meaning\n2. Word: Meaning')}
            className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-[#315b36] dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
          >
            + Vocabulary
          </button>
          <button
            type="button"
            onClick={() => insertTemplate('Question', 'What do you notice about...?')}
            className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors"
          >
            + Question
          </button>
          <button
            type="button"
            onClick={() => insertTemplate('Transcript', 'Speaker: ...')}
            className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors"
          >
            + Transcript
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. IMAGE BLOCK EDITOR (With 3-dots Hover Dropdown & Clean Layout)
// ─────────────────────────────────────────────────────────────────────────────

interface ImageBlockEditorProps {
  content: {
    url?: string;
    alt?: string;
    caption?: string;
    sideTitle?: string;
    sideText?: string;
  };
  settings?: {
    width?: 'small' | 'medium' | 'large' | 'full';
    align?: 'left' | 'center' | 'right';
    layout?: 'stacked' | 'media-left' | 'media-right';
    objectFit?: 'contain' | 'cover';
  };
  onUpdate: (updates: Record<string, any>) => void;
  onUpdateSettings?: (settingsUpdates: Record<string, any>) => void;
}

export function ImageBlockEditor({
  content,
  settings = {},
  onUpdate,
  onUpdateSettings = () => {},
}: ImageBlockEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const layout = settings.layout || 'stacked';
  const width = settings.width || 'full';
  const align = settings.align || 'center';
  const objectFit = settings.objectFit || 'contain';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadError(null);
      const localUrl = URL.createObjectURL(file);
      registerPendingMedia(localUrl, file, 'image', 'elearning/images');
      onUpdate({
        url: localUrl,
        alt: content.alt || file.name.replace(/\.[^/.]+$/, ''),
        isPendingUpload: true,
      });
    } catch (err: any) {
      setUploadError(err.message || 'Failed to process image file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const renderImageCard = () => (
    <div className="space-y-2 w-full min-w-0">
      {content.url ? (
        <div className="relative group overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-1">
          <img
            src={content.url}
            alt={content.alt || 'Lesson Image'}
            className={`w-full rounded-xl transition-all ${
              objectFit === 'contain'
                ? 'max-h-[460px] object-contain'
                : 'max-h-[460px] object-cover'
            }`}
          />

          {/* Top-Right 3-Dots Button (Shown on Hover) */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <MediaMoreMenu
              layout={layout}
              width={width}
              align={align}
              objectFit={objectFit}
              showFit={true}
              onUpdateSettings={onUpdateSettings}
              onReplace={() => fileInputRef.current?.click()}
              onRemove={() => onUpdate({ url: '' })}
            />
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative group border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#315b36] rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all hover:bg-slate-50/60 dark:hover:bg-slate-800/40 w-full"
        >
          {/* Top-Right 3-Dots even in empty state */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <MediaMoreMenu
              layout={layout}
              width={width}
              align={align}
              objectFit={objectFit}
              showFit={true}
              onUpdateSettings={onUpdateSettings}
            />
          </div>

          {isUploading ? (
            <div className="space-y-2">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-[#315b36]" />
              <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                Uploading image to Cloudinary...
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef5ee] text-[#315b36] dark:bg-emerald-950/40 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <ImageIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Upload Image or Document (PNG, JPG, WebP)
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Directly saved to Cloudinary cloud storage
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Clean Bottom Caption & URL */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 w-full min-w-0">
        <input
          type="text"
          value={content.caption || ''}
          onChange={(e) => onUpdate({ caption: e.target.value })}
          placeholder="Add an image caption (shown to students)..."
          className="flex-1 min-w-0 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none focus:border-[#315b36]"
        />
        <input
          type="text"
          value={content.url || ''}
          onChange={(e) => onUpdate({ url: e.target.value })}
          placeholder="Or image URL (https://...)"
          className="w-full sm:w-56 min-w-0 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none focus:border-[#315b36] font-mono truncate"
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );

  return (
    <div className="w-full min-w-0 space-y-2">
      {uploadError && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{uploadError}</span>
        </div>
      )}

      {layout === 'stacked' ? (
        <div className={`flex w-full ${MEDIA_ALIGN_CLASSES[align]}`}>
          <div className={`w-full ${MEDIA_WIDTH_CLASSES[width]} min-w-0`}>
            {renderImageCard()}
          </div>
        </div>
      ) : layout === 'media-left' ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start w-full min-w-0">
          <div className="md:col-span-6 w-full min-w-0">{renderImageCard()}</div>
          <div className="md:col-span-6 w-full min-w-0">
            <CompanionSideContent
              sideTitle={content.sideTitle}
              sideText={content.sideText}
              onChangeTitle={(sideTitle) => onUpdate({ sideTitle })}
              onChangeText={(sideText) => onUpdate({ sideText })}
              mediaTypeLabel="Image"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start w-full min-w-0">
          <div className="md:col-span-6 w-full min-w-0 order-2 md:order-1">
            <CompanionSideContent
              sideTitle={content.sideTitle}
              sideText={content.sideText}
              onChangeTitle={(sideTitle) => onUpdate({ sideTitle })}
              onChangeText={(sideText) => onUpdate({ sideText })}
              mediaTypeLabel="Image"
            />
          </div>
          <div className="md:col-span-6 w-full min-w-0 order-1 md:order-2">
            {renderImageCard()}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. VIDEO BLOCK EDITOR (With 3-dots Hover Dropdown & Clean Layout)
// ─────────────────────────────────────────────────────────────────────────────

interface VideoBlockEditorProps {
  content: {
    title?: string;
    url?: string;
    duration?: string;
    sideTitle?: string;
    sideText?: string;
  };
  settings?: {
    width?: 'small' | 'medium' | 'large' | 'full';
    align?: 'left' | 'center' | 'right';
    layout?: 'stacked' | 'media-left' | 'media-right';
  };
  onUpdate: (updates: Record<string, any>) => void;
  onUpdateSettings?: (settingsUpdates: Record<string, any>) => void;
}

export function VideoBlockEditor({
  content,
  settings = {},
  onUpdate,
  onUpdateSettings = () => {},
}: VideoBlockEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const layout = settings.layout || 'stacked';
  const width = settings.width || 'full';
  const align = settings.align || 'center';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadError(null);
      const localUrl = URL.createObjectURL(file);
      registerPendingMedia(localUrl, file, 'video', 'elearning/video-lessons');
      onUpdate({
        url: localUrl,
        title: content.title || file.name.replace(/\.[^/.]+$/, ''),
        isPendingUpload: true,
      });
    } catch (err: any) {
      setUploadError(err.message || 'Failed to select video file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getYouTubeEmbedUrl = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11
      ? `https://www.youtube.com/embed/${match[2]}`
      : null;
  };

  const youtubeEmbed = getYouTubeEmbedUrl(content.url);
  const isDirectVideo =
    content.url &&
    (content.url.includes('.mp4') ||
      content.url.includes('.webm') ||
      content.url.includes('cloudinary') ||
      content.url.startsWith('data:video/'));

  const renderVideoCard = () => (
    <div className="relative group rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white p-4 sm:p-5 space-y-4 shadow-sm w-full min-w-0">
      {/* 3-Dots on hover */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <MediaMoreMenu
          layout={layout}
          width={width}
          align={align}
          onUpdateSettings={onUpdateSettings}
          onReplace={() => fileInputRef.current?.click()}
          onRemove={() => onUpdate({ url: '' })}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0 pr-8">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <Film className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={content.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Video Lesson Title..."
            className="w-full text-base font-bold bg-transparent outline-none text-white placeholder-slate-500"
          />
        </div>

        {content.url && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 text-[11px] font-bold shrink-0 border border-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            Video Ready
          </span>
        )}
      </div>

      {content.url ? (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-black aspect-video relative flex items-center justify-center w-full">
          {youtubeEmbed ? (
            <iframe
              src={youtubeEmbed}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : isDirectVideo ? (
            <video
              controls
              src={content.url}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="p-6 text-center text-xs text-slate-400 space-y-2">
              <Film className="h-8 w-8 mx-auto text-slate-600" />
              <p className="truncate">Video stream linked: {content.url}</p>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-emerald-500/80 rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-slate-800/50 group w-full"
        >
          {isUploading ? (
            <div className="space-y-2">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-emerald-400" />
              <p className="text-xs text-slate-300 font-semibold">
                Uploading video to Cloudinary...
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-emerald-400 group-hover:scale-110 transition-transform">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">
                  Click to upload video file (MP4, WebM, MOV)
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Directly saved to Cloudinary CDN
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 w-full min-w-0">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors shrink-0"
        >
          {isUploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5 text-emerald-400" />
          )}
          <span>{content.url ? 'Replace' : 'Upload File'}</span>
        </button>

        <input
          type="text"
          value={content.url || ''}
          onChange={(e) => onUpdate({ url: e.target.value })}
          placeholder="Or paste YouTube / Vimeo / MP4 URL..."
          className="flex-1 min-w-0 text-xs px-3 py-2 rounded-xl border border-slate-700 bg-slate-800/80 text-white placeholder-slate-500 outline-none focus:border-emerald-500 font-mono truncate"
        />

        {content.url && (
          <button
            type="button"
            onClick={() => onUpdate({ url: '' })}
            className="p-2 text-slate-400 hover:text-rose-400 transition-colors shrink-0"
            title="Remove video"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/ogg,video/quicktime"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );

  return (
    <div className="w-full min-w-0 space-y-2">
      {uploadError && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{uploadError}</span>
        </div>
      )}

      {layout === 'stacked' ? (
        <div className={`flex w-full ${MEDIA_ALIGN_CLASSES[align]}`}>
          <div className={`w-full ${MEDIA_WIDTH_CLASSES[width]} min-w-0`}>
            {renderVideoCard()}
          </div>
        </div>
      ) : layout === 'media-left' ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start w-full min-w-0">
          <div className="md:col-span-6 w-full min-w-0">{renderVideoCard()}</div>
          <div className="md:col-span-6 w-full min-w-0">
            <CompanionSideContent
              sideTitle={content.sideTitle}
              sideText={content.sideText}
              onChangeTitle={(sideTitle) => onUpdate({ sideTitle })}
              onChangeText={(sideText) => onUpdate({ sideText })}
              mediaTypeLabel="Video"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start w-full min-w-0">
          <div className="md:col-span-6 w-full min-w-0 order-2 md:order-1">
            <CompanionSideContent
              sideTitle={content.sideTitle}
              sideText={content.sideText}
              onChangeTitle={(sideTitle) => onUpdate({ sideTitle })}
              onChangeText={(sideText) => onUpdate({ sideText })}
              mediaTypeLabel="Video"
            />
          </div>
          <div className="md:col-span-6 w-full min-w-0 order-1 md:order-2">
            {renderVideoCard()}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. AUDIO BLOCK EDITOR (With 3-dots Hover Dropdown & Clean Layout)
// ─────────────────────────────────────────────────────────────────────────────

interface AudioBlockEditorProps {
  content: {
    title?: string;
    speaker?: string;
    url?: string;
    duration?: string;
    sideTitle?: string;
    sideText?: string;
  };
  settings?: {
    width?: 'small' | 'medium' | 'large' | 'full';
    align?: 'left' | 'center' | 'right';
    layout?: 'stacked' | 'media-left' | 'media-right';
    showTranscript?: boolean;
    transcript?: string;
  };
  onUpdate: (updates: Record<string, any>) => void;
  onUpdateSettings?: (settingsUpdates: Record<string, any>) => void;
}

export function AudioBlockEditor({
  content,
  settings = {},
  onUpdate,
  onUpdateSettings = () => {},
}: AudioBlockEditorProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const layout = settings.layout || 'stacked';
  const width = settings.width || 'full';
  const align = settings.align || 'center';

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
    };
  }, [recordedAudioUrl]);

  const startRecording = async () => {
    try {
      setRecordingError(null);
      setRecordedAudioBlob(null);
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
        setRecordedAudioUrl(null);
      }
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let mimeType = 'audio/webm';
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          mimeType = 'audio/ogg;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        const previewUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioBlob(audioBlob);
        setRecordedAudioUrl(previewUrl);
        registerPendingMedia(previewUrl, audioBlob, 'video', 'elearning/audio-recordings');
        onUpdate({
          url: previewUrl,
          duration: `${Math.floor(recordSeconds / 60)}:${(recordSeconds % 60)
            .toString()
            .padStart(2, '0')}`,
          isPendingUpload: true,
        });

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordSeconds((sec) => sec + 1);
      }, 1000);
    } catch (err: any) {
      setRecordingError(
        err.name === 'NotAllowedError'
          ? 'Microphone access denied. Please enable microphone permissions in your browser.'
          : 'Could not start recording: ' + (err.message || 'Unknown error')
      );
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const uploadRecordedAudio = async () => {
    if (!recordedAudioBlob) return;

    try {
      setIsUploading(true);
      setRecordingError(null);

      const extension = recordedAudioBlob.type.includes('ogg')
        ? 'ogg'
        : recordedAudioBlob.type.includes('mp4')
        ? 'mp4'
        : 'webm';
      const file = new File(
        [recordedAudioBlob],
        `live-recording-${Date.now()}.${extension}`,
        { type: recordedAudioBlob.type }
      );

      const formData = new FormData();
      formData.append('file', file);
      formData.append('resourceType', 'video');
      formData.append('folder', 'elearning/audio-recordings');

      const res: any = await apiClient.upload('/upload/media', formData);
      const data: MediaUploadResult = res?.data || res;

      if (data?.url) {
        onUpdate({
          url: data.url,
          duration: `${Math.floor(recordSeconds / 60)}:${(recordSeconds % 60)
            .toString()
            .padStart(2, '0')}`,
        });
        setRecordedAudioBlob(null);
        setRecordedAudioUrl(null);
        setRecordSeconds(0);
      }
    } catch (err: any) {
      setRecordingError(err.message || 'Failed to upload recorded audio.');
    } finally {
      setIsUploading(false);
    }
  };

  const discardRecording = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    setRecordedAudioBlob(null);
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);
    }
    setRecordSeconds(0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setRecordingError(null);
      const localUrl = URL.createObjectURL(file);
      registerPendingMedia(localUrl, file, 'video', 'elearning/audio-uploads');
      onUpdate({
        url: localUrl,
        title: content.title || file.name.replace(/\.[^/.]+$/, ''),
        isPendingUpload: true,
      });
    } catch (err: any) {
      setRecordingError(err.message || 'Failed to select audio file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const renderAudioCard = () => (
    <div className="relative group rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#f8faf8] dark:bg-slate-900/60 p-4 sm:p-5 space-y-4 shadow-xs w-full min-w-0">
      {/* 3-Dots on hover */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <MediaMoreMenu
          layout={layout}
          width={width}
          align={align}
          onUpdateSettings={onUpdateSettings}
          onReplace={() => fileInputRef.current?.click()}
          onRemove={() => onUpdate({ url: '' })}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0 pr-8">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#315b36] text-white shadow-xs">
            <Volume2 className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={content.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Audio Clip Title..."
              className="w-full font-bold text-sm bg-transparent outline-none text-slate-900 dark:text-white placeholder-slate-400 truncate"
            />
            <input
              type="text"
              value={content.speaker || ''}
              onChange={(e) => onUpdate({ speaker: e.target.value })}
              placeholder="Speaker information..."
              className="w-full text-xs text-slate-500 dark:text-slate-400 bg-transparent outline-none placeholder-slate-400 truncate"
            />
          </div>
        </div>

        {content.url && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold shrink-0">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Audio Linked
          </span>
        )}
      </div>

      {content.url && !isRecording && !recordedAudioBlob && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-2.5 shadow-xs w-full min-w-0">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-400">
              Audio Player
            </span>
            <button
              type="button"
              onClick={() => onUpdate({ url: '' })}
              className="text-slate-400 hover:text-rose-500 text-[11px] flex items-center gap-1 transition-colors"
            >
              <Trash2 className="h-3 w-3" /> Replace
            </button>
          </div>
          <audio
            controls
            src={content.url}
            className="w-full h-10 outline-none rounded-lg accent-[#315b36]"
          />
        </div>
      )}

      {isRecording && (
        <div className="rounded-xl border-2 border-red-500/80 bg-red-50/70 dark:bg-red-950/30 p-4 space-y-3 animate-in fade-in w-full min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </span>
              <span className="text-xs font-bold text-red-700 dark:text-red-300 uppercase tracking-wider">
                Live Recording Audio
              </span>
            </div>
            <span className="font-mono text-base font-black text-red-700 dark:text-red-300">
              {formatTimer(recordSeconds)}
            </span>
          </div>

          <div className="flex items-center justify-center gap-1 h-8">
            {[40, 70, 30, 90, 60, 100, 45, 80, 50, 85, 35, 75, 60, 95, 40].map(
              (h, i) => (
                <div
                  key={i}
                  className="w-1 bg-red-500 rounded-full animate-pulse"
                  style={{
                    height: `${Math.max(15, (h * (recordSeconds % 3 + 1)) % 100)}%`,
                    animationDelay: `${i * 70}ms`,
                  }}
                />
              )
            )}
          </div>

          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={stopRecording}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Square className="h-4 w-4 fill-current" />
              <span>Stop Recording</span>
            </button>
          </div>
        </div>
      )}

      {recordedAudioBlob && recordedAudioUrl && !isRecording && (
        <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 p-4 space-y-3 w-full min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Recording Complete ({formatTimer(recordSeconds)})
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {(recordedAudioBlob.size / 1024).toFixed(1)} KB
            </span>
          </div>

          <audio
            ref={previewAudioRef}
            src={recordedAudioUrl}
            controls
            className="w-full h-10 outline-none rounded-lg"
          />

          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Recorded • Auto-saves with document</span>
            </span>
            <button
              type="button"
              onClick={discardRecording}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Re-record
            </button>
          </div>
        </div>
      )}

      {!isRecording && !recordedAudioBlob && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 w-full min-w-0">
          <button
            type="button"
            onClick={startRecording}
            disabled={isUploading}
            className="flex items-center justify-center gap-2 p-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 hover:bg-rose-100/60 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all shadow-xs active:scale-98"
          >
            <Mic className="h-4 w-4 text-rose-600" />
            <span>Record Voice Live</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-xs active:scale-98"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[#315b36]" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 text-[#315b36]" />
                <span>Upload File (MP3, WAV)</span>
              </>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center gap-2 w-full min-w-0">
        <span className="text-[11px] text-slate-400 font-medium shrink-0">
          Direct URL:
        </span>
        <input
          type="text"
          value={content.url || ''}
          onChange={(e) => onUpdate({ url: e.target.value })}
          placeholder="https://res.cloudinary.com/.../audio.mp3"
          className="flex-1 min-w-0 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none focus:border-[#315b36] font-mono truncate"
        />
      </div>
    </div>
  );

  return (
    <div className="w-full min-w-0 space-y-2">
      {recordingError && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{recordingError}</span>
        </div>
      )}

      {layout === 'stacked' ? (
        <div className={`flex w-full ${MEDIA_ALIGN_CLASSES[align]}`}>
          <div className={`w-full ${MEDIA_WIDTH_CLASSES[width]} min-w-0`}>
            {renderAudioCard()}
          </div>
        </div>
      ) : layout === 'media-left' ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start w-full min-w-0">
          <div className="md:col-span-6 w-full min-w-0">{renderAudioCard()}</div>
          <div className="md:col-span-6 w-full min-w-0">
            <CompanionSideContent
              sideTitle={content.sideTitle}
              sideText={content.sideText}
              onChangeTitle={(sideTitle) => onUpdate({ sideTitle })}
              onChangeText={(sideText) => onUpdate({ sideText })}
              mediaTypeLabel="Audio"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start w-full min-w-0">
          <div className="md:col-span-6 w-full min-w-0 order-2 md:order-1">
            <CompanionSideContent
              sideTitle={content.sideTitle}
              sideText={content.sideText}
              onChangeTitle={(sideTitle) => onUpdate({ sideTitle })}
              onChangeText={(sideText) => onUpdate({ sideText })}
              mediaTypeLabel="Audio"
            />
          </div>
          <div className="md:col-span-6 w-full min-w-0 order-1 md:order-2">
            {renderAudioCard()}
          </div>
        </div>
      )}
    </div>
  );
}
