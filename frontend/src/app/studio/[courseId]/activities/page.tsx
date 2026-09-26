'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Activity, Plus, Layers, Sparkles, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function StudioActivitiesPage() {
  const { courseId } = useParams() as { courseId: string };

  const activityTypes = [
    { title: 'Interactive Dialogue', desc: 'Real-time conversational role-playing & audio recordings', badge: 'Speaking' },
    { title: 'Fill-in-the-Blanks', desc: 'Contextual sentence completion and grammar exercises', badge: 'Grammar' },
    { title: 'Listening Comprehension', desc: 'Audio clips with follow-up multiple choice verification', badge: 'Listening' },
    { title: 'Reading Passage Analysis', desc: 'Text comprehension with vocabulary annotations', badge: 'Reading' },
  ];

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Activity className="h-5 w-5 text-[#315b36]" />
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Interactive Activities</h1>
        </div>
        <p className="text-xs text-slate-500">
          Design immersive, CEFR-aligned learning activities embedded directly within your lessons
        </p>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {activityTypes.map((act) => (
          <Card key={act.title} className="p-5 border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#e8f2e8] text-[#315b36]">
                {act.badge}
              </span>
              <Sparkles className="h-4 w-4 text-[#315b36]" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{act.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{act.desc}</p>
          </Card>
        ))}
      </div>

      {/* Call to action card */}
      <Card className="border border-[#c8dfc8] bg-[#f8fbf8] dark:bg-slate-900/60 p-8 text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f2e8] text-[#315b36]">
          <Layers className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Activities are attached to Curriculum Lessons
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          To create or configure activities, open any lesson inside the Curriculum Builder. You can add video lectures, reading sections, vocabulary blocks, and homework activities.
        </p>
        <div className="pt-2">
          <Link href={`/studio/${courseId}`}>
            <Button variant="gradient" size="sm" className="font-bold text-xs">
              <Layers className="h-3.5 w-3.5 mr-1.5" />
              Open Curriculum Builder
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
