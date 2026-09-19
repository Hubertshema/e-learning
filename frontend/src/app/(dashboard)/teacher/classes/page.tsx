'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FolderTree,
  Plus,
  Users,
  Calendar as CalendarIcon,
  Clock,
  Video,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useCachedData, clientCache } from '@/lib/cache';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar as BuiltCalendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface ClassItem {
  id: string;
  name: string;
  schedule: string;
  meetingLink?: string;
  capacity: number;
  startDate?: string;
  endDate?: string;
  course?: {
    title: string;
    level: string;
  };
  enrollments: Array<{
    id: string;
    student: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
  _count?: {
    enrollments: number;
  };
}

interface CourseOption {
  id: string;
  title: string;
  level: string;
}

export default function TeacherClassesPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('19:30');
  const [cohortStartDate, setCohortStartDate] = useState<Date>(new Date());
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);

  const [form, setForm] = useState({
    name: '',
    courseId: '',
    capacity: 25,
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.length > 1
          ? prev.filter((d) => d !== day)
          : prev
        : [...prev, day]
    );
  };

  const computeScheduleString = () => {
    const daysStr = selectedDays.length > 0 ? selectedDays.join(', ') : 'Flexible';
    const dateFormatted = cohortStartDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${daysStr} from ${startTime} to ${endTime} (Starts ${dateFormatted})`;
  };

  const {
    data: classesData,
    loading,
    refresh: fetchData
  } = useCachedData<{ classes: ClassItem[]; courses: CourseOption[] }>(
    'teacher_classes_list',
    async () => {
      const [classRes, courseRes] = await Promise.all([
        apiClient.get<ClassItem[]>('/teacher/classes'),
        apiClient.get<CourseOption[]>('/teacher/courses')
      ]);
      const classList: ClassItem[] = Array.isArray((classRes as any)?.data)
        ? (classRes as any).data
        : Array.isArray(classRes)
        ? (classRes as any)
        : [];
      const courseList: CourseOption[] = Array.isArray((courseRes as any)?.data)
        ? (courseRes as any).data
        : Array.isArray(courseRes)
        ? (courseRes as any)
        : [];

      return {
        classes: classList,
        courses: courseList,
      };
    },
    {
      ttl: 120_000,
      initialData: { classes: [], courses: [] },
      onSuccess: (data) => {
        if (data.classes.length > 0 && !selectedClass) {
          setSelectedClass(data.classes[0]);
        }
        if (data.courses.length > 0 && !form.courseId) {
          setForm(prev => ({ ...prev, courseId: data.courses[0].id }));
        }
      }
    }
  );

  const classes = classesData?.classes || [];
  const courses = classesData?.courses || [];

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    try {
      setSaving(true);
      const scheduleString = computeScheduleString();
      const payload: any = {
        name: form.name.trim(),
        courseId: form.courseId,
        schedule: scheduleString,
        capacity: Number(form.capacity) || 25,
        maxStudents: Number(form.capacity) || 25,
        startDate: cohortStartDate.toISOString(),
      };

      await apiClient.post('/teacher/classes', payload);
      setFeedback({ type: 'success', message: 'Class cohort created successfully!' });
      setShowModal(false);
      setModalError(null);
      setForm({
        name: '',
        courseId: courses[0]?.id || '',
        capacity: 25,
      });
      setSelectedDays(['Mon', 'Wed', 'Fri']);
      setStartTime('18:00');
      setEndTime('19:30');
      setCohortStartDate(new Date());
      setShowCalendarPicker(false);
      clientCache.invalidate('teacher_');
      await fetchData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create class cohort. Please verify your inputs.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">Cohort & Live Class Hub</Badge>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Class Cohorts & Schedules
          </h1>
          <p className="text-xs text-slate-500">
            Organize student cohorts, set schedules, and inspect class rosters.
          </p>
        </div>
        <Button
          variant="gradient"
          size="sm"
          onClick={() => {
            setModalError(null);
            setShowModal(true);
          }}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Create New Class Cohort
        </Button>
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Class List */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Active Cohorts ({classes.length})
          </h2>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </Card>
              ))}
            </div>
          ) : classes.length > 0 ? (
            <div className="space-y-3">
              {classes.map((cls) => {
                const isSelected = selectedClass?.id === cls.id;
                const studentCount = cls.enrollments?.length || cls._count?.enrollments || 0;
                return (
                  <Card
                    key={cls.id}
                    onClick={() => setSelectedClass(cls)}
                    className={`cursor-pointer p-4 transition-all ${
                      isSelected
                        ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-md dark:border-primary-400'
                        : 'hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {cls.course && <Badge variant="indigo">{cls.course.level}</Badge>}
                          <span className="text-[10px] text-slate-400">Cap: {cls.capacity}</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{cls.name}</h3>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {cls.schedule}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {studentCount} Students
                      </Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <FolderTree className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No cohorts yet</p>
              <p className="text-[11px] text-slate-500 mb-3">Create your first class group for live teaching.</p>
              <Button size="sm" variant="gradient" onClick={() => setShowModal(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Create Cohort
              </Button>
            </Card>
          )}
        </div>

        {/* Right Column (2 cols): Selected Class Details & Student Roster */}
        <div className="lg:col-span-2 space-y-6">
          {selectedClass ? (
            <>
              <Card className="p-5 border-l-4 border-l-primary-600">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="indigo">{selectedClass.course?.level || 'English'}</Badge>
                      <span className="text-xs font-bold text-slate-500">{selectedClass.course?.title}</span>
                    </div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                      {selectedClass.name}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {selectedClass.schedule}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        {selectedClass.enrollments?.length || 0} / {selectedClass.capacity} Students Enrolled
                      </span>
                    </div>
                  </div>

                  {selectedClass.meetingLink && (
                    <a href={selectedClass.meetingLink} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="default" className="bg-indigo-600 hover:bg-indigo-700">
                        <Video className="mr-1.5 h-3.5 w-3.5" />
                        Join Live Room
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                    </a>
                  )}
                </div>
              </Card>

              {/* Enrolled Students Roster */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary-600" />
                    Enrolled Students Roster
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Students currently active in this cohort
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedClass.enrollments && selectedClass.enrollments.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedClass.enrollments.map((enr, i) => (
                        <div key={enr.id || i} className="py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-bold text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {enr.student.firstName[0]}{enr.student.lastName[0]}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">
                                {enr.student.firstName} {enr.student.lastName}
                              </p>
                              <p className="text-[11px] text-slate-500">{enr.student.email}</p>
                            </div>
                          </div>
                          <Badge variant="success">Active</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No students enrolled in this cohort yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="p-12 text-center text-slate-400">
              Select or create a class cohort on the left.
            </Card>
          )}
        </div>
      </div>

      {/* Modal: Create Class */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader>
              <CardTitle className="text-base">Create Live Class Cohort</CardTitle>
              <CardDescription className="text-xs">
                Link a cohort to a curriculum course and set its live schedule.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {modalError && (
                <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleCreateClass} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cohort Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Evening Fast-Track Batch 04"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Curriculum Course</label>
                  <select
                    value={form.courseId}
                    onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>[{c.level}] {c.title}</option>
                    ))}
                  </select>
                </div>

                {/* Day Chooser, Live Time and Built Calendar */}
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Class Days & Live Schedule
                    </label>
                    <span className="text-[11px] font-semibold text-[#315b36] dark:text-emerald-400">
                      {selectedDays.length} day{selectedDays.length === 1 ? '' : 's'} selected
                    </span>
                  </div>

                  {/* Day Chooser */}
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_DAYS.map((d) => {
                      const isDaySelected = selectedDays.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDay(d)}
                          className={cn(
                            'rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all',
                            isDaySelected
                              ? 'bg-[#315b36] text-white shadow-sm ring-1 ring-[#315b36]'
                              : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'
                          )}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>

                  {/* Time Range */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">End Time</label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                      />
                    </div>
                  </div>

                  {/* Start Date Chooser using Built Custom Calendar */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        Cohort Start Date
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowCalendarPicker(!showCalendarPicker)}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-[#315b36] hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-emerald-400"
                      >
                        <CalendarIcon className="h-3.5 w-3.5" />
                        <span>
                          {cohortStartDate.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        {showCalendarPicker ? (
                          <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </button>
                    </div>

                    {showCalendarPicker && (
                      <div className="mt-3 flex justify-center">
                        <BuiltCalendar
                          className="w-full border shadow-md"
                          selectedDate={cohortStartDate}
                          onSelectDate={(d) => {
                            setCohortStartDate(d);
                            setShowCalendarPicker(false);
                          }}
                          minDate={new Date()}
                        />
                      </div>
                    )}
                  </div>

                  {/* Computed Schedule Preview */}
                  <div className="rounded-lg bg-white p-2.5 border border-slate-200/80 text-[11px] text-slate-600 dark:bg-slate-800/80 dark:border-slate-800 dark:text-slate-300">
                    <span className="font-bold text-slate-800 dark:text-white">Scheduled: </span>
                    <span>{computeScheduleString()}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Max Student Capacity</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 20 })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowModal(false);
                      setModalError(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="gradient" size="sm" disabled={saving}>
                    {saving ? 'Creating...' : 'Create Cohort'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
