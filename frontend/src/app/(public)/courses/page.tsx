import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Users, Star, ArrowRight } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export default function CoursesPage() {
  const sampleCourses = [
    {
      id: '1',
      title: 'A2 Elementary English: Practical Everyday & Workplace Fluency',
      category: 'Communication English',
      level: 'A2',
      teacher: 'Sarah Jenkins',
      duration: '90 Days',
      lessonsCount: 24,
      rating: 4.9,
      studentsCount: 142,
      price: 49.99,
      description: 'Master present & past tenses, daily conversational routines, vocabulary for workplace interactions, and clear pronunciation.',
    },
    {
      id: '2',
      title: 'B1 Intermediate: English for IT & Tech Professionals',
      category: 'Professional English',
      level: 'B1',
      teacher: 'David Mugisha',
      duration: '90 Days',
      lessonsCount: 30,
      rating: 5.0,
      studentsCount: 98,
      price: 65.0,
      description: 'Technical standups, client sprint reviews, bug report writing, pull request explanations, and tech interview readiness.',
    },
    {
      id: '3',
      title: 'B2 Upper Intermediate: Business Communication & Negotiations',
      category: 'Business English',
      level: 'B2',
      teacher: 'Elena Rostova',
      duration: '120 Days',
      lessonsCount: 36,
      rating: 4.8,
      studentsCount: 215,
      price: 79.99,
      description: 'High-stakes presentations, pitch deck articulation, professional business emails, conflict resolution, and executive tone.',
    },
    {
      id: '4',
      title: 'English for Rwanda: Everyday Public & Workplace Communication',
      category: 'English for Rwanda',
      level: 'A1 - B1',
      teacher: 'Jean-Claude Habimana',
      duration: '60 Days',
      lessonsCount: 20,
      rating: 4.9,
      studentsCount: 320,
      price: 35.0,
      description: 'Practical English for customer care, tourism, banking, civil service, and academic communication in Rwanda.',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      <div className="space-y-4">
        <Badge variant="indigo">Course Catalog</Badge>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Explore Structured English Courses
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
          Select a course matching your current CEFR level or professional focus. Enroll and complete teacher-verified access to begin.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
        {sampleCourses.map((course) => (
          <Card key={course.id} className="flex flex-col justify-between overflow-hidden border-slate-200/80 transition-all hover:border-primary-400 hover:shadow-lg dark:border-slate-800">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="indigo">{course.level}</Badge>
                <span className="text-xs font-semibold text-slate-500">{course.category}</span>
              </div>

              <h3 className="text-xl font-bold leading-snug text-slate-900 dark:text-white">
                {course.title}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {course.description}
              </p>

              <div className="grid grid-cols-3 gap-2 border-t border-b border-slate-100 py-3 text-xs text-slate-500 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary-500" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-primary-500" />
                  <span>{course.lessonsCount} Lessons</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-current" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{course.rating}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-xs text-slate-400">Course Fee</span>
                  <p className="text-2xl font-black text-primary-600">
                    {formatPrice(course.price)}
                  </p>
                </div>
                <Link href="/register?role=STUDENT">
                  <Button variant="gradient" size="sm">
                    <span>Enroll Now</span>
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
