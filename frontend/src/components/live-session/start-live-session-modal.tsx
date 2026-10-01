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
}

interface StartLiveSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionCreated?: (session: any) => void;
}

export function StartLiveSessionModal({
  isOpen,
  onClose,
  onSessionCreated,
}: StartLiveSessionModalProps) {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [sessionType, setSessionType] = useState<'ONE_ON_ONE' | 'GROUP'>('ONE_ON_ONE');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load students for live session
  useEffect(() => {
    if (!isOpen) return;

    async function fetchStudents() {
      try {
        setIsLoadingStudents(true);
        setErrorMessage(null);

        let list: any[] = [];

        // 1. Try dedicated live-session students endpoint
        try {
          const res = await apiClient.get<any>('/live-sessions/students');
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
            const fallbackRes = await apiClient.get<any>('/teacher/students');
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

        if (Array.isArray(list)) {
          const normalized: Student[] = list
            .map((s: any) => ({
              userId: s.userId || s.studentId || s.id || '',
              studentId: s.studentId || s.userId || s.id || '',
              firstName: s.firstName || 'Student',
              lastName: s.lastName || '',
              email: s.email || '',
              levelName: s.levelName || s.currentLevel || s.levelCode || 'CEFR Track',
              levelCode: s.levelCode || s.currentLevel || '',
              avatarUrl: s.avatarUrl,
              courseName: s.courseName || s.courseTitle || '',
            }))
            .filter((s) => Boolean(s.userId));

          const unique = Array.from(
            new Map(normalized.map((s) => [s.userId, s])).values()
          );

          setStudents(unique);
        }
      } catch (err: any) {
        console.error('Failed to load students for live session:', err);
      } finally {
        setIsLoadingStudents(false);
      }
    }

    fetchStudents();
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
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

  const handleStartSession = async (instantStart: boolean = true) => {
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Please enter a session title or topic.');
      return;
    }

    if (selectedStudentIds.length === 0) {
      setErrorMessage('Please select at least one student for the live session.');
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Create live session in backend
      const session = await apiClient.post<any>('/live-sessions', {
        title: title.trim(),
        topic: topic.trim(),
        type: sessionType,
        studentIds: selectedStudentIds,
        scheduledAt: new Date().toISOString(),
      });

      // 2. If instant start, trigger start endpoint
      if (instantStart && session?.id) {
        await apiClient.post(`/live-sessions/${session.id}/start`, {});
      }

      if (onSessionCreated) {
        onSessionCreated(session);
      }

      onClose();

      // 3. Direct transition to live room
      if (instantStart && session?.id) {
        router.push(`/live/${session.id}`);
      }
    } catch (err: any) {
      console.error('Error starting live session:', err);
      setErrorMessage(err.message || 'Failed to start live session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/80 dark:border-blue-900/60 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-[#012970] to-[#006EF3] text-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md">
              <Video className="h-5 w-5 text-[#F5B400] animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Start Live Session</h2>
              <p className="text-xs text-blue-100/90 font-medium">
                Host an interactive 1-to-1 coaching or group classroom with real-time video
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
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

          {/* Session Mode Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Session Format
            </label>
            <div className="grid grid-cols-2 gap-3">
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
                    ? 'border-[#006EF3] bg-blue-50/70 dark:bg-blue-950/40 text-[#012970] dark:text-blue-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold ${
                    sessionType === 'ONE_ON_ONE'
                      ? 'bg-[#006EF3] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                  }`}
                >
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-black">1-to-1 Session</div>
                  <div className="text-[11px] text-slate-500 font-normal">Private personalized coaching</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSessionType('GROUP')}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  sessionType === 'GROUP'
                    ? 'border-[#006EF3] bg-blue-50/70 dark:bg-blue-950/40 text-[#012970] dark:text-blue-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold ${
                    sessionType === 'GROUP'
                      ? 'bg-[#006EF3] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                  }`}
                >
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-black">Group Session</div>
                  <div className="text-[11px] text-slate-500 font-normal">Cohort group live classroom</div>
                </div>
              </button>
            </div>
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
                  {selectedStudentIds.length === filteredStudents.length
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
            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
              {isLoadingStudents ? (
                <div className="p-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[#006EF3]" />
                  Loading enrolled students...
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No enrolled students matching your search.
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const id = student.userId || (student as any).studentId || (student as any).id;
                  const isSelected = selectedStudentIds.includes(id);

                  return (
                    <div
                      key={id}
                      onClick={() => toggleStudent(id)}
                      className={`flex items-center justify-between p-2.5 px-3 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-[#012970] dark:text-blue-200'
                          : 'hover:bg-white dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0">
                          {student.avatarUrl ? (
                            <img
                              src={student.avatarUrl}
                              alt=""
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            `${student.firstName?.[0] || 'S'}${student.lastName?.[0] || ''}`
                          )}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold leading-tight truncate">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {student.email}
                            {student.levelName && ` • ${student.levelName}`}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                          isSelected
                            ? 'bg-[#006EF3] border-[#006EF3] text-white'
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
                <span className="text-[11px] font-bold text-slate-500 mr-1">Selected:</span>
                {students
                  .filter((s) => selectedStudentIds.includes(s.userId))
                  .map((s) => (
                    <span
                      key={s.userId}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-[#012970] dark:bg-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
                    >
                      {s.firstName} {s.lastName}
                      <button
                        type="button"
                        onClick={() => toggleStudent(s.userId)}
                        className="hover:text-red-500 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <div className="text-xs text-slate-500">
            {selectedStudentIds.length} {sessionType === 'ONE_ON_ONE' ? 'student' : 'students'} will be invited
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => handleStartSession(true)}
              disabled={isSubmitting || selectedStudentIds.length === 0 || !title.trim()}
              className="bg-[#006EF3] hover:bg-[#0057c2] text-white font-bold gap-2 shadow-md shadow-blue-600/25"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting Room...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Start Live Session Now
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
