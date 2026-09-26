import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Search, Loader2, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  levelId: string | null;
}

interface EnrollStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: { id: string; name: string } | null;
  onSuccess: () => void;
}

export function EnrollStudentsModal({ isOpen, onClose, level, onSuccess }: EnrollStudentsModalProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && level) {
      fetchStudents();
      setSelectedIds(new Set());
      setSearch('');
    }
  }, [isOpen, level]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ data: Student[] }>('/users/students');
      setStudents(res.data || []);
    } catch (error) {
      console.error('Failed to fetch students', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleEnroll = async () => {
    if (!level || selectedIds.size === 0) return;
    
    setEnrolling(true);
    try {
      await apiClient.post(`/levels/${level.id}/enroll`, {
        studentIds: Array.from(selectedIds)
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to enroll students', error);
    } finally {
      setEnrolling(false);
    }
  };

  const selectAllFiltered = () => {
    const newSelected = new Set(selectedIds);
    filteredStudents.forEach(s => {
      if (s.levelId !== level?.id) {
        newSelected.add(s.id);
      }
    });
    setSelectedIds(newSelected);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  if (!level) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title={`Enroll Students in ${level.name}`}
      description={`Select students to assign them to ${level.name}. They will automatically receive the default curriculum for this level.`}
      size="md"
      footer={
        <div className="flex w-full justify-between items-center px-2">
          <div className="text-sm font-medium text-slate-500">
            {selectedIds.size > 0 ? (
              <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                {selectedIds.size} student{selectedIds.size !== 1 ? 's' : ''} selected
              </span>
            ) : (
              '0 students selected'
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={enrolling} className="rounded-xl border-slate-200 dark:border-slate-700">
              Cancel
            </Button>
            <Button 
              onClick={handleEnroll} 
              disabled={enrolling || selectedIds.size === 0} 
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md transition-all"
            >
              {enrolling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {enrolling ? 'Enrolling...' : `Enroll ${selectedIds.size} Students`}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 py-2">
        <div className="flex gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={selectAllFiltered}>
              Select All
            </Button>
            <Button variant="outline" className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={clearSelection}>
              Clear
            </Button>
          </div>
        </div>

        <div className="max-h-[350px] overflow-y-auto border border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/30 backdrop-blur-md rounded-2xl no-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              <p className="text-sm text-slate-500 mt-4">Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center p-12">
              <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No students found.</p>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your search terms.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredStudents.map((student, index) => {
                const isEnrolled = student.levelId === level.id;
                const isSelected = selectedIds.has(student.id);

                return (
                  <li 
                    key={student.id} 
                    className={`flex items-center p-4 gap-4 transition-all duration-200 ${isEnrolled ? 'opacity-60 bg-slate-50/50 dark:bg-slate-800/30' : 'hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 cursor-pointer'} ${isSelected ? 'bg-indigo-50/80 dark:bg-indigo-900/20' : ''}`}
                    onClick={() => !isEnrolled && toggleSelect(student.id)}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        checked={isEnrolled || isSelected} 
                        disabled={isEnrolled}
                        onChange={() => {}} // handled by onClick on li
                        className={`h-5 w-5 rounded-md border-slate-300 dark:border-slate-700 ${isEnrolled ? 'text-slate-400' : 'text-indigo-600 focus:ring-indigo-600/50 cursor-pointer'}`}
                      />
                    </div>
                    
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/50 dark:to-indigo-800/30 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-300 text-xs shadow-sm">
                      {student.firstName[0]}{student.lastName[0]}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-xs font-medium text-slate-500 truncate">{student.email}</div>
                    </div>
                    
                    {isEnrolled && (
                      <span className="inline-flex items-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-600/20 dark:ring-emerald-500/20">
                        Enrolled
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
