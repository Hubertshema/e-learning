'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Clock,
  Users,
  Search,
  ArrowRight,
  Sparkles,
  Award,
  Layers,
  CheckCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface PublicCourse {
  id: string;
  title: string;
  description: string;
  level: string;
  category: string;
  currency: string;
  isPublished: boolean;
  durationDays: number;
  instructor: {
    name: string;
    avatarUrl?: string | null;
  };
  lessonsCount: number;
  studentsCount: number;
  createdAt: string;
}

// Simple memory cache for fast instantaneous page transitions
const courseCache = new Map<string, { data: PublicCourse[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default function CoursesPage() {
  const [courses, setCourses] = useState<PublicCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const cefrLevels = [
    { code: 'ALL', label: 'All Levels' },
    { code: 'PRE_A1', label: 'Pre-A1' },
    { code: 'A1', label: 'A1 Beginner' },
    { code: 'A2', label: 'A2 Elementary' },
    { code: 'B1', label: 'B1 Intermediate' },
    { code: 'B2', label: 'B2 Upper-Int' },
    { code: 'C1', label: 'C1 Advanced' },
    { code: 'C2', label: 'C2 Mastery' },
  ];

  useEffect(() => {
    const cacheKey = `courses_${selectedLevel}_${searchQuery.trim().toLowerCase()}`;

    // 1. Check in-memory / sessionStorage cache
    let cachedData: PublicCourse[] | null = null;
    const memoryHit = courseCache.get(cacheKey);
    if (memoryHit && Date.now() - memoryHit.timestamp < CACHE_TTL) {
      cachedData = memoryHit.data;
    } else if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem(cacheKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Date.now() - parsed.timestamp < CACHE_TTL) {
            cachedData = parsed.data;
            courseCache.set(cacheKey, parsed);
          }
        }
      } catch (_) {}
    }

    if (cachedData) {
      setCourses(cachedData);
      setLoading(false);
    } else {
      setLoading(true);
    }

    async function fetchCourses() {
      try {
        const queryParams = new URLSearchParams();
        if (selectedLevel !== 'ALL') {
          queryParams.append('level', selectedLevel);
        }
        if (searchQuery.trim()) {
          queryParams.append('search', searchQuery.trim());
        }

        const endpoint = `/public/courses?${queryParams.toString()}`;
        const data = await apiClient<PublicCourse[]>(endpoint, {
          requiresAuth: false,
        });

        if (Array.isArray(data)) {
          setCourses(data);
          const cacheEntry = { data, timestamp: Date.now() };
          courseCache.set(cacheKey, cacheEntry);
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
            } catch (_) {}
          }
        }
      } catch (error) {
        if (!cachedData) {
          setCourses([]);
        }
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchCourses();
    }, cachedData ? 0 : 150);

    return () => clearTimeout(timer);
  }, [selectedLevel, searchQuery]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-10 pb-20">
      {/* Header Banner */}
      <div className="space-y-4 text-left max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#2e3339]">
          Structured CEFR English Courses
        </h1>
        <p className="text-base text-[#5a5e63] leading-relaxed">
          Master unhesitating English with standardized curricula designed to meet international CEFR benchmarks, complete with certified educator reviews and verifiable diplomas.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#5a5e63]" />
          <input
            type="text"
            placeholder="Search course title or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#e2ebe2] bg-white py-2.5 pl-10 pr-4 text-sm text-[#2e3339] placeholder-[#5a5e63] shadow-sm transition focus:border-[#315b36] focus:outline-none focus:ring-1 focus:ring-[#315b36]"
          />
        </div>

        {/* CEFR Level Filter Pills */}
        <div className="flex flex-wrap gap-2 pt-2">
          {cefrLevels.map((lvl) => {
            const isSelected = selectedLevel === lvl.code;
            return (
              <button
                key={lvl.code}
                onClick={() => setSelectedLevel(lvl.code)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                  isSelected
                    ? 'bg-[#315b36] text-white shadow-sm'
                    : 'border border-[#e2ebe2] bg-white text-[#2e3339] hover:bg-[#eff4ec]'
                }`}
              >
                {lvl.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Course List Section with Rich Skeleton Loading */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[#e2ebe2] bg-white p-6 shadow-sm animate-pulse space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-6 w-20 rounded-lg bg-[#eff4ec]" />
                  <div className="h-4 w-28 rounded-md bg-[#eff4ec]" />
                </div>
                <div className="h-6 w-4/5 rounded-lg bg-[#e2ebe2]" />
                <div className="space-y-1.5 pt-1">
                  <div className="h-3.5 w-full rounded bg-[#eff4ec]" />
                  <div className="h-3.5 w-5/6 rounded bg-[#eff4ec]" />
                  <div className="h-3.5 w-2/3 rounded bg-[#eff4ec]" />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-[#e2ebe2]">
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-4 w-24 rounded bg-[#eff4ec]" />
                  <div className="h-4 w-20 rounded bg-[#eff4ec]" />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="space-y-1">
                    <div className="h-3 w-14 rounded bg-[#eff4ec]" />
                    <div className="h-4 w-28 rounded bg-[#e2ebe2]" />
                  </div>
                  <div className="space-y-1 text-right">
                    <div className="h-3 w-14 rounded bg-[#eff4ec] ml-auto" />
                    <div className="h-6 w-20 rounded bg-[#e2ebe2] ml-auto" />
                  </div>
                </div>
                <div className="h-10 w-full rounded-xl bg-[#e2ebe2]" />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 pt-2">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="flex flex-col justify-between overflow-hidden border border-[#e2ebe2] bg-white transition-all hover:border-[#315b36] hover:shadow-md rounded-2xl p-0"
            >
              <CardContent className="p-6 space-y-4 flex flex-col justify-between h-full">
                <div className="space-y-3">
                  {/* Top Level and Category */}
                  <div className="flex items-center justify-between">
                    <span className="inline-block rounded-lg bg-[#eff4ec] text-[#315b36] border border-[#e2ebe2] px-3 py-1 text-xs font-bold">
                      {course.level.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-semibold text-[#5a5e63]">
                      {course.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold leading-snug text-[#2e3339] line-clamp-2">
                    {course.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-[#5a5e63] leading-relaxed line-clamp-3">
                    {course.description}
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-[#e2ebe2]">
                  {/* Stats Strip */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-[#5a5e63]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#315b36]" />
                      <span>{course.durationDays} Days Access</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-[#315b36]" />
                      <span>{course.lessonsCount || 16} Lessons</span>
                    </div>
                  </div>

                  {/* Teacher Row */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[11px] text-[#5a5e63] block font-medium">Instructor</span>
                      <span className="text-xs font-bold text-[#2e3339] truncate block">
                        {course.instructor?.name || 'LinguaChris Faculty'}
                      </span>
                    </div>
                    <span className="rounded-full bg-[#eff4ec] px-2.5 py-0.5 text-[11px] font-semibold text-[#315b36]">
                      {course.level}
                    </span>
                  </div>

                  {/* Action Button */}
                  <Link href={`/register?role=student&course=${course.id}`} className="block w-full">
                    <Button className="w-full rounded-xl bg-[#315b36] text-white hover:bg-[#254629] text-xs font-bold py-2.5">
                      <span>Enroll in Syllabus</span>
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 rounded-3xl border border-[#e2ebe2] bg-[#eff4ec]/30 space-y-4">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-white border border-[#e2ebe2] text-[#315b36] shadow-sm">
            <Layers className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-bold text-[#2e3339]">
            No Courses Found
          </h3>
          <p className="text-sm text-[#5a5e63] max-w-md mx-auto leading-relaxed">
            There are currently no courses matching the selected level or search filter. Try selecting "All Levels" or clearing your search.
          </p>
          <div className="pt-2">
            <Button
              onClick={() => {
                setSelectedLevel('ALL');
                setSearchQuery('');
              }}
              variant="outline"
              className="rounded-xl border-[#e2ebe2] text-[#315b36] hover:bg-[#eff4ec] text-xs font-bold px-5"
            >
              Reset Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
