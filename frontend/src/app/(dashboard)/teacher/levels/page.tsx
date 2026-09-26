'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FolderTree, BookOpen, Users, Settings, PlayCircle, ChevronDown, LayoutDashboard
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useCachedData } from '@/lib/cache';
import { AssignCoursesModal } from './AssignCoursesModal';
import { EnrollStudentsModal } from './EnrollStudentsModal';
import { LevelStudentsSection } from './LevelStudentsSection';

function ExpandableCourseCard({ course }: { course: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-200 rounded-md bg-white overflow-hidden shadow-sm">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center bg-slate-100 text-slate-600 rounded-md">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">{course.title}</h4>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <PlayCircle className="h-3 w-3" /> {course.lessons || 0} Lessons
            </div>
          </div>
        </div>
        <div className="text-slate-400">
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>
      
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 p-4">
          <h5 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <LayoutDashboard className="h-3.5 w-3.5" /> Course Curriculum
          </h5>
          
          {course.lessons === 0 || !course.lessons ? (
            <div className="text-sm text-slate-500 text-center py-4 bg-white border border-slate-200 border-dashed rounded-md">
              No lessons available.
            </div>
          ) : (
            <div className="space-y-1">
              {Array.from({ length: course.lessons || 0 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-white border border-slate-100 rounded-md text-sm text-slate-700">
                  <span className="font-medium text-slate-500 text-xs w-4">{i + 1}.</span>
                  Lesson {i + 1}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TeacherLevelsPage() {
  const { data: levels, loading, refresh } = useCachedData<any[]>(
    'teacher_levels_with_courses',
    async () => {
      const res = await apiClient.get<any>('/levels?include=courses');
      return (res as any)?.data || res || [];
    },
    { ttl: 30_000, initialData: [] }
  );

  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const safeLevels = levels || [];

  useEffect(() => {
    if (safeLevels.length > 0 && !selectedLevelId) {
      setSelectedLevelId(safeLevels[0].id);
    }
  }, [safeLevels, selectedLevelId]);

  const selectedLevel = safeLevels.find(l => l.id === selectedLevelId) || null;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Learning Levels</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage academic levels, configure curriculums, and enroll students.
          </p>
        </div>
      </div>

      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto no-scrollbar">
        {loading && safeLevels.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">Loading levels...</div>
        ) : (
          safeLevels.map((level) => {
            const isSelected = selectedLevelId === level.id;
            return (
              <button
                key={level.id}
                onClick={() => setSelectedLevelId(level.id)}
                className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isSelected 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {level.name}
              </button>
            );
          })
        )}
      </div>

      {selectedLevel && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-md flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Students</p>
                  <p className="text-2xl font-bold text-slate-900">{selectedLevel.students || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-md flex items-center justify-center">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Courses</p>
                  <p className="text-2xl font-bold text-slate-900">{selectedLevel.courses?.length || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center">
                  <PlayCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Lessons</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {selectedLevel.courses?.reduce((acc: number, curr: any) => acc + (curr.lessons || 0), 0) || 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LevelStudentsSection 
              levelId={selectedLevel.id} 
              refreshTrigger={refreshTrigger}
              onEnrollClick={() => setIsEnrollModalOpen(true)}
            />

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">Curriculum</CardTitle>
                  <CardDescription>Courses assigned to this level</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => setIsAssignModalOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" /> Configure
                </Button>
              </CardHeader>
              <CardContent>
                {selectedLevel.courses?.length === 0 ? (
                  <div className="text-center py-8 px-4 border border-slate-200 border-dashed rounded-md bg-slate-50">
                    <p className="text-sm text-slate-500 mb-4">No courses are assigned to this level yet.</p>
                    <Button variant="secondary" onClick={() => setIsAssignModalOpen(true)}>
                      Assign Courses
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedLevel.courses?.map((course: any) => (
                      <ExpandableCourseCard key={course.id} course={course} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <AssignCoursesModal 
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        level={selectedLevel}
        onSuccess={() => refresh()}
      />
      
      <EnrollStudentsModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        level={selectedLevel}
        onSuccess={() => {
          refresh();
          setRefreshTrigger(prev => prev + 1);
        }}
      />
    </div>
  );
}
