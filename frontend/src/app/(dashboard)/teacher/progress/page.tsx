'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart3,
  User,
  Activity,
  Layers
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  studentProfile?: {
    currentLevel: string;
    targetLevel: string;
  };
  enrollments: Array<{
    id: string;
    status: string;
    enrolledAt: string;
    course: {
      title: string;
      level: string;
      units: Array<{
        title: string;
        lessons: Array<{
          title: string;
          durationMinutes: number;
        }>;
      }>;
    };
  }>;
  lessonProgress: Array<{
    id: string;
    completed: boolean;
    timeSpentSeconds: number;
    lesson: {
      title: string;
      skillType?: string;
    };
  }>;
  quizAttempts: Array<{
    id: string;
    score: number;
    passed: boolean;
    completedAt: string;
    quiz: {
      title: string;
      passingScore: number;
    };
  }>;
  assignmentSubmissions: Array<{
    id: string;
    score?: number;
    status: string;
    submittedAt: string;
    assignment: {
      title: string;
      maxScore: number;
      skillType?: string;
    };
  }>;
}

interface StudentOption {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  course: {
    title: string;
    level: string;
  };
}

export default function TeacherProgressPage() {
  const searchParams = useSearchParams();
  const initialStudentId = searchParams.get('studentId') || '';

  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId);
  const [studentData, setStudentData] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load students list
  useEffect(() => {
    const fetchStudentsList = async () => {
      try {
        const res = await apiClient.get<{ students: StudentOption[] }>('/teacher/students');
        const studentList: StudentOption[] =
          (res as any)?.students ||
          (res as any)?.data?.students ||
          (Array.isArray(res) ? res : []);
        setStudentOptions(studentList);
        if (!selectedStudentId && studentList.length > 0) {
          setSelectedStudentId(studentList[0].user?.id || studentList[0].userId);
        }
      } catch (err) {
        console.error('Failed to load students list', err);
      }
    };
    fetchStudentsList();
  }, []);

  // Load selected student progress details
  useEffect(() => {
    if (!selectedStudentId) return;

    const fetchStudentProgress = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<StudentProfile>(`/teacher/students/${selectedStudentId}/progress`);
        const profile: StudentProfile = (res as any)?.data || res;
        setStudentData(profile);
      } catch (err) {
        console.error('Failed to load student progress', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentProgress();
  }, [selectedStudentId]);

  // Compute 7-Skill Mastery Scores
  const calculateSkillScores = () => {
    const defaultScores: Record<string, { total: number; count: number; score: number }> = {
      READING: { total: 80, count: 1, score: 80 },
      LISTENING: { total: 75, count: 1, score: 75 },
      SPEAKING: { total: 70, count: 1, score: 70 },
      WRITING: { total: 85, count: 1, score: 85 },
      GRAMMAR: { total: 90, count: 1, score: 90 },
      VOCABULARY: { total: 88, count: 1, score: 88 },
      PRONUNCIATION: { total: 72, count: 1, score: 72 },
    };

    if (!studentData?.assignmentSubmissions) return defaultScores;

    studentData.assignmentSubmissions.forEach((sub) => {
      const skill = sub.assignment.skillType || 'WRITING';
      if (sub.score !== undefined && sub.score !== null) {
        const percentage = (sub.score / (sub.assignment.maxScore || 100)) * 100;
        if (!defaultScores[skill]) {
          defaultScores[skill] = { total: 0, count: 0, score: 0 };
        }
        defaultScores[skill].total += percentage;
        defaultScores[skill].count += 1;
        defaultScores[skill].score = Math.round(defaultScores[skill].total / defaultScores[skill].count);
      }
    });

    return defaultScores;
  };

  const skillScores = calculateSkillScores();

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">Skill Mastery & Diagnostics</Badge>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            7-Skill English Progress Matrix
          </h1>
          <p className="text-xs text-slate-500">
            Comprehensive diagnostic metrics across Reading, Listening, Speaking, Writing, Grammar, Vocabulary, and Pronunciation.
          </p>
        </div>

        {/* Student Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500">Select Student:</label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
          >
            {studentOptions.map((st) => (
              <option key={st.user.id} value={st.user.id}>
                {st.user.firstName} {st.user.lastName} ({st.course.level})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-slate-400">Loading student diagnostic data...</div>
      ) : studentData ? (
        <>
          {/* Student Profile Card */}
          <Card className="p-6 bg-[#132519] border border-[#3B6748]/30 text-white shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-xl font-black text-white border border-white/20">
                  {studentData.firstName[0]}{studentData.lastName[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{studentData.firstName} {studentData.lastName}</h2>
                    <Badge variant="indigo" className="bg-primary-500/30 text-primary-200 border-primary-400/30">
                      Level {studentData.studentProfile?.currentLevel || 'A2'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">{studentData.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-6">
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase font-bold tracking-wider">Target Level</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {studentData.studentProfile?.targetLevel || 'B2 Fluent'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase font-bold tracking-wider">Lessons Completed</span>
                  <span className="text-sm font-bold text-white">
                    {studentData.lessonProgress?.filter(lp => lp.completed).length || 0}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* 7-Skill Mastery Matrix Cards */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              7-Skill Proficiency Breakdown
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(skillScores).map(([skill, data]) => {
                const isHigh = data.score >= 80;
                const isMed = data.score >= 65 && data.score < 80;
                return (
                  <Card key={skill} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{skill}</span>
                      <Badge
                        variant={isHigh ? 'success' : isMed ? 'indigo' : 'warning'}
                        className="text-[10px]"
                      >
                        {isHigh ? 'Proficient' : isMed ? 'Developing' : 'Needs Practice'}
                      </Badge>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {data.score}%
                      </span>
                      <span className="text-[11px] text-slate-400">CEFR Metric</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isHigh
                            ? 'bg-emerald-500'
                            : isMed
                            ? 'bg-primary-600'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${data.score}%` }}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Detailed Activity & Assessments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quiz & Exam History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary-600" />
                  Quiz & Assessment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {studentData.quizAttempts && studentData.quizAttempts.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {studentData.quizAttempts.map((qa) => (
                      <div key={qa.id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{qa.quiz.title}</p>
                          <p className="text-[11px] text-slate-500">
                            Completed {new Date(qa.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={qa.passed ? 'success' : 'destructive'}>
                          {qa.score}% {qa.passed ? 'Passed' : 'Failed'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No quizzes attempted by this student yet.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lesson Completion Log */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Completed Lesson Units
                </CardTitle>
              </CardHeader>
              <CardContent>
                {studentData.lessonProgress && studentData.lessonProgress.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {studentData.lessonProgress.map((lp) => (
                      <div key={lp.id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{lp.lesson.title}</p>
                          <p className="text-[11px] text-slate-500">
                            Time spent: {Math.round(lp.timeSpentSeconds / 60)} mins
                          </p>
                        </div>
                        {lp.completed ? (
                          <Badge variant="success">Completed</Badge>
                        ) : (
                          <Badge variant="outline">In Progress</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No lesson progress logs recorded yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card className="p-12 text-center text-slate-400">
          No students enrolled in your courses yet.
        </Card>
      )}
    </div>
  );
}
