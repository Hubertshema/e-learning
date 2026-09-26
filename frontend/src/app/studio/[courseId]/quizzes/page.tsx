'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { HelpCircle, Plus, Construction, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function StudioQuizzesPage() {
  const { courseId } = useParams() as { courseId: string };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <HelpCircle className="h-5 w-5 text-[#315b36]" />
          <h1 className="text-2xl font-black text-slate-900">Quizzes</h1>
        </div>
        <p className="text-xs text-slate-500">Create assessments and quizzes to test student knowledge</p>
      </div>

      {/* Coming Soon Card */}
      <Card className="border-dashed border-[#c8dfc8] bg-[#f8fbf8] p-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f2e8] text-[#315b36]">
          <Construction className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Quiz Builder Coming Soon</h3>
        <p className="text-xs text-slate-400 max-w-xs mx-auto mt-2 mb-6 leading-relaxed">
          The quiz builder is under development. In the meantime, you can add interactive sections directly inside each lesson.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href={`/studio/${courseId}`}>
            <Button variant="gradient" size="sm" className="text-xs font-bold">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Back to Curriculum
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
