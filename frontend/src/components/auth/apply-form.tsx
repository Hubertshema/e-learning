'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { apiClient, tokenStorage } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertCircle,
  ArrowLeft,
  GraduationCap,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  Copy,
  Check,
  Lock,
  User,
  Mail,
  Phone,
  Globe,
  Compass,
} from 'lucide-react';

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
    confirmPassword: '',
    phone: '',
    nativeLanguage: '',
    targetLevel: initialLevel,
    learningGoals: ['Everyday Fluency & Travel'],
    motivation: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Suggested Password Generator
  const handleSuggestPassword = () => {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghijkmnopqrstuvwxyz';
    const numbers = '23456789';
    const symbols = '!@#$%^&*';

    // Ensure at least one character from each set
    const selected = [
      uppercase[Math.floor(Math.random() * uppercase.length)],
      lowercase[Math.floor(Math.random() * lowercase.length)],
      numbers[Math.floor(Math.random() * numbers.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
    ];

    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = 0; i < 10; i++) {
      selected.push(allChars[Math.floor(Math.random() * allChars.length)]);
    }

    // Shuffle characters
    const generated = selected.sort(() => 0.5 - Math.random()).join('');

    setFormData((prev) => ({
      ...prev,
      password: generated,
      confirmPassword: generated,
    }));
    setShowPassword(true);
    setShowConfirmPassword(true);

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(generated);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 3500);
    }
  };

  // Password Security Strength Metrics
  const password = formData.password;
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const score = [hasLength, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
  const isStrongest = hasLength && hasUpper && hasNumber && hasSymbol;
  const isWeakPasswordEntered = Boolean(password && !isStrongest);
  const isPasswordReady = Boolean(password && isStrongest);

  const strengthDetails = (() => {
    if (!password) {
      return { label: '', color: 'bg-slate-200 dark:bg-slate-700', percent: 0, textClass: 'text-slate-400', isStrongest: false };
    }
    if (password.length < 8) {
      return { label: 'Too short (min 8) • Prohibited', color: 'bg-rose-500', percent: 20, textClass: 'text-rose-500 font-bold', isStrongest: false };
    }
    if (score === 1) {
      return { label: 'Weak • Prohibited', color: 'bg-rose-500', percent: 25, textClass: 'text-rose-500 font-bold', isStrongest: false };
    }
    if (score === 2) {
      return { label: 'Fair • Prohibited', color: 'bg-amber-500', percent: 50, textClass: 'text-amber-500 font-bold', isStrongest: false };
    }
    if (score === 3) {
      return { label: 'Moderate • Prohibited', color: 'bg-blue-500', percent: 75, textClass: 'text-blue-500 font-bold', isStrongest: false };
    }
    return { label: 'Strongest & Approved ✓', color: 'bg-emerald-500', percent: 100, textClass: 'text-emerald-500 font-bold', isStrongest: true };
  })();

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
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email.trim())) {
        throw new Error('Please enter a valid, well-formatted email address (e.g. yourname@domain.com).');
      }
      if (!formData.password) {
        throw new Error('Please enter your password.');
      }
      if (!isStrongest) {
        throw new Error(
          'Weak passwords are prohibited. You must use the strongest password (minimum 8 characters, with uppercase letters, numbers, and special symbols). Click "Suggest Strongest Password" to auto-generate one.'
        );
      }
      if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match. Please verify your password confirmation.');
      }

      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim(),
        nativeLanguage: formData.nativeLanguage.trim(),
        targetLevel: formData.targetLevel,
        currentEnglishLevel: formData.targetLevel,
        learningGoals: formData.learningGoals,
        motivation: formData.motivation.trim(),
      };

      const res = await apiClient<{
        user: any;
        tokens: { accessToken: string; refreshToken: string };
      }>('/auth/apply', {
        method: 'POST',
        body: JSON.stringify(payload),
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
    <div className="w-full flex flex-col py-1 sm:py-3">
      {/* Header */}
      <div className="space-y-1.5 text-center pb-4 shrink-0">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#006EF3]/10 text-[#006EF3] border border-[#006EF3]/20 mb-2 shadow-2xs">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F3F7FC] dark:bg-blue-950/60 text-[#012970] dark:text-blue-300 border border-[#012970]/15 dark:border-blue-800">
            <Sparkles className="h-2.5 w-2.5 text-[#006EF3]" /> Admission Application
          </span>
          <span className="text-[10px] font-semibold text-slate-400">
            Academic Year 2026/2027
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Apply for Student Admission
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
          Submit your profile details and create your student account. Our academic team reviews and activates enrollments promptly.
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-300 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {copiedNotice && (
        <div className="mb-4 flex items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span><strong>Suggested strong password generated!</strong> Copied to your clipboard.</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400">
            Copied
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Section 1: Personal Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
            <User className="h-3.5 w-3.5 text-[#006EF3]" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Personal Information
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">First Name *</label>
              <Input
                required
                placeholder="e.g. David"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="h-10 text-xs sm:text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Last Name *</label>
              <Input
                required
                placeholder="e.g. Mugisha"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="h-10 text-xs sm:text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Email Address *</label>
              <Input
                type="email"
                required
                placeholder="you@domain.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-10 text-xs sm:text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Phone / WhatsApp Number</label>
              <Input
                placeholder="+250 788 123 456"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-10 text-xs sm:text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Account Password & Suggested Security */}
        <div className="rounded-2xl border border-blue-100 dark:border-blue-950/60 bg-[#F3F7FC]/50 dark:bg-slate-800/40 p-3.5 sm:p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-blue-200/60 dark:border-slate-700">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#006EF3]" />
              <span className="text-xs font-bold text-[#012970] dark:text-blue-300 uppercase tracking-wider">
                Account Security & Password
              </span>
            </div>

            {/* Suggested Password Generator Tool */}
            <button
              type="button"
              onClick={handleSuggestPassword}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-[#006EF3]/30 text-[#006EF3] dark:text-blue-400 hover:bg-[#006EF3]/10 text-[11px] font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
              title="Generate a high-security strongest password and copy to clipboard"
            >
              <KeyRound className="h-3 w-3" />
              <span>Suggest Strongest Password</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Password Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Password *
                </label>
                {formData.password && (
                  <span className={`text-[10px] font-semibold ${strengthDetails.textClass}`}>
                    {strengthDetails.label}
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Min. 8 chars (upper, number, symbol)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`h-10 text-xs sm:text-sm rounded-xl pr-10 bg-white dark:bg-slate-900 transition-colors ${
                    isWeakPasswordEntered
                      ? 'border-rose-400 dark:border-rose-700 focus-visible:ring-rose-500'
                      : isPasswordReady
                      ? 'border-emerald-400 dark:border-emerald-700 focus-visible:ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Confirm Password
                </label>
                {formData.confirmPassword && (
                  <span
                    className={`text-[10px] font-semibold ${
                      formData.password === formData.confirmPassword
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-500'
                    }`}
                  >
                    {formData.password === formData.confirmPassword ? '✓ Passwords match' : 'Passwords do not match'}
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="h-10 text-xs sm:text-sm rounded-xl pr-10 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Password Security Strength Bar */}
          {formData.password && (
            <div className="space-y-2 pt-0.5">
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${strengthDetails.color}`}
                  style={{ width: `${strengthDetails.percent}%` }}
                />
              </div>

              {/* Password Checklist Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                <div
                  className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md transition-colors ${
                    hasLength
                      ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold'
                      : 'text-rose-600 bg-rose-50/70 dark:bg-rose-950/30'
                  }`}
                >
                  {hasLength ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : <span className="w-2.5 text-center font-bold">✕</span>}
                  <span>8+ Characters</span>
                </div>
                <div
                  className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md transition-colors ${
                    hasUpper
                      ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold'
                      : 'text-rose-600 bg-rose-50/70 dark:bg-rose-950/30'
                  }`}
                >
                  {hasUpper ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : <span className="w-2.5 text-center font-bold">✕</span>}
                  <span>Uppercase (A-Z)</span>
                </div>
                <div
                  className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md transition-colors ${
                    hasNumber
                      ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold'
                      : 'text-rose-600 bg-rose-50/70 dark:bg-rose-950/30'
                  }`}
                >
                  {hasNumber ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : <span className="w-2.5 text-center font-bold">✕</span>}
                  <span>Number (0-9)</span>
                </div>
                <div
                  className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md transition-colors ${
                    hasSymbol
                      ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold'
                      : 'text-rose-600 bg-rose-50/70 dark:bg-rose-950/30'
                  }`}
                >
                  {hasSymbol ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : <span className="w-2.5 text-center font-bold">✕</span>}
                  <span>Symbol (!@#$)</span>
                </div>
              </div>

              {/* Status Alert: Prohibit Weak Passwords or Celebrate Strongest */}
              {isWeakPasswordEntered && (
                <div className="flex items-start sm:items-center justify-between gap-2 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-[11px] text-rose-800 dark:text-rose-200">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                    <span>
                      <strong>Weak passwords prohibited:</strong> Please fulfill all 4 criteria above.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSuggestPassword}
                    className="shrink-0 text-[10px] font-bold text-[#006EF3] dark:text-blue-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-950 cursor-pointer shadow-2xs"
                  >
                    Auto-fill Strongest
                  </button>
                </div>
              )}

              {isPasswordReady && (
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-[11px] text-emerald-800 dark:text-emerald-200">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    <strong>Strongest password verified:</strong> Meets all security standards for submission.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 3: Academic Placement & Goals */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
            <Compass className="h-3.5 w-3.5 text-[#006EF3]" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Academic Placement & Goals
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Target CEFR English Level *
              </label>
              <select
                value={formData.targetLevel}
                onChange={(e) => setFormData({ ...formData, targetLevel: e.target.value })}
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#006EF3] transition-colors"
              >
                {CEFR_LEVELS.map((lvl) => (
                  <option key={lvl.value} value={lvl.value}>
                    {lvl.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Native / First Language
              </label>
              <Input
                placeholder="e.g. Kinyarwanda, French, Swahili"
                value={formData.nativeLanguage}
                onChange={(e) => setFormData({ ...formData, nativeLanguage: e.target.value })}
                className="h-10 text-xs sm:text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80"
              />
            </div>
          </div>

          {/* Primary Learning Goals */}
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
                    className={`text-[11px] sm:text-xs px-3 py-1.5 rounded-xl border font-medium transition-all cursor-pointer ${
                      selected
                        ? 'bg-[#006EF3]/10 text-[#006EF3] border-[#006EF3] font-bold dark:bg-[#006EF3]/20 shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                    }`}
                  >
                    {selected ? '✓ ' : '+ '}
                    {goal}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Motivation / Learning Background */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Why do you want to learn with LinguaChris? (Motivation)
            </label>
            <textarea
              rows={2}
              placeholder="Tell us a little about yourself, your career or academic aspirations..."
              value={formData.motivation}
              onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#006EF3] transition-colors resize-none"
            />
          </div>
        </div>

        {/* Submit Button & Security Note */}
        <div className="pt-2 space-y-2">
          <Button
            type="submit"
            disabled={isLoading || isWeakPasswordEntered || (Boolean(formData.confirmPassword) && formData.password !== formData.confirmPassword)}
            className={`w-full font-bold h-11 rounded-xl shadow-md text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
              isWeakPasswordEntered
                ? 'bg-slate-200 dark:bg-slate-800 text-rose-600 dark:text-rose-400 cursor-not-allowed border border-rose-300 dark:border-rose-800 shadow-none'
                : 'bg-[#012970] hover:bg-[#006EF3] text-white active:scale-[0.99] cursor-pointer'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Submitting Application...
              </span>
            ) : isWeakPasswordEntered ? (
              <span className="flex items-center gap-2 font-bold">
                <Lock className="h-4 w-4" />
                Strongest Password Required (Weak Prohibited)
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Submit Application & Create Account
              </span>
            )}
          </Button>

          <p className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" />
            <span>256-bit SSL encrypted & secure student credential management.</span>
          </p>
        </div>
      </form>

      {/* Footer Links */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 pt-3.5 mt-3.5 text-center">
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
