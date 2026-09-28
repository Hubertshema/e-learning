'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function TeacherExpiringStudentsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/teacher/students?tab=expiring');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
      <Loader2 className="h-6 w-6 animate-spin text-rose-600" />
      <p className="text-xs text-slate-500 font-medium">Redirecting to Students Directory & Expiring Watchlist...</p>
    </div>
  );
}
