import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Award, BookOpen, Star, Users } from 'lucide-react';

export default function TeachersPage() {
  const teachers = [
    {
      id: '1',
      name: 'Sarah Jenkins',
      headline: 'Certified CELTA English Instructor (10+ Yrs Experience)',
      bio: 'Specialized in conversational fluency, pronunciation coaching, and practical workplace communication.',
      specialties: ['Business English', 'Grammar Mastery', 'Pronunciation Training'],
      rating: 4.9,
      studentsCount: 340,
      experienceYears: 10,
    },
    {
      id: '2',
      name: 'David Mugisha',
      headline: 'Applied Linguistics MA & Tech English Specialist',
      bio: 'Helping engineers and professionals present technical concepts with confidence and clear English diction.',
      specialties: ['English for IT', 'Technical Writing', 'Interview Prep'],
      rating: 5.0,
      studentsCount: 210,
      experienceYears: 7,
    },
    {
      id: '3',
      name: 'Elena Rostova',
      headline: 'Corporate ESL Coach & Executive Trainer',
      bio: 'Focused on high-impact executive communication, negotiation phrases, and cross-cultural business meetings.',
      specialties: ['Corporate English', 'Presentations', 'Academic English'],
      rating: 4.8,
      studentsCount: 450,
      experienceYears: 12,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      <div className="space-y-4 max-w-3xl">
        <Badge variant="indigo">Faculty & Instructors</Badge>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Learn Directly with Certified Educators
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          All FluentEdge instructors are vetted for academic credentials, pedagogical experience, and passion for student success.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {teachers.map((teacher) => (
          <Card key={teacher.id} className="p-6 space-y-4 transition-all hover:shadow-lg">
            <div className="flex items-center gap-4">
              <Avatar fallback={teacher.name.slice(0, 2)} size="lg" />
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{teacher.name}</h3>
                <div className="flex items-center gap-1 text-xs text-amber-500">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{teacher.rating}</span>
                  <span className="text-slate-400">({teacher.studentsCount} students)</span>
                </div>
              </div>
            </div>

            <p className="text-xs font-semibold text-primary-600">{teacher.headline}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{teacher.bio}</p>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {teacher.specialties.map((spec, i) => (
                <Badge key={i} variant="secondary" className="text-[10px]">
                  {spec}
                </Badge>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-4 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">{teacher.experienceYears}+ Years Exp</span>
              <Link href="/courses">
                <Button variant="outline" size="sm">
                  View Courses
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
