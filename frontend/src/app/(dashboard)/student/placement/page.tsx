'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentPlacementPage() {
  const router = useRouter();

  useEffect(() => {
    // Placement decommissioned in favor of direct CEFR diagnostics
    router.replace('/student/progress');
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center space-y-2">
        <div className="h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Redirecting to Progress Tracking...</p>
      </div>
    </div>
  );
}
