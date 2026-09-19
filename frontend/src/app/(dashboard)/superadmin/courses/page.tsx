'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Search, Star, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';

export default function SuperadminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fallbackCourses = [
    {
      id: 'c-1',
      title: 'A2 Elementary English: Practical Everyday & Workplace Fluency',
      category: 'Communication English',
      level: 'A2',
      price: 49.99,
      isPublished: true,
      featured: true,
      createdAt: new Date().toISOString(),
      teacher: { user: { firstName: 'Sarah', lastName: 'Jenkins', email: 'teacher@platform.com' } },
      _count: { units: 1, enrollments: 42, classes: 2 },
    },
    {
      id: 'c-2',
      title: 'B1 Intermediate: English for IT & Tech Professionals',
      category: 'Professional English',
      level: 'B1',
      price: 65.0,
      isPublished: true,
      featured: false,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      teacher: { user: { firstName: 'David', lastName: 'Mugisha', email: 'david@platform.com' } },
      _count: { units: 3, enrollments: 28, classes: 1 },
    },
    {
      id: 'c-3',
      title: 'English for Rwanda: Everyday Public & Workplace Communication',
      category: 'English for Rwanda',
      level: 'A1',
      price: 35.0,
      isPublished: false,
      featured: false,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      teacher: { user: { firstName: 'Jean-Claude', lastName: 'Habimana', email: 'jc@platform.com' } },
      _count: { units: 2, enrollments: 0, classes: 0 },
    },
  ];

  const fetchCourses = async () => {
    try {
      const data = await apiClient<any[]>('/superadmin/courses');
      if (Array.isArray(data) && data.length > 0) {
        setCourses(data);
      } else {
        setCourses(fallbackCourses);
      }
    } catch {
      setCourses(fallbackCourses);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleTogglePublish = async (course: any) => {
    setActionLoading(true);
    setMessage(null);
    const newPublishState = !course.isPublished;
    try {
      await apiClient(`/superadmin/courses/${course.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublished: newPublishState }),
      });
      setMessage({
        type: 'success',
        text: `Course "${course.title}" is now ${newPublishState ? 'Published' : 'Draft/Unpublished'}.`,
      });
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, isPublished: newPublishState } : c))
      );
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update course status' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFeature = async (course: any) => {
    setActionLoading(true);
    setMessage(null);
    const newFeatureState = !course.featured;
    try {
      await apiClient(`/superadmin/courses/${course.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ featured: newFeatureState }),
      });
      setMessage({
        type: 'success',
        text: `Course "${course.title}" ${newFeatureState ? 'featured on homepage' : 'removed from featured'}.`,
      });
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, featured: newFeatureState } : c))
      );
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update featured status' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCourses = courses.filter((c) =>
    `${c.title} ${c.category} ${c.teacher?.user?.firstName || ''} ${c.teacher?.user?.lastName || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">Course Oversight</Badge>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Global Course Moderation
          </h1>
          <p className="text-xs text-slate-500">
            Publish, unpublish, or feature courses submitted by instructors across all CEFR levels.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search courses by title, category, teacher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-800 dark:bg-slate-900"
          />
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-xs font-medium ${
            message.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
              : 'border-destructive/20 bg-destructive/10 text-destructive'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Courses List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="p-6 transition-all hover:border-slate-300 dark:hover:border-slate-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-2">
                  <Badge variant="indigo">{course.level}</Badge>
                  <span className="text-xs font-semibold text-slate-500">{course.category}</span>
                  {course.isPublished ? (
                    <Badge variant="success">Published</Badge>
                  ) : (
                    <Badge variant="warning">Draft / Hidden</Badge>
                  )}
                  {course.featured && (
                    <Badge variant="indigo" className="bg-amber-50 text-amber-700 border-amber-200">
                      <Star className="mr-1 h-3 w-3 fill-current" />
                      Featured
                    </Badge>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {course.title}
                </h3>

                <p className="text-xs text-slate-500">
                  Instructor:{' '}
                  <strong>
                    {course.teacher?.user?.firstName} {course.teacher?.user?.lastName}
                  </strong>{' '}
                  ({course.teacher?.user?.email}) • Created {formatDate(course.createdAt)}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-1">
                  <span>Units: <strong>{course._count?.units || 0}</strong></span>
                  <span>Active Enrollments: <strong>{course._count?.enrollments || 0}</strong></span>
                  <span>Price: <strong className="text-primary-600">{formatPrice(course.price)}</strong></span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleFeature(course)}
                  isLoading={actionLoading}
                  className="text-xs h-8"
                >
                  <Star className={`mr-1 h-3.5 w-3.5 ${course.featured ? 'fill-amber-500 text-amber-500' : ''}`} />
                  {course.featured ? 'Unfeature' : 'Feature'}
                </Button>

                <Button
                  variant={course.isPublished ? 'outline' : 'gradient'}
                  size="sm"
                  onClick={() => handleTogglePublish(course)}
                  isLoading={actionLoading}
                  className="text-xs h-8"
                >
                  {course.isPublished ? (
                    <>
                      <EyeOff className="mr-1 h-3.5 w-3.5" />
                      Unpublish
                    </>
                  ) : (
                    <>
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      Publish Live
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
