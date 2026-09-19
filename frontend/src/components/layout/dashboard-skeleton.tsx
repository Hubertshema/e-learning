'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardContentSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Banner Skeleton */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 dark:bg-slate-900 p-6 sm:p-8 space-y-5 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <Skeleton className="h-5 w-44 rounded-full bg-slate-800" />
            <Skeleton className="h-8 w-72 rounded-xl bg-slate-800" />
            <Skeleton className="h-4 w-full rounded-lg bg-slate-800/80" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-xl bg-slate-800" />
            <Skeleton className="h-9 w-28 rounded-xl bg-slate-800" />
          </div>
        </div>
        <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Skeleton className="h-4 w-full rounded-md bg-slate-800/70" />
          <Skeleton className="h-4 w-full rounded-md bg-slate-800/70" />
          <Skeleton className="h-4 w-full rounded-md bg-slate-800/70" />
          <Skeleton className="h-4 w-full rounded-md bg-slate-800/70" />
        </div>
      </div>

      {/* 4 Metric Cards Skeleton */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-28 bg-slate-200 dark:bg-slate-800" />
              <Skeleton className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="space-y-2 pt-1">
              <Skeleton className="h-8 w-16 bg-slate-200 dark:bg-slate-800" />
              <Skeleton className="h-2.5 w-36 bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-40 bg-slate-200 dark:bg-slate-800" />
              <Skeleton className="h-3 w-56 bg-slate-200 dark:bg-slate-800" />
            </div>
            <Skeleton className="h-8 w-44 rounded-xl bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="space-y-3 pt-2">
            <Skeleton className="h-20 w-full rounded-xl bg-slate-100 dark:bg-slate-800/60" />
            <Skeleton className="h-20 w-full rounded-xl bg-slate-100 dark:bg-slate-800/60" />
            <Skeleton className="h-20 w-full rounded-xl bg-slate-100 dark:bg-slate-800/60" />
          </div>
        </div>

        <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <Skeleton className="h-4 w-36 bg-slate-200 dark:bg-slate-800" />
          <Skeleton className="h-24 w-full rounded-xl bg-slate-100 dark:bg-slate-800/60" />
          <Skeleton className="h-24 w-full rounded-xl bg-slate-100 dark:bg-slate-800/60" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 animate-fade-in">
      {/* 1. Sidebar Skeleton */}
      <aside className="hidden md:flex h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        {/* Brand Header */}
        <div className="p-4 pb-3 shrink-0 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-10 w-10 rounded-2xl bg-primary-500/20" />
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24 bg-slate-200 dark:bg-slate-800" />
              <Skeleton className="h-3 w-12 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
            <Skeleton className="h-2.5 w-28 bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>

        {/* Grouped Nav Section Skeletons (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-3.5 py-3.5 space-y-3 custom-scrollbar">
          {Array.from({ length: 3 }).map((_, sectionIdx) => (
            <div
              key={sectionIdx}
              className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/40 p-2 space-y-2"
            >
              {/* Section Header Skeleton */}
              <div className="flex items-center justify-between px-2 py-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-lg bg-slate-200 dark:bg-slate-800" />
                  <Skeleton className="h-3 w-28 bg-slate-200 dark:bg-slate-800" />
                </div>
                <Skeleton className="h-3.5 w-3.5 rounded bg-slate-200 dark:bg-slate-800" />
              </div>

              {/* Items Skeleton */}
              <div className="space-y-1 pt-1">
                {Array.from({ length: sectionIdx === 0 ? 3 : 2 }).map((_, itemIdx) => (
                  <div key={itemIdx} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl">
                    <Skeleton className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-800" />
                    <Skeleton
                      className="h-3 rounded bg-slate-200 dark:bg-slate-800"
                      style={{ width: `${60 + (itemIdx % 3) * 15}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* 2. Main Content & Navbar Skeleton */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Navbar Header Skeleton */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-4 md:px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-28 bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-4 w-32 bg-slate-200 dark:bg-slate-800" />
          </div>

          <div className="flex items-center gap-3">
            <Skeleton className="hidden md:block h-6 w-32 rounded-full bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-8 w-8 rounded-full bg-primary-500/30" />
              <div className="hidden lg:block space-y-1">
                <Skeleton className="h-3 w-20 bg-slate-200 dark:bg-slate-800" />
                <Skeleton className="h-2 w-28 bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Body Skeleton */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10">
          <DashboardContentSkeleton />
        </main>
      </div>
    </div>
  );
}
