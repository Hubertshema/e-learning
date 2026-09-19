'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Settings,
  Lock,
  Bell,
  CheckCircle2,
  AlertCircle,
  Shield,
  Save,
  Moon,
  Smartphone,
  BookOpen,
  KeyRound,
  Eye,
  ShieldAlert,
  Clock,
  Calendar,
  LogOut,
  Target
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function StudentSettingsPage() {
  const [activeTab, setActiveTab] = useState<'SECURITY' | 'STUDY' | 'NOTIFICATIONS' | 'PRIVACY' | 'DANGER'>('SECURITY');

  // Password State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);

  // Active Sessions
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Study Preferences
  const [dailyTarget, setDailyTarget] = useState('30');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('18:00 - 20:00');
  const [savingStudy, setSavingStudy] = useState(false);

  // Privacy
  const [profileVisibility, setProfileVisibility] = useState<'PRIVATE' | 'TEACHER_ONLY'>('TEACHER_ONLY');
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  // Deletion Request
  const [deletionReason, setDeletionReason] = useState('');
  const [deletionPassword, setDeletionPassword] = useState('');
  const [submittingDeletion, setSubmittingDeletion] = useState(false);
  const [deletionSuccess, setDeletionSuccess] = useState(false);

  // Notifications
  const [prefs, setPrefs] = useState({
    emailEnabled: true,
    enrollmentEmails: true,
    paymentEmails: true,
    assignmentEmails: true,
    quizEmails: true,
    feedbackEmails: true,
    courseExpirationEmails: true,
    courseCompletionEmails: true,
    announcementEmails: true,
    inAppEnabled: true,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadStudentSettings = async () => {
    try {
      setLoadingPrefs(true);
      setLoadingSessions(true);

      const [prefRes, meRes, sessRes]: any = await Promise.allSettled([
        apiClient.get('/notifications/preferences'),
        apiClient.get('/students/me'),
        apiClient.get('/users/sessions'),
      ]);

      if (prefRes.status === 'fulfilled' && (prefRes.value.data || prefRes.value)) {
        const d = prefRes.value.data || prefRes.value;
        setPrefs({
          emailEnabled: d.emailEnabled ?? true,
          enrollmentEmails: d.enrollmentEmails ?? true,
          paymentEmails: d.paymentEmails ?? true,
          assignmentEmails: d.assignmentEmails ?? true,
          quizEmails: d.quizEmails ?? true,
          feedbackEmails: d.feedbackEmails ?? true,
          courseExpirationEmails: d.courseExpirationEmails ?? true,
          courseCompletionEmails: d.courseCompletionEmails ?? true,
          announcementEmails: d.announcementEmails ?? true,
          inAppEnabled: d.inAppEnabled ?? true,
        });
      }

      if (meRes.status === 'fulfilled') {
        const d = meRes.value.data || meRes.value;
        if (d?.profile?.learningPreferences?.dailyTarget) setDailyTarget(String(d.profile.learningPreferences.dailyTarget));
        if (d?.profile?.learningPreferences?.studyDays) setSelectedDays(d.profile.learningPreferences.studyDays);
        if (d?.profile?.learningPreferences?.preferredTimeSlot) setPreferredTimeSlot(d.profile.learningPreferences.preferredTimeSlot);
        if (d?.profile?.profileVisibility) setProfileVisibility(d.profile.profileVisibility);
      }

      if (sessRes.status === 'fulfilled' && sessRes.value?.sessions) {
        setActiveSessions(sessRes.value.sessions);
      }
    } catch (err) {
      console.warn('Could not load student settings:', err);
    } finally {
      setLoadingPrefs(false);
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadStudentSettings();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setFeedback({ type: 'error', message: 'New passwords do not match' });
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
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to change password. Verify current password.' });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveStudyPrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      setSavingStudy(true);
      await apiClient.patch('/students/me', {
        learningPreferences: {
          dailyTarget: parseInt(dailyTarget, 10) || 30,
          studyDays: selectedDays,
          preferredTimeSlot,
        },
      });
      setFeedback({ type: 'success', message: 'Study target and weekly schedule preferences saved!' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save study preferences' });
    } finally {
      setSavingStudy(false);
    }
  };

  const handleSavePrivacy = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      setSavingPrivacy(true);
      await apiClient.patch('/students/me', {
        profileVisibility,
      });
      setFeedback({ type: 'success', message: 'Profile privacy setting updated!' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update privacy setting' });
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      setSavingPrefs(true);
      await apiClient.patch('/notifications/preferences', prefs);
      setFeedback({ type: 'success', message: 'Notification preferences saved in database!' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update preferences' });
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!confirm('Are you sure you want to log out all other active sessions?')) return;
    try {
      await apiClient.post('/users/sessions/logout-all');
      setFeedback({ type: 'success', message: 'All other active sessions have been invalidated.' });
      loadStudentSettings();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to revoke sessions' });
    }
  };

  const handleRequestDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Are you sure you want to submit a request to delete your student account? This request will be processed by platform administrators.')) return;
    try {
      setSubmittingDeletion(true);
      await apiClient.post('/student/danger/request-deletion', {
        reason: deletionReason || 'Student requested account closure',
      });
      setDeletionSuccess(true);
      setFeedback({ type: 'success', message: 'Account closure request submitted. Platform staff will process according to retention policy.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to submit account deletion request' });
    } finally {
      setSubmittingDeletion(false);
    }
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="space-y-8 max-w-5xl animate-fade-in pb-16">
      {/* Header */}
      <div>
        <Badge variant="indigo">Student Account & Security</Badge>
        <h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Account Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Manage your login credentials, study time goals, notification channels, and privacy preferences.
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

      {/* Navigation Segmented Tab Switcher */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {[
          { id: 'SECURITY', label: 'Security & Password', icon: KeyRound },
          { id: 'STUDY', label: 'Study & Learning Targets', icon: Target },
          { id: 'NOTIFICATIONS', label: 'Notification Alerts', icon: Bell },
          { id: 'PRIVACY', label: 'Privacy & Data', icon: Eye },
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

      {/* TAB 1: SECURITY & PASSWORD */}
      {activeTab === 'SECURITY' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader className="border-b border-slate-100 p-6 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary-600" />
                Change Password
              </CardTitle>
              <CardDescription className="text-xs">
                Ensure your student account uses a strong, unique password
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
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
                  <Button type="submit" variant="gradient" disabled={savingPassword}>
                    <Shield className="mr-1.5 h-4 w-4" />
                    {savingPassword ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card className="shadow-lg border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
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
                className="text-xs font-bold"
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
                  <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3.5 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
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
                  Single active session.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: STUDY & LEARNING TARGETS */}
      {activeTab === 'STUDY' && (
        <form onSubmit={handleSaveStudyPrefs} className="space-y-6">
          <Card className="p-6 space-y-5 shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader className="p-0 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary-600" /> Daily Fluency Targets & Study Routine
              </CardTitle>
              <CardDescription className="text-xs">
                Set daily study duration targets and preferred practice days for automated reminders
              </CardDescription>
            </CardHeader>

            {loadingPrefs ? (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <Skeleton key={i} className="h-8 w-20 rounded-xl" />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Daily Learning Target
                    </label>
                    <select
                      value={dailyTarget}
                      onChange={(e) => setDailyTarget(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold"
                    >
                      <option value="15">15 minutes / day (Casual)</option>
                      <option value="30">30 minutes / day (Standard)</option>
                      <option value="45">45 minutes / day (Intensive)</option>
                      <option value="60">60 minutes / day (Immersion)</option>
                    </select>
                  </div>

                  <Input
                    label="Preferred Study Hours"
                    placeholder="e.g. 18:00 – 20:00 (Evening)"
                    value={preferredTimeSlot}
                    onChange={(e) => setPreferredTimeSlot(e.target.value)}
                  />
                </div>

                {/* Study Days Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Preferred Weekly Study Days
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((day) => {
                      const isSelected = selectedDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-primary-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </Card>

          <div className="flex justify-end">
            <Button type="submit" variant="gradient" disabled={savingStudy || loadingPrefs}>
              <Save className="mr-1.5 h-4 w-4" />
              {savingStudy ? 'Saving...' : 'Save Study Routine'}
            </Button>
          </div>
        </form>
      )}

      {/* TAB 3: NOTIFICATIONS */}
      {activeTab === 'NOTIFICATIONS' && (
        <form onSubmit={handleSavePreferences} className="space-y-6">
          <Card className="p-6 space-y-4 shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader className="p-0 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary-600" /> Student Notification Preferences
              </CardTitle>
              <CardDescription className="text-xs">
                Configure reminder notifications and academic alerts
              </CardDescription>
            </CardHeader>

            {loadingPrefs ? (
              <div className="space-y-3 pt-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                    <Skeleton className="h-5 w-5 rounded-md" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Master Email Notifications</p>
                    <p className="text-[11px] text-slate-500">Enable or pause non-critical academic emails</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.emailEnabled}
                    onChange={(e) => setPrefs({ ...prefs, emailEnabled: e.target.checked })}
                    className="h-4 w-4 rounded text-primary-600 accent-primary-600"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Assignment Reminders & Feedback</p>
                    <p className="text-[11px] text-slate-500">Alerts when assignments are published or evaluated</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.assignmentEmails}
                    onChange={(e) => setPrefs({ ...prefs, assignmentEmails: e.target.checked })}
                    className="h-4 w-4 rounded text-primary-600 accent-primary-600"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Quiz Deadlines & Results</p>
                    <p className="text-[11px] text-slate-500">Alert when a quiz evaluation is ready</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.quizEmails}
                    onChange={(e) => setPrefs({ ...prefs, quizEmails: e.target.checked })}
                    className="h-4 w-4 rounded text-primary-600 accent-primary-600"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Course Expiration Warnings</p>
                    <p className="text-[11px] text-slate-500">Alerts 7 days, 3 days, and 1 day before course validity ends</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.courseExpirationEmails}
                    onChange={(e) => setPrefs({ ...prefs, courseExpirationEmails: e.target.checked })}
                    className="h-4 w-4 rounded text-primary-600 accent-primary-600"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Instructor Coaching Notes</p>
                    <p className="text-[11px] text-slate-500">Notifies when your instructor provides personalized coaching feedback</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.feedbackEmails}
                    onChange={(e) => setPrefs({ ...prefs, feedbackEmails: e.target.checked })}
                    className="h-4 w-4 rounded text-primary-600 accent-primary-600"
                  />
                </label>
              </div>
            )}
          </Card>

          <div className="flex justify-end">
            <Button type="submit" variant="gradient" disabled={savingPrefs || loadingPrefs}>
              <Save className="mr-1.5 h-4 w-4" />
              {savingPrefs ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </form>
      )}

      {/* TAB 4: PRIVACY & DATA */}
      {activeTab === 'PRIVACY' && (
        <form onSubmit={handleSavePrivacy} className="space-y-6">
          <Card className="p-6 space-y-4 shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader className="p-0 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary-600" /> Student Profile Privacy
              </CardTitle>
              <CardDescription className="text-xs">
                Control who can see your learning goals and language level
              </CardDescription>
            </CardHeader>

            {loadingPrefs ? (
              <div className="space-y-3 pt-2">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-52" />
                      <Skeleton className="h-3 w-80" />
                    </div>
                    <Skeleton className="h-4 w-4 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <label
                  className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs cursor-pointer transition-all ${
                    profileVisibility === 'TEACHER_ONLY'
                      ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/30 font-bold text-primary-900 dark:text-primary-200'
                      : 'border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <div>
                    <p className="font-bold">Course Instructors Only (Recommended)</p>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Only faculty members whose classes you are enrolled in can inspect your learning profile.
                    </p>
                  </div>
                  <input
                    type="radio"
                    name="visibility"
                    value="TEACHER_ONLY"
                    checked={profileVisibility === 'TEACHER_ONLY'}
                    onChange={() => setProfileVisibility('TEACHER_ONLY')}
                    className="h-4 w-4 text-primary-600 accent-primary-600"
                  />
                </label>

                <label
                  className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs cursor-pointer transition-all ${
                    profileVisibility === 'PRIVATE'
                      ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/30 font-bold text-primary-900 dark:text-primary-200'
                      : 'border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <div>
                    <p className="font-bold">Private (Restricted)</p>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Hide goals from peer rosters. Instructors can still see quiz and grading progress.
                    </p>
                  </div>
                  <input
                    type="radio"
                    name="visibility"
                    value="PRIVATE"
                    checked={profileVisibility === 'PRIVATE'}
                    onChange={() => setProfileVisibility('PRIVATE')}
                    className="h-4 w-4 text-primary-600 accent-primary-600"
                  />
                </label>
              </div>
            )}
          </Card>

          <div className="flex justify-end">
            <Button type="submit" variant="gradient" disabled={savingPrivacy || loadingPrefs}>
              <Save className="mr-1.5 h-4 w-4" />
              {savingPrivacy ? 'Saving...' : 'Save Privacy Setting'}
            </Button>
          </div>
        </form>
      )}

      {/* TAB 5: DANGER ZONE */}
      {activeTab === 'DANGER' && (
        <Card className="p-6 space-y-6 border-rose-200 bg-rose-50/30 dark:border-rose-900/60 dark:bg-rose-950/10 shadow-xl">
          <CardHeader className="p-0 pb-3 border-b border-rose-200 dark:border-rose-900">
            <CardTitle className="text-base font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" /> Account Closure & Danger Zone
            </CardTitle>
            <CardDescription className="text-xs text-rose-600/80 dark:text-rose-300/80">
              Safe account closure request and session management
            </CardDescription>
          </CardHeader>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Log Out All Devices
                </h4>
                <p className="text-[11px] text-slate-500">
                  Revoke all other active sessions and tokens. Safe and fully reversible.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogoutAllDevices}
                className="shrink-0 text-xs font-bold"
              >
                Log Out Others
              </Button>
            </div>

            {/* Request Account Deletion */}
            <form onSubmit={handleRequestDeletion} className="p-4 rounded-2xl border border-rose-200 bg-white dark:bg-slate-900 dark:border-rose-900 space-y-3">
              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400">
                Request Account Deletion
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Submitting this request flags your account for closure. According to data retention requirements, financial and certificate records will be archived securely.
              </p>

              <Input
                label="Reason for Closure"
                placeholder="Completed my target CEFR level / No longer need platform..."
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                required
              />

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={submittingDeletion || deletionSuccess}
                >
                  {submittingDeletion ? 'Submitting Request...' : deletionSuccess ? 'Request Pending Review' : 'Submit Deletion Request'}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}
    </div>
  );
}
