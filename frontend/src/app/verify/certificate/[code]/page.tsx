'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Award,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Download,
  Share2,
  BookOpen,
  Calendar,
  User,
  GraduationCap,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface PublicCertificateData {
  certificateCode: string;
  studentName: string;
  courseTitle: string;
  levelCompleted: string;
  finalGrade: number;
  issueDate: string;
  instructorName: string;
  status: 'VALID' | 'REVOKED';
  isValid: boolean;
  issuedBy: string;
}

export default function PublicCertificateVerificationPage() {
  const params = useParams();
  const code = params.code as string;

  const [cert, setCert] = useState<PublicCertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<PublicCertificateData>(`/public/certificates/${code}`);
        if (res.data) {
          setCert(res.data);
        }
      } catch (err: any) {
        setError(err.message || 'The requested certificate code could not be verified in our registry.');
      } finally {
        setLoading(false);
      }
    };
    if (code) {
      fetchCertificate();
    }
  }, [code]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 dark:bg-slate-950 flex flex-col items-center justify-center">
      {/* Brand Header */}
      <div className="mb-8 text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg">
            <BookOpen className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold text-slate-900 dark:text-white">FluentEdge Academy</span>
        </Link>
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
          Official Public Credential Verification Portal
        </p>
      </div>

      {loading ? (
        <Card className="w-full max-w-lg p-12 text-center shadow-xl">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Verifying credential authenticity against registry...
          </p>
        </Card>
      ) : error || !cert ? (
        <Card className="w-full max-w-lg p-8 text-center space-y-4 shadow-xl border-rose-200 dark:border-rose-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/60">
            <XCircle className="h-8 w-8 text-rose-600" />
          </div>
          <div>
            <Badge variant="destructive">Verification Failed</Badge>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
              Invalid or Unregistered Certificate
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {error || `No valid certificate found with code "${code}".`}
            </p>
          </div>
          <div className="pt-2">
            <Link href="/">
              <Button size="sm" variant="outline">Return to Homepage</Button>
            </Link>
          </div>
        </Card>
      ) : (
        /* Verified Certificate Display */
        <div className="w-full max-w-2xl space-y-6">
          {/* Status Alert Banner */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200 shadow-sm">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
              <div>
                <span className="text-xs font-bold block">Official Authenticated Credential</span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  Verified by FluentEdge Academy Registry • Code: <strong>{cert.certificateCode}</strong>
                </span>
              </div>
            </div>
            <Badge variant="success" className="px-3 py-1 font-bold">
              Active & Valid
            </Badge>
          </div>

          {/* Certificate Credential Card */}
          <Card className="p-8 sm:p-10 shadow-2xl bg-gradient-to-b from-white via-slate-50/50 to-amber-50/20 border-4 border-amber-300/40 dark:from-slate-900 dark:to-slate-950 space-y-8 text-center">
            {/* Top Seal */}
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-2xl bg-amber-100 dark:bg-amber-950 border-2 border-amber-300 flex items-center justify-center shadow-md">
                <Award className="h-10 w-10 text-amber-600" />
              </div>
            </div>

            {/* Certificate Body */}
            <div className="space-y-3">
              <span className="text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
                FluentEdge Academy International
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 dark:text-white">
                Certificate of CEFR English Proficiency
              </h1>
              <p className="text-xs text-slate-500">This official accreditation confirms that</p>
              <h2 className="text-2xl font-black text-primary-700 dark:text-primary-300">
                {cert.studentName}
              </h2>
              <p className="text-xs text-slate-500">has successfully completed the curriculum requirements for</p>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {cert.courseTitle}
              </h3>
            </div>

            {/* Credential Data Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">CEFR Level</span>
                <span className="font-black text-primary-600 text-sm">{cert.levelCompleted}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Final Grade</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{cert.finalGrade}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Issue Date</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {new Date(cert.issueDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Instructor</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{cert.instructorName}</span>
              </div>
            </div>

            {/* Verification Footer Seal */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
              <span className="font-mono">Unique Verification Code: {cert.certificateCode}</span>
              <span>Issued by {cert.issuedBy}</span>
            </div>
          </Card>

          {/* Social Share & Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <Button size="sm" variant="outline" onClick={handleCopyLink} className="text-xs">
              {copied ? <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
              {copied ? 'Verification Link Copied!' : 'Copy Verification Link'}
            </Button>
            <div className="flex gap-2">
              <Button size="sm" variant="gradient" onClick={() => window.print()} className="text-xs">
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Print / Download Credential
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
