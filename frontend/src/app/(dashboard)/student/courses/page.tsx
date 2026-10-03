'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentCoursesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/student/my-courses');
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6 text-center text-slate-500">
      <div className="space-y-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent mx-auto" />
        <p className="text-xs">Redirecting to your courses space...</p>
      </div>
    </div>
  );
}
