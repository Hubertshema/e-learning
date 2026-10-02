'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { apiClient, tokenStorage } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, CheckCircle2, GraduationCap, Sparkles } from 'lucide-react';

const CEFR_LEVELS = [
  { value: 'PRE_A1', label: 'Pre-A1 Starter (Complete Beginner)' },
  { value: 'A1', label: 'A1 Elementary (Basic phrases & vocabulary)' },
  { value: 'A2', label: 'A2 Pre-Intermediate (Everyday conversations)' },
  { value: 'B1', label: 'B1 Intermediate (Independent speaker)' },
  { value: 'B2', label: 'B2 Upper-Intermediate (Fluent professional)' },
  { value: 'C1', label: 'C1 Advanced (Effective operational proficiency)' },
  { value: 'C2', label: 'C2 Mastery (Native-level mastery)' },
];

const GOAL_OPTIONS = [
  'Career & Job Promotion',
  'IELTS / TOEFL Exam Prep',
  'Academic Study Abroad',
  'Everyday Fluency & Travel',
  'Business & Professional English',
];

export function ApplyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  const initialLevel = (() => {
    const raw = searchParams.get('level')?.toUpperCase();
    if (!raw) return 'A2';
    if (raw === 'PRE-A1' || raw === 'PRE_A1') return 'PRE_A1';
    return ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(raw) ? raw : 'A2';
  })();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    nativeLanguage: '',
    targetLevel: initialLevel,
    learningGoals: ['Everyday Fluency & Travel'],
    motivation: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoalToggle = (goal: string) => {
    setFormData((prev) => {
      const exists = prev.learningGoals.includes(goal);
      return {
        ...prev,
        learningGoals: exists
          ? prev.learningGoals.filter((g) => g !== goal)
          : [...prev.learningGoals, goal],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        throw new Error('Please enter both your first and last name.');
      }
      if (!formData.email.trim()) {
        throw new Error('Please enter your email address.');
      }
      if (!formData.password || formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      const res = await apiClient<{
        user: any;
        tokens: { accessToken: string; refreshToken: string };
      }>('/auth/apply', {
        method: 'POST',
        body: JSON.stringify(formData),
        requiresAuth: false,
      });

      if (res?.tokens?.accessToken) {
        tokenStorage.setTokens(res.tokens.accessToken, res.tokens.refreshToken);
        await refreshUser();
      }

      router.push('/student');
    } catch (err: any) {
      setError(err?.message || 'Failed to submit application. Please review your details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-xl border border-[#E2E8F0] bg-white shadow-xl rounded-3xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
      {/* Mobile-only Logo Header */}
      <div className="lg:hidden text-center pt-3 pb-0">
        <Link href="/" className="inline-block">
          <img
            src="/real-logo.png"
            alt="FluentEdge Academy"
            className="h-8 w-auto object-contain mx-auto"
          />
        </Link>
      </div>

      <CardHeader className="space-y-1 text-center px-5 sm:px-6 pt-3 pb-2 shrink-0">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F3F7FC] text-[#006EF3] border border-[#E2E8F0]">
          <GraduationCap className="h-5 w-5" />
        </div>
        <CardTitle className="text-xl sm:text-2xl font-black tracking-tight text-[#172033]">
          Student Admission Application
        </CardTitle>
        <CardDescription className="text-xs text-[#667085] max-w-md mx-auto">
          Submit your profile details and create your student account. Our academic instructors will review your admission request.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 sm:px-6 py-2 space-y-3.5 custom-scrollbar">
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700">First Name *</label>
            <Input
              required
              placeholder="e.g. David"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="h-9 text-xs rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700">Last Name *</label>
            <Input
              required
              placeholder="e.g. Mugisha"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="h-9 text-xs rounded-xl"
            />
          </div>
        </div>

        {/* Email & Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700">Email Address *</label>
            <Input
              type="email"
              required
              placeholder="you@domain.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="h-9 text-xs rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700">Account Password *</label>
            <Input
              type="password"
              required
              minLength={6}
              placeholder="Min. 6 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="h-9 text-xs rounded-xl"
            />
          </div>
        </div>

        {/* Phone & Native Language */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700">Phone / WhatsApp Number</label>
            <Input
              placeholder="+250 788 123 456"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="h-9 text-xs rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700">Native / First Language</label>
            <Input
              placeholder="e.g. Kinyarwanda, French, Swahili"
              value={formData.nativeLanguage}
              onChange={(e) => setFormData({ ...formData, nativeLanguage: e.target.value })}
              className="h-9 text-xs rounded-xl"
            />
          </div>
        </div>

        {/* Target Level */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700">
            Target CEFR English Level
          </label>
          <select
            value={formData.targetLevel}
            onChange={(e) => setFormData({ ...formData, targetLevel: e.target.value })}
            className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006EF3]"
          >
            {CEFR_LEVELS.map((lvl) => (
              <option key={lvl.value} value={lvl.value}>
                {lvl.label}
              </option>
            ))}
          </select>
        </div>

        {/* Learning Goals */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700">
            Primary Learning Goals
          </label>
          <div className="flex flex-wrap gap-1.5">
            {GOAL_OPTIONS.map((goal) => {
              const selected = formData.learningGoals.includes(goal);
              return (
                <button
                  type="button"
                  key={goal}
                  onClick={() => handleGoalToggle(goal)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                    selected
                      ? 'bg-[#F3F7FC] text-[#012970] border-[#006EF3] font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {selected ? '✓ ' : '+ '}
                  {goal}
                </button>
              );
            })}
          </div>
        </div>

        {/* Motivation / Background */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700">
            Why do you want to learn with FluentEdge? (Motivation)
          </label>
          <textarea
            rows={2}
            placeholder="Tell us a little about yourself and your English learning goals..."
            value={formData.motivation}
            onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006EF3]"
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#012970] hover:bg-[#006EF3] text-white font-bold h-10 rounded-xl shadow-md text-xs transition-all active:scale-[0.99]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Submitting Application...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Submit Application & Create Account
              </span>
            )}
          </Button>
        </div>
      </form>

      <CardFooter className="flex flex-col gap-1.5 border-t border-slate-100 bg-slate-50/70 p-3 text-center shrink-0">
        <p className="text-[11px] text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-[#012970] hover:text-[#006EF3] hover:underline">
            Sign in
          </Link>
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to homepage
        </Link>
      </CardFooter>
    </Card>
  );
}
