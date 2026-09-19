'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Mail,
  Lock,
  User,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Layers,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

const CEFR_LEVELS = [
  { value: 'PRE_A1', label: 'Pre-A1 — Absolute Beginner' },
  { value: 'A1', label: 'A1 — Beginner (Basic greetings & words)' },
  { value: 'A2', label: 'A2 — Elementary (Daily routines & phrases)' },
  { value: 'B1', label: 'B1 — Intermediate (Workplace & travel conversations)' },
  { value: 'B2', label: 'B2 — Upper Intermediate (Fluent discussions)' },
  { value: 'C1', label: 'C1 — Advanced (Academic & professional mastery)' },
  { value: 'C2', label: 'C2 — Mastery (Native-level expression)' },
];

const LEARNING_GOAL_OPTIONS = [
  'Career Advancement & Workplace Fluency',
  'Job Interview Preparation (STAR Method)',
  'Academic English & University Exams',
  'Travel & Global Social Communication',
  'Grammar & Vocabulary Precision',
  'Spoken English & Pronunciation Confidence',
];

export default function StudentRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    country: 'Rwanda',
    city: 'Kigali',
    nativeLanguage: 'Kinyarwanda',
    targetLevel: 'B2',
    learningGoals: ['Career Advancement & Workplace Fluency'],
    preferredSchedule: 'Evening (6 PM - 9 PM)',
    englishExperience: 'Studied English in school, want to speak fluently.',
  });

  const handleGoalToggle = (goal: string) => {
    setFormData((prev) => {
      const exists = prev.learningGoals.includes(goal);
      if (exists) {
        return { ...prev, learningGoals: prev.learningGoals.filter((g) => g !== goal) };
      } else {
        return { ...prev, learningGoals: [...prev.learningGoals, goal] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await apiClient.post<any>('/auth/register', {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: 'STUDENT',
        phone: formData.phone,
        country: formData.country,
        city: formData.city,
      });

      // Update profile with student-specific fields
      try {
        await apiClient.patch('/students/me', {
          nativeLanguage: formData.nativeLanguage,
          targetLevel: formData.targetLevel,
          learningGoals: formData.learningGoals,
          preferredSchedule: formData.preferredSchedule,
          englishExperience: formData.englishExperience,
        });
      } catch (err) {
        console.warn('Profile details save notice', err);
      }

      // Redirect to login or student dashboard
      router.push('/login?registered=student');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-xl">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-xl shadow-primary-500/20">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-black text-slate-900 dark:text-white">
            Join FluentEdge Academy
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Create your Student Account and unlock CEFR-aligned English mastery
          </p>

          {/* Progress Steps */}
          <div className="mt-6 flex items-center justify-center gap-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    step >= s
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-200 text-slate-500 dark:bg-slate-800'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && <div className={`h-0.5 w-8 ${step > s ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-800'}`} />}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Card className="shadow-2xl border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base">
              {step === 1 && 'Step 1: Account & Credentials'}
              {step === 2 && 'Step 2: Personal & Location Details'}
              {step === 3 && 'Step 3: English Learning Goals & CEFR Target'}
            </CardTitle>
            <CardDescription className="text-xs">
              {step === 1 && 'Set up your secure login credentials'}
              {step === 2 && 'Help instructors customize your learning curriculum'}
              {step === 3 && 'Define your desired outcomes and target proficiency'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* STEP 1: Account Info */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">First Name</label>
                      <input
                        type="text"
                        required
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="student@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Location & Language */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+250 788 123 456"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Country</label>
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">City / District</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Native Language</label>
                    <input
                      type="text"
                      placeholder="e.g. Kinyarwanda, French, Swahili"
                      value={formData.nativeLanguage}
                      onChange={(e) => setFormData({ ...formData, nativeLanguage: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Goals & CEFR Target */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Target CEFR English Level
                    </label>
                    <select
                      value={formData.targetLevel}
                      onChange={(e) => setFormData({ ...formData, targetLevel: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 font-semibold"
                    >
                      {CEFR_LEVELS.map((lvl) => (
                        <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Primary Learning Goals (Select all that apply)
                    </label>
                    <div className="space-y-2 mt-1.5">
                      {LEARNING_GOAL_OPTIONS.map((g) => {
                        const selected = formData.learningGoals.includes(g);
                        return (
                          <div
                            key={g}
                            onClick={() => handleGoalToggle(g)}
                            className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer text-xs font-medium transition-all ${
                              selected
                                ? 'border-primary-500 bg-primary-50 text-primary-900 dark:bg-primary-950/40 dark:text-primary-300 dark:border-primary-700'
                                : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              readOnly
                              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span>{g}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Preferred Study Schedule
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Weekday evenings, Saturday mornings"
                      value={formData.preferredSchedule}
                      onChange={(e) => setFormData({ ...formData, preferredSchedule: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                {step > 1 ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => setStep(step - 1)}>
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    Back
                  </Button>
                ) : (
                  <Link href="/login">
                    <span className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white">
                      Already have an account? Sign In
                    </span>
                  </Link>
                )}

                {step < 3 ? (
                  <Button
                    type="button"
                    variant="gradient"
                    size="sm"
                    onClick={() => {
                      if (step === 1 && (!formData.firstName || !formData.lastName || !formData.email || !formData.password)) {
                        setError('Please fill in all account fields');
                        return;
                      }
                      setError(null);
                      setStep(step + 1);
                    }}
                  >
                    Next Step
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button type="submit" variant="gradient" size="sm" disabled={loading}>
                    {loading ? 'Creating Student Account...' : 'Complete Registration'}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
