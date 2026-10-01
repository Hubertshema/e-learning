'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Save,
  ShieldCheck,
  Eye,
  Smartphone,
  LogOut,
  Mail,
  Globe,
  Clock,
  GraduationCap,
  Camera,
  Users,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useCachedData, clientCache } from '@/lib/cache';
import { apiClient } from '@/lib/api-client';


export default function TeacherSettingsPage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'SECURITY'>('PROFILE');

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    country: (user as any)?.country || 'Rwanda',
    city: (user as any)?.city || 'Kigali',
    timezone: (user as any)?.timezone || 'Africa/Kigali',
    avatarUrl: user?.avatarUrl || '',
    headline: user?.teacherProfile?.headline || 'Accredited English Language Instructor',
    hourlyRate: user?.teacherProfile?.hourlyRate || 35,
    experienceYears: user?.teacherProfile?.experienceYears || 5,
    profileVisibility: (user?.teacherProfile as any)?.profileVisibility || 'PUBLIC',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
        avatarUrl: user.avatarUrl || '',
        headline: user.teacherProfile?.headline || 'Accredited English Language Instructor',
        hourlyRate: user.teacherProfile?.hourlyRate || 35,
        experienceYears: user.teacherProfile?.experienceYears || 5,
        profileVisibility: (user.teacherProfile as any)?.profileVisibility || 'PUBLIC',
      });
    }
  }, [user]);

  const { refresh: loadSessions } = useCachedData(
    'teacher_sessions',
    async () => {
      const res: any = await apiClient.get('/users/sessions');
      return res?.sessions || [];
    },
    {
      ttl: 60_000,
      onSuccess: (data) => setActiveSessions(data),
    }
  );


  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await apiClient.patch('/users/profile', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        country: formData.country,
        city: formData.city,
        timezone: formData.timezone,
        avatarUrl: formData.avatarUrl,
        headline: formData.headline,
        hourlyRate: Number(formData.hourlyRate),
        experienceYears: Number(formData.experienceYears),
        profileVisibility: formData.profileVisibility,
      });
      clientCache.invalidate('teacher_');
      if (refreshUser) await refreshUser();
      showFeedback('success', 'Instructor profile updated successfully!');
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showFeedback('error', 'New passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      await apiClient.post('/auth/change-password', { currentPassword, newPassword });
      showFeedback('success', 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to change password. Verify your current password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogoutOtherDevices = async () => {
    if (!confirm('Are you sure you want to log out all other devices?')) return;
    try {
      await apiClient.post('/users/sessions/logout-all');
      showFeedback('success', 'All other active sessions have been revoked.');
      loadSessions();
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to revoke sessions.');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl animate-fade-in pb-16">
      {/* <div>
        <Badge variant="indigo">Teacher Account</Badge>
        <h1 className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Profile &amp; Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Manage your public instructor profile and account security credentials.
        </p>
      </div> */}

      {feedback && (
        <div
          className={`flex items-center gap-2.5 rounded-2xl border p-4 text-xs font-semibold shadow-md ${feedback.type === 'success'
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'border-destructive/20 bg-destructive/10 text-destructive'
            }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {[
          { id: 'PROFILE', label: 'Profile & Identity', icon: User },
          { id: 'SECURITY', label: 'Security & Password', icon: KeyRound },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeTab === tab.id
                  ? 'bg-white text-indigo-600 shadow-md dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB: PROFILE */}
      {activeTab === 'PROFILE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (4 cols): Live Instructor Preview & Status */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-6 text-center space-y-4 shadow-lg border-slate-200 dark:border-slate-800">
              <div className="relative mx-auto w-24 h-24">
                <Avatar className="w-24 h-24 text-2xl border-4 border-emerald-100 dark:border-emerald-950 shadow-xl">
                  <AvatarImage src={formData.avatarUrl || ''} />
                  <AvatarFallback className="bg-[#3B6748] text-white font-black text-2xl">
                    {formData.firstName?.[0] || 'T'}{formData.lastName?.[0] || ''}
                  </AvatarFallback>
                </Avatar>
                <div
                  className="absolute bottom-0 right-0 bg-emerald-500 text-white p-1 rounded-full border-2 border-white dark:border-slate-900 shadow"
                  title="Approved &amp; Verified Faculty"
                >
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {formData.firstName || 'Sarah'} {formData.lastName || 'Jenkins'}
                </h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                  {formData.headline || 'Accredited English Language Instructor'}
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-1.5">
                <Badge variant="success" className="text-[10px]">
                  <ShieldCheck className="h-3 w-3 mr-1" /> Approved Faculty
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {formData.experienceYears} Yrs Experience
                </Badge>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 text-left text-xs dark:bg-slate-900 space-y-2.5 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Account Role:</span>
                  <span className="font-bold text-slate-900 dark:text-white">TEACHER</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Hourly Coaching:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    ${formData.hourlyRate || 0} / hr
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Account Status:</span>
                  <span className="font-bold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> ACTIVE
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Directory Visibility:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formData.profileVisibility === 'PUBLIC'
                      ? 'Public'
                      : formData.profileVisibility === 'STUDENTS_ONLY'
                      ? 'Students Only'
                      : 'Private'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Live Sync Tip Card */}
            <Card className="p-5 border-l-4 border-l-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-md space-y-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-600" /> Instructor Profile Live Sync
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Changes to your name, headline, avatar, and hourly coaching rate appear in real-time across course descriptions, public syllabi, and 1-on-1 coaching requests.
              </p>
            </Card>
          </div>

          {/* Right Column (8 cols): Structured Form */}
          <div className="lg:col-span-8">
            <Card className="shadow-lg border-slate-200 dark:border-slate-800">
              <form onSubmit={handleSaveProfile}>
                <CardHeader className="border-b border-slate-100 p-6 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <User className="h-4 w-4 text-emerald-600" />
                        Personal &amp; Professional Credentials
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Updates reflect across course descriptions, public syllabi, and student coaching records
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="hidden sm:flex text-[11px] font-semibold text-slate-500">
                      Instructor ID #{user?.id ? String(user.id).slice(0, 8) : 'Verified'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Section 1: Personal & Contact Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <User className="h-3.5 w-3.5 text-emerald-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Personal &amp; Contact Information
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="First Name"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="e.g. Sarah"
                        required
                      />
                      <Input
                        label="Last Name"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="e.g. Jenkins"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-slate-400" />
                          Email Address
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            value={formData.email}
                            disabled
                            className="flex h-11 w-full rounded-lg border border-input bg-slate-100 px-3.5 py-2 text-xs text-slate-500 cursor-not-allowed dark:bg-slate-800 pr-20"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
                            <CheckCircle2 className="h-3 w-3" /> Verified
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400">Account login email is managed by institution administrators.</p>
                      </div>

                      <Input
                        label="Phone Number"
                        type="tel"
                        placeholder="+250 788 123 456"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Section 2: Regional Location & Timezone */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <Globe className="h-3.5 w-3.5 text-emerald-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Regional Location &amp; Timezone
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Input
                        label="Country"
                        placeholder="e.g. Rwanda"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      />
                      <Input
                        label="City / Region"
                        placeholder="e.g. Kigali"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          Timezone
                        </label>
                        <select
                          value={formData.timezone}
                          onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                          className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 transition-colors"
                        >
                          <option value="Africa/Kigali">Africa/Kigali (UTC+02:00)</option>
                          <option value="Africa/Nairobi">Africa/Nairobi (UTC+03:00)</option>
                          <option value="Europe/London">Europe/London (UTC+00:00)</option>
                          <option value="America/New_York">America/New_York (UTC-05:00)</option>
                          <option value="UTC">UTC (UTC+00:00)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Professional Credentials & Coaching */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Professional Credentials &amp; Coaching
                      </h4>
                    </div>

                    <Input
                      label="Professional Headline"
                      value={formData.headline}
                      onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                      placeholder="e.g. CELTA Certified English Instructor • IELTS Band 8.5"
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
                  </div>

                  {/* Section 4: Profile Avatar Photo */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <Camera className="h-3.5 w-3.5 text-emerald-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Profile Avatar Image
                      </h4>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50/70 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                      <Avatar className="w-14 h-14 shrink-0 border-2 border-white dark:border-slate-800 shadow-md">
                        <AvatarImage src={formData.avatarUrl || ''} />
                        <AvatarFallback className="bg-[#3B6748] text-white font-bold text-base">
                          {formData.firstName?.[0] || 'T'}{formData.lastName?.[0] || ''}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 w-full space-y-1">
                        <Input
                          label="Avatar Image URL"
                          placeholder="https://images.unsplash.com/..."
                          value={formData.avatarUrl}
                          onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                        />
                        <p className="text-[10px] text-slate-400">
                          Provide a direct link to a hosted PNG, JPG, or WebP portrait. Changes preview live in the sidebar.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section 5: Profile Directory Visibility */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <Eye className="h-3.5 w-3.5 text-emerald-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Profile Directory Visibility
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        {
                          id: 'PUBLIC',
                          label: 'Public',
                          desc: 'Visible to all students on course listings and public directory.',
                          icon: Globe,
                        },
                        {
                          id: 'STUDENTS_ONLY',
                          label: 'Enrolled Students',
                          desc: 'Visible only to active students currently enrolled in your courses.',
                          icon: Users,
                        },
                        {
                          id: 'PRIVATE',
                          label: 'Private (Staff)',
                          desc: 'Hidden from students. Visible only to platform administrators.',
                          icon: Lock,
                        },
                      ].map((item) => {
                        const isSelected = formData.profileVisibility === item.id;
                        const IconComp = item.icon;
                        return (
                          <label
                            key={item.id}
                            className={`relative flex flex-col justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-sm ring-1 ring-emerald-600'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-900/40'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                <IconComp className="h-3.5 w-3.5" />
                              </div>
                              <input
                                type="radio"
                                name="profileVisibility"
                                value={item.id}
                                checked={isSelected}
                                onChange={(e) => setFormData({ ...formData, profileVisibility: e.target.value })}
                                className="h-4 w-4 text-emerald-600 accent-emerald-600 mt-0.5"
                              />
                            </div>
                            <div>
                              <p className={`text-xs font-bold ${isSelected ? 'text-emerald-900 dark:text-emerald-200' : 'text-slate-800 dark:text-slate-200'}`}>
                                {item.label}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                {item.desc}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 p-6 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                  <p className="text-xs text-slate-400 hidden sm:block">
                    All credentials and visibility preferences are saved securely.
                  </p>
                  <Button type="submit" variant="gradient" disabled={savingProfile} className="w-full sm:w-auto font-bold">
                    <Save className="h-4 w-4 mr-1.5" />
                    {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* TAB: SECURITY */}
      {activeTab === 'SECURITY' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-lg border-slate-200 dark:border-slate-800">
            <form onSubmit={handlePasswordChange}>
              <CardHeader className="border-b border-slate-100 p-6 dark:border-slate-800">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary-600" /> Security &amp; Password
                </CardTitle>
                <CardDescription className="text-xs">
                  Ensure your teacher portal account is protected with strong password complexity
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <Input
                  label="New Password (min 8 characters)"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </CardContent>

              <CardFooter className="border-t border-slate-100 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <Button type="submit" variant="gradient" className="w-full font-bold" disabled={savingPassword}>
                  <Shield className="mr-1.5 h-4 w-4" />
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card className="shadow-lg border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-indigo-600" /> Active Device Sessions
                </CardTitle>
                <CardDescription className="text-xs">
                  Active browser sessions authenticated with your credentials
                </CardDescription>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogoutOtherDevices}
                className="text-xs font-bold shadow-md"
              >
                <LogOut className="mr-1 h-3 w-3" />
                Revoke Others
              </Button>
            </div>

            <div className="space-y-2.5 pt-2">
              {activeSessions.length > 0 ? (
                activeSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 p-3.5 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {session.device}
                        </span>
                        {session.isCurrent && (
                          <Badge variant="success" className="text-[9px] py-0">
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Active since: {new Date(session.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">ACTIVE</span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  Single active session.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
