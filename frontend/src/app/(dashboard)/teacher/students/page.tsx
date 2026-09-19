'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Search,
  BookOpen,
  TrendingUp,
  Calendar,
  Mail,
  GraduationCap,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useCachedData } from '@/lib/cache';
import { apiClient } from '@/lib/api-client';
import { TableSkeleton } from '@/components/ui/table-skeleton';

interface EnrolledStudent {
  id: string;
  userId: string;
  courseId: string;
  classId?: string;
  status: string;
  enrolledAt: string;
  expiresAt?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    studentProfile?: {
      currentLevel: string;
      targetLevel: string;
    };
  };
  course: {
    id: string;
    title: string;
    level: string;
  };
  class?: {
    id: string;
    name: string;
  };
}

export default function TeacherStudentsPage() {
  const [search, setSearch] = useState('');

  const {
    data: rawStudents,
    loading,
    refresh: fetchStudents
  } = useCachedData<EnrolledStudent[]>(
    `teacher_students_${search}`,
    async () => {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await apiClient.get<{ students: EnrolledStudent[] }>(`/teacher/students${query}`);
      const studentList: EnrolledStudent[] =
        (res as any)?.students ||
        (res as any)?.data?.students ||
        (Array.isArray(res) ? res : []);
      return studentList;
    },
    { ttl: 120_000, initialData: [] }
  );

  const students = rawStudents || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">Student Directory</Badge>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Enrolled Students
          </h1>
          <p className="text-xs text-slate-500">
            View active learners across your curriculum, their CEFR levels, and skill mastery profiles.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
          />
        </div>
      </div>

      {/* Directory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary-600" />
            Active Learners ({students.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Inspect enrolled course, assigned cohort, and 7-skill learning diagnostics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
                    <th className="pb-3 font-semibold">Student</th>
                    <th className="pb-3 font-semibold">Course & Level</th>
                    <th className="pb-3 font-semibold">Assigned Cohort</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Enrolled Date</th>
                    <th className="pb-3 font-semibold text-right">Analytics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {students.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-bold text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {st.user.firstName[0]}{st.user.lastName[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {st.user.firstName} {st.user.lastName}
                            </p>
                            <p className="text-[11px] text-slate-500">{st.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <Badge variant="indigo">{st.course.level}</Badge>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium mt-0.5">
                          {st.course.title}
                        </p>
                      </td>
                      <td className="py-3.5">
                        {st.class ? (
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {st.class.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Self-paced</span>
                        )}
                      </td>
                      <td className="py-3.5">
                        {st.status === 'ACTIVE' ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="outline">{st.status}</Badge>
                        )}
                      </td>
                      <td className="py-3.5 text-slate-500 text-[11px]">
                        {new Date(st.enrolledAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 text-right">
                        <Link href={`/teacher/progress?studentId=${st.user.id}`}>
                          <Button size="sm" variant="outline" className="text-xs">
                            <TrendingUp className="mr-1 h-3.5 w-3.5 text-primary-600" />
                            7-Skill Report
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No students found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
