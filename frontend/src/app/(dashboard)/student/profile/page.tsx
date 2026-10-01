'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/student/settings');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">
          Redirecting to Student Settings & Profile...
        </p>
      </div>
    </div>
  );
}
