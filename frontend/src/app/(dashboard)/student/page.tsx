'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import {
  Search,
  Bell,
  Play,
  ArrowRight,
  Clock,
  BookOpen,
  Video,
  MoreVertical,
  ChevronDown,
  TrendingUp,
  Sparkles,
  Award,
  Users,
  Calendar,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface DashboardData {
  profile: {
    id: string;
    currentLevel: string;
    targetLevel?: string;
    nativeLanguage?: string;
    learningGoals: string[];
    user: {
      firstName: string;
      lastName: string;
      email: string;
      avatarUrl?: string;
    };
  };
  stats: {
    activeCoursesCount: number;
    totalEnrolledCount: number;
    completedCoursesCount: number;
    completedLessonsCount: number;
    studyTimeMinutes: number;
    studyTimeHours: number;
    streakDays: number;
    totalActivityHoursText: string;
    overallProgressPercentage: number;
    growthPercentage: number;
    activityDots: boolean[];
    goalDistance: number;
    learnTracking: {
      month: number;
      week: number;
      day: number;
    };
    hasTakenPlacementTest: boolean;
    latestPlacementScore: number | null;
    recommendedLevel: string | null;
  };
  inProgressCourse?: {
    id: string;
    status: string;
    totalUnitsCount: number;
    totalLessonsCount: number;
    completedLessonsCount: number;
    progressPercentage: number;
    totalDurationMinutes: number;
    course: {
      id: string;
      title: string;
      level: string;
      thumbnailUrl?: string;
      teacher?: {
        user: {
          firstName: string;
          lastName: string;
          avatarUrl?: string;
        };
      };
      units: Array<{
        id: string;
        title: string;
        lessons: Array<{
          id: string;
          title: string;
          skill: string;
          estimatedMinutes: number;
        }>;
      }>;
    };
  } | null;
  activeEnrollments: Array<any>;
  studyStatistics: Array<{
    day: string;
    activeHours: number;
    goalHours: number;
    inactiveHours: number;
  }>;
  topMentors: Array<{
    id: string;
    name: string;
    role: string;
    avatarUrl?: string;
    courseCount: number;
  }>;
}

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressPeriod, setProgressPeriod] = useState<'Month' | 'Week' | 'All Time'>('Month');
  const [statsPeriod, setStatsPeriod] = useState<'Weekly' | 'Monthly'>('Weekly');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(3); // Wednesday highlighted

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<DashboardData>('/student/dashboard');
        if (res) {
          setData(res);
        }
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const studentName = data?.profile?.user?.firstName || user?.firstName || 'Student';
  const activeCourse = data?.inProgressCourse || (data?.activeEnrollments && data.activeEnrollments[0]) || null;
  const stats = data?.stats;
  const studyStats = data?.studyStatistics || [];
  const mentors = data?.topMentors || [];
  const activityDots = stats?.activityDots || Array(21).fill(false);

  return (
    <div className="min-h-full bg-[#eff4ec] p-4 sm:p-6 lg:p-8 space-y-6 text-[#2e3339]">
      {/* =========================================================================
          TOP HEADER GREETING BAR
      ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg bg-white px-6 py-5 shadow-sm border border-[#e2ebe2]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#2e3339] flex items-center gap-2">
            Welcome Back <span className="text-2xl">👋</span>
          </h1>
          <p className="text-sm font-medium text-[#5a5e63] mt-1">
            Let's learn something new today, {studentName}!
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="relative hidden md:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7ba27a]" />
            <input
              type="text"
              placeholder="Search syllabus, courses..."
              className="w-56 lg:w-64 rounded-md border border-[#e2ebe2] bg-[#eff4ec]/50 pl-10 pr-4 py-2 text-sm text-[#2e3339] placeholder:text-[#5a5e63] focus:outline-none focus:border-[#315b36]"
            />
          </div>

          <Link href="/student/notifications">
            <button
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-md border border-[#e2ebe2] bg-white text-[#2e3339] hover:bg-[#eff4ec] transition-colors"
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#315b36]" />
            </button>
          </Link>

          <Link href="/student/profile">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#315b36] text-white font-bold text-sm shadow-sm overflow-hidden border border-[#315b36]">
              {data?.profile?.user?.avatarUrl ? (
                <img
                  src={data.profile.user.avatarUrl}
                  alt={studentName}
                  className="h-full w-full object-cover"
                />
              ) : (
                studentName.charAt(0).toUpperCase()
              )}
            </div>
          </Link>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: TWO-COLUMN TOP LAYOUT (Spacious & Balanced)
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* LEFT COLUMN: ACTIVE COURSE CARD */}
        <div className="rounded-lg bg-white p-6 shadow-sm border border-[#e2ebe2] flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#315b36] bg-[#eff4ec] px-3 py-1 rounded-md">
                Active Enrolled Course
              </span>
              {activeCourse?.course?.level && (
                <span className="text-xs font-bold text-[#7ba27a] bg-[#eff4ec] px-2.5 py-1 rounded-md">
                  CEFR {activeCourse.course.level}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-[#2e3339] leading-snug">
              {activeCourse ? activeCourse.course.title : 'No Active Course Enrolled'}
            </h2>

            {activeCourse ? (
              <>
                {/* Meta Chips */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[#5a5e63] pt-1">
                  <div className="flex items-center gap-1.5 text-[#315b36] bg-[#eff4ec] px-3 py-1.5 rounded-md">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>
                      {Math.floor((activeCourse.totalDurationMinutes || 0) / 60)} hr{' '}
                      {(activeCourse.totalDurationMinutes || 0) % 60} mins
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#315b36] bg-[#eff4ec] px-3 py-1.5 rounded-md">
                    <BookOpen className="h-4 w-4 shrink-0" />
                    <span>
                      {activeCourse.totalUnitsCount || 0} chapter{activeCourse.totalUnitsCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#315b36] bg-[#eff4ec] px-3 py-1.5 rounded-md">
                    <Video className="h-4 w-4 shrink-0" />
                    <span>{activeCourse.totalLessonsCount || 0} lessons</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#2e3339]">
                    <span className="text-xs font-medium text-[#5a5e63]">Syllabus Completion</span>
                    <span className="text-xs font-bold text-[#315b36]">
                      {activeCourse.progressPercentage || 0}% Complete
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-sm bg-[#e2ebe2] overflow-hidden">
                    <div
                      className="h-full rounded-sm bg-[#315b36] transition-all duration-500"
                      style={{
                        width: `${activeCourse.progressPercentage || 0}%`,
                      }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-[#5a5e63] leading-relaxed">
                You do not have any active courses yet. Browse our certified CEFR curriculum to get started.
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-[#e2ebe2]">
            <Link
              href={
                activeCourse
                  ? `/student/courses/${activeCourse.course.id}`
                  : '/student/courses'
              }
            >
              <button className="w-full flex items-center justify-between rounded-md bg-[#315b36] text-white hover:bg-[#254629] px-5 py-3 text-xs font-bold transition-colors group shadow-sm">
                <span>{activeCourse ? 'Continue Learning' : 'Explore Course Catalog'}</span>
                <Play className="h-4 w-4 fill-current ml-1" />
              </button>
            </Link>
          </div>
        </div>

        {/* RIGHT COLUMN: HERO PROMOTIONAL BANNER */}
        <div className="rounded-lg bg-white p-6 shadow-sm border border-[#e2ebe2] relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="relative z-10 max-w-[62%] space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7ba27a] bg-[#eff4ec] px-3 py-1 rounded-md inline-block">
              Daily Inspiration
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-[#2e3339] leading-snug">
              Keep Learning New Things Everyday
            </h3>
            <p className="text-xs text-[#5a5e63] leading-relaxed font-medium">
              Elevate your English communication with certified international faculty, interactive modules, and CEFR-accredited curriculum.
            </p>
            <div className="pt-2">
              <Link href="/student/courses">
                <Button className="rounded-md bg-[#2e3339] text-white hover:bg-black text-xs font-bold px-5 py-2.5 h-auto shadow-sm">
                  Explore Courses ➔
                </Button>
              </Link>
            </div>
          </div>

          {/* Student Cutout Image on Right */}
          <div className="absolute right-0 bottom-0 top-0 w-[40%] pointer-events-none flex items-end justify-end">
            <img
              src="/student_hero_promo.jpg"
              alt="Keep learning"
              className="h-full max-h-[230px] object-contain object-bottom"
            />
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: PROGRESS & ACTIVITY ROW (TWO COLUMNS)
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* CARD: PROGRESS METRICS SUMMARY */}
        <div className="rounded-lg bg-white p-6 shadow-sm border border-[#e2ebe2] space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-[#2e3339]">Learning Progress Summary</h3>
            <button className="flex items-center gap-1.5 rounded-md border border-[#e2ebe2] bg-[#eff4ec] px-3 py-1 text-xs font-bold text-[#315b36]">
              <span>{progressPeriod}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 my-auto py-2">
            {/* Stat 1 */}
            <div className="rounded-md bg-[#eff4ec]/60 p-4 border border-[#e2ebe2] space-y-1">
              <span className="h-2.5 w-2.5 rounded-full bg-[#315b36] inline-block" />
              <p className="text-xl sm:text-2xl font-extrabold text-[#2e3339] leading-tight">
                {stats?.studyTimeHours ?? 0}h
              </p>
              <p className="text-xs font-medium text-[#5a5e63]">Time Spent</p>
            </div>

            {/* Stat 2 */}
            <div className="rounded-md bg-[#eff4ec]/60 p-4 border border-[#e2ebe2] space-y-1">
              <span className="h-2.5 w-2.5 rounded-full bg-[#7ba27a] inline-block" />
              <p className="text-xl sm:text-2xl font-extrabold text-[#2e3339] leading-tight">
                {stats?.completedCoursesCount ?? 0}
              </p>
              <p className="text-xs font-medium text-[#5a5e63]">Completed</p>
            </div>

            {/* Stat 3 */}
            <div className="rounded-md bg-[#eff4ec]/60 p-4 border border-[#e2ebe2] space-y-1">
              <span className="h-2.5 w-2.5 rounded-full bg-[#315b36]/60 inline-block" />
              <p className="text-xl sm:text-2xl font-extrabold text-[#2e3339] leading-tight">
                {String(stats?.activeCoursesCount ?? 0).padStart(2, '0')}
              </p>
              <p className="text-xs font-medium text-[#5a5e63]">Enrolled</p>
            </div>
          </div>
        </div>

        {/* CARD: YOUR ACTIVITY / STREAK */}
        <div className="rounded-lg bg-white p-6 shadow-sm border border-[#e2ebe2] space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-[#2e3339]">Your Study Activity</h3>
            <span className="text-xs font-bold text-[#7ba27a] bg-[#eff4ec] px-2.5 py-1 rounded-md">
              Past 21 Days
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 my-auto">
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-extrabold text-[#315b36]">
                {stats?.streakDays ?? 0} <span className="text-sm font-bold text-[#5a5e63]">Day Streak</span>
              </p>
              <p className="text-xs font-medium text-[#5a5e63]">
                Total: {stats?.totalActivityHoursText || '0 hours 0 minutes'}
              </p>
            </div>

            {/* 3 rows of 7 activity dots */}
            <div className="space-y-1.5 p-3 rounded-md bg-[#eff4ec]/50 border border-[#e2ebe2]">
              <div className="grid grid-cols-7 gap-1.5">
                {activityDots.slice(0, 7).map((active, i) => (
                  <span
                    key={i}
                    className={`h-2.5 w-2.5 rounded-full mx-auto ${
                      active ? 'bg-[#315b36]' : 'bg-[#e2ebe2]'
                    }`}
                  />
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {activityDots.slice(7, 14).map((active, i) => (
                  <span
                    key={i}
                    className={`h-2.5 w-2.5 rounded-full mx-auto ${
                      active ? 'bg-[#315b36]' : 'bg-[#e2ebe2]'
                    }`}
                  />
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {activityDots.slice(14, 21).map((active, i) => (
                  <span
                    key={i}
                    className={`h-2.5 w-2.5 rounded-full mx-auto ${
                      active ? 'bg-[#315b36]' : 'bg-[#e2ebe2]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: STUDY STATISTICS & FACULTY (TWO COLUMNS)
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUMN 1: STUDY STATISTICS + LEARNING PROGRESS */}
        <div className="space-y-6">
          {/* CARD 5: STUDY STATISTICS BAR CHART */}
          <div className="rounded-lg bg-white p-6 shadow-sm border border-[#e2ebe2] space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-[#2e3339]">Study Statistics</h3>
              <button className="flex items-center gap-1.5 rounded-md border border-[#e2ebe2] bg-[#eff4ec] px-3 py-1.5 text-xs font-bold text-[#315b36]">
                <span>{statsPeriod}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Interactive SVG / HTML Bar Chart */}
            <div className="relative pt-6 pb-2">
              {/* Y-axis Labels & Guidelines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-xs font-bold text-[#7ba27a]">
                <div className="border-b border-dashed border-[#e2ebe2] w-full flex justify-between">
                  <span>4h</span>
                </div>
                <div className="border-b border-dashed border-[#e2ebe2] w-full flex justify-between">
                  <span>3h</span>
                </div>
                <div className="border-b border-dashed border-[#e2ebe2] w-full flex justify-between">
                  <span>2h</span>
                </div>
                <div className="border-b border-dashed border-[#e2ebe2] w-full flex justify-between">
                  <span>1h</span>
                </div>
                <div className="border-b border-[#e2ebe2] w-full flex justify-between">
                  <span>0h</span>
                </div>
              </div>

              {/* 7 Days Bar Columns */}
              <div className="relative z-10 grid grid-cols-7 gap-2 sm:gap-4 h-48 items-end pl-8 pr-2">
                {studyStats.map((item, index) => {
                  const activeHeightPercent = Math.min(100, Math.round((item.activeHours / 4) * 100));
                  const isHovered = hoveredBarIndex === index;

                  return (
                    <div
                      key={item.day}
                      className="flex flex-col items-center h-full justify-end group cursor-pointer relative"
                      onMouseEnter={() => setHoveredBarIndex(index)}
                    >
                      {/* Hover Tooltip Popup */}
                      {isHovered && (
                        <div className="absolute -top-10 z-30 rounded-md bg-white px-2.5 py-1.5 shadow-lg border border-[#e2ebe2] text-xs font-bold whitespace-nowrap animate-in fade-in zoom-in-95">
                          <p className="text-[#315b36]">Active: {item.activeHours}h</p>
                          <p className="text-[#5a5e63]">Target: {item.goalHours}h</p>
                        </div>
                      )}

                      {/* Bar Track & Fill */}
                      <div className="w-full max-w-[32px] h-full rounded-sm bg-[#eff4ec] overflow-hidden flex flex-col justify-end relative">
                        <div
                          className={`w-full rounded-sm transition-all duration-300 ${
                            isHovered ? 'bg-[#254629]' : 'bg-[#315b36]'
                          }`}
                          style={{
                            height: `${activeHeightPercent}%`,
                            backgroundImage:
                              'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.3) 3px, rgba(255,255,255,0.3) 6px)',
                          }}
                        />
                      </div>

                      {/* Day Label */}
                      <span
                        className={`text-xs font-bold mt-2.5 transition-colors ${
                          isHovered ? 'text-[#315b36]' : 'text-[#5a5e63]'
                        }`}
                      >
                        {item.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart Legend */}
            <div className="flex items-center gap-6 pt-1 text-xs font-bold text-[#5a5e63]">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#315b36]" />
                <span>Active Study Time</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#e2ebe2]" />
                <span>Daily Target</span>
              </div>
            </div>
          </div>

          {/* CARD 7: LEARNING PROGRESS GAUGE */}
          <div className="rounded-lg bg-white p-6 shadow-sm border border-[#e2ebe2] flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="space-y-2.5 text-center sm:text-left">
              <h3 className="text-base sm:text-lg font-bold text-[#2e3339]">Overall Learning Progress</h3>
              <div className="inline-flex items-center gap-1.5 rounded-md bg-[#eff4ec] px-3 py-1 text-xs font-bold text-[#315b36]">
                <TrendingUp className="h-4 w-4" />
                <span>+{stats?.growthPercentage || 0}% Growth</span>
              </div>
              <p className="text-xs font-medium text-[#5a5e63]">
                Calculated across all registered CEFR modules
              </p>
            </div>

            {/* Semi-Circular Radial Gauge */}
            <div className="relative flex flex-col items-center justify-center">
              <svg className="w-40 h-24 overflow-visible" viewBox="0 0 160 90">
                {/* Background Arc */}
                <path
                  d="M 20 80 A 60 60 0 0 1 140 80"
                  fill="none"
                  stroke="#e2ebe2"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray="6 6"
                />
                {/* Active Progress Arc */}
                <path
                  d="M 20 80 A 60 60 0 0 1 140 80"
                  fill="none"
                  stroke="#315b36"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray="6 6"
                  strokeDashoffset={`${188 - (188 * (stats?.overallProgressPercentage || 0)) / 100}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute bottom-0 text-center">
                <span className="text-3xl font-extrabold text-[#315b36]">
                  {stats?.overallProgressPercentage || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: LEARN TRACKING + FACULTY LIST */}
        <div className="space-y-6">
          {/* CARD 6: LEARN TRACKING */}
          <div className="rounded-lg bg-white p-6 shadow-sm border border-[#e2ebe2] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-[#2e3339]">Learn Tracking</h3>
              <button
                aria-label="Options"
                className="flex h-8 w-8 items-center justify-center rounded-md text-[#5a5e63] hover:bg-[#eff4ec]"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

            {/* Multi-Ring Concentric Circles SVG */}
            <div className="relative flex items-center justify-center py-3">
              <svg className="h-40 w-40" viewBox="0 0 160 160">
                {/* Outer Ring - Month (Dark Green) */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  fill="none"
                  stroke="#eff4ec"
                  strokeWidth="8"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  fill="none"
                  stroke="#315b36"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 62}
                  strokeDashoffset={2 * Math.PI * 62 * (1 - (stats?.learnTracking?.month || 0) / 100)}
                  strokeLinecap="round"
                  className="rotate-[-90deg] origin-center transition-all duration-1000"
                />

                {/* Middle Ring - Week (Sage Green) */}
                <circle
                  cx="80"
                  cy="80"
                  r="48"
                  fill="none"
                  stroke="#eff4ec"
                  strokeWidth="8"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="48"
                  fill="none"
                  stroke="#7ba27a"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={2 * Math.PI * 48 * (1 - (stats?.learnTracking?.week || 0) / 100)}
                  strokeLinecap="round"
                  className="rotate-[-90deg] origin-center transition-all duration-1000"
                />

                {/* Inner Ring - Day (Charcoal/Accent) */}
                <circle
                  cx="80"
                  cy="80"
                  r="34"
                  fill="none"
                  stroke="#eff4ec"
                  strokeWidth="8"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="34"
                  fill="none"
                  stroke="#2e3339"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 34}
                  strokeDashoffset={2 * Math.PI * 34 * (1 - (stats?.learnTracking?.day || 0) / 100)}
                  strokeLinecap="round"
                  className="rotate-[-90deg] origin-center transition-all duration-1000"
                />
              </svg>

              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-2xl font-extrabold text-[#315b36]">
                  {stats?.goalDistance ?? 100}%
                </span>
                <span className="text-xs font-bold text-[#5a5e63]">
                  Goal Distance
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-xs font-bold text-[#5a5e63]">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#315b36]" />
                <span>Month</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#7ba27a]" />
                <span>Week</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#2e3339]" />
                <span>Day</span>
              </div>
            </div>
          </div>

          {/* CARD 8: TOP MENTORS LIST */}
          <div className="rounded-lg bg-white p-6 shadow-sm border border-[#e2ebe2] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-[#2e3339]">Faculty & Mentors</h3>
              <Link
                href="/student/courses"
                className="text-xs font-bold text-[#315b36] hover:underline transition-colors"
              >
                View all
              </Link>
            </div>

            {mentors.length > 0 ? (
              <div className="space-y-3 divide-y divide-[#eff4ec]">
                {mentors.slice(0, 5).map((mentor) => (
                  <div
                    key={mentor.id}
                    className="flex items-center justify-between pt-3 first:pt-0 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#eff4ec] text-[#315b36] font-bold text-xs border border-[#e2ebe2] overflow-hidden">
                        {mentor.avatarUrl ? (
                          <img
                            src={mentor.avatarUrl}
                            alt={mentor.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          mentor.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#2e3339] group-hover:text-[#315b36] transition-colors">
                          {mentor.name}
                        </p>
                        <p className="text-xs text-[#5a5e63] line-clamp-1 max-w-[220px]">
                          {mentor.role}
                        </p>
                      </div>
                    </div>

                    <Link href={`/student/courses`}>
                      <button
                        aria-label="View Instructor"
                        className="flex h-8 w-8 items-center justify-center rounded-md text-[#5a5e63] hover:bg-[#eff4ec] hover:text-[#315b36] transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[#5a5e63] space-y-2">
                <Users className="h-8 w-8 text-[#7ba27a] mx-auto opacity-70" />
                <p>Instructors will appear here as you engage in courses.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
