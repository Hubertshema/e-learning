'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Settings,
  CheckCircle2,
  ShieldCheck,
  DollarSign,
  Bell,
  AlertCircle,
  Mail,
  ArrowRight,
  Lock,
  Globe,
  Award,
  BookOpen,
  Users,
  KeyRound,
  ShieldAlert,
  Smartphone,
  Save,
  RefreshCw,
  LogOut,
  Sliders
} from 'lucide-react';

export default function SuperadminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'ADMISSION' | 'LEARNING' | 'PAYMENTS' | 'SECURITY' | 'DANGER'>('GENERAL');
  
  // Platform Settings State
  const [platformName, setPlatformName] = useState('FluentEdge Academy');
  const [supportEmail, setSupportEmail] = useState('support@fluentedge.com');
  const [supportPhone, setSupportPhone] = useState('+250 788 000 111');
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [defaultTimezone, setDefaultTimezone] = useState('Africa/Kigali');
  const [defaultLanguage, setDefaultLanguage] = useState('en');
  
  const [requireTeacherReview, setRequireTeacherReview] = useState(true);
  const [allowStudentRegistration, setAllowStudentRegistration] = useState(true);
  const [allowTeacherRegistration, setAllowTeacherRegistration] = useState(true);
  
  const [commission, setCommission] = useState('15');
  const [defaultPassingScore, setDefaultPassingScore] = useState('75');
  const [defaultCourseDurationDays, setDefaultCourseDurationDays] = useState('90');
  
  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data: any = await apiClient('/superadmin/settings');
      if (data) {
        if (data.platformName) setPlatformName(data.platformName);
        if (data.supportEmail) setSupportEmail(data.supportEmail);
        if (data.supportPhone) setSupportPhone(data.supportPhone);
        if (data.defaultCurrency) setDefaultCurrency(data.defaultCurrency);
        if (data.defaultTimezone) setDefaultTimezone(data.defaultTimezone);
        if (data.defaultLanguage) setDefaultLanguage(data.defaultLanguage);
        if (data.requireTeacherReview !== undefined) setRequireTeacherReview(data.requireTeacherReview);
        if (data.allowStudentRegistration !== undefined) setAllowStudentRegistration(data.allowStudentRegistration);
        if (data.allowTeacherRegistration !== undefined) setAllowTeacherRegistration(data.allowTeacherRegistration);
        if (data.platformCommissionPercent !== undefined) setCommission(String(data.platformCommissionPercent));
        if (data.cefrSettings?.passingScore) setDefaultPassingScore(String(data.cefrSettings.passingScore));
        if (data.cefrSettings?.durationDays) setDefaultCourseDurationDays(String(data.cefrSettings.durationDays));
      }
    } catch (err: any) {
      console.error('Failed to load platform settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const res: any = await apiClient('/users/sessions');
      if (res && res.sessions) {
        setActiveSessions(res.sessions);
      }
    } catch (err) {
      console.warn('Failed to fetch sessions', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchSessions();
  }, []);

  const handleSavePlatformSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await apiClient('/superadmin/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          platformName,
          supportEmail,
          supportPhone,
          defaultCurrency,
          defaultTimezone,
          defaultLanguage,
          requireTeacherReview,
          allowStudentRegistration,
          allowTeacherRegistration,
          platformCommissionPercent: parseFloat(commission) || 15,
          cefrSettings: {
            passingScore: parseInt(defaultPassingScore, 10) || 75,
            durationDays: parseInt(defaultCourseDurationDays, 10) || 90,
          },
        }),
      });
      setMessage({ type: 'success', text: 'Platform governance settings updated and persisted in PostgreSQL database!' });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save platform settings' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setSaving(true);
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setMessage({ type: 'success', text: 'Superadmin root password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to change password. Verify your current password.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutOtherDevices = async () => {
    if (!confirm('Are you sure you want to invalidate all other active sessions?')) return;
    try {
      await apiClient.post('/users/sessions/logout-all');
      setMessage({ type: 'success', text: 'All other active device sessions have been revoked.' });
      fetchSessions();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to revoke sessions' });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Badge variant="indigo">Executive Control Tower</Badge>
          <h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Platform Settings & System Governance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Configure global platform parameters, admission rules, financial commission rates, learning defaults, and security policies.
          </p>
        </div>

        <Link href="/superadmin/settings/email">
          <Button variant="outline" className="border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100/60 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300">
            <Mail className="mr-2 h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Email Gateway Config
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2.5 rounded-2xl border p-4 text-xs font-semibold shadow-md ${
            message.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
              : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Navigation Segmented Tab Switcher */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {[
          { id: 'GENERAL', label: 'Platform & Branding', icon: Globe },
          { id: 'ADMISSION', label: 'Admission & Registration', icon: Users },
          { id: 'LEARNING', label: 'Learning & CEFR Rules', icon: BookOpen },
          { id: 'PAYMENTS', label: 'Financials & Fees', icon: DollarSign },
          { id: 'SECURITY', label: 'Security & Sessions', icon: KeyRound },
          { id: 'DANGER', label: 'Danger Zone', icon: ShieldAlert },
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

      {/* TAB 1: GENERAL PLATFORM & BRANDING */}
      {activeTab === 'GENERAL' && (
        <form onSubmit={handleSavePlatformSettings} className="space-y-6">
          <Card className="p-6 space-y-4 shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader className="p-0 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary-600" /> Platform Brand Identity & Localization
              </CardTitle>
              <CardDescription className="text-xs">
                Configure platform name, support communications, default timezone, and international currency
              </CardDescription>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Input
                label="Platform Brand Name"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                required
              />
              <Input
                label="Public Support Email"
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                required
              />
              <Input
                label="Support Phone Number"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
              />
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Default Platform Timezone
                </label>
                <select
                  value={defaultTimezone}
                  onChange={(e) => setDefaultTimezone(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                >
                  <option value="Africa/Kigali">Africa/Kigali (UTC+02:00)</option>
                  <option value="Africa/Nairobi">Africa/Nairobi (UTC+03:00)</option>
                  <option value="Europe/London">Europe/London (UTC+00:00)</option>
                  <option value="America/New_York">America/New_York (UTC-05:00)</option>
                  <option value="UTC">UTC (Universal Time)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Default Currency
                </label>
                <select
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 font-semibold"
                >
                  <option value="USD">USD — US Dollar ($)</option>
                  <option value="RWF">RWF — Rwandan Franc (FRW)</option>
                  <option value="EUR">EUR — Euro (€)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Default Interface Language
                </label>
                <select
                  value={defaultLanguage}
                  onChange={(e) => setDefaultLanguage(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                >
                  <option value="en">English (Default)</option>
                  <option value="rw">Kinyarwanda</option>
                  <option value="fr">Français</option>
                </select>
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" variant="gradient" size="lg" disabled={saving || loading}>
              <Save className="mr-1.5 h-4 w-4" />
              {saving ? 'Saving...' : 'Save General Settings'}
            </Button>
          </div>
        </form>
      )}

      {/* TAB 2: ADMISSION & REGISTRATION */}
      {activeTab === 'ADMISSION' && (
        <form onSubmit={handleSavePlatformSettings} className="space-y-6">
          <Card className="p-6 space-y-4 shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader className="p-0 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary-600" /> Teacher & Student Admissions Policy
              </CardTitle>
              <CardDescription className="text-xs">
                Control vetting requirements and self-registration availability across the platform
              </CardDescription>
            </CardHeader>

            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between rounded-2xl border border-slate-100 p-4 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Require Superadmin Vetting for Instructor Accounts
                  </p>
                  <p className="text-[11px] text-slate-500">
                    When enabled, new teacher registrations remain in PENDING_APPROVAL until approved by superadmin.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={requireTeacherReview}
                  onChange={(e) => setRequireTeacherReview(e.target.checked)}
                  className="h-4 w-4 rounded text-primary-600 accent-primary-600"
                />
              </label>

              <label className="flex items-center justify-between rounded-2xl border border-slate-100 p-4 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Allow Public Student Self-Registration
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Allows prospective learners to register via `/auth/register` without manual invitations.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={allowStudentRegistration}
                  onChange={(e) => setAllowStudentRegistration(e.target.checked)}
                  className="h-4 w-4 rounded text-primary-600 accent-primary-600"
                />
              </label>

              <label className="flex items-center justify-between rounded-2xl border border-slate-100 p-4 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Allow Public Teacher Applications
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Accept applications from new English teachers via the faculty portal.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={allowTeacherRegistration}
                  onChange={(e) => setAllowTeacherRegistration(e.target.checked)}
                  className="h-4 w-4 rounded text-primary-600 accent-primary-600"
                />
              </label>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" variant="gradient" size="lg" disabled={saving || loading}>
              <Save className="mr-1.5 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Admission Rules'}
            </Button>
          </div>
        </form>
      )}

      {/* TAB 3: LEARNING & CEFR RULES */}
      {activeTab === 'LEARNING' && (
        <form onSubmit={handleSavePlatformSettings} className="space-y-6">
          <Card className="p-6 space-y-4 shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader className="p-0 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary-600" /> Academic & CEFR Curriculum Defaults
              </CardTitle>
              <CardDescription className="text-xs">
                Set baseline passing grades, certificate thresholds, and course access validity periods
              </CardDescription>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Input
                label="Default Passing Score (%)"
                type="number"
                min="50"
                max="100"
                value={defaultPassingScore}
                onChange={(e) => setDefaultPassingScore(e.target.value)}
                required
              />

              <Input
                label="Standard Course Access Duration (Days)"
                type="number"
                min="30"
                max="365"
                value={defaultCourseDurationDays}
                onChange={(e) => setDefaultCourseDurationDays(e.target.value)}
                required
              />
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-950 dark:bg-indigo-950/20 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
              <p className="font-bold">7-Skill CEFR Framework Enforcement</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                All platform syllabi evaluate competencies across Grammar, Vocabulary, Reading, Listening, Speaking, Writing, and Pronunciation.
              </p>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" variant="gradient" size="lg" disabled={saving || loading}>
              <Save className="mr-1.5 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Academic Rules'}
            </Button>
          </div>
        </form>
      )}

      {/* TAB 4: FINANCIALS & COMMISSION */}
      {activeTab === 'PAYMENTS' && (
        <form onSubmit={handleSavePlatformSettings} className="space-y-6">
          <Card className="p-6 space-y-4 shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader className="p-0 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" /> Financial Settings & Revenue Commission
              </CardTitle>
              <CardDescription className="text-xs">
                Configure platform fee deductions and supported payment settlement channels
              </CardDescription>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Input
                label="Platform Commission Rate (%)"
                type="number"
                min="0"
                max="100"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Supported Payment Channels
                </label>
                <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-900 text-xs font-medium space-y-1">
                  <p>✓ Mobile Money (MTN Rwanda & Airtel Money)</p>
                  <p>✓ Bank Wire Transfer (Equity Bank & Bank of Kigali)</p>
                  <p>✓ Credit/Debit Card via Secure Gateway</p>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" variant="gradient" size="lg" disabled={saving || loading}>
              <Save className="mr-1.5 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Financial Rules'}
            </Button>
          </div>
        </form>
      )}

      {/* TAB 5: SECURITY & SESSIONS */}
      {activeTab === 'SECURITY' && (
        <div className="space-y-6">
          {/* Change Password Card */}
          <Card className="p-6 space-y-4 shadow-lg border-slate-200 dark:border-slate-800">
            <form onSubmit={handlePasswordChange}>
              <CardHeader className="p-0 pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary-600" /> Change Root Password
                </CardTitle>
                <CardDescription className="text-xs">
                  Update superadmin executive credentials with strong complexity rules
                </CardDescription>
              </CardHeader>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <Input
                  label="Current Password"
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <Input
                  label="New Password"
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
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" variant="gradient" disabled={saving}>
                  <ShieldCheck className="mr-1.5 h-4 w-4" />
                  {saving ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Active Sessions Management */}
          <Card className="p-6 space-y-4 shadow-lg border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-indigo-600" /> Active Device Sessions
                </CardTitle>
                <CardDescription className="text-xs">
                  Inspect currently authenticated browser sessions and revoke unauthorized access
                </CardDescription>
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogoutOtherDevices}
                className="text-xs font-bold shadow-md"
              >
                <LogOut className="mr-1.5 h-3.5 w-3.5" />
                Revoke All Other Devices
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
                            Current Session
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Created: {new Date(session.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      ACTIVE
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  {loadingSessions ? 'Loading active sessions...' : 'Single active session.'}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 6: DANGER ZONE */}
      {activeTab === 'DANGER' && (
        <Card className="p-6 space-y-6 border-rose-200 bg-rose-50/30 dark:border-rose-900/60 dark:bg-rose-950/10 shadow-xl">
          <CardHeader className="p-0 pb-3 border-b border-rose-200 dark:border-rose-900">
            <CardTitle className="text-base font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" /> Superadmin Danger Zone & Emergency Safeguards
            </CardTitle>
            <CardDescription className="text-xs text-rose-600/80 dark:text-rose-300/80">
              High-impact administrative commands requiring explicit confirmation
            </CardDescription>
          </CardHeader>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-rose-200 bg-white/80 dark:bg-slate-900/80 dark:border-rose-900">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Emergency System Invalidation
                </h4>
                <p className="text-[11px] text-slate-500">
                  Instantly revoke all refresh tokens and sessions across the platform in case of security incident.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogoutOtherDevices}
                className="shrink-0 text-xs font-bold"
              >
                Trigger Invalidation
              </Button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:bg-slate-900/80 dark:border-slate-800 space-y-1 text-xs">
              <p className="font-bold text-slate-900 dark:text-white">Audit & Compliance Retention Policy</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Superadmin accounts cannot be permanently deleted from the web portal. All critical actions are recorded in the immutable audit log archive.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
