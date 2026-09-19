'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { LessonFormStudio } from '../../lesson-form-studio';

export default function TeacherEditLessonPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;

  return (
    <LessonFormStudio
      courseId={courseId}
      lessonId={lessonId}
      mode="edit"
    />
  );
}
