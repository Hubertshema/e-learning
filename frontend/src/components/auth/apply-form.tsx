'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { apiClient, tokenStorage } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, ArrowLeft, GraduationCap, Sparkles } from 'lucide-react';

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
    <div className="w-full flex flex-col my-auto">
      {/* Header */}
      <div className="space-y-1.5 text-center pb-4 shrink-0">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#006EF3]/10 text-[#006EF3] border border-[#006EF3]/20 mb-1">
          <GraduationCap className="h-6 w-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Student Admission Application
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          Submit your profile details and create your student account. Our academic instructors will review your admission request.
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">First Name *</label>
            <Input
              required
              placeholder="e.g. David"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="h-10 text-xs sm:text-sm rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Last Name *</label>
            <Input
              required
              placeholder="e.g. Mugisha"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="h-10 text-xs sm:text-sm rounded-xl"
            />
          </div>
        </div>

        {/* Email & Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Email Address *</label>
            <Input
              type="email"
              required
              placeholder="you@domain.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="h-10 text-xs sm:text-sm rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Account Password *</label>
            <Input
              type="password"
              required
              minLength={6}
              placeholder="Min. 6 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="h-10 text-xs sm:text-sm rounded-xl"
            />
          </div>
        </div>

        {/* Phone & Native Language */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Phone / WhatsApp Number</label>
            <Input
              placeholder="+250 788 123 456"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="h-10 text-xs sm:text-sm rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Native / First Language</label>
            <Input
              placeholder="e.g. Kinyarwanda, French, Swahili"
              value={formData.nativeLanguage}
              onChange={(e) => setFormData({ ...formData, nativeLanguage: e.target.value })}
              className="h-10 text-xs sm:text-sm rounded-xl"
            />
          </div>
        </div>

        {/* Target Level */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
            Target CEFR English Level
          </label>
          <select
            value={formData.targetLevel}
            onChange={(e) => setFormData({ ...formData, targetLevel: e.target.value })}
            className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#006EF3] transition-colors"
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
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
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
                  className={`text-[11px] sm:text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                    selected
                      ? 'bg-[#006EF3]/10 text-[#006EF3] border-[#006EF3] font-bold dark:bg-[#006EF3]/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
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
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
            Why do you want to learn with LinguaChris? (Motivation)
          </label>
          <textarea
            rows={2}
            placeholder="Tell us a little about yourself and your English learning goals..."
            value={formData.motivation}
            onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#006EF3] transition-colors resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#012970] hover:bg-[#006EF3] text-white font-bold h-11 rounded-xl shadow-md text-xs sm:text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
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

      {/* Footer Links */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-[#006EF3] hover:underline">
            Sign in
          </Link>
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to homepage
        </Link>
      </div>
    </div>
  );
}
