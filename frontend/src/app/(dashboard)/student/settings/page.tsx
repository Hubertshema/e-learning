'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Shield,
  ShieldCheck,
  KeyRound,
  Lock,
  Smartphone,
  LogOut,
  Award,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  Search,
  ExternalLink,
  Copy,
  Check,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api-client';
import { clientCache } from '@/lib/cache';
import { Skeleton } from '@/components/ui/skeleton';

const CEFR_LEVELS = ['PRE_A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

interface VerifiedCertificate {
  id: string;
  certificateCode: string;
  studentName: string;
  courseTitle: string;
  levelCompleted: string;
  finalGrade: number;
  issueDate: string;
  instructorName: string;
  status: 'VALID' | 'REVOKED';
  isValid: boolean;
  issuedBy: string;
}

export default function StudentSettingsPage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'SECURITY' | 'VERIFICATION'>('PROFILE');

  // --- Profile State ---
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: (user as any)?.phone || '',
    country: (user as any)?.country || 'Rwanda',
    city: (user as any)?.city || 'Kigali',
    timezone: (user as any)?.timezone || 'Africa/Kigali',
    preferredLanguage: (user as any)?.preferredLanguage || 'en',
    avatarUrl: user?.avatarUrl || '',
    nativeLanguage: (user?.studentProfile as any)?.nativeLanguage || '',
    currentLevel: (user?.studentProfile as any)?.currentLevel || 'B1',
    targetLevel: (user?.studentProfile as any)?.targetLevel || 'B2',
  });

  const [savingProfile, setSavingProfile] = useState(false);

  // --- Security & Password State ---
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);

  // --- Active Sessions State ---
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // --- Certificate Verification State ---
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifiedResult, setVerifiedResult] = useState<VerifiedCertificate | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [myCertificates, setMyCertificates] = useState<any[]>([]);
  const [loadingMyCerts, setLoadingMyCerts] = useState(false);

  // --- General Feedback Alert ---
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Synchronize form when user context becomes available or updates
  useEffect(() => {
    if (user) {
      setProfileForm((prev) => ({
        ...prev,
        firstName: user.firstName || prev.firstName,
        lastName: user.lastName || prev.lastName,
        email: user.email || prev.email,
        phone: (user as any).phone || prev.phone,
        country: (user as any).country || prev.country,
        city: (user as any).city || prev.city,
        timezone: (user as any).timezone || prev.timezone,
        preferredLanguage: (user as any).preferredLanguage || prev.preferredLanguage,
        avatarUrl: user.avatarUrl || prev.avatarUrl,
        nativeLanguage: (user.studentProfile as any)?.nativeLanguage ?? prev.nativeLanguage,
        currentLevel: (user.studentProfile as any)?.currentLevel ?? prev.currentLevel,
        targetLevel: (user.studentProfile as any)?.targetLevel ?? prev.targetLevel,
      }));
    }
  }, [user]);

  // Load fresh student profile and active sessions in the background
  const loadFreshData = async () => {
    try {
      setLoadingSessions(true);
      const [profileRes, sessionsRes]: any = await Promise.allSettled([
        apiClient.get('/users/profile'),
        apiClient.get('/users/sessions'),
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value) {
        const d = profileRes.value?.data || profileRes.value;
        const u = d.user || d;
        const sp = d.studentProfile || d.profile || u.studentProfile || {};

        setProfileForm((prev) => ({
          ...prev,
          firstName: u.firstName || prev.firstName,
          lastName: u.lastName || prev.lastName,
          email: u.email || prev.email,
          phone: u.phone || prev.phone,
          country: u.country || prev.country,
          city: u.city || prev.city,
          timezone: u.timezone || prev.timezone,
          preferredLanguage: u.preferredLanguage || prev.preferredLanguage,
          avatarUrl: u.avatarUrl || prev.avatarUrl,
          nativeLanguage: sp.nativeLanguage || prev.nativeLanguage,
          currentLevel: sp.currentLevel || prev.currentLevel,
          targetLevel: sp.targetLevel || prev.targetLevel,
        }));
      }

      if (sessionsRes.status === 'fulfilled' && sessionsRes.value?.sessions) {
        setActiveSessions(sessionsRes.value.sessions);
      }
    } catch (err) {
      console.warn('Background sync student settings notice:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  // Load earned certificates for quick verification
  const loadMyCertificates = async () => {
    try {
      setLoadingMyCerts(true);
      const res: any = await apiClient.get('/student/certificates');
      const data = res?.data || res;
      if (Array.isArray(data)) {
        setMyCertificates(data);
      }
    } catch {
      // Non-critical, ignore
    } finally {
      setLoadingMyCerts(false);
    }
  };

  useEffect(() => {
    loadFreshData();
    loadMyCertificates();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      setSavingProfile(true);
      await apiClient.patch('/users/profile', profileForm);

      clientCache.invalidate('student_');
      if (refreshUser) {
        await refreshUser();
      }

      setFeedback({
        type: 'success',
        message: 'Student profile & CEFR targets updated successfully!',
      });
      setTimeout(() => setFeedback(null), 4500);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update student profile. Please try again.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // --- Security & Password Actions ---
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setFeedback({ type: 'error', message: 'New password and confirmation do not match.' });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setFeedback({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }

    try {
      setSavingPassword(true);
      await apiClient.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setFeedback({ type: 'success', message: 'Security password changed successfully!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setFeedback(null), 4500);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update password. Please check your current password.',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!confirm('Are you sure you want to log out all other active browser sessions?')) return;
    try {
      await apiClient.post('/users/sessions/logout-all');
      setFeedback({ type: 'success', message: 'All other active sessions have been invalidated.' });
      loadFreshData();
      setTimeout(() => setFeedback(null), 4500);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to revoke other sessions.' });
    }
  };

  // --- Certificate Verification Actions ---
  const handleVerifyCertificate = async (codeToVerify?: string) => {
    const targetCode = (codeToVerify || verifyCode).trim().toUpperCase();
    if (!targetCode) {
      setVerifyError('Please enter a valid certificate verification code.');
      return;
    }

    setVerifying(true);
    setVerifyError(null);
    setVerifiedResult(null);
    if (codeToVerify) {
      setVerifyCode(codeToVerify);
    }

    try {
      const res = await apiClient.get<VerifiedCertificate>(`/public/certificates/${encodeURIComponent(targetCode)}`);
      const payload: any = (res as any)?.data || res;
      if (payload && (payload.certificateCode || payload.isValid)) {
        setVerifiedResult(payload);
      } else {
        setVerifyError(`Certificate code '${targetCode}' was not found in our official registry.`);
      }
    } catch (err: any) {
      setVerifyError(err?.message || `Certificate code '${targetCode}' was not found in our official registry.`);
    } finally {
      setVerifying(false);
    }
  };

  const handleCopyVerificationLink = () => {
    if (!verifiedResult) return;
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/verify/certificate/${verifiedResult.certificateCode}`
      : `/verify/certificate/${verifiedResult.certificateCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in pb-20">
      {/* Page Header */}
      <div>
        <Badge variant="indigo">Student Academic Identity & Security</Badge>
        <h1 className="mt-1 text-xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Student Profile, Settings & Credentials
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Manage your personal identity, target CEFR proficiency, password security, and verify issued academic certificates.
        </p>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-2xl p-4 text-xs font-semibold shadow-md transition-all ${
            feedback.type === 'success'
              ? 'bg-[#F3F7FC] text-[#012970] border border-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-800'
              : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#006EF3]" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span className="font-semibold">{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="underline text-[11px] text-[#006EF3] hover:text-[#012970] font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Segmented Tab Switcher */}
      <div className="flex overflow-x-auto gap-1.5 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 scrollbar-hide">
        {[
          { id: 'PROFILE', label: 'Academic Profile', icon: User },
          { id: 'SECURITY', label: 'Security & Password', icon: KeyRound },
          { id: 'VERIFICATION', label: 'Certificate Verification', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                isActive
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

      {/* ========================================================================= */}
      {/* TAB 1: ACADEMIC PROFILE                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'PROFILE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left Column (4 cols): Academic ID & Verified Metrics Card */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="p-4 sm:p-6 text-center border-slate-200 dark:border-slate-800 shadow-lg space-y-3 sm:space-y-4">
              <div className="relative mx-auto w-24 h-24">
                <Avatar className="w-24 h-24 text-2xl border-4 border-blue-100 dark:border-blue-950 shadow-xl">
                  <AvatarImage src={profileForm.avatarUrl || ''} />
                  <AvatarFallback className="bg-[#012970] text-white font-black text-2xl">
                    {profileForm.firstName?.[0] || 'S'}
                    {profileForm.lastName?.[0] || ''}
                  </AvatarFallback>
                </Avatar>
                <div
                  className="absolute bottom-0 right-0 bg-emerald-500 text-white p-1 rounded-full border-2 border-white dark:border-slate-900 shadow"
                  title="Official Enrolled Student"
                >
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {profileForm.firstName} {profileForm.lastName}
                </h2>
                <p className="text-xs text-slate-500">{profileForm.email}</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <Badge variant="indigo" className="text-xs font-bold">
                  Current Level: {profileForm.currentLevel}
                </Badge>
                <Badge variant="success" className="text-xs font-bold">
                  Target: {profileForm.targetLevel}
                </Badge>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-left text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Account Role:</span>
                  <span className="font-bold text-slate-900 dark:text-white">STUDENT</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Native Tongue:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {profileForm.nativeLanguage || 'English'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Timezone:</span>
                  <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    {profileForm.timezone}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Email Status:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-5 border-l-4 border-l-primary-600 bg-primary-50/40 dark:bg-primary-950/20 shadow-md">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
                <Sparkles className="h-4 w-4 text-primary-600" /> Academic Integrity Notice
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Your assigned CEFR diagnostic level, progress tracking, and issued certificates are verified by accredited instructors and stored in our tamper-evident registry.
              </p>
            </Card>
          </div>

          {/* Right Column (8 cols): Clean Profile Form */}
          <div className="lg:col-span-8 space-y-4">
            <Card className="shadow-lg border-slate-200 dark:border-slate-800">
              <form onSubmit={handleSaveProfile}>
                <CardHeader className="border-b border-slate-100 p-6 dark:border-slate-800">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <User className="h-4 w-4 text-primary-600" />
                    Personal Details & Academic Proficiency
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Update your personal contact information, location, native tongue, and target CEFR level
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Input
                      label="First Name"
                      required
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    />
                    <Input
                      label="Last Name"
                      required
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profileForm.email}
                        disabled
                        className="flex h-10 w-full rounded-lg border border-input bg-slate-100 px-3 py-2 text-xs text-slate-500 cursor-not-allowed dark:bg-slate-800"
                      />
                      <p className="text-[10px] text-slate-400">Account login email is managed by administrators.</p>
                    </div>
                    <Input
                      label="Phone Number"
                      type="tel"
                      placeholder="+250 788 123 456"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <Input
                      label="Country"
                      value={profileForm.country}
                      onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                    />
                    <Input
                      label="City / Region"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                    />
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Timezone
                      </label>
                      <select
                        value={profileForm.timezone}
                        onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                        className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
                      >
                        <option value="Africa/Kigali">Africa/Kigali (UTC+02:00)</option>
                        <option value="Africa/Nairobi">Africa/Nairobi (UTC+03:00)</option>
                        <option value="Europe/London">Europe/London (UTC+00:00)</option>
                        <option value="Europe/Paris">Europe/Paris (UTC+01:00)</option>
                        <option value="America/New_York">America/New_York (UTC-05:00)</option>
                        <option value="UTC">UTC (Universal Time)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Input
                      label="Native Language"
                      placeholder="e.g. Kinyarwanda, French, Swahili"
                      value={profileForm.nativeLanguage}
                      onChange={(e) => setProfileForm({ ...profileForm, nativeLanguage: e.target.value })}
                    />

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Target CEFR Proficiency
                      </label>
                      <select
                        value={profileForm.targetLevel}
                        onChange={(e) => setProfileForm({ ...profileForm, targetLevel: e.target.value })}
                        className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                      >
                        {CEFR_LEVELS.map((lvl) => (
                          <option key={lvl} value={lvl}>
                            Level {lvl}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Input
                    label="Avatar Photo URL"
                    placeholder="https://images.unsplash.com/..."
                    value={profileForm.avatarUrl}
                    onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })}
                  />
                </CardContent>

                <CardFooter className="flex justify-end gap-3 border-t border-slate-100 p-4 sm:p-6 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                  <Button type="submit" variant="gradient" disabled={savingProfile} className="w-full sm:w-auto">
                    <Save className="mr-1.5 h-4 w-4" />
                    {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SECURITY & PASSWORD                                                */}
      {/* ========================================================================= */}
      {activeTab === 'SECURITY' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card className="shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader className="border-b border-slate-100 p-4 sm:p-6 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary-600" />
                Change Password
              </CardTitle>
              <CardDescription className="text-xs">
                Ensure your student account uses a secure, strong password
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                />

                <Input
                  label="New Password (min 8 characters)"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                />

                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="gradient" disabled={savingPassword} className="w-full sm:w-auto">
                    <Shield className="mr-1.5 h-4 w-4" />
                    {savingPassword ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Active Browser Sessions */}
          <Card className="shadow-lg border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-indigo-600" /> Active Sessions
                </CardTitle>
                <CardDescription className="text-xs">
                  Active browser logins on your account
                </CardDescription>
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogoutAllDevices}
                className="text-xs font-bold shrink-0"
              >
                <LogOut className="mr-1 h-3 w-3" />
                Revoke Others
              </Button>
            </div>

            <div className="space-y-2.5 pt-2">
              {loadingSessions ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3.5 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-12 rounded-full" />
                  </div>
                </div>
              ) : activeSessions.length > 0 ? (
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

                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      ACTIVE
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  Current session active.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CERTIFICATE VERIFICATION (REAL DATA RETRIEVAL)                     */}
      {/* ========================================================================= */}
      {activeTab === 'VERIFICATION' && (
        <div className="space-y-6">
          <Card className="shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader className="border-b border-slate-100 p-4 sm:p-6 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Certificate Verification & Registry Search
              </CardTitle>
              <CardDescription className="text-xs">
                Enter any official certificate verification code to inspect authentic issuance, grades, and CEFR credentials.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-5">
              {/* Verification Search Bar */}
              <div className="flex flex-col gap-2.5">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleVerifyCertificate();
                      }
                    }}
                    placeholder="Enter Certificate Code (e.g. FE-2026-6NEW or FLE-...)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-xs font-mono font-bold tracking-wider placeholder:font-sans placeholder:font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                  />
                </div>
                <Button
                  onClick={() => handleVerifyCertificate()}
                  variant="gradient"
                  disabled={verifying || !verifyCode.trim()}
                  className="w-full text-xs font-bold"
                >
                  <Search className="mr-1.5 h-3.5 w-3.5" />
                  {verifying ? 'Verifying Registry...' : 'Verify Certificate'}
                </Button>
              </div>

              {/* Error Notice */}
              {verifyError && (
                <div className="p-4 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{verifyError}</span>
                </div>
              )}

              {/* Verified Result Card */}
              {verifiedResult && (
                <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-[#F3F7FC] to-white dark:from-blue-950/20 dark:to-slate-900 p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-blue-200 dark:border-blue-800/60 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-[#012970] text-[#F5B400] flex items-center justify-center shadow-lg shadow-blue-900/20">
                        <Award className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-black text-[#012970] dark:text-white tracking-wider">
                            {verifiedResult.certificateCode}
                          </span>
                          <Badge variant="success" className="text-[10px] py-0 font-bold">
                            ✓ {verifiedResult.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          Issued by {verifiedResult.issuedBy}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyVerificationLink}
                        className="text-xs font-bold flex-1 sm:flex-none"
                      >
                        {copiedLink ? <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
                        {copiedLink ? 'Link Copied!' : 'Copy Link'}
                      </Button>
                      <Link
                        href={`/verify/certificate/${verifiedResult.certificateCode}`}
                        target="_blank"
                        className="inline-flex items-center justify-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-3 py-2 rounded-xl transition-colors flex-1 sm:flex-none"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Public View
                      </Link>
                    </div>
                  </div>

                  {/* Certificate Credential Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 space-y-1">
                      <span className="text-[11px] text-slate-400 font-medium">Recipient Student</span>
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {verifiedResult.studentName}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 space-y-1">
                      <span className="text-[11px] text-slate-400 font-medium">Course Completed</span>
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {verifiedResult.courseTitle}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 space-y-1">
                      <span className="text-[11px] text-slate-400 font-medium">CEFR Level & Grade</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="indigo" className="text-[10px] py-0 font-bold">
                          {verifiedResult.levelCompleted}
                        </Badge>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {verifiedResult.finalGrade}% Final
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 space-y-1">
                      <span className="text-[11px] text-slate-400 font-medium">Issue Date & Faculty</span>
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {new Date(verifiedResult.issueDate).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        Instructor: {verifiedResult.instructorName}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Verify from Student's Own Earned Certificates */}
              {myCertificates.length > 0 && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-primary-600" />
                    Your Issued Academic Certificates ({myCertificates.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {myCertificates.map((cert) => (
                      <div
                        key={cert.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100/70 transition-colors gap-2"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {cert.courseTitle || cert.course?.title || 'Academic English'}
                          </p>
                          <p className="text-[10px] font-mono text-slate-500">
                            {cert.certificateCode} • Level {cert.levelCompleted || 'A1'}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerifyCertificate(cert.certificateCode)}
                          className="text-[11px] font-bold h-7 px-2.5"
                        >
                          Verify
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
