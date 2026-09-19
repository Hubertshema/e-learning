'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { clientCache, useCachedData } from '@/lib/cache';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import {
  FolderTree,
  Users,
  BookOpen,
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Edit3,
  Sparkles,
  Clock,
  Shield,
  GraduationCap,
  X,
  UserCheck,
  Check
} from 'lucide-react';

interface ClassCohort {
  id: string;
  name: string;
  code: string;
  description?: string;
  courseId: string;
  course: {
    id: string;
    title: string;
    level: string;
    price: number;
    currency: string;
  };
  teacherId: string;
  teacher: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatarUrl?: string;
    };
  };
  startDate?: string;
  endDate?: string;
  maxStudents: number;
  isActive: boolean;
  createdAt: string;
  enrollments?: Array<{
    id: string;
    status: string;
    student: {
      user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
    };
  }>;
  _count?: {
    enrollments: number;
    attendances: number;
  };
}

export default function SuperadminClassesPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCohort, setEditingCohort] = useState<ClassCohort | null>(null);
  const [rosterCohort, setRosterCohort] = useState<ClassCohort | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    courseId: '',
    teacherId: '',
    maxStudents: 30,
    startDate: '',
    endDate: '',
    isActive: true,
  });

  const {
    data: rawClasses,
    loading: loadingClasses,
    refresh: refreshClasses,
  } = useCachedData<ClassCohort[]>(
    'superadmin_classes',
    async () => {
      const res = await apiClient.get<ClassCohort[]>('/superadmin/classes');
      return Array.isArray(res) ? res : (res as any)?.data || [];
    },
    { ttl: 60_000 }
  );

  const { data: rawTeachers = [] } = useCachedData<any[]>(
    'superadmin_teachers_select',
    async () => {
      const res: any = await apiClient.get('/superadmin/teachers');
      const list = Array.isArray(res) ? res : res?.data || [];
      return list.filter((t: any) => t.status === 'APPROVED' || t.user?.status === 'ACTIVE');
    },
    { ttl: 120_000 }
  );

  const { data: rawCourses = [] } = useCachedData<any[]>(
    'superadmin_courses_select',
    async () => {
      const res: any = await apiClient.get('/superadmin/courses');
      return Array.isArray(res) ? res : res?.data || [];
    },
    { ttl: 120_000 }
  );

  const classes = Array.isArray(rawClasses) ? rawClasses : [];
  const teachersList = Array.isArray(rawTeachers) ? rawTeachers : [];
  const coursesList = Array.isArray(rawCourses) ? rawCourses : [];
  const loading = loadingClasses && !rawClasses;

  const filteredClasses = classes.filter((c) => {
    if (filterStatus === 'ACTIVE' && !c.isActive) return false;
    if (filterStatus === 'ARCHIVED' && c.isActive) return false;
    if (selectedLevel !== 'ALL' && c.course?.level !== selectedLevel) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchName = c.name?.toLowerCase().includes(q);
      const matchCode = c.code?.toLowerCase().includes(q);
      const matchCourse = c.course?.title?.toLowerCase().includes(q);
      const matchTeacher = `${c.teacher?.user?.firstName} ${c.teacher?.user?.lastName}`.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchCourse && !matchTeacher) return false;
    }
    return true;
  });

  const totalCohorts = classes.length;
  const activeCohorts = classes.filter((c) => c.isActive).length;
  const totalStudents = classes.reduce((sum, c) => sum + (c._count?.enrollments || c.enrollments?.length || 0), 0);
  const avgCapacity = totalCohorts > 0 ? Math.round(classes.reduce((sum, c) => sum + (c.maxStudents || 30), 0) / totalCohorts) : 30;

  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      code: `CLS-${Date.now().toString(36).toUpperCase()}`,
      description: '',
      courseId: coursesList[0]?.id || '',
      teacherId: teachersList[0]?.id || '',
      maxStudents: 30,
      startDate: '',
      endDate: '',
      isActive: true,
    });
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (c: ClassCohort) => {
    setEditingCohort(c);
    setFormData({
      name: c.name,
      code: c.code,
      description: c.description || '',
      courseId: c.courseId,
      teacherId: c.teacherId,
      maxStudents: c.maxStudents,
      startDate: c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : '',
      endDate: c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : '',
      isActive: c.isActive,
    });
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.courseId || !formData.teacherId) {
      setMessage({ type: 'error', text: 'Please fill in the Class Name, Course, and Assigned Teacher.' });
      return;
    }

    try {
      setActionLoading(true);
      if (editingCohort) {
        await apiClient.patch(`/superadmin/classes/${editingCohort.id}`, formData);
        setMessage({ type: 'success', text: `Cohort "${formData.name}" updated successfully.` });
        setEditingCohort(null);
      } else {
        await apiClient.post('/superadmin/classes', formData);
        setMessage({ type: 'success', text: `New class cohort "${formData.name}" created successfully.` });
        setShowCreateModal(false);
      }
      clientCache.invalidate('superadmin_classes');
      await refreshClasses();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save class cohort.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (c: ClassCohort) => {
    try {
      await apiClient.patch(`/superadmin/classes/${c.id}`, { isActive: !c.isActive });
      setMessage({
        type: 'success',
        text: `Cohort "${c.name}" ${!c.isActive ? 'activated' : 'archived'} successfully.`,
      });
      clientCache.invalidate('superadmin_classes');
      await refreshClasses();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update cohort status.' });
    }
  };

  const handleDeleteClass = async (c: ClassCohort) => {
    if (!confirm(`Are you sure you want to permanently delete the cohort "${c.name}" (${c.code})?`)) return;

    try {
      await apiClient.delete(`/superadmin/classes/${c.id}`);
      setMessage({ type: 'success', text: `Cohort "${c.name}" deleted successfully.` });
      clientCache.invalidate('superadmin_classes');
      await refreshClasses();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete class cohort.' });
    }
  };

  return (
    <div className="space-y-8 max-w-7xl animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">Platform Cohorts & Group Learning</Badge>
          <h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Class Cohorts Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Create, schedule, and assign live student cohorts across CEFR courses and verified faculty.
          </p>
        </div>

        <Button variant="gradient" onClick={handleOpenCreateModal} className="shrink-0">
          <Plus className="mr-1.5 h-4 w-4" />
          Create New Cohort
        </Button>
      </div>

      {message && (
        <div
          className={`flex items-center justify-between rounded-2xl p-4 text-xs font-semibold shadow-md ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5 border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </Card>
          ))
        ) : (
          <>
            <Card className="p-5 border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Cohorts</span>
                <FolderTree className="h-5 w-5 text-indigo-600" />
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {totalCohorts}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Across all CEFR course levels</p>
            </Card>

            <Card className="p-5 border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Active Cohorts</span>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {activeCohorts}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Currently in-session</p>
            </Card>

            <Card className="p-5 border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Enrolled Students</span>
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {totalStudents}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Assigned to class rosters</p>
            </Card>

            <Card className="p-5 border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Average Capacity</span>
                <GraduationCap className="h-5 w-5 text-amber-500" />
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {`${avgCapacity} seats`}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Standard cohort size target</p>
            </Card>
          </>
        )}
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search cohorts, codes, courses, or teachers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="h-10 rounded-xl border border-input bg-background px-3 text-xs font-semibold"
            >
              <option value="ALL">All Levels</option>
              {['PRE_A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
                <option key={lvl} value={lvl}>Level {lvl}</option>
              ))}
            </select>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {(['ALL', 'ACTIVE', 'ARCHIVED'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterStatus(tab)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    filterStatus === tab
                      ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab === 'ALL' ? 'All' : tab === 'ACTIVE' ? 'Active' : 'Archived'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Cohorts Table */}
      {loading ? (
        <Card className="p-6 space-y-4 border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
          <TableSkeleton rows={6} columns={7} />
        </Card>
      ) : filteredClasses.length > 0 ? (
        <Card className="border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 p-4 text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 font-bold">
                  <th className="py-3.5 pl-6">Cohort Name & Code</th>
                  <th className="py-3.5 px-4">Associated Course</th>
                  <th className="py-3.5 px-4">Assigned Teacher</th>
                  <th className="py-3.5 px-4">Roster Capacity</th>
                  <th className="py-3.5 px-4">Schedule / Dates</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredClasses.map((c) => {
                  const studentCount = c._count?.enrollments || c.enrollments?.length || 0;
                  const isFull = studentCount >= c.maxStudents;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 pl-6">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{c.name}</div>
                        <div className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                          {c.code}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{c.course?.title}</div>
                        <Badge variant="indigo" className="text-[9px] mt-0.5">
                          Level {c.course?.level}
                        </Badge>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-[10px] dark:bg-primary-950 dark:text-primary-300">
                            {c.teacher?.user?.firstName?.[0]}{c.teacher?.user?.lastName?.[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {c.teacher?.user?.firstName} {c.teacher?.user?.lastName}
                            </div>
                            <div className="text-[10px] text-slate-400">{c.teacher?.user?.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-black ${isFull ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                            {studentCount} / {c.maxStudents}
                          </span>
                          <span className="text-[10px] text-slate-400">students</span>
                        </div>
                        <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isFull ? 'bg-rose-500' : studentCount > c.maxStudents * 0.75 ? 'bg-amber-500' : 'bg-primary-600'
                            }`}
                            style={{ width: `${Math.min(100, (studentCount / c.maxStudents) * 100)}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                        {c.description ? (
                          <div className="font-medium truncate max-w-xs">{c.description}</div>
                        ) : (
                          <span className="text-slate-400">Flexible Schedule</span>
                        )}
                        {(c.startDate || c.endDate) && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {c.startDate ? new Date(c.startDate).toLocaleDateString() : 'Immediate'}
                            {c.endDate ? ` — ${new Date(c.endDate).toLocaleDateString()}` : ''}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {c.isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="destructive">Archived</Badge>
                        )}
                      </td>

                      <td className="py-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRosterCohort(c)}
                            className="text-[11px] h-8 px-2.5"
                            title="View Enrolled Students"
                          >
                            <Users className="h-3.5 w-3.5 mr-1" />
                            Roster
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditModal(c)}
                            className="text-[11px] h-8 px-2"
                            title="Edit Cohort"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(c)}
                            className={`text-[11px] h-8 px-2 ${c.isActive ? 'text-amber-600' : 'text-emerald-600'}`}
                            title={c.isActive ? 'Archive Cohort' : 'Activate Cohort'}
                          >
                            {c.isActive ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClass(c)}
                            className="text-[11px] h-8 px-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Delete Cohort"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="p-12 text-center border-slate-200 dark:border-slate-800">
          <FolderTree className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No class cohorts found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
            {search || filterStatus !== 'ALL' || selectedLevel !== 'ALL'
              ? 'No cohorts match your current filters. Try changing your search keywords.'
              : 'Create your first live student class cohort to organize students into live schedules and classes.'}
          </p>
          <Button variant="gradient" size="sm" onClick={handleOpenCreateModal}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Create First Cohort
          </Button>
        </Card>
      )}

      {/* CREATE / EDIT COHORT MODAL */}
      {(showCreateModal || editingCohort) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-lg shadow-2xl border-slate-200 dark:border-slate-800">
            <CardHeader className="border-b border-slate-100 p-6 dark:border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">
                  {editingCohort ? 'Edit Class Cohort' : 'Create Live Class Cohort'}
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure cohort schedule, CEFR curriculum, assigned instructor, and seat capacity.
                </CardDescription>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingCohort(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleSaveClass}>
              <CardContent className="p-6 space-y-4">
                <Input
                  label="Cohort Name"
                  placeholder="e.g. B2 Business Fluency — Morning Cohort A"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Cohort Code"
                    placeholder="CLS-B2-01"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Maximum Capacity
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      required
                      value={formData.maxStudents}
                      onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value, 10) || 30 })}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Course Curriculum
                    </label>
                    <select
                      value={formData.courseId}
                      onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                      required
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold"
                    >
                      <option value="">Select a Course</option>
                      {coursesList.map((course: any) => (
                        <option key={course.id} value={course.id}>
                          {course.title} (Level {course.level})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Assigned Teacher / Faculty
                    </label>
                    <select
                      value={formData.teacherId}
                      onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                      required
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold"
                    >
                      <option value="">Select a Teacher</option>
                      {teachersList.map((teacher: any) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.user?.firstName} {teacher.user?.lastName} ({teacher.user?.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Input
                  label="Class Routine / Schedule Hours"
                  placeholder="e.g. Mon, Wed, Fri 18:00 – 19:30 (UTC+2)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Cohort Start Date"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                  <Input
                    label="Cohort End Date"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>

                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 rounded text-primary-600 accent-primary-600"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Active Cohort (Available for student enrollments & live attendance)
                  </span>
                </label>
              </CardContent>

              <div className="flex justify-end gap-2 border-t border-slate-100 p-6 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingCohort(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" size="sm" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : editingCohort ? 'Update Cohort' : 'Create Cohort'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* VIEW ROSTER MODAL */}
      {rosterCohort && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-2xl shadow-2xl border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col">
            <CardHeader className="border-b border-slate-100 p-6 dark:border-slate-800 flex flex-row items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold">{rosterCohort.name}</CardTitle>
                  <Badge variant="indigo">{rosterCohort.code}</Badge>
                </div>
                <CardDescription className="text-xs mt-1">
                  Enrolled student roster ({rosterCohort.enrollments?.length || 0} / {rosterCohort.maxStudents} capacity) • Instructor: {rosterCohort.teacher?.user?.firstName} {rosterCohort.teacher?.user?.lastName}
                </CardDescription>
              </div>
              <button
                onClick={() => setRosterCohort(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <div className="p-6 overflow-y-auto space-y-4">
              {rosterCohort.enrollments && rosterCohort.enrollments.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                  {rosterCohort.enrollments.map((enr) => (
                    <div key={enr.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-600 to-primary-600 text-white flex items-center justify-center font-bold text-xs">
                          {enr.student?.user?.firstName?.[0]}{enr.student?.user?.lastName?.[0]}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {enr.student?.user?.firstName} {enr.student?.user?.lastName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {enr.student?.user?.email}
                          </div>
                        </div>
                      </div>

                      <Badge variant={enr.status === 'ACTIVE' ? 'success' : 'warning'} className="text-[10px]">
                        {enr.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Users className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700" />
                  <p className="text-xs font-semibold">No students currently assigned to this cohort.</p>
                  <p className="text-[11px] text-slate-500">
                    Students will appear here once enrolled or assigned to this class cohort.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setRosterCohort(null)}>
                Close Roster
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
