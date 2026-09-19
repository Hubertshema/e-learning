'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Users,
  ArrowLeft,
  Calendar,
  BookOpen,
  Copy,
  CheckCircle2,
  Clock,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface ClassData {
  id: string;
  name: string;
  code: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  maxStudents: number;
  course: {
    id: string;
    title: string;
    level: string;
  };
  enrollments: Array<{
    id: string;
    enrolledAt: string;
    status: string;
    student: {
      id: string;
      user: {
        firstName: string;
        lastName: string;
        email: string;
      };
    };
  }>;
}

export default function TeacherClassDetailPage() {
  const params = useParams();
  const classId = params.classId as string;

  const [cls, setCls] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchClass = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<ClassData>(`/teacher/classes/${classId}`);
        if (res) {
          setCls(res);
        }
      } catch (err) {
        console.error('Failed to load class details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClass();
  }, [classId]);

  const handleCopyCode = () => {
    if (!cls) return;
    navigator.clipboard.writeText(cls.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-100 rounded animate-pulse" />
        <Card className="h-64 animate-pulse bg-slate-100" />
      </div>
    );
  }

  if (!cls) {
    return (
      <Card className="p-12 text-center space-y-3">
        <p className="text-xs text-slate-500">Cohort class not found.</p>
        <Link href="/teacher/classes">
          <Button variant="outline" size="sm">Back to Classes</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/teacher/classes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">{cls.name}</h1>
            <Badge variant="primary">{cls.course.level}</Badge>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <BookOpen className="h-3.5 w-3.5 text-primary-500" /> {cls.course.title}
          </p>
        </div>
      </div>

      {/* Cohort Invite Card */}
      <Card className="p-6 bg-gradient-to-r from-primary-900 to-indigo-900 text-white space-y-3 border-none shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-primary-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-400" /> Official Cohort Enrollment Code
            </p>
            <h2 className="text-2xl font-black font-mono tracking-widest text-white">
              {cls.code}
            </h2>
            <p className="text-xs text-primary-200">
              Share this invitation code with students for automatic assignment to this cohort upon payment verification.
            </p>
          </div>

          <Button
            variant="outline"
            className="bg-white/10 text-white border-white/20 hover:bg-white/20 shrink-0"
            onClick={handleCopyCode}
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-400" /> Copied to Clipboard
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1.5" /> Copy Invite Code
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Roster & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 text-center space-y-2">
          <p className="text-xs text-slate-400 font-medium">Enrolled Students</p>
          <p className="text-3xl font-black text-primary-600">
            {cls.enrollments?.length || 0} / {cls.maxStudents}
          </p>
          <p className="text-[11px] text-slate-400">Class capacity</p>
        </Card>

        <Card className="p-5 text-center space-y-2">
          <p className="text-xs text-slate-400 font-medium">Schedule Period</p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {cls.startDate ? new Date(cls.startDate).toLocaleDateString() : 'Immediate'} –{' '}
            {cls.endDate ? new Date(cls.endDate).toLocaleDateString() : 'Ongoing'}
          </p>
          <p className="text-[11px] text-slate-400">Active cohort duration</p>
        </Card>

        <Card className="p-5 flex flex-col justify-center gap-2">
          <Link href={`/teacher/attendance?classId=${cls.id}`} className="w-full">
            <Button variant="outline" size="sm" className="w-full text-xs">
              <ClipboardList className="h-3.5 w-3.5 mr-1" /> Mark Session Attendance
            </Button>
          </Link>
          <Link href={`/teacher/assignments/create?classId=${cls.id}`} className="w-full">
            <Button variant="gradient" size="sm" className="w-full text-xs">
              Assign Cohort Homework
            </Button>
          </Link>
        </Card>
      </div>

      {/* Student Roster Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Student Roster</CardTitle>
          <CardDescription>
            Students enrolled and currently attending this live teaching cohort.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!cls.enrollments || cls.enrollments.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No students enrolled in this cohort yet. Share code <strong>{cls.code}</strong> to get started.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th className="p-3 font-semibold">Student Name</th>
                    <th className="p-3 font-semibold">Email</th>
                    <th className="p-3 font-semibold">Enrolled On</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {cls.enrollments.map((enr) => (
                    <tr key={enr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {enr.student.user.firstName} {enr.student.user.lastName}
                      </td>
                      <td className="p-3 text-slate-400">{enr.student.user.email}</td>
                      <td className="p-3 text-slate-500">
                        {new Date(enr.enrolledAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <Badge variant="success" className="text-[10px]">
                          {enr.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Link href={`/teacher/students/${enr.student.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs">
                            View Portfolio
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
