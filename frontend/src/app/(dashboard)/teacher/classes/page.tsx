'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FolderTree, Plus, Users, Calendar as CalendarIcon, Clock, Video,
  ExternalLink, CheckCircle2, AlertCircle, BookOpen, ChevronDown,
  ChevronUp, X, UserPlus, Search, GraduationCap, Layers, Edit3, Trash2, UserMinus
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useCachedData, clientCache } from '@/lib/cache';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar as BuiltCalendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_OPTIONS = [
  '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM',
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM',
  '09:00 PM', '09:30 PM', '10:00 PM'
];

interface ClassItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  schedule?: string;
  meetingLink?: string;
  capacity?: number;
  maxStudents?: number;
  startDate?: string;
  endDate?: string;
  course?: { id: string; title: string; level: string; };
  courses?: Array<{ courseId: string; course: { id: string; title: string; level: string; durationDays?: number; }; }>;
  enrollments: Array<{
    id: string;
    student: { id: string; firstName: string; lastName: string; email: string; };
  }>;
  _count?: { enrollments: number; };
}

interface CourseOption {
  id: string;
  title: string;
  level: string;
}

interface StudentOption {
  id: string;
  studentProfileId: string;
  firstName: string;
  lastName: string;
  email: string;
  currentLevel: string;
  subscriptionStatus: string;
}

