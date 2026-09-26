import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { Loader2, Plus, Trash2, BookOpen, Check } from 'lucide-react';

interface AssignCoursesModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: any;
  onSuccess: () => void;
}

export function AssignCoursesModal({ isOpen, onClose, level, onSuccess }: AssignCoursesModalProps) {
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingCourseId, setAddingCourseId] = useState<string | null>(null);
  const [removingCourseId, setRemovingCourseId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCourses();
    }
  }, [isOpen]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<any>('/courses');
      setAllCourses(res || []);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async (courseId: string) => {
    setAddingCourseId(courseId);
    try {
      await apiClient.post(`/levels/${level.id}/courses`, {
        courseId,
        maxStudents: 30,
        isActive: true,
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to add course:', error);
    } finally {
      setAddingCourseId(null);
    }
  };

  const handleRemoveCourse = async (courseId: string) => {
    setRemovingCourseId(courseId);
    try {
      await apiClient.delete(`/levels/${level.id}/courses/${courseId}`);
      onSuccess();
    } catch (error) {
      console.error('Failed to remove course:', error);
    } finally {
      setRemovingCourseId(null);
    }
  };

  const currentCourseIds = new Set(level?.courses?.map((c: any) => c.id) || []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Configure ${level?.name} Courses`}
      description="Select courses to add or remove from this level. Students enrolled in this level will have default access to these courses."
      size="lg"
      footer={
        <div className="flex w-full justify-end px-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800">
            Done configuring
          </Button>
        </div>
      }
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar py-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
            <span className="text-sm font-medium">Loading available courses...</span>
          </div>
        ) : allCourses.length === 0 ? (
          <div className="text-center p-12 text-slate-500 text-sm">
            <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <BookOpen className="h-5 w-5 text-slate-400" />
            </div>
            <p className="font-medium text-slate-700 dark:text-slate-300">No courses available.</p>
            <p className="text-xs mt-1">Create courses first to assign them here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allCourses.map((course, index) => {
              const isAssigned = currentCourseIds.has(course.id);
              const isAdding = addingCourseId === course.id;
              const isRemoving = removingCourseId === course.id;

              return (
                <div 
                  key={course.id} 
                  className={`flex flex-col p-4 border rounded-2xl transition-all duration-300 ${
                    isAssigned 
                      ? 'border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-900/10 shadow-sm' 
                      : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-md'
                  }`}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${isAssigned ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{course.title}</h4>
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1">
                    {course.description || 'No description provided for this course.'}
                  </p>
                  
                  <div className="mt-auto">
                    {isAssigned ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full rounded-xl border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 dark:border-red-900/30 dark:hover:bg-red-900/20"
                        onClick={() => handleRemoveCourse(course.id)}
                        disabled={isRemoving}
                      >
                        {isRemoving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" /> Remove from Level
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700"
                        onClick={() => handleAddCourse(course.id)}
                        disabled={isAdding}
                      >
                        {isAdding ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" /> Assign Course
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
