'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  GraduationCap,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Languages,
  Clock,
  BookOpen,
  Target,
  Plus,
  X,
  Flame,
  ShieldCheck
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

const CEFR_LEVELS = ['PRE_A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const PREDEFINED_GOALS = [
  'Improve speaking & conversational fluency',
  'Master English grammar & sentence structure',
  'Expand professional & business vocabulary',
  'Prepare for job interview in English',
  'Prepare for academic studies / IELTS / TOEFL',
  'Improve workplace email & report writing',
  'Refine accent & pronunciation clarity',
  'Confidently present to international clients',
];

export default function StudentProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [customGoalInput, setCustomGoalInput] = useState('');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: 'Rwanda',
    city: 'Kigali',
    timezone: 'Africa/Kigali',
    preferredLanguage: 'en',
    avatarUrl: '',
    nativeLanguage: '',
    currentLevel: 'B1',
    targetLevel: 'B2',
    learningGoals: [] as string[],
    preferredSchedule: '',
    englishExperience: '',
    bio: '',
    targetSkills: ['SPEAKING', 'GRAMMAR', 'LISTENING'] as string[],
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res: any = await apiClient.get('/students/me');
      const profileData = res?.data || res;
      if (profileData && profileData.user) {
        setForm({
          firstName: profileData.user.firstName || '',
          lastName: profileData.user.lastName || '',
          email: profileData.user.email || '',
          phone: profileData.user.phone || '',
          country: profileData.user.country || 'Rwanda',
          city: profileData.user.city || 'Kigali',
          timezone: profileData.user.timezone || 'Africa/Kigali',
          preferredLanguage: profileData.user.preferredLanguage || 'en',
          avatarUrl: profileData.user.avatarUrl || '',
          nativeLanguage: profileData.profile?.nativeLanguage || '',
          currentLevel: profileData.profile?.currentLevel || 'B1',
          targetLevel: profileData.profile?.targetLevel || 'B2',
          learningGoals: profileData.profile?.learningGoals || ['Improve speaking & conversational fluency'],
          preferredSchedule: profileData.profile?.preferredSchedule || '',
          englishExperience: profileData.profile?.englishExperience || '',
          bio: profileData.profile?.bio || '',
          targetSkills: profileData.profile?.targetSkills || ['SPEAKING', 'GRAMMAR'],
        });
      }
    } catch (err) {
      console.error('Failed to load student profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const toggleGoal = (goal: string) => {
    setForm((prev) => {
      const exists = prev.learningGoals.includes(goal);
      return {
        ...prev,
        learningGoals: exists
          ? prev.learningGoals.filter((g) => g !== goal)
          : [...prev.learningGoals, goal],
      };
    });
  };

  const handleAddCustomGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoalInput.trim()) return;
    if (!form.learningGoals.includes(customGoalInput.trim())) {
      setForm((prev) => ({
        ...prev,
        learningGoals: [...prev.learningGoals, customGoalInput.trim()],
      }));
    }
    setCustomGoalInput('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await apiClient.patch('/students/me', form);
      setFeedback({ type: 'success', message: 'Student learning profile updated successfully!' });
      setTimeout(() => setFeedback(null), 4000);
      await fetchProfile();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl animate-fade-in pb-16">
      {/* Header */}
      <div>
        <Badge variant="indigo">Student Academic Identity & Learning Record</Badge>
        <h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Student Profile & Learning Goals
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Manage your personal contact details, target CEFR proficiency level, native language, and learning milestone goals.
        </p>
      </div>

      {feedback && (
        <div
          className={`flex items-center justify-between rounded-2xl p-4 text-xs font-semibold shadow-md ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="underline text-[11px]">Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center text-xs text-slate-400">Loading student profile...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (4 cols): Academic ID & Verified Metrics Card */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-6 text-center border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
              <div className="relative mx-auto w-24 h-24">
                <Avatar className="w-24 h-24 text-2xl border-4 border-indigo-100 dark:border-indigo-950 shadow-xl">
                  <AvatarImage src={form.avatarUrl || ''} />
                  <AvatarFallback className="bg-gradient-to-tr from-indigo-600 to-primary-600 text-white font-black text-2xl">
                    {form.firstName?.[0]}{form.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 bg-emerald-500 text-white p-1 rounded-full border-2 border-white dark:border-slate-900 shadow">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {form.firstName} {form.lastName}
                </h2>
                <p className="text-xs text-slate-500">{form.email}</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <Badge variant="indigo" className="text-xs font-bold">
                  Current Level: {form.currentLevel}
                </Badge>
                <Badge variant="success" className="text-xs font-bold">
                  Target: {form.targetLevel}
                </Badge>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-left text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Account Role:</span>
                  <span className="font-bold text-slate-900 dark:text-white">STUDENT</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Native Tongue:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{form.nativeLanguage || 'English'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Timezone:</span>
                  <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">{form.timezone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Email Status:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ Verified</span>
                </div>
              </div>
            </Card>

            <Card className="p-5 border-l-4 border-l-primary-600 bg-primary-50/40 dark:bg-primary-950/20 shadow-md">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
                <Sparkles className="h-4 w-4 text-primary-600" /> Academic Integrity Notice
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Your assigned CEFR diagnostic level, course grades, attendance, and payment records are protected and maintained by authorized instructors.
              </p>
            </Card>
          </div>

          {/* Right Column (8 cols): Complete Editable Profile Form */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="shadow-lg border-slate-200 dark:border-slate-800">
              <form onSubmit={handleSave}>
                <CardHeader className="border-b border-slate-100 p-6 dark:border-slate-800">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <User className="h-4 w-4 text-primary-600" />
                    Personal Details & Academic Goals
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure your profile details, target CEFR proficiency, and milestone objectives
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      required
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    />
                    <Input
                      label="Last Name"
                      required
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        disabled
                        className="flex h-10 w-full rounded-lg border border-input bg-slate-100 px-3 py-2 text-xs text-slate-500 cursor-not-allowed dark:bg-slate-800"
                      />
                    </div>
                    <Input
                      label="Phone Number"
                      type="tel"
                      placeholder="+250 788 123 456"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label="Country"
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                    />
                    <Input
                      label="City / Region"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Timezone
                      </label>
                      <select
                        value={form.timezone}
                        onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                        className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
                      >
                        <option value="Africa/Kigali">Africa/Kigali (UTC+02:00)</option>
                        <option value="Africa/Nairobi">Africa/Nairobi (UTC+03:00)</option>
                        <option value="Europe/London">Europe/London (UTC+00:00)</option>
                        <option value="America/New_York">America/New_York (UTC-05:00)</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Native Language"
                      placeholder="e.g. Kinyarwanda, French, Swahili"
                      value={form.nativeLanguage}
                      onChange={(e) => setForm({ ...form, nativeLanguage: e.target.value })}
                    />

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Target CEFR Level
                      </label>
                      <select
                        value={form.targetLevel}
                        onChange={(e) => setForm({ ...form, targetLevel: e.target.value })}
                        className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                      >
                        {CEFR_LEVELS.map((lvl) => (
                          <option key={lvl} value={lvl}>Level {lvl}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Interactive English Goals Builder */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary-600" /> English Learning Goals
                      </label>
                      <span className="text-[11px] text-slate-400">
                        {form.learningGoals.length} selected
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {PREDEFINED_GOALS.map((goal) => {
                        const isSelected = form.learningGoals.includes(goal);
                        return (
                          <button
                            key={goal}
                            type="button"
                            onClick={() => toggleGoal(goal)}
                            className={`flex items-start text-left gap-2.5 p-3 rounded-xl border text-xs transition-all ${
                              isSelected
                                ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-950/40 text-primary-900 dark:text-primary-200 font-bold'
                                : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 hover:bg-slate-100 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="mt-0.5 h-3.5 w-3.5 rounded text-primary-600 accent-primary-600 shrink-0"
                            />
                            <span>{goal}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Add Custom Goal */}
                    <div className="flex gap-2 pt-1">
                      <Input
                        placeholder="Add a custom goal (e.g. 'I want to speak fluently during quarterly reviews')..."
                        value={customGoalInput}
                        onChange={(e) => setCustomGoalInput(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddCustomGoal}
                        disabled={!customGoalInput.trim()}
                        className="shrink-0 text-xs"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Goal
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Preferred Weekly Study Schedule
                    </label>
                    <Input
                      placeholder="e.g. Monday & Wednesday evenings (18:00 - 19:30 UTC+2)"
                      value={form.preferredSchedule}
                      onChange={(e) => setForm({ ...form, preferredSchedule: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Learning Background & Experience Bio
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Tell your instructor about past English courses, challenges, and specific goals..."
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      className="w-full rounded-xl border border-input bg-background p-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                    />
                  </div>

                  <Input
                    label="Avatar Photo URL"
                    placeholder="https://images.unsplash.com/..."
                    value={form.avatarUrl}
                    onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
                  />
                </CardContent>

                <CardFooter className="flex justify-end gap-3 border-t border-slate-100 p-6 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                  <Button type="submit" variant="gradient" disabled={saving}>
                    <Save className="mr-1.5 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Profile Changes'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
