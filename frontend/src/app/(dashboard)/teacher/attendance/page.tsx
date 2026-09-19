'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CalendarCheck,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  AlertCircle,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useCachedData, clientCache } from '@/lib/cache';
import { apiClient } from '@/lib/api-client';

interface ClassItem {
  id: string;
  name: string;
  schedule: string;
  enrollments: Array<{
    id: string;
    student: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
}

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export default function TeacherAttendancePage() {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [studentStatus, setStudentStatus] = useState<Record<string, AttendanceStatus>>({});
  const [studentRemarks, setStudentRemarks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const initializeStatuses = (cls: ClassItem) => {
    const initStatus: Record<string, AttendanceStatus> = {};
    const initRemarks: Record<string, string> = {};
    cls.enrollments?.forEach((enr) => {
      initStatus[enr.student.id] = 'PRESENT';
      initRemarks[enr.student.id] = '';
    });
    setStudentStatus(initStatus);
    setStudentRemarks(initRemarks);
  };

  const {
    data: rawClasses,
    loading,
    refresh: fetchClasses
  } = useCachedData<ClassItem[]>(
    'teacher_attendance_classes',
    async () => {
      const res = await apiClient.get<ClassItem[]>('/teacher/classes');
      return Array.isArray(res) ? res : (res as any)?.data || (res as any)?.classes || [];
    },
    {
      ttl: 120_000,
      initialData: [],
      onSuccess: (classList) => {
        if (classList.length > 0 && !selectedClassId) {
          setSelectedClassId(classList[0].id);
          initializeStatuses(classList[0]);
        }
      }
    }
  );

  const classes = rawClasses || [];

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    const cls = classes.find((c) => c.id === classId);
    if (cls) {
      initializeStatuses(cls);
    }
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudentStatus((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleRemarkChange = (studentId: string, remark: string) => {
    setStudentRemarks((prev) => ({ ...prev, [studentId]: remark }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const currentClass = classes.find((c) => c.id === selectedClassId);
    if (!currentClass) return;
    const updated: Record<string, AttendanceStatus> = {};
    currentClass.enrollments?.forEach((enr) => {
      updated[enr.student.id] = status;
    });
    setStudentStatus(updated);
  };

  const handleSaveAttendance = async () => {
    const currentClass = classes.find((c) => c.id === selectedClassId);
    if (!currentClass || !currentClass.enrollments?.length) return;

    try {
      setSaving(true);
      const records = currentClass.enrollments.map((enr) => ({
        studentId: enr.student.id,
        status: studentStatus[enr.student.id] || 'PRESENT',
        remarks: studentRemarks[enr.student.id] || undefined,
      }));

      await apiClient.post('/teacher/attendance', {
        classId: selectedClassId,
        date: selectedDate,
        records,
      });

      clientCache.invalidate('teacher_');
      setFeedback({
        type: 'success',
        message: `Attendance for ${currentClass.name} on ${selectedDate} recorded successfully!`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save attendance' });
    } finally {
      setSaving(false);
    }
  };

  const currentClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">Daily Attendance Register</Badge>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Class Attendance Register
          </h1>
          <p className="text-xs text-slate-500">
            Track student presence, punctuality, and participation across live class sessions.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl p-4 text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="underline text-[11px]">Dismiss</button>
        </div>
      )}

      {/* Control Bar: Class selector + Date Picker */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Select Cohort</label>
              <select
                value={selectedClassId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Session Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
              >
              </input>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Quick set:</span>
            <Button size="sm" variant="outline" onClick={() => handleMarkAll('PRESENT')} className="text-xs">
              All Present
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleMarkAll('ABSENT')} className="text-xs text-rose-600">
              All Absent
            </Button>
          </div>
        </div>
      </Card>

      {/* Attendance Sheet */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary-600" />
                Roster for {currentClass?.name || 'Selected Cohort'} ({currentClass?.enrollments?.length || 0} Students)
              </CardTitle>
              <CardDescription className="text-xs">
                Select status for each student and add optional participation remarks
              </CardDescription>
            </div>
            <Button
              variant="gradient"
              size="sm"
              disabled={saving || !currentClass?.enrollments?.length}
              onClick={handleSaveAttendance}
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {saving ? 'Saving...' : 'Save Attendance Register'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading roster...</div>
          ) : currentClass?.enrollments && currentClass.enrollments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
                    <th className="pb-3 font-semibold">Student</th>
                    <th className="pb-3 font-semibold">Attendance Status</th>
                    <th className="pb-3 font-semibold">Session Notes & Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currentClass.enrollments.map((enr) => {
                    const status = studentStatus[enr.student.id] || 'PRESENT';
                    return (
                      <tr key={enr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-bold text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {enr.student.firstName[0]}{enr.student.lastName[0]}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {enr.student.firstName} {enr.student.lastName}
                              </p>
                              <p className="text-[11px] text-slate-500">{enr.student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1.5">
                            {(['PRESENT', 'LATE', 'EXCUSED', 'ABSENT'] as AttendanceStatus[]).map((st) => (
                              <button
                                key={st}
                                onClick={() => handleStatusChange(enr.student.id, st)}
                                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                                  status === st
                                    ? st === 'PRESENT'
                                      ? 'bg-emerald-600 text-white'
                                      : st === 'LATE'
                                      ? 'bg-amber-500 text-white'
                                      : st === 'EXCUSED'
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-rose-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="py-3">
                          <input
                            type="text"
                            placeholder="e.g. Active participation in speaking exercise"
                            value={studentRemarks[enr.student.id] || ''}
                            onChange={(e) => handleRemarkChange(enr.student.id, e.target.value)}
                            className="w-full max-w-sm rounded-lg border border-slate-200 px-3 py-1 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No students enrolled in this cohort yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
