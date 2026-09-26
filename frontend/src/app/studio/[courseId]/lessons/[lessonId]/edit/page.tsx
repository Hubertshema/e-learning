'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { LessonBuilder } from '@/components/lesson-builder/lesson-builder';

export default function StudioEditLessonPage() {
  const { courseId, lessonId } = useParams() as { courseId: string; lessonId: string };

  return (
    <LessonBuilder
      courseId={courseId}
      lessonId={lessonId}
      mode="edit"
      backHref={`/studio/${courseId}`}
    />
  );
}
