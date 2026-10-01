'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Role } from '@/types/auth';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  LayoutDashboard,
  Users,
  GraduationCap,
  CreditCard,
  FileCheck,
  Settings,
  ShieldAlert,
  ClipboardList,
  CheckCircle2,
  CalendarCheck,
  TrendingUp,
  LogOut,
  FolderTree,
  Sparkles,
  Calendar,
  Clock,
  MessageSquare,
  Library,
  UserCheck,
  Bell,
  Mail,
  Megaphone,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

interface SidebarProps {
  role: Role;
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ role, mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Sync with localStorage
  useEffect(() => {
    setIsMounted(true);
    const savedState = localStorage.getItem('linguachris_sidebar_collapsed');
    if (savedState !== null) {
      setCollapsed(savedState === 'true');
    }
  }, []);

  const toggleCollapsed = () => {
    const nextState = !collapsed;
    setCollapsed(nextState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('linguachris_sidebar_collapsed', String(nextState));
    }
  };

  // Superadmin Navigation Sections
  const superadminSections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { name: 'Overview', href: '/superadmin', icon: LayoutDashboard },
        { name: 'Teacher Approvals', href: '/superadmin/teachers', icon: Users },
        { name: 'Student Directory', href: '/superadmin/students', icon: GraduationCap },
      ],
    },
    {
      title: 'Academy Management',
      items: [
        { name: 'Course Catalog', href: '/superadmin/courses', icon: BookOpen },
        { name: 'Platform Enrollments', href: '/superadmin/enrollments', icon: UserCheck },
        { name: 'Financials & Payments', href: '/superadmin/payments', icon: CreditCard },
      ],
    },
    {
      title: 'Communications',
      items: [
        { name: 'Announcements', href: '/superadmin/announcements', icon: Megaphone },
        { name: 'Analytics & Reports', href: '/superadmin/reports', icon: TrendingUp },
      ],
    },
  ];

  // Teacher Navigation Sections
  const teacherSections: NavSection[] = [
    {
      title: 'Main Hub',
      items: [
        { name: 'Dashboard', href: '/teacher', icon: LayoutDashboard },
        { name: 'Students Directory', href: '/teacher/students', icon: Users, badge: 'Unified' },
      ],
    },
    {
      title: 'Curriculum & Syllabi',
      items: [
        { name: 'Courses & Syllabus', href: '/teacher/courses', icon: BookOpen },
        { name: 'Learning Levels', href: '/teacher/levels', icon: FolderTree },
        { name: 'Resource Library', href: '/teacher/library', icon: Library },
      ],
    },
  ];

  // Student Navigation Sections
  const studentSections: NavSection[] = [
    {
      title: 'My Learning Space',
      items: [
        { name: 'Dashboard', href: '/student', icon: LayoutDashboard },
        { name: 'My Learning', href: '/student/my-courses', icon: GraduationCap },
        { name: 'Certificates', href: '/student/certificates', icon: FileCheck },
      ],
    },
  ];

  const sections =
    role === 'SUPERADMIN'
      ? superadminSections
      : role === 'TEACHER'
      ? teacherSections
      : studentSections;

  const userRoleLabel =
    role === 'SUPERADMIN'
      ? 'Super Admin'
      : role === 'TEACHER'
      ? 'Instructor'
      : 'Student';

  const userInitials =
    `${user?.firstName?.[0] || 'U'}${user?.lastName?.[0] || ''}`.toUpperCase();

  const sidebarContent = (
    <div
      className={cn(
        'flex h-full flex-col justify-between border-r border-[#e2ebe2]/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-all duration-300 ease-in-out select-none shadow-xs',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* ─── Top Brand Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col border-b border-[#e2ebe2]/60 dark:border-slate-800/80 px-4 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <Link
            href={
              role === 'SUPERADMIN'
                ? '/superadmin'
                : role === 'TEACHER'
                ? '/teacher'
                : '/student'
            }
            className={cn('flex items-center gap-3 group', collapsed ? 'justify-center w-full' : '')}
            onClick={onClose}
            title="LinguaChris Academy"
          >
            {collapsed ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 shadow-xs p-1.5 transition-transform group-hover:scale-105">
                <img
                  src="/logo.png"
                  alt="LinguaChris Logo"
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 p-1 shadow-2xs">
                  <img
                    src="/logo.png"
                    alt="LinguaChris"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white leading-none">
                    LinguaChris
                  </span>
                  <span className="text-[10px] font-bold text-[#315b36] dark:text-emerald-400 tracking-tight mt-1 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {userRoleLabel} Hub
                  </span>
                </div>
              </div>
            )}
          </Link>

          {!collapsed && (
            <button
              onClick={toggleCollapsed}
              className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-[#eff4ec] dark:hover:bg-slate-800 hover:text-[#315b36] dark:hover:text-emerald-400 transition-colors"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Collapsed Expand Trigger */}
        {collapsed && (
          <div className="hidden md:flex justify-center pt-3">
            <button
              onClick={toggleCollapsed}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-[#eff4ec] dark:hover:bg-slate-800 hover:text-[#315b36] dark:hover:text-emerald-400 transition-colors"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* ─── Middle Navigation Menu (Grouped) ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-6 scrollbar-thin">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {!collapsed && section.title && (
              <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                {section.title}
              </p>
            )}

            <nav className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/teacher' &&
                    item.href !== '/student' &&
                    item.href !== '/superadmin' &&
                    pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    title={collapsed ? item.name : undefined}
                    className={cn(
                      'group relative flex items-center rounded-xl text-xs font-bold transition-all duration-150',
                      collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
                      isActive
                        ? 'bg-gradient-to-r from-[#315b36] to-[#254629] text-white shadow-md shadow-[#315b36]/25 font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-[#eff4ec] dark:hover:bg-slate-800/70 hover:text-[#315b36] dark:hover:text-emerald-400'
                    )}
                  >
                    {/* Left Active Accent Pill */}
                    {isActive && !collapsed && (
                      <span className="absolute left-1 top-2 bottom-2 w-1 rounded-full bg-emerald-400 shadow-xs" />
                    )}

                    <Icon
                      className={cn(
                        'shrink-0 transition-transform duration-150 group-hover:scale-110',
                        collapsed ? 'h-5 w-5' : 'h-4 w-4',
                        isActive
                          ? 'text-white'
                          : 'text-slate-400 dark:text-slate-500 group-hover:text-[#315b36] dark:group-hover:text-emerald-400'
                      )}
                    />

                    {!collapsed && (
                      <span className="truncate flex-1 font-semibold">{item.name}</span>
                    )}

                    {!collapsed && item.badge && (
                      <span
                        className={cn(
                          'text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full',
                          isActive
                            ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-[#315b36] dark:text-emerald-400'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* ─── Bottom User Profile & Session Card ───────────────────────────── */}
      <div className="border-t border-[#e2ebe2]/80 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/60 shrink-0">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#315b36] to-[#1e3c23] text-white font-black text-xs shadow-xs"
              title={`${user?.firstName || 'User'} (${userRoleLabel})`}
            >
              {userInitials}
            </div>
            <button
              onClick={() => logout()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2.5 p-1">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="relative shrink-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#315b36] to-[#1e3c23] text-white font-black text-xs shadow-sm">
                  {userInitials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-slate-900 dark:text-white truncate leading-tight">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Faculty Member'}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                  {user?.email || 'authenticated'}
                </p>
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
              title="Sign Out of LMS"
              aria-label="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden lg:flex h-screen shrink-0 relative z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        {sections
          .flatMap((s) => s.items)
          .slice(0, 5) // Limit to 5 items to fit nicely
          .map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/teacher' &&
                item.href !== '/student' &&
                item.href !== '/superadmin' &&
                pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                title={item.name}
                className={cn(
                  'relative flex items-center justify-center flex-1 py-2 transition-colors',
                  isActive
                    ? 'text-[#315b36] dark:text-emerald-400'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5px]')} />
                {isActive && (
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#315b36] dark:bg-emerald-400" />
                )}
              </Link>
            );
          })}
      </nav>
    </>
  );
}

