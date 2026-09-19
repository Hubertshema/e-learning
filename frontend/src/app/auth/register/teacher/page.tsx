'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function TeacherRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    headline: '',
    bio: '',
    experienceYears: 3,
    hourlyRate: 25,
    specialties: [] as string[],
    levelsTaught: [] as string[],
  });

  const availableSpecialties = [
    'Business English',
    'IELTS / TOEFL Prep',
    'Grammar & Syntax',
    'Conversational Fluency',
    'Pronunciation & Accent',
    'Academic Writing',
    'Technical English (IT)',
    'English for Healthcare',
  ];

  const availableLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const toggleSpecialty = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(item)
        ? prev.specialties.filter((s) => s !== item)
        : [...prev.specialties, item],
    }));
  };

  const toggleLevel = (level: string) => {
    setFormData((prev) => ({
      ...prev,
      levelsTaught: prev.levelsTaught.includes(level)
        ? prev.levelsTaught.filter((l) => l !== level)
        : [...prev.levelsTaught, level],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters with uppercase and numbers.');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/auth/register', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: 'TEACHER',
        headline: formData.headline || 'Certified English Instructor',
        bio: formData.bio || 'Passionate English language educator committed to student success.',
        experienceYears: Number(formData.experienceYears),
        specialties: formData.specialties.length > 0 ? formData.specialties : ['General English'],
      });

      setIsPendingApproval(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit instructor application.');
    } finally {
      setLoading(false);
    }
  };

  if (isPendingApproval) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <Card className="max-w-lg w-full p-8 text-center space-y-6 shadow-2xl border-primary-200 dark:border-primary-900">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/60">
            <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400 animate-pulse" />
          </div>

          <div className="space-y-2">
            <Badge variant="warning" className="text-xs">
              Application Under Review
            </Badge>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Application Received!
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Thank you, <strong>{formData.firstName}</strong>. Your teacher accreditation application has been submitted to the LinguaChris Academy Academic Board.
            </p>
          </div>

          <div className="rounded-xl bg-slate-100 p-4 text-left text-xs space-y-2 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <p className="font-semibold text-slate-800 dark:text-slate-200">What happens next?</p>
            <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Superadmin reviews teaching credentials & certificates</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Email confirmation sent upon approval (typically within 24h)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Full access to Course Studio, Cohorts & Payment Queue unlocked</span>
              </li>
            </ul>
          </div>

          <div className="pt-2">
            <Link href="/login">
              <Button variant="gradient" className="w-full">
                Return to Sign In
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-[#F4F7F4] dark:bg-[#0F1713]">
      <Card className="max-w-xl w-full shadow-2xl border-slate-200 dark:border-slate-800">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-950">
            <GraduationCap className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight">
            Join as an Accredited Instructor
          </CardTitle>
          <CardDescription>
            Teach ambitious students worldwide, create interactive curricula, and earn with guaranteed verification.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {step === 1 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="First Name"
                    placeholder="Sarah"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                  <Input
                    label="Last Name"
                    placeholder="Mutesi"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="sarah.instructor@platform.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="+250 788 000 000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                </div>

                <Button
                  type="button"
                  variant="gradient"
                  className="w-full mt-2"
                  onClick={() => {
                    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
                      setError('Please fill in all basic identity fields.');
                      return;
                    }
                    setError(null);
                    setStep(2);
                  }}
                >
                  Continue to Teaching Profile <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  label="Professional Headline"
                  placeholder="CELTA Certified English Trainer | 6+ Yrs Experience"
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  required
                />

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Teaching Specializations
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableSpecialties.map((spec) => {
                      const isSelected = formData.specialties.includes(spec);
                      return (
                        <button
                          key={spec}
                          type="button"
                          onClick={() => toggleSpecialty(spec)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition-all ${
                            isSelected
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {spec}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    CEFR Levels Taught
                  </label>
                  <div className="flex gap-2 mt-2">
                    {availableLevels.map((lvl) => {
                      const isSelected = formData.levelsTaught.includes(lvl);
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => toggleLevel(lvl)}
                          className={`rounded-lg px-3 py-1 text-xs font-bold border transition-all ${
                            isSelected
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {lvl}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Years of Experience"
                    type="number"
                    min={0}
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: parseInt(e.target.value, 10) || 0 })}
                  />
                  <Input
                    label="Target Hourly Rate (USD)"
                    type="number"
                    min={5}
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: parseInt(e.target.value, 10) || 25 })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Brief Bio & Methodology
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe your interactive teaching approach and credentials..."
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-1/3">
                    Back
                  </Button>
                  <Button type="submit" variant="gradient" className="w-2/3" isLoading={loading}>
                    Submit Application
                  </Button>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-center border-t border-slate-100 p-4 dark:border-slate-800">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary-600 hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
