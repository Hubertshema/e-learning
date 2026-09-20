'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Bell,
  UserCheck,
  ShieldAlert,
  Mail,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function UserDropdown() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!user) return null;

  const rolePath =
    user.role === 'SUPERADMIN'
      ? '/superadmin'
      : user.role === 'TEACHER'
      ? '/teacher'
      : '/student';

  const profileHref = `${rolePath}/profile`;
  const settingsHref = `${rolePath}/settings`;
  const notificationsHref =
    user.role === 'STUDENT'
      ? '/student/notifications'
      : user.role === 'TEACHER'
      ? '/teacher/feedback'
      : '/superadmin/email-logs';

  const roleLabel =
    user.role === 'SUPERADMIN'
      ? 'Superadmin'
      : user.role === 'TEACHER'
      ? 'Instructor'
      : 'Student';

  const initials = `${user.firstName?.[0] || 'U'}${user.lastName?.[0] || ''}`;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2.5 rounded-full p-1 sm:px-2.5 sm:py-1.5 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700 shadow-sm">
          <AvatarImage src={(user as any)?.avatarUrl || ''} />
          <AvatarFallback className="bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-bold text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="hidden lg:block text-left">
          <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-[10px] text-slate-400 leading-tight">{roleLabel}</p>
        </div>

        <ChevronDown
          className={`hidden sm:block h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-primary-600' : ''
          }`}
        />
      </button>

      {/* Floating Glassmorphic Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 z-[100] animate-in fade-in zoom-in-95 duration-150">
          {/* User Information Header */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 mb-1">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary-100 dark:border-primary-950 shadow">
                <AvatarImage src={(user as any)?.avatarUrl || ''} />
                <AvatarFallback className="bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-bold text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[11px] text-slate-400 truncate font-mono">{user.email}</p>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between">
              <Badge
                variant={user.role === 'SUPERADMIN' ? 'destructive' : user.role === 'TEACHER' ? 'indigo' : 'success'}
                className="text-[10px] px-2 py-0.5"
              >
                {roleLabel} Account
              </Badge>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="space-y-0.5 py-1">
            {user.role === 'SUPERADMIN' ? (
              <>
                <Link
                  href="/superadmin/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
                >
                  <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Executive Profile</span>
                </Link>

                <Link
                  href="/superadmin/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
                >
                  <Settings className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  <span>Platform Settings</span>
                </Link>

                <Link
                  href="/superadmin/audit-logs"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
                >
                  <ShieldAlert className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                  <span>Security Audit Logs</span>
                </Link>

                <Link
                  href="/superadmin/email-logs"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
                >
                  <Mail className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                  <span>Email Dispatch Logs</span>
                </Link>
              </>
            ) : (
              <>
                {/* Profile Link */}
                <Link
                  href={profileHref}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
                >
                  <User className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <span>Profile Details</span>
                </Link>

                {/* Notifications Link */}
                <Link
                  href={notificationsHref}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
                >
                  <Bell className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <span>Notifications & Alerts</span>
                </Link>

                {/* Settings Link */}
                <Link
                  href={settingsHref}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
                >
                  <Settings className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <span>Account Settings</span>
                </Link>
              </>
            )}
          </div>

          {/* Separator */}
          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

          {/* Logout Action */}
          <button
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
          >
            <LogOut className="h-4 w-4 text-rose-500" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
