'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import {
  GraduationCap,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  Lock,
  Unlock,
  AlertCircle,
  Eye,
  RefreshCw,
  FolderTree,
  Send,
  UserCheck,
  Calendar,
  Phone,
  Mail,
  ShieldCheck,
  Smartphone,
  Building,
  ExternalLink,
  Image as ImageIcon,
  Save,
  RotateCcw,
  Check,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export interface PaymentSettingsConfig {
  momoDialCode: string;
  momoMerchantName: string;
  momoNumber: string;
  airtelMerchantCode: string;
  airtelRecipient: string;
  airtelNumber: string;
  bankName: string;
  bankAccountNumber: string;
  bankBeneficiary: string;
  bankSwiftCode: string;
  instructionsNote: string;
}

export const DEFAULT_PAYMENT_CONFIG: PaymentSettingsConfig = {
  momoDialCode: '*182*8*1*123456#',
  momoMerchantName: 'FluentEdge Academy',
  momoNumber: '0788123456',
  airtelMerchantCode: '733123',
  airtelRecipient: 'FluentEdge Academy',
  airtelNumber: '0738123456',
  bankName: 'Bank of Kigali / Equity Bank',
  bankAccountNumber: '4002-8812-9923',
  bankBeneficiary: 'FluentEdge Language Services',
  bankSwiftCode: 'BOKIRW22',
  instructionsNote: 'After transferring tuition, upload your SMS confirmation or deposit slip screenshot.',
};

export interface ApplicationItem {
  id: string; // studentProfileId or userId
  studentId?: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  isVerified?: boolean;
  admissionType: 'APPLICATION' | 'DIRECT';
  applicationStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  rejectionReason: string | null;
  paymentRequirement: 'PAYMENT_REQUIRED' | 'PAYMENT_ALREADY_HANDLED' | 'PAYMENT_WAIVED' | 'PAYMENT_NOT_REQUIRED';
  paymentStatus: 'UNPAID' | 'PROOF_SUBMITTED' | 'VERIFIED' | 'REJECTED';
  learningAccess: 'LOCKED' | 'ACTIVE';
  levelId: string | null;
  levelName: string | null;
  applicationData?: {
    nativeLanguage?: string;
    targetLevel?: string;
    learningGoals?: string[];
    motivation?: string;
    phone?: string;
    submittedAt?: string;
  } | null;
  createdAt: string;
  reviewedAt: string | null;
  latestPayment?: {
    id: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    transactionReference: string;
    status: string;
    receiptUrl?: string;
    notes?: string;
    paymentDate?: string;
    submittedAt?: string;
  } | null;
}

interface ApplicationsTabProps {
  onRefreshParent?: () => void;
  showToast: (msg: { type: 'success' | 'error'; text: string }) => void;
}

