'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Lock,
  Bell,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Save,
  Mail,
  CreditCard,
  BookOpen,
  Sliders,
  Smartphone,
  LogOut,
  Building2,
  PhoneCall
} from 'lucide-react';
import { useCachedData, clientCache } from '@/lib/cache';
import { apiClient } from '@/lib/api-client';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

export default function TeacherSettingsPage() {
  const [activeTab, setActiveTab] = useState<'SECURITY' | 'TEACHING' | 'PAYMENT' | 'NOTIFICATIONS'>('SECURITY');

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Active Sessions
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Teaching Preferences
  const [specialties, setSpecialties] = useState<string[]>(['Grammar', 'Speaking', 'Business English']);
  const [defaultDuration, setDefaultDuration] = useState('90');
  const [defaultPassingScore, setDefaultPassingScore] = useState('75');
  const [savingTeaching, setSavingTeaching] = useState(false);

  // Payment Settings (Receiving student payments)
  const [paymentInfo, setPaymentInfo] = useState({
    payoutMethod: 'MOBILE_MONEY',
    momoNumber: '+250 788 123 456',
    momoProvider: 'MTN Mobile Money',
    accountName: 'Sarah Jenkins',
    bankName: 'Equity Bank Rwanda',
    bankAccountNumber: '4002-1192-8839',
    paymentInstructions: 'Please include your Student Name and Course Title in the payment reference note.',
  });
  const [savingPayment, setSavingPayment] = useState(false);

  // Notification Preferences
  const [prefs, setPrefs] = useState({
    emailEnabled: true,
    enrollmentEmails: true,
    paymentEmails: true,
    assignmentEmails: true,
    quizEmails: true,
    feedbackEmails: true,
    courseExpirationEmails: true,
    announcementEmails: true,
    inAppEnabled: true,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    data: settingsData,
    loading: loadingPrefs,
    refresh: loadAllSettings
  } = useCachedData(
    'teacher_settings_data',
    async () => {
      const [prefRes, teachRes, payRes, sessRes]: any = await Promise.allSettled([
        apiClient.get('/notifications/preferences'),
        apiClient.get('/teacher/preferences'),
        apiClient.get('/teacher/payment-settings'),
        apiClient.get('/users/sessions'),
      ]);

      let loadedPrefs = null;
      if (prefRes.status === 'fulfilled' && (prefRes.value.data || prefRes.value)) {
        const d = prefRes.value.data || prefRes.value;
        loadedPrefs = {
          emailEnabled: d.emailEnabled ?? true,
          enrollmentEmails: d.enrollmentEmails ?? true,
          paymentEmails: d.paymentEmails ?? true,
          assignmentEmails: d.assignmentEmails ?? true,
          quizEmails: d.quizEmails ?? true,
          feedbackEmails: d.feedbackEmails ?? true,
          courseExpirationEmails: d.courseExpirationEmails ?? true,
          announcementEmails: d.announcementEmails ?? true,
          inAppEnabled: d.inAppEnabled ?? true,
        };
      }

      let loadedTeaching = null;
      if (teachRes.status === 'fulfilled' && teachRes.value?.data) {
        loadedTeaching = teachRes.value.data;
      }

      let loadedPayment = null;
      if (payRes.status === 'fulfilled' && payRes.value?.data?.paymentInfo) {
        loadedPayment = payRes.value.data.paymentInfo;
      }

      let loadedSessions: any[] = [];
      if (sessRes.status === 'fulfilled' && sessRes.value?.sessions) {
        loadedSessions = sessRes.value.sessions;
      }

      return {
        prefs: loadedPrefs,
        teaching: loadedTeaching,
        payment: loadedPayment,
        sessions: loadedSessions,
      };
    },
    {
      ttl: 120_000,
      onSuccess: (data) => {
        if (data.prefs) setPrefs(data.prefs);
        if (data.teaching) {
          if (data.teaching.specialties) setSpecialties(data.teaching.specialties);
          if (data.teaching.teachingPreferences?.defaultDuration) setDefaultDuration(String(data.teaching.teachingPreferences.defaultDuration));
          if (data.teaching.teachingPreferences?.defaultPassingScore) setDefaultPassingScore(String(data.teaching.teachingPreferences.defaultPassingScore));
        }
        if (data.payment) setPaymentInfo(data.payment);
        if (data.sessions) setActiveSessions(data.sessions);
      }
    }
  );

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    try {
      setSavingPassword(true);
      await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      setFeedback({ type: 'success', text: 'Security password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to change password. Verify your current password.' });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveTeaching = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      setSavingTeaching(true);
      await apiClient.patch('/teacher/preferences', {
        specialties,
        defaultDuration: parseInt(defaultDuration, 10) || 90,
        defaultPassingScore: parseInt(defaultPassingScore, 10) || 75,
      });
      clientCache.invalidate('teacher_');
      setFeedback({ type: 'success', text: 'Teaching preferences updated and saved!' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update teaching preferences.' });
    } finally {
      setSavingTeaching(false);
    }
  };

  const handleSavePaymentInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      setSavingPayment(true);
      await apiClient.patch('/teacher/payment-settings', paymentInfo);
      clientCache.invalidate('teacher_');
      setFeedback({ type: 'success', text: 'Student payment instructions & receiving details saved!' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update payment settings.' });
    } finally {
      setSavingPayment(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      setSavingPrefs(true);
      await apiClient.patch('/notifications/preferences', prefs);
      clientCache.invalidate('teacher_');
      setFeedback({ type: 'success', text: 'Notification preferences saved in PostgreSQL database!' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update preferences.' });
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleLogoutOtherDevices = async () => {
    if (!confirm('Are you sure you want to log out all other devices?')) return;
    try {
      await apiClient.post('/users/sessions/logout-all');
      setFeedback({ type: 'success', text: 'All other active sessions have been revoked.' });
      loadAllSettings();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to revoke sessions.' });
    }
  };

  return (
    <div className="space-y-8 max-w-5xl animate-fade-in pb-16">
      <div>
        <Badge variant="indigo">Teacher Workspace Settings</Badge>
        <h1 className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Workspace Settings & Configuration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Configure security credentials, teaching defaults, student wire payment instructions, and automated alert channels.
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
          {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Navigation Segmented Tab Switcher */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {[
          { id: 'SECURITY', label: 'Security & Password', icon: KeyRound },
          { id: 'TEACHING', label: 'Teaching Preferences', icon: BookOpen },
          { id: 'PAYMENT', label: 'Payment Receiving Details', icon: CreditCard },
          { id: 'NOTIFICATIONS', label: 'Notification Alerts', icon: Bell },
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
          {/* Password Security */}
          <Card className="shadow-lg border-slate-200 dark:border-slate-800">
            <form onSubmit={handlePasswordChange}>
              <CardHeader className="border-b border-slate-100 p-6 dark:border-slate-800">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary-600" /> Security & Password
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

          {/* Active Sessions */}
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

      {/* TAB 2: TEACHING PREFERENCES */}
      {activeTab === 'TEACHING' && (
        <form onSubmit={handleSaveTeaching} className="space-y-6">
          <Card className="p-6 space-y-4 shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader className="p-0 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary-600" /> Teaching Specializations & Course Defaults
              </CardTitle>
              <CardDescription className="text-xs">
                Configure preferred course duration, passing thresholds, and specialized teaching modules
              </CardDescription>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Input
                label="Default Course Duration (Days)"
                type="number"
                min="30"
                max="365"
                value={defaultDuration}
                onChange={(e) => setDefaultDuration(e.target.value)}
                required
              />

              <Input
                label="Default Passing Score (%)"
                type="number"
                min="50"
                max="100"
                value={defaultPassingScore}
                onChange={(e) => setDefaultPassingScore(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Specialty Topics (Comma-separated)
              </label>
              <Input
                value={specialties.join(', ')}
                onChange={(e) => setSpecialties(e.target.value.split(',').map((s) => s.trim()))}
                placeholder="Grammar, Business English, IELTS Prep, Accent Reduction"
              />
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" variant="gradient" disabled={savingTeaching}>
              <Save className="mr-1.5 h-4 w-4" />
              {savingTeaching ? 'Saving...' : 'Save Teaching Preferences'}
            </Button>
          </div>
        </form>
      )}

      {/* TAB 3: PAYMENT SETTINGS */}
      {activeTab === 'PAYMENT' && (
        <form onSubmit={handleSavePaymentInfo} className="space-y-6">
          <Card className="p-6 space-y-4 shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader className="p-0 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-600" /> Student Payment Receiving Details
              </CardTitle>
              <CardDescription className="text-xs">
                This information is presented to enrolling students during bank and Mobile Money payment checkout
              </CardDescription>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Input
                label="Mobile Money Number"
                value={paymentInfo.momoNumber || ''}
                placeholder="+250 788 123 456"
                onChange={(e) => setPaymentInfo({ ...paymentInfo, momoNumber: e.target.value })}
              />

              <Input
                label="Mobile Money Provider"
                value={paymentInfo.momoProvider || ''}
                placeholder="MTN Mobile Money / Airtel Money"
                onChange={(e) => setPaymentInfo({ ...paymentInfo, momoProvider: e.target.value })}
              />

              <Input
                label="Account / Beneficiary Name"
                value={paymentInfo.accountName || ''}
                placeholder="Full Name as registered on SIM / Bank"
                onChange={(e) => setPaymentInfo({ ...paymentInfo, accountName: e.target.value })}
              />

              <Input
                label="Bank Name"
                value={paymentInfo.bankName || ''}
                placeholder="Equity Bank Rwanda / Bank of Kigali"
                onChange={(e) => setPaymentInfo({ ...paymentInfo, bankName: e.target.value })}
              />

              <div className="sm:col-span-2">
                <Input
                  label="Bank Account Number / IBAN"
                  value={paymentInfo.bankAccountNumber || ''}
                  placeholder="4002-1192-8839"
                  onChange={(e) => setPaymentInfo({ ...paymentInfo, bankAccountNumber: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <RichTextEditor
                  label="Payment Reference Instructions for Students (Markdown & Callouts Supported)"
                  value={paymentInfo.paymentInstructions || ''}
                  onChange={(val) => setPaymentInfo({ ...paymentInfo, paymentInstructions: val })}
                  placeholder="Please put your full name and course title in the transaction reference..."
                  minRows={4}
                  category="general"
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" variant="gradient" disabled={savingPayment}>
              <Save className="mr-1.5 h-4 w-4" />
              {savingPayment ? 'Saving...' : 'Save Payment Information'}
            </Button>
          </div>
        </form>
      )}

      {/* TAB 4: NOTIFICATION PREFERENCES */}
      {activeTab === 'NOTIFICATIONS' && (
        <form onSubmit={handleSavePreferences} className="space-y-6">
          <Card className="p-6 space-y-4 shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader className="p-0 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary-600" /> Teaching Alert & Communication Channels
              </CardTitle>
              <CardDescription className="text-xs">
                Control automated email alerts and in-app notifications
              </CardDescription>
            </CardHeader>

            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Master Email Delivery</p>
                  <p className="text-[11px] text-slate-500">Enable or pause transactional and summary emails</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.emailEnabled}
                  onChange={(e) => setPrefs({ ...prefs, emailEnabled: e.target.checked })}
                  className="h-4 w-4 rounded text-primary-600 accent-primary-600"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Payment Proof Submissions</p>
                  <p className="text-[11px] text-slate-500">Alert me when a student uploads proof of fee payment</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.paymentEmails}
                  onChange={(e) => setPrefs({ ...prefs, paymentEmails: e.target.checked })}
                  className="h-4 w-4 rounded text-primary-600 accent-primary-600"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Assignment Submissions</p>
                  <p className="text-[11px] text-slate-500">Notify when essays, recordings, or drills are turned in</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.assignmentEmails}
                  onChange={(e) => setPrefs({ ...prefs, assignmentEmails: e.target.checked })}
                  className="h-4 w-4 rounded text-primary-600 accent-primary-600"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Student Course Expiration Alerts</p>
                  <p className="text-[11px] text-slate-500">Warn me before student access expires so I can arrange renewals</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.courseExpirationEmails}
                  onChange={(e) => setPrefs({ ...prefs, courseExpirationEmails: e.target.checked })}
                  className="h-4 w-4 rounded text-primary-600 accent-primary-600"
                />
              </label>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" variant="gradient" disabled={savingPrefs}>
              <Save className="mr-1.5 h-4 w-4" />
              {savingPrefs ? 'Saving...' : 'Save Alert Preferences'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
