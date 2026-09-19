'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  ShieldAlert,
  ClipboardList,
  CheckCircle2,
  CalendarCheck,
  TrendingUp,
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
  ChevronDown,
  ShieldCheck,
  FilePlus,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: 'primary' | 'success' | 'indigo' | 'warning' | 'destructive';
}

interface NavSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
  defaultOpen?: boolean;
}

interface SidebarProps {
  role: Role;
  mobileOpen?: boolean;
  onClose?: () => void;
}

// 1. Superadmin Section Groups
const SUPERADMIN_SECTIONS: NavSection[] = [
  {
    id: 'core_ops',
    title: 'Core Operations',
    icon: LayoutDashboard,
    defaultOpen: true,
    items: [
      { name: 'Executive Overview', href: '/superadmin', icon: LayoutDashboard },
      { name: 'Teacher Directory', href: '/superadmin/teachers', icon: GraduationCap },
      { name: 'Student Registry', href: '/superadmin/students', icon: Users },
      { name: 'Class Cohorts', href: '/superadmin/classes', icon: FolderTree },
    ],
  },
  {
    id: 'academics',
    title: 'Academics & Content',
    icon: BookOpen,
    defaultOpen: true,
    items: [
      { name: 'Course Catalog', href: '/superadmin/courses', icon: BookOpen },
    ],
  },
  {
    id: 'financials',
    title: 'Financial Ledger',
    icon: CreditCard,
    defaultOpen: true,
    items: [
      { name: 'Financials & Payments', href: '/superadmin/payments', icon: CreditCard },
    ],
  },
  {
    id: 'security_comms',
    title: 'Communications & Audit',
    icon: ShieldAlert,
    defaultOpen: false,
    items: [
      { name: 'Announcements', href: '/superadmin/announcements', icon: Megaphone },
      { name: 'Email Dispatch Logs', href: '/superadmin/email-logs', icon: Mail },
      { name: 'Audit Logs', href: '/superadmin/audit-logs', icon: ShieldAlert },
    ],
  },
];

// 2. Teacher Section Groups
const TEACHER_SECTIONS: NavSection[] = [
  {
    id: 'command_ai',
    title: 'Studio & Intelligence',
    icon: Sparkles,
    defaultOpen: true,
    items: [
      { name: 'Instructor Dashboard', href: '/teacher', icon: LayoutDashboard },
      { name: 'AI Teaching Assistant', href: '/teacher/ai', icon: Sparkles, badge: 'AI Studio', badgeVariant: 'indigo' },
    ],
  },
  {
    id: 'classroom_content',
    title: 'Curriculum & Cohorts',
    icon: FolderTree,
    defaultOpen: true,
    items: [
      { name: 'Courses & Syllabus', href: '/teacher/courses', icon: BookOpen },
      { name: 'Lesson Creator', href: '/teacher/lessons/create', icon: FilePlus, badge: 'Studio', badgeVariant: 'indigo' },
      { name: 'My Classes', href: '/teacher/classes', icon: FolderTree },
      { name: 'Resource Library', href: '/teacher/library', icon: Library },
      { name: 'Calendar & Agenda', href: '/teacher/calendar', icon: Calendar },
    ],
  },
  {
    id: 'evaluations',
    title: 'Assessments & Grading',
    icon: CheckCircle2,
    defaultOpen: true,
    items: [
      { name: 'Quizzes & Tests', href: '/teacher/quizzes', icon: CheckCircle2 },
      { name: 'Assignments & Grading', href: '/teacher/assignments', icon: ClipboardList },
      { name: 'Coaching Feedback', href: '/teacher/feedback', icon: MessageSquare },
    ],
  },
  {
    id: 'students_monitoring',
    title: 'Student Performance',
    icon: Users,
    defaultOpen: false,
    items: [
      { name: 'Students Directory', href: '/teacher/students', icon: Users },
      { name: 'Enrollments & Access', href: '/teacher/enrollments', icon: UserCheck },
      { name: 'Expiring Watchlist', href: '/teacher/expiring-students', icon: Clock, badge: 'Alert', badgeVariant: 'warning' },
      { name: 'Attendance Register', href: '/teacher/attendance', icon: CalendarCheck },
      { name: 'Student Progress', href: '/teacher/progress', icon: TrendingUp },
      { name: 'Performance Reports', href: '/teacher/reports', icon: Award },
    ],
  },
  {
    id: 'earnings',
    title: 'Earnings & Payouts',
    icon: CreditCard,
    defaultOpen: false,
    items: [
      { name: 'Payment Verifications', href: '/teacher/payments', icon: CreditCard },
    ],
  },
];

