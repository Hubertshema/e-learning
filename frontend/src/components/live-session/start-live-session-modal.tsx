'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Video,
  Users,
  User,
  Search,
  Check,
  Calendar,
  Clock,
  Sparkles,
  AlertCircle,
  X,
  Play,
  Loader2,
  CalendarDays,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Student {
  userId: string;
  studentId?: string;
  firstName: string;
  lastName: string;
  email: string;
  levelName?: string;
  levelCode?: string;
  avatarUrl?: string;
  courseName?: string;
  enrolledWithTeacher?: boolean;
}

function isSafeAvatarUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const lower = url.trim().toLowerCase();
  if (
    lower.includes('facebook.com') ||
    lower.includes('fb.com') ||
    lower.includes('instagram.com') ||
    lower.includes('twitter.com') ||
    lower.includes('x.com')
  ) {
    return false;
  }
  return (
    lower.startsWith('data:image/') ||
    lower.startsWith('/') ||
    lower.startsWith('http://') ||
    lower.startsWith('https://')
  );
}

interface StartLiveSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionCreated?: (session: any) => void;
  initialMode?: 'NOW' | 'SCHEDULED';
}

export function StartLiveSessionModal({
  isOpen,
  onClose,
  onSessionCreated,
  initialMode = 'NOW',
}: StartLiveSessionModalProps) {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [sessionType, setSessionType] = useState<'ONE_ON_ONE' | 'GROUP'>('ONE_ON_ONE');
  const [timingMode, setTimingMode] = useState<'NOW' | 'SCHEDULED'>(initialMode);

  useEffect(() => {
    if (isOpen) {
      setTimingMode(initialMode || 'NOW');
    }
  }, [isOpen, initialMode]);

  // Schedule date & time state
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [scheduledTime, setScheduledTime] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 15);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper to apply quick time presets
  const applyPreset = (minutesFromNow: number) => {
    const d = new Date(Date.now() + minutesFromNow * 60 * 1000);
    setScheduledDate(d.toISOString().split('T')[0]);
    setScheduledTime(
      `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    );
  };

  const applyTomorrowPreset = (hour: number, minute: number = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(hour, minute, 0, 0);
    setScheduledDate(d.toISOString().split('T')[0]);
    setScheduledTime(
      `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    );
  };

  // Load students for live session
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function fetchStudents(search: string = '') {
      try {
        setIsLoadingStudents(true);
        setErrorMessage(null);

        let list: any[] = [];
        const queryParam = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';

        // 1. Dedicated live-session students endpoint
        try {
          const res = await apiClient.get<any>(`/live-sessions/students${queryParam}`);
          if (Array.isArray(res)) {
            list = res;
          } else if (Array.isArray((res as any)?.data)) {
            list = (res as any).data;
          } else if (Array.isArray((res as any)?.students)) {
            list = (res as any).students;
          }
        } catch (liveErr) {
          console.warn('Could not fetch from /live-sessions/students, falling back:', liveErr);
        }

        // 2. Fallback to /teacher/students if list is still empty
        if (!list || list.length === 0) {
          try {
            const fallbackRes = await apiClient.get<any>(`/teacher/students${queryParam}`);
            if (Array.isArray(fallbackRes)) {
              list = fallbackRes;
            } else if (Array.isArray((fallbackRes as any)?.students)) {
              list = (fallbackRes as any).students;
            } else if (Array.isArray((fallbackRes as any)?.data?.students)) {
              list = (fallbackRes as any).data.students;
            } else if (Array.isArray((fallbackRes as any)?.data)) {
              list = (fallbackRes as any).data;
            }
          } catch (teacherErr) {
            console.warn('Fallback /teacher/students also failed:', teacherErr);
          }
        }

        if (!isMounted) return;

        if (Array.isArray(list)) {
          const normalized: Student[] = list
            .map((s: any) => {
              const userObj = s.user || {};
              const uid = userObj.id || s.userId || s.id || s.studentId || '';
              const firstName = (userObj.firstName || s.firstName || '').trim();
              const lastName = (userObj.lastName || s.lastName || '').trim();
              const email = userObj.email || s.email || '';
              const avatarUrl = userObj.avatarUrl || s.avatarUrl || '';
              const currentLevel =
                userObj.studentProfile?.currentLevel || s.currentLevel || s.levelCode || '';
              const levelName =
                userObj.studentProfile?.levelName ||
                s.levelName ||
                s.className ||
                currentLevel ||
                'CEFR Track';

              return {
                userId: uid,
                studentId: s.studentId || uid,
                firstName: firstName || 'Student',
                lastName,
                email,
                levelName,
                levelCode: s.levelCode || currentLevel,
                avatarUrl,
                courseName:
                  s.courseName ||
                  s.courseTitle ||
                  (Array.isArray(s.courses) ? s.courses[0]?.title : ''),
                enrolledWithTeacher: Boolean(s.enrolledWithTeacher),
              };
            })
            .filter((s) => Boolean(s.userId));

          setStudents((prev) => {
            const map = new Map<string, Student>();
            normalized.forEach((s) => map.set(s.userId, s));
            prev.forEach((s) => {
              if (!map.has(s.userId)) {
                map.set(s.userId, s);
              }
            });
            return Array.from(map.values());
          });
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Failed to load students for live session:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoadingStudents(false);
        }
      }
    }

    const timer = setTimeout(() => {
      fetchStudents(searchQuery);
    }, searchQuery ? 300 : 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, searchQuery]);

  if (!isOpen) return null;

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
    const email = (s.email || '').toLowerCase();
    const level = (s.levelName || s.levelCode || '').toLowerCase();
    return fullName.includes(q) || email.includes(q) || level.includes(q);
  });

  const toggleStudent = (id: string) => {
    if (sessionType === 'ONE_ON_ONE') {
      setSelectedStudentIds([id]);
    } else {
      if (selectedStudentIds.includes(id)) {
        setSelectedStudentIds(selectedStudentIds.filter((sId) => sId !== id));
      } else {
        setSelectedStudentIds([...selectedStudentIds, id]);
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(
        filteredStudents.map((s) => s.userId || (s as any).studentId || (s as any).id)
      );
    }
  };

  const handleSubmitSession = async () => {
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Please enter a session title or topic.');
      return;
    }

    if (selectedStudentIds.length === 0) {
      setErrorMessage('Please select at least one student for the live session.');
      return;
    }

    let sessionScheduledAt = new Date();
    if (timingMode === 'SCHEDULED') {
      if (!scheduledDate || !scheduledTime) {
        setErrorMessage('Please select a scheduled date and time.');
        return;
      }
      const combined = new Date(`${scheduledDate}T${scheduledTime}:00`);
      if (isNaN(combined.getTime())) {
        setErrorMessage('Invalid scheduled date or time.');
        return;
      }
      if (combined.getTime() < Date.now() - 5 * 60 * 1000) {
        setErrorMessage('Scheduled time cannot be in the past.');
        return;
      }
      sessionScheduledAt = combined;
    }

    try {
      setIsSubmitting(true);

      // 1. Create live session in backend
      const session = await apiClient.post<any>('/live-sessions', {
        title: title.trim(),
        topic: topic.trim(),
        type: sessionType,
        studentIds: selectedStudentIds,
        scheduledAt: sessionScheduledAt.toISOString(),
      });

      // 2. If timingMode is 'NOW', immediately start session and enter live room
      if (timingMode === 'NOW' && session?.id) {
        await apiClient.post(`/live-sessions/${session.id}/start`, {});
      }

      if (onSessionCreated) {
        onSessionCreated(session);
      }

      onClose();

      if (timingMode === 'NOW' && session?.id) {
        router.push(`/live/${session.id}`);
      } else {
        // Scheduled in advance: route to live sessions dashboard
        router.push('/teacher/live-sessions');
      }
    } catch (err: any) {
      console.error('Error creating live session:', err);
      setErrorMessage(err.message || 'Failed to save live session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[96vh] sm:max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/80 dark:border-blue-900/60 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-[#012970] to-[#006EF3] text-white">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md shrink-0">
              <Video className="h-4 w-4 sm:h-5 sm:w-5 text-[#F5B400] animate-pulse" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black tracking-tight truncate">
                {timingMode === 'NOW' ? 'Start Live Session' : 'Schedule Live Session'}
              </h2>
              <p className="text-[11px] sm:text-xs text-blue-100/90 font-medium line-clamp-1">
                {timingMode === 'NOW'
                  ? 'Host an interactive coaching or group classroom with real-time video'
                  : 'Set up an upcoming live video class in advance for your students'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center gap-2.5 text-red-700 dark:text-red-300 text-xs font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Title & Topic */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Session Title / Topic <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Oral Proficiency Practice & Phonetics Review"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10 text-sm border-blue-200 dark:border-blue-900 focus:border-[#006EF3]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Lesson Agenda / Instructions (Optional)
              </label>
              <Input
                placeholder="e.g. Discuss Unit 3 conversational prompts, live roleplay, Q&A"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="h-9 text-xs border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>

          {/* Session Format (1-on-1 vs Group) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Session Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  setSessionType('ONE_ON_ONE');
                  if (selectedStudentIds.length > 1) {
                    setSelectedStudentIds([selectedStudentIds[0]]);
                  }
                }}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  sessionType === 'ONE_ON_ONE'
                    ? 'border-[#006EF3] bg-blue-50/70 dark:bg-blue-950/40 text-[#012970] dark:text-blue-300 shadow-sm ring-1 ring-[#006EF3]/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                    sessionType === 'ONE_ON_ONE'
                      ? 'bg-[#006EF3] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                  }`}
                >
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-black">1-to-1 Session</div>
                  <div className="text-[11px] text-slate-500 font-normal">
                    Private coaching with 1 student
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSessionType('GROUP')}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  sessionType === 'GROUP'
                    ? 'border-[#006EF3] bg-blue-50/70 dark:bg-blue-950/40 text-[#012970] dark:text-blue-300 shadow-sm ring-1 ring-[#006EF3]/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                    sessionType === 'GROUP'
                      ? 'bg-[#006EF3] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                  }`}
                >
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-black">Group Session</div>
                  <div className="text-[11px] text-slate-500 font-normal">
                    Cohort group classroom (multi-student)
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Session Timing: Start Now vs Schedule in Advance */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Session Timing
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3">
              <button
                type="button"
                onClick={() => setTimingMode('NOW')}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  timingMode === 'NOW'
                    ? 'border-[#006EF3] bg-blue-50/70 dark:bg-blue-950/40 text-[#012970] dark:text-blue-300 shadow-sm ring-1 ring-[#006EF3]/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold ${
                    timingMode === 'NOW'
                      ? 'bg-[#006EF3] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                  }`}
                >
                  <Play className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-black">Start Now</div>
                  <div className="text-[11px] text-slate-500 font-normal">
                    Launch immediately & join live
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTimingMode('SCHEDULED')}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  timingMode === 'SCHEDULED'
                    ? 'border-[#006EF3] bg-blue-50/70 dark:bg-blue-950/40 text-[#012970] dark:text-blue-300 shadow-sm ring-1 ring-[#006EF3]/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold ${
                    timingMode === 'SCHEDULED'
                      ? 'bg-[#006EF3] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                  }`}
                >
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-black">Schedule in Advance</div>
                  <div className="text-[11px] text-slate-500 font-normal">
                    Set a date & time for later
                  </div>
                </div>
              </button>
            </div>

            {/* Date & Time Picker Controls (Visible when SCHEDULED) */}
            {timingMode === 'SCHEDULED' && (
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 space-y-3 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#006EF3]" />
                      Date <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#006EF3]" />
                      Time <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-500">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => applyPreset(15)}
                    className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#006EF3] text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    +15 mins
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(60)}
                    className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#006EF3] text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    +1 hour
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTomorrowPreset(10, 0)}
                    className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#006EF3] text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    Tomorrow 10:00 AM
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTomorrowPreset(14, 0)}
                    className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#006EF3] text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    Tomorrow 2:00 PM
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Student Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {sessionType === 'ONE_ON_ONE' ? 'Select Student' : 'Select Students for Group'} (
                {selectedStudentIds.length} selected)
              </label>

              {sessionType === 'GROUP' && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-bold text-[#006EF3] hover:underline"
                >
                  {selectedStudentIds.length === filteredStudents.length &&
                  filteredStudents.length > 0
                    ? 'Deselect All'
                    : 'Select All Filtered'}
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search students by name, email, or CEFR level..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-xs border-slate-200 dark:border-slate-800"
              />
            </div>

            {/* Students List Container */}
            <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
              {isLoadingStudents && students.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[#006EF3]" />
                  Loading students...
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  {isLoadingStudents ? 'Searching students...' : 'No students found.'}
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const id = student.userId || (student as any).studentId || (student as any).id;
                  const isSelected = selectedStudentIds.includes(id);

                  // Computed display name
                  const hasRealName =
                    student.firstName &&
                    student.firstName !== 'Student' &&
                    student.firstName.trim().length > 0;
                  const displayName = hasRealName
                    ? `${student.firstName} ${student.lastName}`.trim()
                    : student.email
                    ? student.email.split('@')[0]
                    : 'Student';

                  return (
                    <div
                      key={id}
                      onClick={() => toggleStudent(id)}
                      className={`flex items-center justify-between p-2.5 px-3 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-[#012970] dark:text-blue-200 font-semibold'
                          : 'hover:bg-white dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#012970] to-[#006EF3] flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm overflow-hidden">
                          {student.avatarUrl && isSafeAvatarUrl(student.avatarUrl) ? (
                            <img
                              src={student.avatarUrl}
                              alt=""
                              className="h-full w-full rounded-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            `${displayName[0]?.toUpperCase() || 'S'}${
                              student.lastName?.[0]?.toUpperCase() || ''
                            }`
                          )}
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-xs font-bold leading-tight truncate">
                              {displayName}
                            </span>
                            {student.enrolledWithTeacher && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                My Student
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 truncate mt-0.5">
                            {student.email && <span className="truncate">{student.email}</span>}
                            {student.levelName && (
                              <>
                                <span>•</span>
                                <span className="font-semibold text-blue-600 dark:text-blue-400">
                                  {student.levelName}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                          isSelected
                            ? 'bg-[#006EF3] border-[#006EF3] text-white shadow-sm'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected Students Chips Preview */}
            {selectedStudentIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <span className="text-[11px] font-bold text-slate-500 mr-1">
                  Selected ({selectedStudentIds.length}):
                </span>
                {selectedStudentIds.map((id) => {
                  const s = students.find((st) => st.userId === id || st.studentId === id);
                  const name =
                    s?.firstName && s.firstName !== 'Student'
                      ? `${s.firstName} ${s.lastName}`.trim()
                      : s?.email
                      ? s.email.split('@')[0]
                      : id;

                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-[#012970] dark:bg-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-800 shadow-sm"
                    >
                      <span>{name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStudent(id);
                        }}
                        className="hover:text-red-500 rounded-full p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {selectedStudentIds.length}
            </span>{' '}
            {sessionType === 'ONE_ON_ONE' ? 'student' : 'students'} selected
            {timingMode === 'SCHEDULED' && ` • Scheduled for ${scheduledDate} at ${scheduledTime}`}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none text-xs h-10 sm:h-9"
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleSubmitSession}
              disabled={isSubmitting || selectedStudentIds.length === 0 || !title.trim()}
              className="flex-[2] sm:flex-none text-xs h-10 sm:h-9 font-bold bg-[#006EF3] hover:bg-[#0057C2] text-white shadow-md gap-2 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : timingMode === 'NOW' ? (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Start Live Session Now
                </>
              ) : (
                <>
                  <Calendar className="h-3.5 w-3.5" />
                  Schedule Live Session
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
