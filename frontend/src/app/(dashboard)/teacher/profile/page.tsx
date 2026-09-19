'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Award,
  BookOpen,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Clock,
  Globe,
  MapPin,
  Eye,
  Sparkles,
  Layers,
  Languages
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api-client';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

const ALL_CEFR_LEVELS = ['PRE_A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export default function TeacherProfilePage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    country: (user as any)?.country || 'Rwanda',
    city: (user as any)?.city || 'Kigali',
    timezone: (user as any)?.timezone || 'Africa/Kigali',
    preferredLanguage: (user as any)?.preferredLanguage || 'en',
    avatarUrl: user?.avatarUrl || '',
    headline: user?.teacherProfile?.headline || 'Accredited English Language Instructor',
    bio: user?.teacherProfile?.bio || '',
    hourlyRate: user?.teacherProfile?.hourlyRate || 35,
    experienceYears: user?.teacherProfile?.experienceYears || 5,
    specialties: user?.teacherProfile?.specialties || ['Business English', 'IELTS Prep', 'Grammar'],
    languagesSpoken: (user?.teacherProfile as any)?.languagesSpoken || ['English', 'Kinyarwanda'],
    levelsTaught: (user?.teacherProfile as any)?.levelsTaught || ['A1', 'A2', 'B1', 'B2', 'C1'],
    profileVisibility: (user?.teacherProfile as any)?.profileVisibility || 'PUBLIC',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || '',
        country: (user as any).country || 'Rwanda',
        city: (user as any).city || 'Kigali',
        timezone: (user as any).timezone || 'Africa/Kigali',
        preferredLanguage: (user as any).preferredLanguage || 'en',
        avatarUrl: user.avatarUrl || '',
        headline: user.teacherProfile?.headline || 'Accredited English Language Instructor',
        bio: user.teacherProfile?.bio || '',
        hourlyRate: user.teacherProfile?.hourlyRate || 35,
        experienceYears: user.teacherProfile?.experienceYears || 5,
        specialties: user.teacherProfile?.specialties || ['Business English', 'IELTS Prep', 'Grammar'],
        languagesSpoken: (user.teacherProfile as any)?.languagesSpoken || ['English', 'Kinyarwanda'],
        levelsTaught: (user.teacherProfile as any)?.levelsTaught || ['A1', 'A2', 'B1', 'B2', 'C1'],
        profileVisibility: (user.teacherProfile as any)?.profileVisibility || 'PUBLIC',
      });
    }
  }, [user]);

  const toggleLevelTaught = (level: string) => {
    setFormData((prev) => {
      const exists = prev.levelsTaught.includes(level);
      return {
        ...prev,
        levelsTaught: exists
          ? prev.levelsTaught.filter((l: string) => l !== level)
          : [...prev.levelsTaught, level],
      };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await apiClient.patch('/users/profile', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        country: formData.country,
        city: formData.city,
        timezone: formData.timezone,
        preferredLanguage: formData.preferredLanguage,
        avatarUrl: formData.avatarUrl,
        headline: formData.headline,
        bio: formData.bio,
        hourlyRate: Number(formData.hourlyRate),
        experienceYears: Number(formData.experienceYears),
        specialties: formData.specialties,
        languagesSpoken: formData.languagesSpoken,
        levelsTaught: formData.levelsTaught,
        profileVisibility: formData.profileVisibility,
      });

      if (refreshUser) await refreshUser();
      setSuccessMsg('Instructor profile and teaching credentials updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl animate-fade-in pb-16">
      {/* Header */}
      <div>
        <Badge variant="indigo">Faculty Credentials & Public Profile</Badge>
        <h1 className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Teacher Profile & Professional Identity
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Manage your public instructor bio, teaching experience, CEFR levels taught, languages spoken, and profile visibility.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs font-semibold text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (4 cols): Accreditation & Public Card */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 text-center space-y-4 shadow-lg border-slate-200 dark:border-slate-800">
            <div className="relative mx-auto w-24 h-24">
              <Avatar className="w-24 h-24 text-2xl border-4 border-indigo-100 dark:border-indigo-950 shadow-xl">
                <AvatarImage src={formData.avatarUrl || ''} />
                <AvatarFallback className="bg-gradient-to-tr from-indigo-600 to-primary-600 text-white font-black text-2xl">
                  {formData.firstName?.[0]}{formData.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 bg-emerald-500 text-white p-1 rounded-full border-2 border-white dark:border-slate-900 shadow">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {formData.firstName} {formData.lastName}
              </h3>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{formData.headline}</p>
            </div>

            <div className="flex flex-wrap justify-center gap-1.5">
              <Badge variant="success" className="text-[10px]">
                <ShieldCheck className="h-3 w-3 mr-1" /> Approved Faculty
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {formData.experienceYears} Yrs Experience
              </Badge>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 text-left text-xs dark:bg-slate-900 space-y-2 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Account Role:</span>
                <span className="font-bold text-slate-900 dark:text-white">TEACHER</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Hourly Coaching:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">${formData.hourlyRate} / hr</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Account Status:</span>
                <span className="font-bold text-emerald-500">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Visibility:</span>
                <span className="font-semibold text-primary-600">{formData.profileVisibility}</span>
              </div>
            </div>
          </Card>

          {/* Visibility Selector Card */}
          <Card className="p-5 space-y-3 shadow-md border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary-600" /> Profile Visibility
            </h4>
            <div className="space-y-2">
              {[
                { id: 'PUBLIC', label: 'Public (Visible on course listings)' },
                { id: 'STUDENTS_ONLY', label: 'Enrolled Students Only' },
                { id: 'PRIVATE', label: 'Private (Staff only)' },
              ].map((v) => (
                <label
                  key={v.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    formData.profileVisibility === v.id
                      ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/30 text-primary-900 dark:text-primary-200 font-bold'
                      : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span>{v.label}</span>
                  <input
                    type="radio"
                    name="profileVisibility"
                    value={v.id}
                    checked={formData.profileVisibility === v.id}
                    onChange={(e) => setFormData({ ...formData, profileVisibility: e.target.value })}
                    className="h-3.5 w-3.5 text-primary-600 accent-primary-600"
                  />
                </label>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column (8 cols): Complete Profile Form */}
        <div className="lg:col-span-8">
          <Card className="shadow-lg border-slate-200 dark:border-slate-800">
            <form onSubmit={handleSave}>
              <CardHeader className="border-b border-slate-100 p-6 dark:border-slate-800">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary-600" />
                  Personal & Professional Credentials
                </CardTitle>
                <CardDescription className="text-xs">
                  Updates reflect across course descriptions, public syllabi, and student coaching records
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                  <Input
                    label="Last Name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="flex h-10 w-full rounded-lg border border-input bg-slate-100 px-3 py-2 text-xs text-slate-500 cursor-not-allowed dark:bg-slate-800"
                    />
                  </div>

                  <Input
                    label="Phone Number"
                    value={formData.phone}
                    placeholder="+250 788 123 456"
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                  <Input
                    label="City / Region"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Timezone
                    </label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
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

                <Input
                  label="Professional Headline"
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  placeholder="CELTA Certified English Instructor • IELTS Band 8.5"
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Years of Experience"
                    type="number"
                    min={0}
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: parseInt(e.target.value, 10) || 0 })}
                  />
                  <Input
                    label="Hourly Coaching Rate ($/hr)"
                    type="number"
                    min={5}
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>

                {/* CEFR Levels Taught Multi-Check */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    CEFR Proficiency Levels Taught
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_CEFR_LEVELS.map((lvl) => {
                      const isSelected = formData.levelsTaught.includes(lvl);
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => toggleLevelTaught(lvl)}
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-primary-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {lvl}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <RichTextEditor
                  label="Biography & Teaching Philosophy (Markdown Supported)"
                  placeholder="Share your pedagogical approach, background in linguistics, certifications, and student achievements..."
                  value={formData.bio}
                  onChange={(val) => setFormData({ ...formData, bio: val })}
                  minRows={5}
                  category="general"
                />

                <Input
                  label="Profile Avatar URL"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.avatarUrl}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                />
              </CardContent>

              <CardFooter className="flex justify-end gap-3 border-t border-slate-100 p-6 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <Button type="submit" variant="gradient" disabled={loading}>
                  <Save className="h-4 w-4 mr-1.5" />
                  {loading ? 'Saving Profile...' : 'Save Profile Changes'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
