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
      <div>
        <Badge variant="indigo">Teacher Account</Badge>
        <h1 className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Profile &amp; Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Manage your public instructor profile and account security credentials.
        </p>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2.5 rounded-2xl border p-4 text-xs font-semibold shadow-md ${
            feedback.type === 'success'
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
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === tab.id
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
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-6 text-center space-y-4 shadow-lg border-slate-200 dark:border-slate-800">
              <div className="relative mx-auto w-24 h-24">
                <Avatar className="w-24 h-24 text-2xl border-4 border-indigo-100 dark:border-indigo-950 shadow-xl">
                  <AvatarImage src={formData.avatarUrl || ''} />
                  <AvatarFallback className="bg-[#3B6748] text-white font-black text-2xl">
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

          <div className="lg:col-span-8">
            <Card className="shadow-lg border-slate-200 dark:border-slate-800">
              <form onSubmit={handleSaveProfile}>
                <CardHeader className="border-b border-slate-100 p-6 dark:border-slate-800">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <User className="h-4 w-4 text-primary-600" />
                    Personal &amp; Professional Credentials
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



                  <Input
                    label="Profile Avatar URL"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.avatarUrl}
                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                  />
                </CardContent>

                <CardFooter className="flex justify-end border-t border-slate-100 p-6 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                  <Button type="submit" variant="gradient" disabled={savingProfile}>
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
