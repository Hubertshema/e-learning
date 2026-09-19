'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  Calendar,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
  Sparkles,
  CreditCard
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface EnrollmentRecord {
  id: string;
  status: string;
  enrolledAt: string;
  expiresAt?: string;
  isExpired: boolean;
  daysRemaining: number | null;
  progressPercent: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  course: {
    id: string;
    title: string;
    level: string;
    price: number;
    currency: string;
    teacher: {
      user: {
        firstName: string;
        lastName: string;
        email: string;
      };
    };
  };
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    transactionRef: string;
    status: string;
    createdAt: string;
  }>;
}

export default function StudentEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<EnrollmentRecord[]>('/students/enrollments');
        const list: EnrollmentRecord[] = Array.isArray(res) ? res : (res as any)?.data || [];
        setEnrollments(list);
      } catch (err) {
        console.error('Failed to load enrollments ledger', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollments();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">Access Ledger & Subscriptions</Badge>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Course Enrollment History
          </h1>
          <p className="text-xs text-slate-500">
            View course access durations, enrollment start & expiry timestamps, and payment verification receipts.
          </p>
        </div>
        <Link href="/student/courses">
          <Button variant="gradient" size="sm">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Explore New Courses
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-slate-400">Loading enrollment ledger...</div>
      ) : enrollments.length > 0 ? (
        <div className="space-y-4">
          {enrollments.map((enr) => {
            const isAccessActive = enr.status === 'ACTIVE' && !enr.isExpired;
            return (
              <Card key={enr.id} className="p-5 border-slate-200 dark:border-slate-800 shadow-md">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="indigo">Level {enr.course.level}</Badge>
                      {enr.isExpired ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : enr.status === 'ACTIVE' ? (
                        <Badge variant="success">Active</Badge>
                      ) : enr.status === 'COMPLETED' ? (
                        <Badge variant="indigo">Completed</Badge>
                      ) : (
                        <Badge variant="warning">Pending Verification</Badge>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {enr.course.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Instructor: {enr.course.teacher.user.firstName} {enr.course.teacher.user.lastName} ({enr.course.teacher.user.email})
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isAccessActive ? (
                      <Link href={`/student/learn/${enr.course.id}`}>
                        <Button variant="gradient" size="sm">
                          <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                          Launch Curriculum
                        </Button>
                      </Link>
                    ) : enr.isExpired ? (
                      <Link href={`/student/payments?courseId=${enr.course.id}`}>
                        <Button variant="outline" size="sm" className="text-rose-600 border-rose-300">
                          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                          Renew Course
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/student/payments">
                        <Button variant="outline" size="sm" className="text-xs">
                          <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                          Payment Verification
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Enrollment Meta Details Grid */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Enrolled On</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {new Date(enr.enrolledAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Access Expiry</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {enr.expiresAt ? new Date(enr.expiresAt).toLocaleDateString() : 'Lifetime Access'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Syllabus Progress</span>
                    <span className="font-bold text-primary-600">
                      {enr.progressPercent}% ({enr.completedLessonsCount}/{enr.totalLessonsCount} Lessons)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tuition Status</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      ${enr.course.price} {enr.course.currency} (Verified)
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <GraduationCap className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No active enrollments</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
            You haven't requested enrollment in any courses yet. Browse our catalog to start learning.
          </p>
          <Link href="/student/courses">
            <Button variant="gradient" size="sm">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Browse Course Catalog
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
