'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function StudentCourseDetailRedirect() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.courseId as string;

  useEffect(() => {
    if (courseId) {
      router.replace(`/student/learn/${courseId}`);
    } else {
      router.replace('/student/my-courses');
    }
  }, [router, courseId]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6 text-center text-slate-500">
      <div className="space-y-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent mx-auto" />
        <p className="text-xs">Loading course curriculum...</p>
      </div>
    </div>
  );
}
