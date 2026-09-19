'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AIHeaderTabs } from '@/components/ai/ai-header-tabs';
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  Award,
  History,
  TrendingUp,
  BrainCircuit,
  Lightbulb,
  ArrowRight,
  Clock,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface AIQuota {
  dailyUsed: number;
  dailyLimit: number;
  monthlyUsed: number;
  monthlyLimit: number;
  remainingDaily: number;
  totalGenerations: number;
}

interface AIHistoryItem {
  id: string;
  type: string;
  title: string;
  status: string;
  createdAt: string;
}

export default function AITeachingAssistantHubPage() {
  const [stats, setStats] = useState<AIQuota | null>(null);
  const [recentWork, setRecentWork] = useState<AIHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [statsData, historyData] = await Promise.all([
          api.get<AIQuota>('/ai/stats').catch(() => null),
          api.get<{ items: AIHistoryItem[] }>('/ai/history?limit=5').catch(() => ({ items: [] })),
        ]);

        if (statsData) setStats(statsData);
        if (historyData?.items) setRecentWork(historyData.items);
      } catch (err) {
        console.error('Failed to load AI hub data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const studioTools = [
    {
      title: 'AI Lesson Planner',
      description: 'Generate structured CEFR-aligned 45-90 min lesson plans with warm-up, guided drills, pair tasks, and homework.',
      href: '/teacher/ai/lesson-planner',
      icon: BookOpen,
      badge: 'Pedagogical',
      color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-500',
    },
    {
      title: 'Activity & Exercise Studio',
      description: 'Generate 8 skill types (Grammar, Vocab, Reading, Speaking, Pronunciation) and 7 interactive question formats.',
      href: '/teacher/ai/activity-generator',
      icon: CheckCircle2,
      badge: 'Interactive',
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-500',
    },
    {
      title: 'Assessment & Exam Studio',
      description: 'Design comprehensive tests with Bloom’s Taxonomy cognitive distributions, answer keys, and marking schemes.',
      href: '/teacher/ai/assessment-generator',
      icon: ClipboardList,
      badge: 'Exam Grade',
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-500',
    },
    {
      title: 'AI Feedback & Coaching',
      description: 'Analyze student essays and speaking tasks against rubrics; generate motivating, strengths-focused feedback.',
      href: '/teacher/ai/feedback-ai',
      icon: Award,
      badge: 'Coaching',
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-500',
    },
    {
      title: 'Curriculum Copilot Chat',
      description: 'Conversational assistant with contextual awareness to refine objectives, brainstorm activities, and adjust CEFR level.',
      href: '/teacher/ai/chat',
      icon: MessageSquare,
      badge: '24/7 Copilot',
      color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-500',
    },
    {
      title: 'AI History & Drafts Archive',
      description: 'Search, review, revise, duplicate, or export past AI generations and drafts created for your courses.',
      href: '/teacher/ai/history',
      icon: History,
      badge: 'Repository',
      color: 'from-slate-500/20 to-slate-700/20 border-slate-500/30 text-slate-400',
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Unified AI Studio Navigation Tabs */}
      <AIHeaderTabs />

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-primary-500/20 bg-gradient-to-r from-slate-900 via-primary-950/60 to-slate-900 p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-3 py-1 text-xs font-semibold text-primary-400 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              Teacher-Centric AI Curriculum Suite
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              AI Teaching Assistant Hub
            </h1>
            <p className="max-w-2xl text-slate-300 text-sm md:text-base">
              Accelerate lesson planning, generate multi-skill assessment exercises, and compose constructive student feedback while maintaining complete academic control.
            </p>
          </div>

          {/* Live Quota Badge */}
          <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-slate-800/80 p-4 backdrop-blur-md min-w-[240px]">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5 text-primary-400">
                <Zap className="h-4 w-4" /> Daily Quota
              </span>
              <span>{stats ? `${stats.dailyUsed} / ${stats.dailyLimit}` : '0 / 50'}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-emerald-400 transition-all duration-500"
                style={{
                  width: `${stats ? Math.min(100, (stats.dailyUsed / stats.dailyLimit) * 100) : 0}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>{stats?.remainingDaily ?? 50} remaining today</span>
              <span>{stats?.totalGenerations ?? 0} total created</span>
            </div>
          </div>
        </div>

        {/* Subtle decorative glow */}
        <div className="absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-primary-600/10 blur-3xl pointer-events-none" />
      </div>

      {/* Safety & Academic Guarantee Notice */}
      <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-emerald-300 text-xs md:text-sm">
        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
        <div>
          <span className="font-semibold text-emerald-200">Teacher-in-the-Loop Mandate:</span> All AI-generated content is created as private draft material for your review. Content is never automatically published to students without explicit teacher approval and customization.
        </div>
      </div>

      {/* Studio Tools Grid */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-primary-500" />
          Curriculum & Generation Studios
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {studioTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card
                key={tool.title}
                className="group relative flex flex-col justify-between border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 transition-all duration-300 hover:-translate-y-1 hover:border-primary-500/40 hover:shadow-xl dark:hover:shadow-primary-950/30"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2.5 rounded-xl border bg-gradient-to-br ${tool.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <Badge variant="outline" className="border-primary-500/30 text-primary-400 text-[10px]">
                      {tool.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors">
                    {tool.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link href={tool.href}>
                    <Button variant="outline" className="w-full justify-between group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-600 transition-all text-xs font-semibold">
                      Launch Studio
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent AI Workspaces */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary-500" />
            Recent AI Workspaces & Drafts
          </h2>
          <Link href="/teacher/ai/history" className="text-xs font-semibold text-primary-500 hover:underline flex items-center gap-1">
            View full history ({stats?.totalGenerations || 0}) <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading AI workspace records...</div>
        ) : recentWork.length === 0 ? (
          <Card className="border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-8 text-center">
            <Lightbulb className="mx-auto h-8 w-8 text-primary-400 mb-2 opacity-80" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No AI generations yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Select one of the studio tools above to generate your first lesson plan, quiz, or interactive activity.
            </p>
            <Link href="/teacher/ai/lesson-planner">
              <Button size="sm" className="bg-primary-600 hover:bg-primary-700">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Start First Lesson Plan
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentWork.map((item) => (
              <Card key={item.id} className="border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between hover:border-primary-500/40 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <Badge variant="secondary" className="text-[10px] font-mono uppercase">
                      {item.type}
                    </Badge>
                    <span className="text-[11px] text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1 pt-1">
                    {item.title}
                  </h4>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                  <span className="text-[10px] font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                    {item.status}
                  </span>
                  <Link href={`/teacher/ai/history`}>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-primary-500 hover:text-primary-600">
                      Open Draft
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
