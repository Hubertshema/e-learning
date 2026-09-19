'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  ArrowLeft,
  Play,
  CheckCircle2,
  Clock,
  Eye,
  Layers,
  Sparkles,
  FileText,
  HelpCircle
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ActivityContainer, ActivityData } from '@/components/activities/activity-container';

interface Lesson {
  id: string;
  title: string;
  skill: string;
  estimatedMinutes: number;
  sections: Array<{
    id: string;
    title: string;
    contentType: string;
    content: string;
    mediaUrl?: string;
  }>;
}

interface Unit {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
}

interface CourseData {
  id: string;
  title: string;
  description: string;
  level: string;
  category: string;
  units: Unit[];
}

export default function TeacherCoursePreviewSimulatorPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<CourseData | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState<'CONTENT' | 'PRACTICE'>('CONTENT');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<CourseData>(`/teacher/courses/${courseId}`);
        if (res) {
          setCourse(res);
          if (res.units?.length > 0 && res.units[0].lessons?.length > 0) {
            setSelectedLesson(res.units[0].lessons[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load course preview', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

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

  // Generate simulated interactive activity for this lesson preview
  const simulatedActivity: ActivityData = {
    id: `prev-act-${selectedLesson?.id}`,
    title: `${selectedLesson?.skill || 'Grammar'} Interactive Mastery Drill (Simulator)`,
    type:
      selectedLesson?.skill === 'VOCABULARY'
        ? 'FLASHCARD'
        : selectedLesson?.skill === 'SPEAKING'
        ? 'SPEAKING_PRACTICE'
        : selectedLesson?.skill === 'READING'
        ? 'READING_PASSAGE'
        : 'FILL_BLANKS',
    skillType: selectedLesson?.skill || 'GRAMMAR',
    instructions: 'Previewing interactive drill student experience in non-destructive sandbox mode.',
    questions: [
      {
        id: 'q1',
        prompt: 'Select or fill in the best professional phrase to complete the statement.',
        options: ['We look forward to collaborating.', 'We will look forward.', 'We are looking.', 'We look forward.'],
        correctAnswer: 'We look forward to collaborating.',
        explanation: "'Look forward to' is followed by a noun or gerund (-ing form).",
      },
      {
        id: 'q2',
        prompt: 'Which closing sign-off is most appropriate for a formal corporate email?',
        options: ['Sincerely yours,', 'Cheers,', 'Catch you later,', 'Later,'],
        correctAnswer: 'Sincerely yours,',
        explanation: "'Sincerely yours' maintains formal professional decorum.",
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Simulation Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Eye className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>Student Simulator Mode:</strong> You are previewing how enrolled students interact with this curriculum. No progress or database records are mutated.
          </span>
        </div>

        <Link href={`/teacher/courses/${courseId}/units`}>
          <Button variant="outline" size="sm" className="shrink-0 text-xs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Exit Simulator
          </Button>
        </Link>
      </div>

      {/* Main Player Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar: Curriculum Navigator */}
        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <div>
              <Badge variant="outline" className="text-[10px] mb-1">
                {course.level}
              </Badge>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                {course.title}
              </h2>
            </div>

            <div className="space-y-3 pt-2">
              {course.units.map((unit, uIdx) => (
                <div key={unit.id} className="space-y-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    Unit {uIdx + 1}: {unit.title}
                  </p>
                  <div className="space-y-1">
                    {unit.lessons.map((lesson) => {
                      const isSelected = selectedLesson?.id === lesson.id;
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => {
                            setSelectedLesson(lesson);
                            setActiveTab('CONTENT');
                          }}
                          className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-primary-600 text-white font-semibold shadow-sm'
                              : 'hover:bg-slate-100 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          <span className="truncate">{lesson.title}</span>
                          <Badge
                            variant={isSelected ? 'secondary' : 'outline'}
                            className="text-[9px] shrink-0 ml-1"
                          >
                            {lesson.skill}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Area: Interactive Lesson / Drill Simulator */}
        <div className="lg:col-span-3 space-y-4">
          {selectedLesson ? (
            <div className="space-y-4">
              {/* Tab Switcher */}
              <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <Button
                  variant={activeTab === 'CONTENT' ? 'gradient' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('CONTENT')}
                >
                  <FileText className="h-4 w-4 mr-1.5" /> 1. Lesson Material & Media
                </Button>

                <Button
                  variant={activeTab === 'PRACTICE' ? 'gradient' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('PRACTICE')}
                >
                  <Sparkles className="h-4 w-4 mr-1.5" /> 2. Interactive Mastery Drill
                </Button>
              </div>

              {activeTab === 'CONTENT' ? (
                <div className="space-y-4">
                  <Card className="p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-black text-slate-900 dark:text-white">
                        {selectedLesson.title}
                      </h2>
                      <Badge variant="primary">{selectedLesson.skill}</Badge>
                    </div>
                  </Card>

                  {selectedLesson.sections?.map((sec) => (
                    <Card key={sec.id} className="p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {sec.title}
                        </h3>
                        <Badge variant="outline" className="text-[10px]">
                          {sec.contentType}
                        </Badge>
                      </div>

                      <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                        {sec.content}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <ActivityContainer
                    activity={simulatedActivity}
                    onComplete={() => alert('Simulator: Student mastery drill completed successfully!')}
                  />
                </div>
              )}
            </div>
          ) : (
            <Card className="p-12 text-center space-y-2">
              <p className="text-xs text-slate-500">No lessons available in this course to preview.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
