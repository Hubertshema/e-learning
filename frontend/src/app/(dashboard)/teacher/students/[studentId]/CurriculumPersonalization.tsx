import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layers, Plus, Minus, Loader2, BookOpen, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface CurriculumPersonalizationProps {
  studentId: string;
  studentName: string;
  levelName: string;
}

export function CurriculumPersonalization({ studentId, studentName, levelName }: CurriculumPersonalizationProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  useEffect(() => {
    fetchPersonalization();
  }, [studentId]);

  const fetchPersonalization = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<any>(`/teacher/students/${studentId}/personalization`);
      setData(res.data || res);
    } catch (err) {
      console.error(err);
      // Fallback mock data if endpoint doesn't exist yet
      setData({
        defaultCourses: [
          { 
            id: 'c1', title: 'Foundations of Grammar', isEnrolled: true,
            lessons: [
              { id: 'l1', title: 'Present Tense', status: 'DEFAULT' },
              { id: 'l2', title: 'Past Tense', status: 'RESTRICTED' },
            ]
          },
          { 
            id: 'c2', title: 'Basic Vocabulary', isEnrolled: true,
            lessons: [
              { id: 'l3', title: 'Greetings', status: 'DEFAULT' }
            ]
          }
        ],
        addedCourses: [
          { 
            id: 'c3', title: 'Advanced Speaking Practice',
            lessons: [
              { id: 'l4', title: 'Pronunciation', status: 'ADDED' }
            ]
          }
        ],
        restrictedCourses: [
          { id: 'c4', title: 'Basic Listening', lessons: [] }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCourse = (courseId: string) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId);
  };

  if (loading) {
    return (
      <Card className="p-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </Card>
    );
  }

  const renderCourse = (course: any, type: 'default' | 'added' | 'restricted') => {
    const isExpanded = expandedCourse === course.id;
    return (
      <div key={course.id} className="border-b last:border-b-0 bg-white">
        <div 
          className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => toggleCourse(course.id)}
        >
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
            <div>
              <div className={`font-medium text-sm ${type === 'restricted' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{course.title}</div>
              <div className="text-xs text-slate-500">
                {type === 'default' && `Inherited from ${levelName}`}
                {type === 'added' && `Added to curriculum`}
                {type === 'restricted' && `Restricted from curriculum`}
              </div>
            </div>
          </div>
          <div>
            {type === 'default' && (
              <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); }}>
                <Minus className="h-4 w-4 mr-1" /> Restrict
              </Button>
            )}
            {type === 'added' && (
              <Button size="sm" variant="ghost" className="text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); }}>
                Remove
              </Button>
            )}
            {type === 'restricted' && (
              <Button size="sm" variant="ghost" className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50" onClick={(e) => { e.stopPropagation(); }}>
                Restore
              </Button>
            )}
          </div>
        </div>
        
        {isExpanded && course.lessons && course.lessons.length > 0 && (
          <div className="bg-slate-50 p-3 pl-9 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Lessons in Course</h4>
            <div className="space-y-2">
              {course.lessons.map((lesson: any) => (
                <div key={lesson.id} className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                    <span className={`text-sm ${lesson.status === 'RESTRICTED' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                      {lesson.title}
                    </span>
                    {lesson.status === 'ADDED' && <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Added</Badge>}
                    {lesson.status === 'RESTRICTED' && <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">Restricted</Badge>}
                  </div>
                  <div>
                    {lesson.status !== 'RESTRICTED' ? (
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50">
                        Restrict
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                        Restore
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-600" />
            Curriculum Personalization for {studentName}
          </CardTitle>
          <p className="text-sm text-slate-500">
            Manage course and lesson overrides for this student. Base curriculum is inherited from <strong>{levelName}</strong>.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Default Curriculum */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Default Curriculum ({levelName})
              </h3>
            </div>
            <div className="border rounded-md bg-slate-50/50">
              {data?.defaultCourses?.map((course: any) => renderCourse(course, 'default'))}
              {(!data?.defaultCourses || data.defaultCourses.length === 0) && (
                <div className="p-4 text-sm text-slate-500 text-center">No default courses found.</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Added Courses */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-emerald-600" /> Personalized Additions
                </h3>
                <Button size="sm" variant="outline" className="text-indigo-600 h-8">Add Course</Button>
              </div>
              <div className="border rounded-md bg-emerald-50/20 border-emerald-100 overflow-hidden">
                {data?.addedCourses?.map((course: any) => renderCourse(course, 'added'))}
                {(!data?.addedCourses || data.addedCourses.length === 0) && (
                  <div className="p-4 text-sm text-slate-500 text-center bg-white">No additions.</div>
                )}
              </div>
            </div>

            {/* Restricted Courses */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Minus className="h-4 w-4 text-red-600" /> Personalized Restrictions
                </h3>
              </div>
              <div className="border rounded-md bg-red-50/20 border-red-100 overflow-hidden">
                {data?.restrictedCourses?.map((course: any) => renderCourse(course, 'restricted'))}
                {(!data?.restrictedCourses || data.restrictedCourses.length === 0) && (
                  <div className="p-4 text-sm text-slate-500 text-center bg-white">No restrictions.</div>
                )}
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
