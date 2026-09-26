'use client';
import { useParams, useSearchParams } from 'next/navigation';
import { LessonFormStudio } from '@/app/(dashboard)/teacher/courses/[courseId]/lessons/lesson-form-studio';

export default function StudioCreateLessonPage() {
  const { courseId } = useParams() as { courseId: string };
  const searchParams = useSearchParams();
  const unitId = searchParams.get('unitId') || undefined;
  return (
    <div className="max-w-5xl">
      <LessonFormStudio
        mode="create"
        courseId={courseId}
        initialUnitId={unitId}
        backHref={`/studio/${courseId}`}
      />
    </div>
  );
}
