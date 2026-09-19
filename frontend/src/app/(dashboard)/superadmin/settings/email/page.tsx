'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  ArrowLeft,
  Server,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  RotateCcw
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface EmailSettingsData {
  provider: string;
  senderEmail: string;
  senderName: string;
  replyTo: string;
  emailEnabled: boolean;
  maxRetries: number;
  verificationExpiresMinutes: number;
  passwordResetExpiresMinutes: number;
}

export default function SuperadminEmailSettingsPage() {
  const [settings, setSettings] = useState<EmailSettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEmailSettings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<EmailSettingsData>('/superadmin/email-settings');
      if (res) {
        setSettings(res);
      }
    } catch (err) {
      console.error('Failed to load email settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmailSettings();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      <div className="flex items-center gap-3">
        <Link href="/superadmin/settings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary-600" /> Transactional Mail Infrastructure Settings
          </h1>
          <p className="text-xs text-slate-500">
            Configure SMTP, Resend API transports, retry parameters, and default sender signatures.
          </p>
        </div>
      </div>

      {loading ? (
        <Card className="p-12 text-center text-xs text-slate-400">Loading mail settings...</Card>
      ) : settings ? (
        <div className="space-y-6">
          {/* Active Provider Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Server className="h-4 w-4 text-primary-600" /> Active Mail Transport Provider
                </h3>
                <p className="text-xs text-slate-500">
                  Current transport driver utilized by the backend queue worker.
                </p>
              </div>
              <Badge variant="indigo" className="text-xs px-3 py-1 font-mono">
                {settings.provider}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
                <span className="text-[10px] uppercase font-bold text-slate-400">System Sender Address</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{settings.senderEmail}</p>
              </div>

              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
                <span className="text-[10px] uppercase font-bold text-slate-400">Sender Display Name</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{settings.senderName}</p>
              </div>

              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
                <span className="text-[10px] uppercase font-bold text-slate-400">Reply-To Address</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{settings.replyTo}</p>
              </div>

              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
                <span className="text-[10px] uppercase font-bold text-slate-400">Global Mail Dispatch State</span>
                <p className="text-xs font-bold text-emerald-600 mt-0.5">
                  {settings.emailEnabled ? 'ACTIVE & ENABLED' : 'DISABLED'}
                </p>
              </div>
            </div>
          </Card>

          {/* Queue & Token Expiration Policies */}
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Queue & Token Security Policies
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
                <span className="text-[10px] uppercase font-bold text-slate-400">Max Auto-Retries</span>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{settings.maxRetries} attempts</p>
              </div>

              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
                <span className="text-[10px] uppercase font-bold text-slate-400">Email Verification Expiry</span>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{settings.verificationExpiresMinutes} mins</p>
              </div>

              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
                <span className="text-[10px] uppercase font-bold text-slate-400">Password Reset Expiry</span>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{settings.passwordResetExpiresMinutes} mins</p>
              </div>
            </div>
          </Card>

          {/* Interactive Test Dispatcher */}
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary-600" /> Dispatch Test Email
            </h3>
            <p className="text-xs text-slate-500">
              Verify that your Gmail SMTP credentials and network connection are properly delivering transactional emails.
            </p>

            <TestEmailForm defaultEmail={settings.senderEmail} />
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function TestEmailForm({ defaultEmail }: { defaultEmail: string }) {
  const [testEmail, setTestEmail] = useState(defaultEmail || '');
  const [sending, setSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;

    setSending(true);
    setTestResult(null);

    try {
      const res = await apiClient.post<any>('/superadmin/email-settings/test', {
        targetEmail: testEmail,
      });

      setTestResult({
        success: true,
        message: `Test email successfully dispatched to ${testEmail}! Check your inbox.`,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to dispatch test email. Verify SMTP credentials and network connection.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSendTest} className="space-y-4 pt-2">
      {testResult && (
        <div
          className={`flex items-center gap-2.5 rounded-xl border p-4 text-xs font-semibold ${
            testResult.success
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'border-destructive/20 bg-destructive/10 text-destructive'
          }`}
        >
          {testResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span>{testResult.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="email"
          placeholder="Enter recipient email address..."
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          required
          className="flex-1"
        />
        <Button type="submit" variant="gradient" disabled={sending}>
          {sending ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Dispatching...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" /> Send Test Email
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
