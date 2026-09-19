'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Users,
  CheckCircle2,
  Clock,
  Ban,
  Search,
  BookOpen,
  Filter
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface EnrollmentItem {
  id: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'PENDING';
  enrolledAt: string;
  expiresAt?: string;
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

export default function TeacherEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<EnrollmentItem[]>('/teacher/enrollments');
      if (res) {
        setEnrollments(res);
      }
    } catch (err) {
      console.error('Failed to load enrollments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const handleSuspend = async (enrollmentId: string) => {
    const reason = prompt('Please enter reason for temporary course access suspension:');
    if (!reason) return;

    try {
      await apiClient.post(`/teacher/enrollments/${enrollmentId}/suspend`, { reason });
      setEnrollments((prev) =>
        prev.map((e) => (e.id === enrollmentId ? { ...e, status: 'SUSPENDED' } : e))
      );
    } catch (err) {
      alert('Failed to suspend enrollment.');
    }
  };

  const handleExtend = async (enrollmentId: string) => {
    try {
      await apiClient.post(`/teacher/enrollments/${enrollmentId}/extend`, {
        extensionDays: 30,
        reason: 'Instructor grant from enrollments manager',
      });
      fetchEnrollments();
    } catch (err) {
      alert('Failed to extend enrollment.');
    }
  };

  const filtered = enrollments.filter((e) => {
    const matchesStatus = filterStatus === 'ALL' || e.status === filterStatus;
    const matchesSearch =
      e.student.user.firstName.toLowerCase().includes(search.toLowerCase()) ||
      e.student.user.lastName.toLowerCase().includes(search.toLowerCase()) ||
      e.course.title.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Student Enrollment Lifecycle
          </h1>
          <p className="text-xs text-slate-500">
            Manage active student access licenses, extension grants, and temporary suspensions.
          </p>
        </div>

        <div className="flex gap-2">
          {['ALL', 'ACTIVE', 'SUSPENDED', 'EXPIRED'].map((st) => (
            <Button
              key={st}
              variant={filterStatus === st ? 'gradient' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(st)}
              className="text-xs font-bold"
            >
              {st}
            </Button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by student name or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </Card>

      {/* Table */}
      {loading ? (
        <Card className="p-8 animate-pulse h-48 bg-slate-100" />
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <p className="text-xs text-slate-500">No enrollments match your filter criteria.</p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="p-3.5 font-semibold">Student</th>
                  <th className="p-3.5 font-semibold">Course & Level</th>
                  <th className="p-3.5 font-semibold">Enrolled On</th>
                  <th className="p-3.5 font-semibold">Expires At</th>
                  <th className="p-3.5 font-semibold">Status</th>
                  <th className="p-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((item) => (
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

                    <td className="p-3.5 text-slate-500">
                      {new Date(item.enrolledAt).toLocaleDateString()}
                    </td>

                    <td className="p-3.5 text-slate-500">
                      {item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : 'Lifetime Access'}
                    </td>

                    <td className="p-3.5">
                      <Badge
                        variant={
                          item.status === 'ACTIVE'
                            ? 'success'
                            : item.status === 'SUSPENDED'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className="text-[10px]"
                      >
                        {item.status}
                      </Badge>
                    </td>

                    <td className="p-3.5 text-right space-x-2">
                      <Link href={`/teacher/students/${item.student.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs">
                          Portfolio
                        </Button>
                      </Link>

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleExtend(item.id)}
                      >
                        +30 Days
                      </Button>

                      {item.status === 'ACTIVE' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-destructive hover:bg-destructive/10"
                          onClick={() => handleSuspend(item.id)}
                        >
                          Suspend
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
