'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
  showCloseButton = true,
}: ModalProps) {
  // Handle escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    full: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Modal Dialog Card */}
      <div
        className={cn(
          'relative w-full rounded-2xl border border-[#e2ebe2] bg-white p-6 shadow-2xl transition-all animate-in zoom-in-95 duration-200 z-10',
          sizeClasses[size],
          className
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#e2ebe2]">
            <div className="space-y-1">
              {title && (
                <h3 className="text-lg font-bold leading-none tracking-tight text-[#2e3339]">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-[#5a5e63] leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#e2ebe2] text-[#5a5e63] hover:bg-[#eff4ec] hover:text-[#315b36] transition-colors"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Body Content */}
        <div className="py-4 text-[#2e3339] text-sm leading-relaxed">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#e2ebe2]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export { Modal as Dialog };
