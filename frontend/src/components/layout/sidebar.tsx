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
  Award,
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
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
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

  const superadminNav: NavItem[] = [
    { name: 'Overview', href: '/superadmin', icon: LayoutDashboard },
    { name: 'Teacher Approvals', href: '/superadmin/teachers', icon: Users },
    { name: 'Student Directory', href: '/superadmin/students', icon: GraduationCap },
    { name: 'Course Catalog', href: '/superadmin/courses', icon: BookOpen },
    { name: 'Platform Enrollments', href: '/superadmin/enrollments', icon: UserCheck },
    { name: 'Financials & Payments', href: '/superadmin/payments', icon: CreditCard },
    { name: 'Announcements', href: '/superadmin/announcements', icon: Megaphone },
    { name: 'Email Dispatch Logs', href: '/superadmin/email-logs', icon: Mail },
    { name: 'Analytics & Reports', href: '/superadmin/reports', icon: TrendingUp },
    { name: 'Audit Logs', href: '/superadmin/audit-logs', icon: ShieldAlert },
    { name: 'Executive Profile', href: '/superadmin/profile', icon: UserCheck },
    { name: 'Platform Settings', href: '/superadmin/settings', icon: Settings },
  ];

  const teacherNav: NavItem[] = [
    { name: 'Dashboard', href: '/teacher', icon: LayoutDashboard },
    { name: 'My Classes', href: '/teacher/classes', icon: FolderTree },
    { name: 'Courses & Syllabus', href: '/teacher/courses', icon: BookOpen },
    { name: 'Quizzes & Tests', href: '/teacher/quizzes', icon: CheckCircle2 },
    { name: 'Diagnostic Placement', href: '/teacher/diagnostic-quiz', icon: FileCheck },
    { name: 'Assignments & Grading', href: '/teacher/assignments', icon: ClipboardList },
    { name: 'Students Directory', href: '/teacher/students', icon: Users },
    { name: 'Enrollments & Access', href: '/teacher/enrollments', icon: UserCheck },
    { name: 'Expiring Watchlist', href: '/teacher/expiring-students', icon: Clock },
    { name: 'Attendance Register', href: '/teacher/attendance', icon: CalendarCheck },
    { name: 'Student Progress', href: '/teacher/progress', icon: TrendingUp },
    { name: 'Coaching Feedback', href: '/teacher/feedback', icon: MessageSquare },
    { name: 'Resource Library', href: '/teacher/library', icon: Library },
    { name: 'Calendar & Agenda', href: '/teacher/calendar', icon: Calendar },
    { name: 'Payment Verifications', href: '/teacher/payments', icon: CreditCard },
    { name: 'Performance Reports', href: '/teacher/reports', icon: Award },
    { name: 'Teacher Profile', href: '/teacher/profile', icon: UserCheck },
    { name: 'Settings', href: '/teacher/settings', icon: Settings },
  ];

  const studentMainMenu: NavItem[] = [
    { name: 'Dashboard', href: '/student', icon: LayoutDashboard },
    { name: 'My Courses', href: '/student/my-courses', icon: BookOpen },
    { name: 'Assignment', href: '/student/assignments', icon: ClipboardList },
    { name: 'Progress', href: '/student/progress', icon: TrendingUp },
    { name: 'Calendar', href: '/student/calendar', icon: Calendar },
  ];

  const studentOtherMenu: NavItem[] = [
    { name: 'Quizzes & Tests', href: '/student/quizzes', icon: CheckCircle2 },
    { name: 'Placement Test', href: '/student/placement-test', icon: GraduationCap },
    { name: 'Certificates', href: '/student/certificates', icon: FileCheck },
    { name: 'Help Center', href: '/student/feedback', icon: MessageSquare },
    { name: 'Settings', href: '/student/settings', icon: Settings },
  ];

  const isStudent = role === 'STUDENT';
  const navItems =
    role === 'SUPERADMIN'
      ? superadminNav
      : role === 'TEACHER'
      ? teacherNav
      : studentMainMenu;

  const sidebarContent = (
    <div
      className={cn(
        'flex h-full flex-col justify-between border-r border-[#e2ebe2] bg-white transition-all duration-300 ease-in-out shadow-sm',
        collapsed ? 'w-20 p-3' : 'w-64 p-4'
      )}
    >
      <div className="space-y-6 overflow-y-auto overflow-x-hidden">
        {/* Brand Header with Collapse Toggle */}
        <div className="flex items-center justify-between px-1">
          <Link
            href={isStudent ? '/student' : '/'}
            className={cn('flex items-center gap-3', collapsed ? 'justify-center w-full' : '')}
            onClick={onClose}
            title="LinguaChris Academy"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#315b36] text-white shadow-sm overflow-hidden p-1.5">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-full w-full object-contain filter brightness-0 invert"
              />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <span className="font-bold text-base tracking-tight text-[#2e3339] block leading-tight truncate">
                  LinguaChris
                </span>
                <span className="text-xs font-semibold text-[#7ba27a] block truncate">
                  Student Dashboard
                </span>
              </div>
            )}
          </Link>

          {!collapsed && (
            <button
              onClick={toggleCollapsed}
              className="hidden md:flex h-8 w-8 items-center justify-center rounded-md text-[#5a5e63] hover:bg-[#eff4ec] hover:text-[#315b36] transition-colors"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-4.5 w-4.5" />
            </button>
          )}
        </div>

        {/* Collapsed Expand Toggle Button */}
        {collapsed && (
          <div className="hidden md:flex justify-center pb-1">
            <button
              onClick={toggleCollapsed}
              className="flex h-8 w-8 items-center justify-center rounded-md text-[#5a5e63] hover:bg-[#eff4ec] hover:text-[#315b36] transition-colors"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="h-4.5 w-4.5" />
            </button>
          </div>
        )}

        {/* Student Categorized Menus */}
        {isStudent ? (
          <div className="space-y-6">
            {/* MAIN MENU */}
            <div>
              {!collapsed && (
                <p className="px-3 text-xs font-bold uppercase tracking-wider text-[#7a8188] mb-2">
                  Main Menu
                </p>
              )}
              <nav className="space-y-1.5">
                {studentMainMenu.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onClose}
                      title={collapsed ? item.name : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-md py-2.5 text-sm font-semibold transition-all',
                        collapsed ? 'justify-center px-2' : 'px-3.5',
                        isActive
                          ? 'bg-[#315b36] text-white shadow-sm font-bold'
                          : 'text-[#2e3339] hover:bg-[#eff4ec] hover:text-[#315b36]'
                      )}
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      {!collapsed && <span className="truncate">{item.name}</span>}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* OTHER MENU */}
            <div>
              {!collapsed && (
                <p className="px-3 text-xs font-bold uppercase tracking-wider text-[#7a8188] mb-2">
                  Other Menu
                </p>
              )}
              <nav className="space-y-1.5">
                {studentOtherMenu.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onClose}
                      title={collapsed ? item.name : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-md py-2.5 text-sm font-semibold transition-all',
                        collapsed ? 'justify-center px-2' : 'px-3.5',
                        isActive
                          ? 'bg-[#315b36] text-white shadow-sm font-bold'
                          : 'text-[#2e3339] hover:bg-[#eff4ec] hover:text-[#315b36]'
                      )}
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      {!collapsed && <span className="truncate">{item.name}</span>}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        ) : (
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  title={collapsed ? item.name : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-md py-2.5 text-sm font-semibold transition-all',
                    collapsed ? 'justify-center px-2' : 'px-3',
                    isActive
                      ? 'bg-[#315b36] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-[#eff4ec] hover:text-[#315b36]'
                  )}
                >
                  <Icon className={cn('h-4.5 w-4.5 shrink-0', isActive ? 'text-white' : 'text-slate-400')} />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {/* Footer Profile & Logout */}
      <div className="border-t border-[#e2ebe2] pt-3 space-y-2">
        <button
          onClick={() => logout()}
          title="Logout"
          className={cn(
            'w-full flex items-center gap-2.5 py-2.5 rounded-md text-sm font-bold text-[#e63946] hover:bg-[#fee2e2] transition-colors',
            collapsed ? 'justify-center px-2' : 'px-3'
          )}
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden md:flex h-screen shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer backdrop and slide-over */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <div className="relative z-10 flex h-full max-w-xs flex-1 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
