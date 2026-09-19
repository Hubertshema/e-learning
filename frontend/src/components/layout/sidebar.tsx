'use client';

import React from 'react';
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

  const studentNav: NavItem[] = [
    { name: 'My Learning Hub', href: '/student', icon: LayoutDashboard },
    { name: 'My Courses', href: '/student/my-courses', icon: BookOpen },
    { name: 'Explore Courses', href: '/student/courses', icon: Sparkles },
    { name: 'Placement Test', href: '/student/placement-test', icon: GraduationCap },
    { name: 'Assignments', href: '/student/assignments', icon: ClipboardList },
    { name: 'Quizzes & Tests', href: '/student/quizzes', icon: CheckCircle2 },
    { name: '7-Skill Progress', href: '/student/progress', icon: TrendingUp },
    { name: 'Academic Results', href: '/student/results', icon: Award },
    { name: 'Attendance Record', href: '/student/attendance', icon: CalendarCheck },
    { name: 'Teacher Feedback', href: '/student/feedback', icon: MessageSquare },
    { name: 'My Enrollments', href: '/student/enrollments', icon: UserCheck },
    { name: 'Payment History', href: '/student/payments', icon: CreditCard },
    { name: 'Certificates', href: '/student/certificates', icon: FileCheck },
    { name: 'Learning Calendar', href: '/student/calendar', icon: Calendar },
    { name: 'Notifications', href: '/student/notifications', icon: Bell },
    { name: 'Student Profile', href: '/student/profile', icon: UserCheck },
    { name: 'Settings', href: '/student/settings', icon: Settings },
  ];

  const navItems =
    role === 'SUPERADMIN'
      ? superadminNav
      : role === 'TEACHER'
      ? teacherNav
      : studentNav;

  const sidebarContent = (
    <div className="flex h-full w-64 flex-col justify-between border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-lg md:shadow-none">
      <div>
        {/* Brand Header */}
        <Link href="/" className="flex items-center gap-2.5 px-3 py-2" onClick={onClose}>
          <img
            src="/logo.png"
            alt="LinguaChris Academy Logo"
            className="h-9 w-auto object-contain"
          />
          <div>
            <span className="font-bold text-slate-900 dark:text-white">LinguaChris</span>
            <span className="ml-1 rounded bg-[#EBF2EB] px-1.5 py-0.5 text-[10px] font-bold text-[#3B6748] dark:bg-emerald-950 dark:text-emerald-300">
              {role}
            </span>
          </div>
        </Link>

        {/* Navigation list */}
        <nav className="mt-6 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm dark:bg-primary-950/60 dark:text-primary-300'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5',
                    isActive ? 'text-primary-600' : 'text-slate-400 dark:text-slate-500'
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
            </div>
            <div className="truncate">
              <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-[11px] text-slate-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Sign Out"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-destructive dark:hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
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
