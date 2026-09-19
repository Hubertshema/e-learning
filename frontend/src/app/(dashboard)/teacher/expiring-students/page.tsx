'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Send,
  ArrowRight,
  Filter,
  UserCheck
} from 'lucide-react';
import { useCachedData, clientCache } from '@/lib/cache';
import { apiClient } from '@/lib/api-client';

interface ExpiringStudent {
  id: string;
  expiresAt: string;
  status: string;
  student: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  course: {
    id: string;
    title: string;
    level: string;
  };
  class?: {
    name: string;
  };
}

export default function TeacherExpiringStudentsPage() {
  const [filterDays, setFilterDays] = useState(7);
  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    data: rawStudents,
    loading,
    refresh: fetchExpiring
  } = useCachedData<ExpiringStudent[]>(
    `teacher_expiring_students_${filterDays}`,
    async () => {
      const res = await apiClient.get<ExpiringStudent[]>(`/teacher/expiring-students?days=${filterDays}`);
      return Array.isArray(res) ? res : (res as any)?.data || [];
    },
    { ttl: 120_000, initialData: [] }
  );

  const students = rawStudents || [];

  const handleExtend = async (enrollmentId: string) => {
    try {
      setExtendingId(enrollmentId);
      await apiClient.post(`/teacher/enrollments/${enrollmentId}/extend`, {
        extensionDays: 30,
        reason: 'Instructor proactive extension from Expiring Watchlist',
      });
      setSuccessMsg('Access successfully extended by 30 days!');
      clientCache.invalidate('teacher_');
      fetchExpiring();
    } catch (err) {
      alert('Failed to extend enrollment.');
    } finally {
      setExtendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="h-6 w-6 text-amber-500" /> Expiring Enrollments Watchlist
          </h1>
          <p className="text-xs text-slate-500">
            Monitor students whose course access is nearing expiration and grant grace period extensions.
          </p>
        </div>

        {/* Days Window Switcher */}
        <div className="flex gap-2">
          {[3, 7, 14, 30].map((days) => (
            <Button
              key={days}
              variant={filterDays === days ? 'gradient' : 'outline'}
              size="sm"
              onClick={() => setFilterDays(days)}
              className="text-xs font-bold"
            >
              Next {days} Days
            </Button>
          ))}
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <Card className="p-8 animate-pulse h-48 bg-slate-100" />
      ) : students.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            All Student Enrollments Are Active
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No student access windows are expiring in the selected next {filterDays} days.
          </p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="p-3.5 font-semibold">Student</th>
                  <th className="p-3.5 font-semibold">Course & Level</th>
                  <th className="p-3.5 font-semibold">Cohort Class</th>
                  <th className="p-3.5 font-semibold">Expiration Date</th>
                  <th className="p-3.5 font-semibold">Status</th>
                  <th className="p-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map((item) => {
                  const daysLeft = Math.ceil(
                    (new Date(item.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        {item.student.user.firstName} {item.student.user.lastName}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {item.student.user.email}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.course.title}
                        </span>
                        <Badge variant="outline" className="ml-2 text-[10px]">
                          {item.course.level}
                        </Badge>
                      </td>

                      <td className="p-3.5 text-slate-600 dark:text-slate-300">
                        {item.class?.name || 'Self-Paced'}
                      </td>

                      <td className="p-3.5">
                        <span className="font-bold text-amber-600">
                          {new Date(item.expiresAt).toLocaleDateString()}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {daysLeft <= 0 ? 'Expired today' : `in ${daysLeft} days`}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <Badge variant="warning" className="text-[10px]">
                          EXPIRING SOON
                        </Badge>
                      </td>

                      <td className="p-3.5 text-right space-x-2">
                        <Link href={`/teacher/students/${item.student.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs">
                            View Portfolio
                          </Button>
                        </Link>

                        <Button
                          variant="gradient"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleExtend(item.id)}
                          isLoading={extendingId === item.id}
                        >
                          +30 Days Extension
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
