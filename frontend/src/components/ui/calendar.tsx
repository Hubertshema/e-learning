'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Clock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface TimeSlot {
  id: string;
  time: string;
  available?: boolean;
  instructor?: string;
}

export interface CalendarProps {
  className?: string;
  compact?: boolean;
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
  selectedTimeSlot?: string;
  onSelectTimeSlot?: (slotId: string) => void;
  timeSlots?: TimeSlot[];
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  highlightDates?: Date[];
}

export function Calendar({
  className,
  compact = false,
  selectedDate: controlledSelectedDate,
  onSelectDate,
  selectedTimeSlot,
  onSelectTimeSlot,
  timeSlots,
  minDate,
  maxDate,
  disabledDates = [],
  highlightDates = [],
}: CalendarProps) {
  const [internalDate, setInternalDate] = React.useState<Date>(new Date());
  const selectedDate = controlledSelectedDate || internalDate;

  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = compact
    ? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayIndex = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const handleDayClick = (dayNumber: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNumber);
    if (minDate && newDate < new Date(minDate.setHours(0, 0, 0, 0))) return;
    if (maxDate && newDate > new Date(maxDate.setHours(23, 59, 59, 999))) return;

    if (onSelectDate) {
      onSelectDate(newDate);
    } else {
      setInternalDate(newDate);
    }
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const isToday = (dayNumber: number) => {
    const today = new Date();
    return (
      today.getFullYear() === currentMonth.getFullYear() &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getDate() === dayNumber
    );
  };

  const isSelected = (dayNumber: number) => {
    return (
      selectedDate.getFullYear() === currentMonth.getFullYear() &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getDate() === dayNumber
    );
  };

  const isDayDisabled = (dayNumber: number) => {
    const target = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNumber);
    if (minDate && target < new Date(minDate.setHours(0, 0, 0, 0))) return true;
    if (maxDate && target > new Date(maxDate.setHours(23, 59, 59, 999))) return true;
    return disabledDates.some((d) => isSameDay(d, target));
  };

  const isDayHighlighted = (dayNumber: number) => {
    const target = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNumber);
    return highlightDates.some((d) => isSameDay(d, target));
  };

  return (
    <div
      className={cn(
        compact
          ? 'w-full max-w-xs rounded-xl border border-slate-200 bg-white p-3 shadow-md space-y-2 dark:border-slate-800 dark:bg-slate-900'
          : 'w-full max-w-md rounded-2xl border border-[#e2ebe2] bg-white p-5 shadow-sm space-y-4 dark:border-slate-800 dark:bg-slate-900',
        className
      )}
    >
      {/* Month & Year Navigation Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className={cn('font-bold text-slate-800 dark:text-white', compact ? 'text-xs' : 'text-base text-[#2e3339]')}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          {!compact && (
            <p className="text-xs text-[#5a5e63] dark:text-slate-400">
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className={cn(
              'flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors',
              compact ? 'h-6 w-6' : 'h-8 w-8'
            )}
            aria-label="Previous month"
          >
            <ChevronLeft className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className={cn(
              'flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors',
              compact ? 'h-6 w-6' : 'h-8 w-8'
            )}
            aria-label="Next month"
          >
            <ChevronRight className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
        {daysOfWeek.map((day) => (
          <div key={day} className="py-0.5">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Leading Empty Cells */}
        {Array.from({ length: firstDayIndex }).map((_, idx) => (
          <div key={`empty-${idx}`} className={compact ? 'h-7 w-full' : 'h-9 w-full'} />
        ))}

        {/* Days of current month */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const day = idx + 1;
          const selected = isSelected(day);
          const today = isToday(day);
          const disabled = isDayDisabled(day);
          const highlighted = isDayHighlighted(day);

          return (
            <button
              key={`day-${day}`}
              type="button"
              disabled={disabled}
              onClick={() => handleDayClick(day)}
              className={cn(
                'relative flex w-full items-center justify-center rounded-lg font-semibold transition-all focus:outline-none',
                compact ? 'h-7 text-xs' : 'h-9 text-xs',
                selected
                  ? 'bg-primary-600 text-white shadow-sm font-bold scale-105'
                  : today
                  ? 'border border-primary-600 text-primary-600 bg-primary-50 dark:bg-primary-950/30'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
                highlighted && !selected && 'bg-primary-50 text-primary-600 font-bold',
                disabled && 'opacity-25 cursor-not-allowed hover:bg-transparent'
              )}
            >
              <span>{day}</span>
              {highlighted && (
                <span
                  className={cn(
                    'absolute bottom-0.5 h-1 w-1 rounded-full',
                    selected ? 'bg-white' : 'bg-primary-600'
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Optional Available Time Slots Booking Grid */}
      {timeSlots && timeSlots.length > 0 && (
        <div className="pt-4 border-t border-[#e2ebe2] space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#2e3339]">
            <Clock className="h-3.5 w-3.5 text-[#315b36]" />
            <span>Available Lesson Slots</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {timeSlots.map((slot) => {
              const isSlotSelected = selectedTimeSlot === slot.id;
              const isAvailable = slot.available !== false;

              return (
                <button
                  key={slot.id}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => onSelectTimeSlot?.(slot.id)}
                  className={cn(
                    'flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-medium transition-all text-left',
                    isSlotSelected
                      ? 'border-[#315b36] bg-[#eff4ec] text-[#315b36] font-bold shadow-sm'
                      : 'border-[#e2ebe2] bg-white text-[#2e3339] hover:border-[#315b36]/40 hover:bg-[#eff4ec]/30',
                    !isAvailable && 'opacity-40 cursor-not-allowed line-through'
                  )}
                >
                  <span>{slot.time}</span>
                  {isSlotSelected && <Check className="h-3 w-3 text-[#315b36]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
