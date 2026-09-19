'use client';

import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DropdownOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  label,
  disabled = false,
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn('relative w-full space-y-1.5', className)} ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-bold text-[#2e3339]">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-11 w-full items-center justify-between rounded-xl border border-[#e2ebe2] bg-white px-3.5 py-2 text-sm text-[#2e3339] shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#315b36]',
          isOpen && 'border-[#315b36] ring-2 ring-[#315b36]/20',
          disabled && 'opacity-50 cursor-not-allowed bg-slate-50'
        )}
      >
        <span className={cn('flex items-center gap-2 truncate', !selectedOption && 'text-[#5a5e63]')}>
          {selectedOption?.icon}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-[#5a5e63] transition-transform duration-200 shrink-0 ml-2',
            isOpen && 'transform rotate-180 text-[#315b36]'
          )}
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-[#e2ebe2] bg-white p-1.5 shadow-xl animate-in fade-in-50 zoom-in-95 duration-150">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange?.(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors text-left',
                  isSelected
                    ? 'bg-[#eff4ec] text-[#315b36] font-bold'
                    : 'text-[#2e3339] hover:bg-[#eff4ec]/50 hover:text-[#315b36]'
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  {option.icon}
                  <div>
                    <p className="truncate leading-tight">{option.label}</p>
                    {option.description && (
                      <p className="text-[10px] text-[#5a5e63] font-normal leading-tight">
                        {option.description}
                      </p>
                    )}
                  </div>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-[#315b36] shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
