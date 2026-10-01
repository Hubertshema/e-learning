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
      const res = await apiClient.get<any>('/users/students');
      setStudents(Array.isArray(res) ? res : (res?.data || []));
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
              <span className="text-[#006EF3] font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#006EF3]" />
                {selectedIds.size} student{selectedIds.size !== 1 ? 's' : ''} selected
              </span>
            ) : (
              '0 students selected'
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={enrolling} className="rounded-xl border-slate-200">
              Cancel
            </Button>
            <Button 
              onClick={handleEnroll} 
              disabled={enrolling || selectedIds.size === 0} 
              className="rounded-xl bg-[#006EF3] hover:bg-[#0058c4] text-white shadow-md transition-all font-semibold"
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
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-[#006EF3] transition-colors" />
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#F3F7FC]/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006EF3]/30 focus:border-[#006EF3] transition-all"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl border-slate-200 bg-white hover:bg-slate-50" onClick={selectAllFiltered}>
              Select All
            </Button>
            <Button variant="outline" className="rounded-xl border-slate-200 bg-white hover:bg-slate-50" onClick={clearSelection}>
              Clear
            </Button>
          </div>
        </div>

        <div className="max-h-[350px] overflow-y-auto border border-slate-200/80 bg-white rounded-2xl no-scrollbar shadow-inner">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#006EF3]" />
              <p className="text-sm text-slate-500 mt-4">Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center p-12">
              <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-700">No students found.</p>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your search terms.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filteredStudents.map((student, index) => {
                const isEnrolled = student.levelId === level.id;
                const isSelected = selectedIds.has(student.id);

                return (
                  <li 
                    key={student.id} 
                    className={`flex items-center p-4 gap-4 transition-all duration-200 ${isEnrolled ? 'opacity-60 bg-slate-50/50' : 'hover:bg-blue-50/50 cursor-pointer'} ${isSelected ? 'bg-blue-50/80' : ''}`}
                    onClick={() => !isEnrolled && toggleSelect(student.id)}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        checked={isEnrolled || isSelected} 
                        disabled={isEnrolled}
                        onChange={() => {}} // handled by onClick on li
                        className={`h-5 w-5 rounded-md border-slate-300 ${isEnrolled ? 'text-slate-400' : 'text-[#006EF3] focus:ring-[#006EF3]/50 cursor-pointer'}`}
                      />
                    </div>
                    
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-100 to-[#F3F7FC] flex items-center justify-center font-bold text-[#012970] text-xs shadow-sm">
                      {student.firstName[0]}{student.lastName[0]}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-xs font-medium text-slate-500 truncate">{student.email}</div>
                    </div>
                    
                    {isEnrolled && (
                      <span className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#012970] ring-1 ring-inset ring-blue-200">
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
