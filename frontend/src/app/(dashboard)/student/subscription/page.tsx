'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  CreditCard,
  Upload,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Users,
  Video,
  FileCheck,
  HelpCircle,
  AlertCircle,
  Zap,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface SubscriptionPlan {
  id: string;
  name: string;
  months: number;
  priceUSD: number;
  priceRWF: number;
  popular?: boolean;
  bestValue?: boolean;
  savings?: string;
  features: string[];
}

interface SubscriptionDetails {
  status: 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'INACTIVE';
  plan: string | null;
  months: number;
  startedAt: string | null;
  expiresAt: string | null;
  remainingDays: number;
  isExpired: boolean;
  availablePlans: SubscriptionPlan[];
  recentPayments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    paymentMethod: string;
    transactionRef?: string;
    planMonths?: number;
    planName?: string;
    createdAt: string;
  }>;
}

export default function StudentSubscriptionPage() {
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    paymentMethod: 'MTN_MOMO' as 'MTN_MOMO' | 'AIRTEL_MONEY' | 'BANK_TRANSFER' | 'CARD' | 'CASH',
    transactionRef: '',
    receiptUrl: '',
    notes: '',
  });

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const res: any = await apiClient.get('/api/v1/student/subscription');
      const data: SubscriptionDetails = res?.data ?? res;
      if (data) {
        setSubscription(data);
      }
    } catch (err) {
      console.error('Failed to load subscription details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleOpenCheckout = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setSubmitSuccess(false);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    if (!formData.transactionRef.trim()) {
      setError('Please provide your payment transaction reference / SMS code.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await apiClient.post('/api/v1/student/payments/submit', {
        planMonths: selectedPlan.months,
        planName: selectedPlan.name,
        amount: selectedPlan.priceUSD,
        currency: 'USD',
        paymentMethod: formData.paymentMethod,
        transactionRef: formData.transactionRef.trim(),
        receiptUrl: formData.receiptUrl.trim() || undefined,
        notes: formData.notes.trim() || `Subscription: ${selectedPlan.name}`,
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        setModalOpen(false);
        fetchSubscription();
      }, 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to submit payment proof. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const defaultPlans: SubscriptionPlan[] = [
    {
      id: 'plan_1m',
      name: '1 Month Starter',
      months: 1,
      priceUSD: 25,
      priceRWF: 30000,
      features: [
        'Full access to all courses (A1 to C2)',
        'Interactive quizzes & diagnostic tests',
        'Live cohort session access',
        'Teacher feedback on assignments',
        '30 days unlimited access',
      ],
    },
    {
      id: 'plan_2m',
      name: '2 Months Booster',
      months: 2,
      priceUSD: 45,
      priceRWF: 55000,
      savings: 'Save 10%',
      features: [
        'Full access to all courses (A1 to C2)',
        'Interactive quizzes & diagnostic tests',
        'Live cohort session access',
        'Teacher feedback & grading',
        '60 days uninterrupted learning',
      ],
    },
    {
      id: 'plan_3m',
      name: '3 Months Pro',
      months: 3,
      priceUSD: 60,
      priceRWF: 75000,
      popular: true,
      savings: 'Save 20% • Most Popular',
      features: [
        'Everything in Booster',
        'Full CEFR level completion track',
        'Official Course Completion Certificate',
        'Priority teacher coaching & Q&A',
        '90 days complete mastery',
      ],
    },
    {
      id: 'plan_6m',
      name: '6 Months Mastery',
      months: 6,
      priceUSD: 100,
      priceRWF: 125000,
      bestValue: true,
      savings: 'Save 33% • Best Value',
      features: [
        'Full fluency pipeline (Beginner to Advanced)',
        'All live cohorts & recorded archives',
        'Multiple verified certificates',
        '1-on-1 diagnostic reviews',
        '180 days ultimate language immersion',
      ],
    },
  ];

  const plans = subscription?.availablePlans && subscription.availablePlans.length > 0
    ? subscription.availablePlans
    : defaultPlans;

  const isCurrentActive = subscription?.status === 'ACTIVE' && !subscription?.isExpired;
  const isPending = subscription?.status === 'PENDING';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/80 p-4 md:p-8 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                All-Inclusive Learning Pass
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl dark:text-white">
              Subscription & Access Plans
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              One subscription unlocks all courses, live classes, quizzes, and certificates for your chosen duration.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/student/courses">
              <Button variant="outline" className="gap-2 border-slate-300 dark:border-slate-700">
                <BookOpen className="h-4 w-4" />
                Browse Courses
              </Button>
            </Link>
          </div>
        </div>

        {/* Current Active Status Card */}
        {loading ? (
          <div className="h-32 w-full animate-pulse rounded-2xl bg-white/70 shadow-sm dark:bg-slate-900/60" />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                    isCurrentActive
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : isPending
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {isCurrentActive ? (
                    <ShieldCheck className="h-6 w-6" />
                  ) : isPending ? (
                    <Clock className="h-6 w-6" />
                  ) : (
                    <Zap className="h-6 w-6" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Current Status:
                    </h3>
                    {isCurrentActive && (
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold">
                        ACTIVE SUBSCRIPTION
                      </Badge>
                    )}
                    {isPending && (
                      <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-semibold">
                        PENDING VERIFICATION
                      </Badge>
                    )}
                    {!isCurrentActive && !isPending && (
                      <Badge variant="outline" className="border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400">
                        {subscription?.status === 'EXPIRED' ? 'EXPIRED' : 'NO ACTIVE PLAN'}
                      </Badge>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {isCurrentActive ? (
                      <>
                        You have <strong className="text-emerald-700 dark:text-emerald-400">{subscription?.remainingDays} days remaining</strong> on your{' '}
                        <strong>{subscription?.plan || `${subscription?.months} Month Access`}</strong> (valid until{' '}
                        {subscription?.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'N/A'}).
                      </>
                    ) : isPending ? (
                      'Your payment proof is under review by your instructor or administration. Access will activate shortly.'
                    ) : (
                      'Choose a flexible subscription plan below to unlock all lessons, videos, assignments, and quizzes.'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {isCurrentActive && (
                  <Link href="/student/my-courses">
                    <Button className="bg-[#315b36] hover:bg-[#27492b] text-white gap-2 shadow-sm">
                      <GraduationCap className="h-4 w-4" />
                      Continue Learning
                    </Button>
                  </Link>
                )}
                <Button
                  onClick={() => handleOpenCheckout(plans[2] || plans[0])}
                  variant={isCurrentActive ? 'outline' : 'default'}
                  className={!isCurrentActive ? 'bg-[#315b36] hover:bg-[#27492b] text-white shadow-sm gap-2' : 'gap-2 border-slate-300 dark:border-slate-700'}
                >
                  <Sparkles className="h-4 w-4" />
                  {isCurrentActive ? 'Extend Plan (+Days)' : 'Get Instant Access'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Tier Cards */}
        <div>
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-slate-900 md:text-2xl dark:text-white">
              Choose Your Learning Duration
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Pay according to how long you plan to study. Every tier grants 100% platform-wide curriculum access.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md dark:bg-slate-900 ${
                  plan.popular
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 dark:border-emerald-500'
                    : plan.bestValue
                    ? 'border-indigo-400 ring-2 ring-indigo-400/20 dark:border-indigo-500'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Badges */}
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-bold text-white shadow-sm">
                    MOST POPULAR
                  </span>
                )}
                {plan.bestValue && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-bold text-white shadow-sm">
                    BEST VALUE
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {plan.months} {plan.months === 1 ? 'Month' : 'Months'}
                    </span>
                  </div>

                  {plan.savings && (
                    <div className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {plan.savings}
                    </div>
                  )}

                  {/* Pricing Display */}
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                      ${plan.priceUSD}
                    </span>
                    <span className="text-xs text-slate-500">/ {plan.months}mo</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    ≈ {plan.priceRWF.toLocaleString()} RWF total
                  </div>

                  <div className="my-6 border-t border-slate-100 dark:border-slate-800" />

                  {/* Features */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      What&apos;s Included:
                    </p>
                    <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8">
                  <Button
                    onClick={() => handleOpenCheckout(plan)}
                    className={`w-full gap-2 font-semibold shadow-sm ${
                      plan.popular
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : plan.bestValue
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : 'bg-[#315b36] hover:bg-[#27492b] text-white'
                    }`}
                  >
                    <CreditCard className="h-4 w-4" />
                    Select {plan.name}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-bold text-slate-900 md:text-xl dark:text-white">
            Why One Subscription Beats Buying Courses Separately
          </h3>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">All CEFR Levels Included</h4>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Jump from A1 Beginner to C2 Mastery at your own speed without buying a new course at each milestone.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Live Teacher Cohorts</h4>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Join scheduled live instructor sessions, live quizzes, and interactive breakout exercises.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Official Certificates</h4>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Earn accredited CEFR certificates upon completing assignments and course exams during your plan.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Payment History */}
        {subscription?.recentPayments && subscription.recentPayments.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Payment Receipts</h3>
            <div className="mt-4 divide-y divide-slate-100 overflow-x-auto dark:divide-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500">
                    <th className="pb-3 font-semibold">Plan</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Method</th>
                    <th className="pb-3 font-semibold">Reference</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {subscription.recentPayments.map((p) => (
                    <tr key={p.id} className="py-2.5">
                      <td className="py-3 font-medium text-slate-900 dark:text-white">
                        {p.planName || `${p.planMonths || 1} Month Access`}
                      </td>
                      <td className="py-3 font-semibold text-slate-700 dark:text-slate-300">
                        {p.currency} {p.amount}
                      </td>
                      <td className="py-3 capitalize text-slate-600 dark:text-slate-400">
                        {p.paymentMethod.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 font-mono text-slate-500">{p.transactionRef || 'N/A'}</td>
                      <td className="py-3">
                        <Badge
                          className={
                            p.status === 'VERIFIED'
                              ? 'bg-emerald-500 text-white'
                              : p.status === 'PENDING'
                              ? 'bg-amber-500 text-white'
                              : 'bg-rose-500 text-white'
                          }
                        >
                          {p.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Payment Proof Submission Modal */}
      {modalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            {submitSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Payment Proof Submitted!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                  Your instructor and admin have received your submission for <strong>{selectedPlan.name}</strong>. Your subscription will be activated shortly.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Subscribe: {selectedPlan.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Duration: {selectedPlan.months} Month(s) • ${selectedPlan.priceUSD} (≈ {selectedPlan.priceRWF.toLocaleString()} RWF)
                    </p>
                  </div>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmitProof} className="mt-4 space-y-4">
                  {error && (
                    <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                      {error}
                    </div>
                  )}

                  {/* Payment Instructions */}
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                    <p className="font-bold">Payment Methods:</p>
                    <div className="mt-1 space-y-1 font-mono text-[11px]">
                      <div>📱 <strong>MTN MoMo:</strong> *182*8*1*XXXXXX# (LinguaChris)</div>
                      <div>📱 <strong>Airtel Money:</strong> *182*... (LinguaChris)</div>
                      <div>🏦 <strong>Bank Transfer / Cash:</strong> Inquire with instructor</div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Payment Channel
                    </label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="MTN_MOMO">MTN Mobile Money (MoMo)</option>
                      <option value="AIRTEL_MONEY">Airtel Money</option>
                      <option value="BANK_TRANSFER">Bank Wire / Transfer</option>
                      <option value="CARD">Debit / Credit Card</option>
                      <option value="CASH">Cash / Direct</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Transaction Reference / SMS Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MP240919.1234.H58291"
                      value={formData.transactionRef}
                      onChange={(e) => setFormData({ ...formData, transactionRef: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Screenshot / Receipt URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={formData.receiptUrl}
                      onChange={(e) => setFormData({ ...formData, receiptUrl: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Notes for Instructor (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Any additional information..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setModalOpen(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-[#315b36] hover:bg-[#27492b] text-white text-xs gap-2"
                    >
                      {submitting ? 'Submitting...' : 'Confirm & Submit Proof'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
