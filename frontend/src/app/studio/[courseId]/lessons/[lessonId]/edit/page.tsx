'use client';
import { useParams } from 'next/navigation';
import { LessonFormStudio } from '@/app/(dashboard)/teacher/courses/[courseId]/lessons/lesson-form-studio';

export default function StudioEditLessonPage() {
  const { courseId, lessonId } = useParams() as { courseId: string; lessonId: string };
  return (
    <div className="max-w-5xl">
      <LessonFormStudio
        mode="edit"
        courseId={courseId}
        lessonId={lessonId}
        backHref={`/studio/${courseId}`}
      />
    </div>
  );
}
