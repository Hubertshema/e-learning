'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ShieldCheck,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Clock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Save,
  Shield,
  Activity,
  Layers,
  Sparkles,
  Lock
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api-client';

export default function SuperadminProfilePage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        country: (user as any).country || 'Rwanda',
        city: (user as any).city || 'Kigali',
        timezone: (user as any).timezone || 'Africa/Kigali',
        preferredLanguage: (user as any).preferredLanguage || 'en',
        avatarUrl: user.avatarUrl || '',
      });
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSaving(true);

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
      });

      if (refreshUser) await refreshUser();
      setSuccessMsg('Superadmin profile updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-[#132519] p-6 sm:p-8 text-white shadow-xl border border-[#3B6748]/40">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="indigo" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-mono text-[11px] px-3 py-1">
                🛡️ Root Executive Account
              </Badge>
              <Badge variant="success" className="text-[11px] font-bold">
                ✓ Verified Administrator
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Superadmin Profile & Security
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Manage executive identity, platform governance credentials, contact channels, and system authority parameters.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href="/superadmin/settings">
              <Button variant="outline" size="sm" className="border-slate-700 bg-slate-800/80 text-white hover:bg-slate-700 backdrop-blur-md">
                Platform Settings
              </Button>
            </Link>
          </div>
        </div>
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
        {/* Left Column (4 cols): Authority & Identity Card */}
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
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {formData.firstName} {formData.lastName}
              </h2>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{formData.email}</p>
            </div>

            <div className="flex justify-center gap-2">
              <Badge variant="indigo" className="text-[10px]">
                Level 0 Superadmin
              </Badge>
              <Badge variant="success" className="text-[10px]">
                Full System Access
              </Badge>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 text-left text-xs dark:bg-slate-900 space-y-2.5 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Account Role:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">SUPERADMIN</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Account Status:</span>
                <span className="font-bold text-emerald-500">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Timezone:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{formData.timezone}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Email Status:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ Verified</span>
              </div>
            </div>
          </Card>

          {/* Security & Role Protection Note */}
          <Card className="p-5 border-l-4 border-l-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-md">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Role Elevation Protection</h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Superadmin role and root authority cannot be changed from the profile view to preserve system integrity.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (8 cols): Personal Profile Form */}
        <div className="lg:col-span-8">
          <Card className="shadow-lg border-slate-200 dark:border-slate-800">
            <form onSubmit={handleSave}>
              <CardHeader className="border-b border-slate-100 p-6 dark:border-slate-800">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary-600" />
                  Personal Information & Regional Preferences
                </CardTitle>
                <CardDescription className="text-xs">
                  Update contact numbers, location, and regional localization settings
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
                      Primary Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="flex h-10 w-full rounded-lg border border-input bg-slate-100 px-3 py-2 text-xs text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-400"
                    />
                    <p className="text-[10px] text-slate-400">Email modification requires administrative identity verification</p>
                  </div>

                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="+250 788 123 456"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Timezone
                    </label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                    >
                      <option value="Africa/Kigali">Africa/Kigali (UTC+02:00)</option>
                      <option value="Africa/Nairobi">Africa/Nairobi (UTC+03:00)</option>
                      <option value="Africa/Johannesburg">Africa/Johannesburg (UTC+02:00)</option>
                      <option value="Europe/London">Europe/London (UTC+00:00)</option>
                      <option value="America/New_York">America/New_York (UTC-05:00)</option>
                      <option value="UTC">UTC (Universal Coordinated Time)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Interface Language
                    </label>
                    <select
                      value={formData.preferredLanguage}
                      onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                    >
                      <option value="en">English</option>
                      <option value="rw">Kinyarwanda</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>
                </div>

                <Input
                  label="Profile Avatar URL"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.avatarUrl}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                />
              </CardContent>

              <CardFooter className="flex justify-end gap-3 border-t border-slate-100 p-6 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <Button type="submit" variant="gradient" disabled={saving}>
                  <Save className="mr-1.5 h-4 w-4" />
                  {saving ? 'Saving Changes...' : 'Save Profile Changes'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
