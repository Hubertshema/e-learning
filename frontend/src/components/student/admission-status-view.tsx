'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ShieldAlert,
  CreditCard,
  Building,
  Smartphone,
  Sparkles,
  RefreshCw,
  FileText,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  Lock,
  ArrowRight,
  Send,
  HelpCircle,
  Upload,
  FileCheck,
  Trash2,
  Image as ImageIcon,
  Copy,
  PhoneCall
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export interface AdmissionStatusData {
  studentProfileId: string;
  admissionType: 'APPLICATION' | 'DIRECT';
  applicationStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  rejectionReason: string | null;
  paymentRequirement: 'PAYMENT_REQUIRED' | 'PAYMENT_ALREADY_HANDLED' | 'PAYMENT_WAIVED' | 'PAYMENT_NOT_REQUIRED';
  paymentStatus: 'UNPAID' | 'PROOF_SUBMITTED' | 'VERIFIED' | 'REJECTED';
  learningAccess: 'LOCKED' | 'ACTIVE';
  applicationData?: {
    nativeLanguage?: string;
    targetLevel?: string;
    learningGoals?: string[];
    motivation?: string;
    phone?: string;
    submittedAt?: string;
  } | null;
  level?: {
    id: string;
    name: string;
    levelNumber?: number;
    description?: string;
  } | null;
  latestPayment?: {
    id: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    transactionReference: string;
    status: string;
    notes?: string;
    submittedAt?: string;
    verifiedAt?: string;
  } | null;
  auditTrail?: Array<{
    id: string;
    action: string;
    fromStatus: string;
    toStatus: string;
    reason: string;
    createdAt: string;
  }>;
  paymentInstructions?: {
    momoDialCode?: string;
    momoMerchantName?: string;
    momoNumber?: string;
    airtelMerchantCode?: string;
    airtelRecipient?: string;
    airtelNumber?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankBeneficiary?: string;
    bankSwiftCode?: string;
    instructionsNote?: string;
  };
}

interface AdmissionStatusViewProps {
  status: AdmissionStatusData;
  studentName: string;
  studentEmail: string;
  onRefresh: () => Promise<void>;
}

const ActionButtons = ({ text, isPhone = false }: { text: string; isPhone?: boolean }) => {
  const [copied, setCopied] = React.useState(false);
  const onCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <span className="inline-flex items-center gap-1 ml-2 align-middle relative -top-0.5">
      <button 
        type="button" 
        onClick={onCopy} 
        className="p-1 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors shadow-sm border border-slate-200/50 dark:border-slate-700/50" 
        title="Copy"
      >
        {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200" />}
      </button>
      {isPhone && (
        <a 
          href={`tel:${text.replace(/#/g, '%23')}`} 
          className="p-1 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors shadow-sm border border-slate-200/50 dark:border-slate-700/50 inline-flex items-center justify-center" 
          title="Dial/Call"
        >
          <PhoneCall className="h-3.5 w-3.5 text-[#006EF3]" />
        </a>
      )}
    </span>
  );
};

