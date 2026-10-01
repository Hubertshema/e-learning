'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentResultsPage() {
  const router = useRouter();

  useEffect(() => {
    // Performance Reports & Results consolidated into Progress Tracking
    router.replace('/student/progress');
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center space-y-2">
        <div className="h-6 w-6 border-2 border-[#006EF3] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Redirecting to Progress Tracking...</p>
      </div>
    </div>
  );
}
