'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ClipboardList, Plus, Construction, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function StudioAssignmentsPage() {
  const { courseId } = useParams() as { courseId: string };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList className="h-5 w-5 text-[#315b36]" />
          <h1 className="text-2xl font-black text-slate-900">Assignments</h1>
        </div>
        <p className="text-xs text-slate-500">Create and manage course assignments and tasks for students</p>
      </div>

      {/* Coming Soon Card */}
      <Card className="border-dashed border-[#c8dfc8] bg-[#f8fbf8] p-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f2e8] text-[#315b36]">
          <Construction className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Assignments Coming Soon</h3>
        <p className="text-xs text-slate-400 max-w-xs mx-auto mt-2 mb-6 leading-relaxed">
          The assignment builder is being developed. For now, you can manage assignments from the teacher dashboard.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href={`/teacher/assignments`}>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-[#c8dfc8] text-[#315b36] hover:bg-[#f0f8f0] font-semibold"
            >
              Go to Assignments Dashboard
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
          <Link href={`/studio/${courseId}`}>
            <Button variant="gradient" size="sm" className="text-xs font-bold">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Lesson Instead
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