export function AdmissionStatusView({
  status,
  studentName,
  studentEmail,
  onRefresh,
}: AdmissionStatusViewProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [proofSuccess, setProofSuccess] = useState<string | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);

  // Payment proof form state
  const [amount, setAmount] = useState('50000');
  const [currency, setCurrency] = useState('RWF');
  const [paymentMethod, setPaymentMethod] = useState('MTN Mobile Money');
  const [transactionReference, setTransactionReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [proofNotes, setProofNotes] = useState('');
  const [proofImageFile, setProofImageFile] = useState<File | null>(null);
  const [proofImagePreview, setProofImagePreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setProofError('Receipt file size must be less than 10MB.');
        return;
      }
      setProofImageFile(file);
      if (file.type.startsWith('image/')) {
        setProofImagePreview(URL.createObjectURL(file));
      } else {
        setProofImagePreview(null);
      }
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePaymentProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProofError(null);
    setProofSuccess(null);
    setIsSubmittingProof(true);

    try {
      if (!transactionReference.trim()) {
        throw new Error('Please enter the transaction reference or receipt number.');
      }

      let uploadedReceiptUrl = '';
      if (proofImageFile) {
        const formData = new FormData();
        formData.append('file', proofImageFile);
        formData.append('folder', 'elearning/receipts');
        try {
          const uploadRes: any = await apiClient.upload('/upload/media', formData);
          uploadedReceiptUrl = uploadRes?.url || '';
        } catch (upErr: any) {
          console.warn('Image upload failed, falling back:', upErr);
        }
      }

      const receiptFinal = uploadedReceiptUrl || (proofNotes ? `Notes: ${proofNotes}` : 'Direct mobile receipt');

      await apiClient.post('/student/payment-proof', {
        amount: Number(amount) || 0,
        currency,
        paymentMethod,
        transactionRef: transactionReference.trim(),
        transactionReference: transactionReference.trim(),
        paymentDate,
        receiptUrl: receiptFinal,
        proofUrl: receiptFinal,
        notes: proofNotes,
      });

      setProofSuccess('Payment proof submitted successfully! The administration will review and verify your access.');
      setProofImageFile(null);
      setProofImagePreview(null);
      await onRefresh();
    } catch (err: any) {
      setProofError(err?.message || 'Failed to submit payment proof. Please try again.');
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const appData = status.applicationData || {};

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 py-4">
      {/* Top Banner with Action status */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#011538] via-[#012970] to-[#006EF3] p-6 sm:p-8 text-white shadow-xl border border-blue-400/25">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                <GraduationCap className="h-3.5 w-3.5 text-[#F5B400]" />
                Admission &amp; Enrollment Hub
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome, {studentName}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 max-w-xl font-normal">
              Track your application status, complete enrollment requirements, and activate your CEFR learning space.
            </p>
          </div>

          <Button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="border-blue-400/30 bg-blue-950/40 text-blue-200 hover:bg-blue-900/60 backdrop-blur-md text-xs font-bold h-9 gap-1.5 self-start sm:self-center"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────
          CASE 1: APPLICATION IS PENDING
      ─────────────────────────────────────────────────────────────────── */}
      {status.applicationStatus === 'PENDING' && (
        <div className="space-y-6">
          <Card className="border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 shadow-md rounded-3xl overflow-hidden">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                  <Clock className="h-6 w-6 animate-pulse" />
                </div>
                <div>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-200 mb-1">
                    Application Pending Review
                  </Badge>
                  <CardTitle className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    Your application is waiting to be reviewed.
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    Thank you for applying to LinguaChris Academy! Our instructors are currently reviewing your background and CEFR placement details.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 pt-2 space-y-6">
              {/* Stepper */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900 shadow-xs">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs mb-1">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Step 1: Submitted</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Your profile and account have been successfully registered.</p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 shadow-xs">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs mb-1">
                    <Clock className="h-4 w-4 animate-spin" />
                    <span>Step 2: Under Review</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Academic staff is assessing your admission requirements.</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 opacity-70">
                  <div className="flex items-center gap-2 text-slate-400 font-bold text-xs mb-1">
                    <Lock className="h-4 w-4" />
                    <span>Step 3: Learning Access</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Course materials and interactive lessons will unlock once accepted.</p>
                </div>
              </div>

              {/* Submitted Details Review */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Application Summary
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400">Applicant:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{studentName}</p>
                    <p className="text-slate-500">{studentEmail}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Target Level:</span>
                    <p className="font-bold text-emerald-700 dark:text-emerald-400">
                      {appData.targetLevel || 'A2 Pre-Intermediate'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Native Language:</span>
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      {appData.nativeLanguage || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Contact Phone:</span>
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      {appData.phone || 'Not specified'}
                    </p>
                  </div>
                </div>

                {appData.learningGoals && appData.learningGoals.length > 0 && (
                  <div>
                    <span className="text-slate-400 text-xs block mb-1.5">Learning Goals:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {appData.learningGoals.map((g: string) => (
                        <span
                          key={g}
                          className="px-2.5 py-0.5 rounded-lg bg-[#F3F7FC] dark:bg-slate-800 text-[#012970] dark:text-blue-300 border border-[#E2E8F0] dark:border-slate-700 text-[11px] font-bold"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {appData.motivation && (
                  <div>
                    <span className="text-slate-400 text-xs block mb-1">Motivation / Background:</span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      &ldquo;{appData.motivation}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Assistance Box */}
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#F3F7FC] dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-xs text-slate-600 dark:text-slate-300">
                <HelpCircle className="h-5 w-5 text-[#006EF3] shrink-0" />
                <div>
                  <p className="font-bold text-[#012970] dark:text-slate-200">Have questions regarding your application?</p>
                  <p className="text-slate-500">
                    Contact the admissions office at{' '}
                    <a
                      href="mailto:linguachrisltd@gmail.com"
                      className="font-bold text-[#006EF3] dark:text-blue-400 hover:underline"
                    >
                      linguachrisltd@gmail.com
                    </a>{' '}
                    or via WhatsApp at{' '}
                    <a
                      href="https://wa.me/250782572028"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[#006EF3] dark:text-blue-400 hover:underline"
                    >
                      +250 782 572 028
                    </a>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────
          CASE 2: APPLICATION IS REJECTED
      ─────────────────────────────────────────────────────────────────── */}
      {status.applicationStatus === 'REJECTED' && (
        <Card className="border-rose-200 bg-rose-50/40 dark:bg-rose-950/20 shadow-md rounded-3xl overflow-hidden">
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <Badge className="bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900 dark:text-rose-200 mb-1">
                  Application Not Approved
                </Badge>
                <CardTitle className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Application Decision Notice
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  We have reviewed your application. Unfortunately, your admission could not be approved at this time.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 pt-2 space-y-5">
            {/* Reason Box */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 space-y-2">
              <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                Official Feedback / Reason from Teacher:
              </span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 bg-rose-50/80 dark:bg-rose-950/60 p-3.5 rounded-xl border border-rose-100 dark:border-rose-900">
                {status.rejectionReason || 'No specific reason provided by reviewer. Please reach out to the academy for clarification.'}
              </p>
            </div>

            {/* Application record */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-2 text-slate-600 dark:text-slate-300">
              <p className="font-bold text-slate-800 dark:text-slate-200">Application Record on File:</p>
              <p>Applicant: {studentName} ({studentEmail})</p>
              <p>Target Level: {appData.targetLevel || 'A2'}</p>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
              <HelpCircle className="h-5 w-5 text-slate-500 shrink-0" />
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">Want to appeal or resubmit?</p>
                <p className="text-slate-500">
                  Please contact the teaching coordinator at{' '}
                  <a
                    href="mailto:linguachrisltd@gmail.com"
                    className="font-bold text-slate-700 dark:text-slate-300 hover:underline"
                  >
                    linguachrisltd@gmail.com
                  </a>{' '}
                  with your application email.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ───────────────────────────────────────────────────────────────────
          CASE 3: ACCEPTED BUT ACCESS LOCKED (PAYMENT REQUIRED)
      ─────────────────────────────────────────────────────────────────── */}
      {status.applicationStatus === 'ACCEPTED' && status.learningAccess === 'LOCKED' && (
        <div className="space-y-6">
          {/* Welcome Acceptance Banner */}
          <div className="p-5 rounded-2xl bg-[#F3F7FC] border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-[#006EF3] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-[#012970] dark:text-blue-200">
                Congratulations! You have been accepted to LinguaChris Academy!
              </h3>
              <p className="text-xs text-[#667085] dark:text-blue-300 mt-0.5">
                Your admission has been approved by the instructor. To activate your courses and learning dashboard, please complete your tuition payment requirement below.
              </p>
            </div>
          </div>

          {/* Payment Proof Already Submitted Card */}
          {status.paymentStatus === 'PROOF_SUBMITTED' ? (
            <Card className="border-sky-200 bg-sky-50/40 dark:bg-sky-950/20 shadow-md rounded-3xl overflow-hidden">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                    <Clock className="h-6 w-6 animate-spin" />
                  </div>
                  <div>
                    <Badge className="bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-900 dark:text-sky-200 mb-1">
                      Proof Submitted — Awaiting Verification
                    </Badge>
                    <CardTitle className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      Payment Verification In Progress
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                      Your payment receipt has been submitted and is currently being verified by the academic accounts department. Once verified, your course access will instantly unlock.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 pt-2 space-y-4">
                {status.latestPayment && (
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400">Payment Method:</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{status.latestPayment.paymentMethod}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Amount:</span>
                      <p className="font-bold text-emerald-700 dark:text-emerald-400">
                        {status.latestPayment.amount?.toLocaleString()} {status.latestPayment.currency}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Transaction Reference:</span>
                      <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{status.latestPayment.transactionReference}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Status:</span>
                      <p className="font-bold text-sky-600">Pending Verification</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="bg-[#012970] hover:bg-[#006EF3] text-white text-xs font-bold rounded-xl h-9 transition-colors"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Check Verification Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Payment Required Form */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Payment Instructions (Left column) */}
              <div className="lg:col-span-5 space-y-4">
                <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <CardHeader className="p-5 pb-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-[#006EF3]" />
                      Payment Instructions
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Choose any official academy payment channel to complete your tuition.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4 text-xs">
                    {/* MTN MoMo */}
                    <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                          <Smartphone className="h-3.5 w-3.5" />
                          MTN Mobile Money
                        </span>
                        <Badge className="bg-amber-100 text-amber-800 text-[10px]">Instant</Badge>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">
                        Dial: <strong className="font-mono text-slate-900 dark:text-white select-all">{status.paymentInstructions?.momoDialCode || '*182*8*1*123456#'}</strong>
                        <ActionButtons text={status.paymentInstructions?.momoDialCode || '*182*8*1*123456#'} isPhone={true} />
                      </p>
                      <p className="text-slate-600 dark:text-slate-400">
                        Merchant Name: <strong className="text-slate-900 dark:text-white">{status.paymentInstructions?.momoMerchantName || 'FluentEdge Academy'}</strong>
                        <ActionButtons text={status.paymentInstructions?.momoMerchantName || 'FluentEdge Academy'} />
                      </p>
                      {status.paymentInstructions?.momoNumber && (
                        <p className="text-slate-600 dark:text-slate-400">
                          MoMo Number: <strong className="font-mono text-slate-900 dark:text-white select-all">{status.paymentInstructions.momoNumber}</strong>
                          <ActionButtons text={status.paymentInstructions.momoNumber} isPhone={true} />
                        </p>
                      )}
                    </div>

                    {/* Airtel Money */}
                    <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                          <Smartphone className="h-3.5 w-3.5" />
                          Airtel Money
                        </span>
                        <Badge className="bg-rose-100 text-rose-800 text-[10px]">Instant</Badge>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">
                        Merchant Code: <strong className="font-mono text-slate-900 dark:text-white select-all">{status.paymentInstructions?.airtelMerchantCode || '733123'}</strong>
                        <ActionButtons text={status.paymentInstructions?.airtelMerchantCode || '733123'} />
                      </p>
                      <p className="text-slate-600 dark:text-slate-400">
                        Recipient: <strong className="text-slate-900 dark:text-white">{status.paymentInstructions?.airtelRecipient || 'FluentEdge Academy'}</strong>
                        <ActionButtons text={status.paymentInstructions?.airtelRecipient || 'FluentEdge Academy'} />
                      </p>
                      {status.paymentInstructions?.airtelNumber && (
                        <p className="text-slate-600 dark:text-slate-400">
                          Airtel Number: <strong className="font-mono text-slate-900 dark:text-white select-all">{status.paymentInstructions.airtelNumber}</strong>
                          <ActionButtons text={status.paymentInstructions.airtelNumber} isPhone={true} />
                        </p>
                      )}
                    </div>

                    {/* Bank Wire */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-1.5">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-[#006EF3]" />
                        Bank Deposit / Transfer
                      </span>
                      <p className="text-slate-600 dark:text-slate-400">
                        Bank: <strong className="text-slate-900 dark:text-white">{status.paymentInstructions?.bankName || 'Bank of Kigali / Equity Bank'}</strong>
                      </p>
                      <p className="text-slate-600 dark:text-slate-400">
                        Account: <strong className="font-mono text-slate-900 dark:text-white select-all">{status.paymentInstructions?.bankAccountNumber || '4002-8812-9923'}</strong>
                        <ActionButtons text={status.paymentInstructions?.bankAccountNumber || '4002-8812-9923'} />
                      </p>
                      <p className="text-slate-600 dark:text-slate-400">
                        Beneficiary: <strong className="text-slate-900 dark:text-white">{status.paymentInstructions?.bankBeneficiary || 'FluentEdge Language Services'}</strong>
                        <ActionButtons text={status.paymentInstructions?.bankBeneficiary || 'FluentEdge Language Services'} />
                      </p>
                      {status.paymentInstructions?.bankSwiftCode && (
                        <p className="text-slate-600 dark:text-slate-400">
                          SWIFT / BIC: <strong className="font-mono text-slate-900 dark:text-white select-all">{status.paymentInstructions.bankSwiftCode}</strong>
                          <ActionButtons text={status.paymentInstructions.bankSwiftCode} />
                        </p>
                      )}
                    </div>

                    {/* Guidance / Instructions note */}
                    {status.paymentInstructions?.instructionsNote && (
                      <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/50 text-[11px] text-blue-950 dark:text-blue-200">
                        <p className="font-bold text-blue-900 dark:text-blue-300 mb-0.5">Instructions Note:</p>
                        <p>{status.paymentInstructions.instructionsNote}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Submit Payment Proof Form (Right column) */}
              <div className="lg:col-span-7">
                <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <CardHeader className="p-5 pb-3 bg-[#F3F7FC] dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Send className="h-4 w-4 text-[#006EF3]" />
                      Submit Payment Proof
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Enter the details from your payment receipt or SMS to activate your access.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-5">
                    <form onSubmit={handlePaymentProofSubmit} className="space-y-4 text-xs">
                      {status.paymentStatus === 'REJECTED' && (
                        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800">
                          <p className="font-bold flex items-center gap-1.5">
                            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                            Previous Payment Proof Rejected
                          </p>
                          <p className="text-[11px] mt-1 text-rose-700">
                            The instructor could not verify your previous transaction reference. Please double-check your receipt details and resubmit below.
                          </p>
                        </div>
                      )}

                      {proofSuccess && (
                        <div className="p-3.5 rounded-2xl bg-[#F3F7FC] border border-blue-200 text-[#012970] font-medium">
                          {proofSuccess}
                        </div>
                      )}

                      {proofError && (
                        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-medium">
                          {proofError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 dark:text-slate-300">Amount Paid *</label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              required
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              className="h-9 text-xs rounded-xl flex-1"
                            />
                            <select
                              value={currency}
                              onChange={(e) => setCurrency(e.target.value)}
                              className="h-9 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 px-2.5 text-xs font-bold"
                            >
                              <option value="RWF">RWF</option>
                              <option value="USD">USD</option>
                              <option value="EUR">EUR</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 dark:text-slate-300">Payment Channel *</label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-medium"
                          >
                            <option value="MTN Mobile Money">MTN Mobile Money</option>
                            <option value="Airtel Money">Airtel Money</option>
                            <option value="Bank Transfer">Bank Wire / Deposit</option>
                            <option value="Credit / Debit Card">Credit / Debit Card</option>
                            <option value="Cash / In-Person">Cash / In-Person</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 dark:text-slate-300">
                            Transaction / Reference Number *
                          </label>
                          <Input
                            required
                            placeholder="e.g. MP240928.1234.H09123"
                            value={transactionReference}
                            onChange={(e) => setTransactionReference(e.target.value)}
                            className="h-9 text-xs rounded-xl font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 dark:text-slate-300">Payment Date *</label>
                          <Input
                            type="date"
                            required
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="h-9 text-xs rounded-xl"
                          />
                        </div>
                      </div>

                      {/* Receipt Picture / Screenshot Upload */}
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Upload className="h-3.5 w-3.5 text-[#006EF3]" />
                            Upload Receipt Picture / Screenshot (Recommended)
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">PNG, JPG, WEBP, PDF up to 10MB</span>
                        </label>

                        {!proofImageFile ? (
                          <label className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-[#006EF3] dark:hover:border-blue-500/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-[#F3F7FC]/50 dark:bg-slate-900/50 group">
                            <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 shadow-xs border flex items-center justify-center text-slate-400 group-hover:text-[#006EF3] group-hover:scale-110 transition-all">
                              <Upload className="h-5 w-5" />
                            </div>
                            <div className="text-center">
                              <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                                Click or tap to browse receipt image
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Attach SMS confirmation screenshot or bank slip
                              </p>
                            </div>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                        ) : (
                          <div className="p-3 rounded-2xl border border-blue-200 bg-[#F3F7FC] dark:bg-slate-900/50 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {proofImagePreview ? (
                                <img
                                  src={proofImagePreview}
                                  alt="Receipt preview"
                                  className="h-12 w-12 rounded-xl object-cover border shrink-0 shadow-xs"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                                  <FileCheck className="h-6 w-6 text-[#006EF3]" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white truncate text-xs">
                                  {proofImageFile.name}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                  {(proofImageFile.size / 1024).toFixed(0)} KB &bull; Ready to upload
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setProofImageFile(null);
                                setProofImagePreview(null);
                              }}
                              className="h-8 w-8 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors shrink-0"
                              title="Remove image"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">
                          Receipt Notes / Proof Description (Optional)
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Sender phone number, account name, or receipt remarks..."
                          value={proofNotes}
                          onChange={(e) => setProofNotes(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#006EF3]"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmittingProof}
                        className="w-full bg-[#012970] hover:bg-[#006EF3] text-white font-bold h-10 rounded-xl shadow-md text-xs transition-colors"
                      >
                        {isSubmittingProof ? (
                          <span className="flex items-center gap-2">
                            <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            Submitting Proof...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Send className="h-4 w-4" />
                            Submit Payment Proof for Verification
                          </span>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Audit History (Collapsible or Footnote) */}
      {status.auditTrail && status.auditTrail.length > 0 && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
          <p className="font-bold text-slate-700 dark:text-slate-300 mb-2">Status &amp; Access Log:</p>
          <div className="space-y-1.5 text-[11px] text-slate-500">
            {status.auditTrail.map((audit) => (
              <div key={audit.id} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                <span>
                  <strong className="text-slate-700 dark:text-slate-300 font-semibold">{audit.action}</strong>
                  {audit.reason ? ` — ${audit.reason}` : ''}
                </span>
                <span className="font-mono text-slate-400">
                  {new Date(audit.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
