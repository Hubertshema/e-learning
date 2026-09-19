'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Play,
  CreditCard,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  AlertCircle,
  ExternalLink,
  DollarSign,
  Upload,
  Search,
  Filter
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { CardGridSkeleton } from '@/components/ui/card-grid-skeleton';
import { useCachedData } from '@/lib/cache';


interface EnrolledCourse {
  id: string;
  status: 'PENDING' | 'PAYMENT_SUBMITTED' | 'ACTIVE' | 'EXPIRED' | 'REJECTED' | 'COMPLETED';
  enrolledAt: string;
  expiresAt?: string;
  isExpired: boolean;
  completedLessonCount: number;
  totalLessonCount: number;
  progressPercentage: number;
  course: {
    id: string;
    title: string;
    slug: string;
    description: string;
    level: string;
    price: number;
    currency: string;
    teacher: {
      user: {
        firstName: string;
        lastName: string;
      };
    };
    units: Array<{
      id: string;
      title: string;
      lessons: Array<{
        id: string;
        title: string;
        skill: string;
        estimatedMinutes: number;
      }>;
    }>;
  };
  payments: Array<{
    id: string;
    status: string;
    transactionRef: string;
    amount: number;
  }>;
}

interface CatalogCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  level: string;
  price: number;
  currency: string;
  durationDays: number;
  teacher: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  _count: {
    units: number;
    enrollments: number;
  };
}

