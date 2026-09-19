'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Megaphone,
  Users,
  Send,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Info
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function SuperadminAnnouncementsPage() {
  const [audience, setAudience] = useState<'ALL_USERS' | 'ALL_STUDENTS' | 'ALL_TEACHERS'>('ALL_USERS');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<{ recipientsCount: number; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleBroadcast = async () => {
    setError(null);
    setShowConfirmModal(false);

    if (!title.trim() || !message.trim()) {
      setError('Announcement title and message body are required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiClient.post<any>('/superadmin/announcements', {
        title,
        message,
        targetAudience: audience,
      });

      setSuccessResult(res.data || res);
      setTitle('');
      setMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch platform announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary-600" /> Platform Announcement Broadcast Studio
        </h1>
        <p className="text-xs text-slate-500">
          Dispatch platform-wide announcements across in-app notification centers and recipient email inboxes.
        </p>
      </div>

      {successResult && (
        <Card className="p-6 bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 animate-fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                Broadcast Dispatched Successfully!
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                {successResult.message || `Queued for ${successResult.recipientsCount} active accounts.`}
              </p>
              <div className="mt-3 flex gap-2">
                <Link href="/superadmin/email-logs">
                  <Button variant="outline" size="sm" className="text-xs">
                    View Delivery Logs
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setSuccessResult(null)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs font-semibold text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Composer */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-5">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Target Recipient Audience
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'ALL_USERS', label: 'All Users', desc: 'Students & Teachers' },
                  { id: 'ALL_STUDENTS', label: 'All Students', desc: 'Enrolled Learners' },
                  { id: 'ALL_TEACHERS', label: 'All Teachers', desc: 'Faculty Instructors' },
                ].map((aud) => (
                  <button
                    key={aud.id}
                    type="button"
                    onClick={() => setAudience(aud.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      audience === aud.id
                        ? 'border-primary-600 bg-primary-50 text-primary-900 font-bold dark:bg-primary-950/60 dark:text-primary-200 ring-2 ring-primary-500/20'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                    }`}
                  >
                    <p className="text-xs">{aud.label}</p>
                    <p className="text-[10px] text-slate-400 font-normal">{aud.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Announcement Subject / Header"
              placeholder="e.g. Schedule Maintenance Notice: Sunday Platform Upgrades"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Announcement Message Content
              </label>
              <textarea
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your official announcement here. Plain text and line breaks are formatted automatically for emails and in-app feeds..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white leading-relaxed"
                required
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="button"
                variant="gradient"
                disabled={submitting || !title.trim() || !message.trim()}
                onClick={() => setShowConfirmModal(true)}
              >
                <Send className="h-4 w-4 mr-1.5" /> Preview & Broadcast
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Live Email Preview Box */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" /> Live Email Preview
          </h2>

          <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="bg-[#3B6748] p-4 text-white text-center">
              <p className="text-sm font-black">FluentEdge Academy</p>
              <p className="text-[10px] opacity-80">Official Announcement</p>
            </div>

            <div className="p-4 space-y-3 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300">
              <Badge variant="indigo" className="text-[10px]">
                Audience: {audience.replace(/_/g, ' ')}
              </Badge>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {title || 'Announcement Title'}
              </h3>

              <div className="text-[11px] leading-relaxed whitespace-pre-line text-slate-600 dark:text-slate-400 min-h-[100px]">
                {message || 'Your announcement text will appear here...'}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 text-center">
                &copy; {new Date().getFullYear()} FluentEdge Academy. Automated Notification.
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Confirmation Safeguard Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg font-bold">Confirm Broadcast</CardTitle>
              <CardDescription className="text-xs">
                You are about to queue an announcement for <strong>{audience.replace(/_/g, ' ')}</strong>.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <p><strong>Subject:</strong> {title}</p>
                <p><strong>Channel:</strong> In-App Notification + Outgoing Transactional Email</p>
              </div>
              <p className="text-[11px] text-slate-400 italic text-center">
                This action cannot be undone once dispatched.
              </p>
            </CardContent>

            <CardFooter className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
              <Button variant="outline" size="sm" onClick={() => setShowConfirmModal(false)}>
                Cancel
              </Button>
              <Button variant="gradient" size="sm" isLoading={submitting} onClick={handleBroadcast}>
                <Send className="h-3.5 w-3.5 mr-1" /> Confirm & Send Now
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
