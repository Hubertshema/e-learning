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
    { name: 'Analytics & Reports', href: '/superadmin/reports', icon: TrendingUp },
  ];

  const teacherNav: NavItem[] = [
    { name: 'Dashboard', href: '/teacher', icon: LayoutDashboard },
    { name: 'Learning Levels', href: '/teacher/levels', icon: FolderTree },
    { name: 'Courses & Syllabus', href: '/teacher/courses', icon: BookOpen },
    { name: 'Diagnostic Placement', href: '/teacher/diagnostic-quiz', icon: FileCheck },
    { name: 'Students Directory', href: '/teacher/students', icon: Users },
    { name: 'Enrollments & Access', href: '/teacher/enrollments', icon: UserCheck },
    { name: 'Expiring Watchlist', href: '/teacher/expiring-students', icon: Clock },
    { name: 'Attendance Register', href: '/teacher/attendance', icon: CalendarCheck },
    { name: 'Coaching Feedback', href: '/teacher/feedback', icon: MessageSquare },
    { name: 'Resource Library', href: '/teacher/library', icon: Library },
    { name: 'Calendar & Agenda', href: '/teacher/calendar', icon: Calendar },
    { name: 'Payment Verifications', href: '/teacher/payments', icon: CreditCard },
    { name: 'Performance Reports', href: '/teacher/reports', icon: Award },
  ];

  const studentMainMenu: NavItem[] = [
    { name: 'Dashboard', href: '/student', icon: LayoutDashboard },
    { name: 'Subscription & Plans', href: '/student/subscription', icon: Sparkles },
    { name: 'Courses Catalog', href: '/student/courses', icon: BookOpen },
    { name: 'My Learning', href: '/student/my-courses', icon: GraduationCap },
    { name: 'Assignments', href: '/student/assignments', icon: ClipboardList },
    { name: 'Progress', href: '/student/progress', icon: TrendingUp },
    { name: 'Calendar', href: '/student/calendar', icon: Calendar },
  ];

  const studentOtherMenu: NavItem[] = [
    { name: 'Billing & Payments', href: '/student/payments', icon: CreditCard },
    { name: 'Quizzes & Tests', href: '/student/quizzes', icon: CheckCircle2 },
    { name: 'Placement Test', href: '/student/placement-test', icon: GraduationCap },
    { name: 'Certificates', href: '/student/certificates', icon: FileCheck },
    { name: 'Help & Feedback', href: '/student/feedback', icon: MessageSquare },
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
            href={
              role === 'SUPERADMIN'
                ? '/superadmin'
                : role === 'TEACHER'
                ? '/teacher'
                : '/student'
            }
            className={cn('flex items-center gap-3', collapsed ? 'justify-center w-full' : '')}
            onClick={onClose}
            title="LinguaChris Academy"
          >
            {collapsed ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-[#e2ebe2] shadow-xs overflow-hidden p-1">
                <img
                  src="/logo.png"
                  alt="LinguaChris Logo"
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex flex-col">
                <img
                  src="/logo.png"
                  alt="LinguaChris Academy"
                  className="h-9 w-auto max-w-[155px] object-contain object-left"
                />
                <span className="text-[11px] font-semibold text-[#315b36] tracking-tight mt-0.5">
                  {role === 'SUPERADMIN'
                    ? 'Superadmin Dashboard'
                    : role === 'TEACHER'
                    ? 'Teacher Dashboard'
                    : 'Student Dashboard'}
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