// 3. Student Section Groups
const STUDENT_SECTIONS: NavSection[] = [
  {
    id: 'learning_hub',
    title: 'Study & Courses',
    icon: BookOpen,
    defaultOpen: true,
    items: [
      { name: 'My Learning Hub', href: '/student', icon: LayoutDashboard },
      { name: 'My Courses', href: '/student/my-courses', icon: BookOpen },
      { name: 'Explore Courses', href: '/student/courses', icon: Sparkles, badge: 'Catalog', badgeVariant: 'primary' },
      { name: 'Placement Diagnostic', href: '/student/placement-test', icon: GraduationCap },
    ],
  },
  {
    id: 'tasks_schedule',
    title: 'Tasks & Schedule',
    icon: ClipboardList,
    defaultOpen: true,
    items: [
      { name: 'Assignments', href: '/student/assignments', icon: ClipboardList },
      { name: 'Quizzes & Tests', href: '/student/quizzes', icon: CheckCircle2 },
      { name: 'Learning Calendar', href: '/student/calendar', icon: Calendar },
    ],
  },
  {
    id: 'mastery_achievements',
    title: 'Progress & Results',
    icon: Award,
    defaultOpen: true,
    items: [
      { name: '7-Skill Progress', href: '/student/progress', icon: TrendingUp },
      { name: 'Academic Results', href: '/student/results', icon: Award },
      { name: 'Attendance Record', href: '/student/attendance', icon: CalendarCheck },
      { name: 'Teacher Feedback', href: '/student/feedback', icon: MessageSquare },
      { name: 'Certificates', href: '/student/certificates', icon: FileCheck },
    ],
  },
  {
    id: 'finance_alerts',
    title: 'Billing & History',
    icon: CreditCard,
    defaultOpen: false,
    items: [
      { name: 'My Enrollments', href: '/student/enrollments', icon: UserCheck },
      { name: 'Payment History', href: '/student/payments', icon: CreditCard },
      { name: 'Notifications', href: '/student/notifications', icon: Bell },
    ],
  },
];

interface SidebarNavProps {
  sections: NavSection[];
  pathname: string;
  role: Role;
  openSections: Record<string, boolean>;
  onToggleSection: (sectionId: string, defaultOpen: boolean) => void;
  onLinkClick?: () => void;
}

