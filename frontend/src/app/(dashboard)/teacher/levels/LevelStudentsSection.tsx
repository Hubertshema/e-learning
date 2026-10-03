import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Search, Loader2, UserMinus, AlertTriangle, UserX } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface LevelStudentsSectionProps {
  levelId: string;
  levelName?: string;
  refreshTrigger: number;
  onEnrollClick: () => void;
}

export function LevelStudentsSection({ levelId, levelName, refreshTrigger, onEnrollClick }: LevelStudentsSectionProps) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Interactive Modal State for Unenrolling
  const [studentToUnenroll, setStudentToUnenroll] = useState<any | null>(null);
  const [isUnenrolling, setIsUnenrolling] = useState(false);
  const [unenrollError, setUnenrollError] = useState<string | null>(null);

  useEffect(() => {
    if (levelId) {
      fetchStudents();
    }
  }, [levelId, refreshTrigger]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<any>(`/levels/${levelId}/students`);
      setStudents(Array.isArray(res) ? res : (res?.data || []));
    } catch (error) {
      console.error('Failed to fetch students', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmUnenroll = async () => {
    if (!studentToUnenroll) return;
    setIsUnenrolling(true);
    setUnenrollError(null);
    try {
      await apiClient.delete(`/levels/${levelId}/students/${studentToUnenroll.id}`);
      setStudentToUnenroll(null);
      fetchStudents();
    } catch (error: any) {
      console.error('Failed to unenroll student', error);
      setUnenrollError(error?.message || 'Failed to unenroll student. Please try again.');
    } finally {
      setIsUnenrolling(false);
    }
  };

  const filteredStudents = students.filter(s => 
    `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Card className="rounded-2xl border-slate-200/90 shadow-2xs overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-3 gap-2">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-slate-900">Enrolled Students</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">{students.length} students currently in this level</p>
          </div>
          <Button 
            size="sm" 
            onClick={onEnrollClick}
            className="h-8 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shrink-0"
          >
            Enroll Students
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="mb-3.5 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>
          
          <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 max-h-[420px] overflow-y-auto no-scrollbar bg-white">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-8 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                <span className="text-xs text-slate-400 font-medium">Loading enrolled students...</span>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center p-8 text-xs sm:text-sm text-slate-400">
                {students.length === 0 ? 'No students enrolled in this level yet.' : 'No students matching your search.'}
              </div>
            ) : (
              filteredStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 hover:bg-slate-50/80 transition-colors gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-700 border border-indigo-200/60 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      {(student.firstName?.[0] || 'S')}{(student.lastName?.[0] || '')}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{student.email}</div>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl shrink-0 transition-colors"
                    onClick={() => {
                      setUnenrollError(null);
                      setStudentToUnenroll(student);
                    }}
                    title={`Unenroll ${student.firstName} from ${levelName || 'level'}`}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Interactive Unenroll Confirmation Modal */}
      <Modal
        isOpen={!!studentToUnenroll}
        onClose={() => {
          if (!isUnenrolling) {
            setStudentToUnenroll(null);
            setUnenrollError(null);
          }
        }}
        title="Unenroll Student"
        description={`Remove student from ${levelName || 'this learning level'}`}
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUnenrolling}
              onClick={() => {
                setStudentToUnenroll(null);
                setUnenrollError(null);
              }}
              className="text-xs font-semibold h-8 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isUnenrolling}
              onClick={handleConfirmUnenroll}
              className="text-xs font-bold h-8 rounded-xl bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shadow-xs"
            >
              {isUnenrolling ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Unenrolling...</span>
                </>
              ) : (
                <>
                  <UserX className="h-3.5 w-3.5" />
                  <span>Confirm Unenroll</span>
                </>
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5 pt-1">
          {unenrollError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{unenrollError}</span>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0">
              {(studentToUnenroll?.firstName?.[0] || 'S')}{(studentToUnenroll?.lastName?.[0] || '')}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {studentToUnenroll?.firstName} {studentToUnenroll?.lastName}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{studentToUnenroll?.email}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 text-amber-800 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Confirm level unenrollment</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              Are you sure you want to unenroll this student from <strong>{levelName || 'this level'}</strong>? They will no longer have access to the curriculum assigned specifically to this level.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}

