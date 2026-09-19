'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import {
  CreditCard,
  DollarSign,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpRight,
  Eye,
  FileText,
  AlertCircle,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';

export default function SuperadminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING' | 'REJECTED'>('ALL');
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await apiClient<any[]>('/superadmin/payments');
      if (Array.isArray(data)) {
        setPayments(data);
      }
    } catch (err: any) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleVerify = async (payment: any) => {
    setActionLoading(true);
    setMessage(null);
    try {
      await apiClient(`/superadmin/payments/${payment.id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ status: 'VERIFIED', notes: 'Verified by Superadmin' }),
      });
      setMessage({
        type: 'success',
        text: `Payment ${payment.transactionRef || payment.id.slice(0, 8)} verified and course access granted!`,
      });
      setPayments((prev) =>
        prev.map((p) => (p.id === payment.id ? { ...p, status: 'VERIFIED' } : p))
      );
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to verify payment' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;
    setActionLoading(true);
    setMessage(null);
    try {
      await apiClient(`/superadmin/payments/${selectedPayment.id}/verify`, {
        method: 'POST',
        body: JSON.stringify({
          status: 'REJECTED',
          notes: rejectReason || 'Payment rejected by Superadmin',
        }),
      });
      setMessage({
        type: 'success',
        text: `Payment ${selectedPayment.transactionRef || selectedPayment.id.slice(0, 8)} has been rejected.`,
      });
      setPayments((prev) =>
        prev.map((p) => (p.id === selectedPayment.id ? { ...p, status: 'REJECTED' } : p))
      );
      setShowRejectModal(false);
      setSelectedPayment(null);
      setRejectReason('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to reject payment' });
    } finally {
      setActionLoading(false);
    }
  };

  const totalVolume = payments
    .filter((p) => p.status === 'VERIFIED')
    .reduce((acc, p) => acc + Number(p.amount), 0);

  const pendingCount = payments.filter((p) => p.status === 'PENDING').length;

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      `${p.transactionRef || ''} ${p.student?.user?.firstName || ''} ${p.student?.user?.lastName || ''} ${p.student?.user?.email || ''} ${p.teacher?.user?.firstName || ''} ${p.enrollment?.course?.title || ''}`
        .toLowerCase()
        .includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">Financial Oversight</Badge>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Global Payment & Transaction Ledger
          </h1>
          <p className="text-xs text-slate-500">
            Audit student tuition payments, teacher payouts, and verify transaction receipts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Card className="p-3 px-4 bg-gradient-to-r from-primary-900 to-indigo-950 text-white border-0">
            <span className="text-[10px] uppercase font-bold text-indigo-200">Verified Platform Volume</span>
            <p className="text-xl font-black">{formatPrice(totalVolume)}</p>
          </Card>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-xs font-medium ${
            message.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
              : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {(['ALL', 'VERIFIED', 'PENDING', 'REJECTED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === tab
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              {tab === 'ALL' ? 'All Transactions' : tab}
              {tab === 'PENDING' && pendingCount > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] text-white">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search ref, student, instructor, course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Txn Reference</th>
                <th className="px-5 py-3.5">Learner</th>
                <th className="px-5 py-3.5">Course / Syllabus</th>
                <th className="px-5 py-3.5">Instructor</th>
                <th className="px-5 py-3.5">Method</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPayments.map((p) => {
                const sUser = p.student?.user;
                const tUser = p.teacher?.user;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white">
                      {p.transactionRef || p.id.slice(0, 8)}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900 dark:text-white text-xs">
                        {sUser?.firstName} {sUser?.lastName}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">{sUser?.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                        {p.enrollment?.course?.title || 'English Course'}
                      </p>
                      <Badge variant="indigo" className="text-[10px] px-1.5 py-0 mt-0.5">
                        {p.enrollment?.course?.level || 'A1'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300">
                      {tUser ? `${tUser.firstName} ${tUser.lastName}` : 'Platform'}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {p.paymentMethod || 'MANUAL'}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                      {formatPrice(p.amount, p.currency)}
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-[11px]">{formatDate(p.createdAt)}</td>
                    <td className="px-5 py-4">
                      {p.status === 'VERIFIED' && <Badge variant="success">Verified</Badge>}
                      {p.status === 'PENDING' && <Badge variant="warning">Pending Approval</Badge>}
                      {p.status === 'REJECTED' && <Badge variant="destructive">Rejected</Badge>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.receiptUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            title="View Receipt"
                            onClick={() => {
                              setSelectedPayment(p);
                              setShowReceiptModal(true);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-500" />
                          </Button>
                        )}

                        {p.status !== 'VERIFIED' && (
                          <Button
                            variant="default"
                            size="sm"
                            className="h-7 text-[11px] px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={actionLoading}
                            onClick={() => handleVerify(p)}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Verify
                          </Button>
                        )}

                        {p.status === 'PENDING' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] px-2.5 text-rose-600 hover:text-rose-700 border-rose-200"
                            disabled={actionLoading}
                            onClick={() => {
                              setSelectedPayment(p);
                              setShowRejectModal(true);
                            }}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredPayments.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <CreditCard className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-xs font-medium">No payment transactions found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Reject Payment Modal */}
      {showRejectModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 bg-white dark:bg-slate-900 shadow-2xl border-slate-200 dark:border-slate-800 animate-scale-in">
            <CardHeader className="p-0 mb-4">
              <Badge variant="destructive" className="w-fit mb-1">Payment Action</Badge>
              <CardTitle className="text-lg font-bold">Reject Payment Transaction</CardTitle>
              <CardDescription className="text-xs">
                Provide a reason for rejecting txn ref {selectedPayment.transactionRef || selectedPayment.id.slice(0, 8)}.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleReject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Rejection Reason / Notes
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Transaction reference not found in bank ledger / Invalid amount"
                  required
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRejectModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" size="sm" disabled={actionLoading}>
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Receipt Proof Modal */}
      {showReceiptModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg p-6 bg-white dark:bg-slate-900 shadow-2xl border-slate-200 dark:border-slate-800 animate-scale-in">
            <CardHeader className="p-0 mb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Payment Receipt Proof</CardTitle>
                <CardDescription className="text-xs">
                  Txn Ref: {selectedPayment.transactionRef || selectedPayment.id}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowReceiptModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs dark:border-slate-800 dark:bg-slate-800/50 space-y-1">
                <p><span className="font-semibold">Learner:</span> {selectedPayment.student?.user?.firstName} {selectedPayment.student?.user?.lastName} ({selectedPayment.student?.user?.email})</p>
                <p><span className="font-semibold">Amount:</span> {formatPrice(selectedPayment.amount, selectedPayment.currency)}</p>
                <p><span className="font-semibold">Method:</span> {selectedPayment.paymentMethod}</p>
                <p><span className="font-semibold">Date:</span> {formatDate(selectedPayment.createdAt)}</p>
              </div>

              {selectedPayment.receiptUrl && (
                <div className="rounded-xl border border-slate-200 overflow-hidden dark:border-slate-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedPayment.receiptUrl}
                    alt="Payment Receipt"
                    className="w-full max-h-80 object-contain bg-slate-900"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => {
                    handleVerify(selectedPayment);
                    setShowReceiptModal(false);
                  }}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Verify Receipt
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
