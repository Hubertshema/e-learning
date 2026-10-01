'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  Search,
  Award,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Calendar,
  User,
  GraduationCap,
  BookOpen,
  Copy,
  Check,
  Sparkles,
  Loader2,
  RotateCcw,
  Building2,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface VerifiedCertificate {
  id: string;
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

export function CertificateVerificationSection() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifiedCertificate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleVerify = async (targetCode?: string) => {
    const codeToVerify = (targetCode || code).trim().toUpperCase();
    if (!codeToVerify) {
      setError('Please enter a certificate verification code.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setHasSearched(true);
    if (targetCode) {
      setCode(targetCode);
    }

    try {
      const res = await apiClient.get<VerifiedCertificate>(`/public/certificates/${encodeURIComponent(codeToVerify)}`);
      const payload = (res as any)?.data || res;
      if (payload && (payload.certificateCode || payload.isValid)) {
        setResult(payload);
      } else {
        setError(`Certificate '${codeToVerify}' could not be verified in our official registry.`);
      }
    } catch (err: any) {
      const msg = err?.message || 'Certificate code not found in our official registry.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!result) return;
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/verify/certificate/${result.certificateCode}`
      : `/verify/certificate/${result.certificateCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCode('');
    setResult(null);
    setError(null);
    setHasSearched(false);
  };

  return (
    <section id="verify-certificate" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="relative overflow-hidden rounded-3xl border border-[#e2ebe2] bg-gradient-to-b from-[#eff4ec]/70 via-white to-white p-6 sm:p-10 shadow-lg">
        {/* Background decorative glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#7ba27a]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#315b36]/10 blur-3xl" />

        {/* Section Header */}
        <div className="relative text-center max-w-2xl mx-auto space-y-3 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#315b36]/10 text-[#315b36] border border-[#315b36]/20">
            <ShieldCheck className="h-3.5 w-3.5 text-[#315b36]" />
            Official Credential Verification
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#2e3339]">
            Verify LinguaChris Certificates
          </h2>
          <p className="text-xs sm:text-sm text-[#5a5e63] leading-relaxed">
            Enter a student certificate serial number to instantly verify authenticity, CEFR level accreditation, and final grade directly from our database.
          </p>
        </div>

        {/* Search Input Box */}
        <div className="relative max-w-xl mx-auto mb-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify();
            }}
            className="flex flex-col sm:flex-row gap-2.5 bg-white p-2 rounded-2xl border-2 border-[#e2ebe2] shadow-md focus-within:border-[#315b36] transition-all"
          >
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-3.5 h-4 w-4 text-[#7ba27a]" />
              <Input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  if (error) setError(null);
                }}
                placeholder="Enter serial (e.g. FE-2026-6NEW)"
                className="w-full pl-10 pr-3 py-2.5 h-11 text-sm font-mono uppercase font-semibold text-[#2e3339] border-0 focus-visible:ring-0 shadow-none bg-transparent placeholder:text-[#5a5e63]/50 placeholder:font-sans placeholder:font-normal"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 px-6 rounded-xl bg-[#315b36] hover:bg-[#254629] text-white font-bold text-xs uppercase tracking-wider shadow-md shrink-0 gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Verify
                </>
              )}
            </Button>
          </form>

          {/* Quick Demo Chips */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[11px] text-[#5a5e63]">
            <span className="font-medium text-[#2e3339]">Quick Test:</span>
            <button
              type="button"
              onClick={() => handleVerify('FE-2026-6NEW')}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white border border-[#e2ebe2] text-[#315b36] font-mono font-bold hover:bg-[#eff4ec] hover:border-[#315b36]/40 transition shadow-2xs"
            >
              FE-2026-6NEW
            </button>
            <button
              type="button"
              onClick={() => handleVerify('FE-2026-GB0M')}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white border border-[#e2ebe2] text-[#315b36] font-mono font-bold hover:bg-[#eff4ec] hover:border-[#315b36]/40 transition shadow-2xs"
            >
              FE-2026-GB0M
            </button>
          </div>
        </div>

        {/* Verification Results Display */}
        <div className="max-w-2xl mx-auto">
          {loading && (
            <Card className="p-8 text-center rounded-2xl border border-[#e2ebe2] bg-white shadow-sm space-y-3 animate-in fade-in">
              <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#315b36] border-t-transparent mx-auto" />
              <p className="text-xs font-bold text-[#2e3339]">
                Connecting to LinguaChris Academic Registry...
              </p>
              <p className="text-[11px] text-[#5a5e63]">
                Querying cryptographic ledger for certificate #{code}
              </p>
            </Card>
          )}

          {!loading && error && (
            <Card className="p-6 sm:p-8 rounded-2xl border border-rose-200 bg-rose-50/70 text-center space-y-4 shadow-sm animate-in fade-in">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <XCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-rose-900">Certificate Not Found</h3>
                <p className="text-xs text-rose-700 leading-relaxed max-w-md mx-auto">
                  {error}
                </p>
              </div>
              <div className="flex justify-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="border-rose-300 text-rose-800 hover:bg-rose-100 text-xs h-8 gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Try Another Code
                </Button>
              </div>
            </Card>
          )}

          {!loading && result && (
            <Card className="overflow-hidden rounded-2xl border-2 border-emerald-300 bg-white shadow-xl animate-in zoom-in-95 duration-200">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-[#1b351e] via-[#315b36] to-[#254629] p-5 sm:p-6 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-emerald-300">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        {result.status === 'VALID' ? 'Authentic & Verified' : 'Revoked'}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black tracking-tight text-white mt-0.5">
                      {result.studentName}
                    </h3>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200/80">Certificate ID</span>
                  <div className="font-mono text-sm sm:text-base font-bold text-white tracking-wider">
                    {result.certificateCode}
                  </div>
                </div>
              </div>

              {/* Certificate Details Grid */}
              <div className="p-5 sm:p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Course Title */}
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#eff4ec]/60 border border-[#e2ebe2]">
                    <BookOpen className="h-5 w-5 text-[#315b36] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#5a5e63] tracking-wider">Course Syllabus</p>
                      <p className="text-xs sm:text-sm font-bold text-[#2e3339] line-clamp-2">
                        {result.courseTitle}
                      </p>
                    </div>
                  </div>

                  {/* Level Completed */}
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#eff4ec]/60 border border-[#e2ebe2]">
                    <GraduationCap className="h-5 w-5 text-[#315b36] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#5a5e63] tracking-wider">CEFR Level Achieved</p>
                      <p className="text-xs sm:text-sm font-bold text-[#315b36]">
                        CEFR {result.levelCompleted} Proficiency
                      </p>
                    </div>
                  </div>

                  {/* Final Grade */}
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#eff4ec]/60 border border-[#e2ebe2]">
                    <Sparkles className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#5a5e63] tracking-wider">Academic Grade</p>
                      <p className="text-xs sm:text-sm font-bold text-[#2e3339]">
                        {result.finalGrade}% Honors Distinction
                      </p>
                    </div>
                  </div>

                  {/* Issue Date */}
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#eff4ec]/60 border border-[#e2ebe2]">
                    <Calendar className="h-5 w-5 text-[#315b36] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#5a5e63] tracking-wider">Date Awarded</p>
                      <p className="text-xs sm:text-sm font-bold text-[#2e3339]">
                        {new Date(result.issueDate).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Instructor */}
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#eff4ec]/60 border border-[#e2ebe2]">
                    <User className="h-5 w-5 text-[#315b36] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#5a5e63] tracking-wider">Certified Faculty</p>
                      <p className="text-xs sm:text-sm font-bold text-[#2e3339]">
                        {result.instructorName}
                      </p>
                    </div>
                  </div>

                  {/* Issuer */}
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#eff4ec]/60 border border-[#e2ebe2]">
                    <Building2 className="h-5 w-5 text-[#315b36] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#5a5e63] tracking-wider">Accreditation Body</p>
                      <p className="text-xs sm:text-sm font-bold text-[#2e3339]">
                        {result.issuedBy}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#e2ebe2]">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className="border-[#e2ebe2] text-[#2e3339] hover:bg-[#eff4ec] text-xs h-8 gap-1.5"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? 'Link Copied' : 'Copy Verification Link'}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleReset}
                      className="text-[#5a5e63] hover:text-[#2e3339] text-xs h-8"
                    >
                      Verify Another
                    </Button>
                  </div>

                  <Link href={`/verify/certificate/${result.certificateCode}`} target="_blank">
                    <Button
                      size="sm"
                      className="bg-[#315b36] hover:bg-[#254629] text-white font-bold text-xs h-8 gap-1.5 shadow-sm"
                    >
                      <span>Full Public Credential View</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {!hasSearched && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-white/70 border border-[#e2ebe2] space-y-1">
                <ShieldCheck className="h-4 w-4 text-[#315b36] mx-auto" />
                <p className="text-[11px] font-bold text-[#2e3339]">Tamper-Proof Registry</p>
                <p className="text-[10px] text-[#5a5e63]">Direct database verification prevents forged credentials</p>
              </div>
              <div className="p-3 rounded-xl bg-white/70 border border-[#e2ebe2] space-y-1">
                <GraduationCap className="h-4 w-4 text-[#315b36] mx-auto" />
                <p className="text-[11px] font-bold text-[#2e3339]">CEFR Framework</p>
                <p className="text-[10px] text-[#5a5e63]">Standardized international English levels A1 through C2</p>
              </div>
              <div className="p-3 rounded-xl bg-white/70 border border-[#e2ebe2] space-y-1">
                <Building2 className="h-4 w-4 text-[#315b36] mx-auto" />
                <p className="text-[11px] font-bold text-[#2e3339]">Employer Accepted</p>
                <p className="text-[10px] text-[#5a5e63]">Instant verification for recruiters and academic institutions</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