function SidebarNav({
  sections,
  pathname,
  role,
  openSections,
  onToggleSection,
  onLinkClick,
}: SidebarNavProps) {
  const homeHref =
    role === 'SUPERADMIN' ? '/superadmin' : role === 'TEACHER' ? '/teacher' : '/student';

  const isItemActive = (href: string) => {
    if (pathname === href) return true;
    if (href !== '/teacher' && href !== '/student' && href !== '/superadmin') {
      return pathname.startsWith(href);
    }
    return false;
  };

  return (
    <div className="flex h-full w-72 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xl md:shadow-none select-none">
      {/* Fixed Brand Header */}
      <div className="p-4 pb-3 shrink-0 border-b border-slate-100 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <Link
          href={homeHref}
          className="flex items-center gap-3 px-2 py-1 group cursor-pointer"
          onClick={onLinkClick}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform duration-200 shrink-0">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="font-black tracking-tight text-slate-900 dark:text-white text-base">
                FluentEdge
              </span>
              <span className="rounded-md bg-primary-50 px-1.5 py-0.2 text-[10px] font-black uppercase text-primary-600 dark:bg-primary-950/80 dark:text-primary-400 border border-primary-100 dark:border-primary-900/50">
                {role}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">CEFR English Academy</p>
          </div>
        </Link>
      </div>

      {/* Grouped & Collapsible Navigation List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 space-y-3 custom-scrollbar">
        {sections.map((section) => {
          const isOpen =
            openSections[section.id] !== undefined
              ? openSections[section.id]
              : section.defaultOpen ?? true;
          const SectionIcon = section.icon;
          const hasActiveItem = section.items.some((item) => isItemActive(item.href));

          return (
            <div
              key={section.id}
              className={cn(
                'rounded-2xl border transition-all duration-200 overflow-hidden',
                hasActiveItem
                  ? 'border-primary-200/80 bg-slate-50/70 dark:border-primary-900/40 dark:bg-slate-900/60 shadow-xs'
                  : 'border-slate-200/70 bg-slate-50/30 dark:border-slate-800/60 dark:bg-slate-900/30 hover:border-slate-300 dark:hover:border-slate-700'
              )}
            >
              {/* Section Header Accordion Trigger */}
              <button
                type="button"
                onClick={() => onToggleSection(section.id, section.defaultOpen ?? true)}
                className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-slate-100/60 dark:hover:bg-slate-800/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20 cursor-pointer"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors',
                      hasActiveItem
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                        : 'bg-slate-200/60 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    )}
                  >
                    <SectionIcon className="h-3.5 w-3.5" />
                  </div>
                  <span
                    className={cn(
                      'text-[11px] font-bold uppercase tracking-wider truncate',
                      hasActiveItem
                        ? 'text-primary-900 dark:text-primary-200 font-black'
                        : 'text-slate-600 dark:text-slate-400'
                    )}
                  >
                    {section.title}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500 bg-slate-200/50 dark:bg-slate-800/60 px-1.5 py-0.2 rounded-md">
                    {section.items.length}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 text-slate-400 transition-transform duration-200',
                      isOpen ? 'rotate-180 text-primary-600' : ''
                    )}
                  />
                </div>
              </button>

              {/* Collapsible Section Links Container */}
              {isOpen && (
                <div className="px-2 pb-2 pt-1 space-y-1 border-t border-slate-200/40 dark:border-slate-800/40 animate-in fade-in slide-in-from-top-1 duration-150">
                  {section.items.map((item) => {
                    const isActive = isItemActive(item.href);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={onLinkClick}
                        className={cn(
                          'group relative flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition-all duration-150 cursor-pointer select-none',
                          isActive
                            ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-500/25'
                            : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={cn(
                              'h-4 w-4 shrink-0 transition-transform group-hover:scale-110',
                              isActive
                                ? 'text-white'
                                : 'text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-300'
                            )}
                          />
                          <span className="truncate leading-relaxed">{item.name}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={cn(
                              'ml-1.5 shrink-0 rounded-full px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider',
                              isActive
                                ? 'bg-white/20 text-white'
                                : item.badgeVariant === 'indigo'
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                : item.badgeVariant === 'warning'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}

                        {/* Active subtle pill highlight */}
                        {isActive && (
                          <span className="absolute right-1.5 h-1.5 w-1.5 rounded-full bg-white shadow-xs" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar({ role, mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  const normalizedRole = (role || '').toUpperCase() as Role;
  const sections = useMemo(() => {
    if (normalizedRole === 'SUPERADMIN') return SUPERADMIN_SECTIONS;
    if (normalizedRole === 'TEACHER') return TEACHER_SECTIONS;
    return STUDENT_SECTIONS;
  }, [normalizedRole]);

  // Track expanded/collapsed sections with a record
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // Auto-expand section if currently active route is inside it
  useEffect(() => {
    sections.forEach((sec) => {
      const hasActiveChild = sec.items.some((item) => {
        if (pathname === item.href) return true;
        if (item.href !== '/teacher' && item.href !== '/student' && item.href !== '/superadmin') {
          return pathname.startsWith(item.href);
        }
        return false;
      });

      if (hasActiveChild) {
        setOpenSections((prev) => {
          if (prev[sec.id] === true) return prev;
          return { ...prev, [sec.id]: true };
        });
      }
    });
  }, [pathname, sections]);

  const handleToggleSection = (sectionId: string, defaultOpen: boolean) => {
    setOpenSections((prev) => {
      const current = prev[sectionId] !== undefined ? prev[sectionId] : defaultOpen;
      return {
        ...prev,
        [sectionId]: !current,
      };
    });
  };

  const handleMobileNavClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden md:flex h-screen w-72 shrink-0 z-30">
        <SidebarNav
          sections={sections}
          pathname={pathname}
          role={normalizedRole}
          openSections={openSections}
          onToggleSection={handleToggleSection}
        />
      </aside>

      {/* Mobile drawer backdrop and slide-over */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={onClose}
          />
          <div className="relative z-10 flex h-full w-72 max-w-[85vw] flex-1 animate-in slide-in-from-left duration-200">
            <SidebarNav
              sections={sections}
              pathname={pathname}
              role={normalizedRole}
              openSections={openSections}
              onToggleSection={handleToggleSection}
              onLinkClick={handleMobileNavClick}
            />
          </div>
        </div>
      )}
    </>
  );
}