export default function TeacherClassesPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  // Multi-student selection state (for enroll modal)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [availableStudents, setAvailableStudents] = useState<StudentOption[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Multi-student selection state (for create modal)
  const [createStudentIds, setCreateStudentIds] = useState<string[]>([]);
  const [createStudentSearch, setCreateStudentSearch] = useState('');

  // Multi-course selection for create
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  // Manage courses modal (for existing cohort)
  const [showCoursesModal, setShowCoursesModal] = useState(false);
  const [manageCourseIds, setManageCourseIds] = useState<string[]>([]);
  const [savingCourses, setSavingCourses] = useState(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
  const [startTime, setStartTime] = useState('06:00 PM');
  const [endTime, setEndTime] = useState('07:30 PM');
  const [cohortStartDate, setCohortStartDate] = useState<Date>(new Date());
  const [cohortEndDate, setCohortEndDate] = useState<Date | null>(null);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [showEndCalendarPicker, setShowEndCalendarPicker] = useState(false);

  const [form, setForm] = useState({ name: '', capacity: 25 });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit Cohort Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', capacity: 25, meetingLink: '' });
  const [editSelectedCourseIds, setEditSelectedCourseIds] = useState<string[]>([]);
  const [editSelectedDays, setEditSelectedDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
  const [editStartTime, setEditStartTime] = useState('06:00 PM');
  const [editEndTime, setEditEndTime] = useState('07:30 PM');
  const [editStartDate, setEditStartDate] = useState<Date>(new Date());
  const [editEndDate, setEditEndDate] = useState<Date | null>(null);
  const [showEditCalendarPicker, setShowEditCalendarPicker] = useState(false);
  const [showEditEndCalendarPicker, setShowEditEndCalendarPicker] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Cohort Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCohort, setDeletingCohort] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Remove Student from Cohort States
  const [studentToRemove, setStudentToRemove] = useState<{ studentId: string; name: string } | null>(null);
  const [removingStudent, setRemovingStudent] = useState(false);

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? (prev.length > 1 ? prev.filter(d => d !== day) : prev) : [...prev, day]
    );
  };

  const computeScheduleString = () => {
    const daysStr = selectedDays.length > 0 ? selectedDays.join(', ') : 'Flexible';
    const dateFormatted = cohortStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const endFormatted = cohortEndDate ? ` • Ends ${cohortEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : '';
    return `${daysStr} from ${startTime} to ${endTime} (Starts ${dateFormatted}${endFormatted})`;
  };

  const computeRemainingDays = (cls: ClassItem): number | null => {
    const target = cls.endDate ? new Date(cls.endDate) : null;
    if (!target) return null;
    const diff = Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const { data: classesData, loading, refresh: fetchData } = useCachedData<{ classes: ClassItem[]; courses: CourseOption[] }>(
    'teacher_classes_list',
    async () => {
      const [classRes, courseRes] = await Promise.all([
        apiClient.get<ClassItem[]>('/teacher/classes'),
        apiClient.get<CourseOption[]>('/teacher/courses'),
      ]);
      const classList: ClassItem[] = Array.isArray((classRes as any)?.data) ? (classRes as any).data : Array.isArray(classRes) ? (classRes as any) : [];
      const courseList: CourseOption[] = Array.isArray((courseRes as any)?.data) ? (courseRes as any).data : Array.isArray(courseRes) ? (courseRes as any) : [];
      return { classes: classList, courses: courseList };
    },
    { ttl: 120_000, initialData: { classes: [], courses: [] } }
  );

  useEffect(() => {
    if (classesData?.classes) {
      if (!selectedClass && classesData.classes.length > 0) {
        setSelectedClass(classesData.classes[0]);
      } else if (selectedClass) {
        const stillExists = classesData.classes.find(c => c.id === selectedClass.id);
        if (stillExists) {
          setSelectedClass(stillExists);
        } else {
          setSelectedClass(classesData.classes[0] || null);
        }
      }
    }
    if (classesData?.courses?.length && selectedCourseIds.length === 0) {
      setSelectedCourseIds([classesData.courses[0].id]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classesData]);

  const classes = classesData?.classes || [];
  const courses = classesData?.courses || [];

  const loadAvailableStudents = async () => {
    try {
      setLoadingStudents(true);
      const res = await apiClient.get<StudentOption[]>('/teacher/students/available');
      const list = Array.isArray((res as any)?.data) ? (res as any).data : Array.isArray(res) ? (res as any) : [];
      setAvailableStudents(list);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const filteredStudents = useMemo(() =>
    availableStudents.filter(s =>
      `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(studentSearch.toLowerCase())
    ),
    [availableStudents, studentSearch]
  );

  const filteredCreateStudents = useMemo(() =>
    availableStudents.filter(s =>
      `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(createStudentSearch.toLowerCase())
    ),
    [availableStudents, createStudentSearch]
  );

  const toggleStudentSelection = (id: string, state: string[], setter: (v: string[]) => void) => {
    setter(state.includes(id) ? state.filter(s => s !== id) : [...state, id]);
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (selectedCourseIds.length === 0) {
      setModalError('Please select at least one course for this cohort.');
      return;
    }
    try {
      setSaving(true);
      await apiClient.post('/teacher/classes', {
        name: form.name.trim(),
        courseIds: selectedCourseIds,
        courseId: selectedCourseIds[0],
        schedule: computeScheduleString(),
        capacity: Number(form.capacity) || 25,
        maxStudents: Number(form.capacity) || 25,
        startDate: cohortStartDate.toISOString(),
        endDate: cohortEndDate ? cohortEndDate.toISOString() : undefined,
        studentIds: createStudentIds,
      });
      setFeedback({ type: 'success', message: `Cohort "${form.name}" created${createStudentIds.length > 0 ? ` with ${createStudentIds.length} student(s) enrolled!` : '!'}` });
      setShowModal(false);
      setModalError(null);
      setForm({ name: '', capacity: 25 });
      setSelectedCourseIds(courses[0]?.id ? [courses[0].id] : []);
      setCreateStudentIds([]);
      setCreateStudentSearch('');
      setSelectedDays(['Mon', 'Wed', 'Fri']);
      setStartTime('06:00 PM');
      setEndTime('07:30 PM');
      setCohortStartDate(new Date());
      setCohortEndDate(null);
      setShowCalendarPicker(false);
      setShowEndCalendarPicker(false);
      clientCache.invalidate('teacher_');
      await fetchData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create class cohort.');
    } finally {
      setSaving(false);
    }
  };

  const handleEnrollStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    if (selectedStudentIds.length === 0) {
      setEnrollError('Please select at least one student to enroll.');
      return;
    }
    setEnrollError(null);
    try {
      setEnrolling(true);
      await apiClient.post(`/teacher/classes/${selectedClass.id}/enroll`, {
        studentIds: selectedStudentIds,
      });
      setFeedback({
        type: 'success',
        message: `${selectedStudentIds.length} student(s) enrolled into "${selectedClass.name}" with access activated!`,
      });
      setShowEnrollModal(false);
      setSelectedStudentIds([]);
      setStudentSearch('');
      clientCache.invalidate('teacher_');
      await fetchData();
    } catch (err: any) {
      setEnrollError(err.message || 'Failed to enroll students.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleUpdateCourses = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    setCoursesError(null);
    try {
      setSavingCourses(true);
      await apiClient.put(`/teacher/classes/${selectedClass.id}/courses`, {
        courseIds: manageCourseIds,
      });
      setFeedback({
        type: 'success',
        message: `Courses updated for cohort "${selectedClass.name}"!`,
      });
      setShowCoursesModal(false);
      // Optimistically update local state so the detail panel refreshes immediately
      setSelectedClass(prev => prev ? {
        ...prev,
        courses: manageCourseIds.map(id => {
          const c = courses.find(co => co.id === id);
          return { courseId: id, course: c ? { id: c.id, title: c.title, level: c.level } : { id, title: '...', level: '...' } };
        }),
        course: courses.find(c => c.id === manageCourseIds[0]) || prev.course,
      } : null);
      clientCache.invalidate('teacher_');
      await fetchData();
    } catch (err: any) {
      setCoursesError(err.message || 'Failed to update courses.');
    } finally {
      setSavingCourses(false);
    }
  };

  const openEditModal = (cls: ClassItem) => {
    setEditError(null);
    setEditForm({
      name: cls.name,
      capacity: cls.capacity || cls.maxStudents || 25,
      meetingLink: cls.meetingLink || '',
    });
    const currentCourses = cls.courses?.map(c => c.courseId || c.course.id) || (cls.course ? [cls.course.id] : []);
    setEditSelectedCourseIds(currentCourses.length > 0 ? currentCourses : (courses[0]?.id ? [courses[0].id] : []));

    const desc = cls.description || '';
    const foundDays = ALL_DAYS.filter(d => desc.includes(d));
    setEditSelectedDays(foundDays.length > 0 ? foundDays : ['Mon', 'Wed', 'Fri']);

    const timeMatches = desc.match(/\b\d{2}:\d{2}\s?(?:AM|PM)\b/gi);
    if (timeMatches && timeMatches.length >= 2) {
      setEditStartTime(timeMatches[0]);
      setEditEndTime(timeMatches[1]);
    } else {
      setEditStartTime('06:00 PM');
      setEditEndTime('07:30 PM');
    }

    setEditStartDate(cls.startDate ? new Date(cls.startDate) : new Date());
    setEditEndDate(cls.endDate ? new Date(cls.endDate) : null);
    setShowEditCalendarPicker(false);
    setShowEditEndCalendarPicker(false);
    setShowEditModal(true);
  };

  const toggleEditDay = (day: string) => {
    setEditSelectedDays(prev =>
      prev.includes(day) ? (prev.length > 1 ? prev.filter(d => d !== day) : prev) : [...prev, day]
    );
  };

  const computeEditScheduleString = () => {
    const daysStr = editSelectedDays.length > 0 ? editSelectedDays.join(', ') : 'Flexible';
    const dateFormatted = editStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const endFormatted = editEndDate ? ` • Ends ${editEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : '';
    return `${daysStr} from ${editStartTime} to ${editEndTime} (Starts ${dateFormatted}${endFormatted})`;
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    if (editSelectedCourseIds.length === 0) {
      setEditError('Please select at least one course for this cohort.');
      return;
    }
    try {
      setSavingEdit(true);
      setEditError(null);
      const res: any = await apiClient.put(`/teacher/classes/${selectedClass.id}`, {
        name: editForm.name.trim(),
        courseIds: editSelectedCourseIds,
        courseId: editSelectedCourseIds[0],
        schedule: computeEditScheduleString(),
        capacity: Number(editForm.capacity) || 25,
        maxStudents: Number(editForm.capacity) || 25,
        startDate: editStartDate.toISOString(),
        endDate: editEndDate ? editEndDate.toISOString() : null,
        meetingLink: editForm.meetingLink.trim() || undefined,
      });

      const updatedCls: ClassItem = res?.data || res;
      setSelectedClass(updatedCls);
      setFeedback({ type: 'success', message: `Cohort "${editForm.name}" updated successfully!` });
      setShowEditModal(false);
      clientCache.invalidate('teacher_');
      await fetchData();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update cohort.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedClass) return;
    try {
      setDeletingCohort(true);
      setDeleteError(null);
      await apiClient.delete(`/teacher/classes/${selectedClass.id}`);
      setFeedback({ type: 'success', message: `Cohort "${selectedClass.name}" deleted successfully.` });
      setShowDeleteModal(false);
      clientCache.invalidate('teacher_');
      await fetchData();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete cohort.');
    } finally {
      setDeletingCohort(false);
    }
  };

  const handleRemoveStudent = async () => {
    if (!selectedClass || !studentToRemove) return;
    try {
      setRemovingStudent(true);
      await apiClient.delete(`/teacher/classes/${selectedClass.id}/students/${studentToRemove.studentId}`);
      setFeedback({ type: 'success', message: `${studentToRemove.name} removed from cohort.` });
      setStudentToRemove(null);
      clientCache.invalidate('teacher_');
      await fetchData();
      try {
        const detailRes: any = await apiClient.get(`/teacher/classes/${selectedClass.id}`);
        if (detailRes?.data) setSelectedClass(detailRes.data);
        else if (detailRes?.id) setSelectedClass(detailRes);
      } catch {
        // Fallback to cache refresh
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to remove student from cohort.' });
    } finally {
      setRemovingStudent(false);
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-8 bg-slate-50 min-h-screen dark:bg-slate-950">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
            <FolderTree className="h-3.5 w-3.5" />
            Cohort & Live Class Hub
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl dark:text-white">
            Class Cohorts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create cohorts with multiple courses and enroll students directly from your student list.
          </p>
        </div>
        <Button
          onClick={() => {
            setModalError(null);
            if (availableStudents.length === 0) loadAvailableStudents();
            setShowModal(true);
          }}
          className="bg-[#315b36] hover:bg-[#27492b] text-white gap-2 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Create New Cohort
        </Button>
      </div>

      {feedback && (
        <div className={`flex items-center justify-between rounded-xl p-4 text-xs font-medium ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
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
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Active Cohorts ({classes.length})</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4 space-y-3">
                  <Skeleton className="h-4 w-16" />
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
                const allCourses = cls.courses?.map(cc => cc.course) || (cls.course ? [cls.course] : []);
                return (
                  <Card
                    key={cls.id}
                    onClick={() => setSelectedClass(cls)}
                    className={`cursor-pointer p-4 transition-all ${isSelected ? 'border-[#315b36] ring-2 ring-[#315b36]/20 shadow-md' : 'hover:border-slate-300 dark:hover:border-slate-700'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {allCourses.slice(0, 2).map(c => (
                            <Badge key={c.id} variant="indigo" className="text-[10px]">{c.level}</Badge>
                          ))}
                          {allCourses.length > 2 && (
                            <span className="text-[10px] text-slate-400 font-semibold">+{allCourses.length - 2}</span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{cls.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {allCourses.map(c => c.title).join(' • ') || 'No courses linked'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {cls.description || 'No schedule set'}
                        </p>
                      </div>
                      <div className="shrink-0 ml-2 text-center space-y-1">
                        <span className="text-lg font-black text-slate-800 dark:text-white block">{studentCount}</span>
                        <p className="text-[10px] text-slate-400">students</p>
                        {(() => {
                          const days = computeRemainingDays(cls);
                          if (days === null) return null;
                          const color = days <= 0 ? 'bg-slate-100 text-slate-500' : days <= 7 ? 'bg-rose-100 text-rose-700' : days <= 30 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';
                          return (
                            <span className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold ${color}`}>
                              {days <= 0 ? 'Ended' : `${days}d left`}
                            </span>
                          );
                        })()}
                        <div className="flex items-center justify-center gap-1 pt-0.5">
                          <button
                            type="button"
                            title="Edit cohort"
                            onClick={(e) => { e.stopPropagation(); setSelectedClass(cls); openEditModal(cls); }}
                            className="rounded p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            title="Delete cohort"
                            onClick={(e) => { e.stopPropagation(); setSelectedClass(cls); setDeleteError(null); setShowDeleteModal(true); }}
                            className="rounded p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <FolderTree className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No cohorts yet</p>
              <p className="text-[11px] text-slate-500 mb-3">Create your first cohort with multiple courses.</p>
              <Button size="sm" className="bg-[#315b36] hover:bg-[#27492b] text-white" onClick={() => setShowModal(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" />Create Cohort
              </Button>
            </Card>
          )}
        </div>

        {/* Right Column: Selected Class Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedClass ? (
            <>
              <Card className="p-5 border-l-4 border-l-[#315b36]">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap gap-1.5 mb-1">
                      {(selectedClass.courses?.map(cc => cc.course) || (selectedClass.course ? [selectedClass.course] : [])).map(c => (
                        <Badge key={c.id} variant="indigo">{c.level} — {c.title}</Badge>
                      ))}
                    </div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1">{selectedClass.name}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {selectedClass.description || 'No schedule set'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        {selectedClass.enrollments?.length || 0} / {selectedClass.capacity || selectedClass.maxStudents || 30} Students
                      </span>
                      {(() => {
                        const days = computeRemainingDays(selectedClass);
                        if (days === null) return null;
                        const color = days <= 0
                          ? 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400'
                          : days <= 7
                          ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                          : days <= 30
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300';
                        return (
                          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold border ${color}`}>
                            <CalendarIcon className="h-3 w-3" />
                            {days <= 0 ? 'Cohort Ended' : `${days} days remaining`}
                          </span>
                        );
                      })()}
                      <button
                        onClick={() => {
                          // Pre-populate with current linked courses
                          const current = selectedClass.courses?.map(cc => cc.course.id)
                            || (selectedClass.course ? [selectedClass.course.id] : []);
                          setManageCourseIds(current);
                          setCoursesError(null);
                          setShowCoursesModal(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-800 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 transition-colors"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        Manage Courses
                      </button>
                      <button
                        onClick={() => {
                          setEnrollError(null);
                          setSelectedStudentIds([]);
                          setStudentSearch('');
                          loadAvailableStudents();
                          setShowEnrollModal(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 transition-colors"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Add Students
                      </button>
                      <button
                        onClick={() => openEditModal(selectedClass)}
                        className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-800 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 transition-colors"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit Cohort
                      </button>
                      <button
                        onClick={() => { setDeleteError(null); setShowDeleteModal(true); }}
                        className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete Cohort
                      </button>
                    </div>
                  </div>
                  {selectedClass.meetingLink && (
                    <a href={selectedClass.meetingLink} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
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
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#315b36]" />
                      Student Roster
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {selectedClass.enrollments?.length || 0} students enrolled in this cohort
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    className="bg-[#315b36] hover:bg-[#27492b] text-white gap-1.5 text-xs"
                    onClick={() => {
                      setEnrollError(null);
                      setSelectedStudentIds([]);
                      setStudentSearch('');
                      loadAvailableStudents();
                      setShowEnrollModal(true);
                    }}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Add Students
                  </Button>
                </CardHeader>
                <CardContent>
                  {selectedClass.enrollments && selectedClass.enrollments.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedClass.enrollments.map((enr, i) => {
                        // Support both direct student fields and nested user object
                        const s = enr.student as any;
                        const firstName: string = s?.firstName || s?.user?.firstName || '?';
                        const lastName: string = s?.lastName || s?.user?.lastName || '';
                        const email: string = s?.email || s?.user?.email || '';
                        return (
                          <div key={enr.id || i} className="py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#315b36]/10 font-bold text-xs text-[#315b36] dark:bg-emerald-950 dark:text-emerald-400">
                                {firstName[0]}{lastName[0]}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">
                                  {firstName} {lastName}
                                </p>
                                <p className="text-[11px] text-slate-500">{email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="success" className="text-[10px]">Active</Badge>
                              <button
                                type="button"
                                title="Remove student from cohort"
                                onClick={() => setStudentToRemove({
                                  studentId: enr.student?.id || (enr as any).studentId || s?.id,
                                  name: `${firstName} ${lastName}`.trim() || 'Student',
                                })}
                                className="rounded p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              >
                                <UserMinus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-10 text-center text-xs text-slate-400 space-y-3">
                      <GraduationCap className="h-8 w-8 mx-auto text-slate-300" />
                      <p>No students enrolled yet.</p>
                      <Button
                        size="sm"
                        className="bg-[#315b36] hover:bg-[#27492b] text-white gap-1.5 text-xs"
                        onClick={() => {
                          setEnrollError(null);
                          setSelectedStudentIds([]);
                          loadAvailableStudents();
                          setShowEnrollModal(true);
                        }}
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Enroll First Students
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="p-12 text-center text-slate-400">
              <FolderTree className="h-10 w-10 mx-auto text-slate-300 mb-3" />
              Select or create a cohort on the left to see its details and roster.
            </Card>
          )}
        </div>
      </div>

      {/* ========================= CREATE COHORT MODAL ========================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm">
          <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            {/* Header */}
            <CardHeader className="py-3 px-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between shrink-0 space-y-0">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Create Class Cohort</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Add multiple courses and pre-select students directly from your student list.
                </CardDescription>
              </div>
              <button onClick={() => { setShowModal(false); setModalError(null); setShowCalendarPicker(false); }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </CardHeader>

            {/* Body */}
            <div className="overflow-y-auto p-5 space-y-5 flex-1">
              {modalError && (
                <div className="flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <form id="create-class-form" onSubmit={handleCreateClass} className="space-y-5">
                {/* Cohort Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cohort Name *</label>
                  <input
                    type="text" required
                    placeholder="e.g. Evening Fast-Track Batch 04"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#315b36] focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>

                {/* Course Multi-Select */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    <Layers className="inline h-3.5 w-3.5 mr-1" />
                    Courses in this Cohort * ({selectedCourseIds.length} selected)
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">Select one or more courses that students in this cohort will learn.</p>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 max-h-40 overflow-y-auto">
                    {courses.length === 0 ? (
                      <p className="p-3 text-xs text-slate-400 text-center">No courses available. Create a course first.</p>
                    ) : courses.map(c => {
                      const isChecked = selectedCourseIds.includes(c.id);
                      return (
                        <label key={c.id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${isChecked ? 'bg-emerald-50/70 dark:bg-emerald-950/30' : ''}`}>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded accent-[#315b36]"
                            checked={isChecked}
                            onChange={() => setSelectedCourseIds(prev => isChecked ? prev.filter(id => id !== c.id) : [...prev, c.id])}
                          />
                          <div className="flex items-center gap-2 flex-1">
                            <span className="inline-flex items-center rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">{c.level}</span>
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{c.title}</span>
                          </div>
                          {isChecked && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Schedule & Days */}
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Weekly Schedule & Live Days</label>
                    <span className="text-[11px] font-bold text-[#315b36] dark:text-emerald-400">{selectedDays.length} day{selectedDays.length !== 1 ? 's' : ''} selected</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {ALL_DAYS.map(d => {
                      const sel = selectedDays.includes(d);
                      return (
                        <button key={d} type="button" onClick={() => toggleDay(d)}
                          className={cn('py-1.5 rounded-lg text-xs font-bold transition-all text-center', sel ? 'bg-[#315b36] text-white shadow-sm ring-1 ring-[#315b36]' : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300')}>
                          {d}
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Start Time</label>
                      <select value={startTime} onChange={e => setStartTime(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium focus:border-[#315b36] focus:outline-none dark:border-slate-800 dark:bg-slate-900">
                        {TIME_OPTIONS.map(t => <option key={`s-${t}`} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">End Time</label>
                      <select value={endTime} onChange={e => setEndTime(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium focus:border-[#315b36] focus:outline-none dark:border-slate-800 dark:bg-slate-900">
                        {TIME_OPTIONS.map(t => <option key={`e-${t}`} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Cohort Start Date</label>
                      <button type="button" onClick={() => setShowCalendarPicker(!showCalendarPicker)}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-[#315b36] hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-emerald-400 transition-colors">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {cohortStartDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        {showCalendarPicker ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
                      </button>
                    </div>
                    {showCalendarPicker && (
                      <div className="mt-2.5 flex justify-center">
                        <BuiltCalendar compact className="w-full max-w-sm border shadow-md" selectedDate={cohortStartDate}
                          onSelectDate={d => { setCohortStartDate(d); setShowCalendarPicker(false); }} minDate={new Date()} />
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Cohort End Date</label>
                        <p className="text-[10px] text-slate-400">Optional — tracks remaining days</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {cohortEndDate && (
                          <button
                            type="button"
                            onClick={() => { setCohortEndDate(null); setShowEndCalendarPicker(false); }}
                            className="text-[11px] text-rose-500 hover:text-rose-700 underline font-medium mr-1"
                          >
                            Clear
                          </button>
                        )}
                        <button type="button" onClick={() => setShowEndCalendarPicker(!showEndCalendarPicker)}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-[#315b36] hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-emerald-400 transition-colors">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {cohortEndDate ? cohortEndDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Set End Date'}
                          {showEndCalendarPicker ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
                        </button>
                      </div>
                    </div>
                    {showEndCalendarPicker && (
                      <div className="mt-2.5 flex justify-center">
                        <BuiltCalendar compact className="w-full max-w-sm border shadow-md" selectedDate={cohortEndDate || cohortStartDate}
                          onSelectDate={d => { setCohortEndDate(d); setShowEndCalendarPicker(false); }} minDate={cohortStartDate} />
                      </div>
                    )}
                  </div>
                  <div className="rounded-lg bg-white p-2.5 border border-slate-200/80 text-[11px] text-slate-600 dark:bg-slate-800/80 dark:border-slate-800 dark:text-slate-300">
                    <span className="font-bold text-slate-800 dark:text-white">Scheduled: </span>
                    <span>{computeScheduleString()}</span>
                  </div>
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Max Student Capacity</label>
                  <input type="number" required min={1} value={form.capacity}
                    onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) || 20 })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#315b36] focus:outline-none dark:border-slate-800 dark:bg-slate-900" />
                </div>

                {/* Pre-enroll Students (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    <UserPlus className="inline h-3.5 w-3.5 mr-1" />
                    Pre-enroll Students (Optional) — {createStudentIds.length} selected
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">Select students to enroll immediately when the cohort is created.</p>
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input type="text" placeholder="Search by name or email..."
                      value={createStudentSearch}
                      onChange={e => setCreateStudentSearch(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-2 text-xs focus:border-[#315b36] focus:outline-none dark:border-slate-800 dark:bg-slate-900" />
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 max-h-44 overflow-y-auto">
                    {loadingStudents ? (
                      <p className="p-3 text-xs text-slate-400 text-center">Loading students...</p>
                    ) : filteredCreateStudents.length === 0 ? (
                      <p className="p-3 text-xs text-slate-400 text-center">No students found.</p>
                    ) : filteredCreateStudents.map(s => {
                      const isChecked = createStudentIds.includes(s.id);
                      return (
                        <label key={s.id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${isChecked ? 'bg-emerald-50/70 dark:bg-emerald-950/30' : ''}`}>
                          <input type="checkbox" className="h-4 w-4 rounded accent-[#315b36]" checked={isChecked}
                            onChange={() => toggleStudentSelection(s.id, createStudentIds, setCreateStudentIds)} />
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {s.firstName[0]}{s.lastName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{s.firstName} {s.lastName}</p>
                            <p className="text-[11px] text-slate-500 truncate">{s.email}</p>
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0">{s.currentLevel}</span>
                          {isChecked && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="py-3 px-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <Button type="button" variant="outline" size="sm"
                onClick={() => { setShowModal(false); setModalError(null); setShowCalendarPicker(false); }}>
                Cancel
              </Button>
              <Button type="submit" form="create-class-form" size="sm" disabled={saving}
                className="bg-[#315b36] hover:bg-[#27492b] text-white">
                {saving ? 'Creating...' : `Create Cohort${createStudentIds.length > 0 ? ` + Enroll ${createStudentIds.length}` : ''}`}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ========================= ENROLL STUDENTS MODAL ========================= */}
      {showEnrollModal && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg max-h-[88vh] flex flex-col shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="py-3.5 px-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between shrink-0 space-y-0">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-[#315b36]" />
                  Add Students to Cohort
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  {selectedClass.name} • {selectedStudentIds.length} student(s) selected
                </CardDescription>
              </div>
              <button onClick={() => { setShowEnrollModal(false); setEnrollError(null); setSelectedStudentIds([]); }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </CardHeader>

            <form onSubmit={handleEnrollStudents} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto p-5 space-y-4 flex-1">
                {enrollError && (
                  <div className="flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{enrollError}</span>
                  </div>
                )}

                {selectedStudentIds.length > 0 && (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-300 flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                    <p><strong>{selectedStudentIds.length} student(s)</strong> selected. All cohort courses will be unlocked immediately at no cost to them.</p>
                  </div>
                )}

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input type="text" placeholder="Search students by name or email..."
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-2 text-xs focus:border-[#315b36] focus:outline-none dark:border-slate-800 dark:bg-slate-900" />
                </div>

                {/* Student List */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto max-h-80">
                  {loadingStudents ? (
                    <div className="p-6 text-center text-xs text-slate-400">Loading registered students...</div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">No students match your search.</div>
                  ) : filteredStudents.map(s => {
                    const isChecked = selectedStudentIds.includes(s.id);
                    const isActive = s.subscriptionStatus === 'ACTIVE';
                    return (
                      <label key={s.id} className={`flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${isChecked ? 'bg-emerald-50/70 dark:bg-emerald-950/30' : ''}`}>
                        <input type="checkbox" className="h-4 w-4 rounded accent-[#315b36]" checked={isChecked}
                          onChange={() => toggleStudentSelection(s.id, selectedStudentIds, setSelectedStudentIds)} />
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {s.firstName[0]}{s.lastName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{s.firstName} {s.lastName}</p>
                          <p className="text-[11px] text-slate-500 truncate">{s.email}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-slate-400">{s.currentLevel}</span>
                          {isActive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Active subscription" />}
                        </div>
                        {isChecked && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                      </label>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">{filteredStudents.length} students available</span>
                  {filteredStudents.length > 0 && (
                    <button type="button" className="text-[11px] text-[#315b36] font-semibold hover:underline"
                      onClick={() => setSelectedStudentIds(filteredStudents.map(s => s.id))}>
                      Select All
                    </button>
                  )}
                </div>
              </div>

              <div className="py-3 px-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                <Button type="button" variant="outline" size="sm"
                  onClick={() => { setShowEnrollModal(false); setEnrollError(null); setSelectedStudentIds([]); }}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={enrolling || selectedStudentIds.length === 0}
                  className="bg-[#315b36] hover:bg-[#27492b] text-white">
                  {enrolling ? 'Enrolling...' : `Enroll ${selectedStudentIds.length} Student${selectedStudentIds.length !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ========================= MANAGE COURSES MODAL ========================= */}
      {showCoursesModal && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="py-3.5 px-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between shrink-0 space-y-0">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-indigo-600" />
                  Manage Courses
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  {selectedClass.name} — select which courses are taught in this cohort
                </CardDescription>
              </div>
              <button onClick={() => { setShowCoursesModal(false); setCoursesError(null); }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </CardHeader>

            <form onSubmit={handleUpdateCourses} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto p-5 space-y-4 flex-1">
                {coursesError && (
                  <div className="flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{coursesError}</span>
                  </div>
                )}

                <p className="text-xs text-slate-500">
                  Check the courses this cohort should cover. Students enrolled here will get access to all selected courses.
                </p>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                  {courses.length === 0 ? (
                    <p className="p-4 text-xs text-center text-slate-400">No courses available. Create a course first.</p>
                  ) : courses.map(c => {
                    const isChecked = manageCourseIds.includes(c.id);
                    return (
                      <label key={c.id} className={`flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${isChecked ? 'bg-emerald-50/70 dark:bg-emerald-950/30' : ''}`}>
                        <input type="checkbox" className="h-4 w-4 rounded accent-[#315b36]"
                          checked={isChecked}
                          onChange={() => setManageCourseIds(prev =>
                            isChecked ? prev.filter(id => id !== c.id) : [...prev, c.id]
                          )} />
                        <div className="flex items-center gap-2 flex-1">
                          <span className="inline-flex items-center rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">{c.level}</span>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{c.title}</span>
                        </div>
                        {isChecked && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                      </label>
                    );
                  })}
                </div>

                <p className="text-[11px] text-slate-400">
                  {manageCourseIds.length} course{manageCourseIds.length !== 1 ? 's' : ''} selected
                </p>
              </div>

              <div className="py-3 px-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                <Button type="button" variant="outline" size="sm"
                  onClick={() => { setShowCoursesModal(false); setCoursesError(null); }}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={savingCourses}
                  className="bg-[#315b36] hover:bg-[#27492b] text-white">
                  {savingCourses ? 'Saving...' : 'Save Courses'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ========================= EDIT COHORT MODAL ========================= */}
      {showEditModal && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg max-h-[88vh] flex flex-col shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="py-3.5 px-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between shrink-0 space-y-0">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-blue-600" />
                  Edit Cohort
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Update cohort details, assigned courses, and schedule
                </CardDescription>
              </div>
              <button
                onClick={() => { setShowEditModal(false); setEditError(null); }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>

            <div className="overflow-y-auto p-5 space-y-4 flex-1">
              {editError && (
                <div className="flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <form id="edit-class-form" onSubmit={handleUpdateClass} className="space-y-4">
                {/* Cohort Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cohort Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#315b36] focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>

                {/* Courses Multi-Select */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    <Layers className="inline h-3.5 w-3.5 mr-1 text-[#315b36]" />
                    Linked Courses ({editSelectedCourseIds.length} selected)
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">Select one or more courses taught within this cohort.</p>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 max-h-40 overflow-y-auto">
                    {courses.map(c => {
                      const isChecked = editSelectedCourseIds.includes(c.id);
                      return (
                        <label key={c.id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${isChecked ? 'bg-emerald-50/70 dark:bg-emerald-950/30' : ''}`}>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded accent-[#315b36]"
                            checked={isChecked}
                            onChange={() => {
                              setEditSelectedCourseIds(prev =>
                                isChecked ? (prev.length > 1 ? prev.filter(id => id !== c.id) : prev) : [...prev, c.id]
                              );
                            }}
                          />
                          <div className="flex items-center gap-2 flex-1">
                            <span className="inline-flex items-center rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">{c.level}</span>
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{c.title}</span>
                          </div>
                          {isChecked && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Schedule builder */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-3 dark:border-slate-800 dark:bg-slate-900/60">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Weekly Days</label>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_DAYS.map(day => {
                        const active = editSelectedDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleEditDay(day)}
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                              active
                                ? 'bg-[#315b36] text-white shadow-sm'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Start Time</label>
                      <select
                        value={editStartTime}
                        onChange={e => setEditStartTime(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium focus:border-[#315b36] focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                      >
                        {TIME_OPTIONS.map(t => <option key={`est-${t}`} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">End Time</label>
                      <select
                        value={editEndTime}
                        onChange={e => setEditEndTime(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium focus:border-[#315b36] focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                      >
                        {TIME_OPTIONS.map(t => <option key={`eet-${t}`} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Start Date */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Cohort Start Date</label>
                      <button
                        type="button"
                        onClick={() => setShowEditCalendarPicker(!showEditCalendarPicker)}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-[#315b36] hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-emerald-400 transition-colors"
                      >
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {editStartDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        {showEditCalendarPicker ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
                      </button>
                    </div>
                    {showEditCalendarPicker && (
                      <div className="mt-2.5 flex justify-center">
                        <BuiltCalendar
                          compact
                          className="w-full max-w-sm border shadow-md"
                          selectedDate={editStartDate}
                          onSelectDate={d => { setEditStartDate(d); setShowEditCalendarPicker(false); }}
                        />
                      </div>
                    )}
                  </div>

                  {/* End Date */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Cohort End Date</label>
                        <p className="text-[10px] text-slate-400">Optional — calculates remaining days</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {editEndDate && (
                          <button
                            type="button"
                            onClick={() => { setEditEndDate(null); setShowEditEndCalendarPicker(false); }}
                            className="text-[11px] text-rose-500 hover:text-rose-700 underline font-medium mr-1"
                          >
                            Clear
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowEditEndCalendarPicker(!showEditEndCalendarPicker)}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-[#315b36] hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-emerald-400 transition-colors"
                        >
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {editEndDate ? editEndDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Set End Date'}
                          {showEditEndCalendarPicker ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
                        </button>
                      </div>
                    </div>
                    {showEditEndCalendarPicker && (
                      <div className="mt-2.5 flex justify-center">
                        <BuiltCalendar
                          compact
                          className="w-full max-w-sm border shadow-md"
                          selectedDate={editEndDate || editStartDate}
                          onSelectDate={d => { setEditEndDate(d); setShowEditEndCalendarPicker(false); }}
                          minDate={editStartDate}
                        />
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg bg-white p-2.5 border border-slate-200/80 text-[11px] text-slate-600 dark:bg-slate-800/80 dark:border-slate-800 dark:text-slate-300">
                    <span className="font-bold text-slate-800 dark:text-white">Scheduled: </span>
                    <span>{computeEditScheduleString()}</span>
                  </div>
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Max Student Capacity</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editForm.capacity}
                    onChange={e => setEditForm({ ...editForm, capacity: parseInt(e.target.value) || 20 })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#315b36] focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>

                {/* Meeting Link */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Live Meeting Link (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/... or Zoom link"
                    value={editForm.meetingLink}
                    onChange={e => setEditForm({ ...editForm, meetingLink: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#315b36] focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="py-3 px-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setShowEditModal(false); setEditError(null); }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="edit-class-form"
                size="sm"
                disabled={savingEdit}
                className="bg-[#315b36] hover:bg-[#27492b] text-white"
              >
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ========================= DELETE COHORT MODAL ========================= */}
      {showDeleteModal && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="py-4 px-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-rose-600" />
                Delete Cohort
              </CardTitle>
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteError(null); }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>

            <div className="p-5 space-y-3">
              {deleteError && (
                <div className="flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Are you sure you want to permanently delete <strong className="text-slate-900 dark:text-white">{selectedClass.name}</strong>?
              </p>
              <p className="text-xs text-slate-500">
                This action cannot be undone. Associated cohort schedules will be removed, and all currently enrolled students ({selectedClass.enrollments?.length || 0}) will be unlinked from this cohort.
              </p>
            </div>

            <div className="py-3 px-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setShowDeleteModal(false); setDeleteError(null); }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={deletingCohort}
                onClick={handleDeleteClass}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {deletingCohort ? 'Deleting...' : 'Delete Cohort'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ========================= REMOVE STUDENT MODAL ========================= */}
      {studentToRemove && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm">
          <Card className="w-full max-w-sm shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="py-4 px-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserMinus className="h-4 w-4 text-rose-600" />
                Remove from Cohort
              </CardTitle>
              <button
                onClick={() => setStudentToRemove(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>

            <div className="p-5 space-y-2">
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Remove <strong className="text-slate-900 dark:text-white">{studentToRemove.name}</strong> from <strong>{selectedClass.name}</strong>?
              </p>
              <p className="text-[11px] text-slate-500">
                The student will be removed from this cohort group.
              </p>
            </div>

            <div className="py-3 px-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStudentToRemove(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={removingStudent}
                onClick={handleRemoveStudent}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {removingStudent ? 'Removing...' : 'Remove Student'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
