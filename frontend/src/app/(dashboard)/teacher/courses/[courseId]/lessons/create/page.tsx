'use client';

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { LessonFormStudio } from '../lesson-form-studio';

export default function TeacherCreateLessonPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const courseId = params.courseId as string;
  const initialUnitId = searchParams.get('unitId') || '';

  return (
    <LessonFormStudio
      courseId={courseId}
      initialUnitId={initialUnitId}
      mode="create"
    />
  );
}
