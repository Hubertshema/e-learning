import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Loader2, UserMinus } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface LevelStudentsSectionProps {
  levelId: string;
  refreshTrigger: number;
  onEnrollClick: () => void;
}

export function LevelStudentsSection({ levelId, refreshTrigger, onEnrollClick }: LevelStudentsSectionProps) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (levelId) {
      fetchStudents();
    }
  }, [levelId, refreshTrigger]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<any>(`/levels/${levelId}/students`);
      setStudents(res.data || []);
    } catch (error) {
      console.error('Failed to fetch students', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (studentId: string) => {
    if (!confirm('Are you sure you want to unenroll this student from this level?')) return;
    
    setRemovingId(studentId);
    try {
      await apiClient.delete(`/levels/${levelId}/students/${studentId}`);
      fetchStudents();
    } catch (error) {
      console.error('Failed to unenroll student', error);
    } finally {
      setRemovingId(null);
    }
  };

  const filteredStudents = students.filter(s => 
    `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Enrolled Students</CardTitle>
        <Button size="sm" onClick={onEnrollClick}>
          Enroll Students
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm rounded-md border border-slate-300 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <div className="border rounded-md divide-y max-h-[400px] overflow-y-auto no-scrollbar bg-white">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center p-8 text-sm text-slate-500">
              {students.length === 0 ? 'No students enrolled in this level yet.' : 'No students matching your search.'}
            </div>
          ) : (
            filteredStudents.map(student => (
              <div key={student.id} className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
                    {student.firstName[0]}{student.lastName[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{student.firstName} {student.lastName}</div>
                    <div className="text-xs text-slate-500">{student.email}</div>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleRemove(student.id)}
                  disabled={removingId === student.id}
                >
                  {removingId === student.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
