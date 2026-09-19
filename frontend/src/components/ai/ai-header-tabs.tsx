'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  MessageSquare,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Award,
  History,
  Bot,
} from 'lucide-react';

export const AI_STUDIO_TABS = [
  { name: 'AI Studio Hub', href: '/teacher/ai', icon: Sparkles },
  { name: 'AI Chat Copilot', href: '/teacher/ai/chat', icon: MessageSquare },
  { name: 'AI Lesson Planner', href: '/teacher/ai/lesson-planner', icon: BookOpen },
  { name: 'AI Activity Generator', href: '/teacher/ai/activity-generator', icon: CheckCircle2 },
  { name: 'AI Assessment Studio', href: '/teacher/ai/assessment-generator', icon: ClipboardList },
  { name: 'AI Feedback Assistant', href: '/teacher/ai/feedback-ai', icon: Award },
  { name: 'AI History & Drafts', href: '/teacher/ai/history', icon: History },
];

export function AIHeaderTabs() {
  const pathname = usePathname();

  return (
    <div className="w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 rounded-2xl p-2 shadow-sm mb-6">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
        {AI_STUDIO_TABS.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all shrink-0',
                isActive
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-primary-500')} />
              <span>{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