export default function StudentCoursesPage() {
  const [activeTab, setActiveTab] = useState<'ENROLLED' | 'CATALOG'>('ENROLLED');
  const [search, setSearch] = useState('');

  // Payment Checkout Modal State
  const [checkoutCourse, setCheckoutCourse] = useState<CatalogCourse | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: 'MOBILE_MONEY' as const,
    transactionRef: '',
    notes: '',
    receiptUrl: '',
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const {
    data,
    loading,
    refresh,
    mutate
  } = useCachedData<{ enrolled: EnrolledCourse[]; catalog: CatalogCourse[] }>(
    'student_courses_catalog',
    async () => {
      const res = await apiClient.get<{ enrolled: EnrolledCourse[]; catalog: CatalogCourse[] }>(
        '/student/courses'
      );
      return (res as any)?.data || res || { enrolled: [], catalog: [] };
    },
    { ttl: 120_000, initialData: { enrolled: [], catalog: [] } }
  );

  const enrolledCourses = data?.enrolled || [];
  const catalogCourses = data?.catalog || [];

  const handleEnrollAndSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutCourse) return;

    try {
      setSubmittingPayment(true);
      await apiClient.post('/student/payments/submit', {
        courseId: checkoutCourse.id,
        amount: Number(checkoutCourse.price),
        currency: checkoutCourse.currency,
        paymentMethod: paymentForm.paymentMethod,
        transactionRef: paymentForm.transactionRef,
        notes: paymentForm.notes,
        receiptUrl: paymentForm.receiptUrl || undefined,
      });

      setFeedback({
        type: 'success',
        message: 'Payment proof submitted! Your instructor will verify the transaction and activate your access shortly.',
      });
      setCheckoutCourse(null);
      setPaymentForm({ paymentMethod: 'MOBILE_MONEY', transactionRef: '', notes: '', receiptUrl: '' });
      await refresh();
      setActiveTab('ENROLLED');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to submit payment proof' });
    } finally {
      setSubmittingPayment(false);
    }
  };

  const filteredCatalog = catalogCourses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.level.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">Curriculum & Course Access</Badge>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Courses & English Catalog
          </h1>
          <p className="text-xs text-slate-500">
            Access your active courses or enroll in new CEFR English mastery programs.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('ENROLLED')}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'ENROLLED'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            My Enrolled Courses ({enrolledCourses.length})
          </button>
          <button
            onClick={() => setActiveTab('CATALOG')}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'CATALOG'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Explore Catalog ({catalogCourses.length})
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl p-4 text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="underline text-[11px]">Dismiss</button>
        </div>
      )}

      {/* Tab 1: Enrolled Courses */}
      {activeTab === 'ENROLLED' && (
        <div className="space-y-6">
          {loading ? (
            <CardGridSkeleton count={3} columns="3" />
          ) : enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((enr) => {
                const isActive = enr.status === 'ACTIVE' && !enr.isExpired;
                return (
                  <Card key={enr.id} className="overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="indigo">{enr.course.level}</Badge>
                          {isActive ? (
                            <Badge variant="success">Active</Badge>
                          ) : enr.status === 'PENDING' || enr.status === 'PAYMENT_SUBMITTED' ? (
                            <Badge variant="warning">Verification Pending</Badge>
                          ) : enr.isExpired ? (
                            <Badge variant="destructive">Access Expired</Badge>
                          ) : (
                            <Badge variant="outline">{enr.status}</Badge>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                          {enr.course.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Instructor: {enr.course.teacher.user.firstName} {enr.course.teacher.user.lastName}
                        </p>
                      </div>

                      <CardContent className="p-5 space-y-4">
                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span>Syllabus Completion</span>
                            <span className="text-primary-600">{enr.progressPercentage}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary-600 transition-all duration-300"
                              style={{ width: `${enr.progressPercentage}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {enr.completedLessonCount} of {enr.totalLessonCount} lessons completed
                          </p>
                        </div>

                        {enr.expiresAt && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span>Valid until: {new Date(enr.expiresAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </CardContent>
                    </div>

                    <div className="p-5 pt-0">
                      {isActive ? (
                        <Link href={`/student/courses/${enr.course.id}`} className="block">
                          <Button variant="gradient" size="sm" className="w-full">
                            <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                            Open Course Player
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => {
                            const catalogMatch = catalogCourses.find((c) => c.id === enr.course.id);
                            if (catalogMatch) setCheckoutCourse(catalogMatch);
                          }}
                        >
                          <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                          Submit Payment Proof
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-slate-300 mb-2" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">No enrolled courses yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Explore the catalog and enroll in your first interactive English course.
              </p>
              <Button size="sm" variant="gradient" onClick={() => setActiveTab('CATALOG')}>
                Explore Catalog
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* Tab 2: Explore Catalog */}
      {activeTab === 'CATALOG' && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search courses by title, CEFR level, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
            />
          </div>

          {loading && catalogCourses.length === 0 ? (
            <CardGridSkeleton count={3} columns="3" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCatalog.map((c) => {
              const alreadyEnrolled = enrolledCourses.some((e) => e.course.id === c.id);
              return (
                <Card key={c.id} className="overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="indigo">{c.level}</Badge>
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          ${c.price} {c.currency}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                        {c.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Instructor: {c.teacher.user.firstName} {c.teacher.user.lastName}
                      </p>
                    </div>

                    <CardContent className="p-5 space-y-3">
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3">
                        {c.description}
                      </p>
                      <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span>{c._count?.units || 0} Units</span>
                        <span>{c.durationDays} Days Access</span>
                        <span>{c._count?.enrollments || 0} Students</span>
                      </div>
                    </CardContent>
                  </div>

                  <div className="p-5 pt-0">
                    {alreadyEnrolled ? (
                      <Link href={`/student/courses/${c.id}`} className="block">
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          Go to Course
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        variant="gradient"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => setCheckoutCourse(c)}
                      >
                        <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                        Enroll & Pay ${c.price}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
            </div>
          )}
        </div>
      )}

      {/* Payment Proof Checkout Modal */}
      {checkoutCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="indigo">{checkoutCourse.level}</Badge>
                <span className="text-sm font-black text-emerald-600">
                  ${checkoutCourse.price} {checkoutCourse.currency}
                </span>
              </div>
              <CardTitle className="text-base mt-1">Course Enrollment Checkout</CardTitle>
              <CardDescription className="text-xs">
                {checkoutCourse.title} (Duration: {checkoutCourse.durationDays} days)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Payment Instructions Box */}
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-2 mb-4 text-xs">
                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  Payment Instructions (Mobile Money & Bank Transfer)
                </p>
                <div className="space-y-1 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  <p>1. <strong>MTN / Airtel Mobile Money:</strong> Send <strong>${checkoutCourse.price}</strong> to <strong>+250 788 123 456</strong> (FluentEdge Academy).</p>
                  <p>2. <strong>Bank Transfer:</strong> Bank of Kigali / Equity Bank Account: <strong>00123-4567-8901</strong>.</p>
                  <p>3. Copy the SMS Transaction ID / Bank Reference and enter it below.</p>
                </div>
              </div>

              <form onSubmit={handleEnrollAndSubmitPayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method Used
                  </label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                  >
                    <option value="MOBILE_MONEY">Mobile Money (MTN / Airtel)</option>
                    <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="CASH">Cash at Campus Desk</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Transaction Reference / SMS Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TXN-89302194 or Ref # 482910"
                    value={paymentForm.transactionRef}
                    onChange={(e) => setPaymentForm({ ...paymentForm, transactionRef: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Receipt Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://imgur.com/... or receipt link"
                    value={paymentForm.receiptUrl}
                    onChange={(e) => setPaymentForm({ ...paymentForm, receiptUrl: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Additional Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sent from John's phone"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setCheckoutCourse(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="gradient" size="sm" disabled={submittingPayment}>
                    {submittingPayment ? 'Submitting...' : 'Submit Payment Proof'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
