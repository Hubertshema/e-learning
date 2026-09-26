'use client';

import React, { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Search, Star, CheckCircle2, AlertCircle, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useCachedData, clientCache } from '@/lib/cache';
import { CardGridSkeleton } from '@/components/ui/card-grid-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function SuperadminCoursesPage() {
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    data: courses,
    loading,
    isValidating,
    refresh,
    mutate,
  } = useCachedData<any[]>(
    'superadmin_courses',
    async () => {
      const data = await apiClient<any[]>('/superadmin/courses');
      return Array.isArray(data) ? data : [];
    },
    { ttl: 60000, revalidateOnFocus: true }
  );

  const handleTogglePublish = async (course: any) => {
    setActionLoading(course.id);
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
      mutate((prev) =>
        prev ? prev.map((c) => (c.id === course.id ? { ...c, isPublished: newPublishState } : c)) : []
      );
      clientCache.invalidate('superadmin_');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update course status' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFeature = async (course: any) => {
    setActionLoading(course.id);
    setMessage(null);
    const newFeatureState = !course.featured;
    try {
      await apiClient(`/superadmin/courses/${course.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ featured: newFeatureState }),
      });
      setMessage({
        type: 'success',
        text: `Course "${course.title}" is now ${newFeatureState ? 'Featured on home' : 'Standard'}.`,
      });
      mutate((prev) =>
        prev ? prev.map((c) => (c.id === course.id ? { ...c, featured: newFeatureState } : c)) : []
      );
      clientCache.invalidate('superadmin_');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update feature status' });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredCourses = (courses || []).filter((c) =>
    `${c.title} ${c.category} ${c.level} ${c.teacher?.user?.firstName || ''} ${c.teacher?.user?.lastName || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">Curriculum Registry</Badge>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Global Course Catalog Management
          </h1>
          <p className="text-xs text-slate-500">
            Publish courses across the platform, mark featured tracks, and monitor active enrollments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refresh()} disabled={isValidating} className="h-8">
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isValidating ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search courses by title, category, teacher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-800 dark:bg-slate-900"
        />
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
      {loading && !courses ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3.5 w-1/3" />
            </Card>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <Card className="p-12 text-center text-xs text-slate-400">
          <BookOpen className="mx-auto h-8 w-8 text-slate-300 mb-2" />
          No courses found matching your query.
        </Card>
      ) : (
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
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleFeature(course)}
                    isLoading={actionLoading === course.id}
                    className="text-xs h-8"
                  >
                    <Star className={`mr-1 h-3.5 w-3.5 ${course.featured ? 'fill-amber-500 text-amber-500' : ''}`} />
                    {course.featured ? 'Unfeature' : 'Feature'}
                  </Button>

                  <Button
                    variant={course.isPublished ? 'outline' : 'gradient'}
                    size="sm"
                    onClick={() => handleTogglePublish(course)}
                    isLoading={actionLoading === course.id}
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
      )}
    </div>
  );
}
