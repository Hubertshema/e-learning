'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Layers,
  Plus,
  BookOpen,
  ArrowLeft,
  Trash2,
  Edit2,
  CheckCircle2,
  Video,
  FileText,
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Lesson {
  id: string;
  title: string;
  skill: string;
  estimatedMinutes: number;
  orderIndex: number;
  isPublished: boolean;
  sections: any[];
}

interface Unit {
  id: string;
  title: string;
  description?: string;
  orderIndex: number;
  lessons: Lesson[];
}

interface CourseData {
  id: string;
  title: string;
  level: string;
  units: Unit[];
}

export default function TeacherCourseUnitsBuilderPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const router = useRouter();

  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [newUnitDesc, setNewUnitDesc] = useState('');
  const [creatingUnit, setCreatingUnit] = useState(false);

  const fetchCourseUnits = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<CourseData>(`/teacher/courses/${courseId}`);
      if (res) {
        setCourse(res);
      }
    } catch (err) {
      console.error('Failed to load course units', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseUnits();
  }, [courseId]);

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitTitle.trim()) return;

    try {
      setCreatingUnit(true);
      await apiClient.post(`/teacher/courses/${courseId}/units`, {
        title: newUnitTitle,
        description: newUnitDesc,
        orderIndex: (course?.units.length || 0) + 1,
      });

      setShowAddUnitModal(false);
      setNewUnitTitle('');
      setNewUnitDesc('');
      fetchCourseUnits();
    } catch (err) {
      alert('Failed to create unit.');
    } finally {
      setCreatingUnit(false);
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm('Are you sure you want to delete this unit and all its lessons?')) return;
    try {
      await apiClient.delete(`/teacher/units/${unitId}`);
      fetchCourseUnits();
    } catch (err) {
      alert('Failed to delete unit.');
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;
    try {
      await apiClient.delete(`/teacher/lessons/${lessonId}`);
      fetchCourseUnits();
    } catch (err) {
      alert('Failed to delete lesson.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-100 rounded animate-pulse" />
        <Card className="h-96 animate-pulse bg-slate-100" />
      </div>
    );
  }

  if (!course) {
    return (
      <Card className="p-12 text-center space-y-3">
        <p className="text-xs text-slate-500">Course not found.</p>
        <Link href="/teacher/courses">
          <Button variant="outline" size="sm">Back to Courses</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/teacher/courses">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="h-6 w-6 text-primary-600" /> Curriculum Studio: {course.title}
            </h1>
            <p className="text-xs text-slate-500">
              Structure modules into units, design interactive 7-skill lessons, and configure activities.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/teacher/courses/${courseId}/preview`}>
            <Button variant="outline" size="sm">
              <BookOpen className="h-3.5 w-3.5 mr-1" /> Student Preview
            </Button>
          </Link>
          <Button variant="gradient" size="sm" onClick={() => setShowAddUnitModal(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Unit
          </Button>
        </div>
      </div>

      {/* Units & Lessons Accordion / List */}
      {course.units.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-950">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Curriculum is Empty</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Get started by adding your first unit (e.g. Unit 1: Foundations & Introductions).
          </p>
          <Button variant="gradient" size="sm" onClick={() => setShowAddUnitModal(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Create Unit 1
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {course.units.map((unit, uIdx) => (
            <Card key={unit.id} className="overflow-hidden border-slate-200 dark:border-slate-800">
              {/* Unit Header Bar */}
              <div className="bg-slate-50 dark:bg-slate-900/80 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="primary" className="text-xs">
                      Unit {uIdx + 1}
                    </Badge>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">{unit.title}</h2>
                  </div>
                  {unit.description && (
                    <p className="text-xs text-slate-500 mt-1">{unit.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/teacher/courses/${courseId}/lessons/create?unitId=${unit.id}`}>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Plus className="h-3 w-3 mr-1" /> Add Lesson
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteUnit(unit.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Lessons within Unit */}
              <div className="p-4 space-y-2">
                {unit.lessons.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    No lessons created in this unit yet. Click &quot;Add Lesson&quot; above to create one.
                  </p>
                ) : (
                  unit.lessons.map((lesson, lIdx) => (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950 font-bold text-xs">
                          {lIdx + 1}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {lesson.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[10px]">
                              {lesson.skill}
                            </Badge>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {lesson.estimatedMinutes} mins
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteLesson(lesson.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Unit Modal */}
      {showAddUnitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Create New Curriculum Unit
            </h3>

            <form onSubmit={handleCreateUnit} className="space-y-3">
              <Input
                label="Unit Title"
                placeholder="e.g. Unit 3: Professional Business Inquiries"
                value={newUnitTitle}
                onChange={(e) => setNewUnitTitle(e.target.value)}
                required
              />

              <Input
                label="Unit Objective / Summary (Optional)"
                placeholder="Master email drafting, telephone etiquette, and workplace vocabulary..."
                value={newUnitDesc}
                onChange={(e) => setNewUnitDesc(e.target.value)}
              />

              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="outline" onClick={() => setShowAddUnitModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" isLoading={creatingUnit}>
                  Create Unit
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