export function ApplicationsTab({ onRefreshParent, showToast }: ApplicationsTabProps) {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [counts, setCounts] = useState<{
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    acceptedActive?: number;
    acceptedLocked?: number;
    unpaid?: number;
    proofPending?: number;
  }>({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    acceptedActive: 0,
    acceptedLocked: 0,
    unpaid: 0,
    proofPending: 0,
  });
  const [statusFilter, setStatusFilter] = useState<
    'PENDING' | 'ACCEPTED' | 'ACCEPTED_ACTIVE' | 'ACCEPTED_LOCKED' | 'PROOF_SUBMITTED' | 'REJECTED' | 'ALL'
  >('PENDING');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Levels for dropdown
  const [levels, setLevels] = useState<Array<{ id: string; name: string }>>([]);

  // Modals state
  const [reviewModalStudent, setReviewModalStudent] = useState<ApplicationItem | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'ACCEPT' | 'REJECT'>('ACCEPT');
  const [reviewPaymentReq, setReviewPaymentReq] = useState<string>('PAYMENT_REQUIRED');
  const [reviewLevelId, setReviewLevelId] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');

  const [paymentModalStudent, setPaymentModalStudent] = useState<ApplicationItem | null>(null);
  const [reqModalStudent, setReqModalStudent] = useState<ApplicationItem | null>(null);
  const [newPaymentReq, setNewPaymentReq] = useState<string>('PAYMENT_WAIVED');
  const [reqReason, setReqReason] = useState<string>('');

  const [detailsModalStudent, setDetailsModalStudent] = useState<ApplicationItem | null>(null);
  const [enrollLevelStudent, setEnrollLevelStudent] = useState<ApplicationItem | null>(null);
  const [selectedEnrollLevelId, setSelectedEnrollLevelId] = useState<string>('');

  // Payment Channels Configuration Modal
  const [isPaymentSettingsModalOpen, setIsPaymentSettingsModalOpen] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettingsConfig>(DEFAULT_PAYMENT_CONFIG);
  const [isLoadingPaymentSettings, setIsLoadingPaymentSettings] = useState(false);
  const [isSavingPaymentSettings, setIsSavingPaymentSettings] = useState(false);

  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchPaymentSettings = async () => {
    setIsLoadingPaymentSettings(true);
    try {
      const res = await apiClient.get<any>('/teacher/payment-settings');
      const data = res?.data || res;
      if (data && typeof data === 'object') {
        setPaymentSettings({
          ...DEFAULT_PAYMENT_CONFIG,
          ...data,
        });
      }
    } catch (err: any) {
      console.warn('Could not load payment settings:', err?.message);
    } finally {
      setIsLoadingPaymentSettings(false);
    }
  };

  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPaymentSettings(true);
    try {
      const res = await apiClient.patch<any>('/teacher/payment-settings', paymentSettings);
      const data = res?.data || res;
      if (data && typeof data === 'object') {
        setPaymentSettings({
          ...DEFAULT_PAYMENT_CONFIG,
          ...data,
        });
      }
      showToast({
        type: 'success',
        text: 'Academy payment channels updated! Students will now see these dynamic details on verification.',
      });
      setIsPaymentSettingsModalOpen(false);
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Failed to update payment settings.' });
    } finally {
      setIsSavingPaymentSettings(false);
    }
  };

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams();
      if (statusFilter !== 'ALL') q.set('status', statusFilter);
      if (search.trim()) q.set('search', search.trim());

      const res = await apiClient.get<any>(`/teacher/applications?${q.toString()}`);
      const data = res?.data || res;
      const rawApps = data?.applications || [];
      const normalizedApps: ApplicationItem[] = rawApps.map((app: any) => {
        const resolvedId = app.id || app.studentId || app.userId || app.profileId;
        const payment = app.latestPayment || (app.latestPaymentId ? {
          id: app.latestPaymentId,
          amount: Number(app.latestPaymentAmount) || 0,
          currency: app.latestPaymentCurrency || 'RWF',
          paymentMethod: app.latestPaymentMethod || 'Mobile Money',
          transactionReference: app.latestTransactionRef || app.transactionRef || '',
          status: app.latestPaymentStatus || app.paymentStatus,
          receiptUrl: app.latestReceiptUrl || app.receiptUrl || '',
          notes: app.latestPaymentNotes || app.notes || '',
          paymentDate: app.latestPaymentDate || app.paymentDate,
          submittedAt: app.latestPaymentDate || app.paymentDate,
        } : null);

        return {
          ...app,
          id: resolvedId,
          studentId: app.studentId || resolvedId,
          userId: app.userId || resolvedId,
          latestPayment: payment,
        };
      });
      setApplications(normalizedApps);
      if (data?.counts) {
        setCounts(data.counts);
      }
    } catch (err: any) {
      console.error('Failed to load applications:', err);
      showToast({ type: 'error', text: 'Failed to load applications.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, search]);

  useEffect(() => {
    fetchPaymentSettings();
    apiClient
      .get<any>('/levels')
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data || res?.levels || [];
        setLevels(list);
      })
      .catch((err) => console.error(err));
  }, []);

  // 1. Submit Application Review (Accept / Reject)
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalStudent) return;
    setIsActionLoading(true);

    try {
      const targetId = reviewModalStudent.id || (reviewModalStudent as any).studentId || reviewModalStudent.userId;
      if (!targetId || targetId === 'undefined') {
        throw new Error('Student identifier is missing. Please close and re-open the review modal.');
      }

      if (reviewDecision === 'REJECT' && !rejectionReason.trim()) {
        throw new Error('Please provide an official rejection reason.');
      }

      await apiClient.post(`/teacher/applications/${targetId}/review`, {
        decision: reviewDecision,
        paymentRequirement: reviewPaymentReq,
        rejectionReason: reviewDecision === 'REJECT' ? rejectionReason.trim() : null,
        levelId: reviewDecision === 'ACCEPT' && reviewLevelId ? reviewLevelId : null,
      });

      showToast({
        type: 'success',
        text: `Application ${reviewDecision === 'ACCEPT' ? 'accepted' : 'rejected'} for ${reviewModalStudent.firstName}.`,
      });

      setReviewModalStudent(null);
      setRejectionReason('');
      await fetchApplications();
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Failed to submit review.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // 2. Verify or Reject Payment Proof
  const handleVerifyPayment = async (studentId: string, verify: boolean, notes = '') => {
    setIsActionLoading(true);
    try {
      const targetId = studentId || paymentModalStudent?.id || (paymentModalStudent as any)?.studentId || paymentModalStudent?.userId;
      if (!targetId || targetId === 'undefined') {
        throw new Error('Student identifier is missing. Please close and re-open the payment modal.');
      }

      if (verify) {
        await apiClient.post(`/teacher/students/${targetId}/verify-payment`, { notes });
        showToast({ type: 'success', text: 'Payment verified! Student learning access is now ACTIVE.' });
      } else {
        await apiClient.post(`/teacher/students/${targetId}/reject-payment`, {
          reason: notes || 'Transaction reference not found on academy records.',
        });
        showToast({ type: 'success', text: 'Payment proof rejected. Student notified to resubmit.' });
      }

      setPaymentModalStudent(null);
      await fetchApplications();
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Payment action failed.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // 3. Change Payment Requirement
  const handleChangeRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqModalStudent) return;
    setIsActionLoading(true);

    try {
      const targetId = reqModalStudent.id || (reqModalStudent as any).studentId || reqModalStudent.userId;
      if (!targetId || targetId === 'undefined') {
        throw new Error('Student identifier is missing.');
      }

      await apiClient.patch(`/teacher/students/${targetId}/payment-requirement`, {
        paymentRequirement: newPaymentReq,
        reason: reqReason || 'Instructor adjusted payment policy',
      });

      showToast({
        type: 'success',
        text: `Payment requirement updated to ${newPaymentReq.replace('PAYMENT_', '')}.`,
      });

      setReqModalStudent(null);
      setReqReason('');
      await fetchApplications();
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Failed to change requirement.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // 4. Enroll in Level
  const handleEnrollLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollLevelStudent || !selectedEnrollLevelId) return;
    setIsActionLoading(true);

    try {
      const targetId = enrollLevelStudent.id || (enrollLevelStudent as any).studentId || enrollLevelStudent.userId;
      if (!targetId || targetId === 'undefined') {
        throw new Error('Student identifier is missing.');
      }

      await apiClient.post(`/teacher/students/${targetId}/enroll-level`, {
        levelId: selectedEnrollLevelId,
      });

      showToast({ type: 'success', text: 'Student enrolled in level courses successfully!' });
      setEnrollLevelStudent(null);
      await fetchApplications();
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Failed to enroll student in level.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ─── Summary Ribbon ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div
          onClick={() => setStatusFilter('PENDING')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'PENDING'
              ? 'border-amber-400 bg-amber-50/60 dark:bg-amber-950/40 ring-2 ring-amber-400/30'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">Pending Review</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{counts.pending}</p>
          <p className="text-[10px] text-slate-500">Requires academic review</p>
        </div>

        <div
          onClick={() => setStatusFilter('ACCEPTED_ACTIVE')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'ACCEPTED_ACTIVE'
              ? 'border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-400/30'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">Accepted • Active</span>
            <Unlock className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{counts.acceptedActive ?? 0}</p>
          <p className="text-[10px] text-slate-500">Unlocked &amp; enrolled</p>
        </div>

        <div
          onClick={() => setStatusFilter('ACCEPTED_LOCKED')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'ACCEPTED_LOCKED'
              ? 'border-amber-400 bg-amber-50/60 dark:bg-amber-950/40 ring-2 ring-amber-400/30'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">Accepted • Locked</span>
            <Lock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{counts.acceptedLocked ?? 0}</p>
          <p className="text-[10px] text-slate-500">Verified account, unpaid</p>
        </div>

        <div
          onClick={() => setStatusFilter('PROOF_SUBMITTED')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'PROOF_SUBMITTED'
              ? 'border-blue-400 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-400/30'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">Proof In Review</span>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{counts.proofPending ?? 0}</p>
          <p className="text-[10px] text-slate-500">Receipts awaiting check</p>
        </div>

        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'ALL'
              ? 'border-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-400/30'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">All Records</span>
            <GraduationCap className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{counts.total}</p>
          <p className="text-[10px] text-slate-500">Complete admission ledger</p>
        </div>
      </div>

      {/* ─── Search & Quick Filter Pills ─── */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search applicants by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-xs rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            />
          </div>
          <Button
            type="button"
            onClick={() => {
              fetchPaymentSettings();
              setIsPaymentSettingsModalOpen(true);
            }}
            variant="outline"
            className="h-10 text-xs font-bold rounded-2xl gap-2 border-blue-200 dark:border-blue-900 bg-blue-50/70 hover:bg-blue-100 text-[#012970] dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50 shrink-0 shadow-xs transition-colors"
            title="Configure academy payment accounts, dial codes, numbers and banks displayed to students"
          >
            <CreditCard className="h-4 w-4 text-[#006EF3]" />
            <span className="hidden sm:inline">Configure Payment Channels</span>
            <span className="sm:hidden">Payment Channels</span>
          </Button>
        </div>

        {/* Filter Pills with Counts */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 flex-wrap">
          {[
            { id: 'PENDING', label: 'Pending', count: counts.pending },
            { id: 'ACCEPTED', label: 'All Accepted', count: counts.accepted },
            { id: 'ACCEPTED_ACTIVE', label: 'Active Access', count: counts.acceptedActive ?? 0 },
            { id: 'ACCEPTED_LOCKED', label: 'Locked / Unpaid', count: counts.acceptedLocked ?? 0 },
            { id: 'PROOF_SUBMITTED', label: 'Proof Review', count: counts.proofPending ?? 0 },
            { id: 'REJECTED', label: 'Declined', count: counts.rejected },
            { id: 'ALL', label: 'All', count: counts.total },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id as any)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                statusFilter === item.id
                  ? 'bg-white dark:bg-slate-900 text-[#012970] dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <span>{item.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  statusFilter === item.id
                    ? 'bg-[#F3F7FC] text-[#012970] dark:bg-slate-800 dark:text-blue-300'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {item.count}
              </span>
            </button>
          ))}

          <Button
            onClick={fetchApplications}
            variant="outline"
            size="sm"
            className="h-7 text-xs font-bold rounded-lg gap-1 border-slate-200 dark:border-slate-700 ml-1"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ─── Applications Table ─── */}
      <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Payment Req</th>
                <th className="py-3 px-3">Payment Status</th>
                <th className="py-3 px-3">Learning Access</th>
                <th className="py-3 px-3">Level Program</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-[#006EF3]" />
                    Loading applications...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No applications found matching the current filter.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Applicant details */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#012970] to-[#006EF3] text-white font-black text-xs flex items-center justify-center shrink-0">
                          {app.firstName?.[0]}
                          {app.lastName?.[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {app.firstName} {app.lastName}
                            </p>
                            {app.isVerified ? (
                              <span
                                className="inline-flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded-md border border-emerald-200 dark:border-emerald-800"
                                title="User Account Verified"
                              >
                                ✓ Verified
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded-md"
                                title="User Account Not Verified"
                              >
                                Unverified
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">{app.email}</p>
                          {app.phone && <p className="text-[10px] text-slate-400 font-mono">{app.phone}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Admission Type */}
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          app.admissionType === 'DIRECT'
                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {app.admissionType}
                      </span>
                    </td>

                    {/* Application Status */}
                    <td className="py-3.5 px-3">
                      {app.applicationStatus === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="h-3 w-3 animate-spin" /> Pending
                        </span>
                      )}
                      {app.applicationStatus === 'ACCEPTED' && (
                        <div className="flex flex-col gap-0.5 items-start">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> Accepted
                          </span>
                          {app.learningAccess === 'LOCKED' ? (
                            <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-0.5">
                              <Lock className="h-2.5 w-2.5" /> Locked
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                              <Unlock className="h-2.5 w-2.5" /> Active Access
                            </span>
                          )}
                        </div>
                      )}
                      {app.applicationStatus === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="h-3 w-3" /> Rejected
                        </span>
                      )}
                    </td>

                    {/* Payment Requirement */}
                    <td className="py-3.5 px-3">
                      <button
                        onClick={() => {
                          setReqModalStudent(app);
                          setNewPaymentReq(app.paymentRequirement || 'PAYMENT_REQUIRED');
                        }}
                        className="text-left group flex items-center gap-1 hover:underline cursor-pointer"
                        title="Click to change requirement"
                      >
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          {app.paymentRequirement?.replace('PAYMENT_', '').replace(/_/g, ' ') || 'None'}
                        </span>
                        <span className="text-[10px] text-slate-400 group-hover:text-emerald-600">✎</span>
                      </button>
                    </td>

                    {/* Payment Status */}
                    <td className="py-3.5 px-3">
                      {app.paymentStatus === 'PROOF_SUBMITTED' ? (
                        <button
                          onClick={() => setPaymentModalStudent(app)}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 animate-pulse hover:bg-amber-200"
                        >
                          <CreditCard className="h-3 w-3" /> Review Proof
                        </button>
                      ) : app.paymentStatus === 'VERIFIED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> Verified
                        </span>
                      ) : app.paymentStatus === 'REJECTED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Proof Rejected
                        </span>
                      ) : (
                        <div className="flex flex-col gap-0.5 items-start">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              app.applicationStatus === 'ACCEPTED'
                                ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            Unpaid
                          </span>
                          {app.applicationStatus === 'ACCEPTED' && app.isVerified && (
                            <span className="text-[9px] text-amber-700 dark:text-amber-400 font-semibold" title="Account verified but tuition payment still pending">
                              Verified • Unpaid
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Learning Access */}
                    <td className="py-3.5 px-3">
                      {app.learningAccess === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                          <Unlock className="h-3 w-3" /> Active Access
                        </span>
                      ) : (
                        <div className="flex flex-col gap-0.5 items-start">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            <Lock className="h-3 w-3 text-amber-600" /> Locked
                          </span>
                          <span className="text-[9px] text-amber-700 dark:text-amber-400 font-medium">
                            {app.paymentStatus === 'PROOF_SUBMITTED'
                              ? 'Proof in review'
                              : app.paymentStatus === 'UNPAID'
                              ? 'Requires payment'
                              : 'Access withheld'}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Level Program */}
                    <td className="py-3.5 px-3">
                      {app.levelName ? (
                        <button
                          onClick={() => {
                            setEnrollLevelStudent(app);
                            setSelectedEnrollLevelId(app.levelId || '');
                          }}
                          className="font-bold text-[#006EF3] hover:underline"
                        >
                          {app.levelName}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setEnrollLevelStudent(app);
                            setSelectedEnrollLevelId('');
                          }}
                          className="text-[10px] font-bold text-amber-600 hover:underline flex items-center gap-1"
                        >
                          <FolderTree className="h-3 w-3" /> Assign Level
                        </button>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          onClick={() => setDetailsModalStudent(app)}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 rounded-lg text-slate-500 hover:text-slate-900"
                          title="View Application Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>

                        {app.applicationStatus === 'PENDING' && (
                          <Button
                            onClick={() => {
                              setReviewModalStudent(app);
                              setReviewDecision('ACCEPT');
                              setReviewPaymentReq('PAYMENT_REQUIRED');
                              setReviewLevelId(app.levelId || (levels[0]?.id ?? ''));
                            }}
                            size="sm"
                            className="bg-[#012970] hover:bg-[#006EF3] text-white text-[11px] font-bold h-7 px-2.5 rounded-lg shadow-xs transition-colors"
                          >
                            Review
                          </Button>
                        )}

                        {app.paymentStatus === 'PROOF_SUBMITTED' && (
                          <Button
                            onClick={() => setPaymentModalStudent(app)}
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold h-7 px-2.5 rounded-lg shadow-xs gap-1"
                          >
                            <CreditCard className="h-3 w-3" /> Proof
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ───────────────────────────────────────────────────────────────────
          MODAL 1: APPLICATION REVIEW (ACCEPT / REJECT)
      ─────────────────────────────────────────────────────────────────── */}
      {reviewModalStudent && (
        <Modal
          isOpen={!!reviewModalStudent}
          onClose={() => setReviewModalStudent(null)}
          title={`Review Application: ${reviewModalStudent.firstName} ${reviewModalStudent.lastName}`}
          size="lg"
        >
          <form onSubmit={handleReviewSubmit} className="space-y-4 pt-1">
            {/* Applicant Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">Applicant Contact:</span>
                <span className="text-slate-500">{reviewModalStudent.email}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <p>Target: <strong className="text-emerald-700">{reviewModalStudent.applicationData?.targetLevel || 'A2'}</strong></p>
                <p>Native Language: <strong>{reviewModalStudent.applicationData?.nativeLanguage || 'N/A'}</strong></p>
              </div>
              {reviewModalStudent.applicationData?.motivation && (
                <p className="text-[11px] italic text-slate-600 bg-white dark:bg-slate-900 p-2 rounded-lg border">
                  &ldquo;{reviewModalStudent.applicationData.motivation}&rdquo;
                </p>
              )}
            </div>

            {/* Decision Tabs */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Admission Decision *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReviewDecision('ACCEPT')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    reviewDecision === 'ACCEPT'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                      : 'border-slate-200 bg-white dark:bg-slate-900 text-slate-600'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Accept Admission
                </button>

                <button
                  type="button"
                  onClick={() => setReviewDecision('REJECT')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    reviewDecision === 'REJECT'
                      ? 'border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950 dark:text-rose-200'
                      : 'border-slate-200 bg-white dark:bg-slate-900 text-slate-600'
                  }`}
                >
                  <XCircle className="h-4 w-4 text-rose-600" />
                  Reject Application
                </button>
              </div>
            </div>

            {/* If ACCEPTED: Choose Payment Requirement & Level */}
            {reviewDecision === 'ACCEPT' ? (
              <div className="space-y-3 p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    Tuition Payment Requirement *
                  </label>
                  <select
                    value={reviewPaymentReq}
                    onChange={(e) => setReviewPaymentReq(e.target.value)}
                    className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-medium"
                  >
                    <option value="PAYMENT_REQUIRED">Payment Required (student submits receipt)</option>
                    <option value="PAYMENT_ALREADY_HANDLED">Payment Already Handled (unlocks access immediately)</option>
                    <option value="PAYMENT_WAIVED">Payment Waived / Scholarship (unlocks access immediately)</option>
                    <option value="PAYMENT_NOT_REQUIRED">Payment Not Required (unlocks access immediately)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    Assign CEFR Level (Optional)
                  </label>
                  <select
                    value={reviewLevelId}
                    onChange={(e) => setReviewLevelId(e.target.value)}
                    className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-medium"
                  >
                    <option value="">-- No Level Assigned Now --</option>
                    {levels.map((lvl) => (
                      <option key={lvl.id} value={lvl.id}>
                        {lvl.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              /* If REJECTED: Mandatory Rejection Reason */
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-rose-700 dark:text-rose-400">
                  Rejection Reason (Visible to Student) *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why this application was declined (e.g. documentation incomplete, class full, prerequisite missing)..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full rounded-xl border border-rose-200 p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setReviewModalStudent(null)}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isActionLoading}
                className={`text-xs h-9 font-bold rounded-xl text-white transition-colors ${
                  reviewDecision === 'ACCEPT' ? 'bg-[#012970] hover:bg-[#006EF3]' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isActionLoading ? 'Saving Decision...' : `Confirm ${reviewDecision === 'ACCEPT' ? 'Acceptance' : 'Rejection'}`}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ───────────────────────────────────────────────────────────────────
          MODAL 2: VERIFY PAYMENT PROOF
      ─────────────────────────────────────────────────────────────────── */}
      {paymentModalStudent && (
        <Modal
          isOpen={!!paymentModalStudent}
          onClose={() => setPaymentModalStudent(null)}
          title={`Review Payment Proof: ${paymentModalStudent.firstName} ${paymentModalStudent.lastName}`}
          size="md"
        >
          <div className="space-y-4 pt-1 text-xs">
            {/* Quick reference to configured channels */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-900/50 text-[11px] text-[#012970] dark:text-blue-200">
              <span className="flex items-center gap-1.5 font-medium truncate">
                <CreditCard className="h-3.5 w-3.5 text-[#006EF3] shrink-0" />
                <span className="truncate">
                  Academy Channels: MoMo ({paymentSettings.momoDialCode || '*182*...'}) • Airtel ({paymentSettings.airtelMerchantCode || '...'}) • Bank ({paymentSettings.bankAccountNumber || '...'})
                </span>
              </span>
              <button
                type="button"
                onClick={() => setIsPaymentSettingsModalOpen(true)}
                className="font-bold underline text-[#006EF3] dark:text-blue-400 hover:text-blue-700 ml-2 shrink-0 cursor-pointer"
              >
                Edit Accounts
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 space-y-2">
              <p className="font-bold flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-amber-600" />
                Submitted Payment Receipt Details
              </p>
              {paymentModalStudent.latestPayment ? (
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-500 block">Amount Paid:</span>
                    <strong className="text-emerald-700 text-sm">
                      {paymentModalStudent.latestPayment.amount?.toLocaleString()} {paymentModalStudent.latestPayment.currency}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Channel:</span>
                    <strong>{paymentModalStudent.latestPayment.paymentMethod}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block">Reference / Transaction ID:</span>
                    <span className="font-mono font-bold bg-white dark:bg-slate-900 px-2 py-1 rounded border block select-all">
                      {paymentModalStudent.latestPayment.transactionReference || 'N/A'}
                    </span>
                  </div>
                  {paymentModalStudent.latestPayment.paymentDate && (
                    <div className="col-span-2">
                      <span className="text-slate-500 block">Payment Date / Submitted:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {new Date(paymentModalStudent.latestPayment.paymentDate).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                  {paymentModalStudent.latestPayment.notes && (
                    <div className="col-span-2">
                      <span className="text-slate-500 block">Notes from Student:</span>
                      <p className="italic text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 p-2 rounded border">
                        {paymentModalStudent.latestPayment.notes}
                      </p>
                    </div>
                  )}

                  {/* Receipt Image / Proof Preview */}
                  {paymentModalStudent.latestPayment.receiptUrl && (
                    <div className="col-span-2 space-y-1.5 pt-1">
                      <span className="text-slate-600 dark:text-slate-300 font-bold block">
                        Attached Receipt Proof:
                      </span>
                      {paymentModalStudent.latestPayment.receiptUrl.startsWith('http') ||
                      paymentModalStudent.latestPayment.receiptUrl.startsWith('/') ||
                      paymentModalStudent.latestPayment.receiptUrl.startsWith('data:') ? (
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 space-y-2">
                          <div className="max-h-60 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <img
                              src={paymentModalStudent.latestPayment.receiptUrl}
                              alt="Payment proof screenshot"
                              className="max-h-56 max-w-full object-contain rounded"
                            />
                          </div>
                          <div className="flex justify-end">
                            <a
                              href={paymentModalStudent.latestPayment.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" /> Open Full Image
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl border bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                          {paymentModalStudent.latestPayment.receiptUrl}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-500">No payment transaction payload attached.</p>
              )}
            </div>

            <p className="text-slate-500 text-[11px]">
              Verifying this payment will instantly switch the student&apos;s learning access to <strong className="text-emerald-600">ACTIVE</strong>.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                disabled={isActionLoading}
                onClick={() => handleVerifyPayment(paymentModalStudent.id || (paymentModalStudent as any).studentId || paymentModalStudent.userId, false, 'Reference not verified')}
                className="text-xs h-9 border-rose-200 text-rose-700 hover:bg-rose-50"
              >
                Reject Proof
              </Button>

              <Button
                type="button"
                disabled={isActionLoading}
                onClick={() => handleVerifyPayment(paymentModalStudent.id || (paymentModalStudent as any).studentId || paymentModalStudent.userId, true, 'Payment verified by teacher')}
                className="text-xs h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
              >
                {isActionLoading ? 'Verifying...' : 'Verify & Unlock Access'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ───────────────────────────────────────────────────────────────────
          MODAL 3: CHANGE PAYMENT REQUIREMENT
      ─────────────────────────────────────────────────────────────────── */}
      {reqModalStudent && (
        <Modal
          isOpen={!!reqModalStudent}
          onClose={() => setReqModalStudent(null)}
          title={`Adjust Payment Policy: ${reqModalStudent.firstName} ${reqModalStudent.lastName}`}
          size="md"
        >
          <form onSubmit={handleChangeRequirement} className="space-y-4 pt-1 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
              <p>Current Requirement: <strong>{reqModalStudent.paymentRequirement}</strong></p>
              <p>Learning Access: <strong className={reqModalStudent.learningAccess === 'ACTIVE' ? 'text-emerald-600' : 'text-amber-600'}>{reqModalStudent.learningAccess}</strong></p>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                New Payment Requirement *
              </label>
              <select
                value={newPaymentReq}
                onChange={(e) => setNewPaymentReq(e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-medium"
              >
                <option value="PAYMENT_REQUIRED">Payment Required (locks access until verified)</option>
                <option value="PAYMENT_ALREADY_HANDLED">Payment Already Handled (unlocks access)</option>
                <option value="PAYMENT_WAIVED">Payment Waived / Full Scholarship (unlocks access)</option>
                <option value="PAYMENT_NOT_REQUIRED">Payment Not Required (unlocks access)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Adjustment Reason (For Audit Log)
              </label>
              <Input
                placeholder="e.g. Paid in cash at reception, or granted scholarship"
                value={reqReason}
                onChange={(e) => setReqReason(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="ghost" onClick={() => setReqModalStudent(null)} className="text-xs h-9">
                Cancel
              </Button>
              <Button type="submit" disabled={isActionLoading} className="text-xs h-9 bg-[#012970] hover:bg-[#006EF3] text-white font-bold rounded-xl transition-colors">
                {isActionLoading ? 'Saving...' : 'Update Policy'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ───────────────────────────────────────────────────────────────────
          MODAL 4: ENROLL IN LEVEL
      ─────────────────────────────────────────────────────────────────── */}
      {enrollLevelStudent && (
        <Modal
          isOpen={!!enrollLevelStudent}
          onClose={() => setEnrollLevelStudent(null)}
          title={`Enroll in CEFR Level: ${enrollLevelStudent.firstName} ${enrollLevelStudent.lastName}`}
          size="md"
        >
          <form onSubmit={handleEnrollLevel} className="space-y-4 pt-1 text-xs">
            <p className="text-slate-500">
              Enrolling the student into a level links their profile and automatically enrolls them into all assigned courses for that level.
            </p>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Select CEFR Level *
              </label>
              <select
                required
                value={selectedEnrollLevelId}
                onChange={(e) => setSelectedEnrollLevelId(e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-medium"
              >
                <option value="">-- Choose Level --</option>
                {levels.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="ghost" onClick={() => setEnrollLevelStudent(null)} className="text-xs h-9">
                Cancel
              </Button>
              <Button type="submit" disabled={isActionLoading || !selectedEnrollLevelId} className="text-xs h-9 bg-[#012970] hover:bg-[#006EF3] text-white font-bold rounded-xl transition-colors">
                {isActionLoading ? 'Enrolling...' : 'Enroll in Level Courses'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ───────────────────────────────────────────────────────────────────
          MODAL 5: FULL APPLICATION DETAILS & RECORD
      ─────────────────────────────────────────────────────────────────── */}
      {detailsModalStudent && (
        <Modal
          isOpen={!!detailsModalStudent}
          onClose={() => setDetailsModalStudent(null)}
          title={`Application Record: ${detailsModalStudent.firstName} ${detailsModalStudent.lastName}`}
          size="lg"
        >
          <div className="space-y-4 pt-1 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Admission Type</span>
                <strong className="text-slate-900 dark:text-white">{detailsModalStudent.admissionType}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">App Status</span>
                <strong className="text-emerald-700">{detailsModalStudent.applicationStatus}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Payment Status</span>
                <strong>{detailsModalStudent.paymentStatus}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Learning Access</span>
                <strong className={detailsModalStudent.learningAccess === 'ACTIVE' ? 'text-emerald-600' : 'text-amber-600'}>
                  {detailsModalStudent.learningAccess}
                </strong>
              </div>
            </div>

            <div className="p-4 rounded-2xl border space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white">Profile Details:</h4>
              <p>Email: <strong>{detailsModalStudent.email}</strong></p>
              <p>Phone: <strong>{detailsModalStudent.phone || 'Not provided'}</strong></p>
              <p>Target Level: <strong>{detailsModalStudent.applicationData?.targetLevel || 'A2'}</strong></p>
              <p>Native Language: <strong>{detailsModalStudent.applicationData?.nativeLanguage || 'N/A'}</strong></p>
              {detailsModalStudent.applicationData?.learningGoals && (
                <div>
                  <span className="text-slate-500 block mb-1">Goals:</span>
                  <div className="flex flex-wrap gap-1">
                    {detailsModalStudent.applicationData.learningGoals.map((g) => (
                      <span key={g} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {detailsModalStudent.applicationData?.motivation && (
                <div className="pt-2">
                  <span className="text-slate-500 block">Motivation Statement:</span>
                  <p className="italic bg-slate-50 p-2 rounded-lg border mt-1">
                    &ldquo;{detailsModalStudent.applicationData.motivation}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {detailsModalStudent.rejectionReason && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800">
                <span className="font-bold block">Rejection Feedback:</span>
                <p className="text-[11px] mt-0.5">{detailsModalStudent.rejectionReason}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={() => setDetailsModalStudent(null)} className="h-9 text-xs">
                Close Record
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ───────────────────────────────────────────────────────────────────
          MODAL 6: CONFIGURE ACADEMY PAYMENT CHANNELS & ACCOUNTS
      ─────────────────────────────────────────────────────────────────── */}
      {isPaymentSettingsModalOpen && (
        <Modal
          isOpen={isPaymentSettingsModalOpen}
          onClose={() => setIsPaymentSettingsModalOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/60 text-[#006EF3]">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  Academy Payment Channels &amp; Accounts
                </h3>
                <p className="text-[11px] text-slate-500 font-normal">
                  Configure active codes, merchant names, and bank details displayed to students on verification.
                </p>
              </div>
            </div>
          }
          size="full"
        >
          <form onSubmit={handleSavePaymentSettings} className="space-y-5 pt-1 text-xs">
            {isLoadingPaymentSettings && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                <RefreshCw className="h-4 w-4 animate-spin shrink-0" />
                <span>Fetching latest payment channels from database...</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Form Inputs (Left Column) */}
              <div className="lg:col-span-7 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* 1. MTN Mobile Money */}
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50 space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                    <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 text-xs">
                      <Smartphone className="h-4 w-4 text-amber-600" />
                      MTN Mobile Money Channels
                    </span>
                    <Badge className="bg-amber-100 text-amber-800 text-[10px]">Active</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Dial Code / USSD *
                      </label>
                      <Input
                        required
                        value={paymentSettings.momoDialCode}
                        onChange={(e) =>
                          setPaymentSettings((prev) => ({ ...prev, momoDialCode: e.target.value }))
                        }
                        placeholder="*182*8*1*123456#"
                        className="h-9 text-xs rounded-xl font-mono bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Merchant Name *
                      </label>
                      <Input
                        required
                        value={paymentSettings.momoMerchantName}
                        onChange={(e) =>
                          setPaymentSettings((prev) => ({ ...prev, momoMerchantName: e.target.value }))
                        }
                        placeholder="FluentEdge Academy"
                        className="h-9 text-xs rounded-xl bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        MoMo Number / Phone
                      </label>
                      <Input
                        value={paymentSettings.momoNumber}
                        onChange={(e) =>
                          setPaymentSettings((prev) => ({ ...prev, momoNumber: e.target.value }))
                        }
                        placeholder="0788123456"
                        className="h-9 text-xs rounded-xl font-mono bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Airtel Money */}
                <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50 space-y-3">
                  <div className="flex items-center justify-between border-b border-rose-200/60 pb-2">
                    <span className="font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5 text-xs">
                      <Smartphone className="h-4 w-4 text-rose-600" />
                      Airtel Money Channels
                    </span>
                    <Badge className="bg-rose-100 text-rose-800 text-[10px]">Active</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Merchant Code *
                      </label>
                      <Input
                        required
                        value={paymentSettings.airtelMerchantCode}
                        onChange={(e) =>
                          setPaymentSettings((prev) => ({ ...prev, airtelMerchantCode: e.target.value }))
                        }
                        placeholder="733123"
                        className="h-9 text-xs rounded-xl font-mono bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Recipient Name *
                      </label>
                      <Input
                        required
                        value={paymentSettings.airtelRecipient}
                        onChange={(e) =>
                          setPaymentSettings((prev) => ({ ...prev, airtelRecipient: e.target.value }))
                        }
                        placeholder="FluentEdge Academy"
                        className="h-9 text-xs rounded-xl bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Airtel Number / Phone
                      </label>
                      <Input
                        value={paymentSettings.airtelNumber}
                        onChange={(e) =>
                          setPaymentSettings((prev) => ({ ...prev, airtelNumber: e.target.value }))
                        }
                        placeholder="0738123456"
                        className="h-9 text-xs rounded-xl font-mono bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Bank Wire / Deposit */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-slate-900/60 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <Building className="h-4 w-4 text-[#006EF3]" />
                      Bank Deposit / Transfer Account
                    </span>
                    <Badge className="bg-blue-100 text-blue-800 text-[10px]">Wire / Transfer</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Bank Name *
                      </label>
                      <Input
                        required
                        value={paymentSettings.bankName}
                        onChange={(e) =>
                          setPaymentSettings((prev) => ({ ...prev, bankName: e.target.value }))
                        }
                        placeholder="Bank of Kigali / Equity Bank"
                        className="h-9 text-xs rounded-xl bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Account Number *
                      </label>
                      <Input
                        required
                        value={paymentSettings.bankAccountNumber}
                        onChange={(e) =>
                          setPaymentSettings((prev) => ({ ...prev, bankAccountNumber: e.target.value }))
                        }
                        placeholder="4002-8812-9923"
                        className="h-9 text-xs rounded-xl font-mono bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Beneficiary Name *
                      </label>
                      <Input
                        required
                        value={paymentSettings.bankBeneficiary}
                        onChange={(e) =>
                          setPaymentSettings((prev) => ({ ...prev, bankBeneficiary: e.target.value }))
                        }
                        placeholder="FluentEdge Language Services"
                        className="h-9 text-xs rounded-xl bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        SWIFT / BIC Code (Optional)
                      </label>
                      <Input
                        value={paymentSettings.bankSwiftCode}
                        onChange={(e) =>
                          setPaymentSettings((prev) => ({ ...prev, bankSwiftCode: e.target.value }))
                        }
                        placeholder="BOKIRW22"
                        className="h-9 text-xs rounded-xl font-mono bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Student Guidance Note */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Payment Instructions &amp; Student Guidance
                  </label>
                  <textarea
                    rows={2}
                    value={paymentSettings.instructionsNote}
                    onChange={(e) =>
                      setPaymentSettings((prev) => ({ ...prev, instructionsNote: e.target.value }))
                    }
                    placeholder="Instructions visible to student on their payment screen..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Real-time Student Live Preview (Right Column) */}
              <div className="lg:col-span-5 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Live Student View Preview
                  </span>
                  <Badge variant="outline" className="border-blue-300 text-blue-700 dark:text-blue-300 text-[10px]">
                    Instant Sync
                  </Badge>
                </div>

                <div className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-md space-y-3 text-xs">
                  <div className="border-b pb-2 flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-[#006EF3]" />
                    <span className="font-bold text-slate-900 dark:text-white">
                      Payment Instructions
                    </span>
                  </div>

                  {/* MoMo Preview */}
                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                        <Smartphone className="h-3 w-3" />
                        MTN Mobile Money
                      </span>
                      <Badge className="bg-amber-100 text-amber-800 text-[9px]">Instant</Badge>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                      Dial: <strong className="font-mono text-slate-900 dark:text-white">{paymentSettings.momoDialCode || '*182*8*1*...#'}</strong>
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                      Merchant Name: <strong className="text-slate-900 dark:text-white">{paymentSettings.momoMerchantName || 'Academy Name'}</strong>
                    </p>
                    {paymentSettings.momoNumber && (
                      <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                        MoMo Number: <strong className="font-mono text-slate-900 dark:text-white">{paymentSettings.momoNumber}</strong>
                      </p>
                    )}
                  </div>

                  {/* Airtel Preview */}
                  <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1">
                        <Smartphone className="h-3 w-3" />
                        Airtel Money
                      </span>
                      <Badge className="bg-rose-100 text-rose-800 text-[9px]">Instant</Badge>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                      Merchant Code: <strong className="font-mono text-slate-900 dark:text-white">{paymentSettings.airtelMerchantCode || 'Code'}</strong>
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                      Recipient: <strong className="text-slate-900 dark:text-white">{paymentSettings.airtelRecipient || 'Academy Name'}</strong>
                    </p>
                    {paymentSettings.airtelNumber && (
                      <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                        Airtel Number: <strong className="font-mono text-slate-900 dark:text-white">{paymentSettings.airtelNumber}</strong>
                      </p>
                    )}
                  </div>

                  {/* Bank Preview */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-1">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <Building className="h-3 w-3 text-[#006EF3]" />
                      Bank Deposit / Transfer
                    </span>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                      Bank: <strong className="text-slate-900 dark:text-white">{paymentSettings.bankName || 'Bank Name'}</strong>
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                      Account: <strong className="font-mono text-slate-900 dark:text-white">{paymentSettings.bankAccountNumber || 'Account #'}</strong>
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                      Beneficiary: <strong className="text-slate-900 dark:text-white">{paymentSettings.bankBeneficiary || 'Beneficiary'}</strong>
                    </p>
                    {paymentSettings.bankSwiftCode && (
                      <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                        SWIFT: <strong className="font-mono text-slate-900 dark:text-white">{paymentSettings.bankSwiftCode}</strong>
                      </p>
                    )}
                  </div>

                  {/* Guidance Note Preview */}
                  {paymentSettings.instructionsNote && (
                    <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 dark:bg-blue-950/20 text-[10px] text-blue-900 dark:text-blue-200">
                      <p className="font-bold">Instructions Note:</p>
                      <p>{paymentSettings.instructionsNote}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPaymentSettings(DEFAULT_PAYMENT_CONFIG)}
                className="text-xs h-9 gap-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white w-full sm:w-auto"
                title="Reset all inputs back to original academy defaults"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Defaults
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPaymentSettingsModalOpen(false)}
                  className="text-xs h-9 flex-1 sm:flex-initial"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingPaymentSettings}
                  className="bg-[#012970] hover:bg-[#006EF3] text-white text-xs h-9 font-bold rounded-xl gap-1.5 transition-colors flex-1 sm:flex-initial"
                >
                  {isSavingPaymentSettings ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      Save Channels
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
