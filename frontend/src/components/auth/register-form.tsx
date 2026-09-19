'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, GraduationCap, Users } from 'lucide-react';

export function RegisterForm() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') === 'TEACHER' ? 'TEACHER' : 'STUDENT';

  const { register } = useAuth();
  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>(initialRole);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Student details
  const [nativeLanguage, setNativeLanguage] = useState('');
  const [targetLevel, setTargetLevel] = useState('B2');

  // Teacher details
  const [headline, setHeadline] = useState('');
  const [experienceYears, setExperienceYears] = useState(2);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const payload: Record<string, any> = {
        firstName,
        lastName,
        email,
        password,
        role,
      };

      if (role === 'STUDENT') {
        payload.nativeLanguage = nativeLanguage || 'English';
        payload.targetLevel = targetLevel;
      } else {
        payload.headline = headline || 'English Instructor';
        payload.experienceYears = Number(experienceYears);
      }

      await register(payload);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please review your details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-slate-200/80 shadow-xl dark:border-slate-800">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Create an Account</CardTitle>
        <CardDescription>Join FluentEdge Academy and start your learning journey</CardDescription>
      </CardHeader>

      <div className="px-6">
        <Tabs value={role} onValueChange={(val) => setRole(val as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="STUDENT" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span>As Student</span>
            </TabsTrigger>
            <TabsTrigger value="TEACHER" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>As Teacher</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-4">
          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              placeholder="Alex"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Last Name"
              placeholder="Kagabo"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            placeholder="alex@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password (min 8 chars, 1 uppercase, 1 number)"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {role === 'STUDENT' ? (
            <div className="space-y-3 border-t border-slate-100 pt-3 dark:border-slate-800">
              <Input
                label="Native Language"
                placeholder="e.g. Kinyarwanda, French, Swahili"
                value={nativeLanguage}
                onChange={(e) => setNativeLanguage(e.target.value)}
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Target Proficiency Level
                </label>
                <select
                  value={targetLevel}
                  onChange={(e) => setTargetLevel(e.target.value)}
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                >
                  <option value="A1">A1 — Beginner</option>
                  <option value="A2">A2 — Elementary</option>
                  <option value="B1">B1 — Intermediate</option>
                  <option value="B2">B2 — Upper Intermediate</option>
                  <option value="C1">C1 — Advanced</option>
                  <option value="C2">C2 — Mastery</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-3 border-t border-slate-100 pt-3 dark:border-slate-800">
              <Input
                label="Professional Headline"
                placeholder="e.g. Certified CELTA ESL Instructor"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              />
              <Input
                label="Teaching Experience (Years)"
                type="number"
                min="0"
                value={experienceYears}
                onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
              />
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                * Note: Teacher registrations are reviewed and activated by the platform administrator.
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" variant="gradient" className="w-full" isLoading={isLoading}>
            Create {role === 'TEACHER' ? 'Teacher' : 'Student'} Account
          </Button>

          <p className="text-center text-xs text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary-600 hover:underline">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
