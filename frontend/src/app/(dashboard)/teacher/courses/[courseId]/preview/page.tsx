'use client';

import { useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';

export default function TeacherCoursePreviewRedirectPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const targetLessonId = searchParams.get('lessonId');

  useEffect(() => {
    if (courseId) {
      const query = targetLessonId ? `?lessonId=${encodeURIComponent(targetLessonId)}` : '';
      router.replace(`/studio/${courseId}/preview${query}`);
    }
  }, [courseId, targetLessonId, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#f8faf8]">
      <div className="flex items-center gap-3 text-xs font-bold text-[#315b36]">
        <span className="h-5 w-5 rounded-full border-2 border-[#315b36] border-t-transparent animate-spin" />
        <span>Redirecting to Studio Course Preview...</span>
      </div>
    </div>
  );
}
