'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentCalendarPage() {
  const router = useRouter();

  useEffect(() => {
    // Calendar decommissioned; schedule and next lesson are managed from Dashboard
    router.replace('/student');
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center space-y-2">
        <div className="h-6 w-6 border-2 border-[#006EF3] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Redirecting to Dashboard...</p>
      </div>
    </div>
  );
}
