'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Search,
  Filter,
  AlertCircle,
  FileText,
  DollarSign
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  referenceNumber: string;
  proofUrl?: string;
  notes?: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
    level: string;
  };
}

export default function TeacherPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('PENDING');
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [rejectModalPayment, setRejectModalPayment] = useState<Payment | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const query = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const res = await apiClient.get<{ payments: Payment[] }>(`/teacher/payments${query}`);
      const paymentList: Payment[] =
        (res as any)?.payments ||
        (res as any)?.data?.payments ||
        (Array.isArray(res) ? res : []);
      setPayments(paymentList);
    } catch (err) {
      console.error('Failed to load payments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const handleApprove = async (paymentId: string) => {
    try {
      setActionLoading(paymentId);
      await apiClient.post(`/teacher/payments/${paymentId}/approve`);
      setFeedback({ type: 'success', message: 'Payment approved and student course enrollment activated!' });
      await fetchPayments();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to approve payment' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalPayment) return;
    try {
      setActionLoading(rejectModalPayment.id);
      await apiClient.post(`/teacher/payments/${rejectModalPayment.id}/reject`, { reason: rejectReason });
      setFeedback({ type: 'success', message: 'Payment rejected. Student has been notified.' });
      setRejectModalPayment(null);
      setRejectReason('');
      await fetchPayments();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to reject payment' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">Financial Operations</Badge>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Payment Verification & Course Activation
          </h1>
          <p className="text-xs text-slate-500">
            Verify offline receipts (Mobile Money, MTN, Airtel, Bank wire) and unlock curriculum access.
          </p>
        </div>
        {/* Status Filter Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {(['PENDING', 'VERIFIED', 'REJECTED', 'ALL'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
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

      {/* Payment Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Transaction Queue</CardTitle>
          <CardDescription className="text-xs">
            Review submitted student references, proof images, and transaction timestamps
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading transactions...</div>
          ) : payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
                    <th className="pb-3 font-semibold">Student</th>
                    <th className="pb-3 font-semibold">Course</th>
                    <th className="pb-3 font-semibold">Method & Reference</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3.5">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {p.user.firstName} {p.user.lastName}
                        </p>
                        <p className="text-[11px] text-slate-500">{p.user.email}</p>
                      </td>
                      <td className="py-3.5">
                        <Badge variant="indigo">{p.course?.level || 'Course'}</Badge>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium mt-0.5">
                          {p.course?.title}
                        </p>
                      </td>
                      <td className="py-3.5">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{p.paymentMethod}</p>
                        <p className="font-mono text-[11px] text-slate-500">{p.referenceNumber}</p>
                      </td>
                      <td className="py-3.5 font-bold text-slate-900 dark:text-white">
                        ${p.amount.toFixed(2)} {p.currency}
                      </td>
                      <td className="py-3.5">
                        {p.status === 'VERIFIED' ? (
                          <Badge variant="success">Verified</Badge>
                        ) : p.status === 'REJECTED' ? (
                          <Badge variant="destructive">Rejected</Badge>
                        ) : (
                          <Badge variant="warning">Pending Verification</Badge>
                        )}
                      </td>
                      <td className="py-3.5 text-slate-500 text-[11px]">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 text-right space-x-2">
                        {p.proofUrl && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedReceipt(p)}
                            className="text-xs"
                          >
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            Proof
                          </Button>
                        )}
                        {p.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRejectModalPayment(p)}
                              className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs"
                            >
                              <XCircle className="mr-1 h-3.5 w-3.5" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              disabled={actionLoading === p.id}
                              onClick={() => handleApprove(p.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-xs"
                            >
                              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                              {actionLoading === p.id ? 'Approving...' : 'Approve'}
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <CreditCard className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No {statusFilter.toLowerCase()} payment records found
              </p>
              <p className="text-[11px] text-slate-400">
                When students submit offline payment receipts, they will appear in this queue.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Proof Viewer Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Receipt / Proof of Payment</span>
                <span className="font-mono text-xs text-slate-500">{selectedReceipt.referenceNumber}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Submitted by {selectedReceipt.user.firstName} {selectedReceipt.user.lastName} ({selectedReceipt.user.email})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center p-4 max-h-80 dark:border-slate-800 dark:bg-slate-900">
                {selectedReceipt.proofUrl?.startsWith('http') ? (
                  <img
                    src={selectedReceipt.proofUrl}
                    alt="Payment receipt proof"
                    className="max-h-72 object-contain rounded"
                  />
                ) : (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-slate-400 mb-2" />
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                      {selectedReceipt.proofUrl || 'Proof Reference on file'}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedReceipt(null)}>
                  Close
                </Button>
                {selectedReceipt.status === 'PENDING' && (
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      handleApprove(selectedReceipt.id);
                      setSelectedReceipt(null);
                    }}
                  >
                    Approve from Viewer
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader>
              <CardTitle className="text-base text-rose-600">Reject Payment Proof</CardTitle>
              <CardDescription className="text-xs">
                Provide a clear reason for rejection so the student can re-upload a valid proof.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReject} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reason for Rejection
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Transaction reference does not match our bank statement / Image is unreadable."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-rose-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setRejectModalPayment(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" variant="destructive" disabled={actionLoading === rejectModalPayment.id}>
                    {actionLoading === rejectModalPayment.id ? 'Rejecting...' : 'Confirm Rejection'}
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
