'use client';

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { LessonBuilder } from '@/components/lesson-builder/lesson-builder';

export default function StudioCreateLessonPage() {
  const { courseId } = useParams() as { courseId: string };
  const searchParams = useSearchParams();
  const unitId = searchParams.get('unitId') || undefined;

  return (
    <LessonBuilder
      courseId={courseId}
      initialUnitId={unitId}
      mode="create"
      backHref={`/studio/${courseId}`}
    />
  );
}
