import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, BookOpen, Globe2, ShieldCheck, Target, Users } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <Badge variant="indigo">Our Mission & Pedagogy</Badge>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-slate-900 dark:text-white">
          Empowering Global Communication Through Structured Mastery
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          FluentEdge Academy was built to bridge the gap between superficial language apps and rigorous, teacher-led education. We combine the internationally recognized CEFR framework with interactive technology.
        </p>
      </div>

      {/* Pillars */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <Card className="p-6 space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950">
            <Target className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold">Standardized CEFR Alignment</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Every course, unit, and assessment strictly corresponds to CEFR levels (Pre-A1 to C2), ensuring learners achieve measurable and internationally verifiable outcomes.
          </p>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold">Teacher-Centered Guidance</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Unlike automated quiz bots, real qualified educators evaluate speaking and writing submissions, provide direct feedback, and guide student progression.
          </p>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950">
            <Award className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold">Verifiable Digital Certificates</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Graduates receive tamper-proof certificates with a unique verification URL and code that can be shared with employers, universities, and LinkedIn.
          </p>
        </Card>
      </div>
    </div>
  );
}
