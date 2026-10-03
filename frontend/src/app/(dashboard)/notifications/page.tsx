'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export default function NotificationsRedirectPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (user.role === 'SUPERADMIN') {
      router.replace('/superadmin/notifications');
    } else if (user.role === 'TEACHER') {
      router.replace('/teacher/notifications');
    } else {
      router.replace('/student/notifications');
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6 text-center text-slate-500">
      <div className="space-y-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent mx-auto" />
        <p className="text-xs">Loading notifications center...</p>
      </div>
    </div>
  );
}
