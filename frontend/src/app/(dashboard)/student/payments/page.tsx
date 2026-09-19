'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  AlertCircle,
  FileText,
  DollarSign
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { useCachedData } from '@/lib/cache';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  transactionRef?: string;
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
  verifiedAt?: string;
  enrollment: {
    course: {
      id: string;
      title: string;
      level: string;
      price: number;
      currency: string;
    };
  };
}

export default function StudentPaymentsPage() {
  const { data: rawPayments, loading } = useCachedData<Payment[]>(
    'student_payments',
    async () => {
      const res = await apiClient.get<Payment[]>('/student/payments');
      return (res as any)?.data || res || [];
    },
    { ttl: 120_000, initialData: [] }
  );

  const payments = Array.isArray(rawPayments) ? rawPayments : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">Billing & Course Receipts</Badge>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Payment History & Verification Status
          </h1>
          <p className="text-xs text-slate-500">
            Track submitted Mobile Money, Bank wires, and enrollment receipt verifications.
          </p>
        </div>
        <Link href="/student/courses">
          <Button variant="gradient" size="sm">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Enroll in New Course
          </Button>
        </Link>
      </div>

      {/* Payment Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary-600" />
            Submitted Payment Records ({payments.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Review status updates and transaction reference codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={4} columns={6} />
          ) : payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
                    <th className="pb-3 font-semibold">Course & Level</th>
                    <th className="pb-3 font-semibold">Payment Method</th>
                    <th className="pb-3 font-semibold">Transaction Reference</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Submission Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="indigo">{p.enrollment.course.level}</Badge>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {p.enrollment.course.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 font-medium text-slate-700 dark:text-slate-300">
                        {p.paymentMethod}
                      </td>
                      <td className="py-3.5 font-mono text-slate-600 dark:text-slate-400">
                        {p.transactionRef || '—'}
                      </td>
                      <td className="py-3.5 font-bold text-slate-900 dark:text-white">
                        ${p.amount} {p.currency}
                      </td>
                      <td className="py-3.5">
                        {p.status === 'VERIFIED' ? (
                          <Badge variant="success">Verified & Active</Badge>
                        ) : p.status === 'REJECTED' ? (
                          <Badge variant="destructive">Rejected</Badge>
                        ) : (
                          <Badge variant="warning">Pending Instructor Review</Badge>
                        )}
                      </td>
                      <td className="py-3.5 text-slate-500 text-[11px]">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <CreditCard className="mx-auto h-10 w-10 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No payment transactions recorded
              </p>
              <p className="text-[11px] text-slate-400 mt-1 mb-4">
                When you submit course tuition payment receipts, they will be tracked here.
              </p>
              <Link href="/student/courses">
                <Button size="sm" variant="gradient">Browse Courses</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
