'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentQuizzesPage() {
  const router = useRouter();

  useEffect(() => {
    // Quizzes & Tests have been decommissioned and consolidated into interactive lesson modules
    router.replace('/student/my-courses');
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center space-y-2">
        <div className="h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Redirecting to My Learning...</p>
      </div>
    </div>
  );
}
