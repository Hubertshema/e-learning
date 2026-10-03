'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  XCircle,
  ShieldCheck,
  Download,
  Copy,
  Check,
  Lock,
  Unlock,
  Mail
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface PublicCertificateData {
  certificateCode: string;
  studentName: string;
  courseTitle: string;
  levelCompleted?: string;
  finalGrade?: number;
  issueDate?: string;
  instructorName?: string;
  status: 'VALID' | 'REVOKED';
  isValid: boolean;
  issuedBy?: string;
  maskedEmail?: string;
}

export default function PublicCertificateVerificationPage() {
  const params = useParams();
  const code = params.code as string;

  const [cert, setCert] = useState<PublicCertificateData | null>(null);
  const [fullCert, setFullCert] = useState<PublicCertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [otpStep, setOtpStep] = useState<'IDLE' | 'SENT' | 'VERIFIED'>('IDLE');
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToastMessage({ type, msg });
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<PublicCertificateData>(`/public/certificates/${code}`);
        if (res) {
          const payload = (res as any).data || res;
          setCert(payload);
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

  const handleRequestOtp = async () => {
    try {
      setOtpLoading(true);
      await apiClient.post(`/public/certificates/${code}/request-otp`);
      setOtpStep('SENT');
      showToast('success', "OTP sent to the certificate owner's email.");
    } catch (err: any) {
      showToast('error', err.message || 'Failed to send OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return showToast('error', 'Please enter the OTP.');
    try {
      setOtpLoading(true);
      const res = await apiClient.post(`/public/certificates/${code}/verify-otp`, { otp });
      const payload = (res as any).data || res;
      setFullCert(payload);
      setOtpStep('VERIFIED');
      showToast('success', 'Certificate unlocked successfully.');
    } catch (err: any) {
      showToast('error', err.message || 'Invalid OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 dark:bg-slate-950 flex flex-col items-center justify-center">
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg border text-sm font-bold animate-in slide-in-from-top-2 ${toastMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {toastMessage.msg}
        </div>
      )}
      {/* Brand Header */}
      <div className="mb-8 text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <img src="/logo.png" alt="FluentEdge Academy" className="h-10 w-auto object-contain" />
          <span className="text-xl font-bold text-[#172033]">FluentEdge Academy</span>
        </Link>
        <p className="text-xs text-[#667085] uppercase tracking-widest font-semibold">
          Official Public Credential Verification Portal
        </p>
      </div>

      {loading ? (
        <Card className="w-full max-w-lg p-12 text-center shadow-xl border-[#E2E8F0]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#006EF3] border-t-transparent mx-auto mb-3" />
          <p className="text-xs font-semibold text-[#667085]">
            Verifying credential authenticity against registry...
          </p>
        </Card>
      ) : error || !cert ? (
        <Card className="w-full max-w-lg p-8 text-center space-y-4 shadow-xl border-rose-200">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100">
            <XCircle className="h-8 w-8 text-rose-600" />
          </div>
          <div>
            <Badge variant="destructive">Verification Failed</Badge>
            <h2 className="text-lg font-bold text-[#172033] mt-2">
              Invalid or Unregistered Certificate
            </h2>
            <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
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
        <div className="w-full max-w-2xl space-y-6">
          {/* Status Alert Banner */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-[#F3F7FC] border border-[#E2E8F0] text-[#012970] shadow-sm gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3 flex-col sm:flex-row">
              <ShieldCheck className="h-8 w-8 text-[#006EF3] shrink-0" />
              <div>
                <span className="text-sm font-bold block text-[#012970]">Official Authenticated Credential</span>
                <span className="text-xs text-[#667085]">
                  Verified by Registry • Code: <strong className="text-[#012970]">{cert.certificateCode}</strong>
                </span>
                <div className="text-xs text-[#667085] mt-1">
                  Owner: <strong>{cert.studentName}</strong> • Course: <strong>{cert.courseTitle}</strong>
                </div>
              </div>
            </div>
            <Badge variant="primary" className="px-3 py-1 font-bold bg-[#012970] text-white">
              Active & Valid
            </Badge>
          </div>

          {otpStep !== 'VERIFIED' ? (
            <Card className="w-full p-8 text-center space-y-6 shadow-xl border-[#E2E8F0]">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <Lock className="h-8 w-8 text-slate-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#172033]">Certificate Download Locked</h3>
                <p className="text-sm text-[#667085] mt-2 max-w-md mx-auto">
                  To view and download the full certificate, we need to verify your identity. An OTP will be sent to the certificate owner's registered email ({cert.maskedEmail}).
                </p>
              </div>

              {otpStep === 'IDLE' ? (
                <Button 
                  onClick={handleRequestOtp} 
                  disabled={otpLoading}
                  className="bg-[#006EF3] hover:bg-[#005AD3] text-white"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {otpLoading ? 'Sending OTP...' : 'Send OTP to Owner'}
                </Button>
              ) : (
                <form onSubmit={handleVerifyOtp} className="max-w-xs mx-auto space-y-4">
                  <div className="space-y-2 text-left">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Enter OTP</label>
                    <Input 
                      type="text" 
                      placeholder="e.g. 123456" 
                      value={otp} 
                      onChange={e => setOtp(e.target.value)}
                      className="text-center font-mono tracking-widest text-lg"
                      maxLength={6}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-[#006EF3] hover:bg-[#005AD3] text-white"
                    disabled={otpLoading || !otp}
                  >
                    <Unlock className="w-4 h-4 mr-2" />
                    {otpLoading ? 'Verifying...' : 'Verify OTP & Unlock'}
                  </Button>
                </form>
              )}
            </Card>
          ) : (
            <>
              {/* Certificate Credential Card — Navy/Gold design */}
              {fullCert && (
                <div className="rounded-2xl overflow-hidden shadow-2xl">
                  {/* Landscape certificate */}
                  <div
                    className="relative w-full bg-white overflow-hidden"
                    style={{ aspectRatio: '1.414 / 1', fontFamily: 'Georgia, serif' }}
                  >
                    {/* Navy + Gold decorative swoosh */}
                    <svg
                      className="absolute top-0 right-0 h-full w-[40%] md:w-auto"
                      viewBox="0 0 420 300"
                      preserveAspectRatio="xMaxYMin slice"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M420 0 L420 300 L260 300 Q360 200 300 80 Q370 40 420 0Z" fill="#F5B400" opacity="0.9" />
                      <path d="M420 0 L420 300 L300 300 Q380 180 330 60 Q390 30 420 0Z" fill="#012970" />
                    </svg>

                    {/* Corner brackets */}
                    <div className="absolute top-4 left-4 md:top-6 md:left-6 w-8 h-8 md:w-10 md:h-10 border-t-2 border-l-2 border-[#012970]" />
                    <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 w-8 h-8 md:w-10 md:h-10 border-b-2 border-l-2 border-[#012970]" />

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-10 pr-[38%]">
                      <div>
                        <p className="text-[9px] md:text-[11px] font-bold tracking-[0.25em] text-[#012970] uppercase mb-0.5" style={{ fontFamily: 'sans-serif' }}>FluentEdge Academy</p>
                        <h1 className="text-xl md:text-3xl font-black tracking-[0.15em] text-[#012970] uppercase leading-none">Certificate</h1>
                        <p className="text-[9px] md:text-[11px] tracking-[0.3em] text-[#006EF3] uppercase font-bold mt-1" style={{ fontFamily: 'sans-serif' }}>of Achievement</p>
                      </div>
                      <div className="-mt-2">
                        <p className="text-xl md:text-3xl text-[#172033]" style={{ fontFamily: "'Brush Script MT', cursive, Georgia, serif" }}>{fullCert.studentName}</p>
                        <div className="h-px w-3/4 bg-slate-300 mt-1" />
                      </div>
                      <p className="text-[8px] md:text-[10px] text-[#667085] leading-relaxed max-w-[85%]" style={{ fontFamily: 'sans-serif' }}>
                        This is to certify that the above named has successfully completed all required modules and assessments for{' '}
                        <strong className="text-[#172033]">{fullCert.courseTitle}</strong> at FluentEdge Academy.
                      </p>
                      <div className="flex gap-4 md:gap-10 items-end">
                        <div>
                          <p className="text-[7px] md:text-[9px] font-black tracking-[0.2em] text-[#012970] uppercase mb-1" style={{ fontFamily: 'sans-serif' }}>Date</p>
                          <p className="text-[9px] md:text-[11px] text-[#172033] font-medium" style={{ fontFamily: 'sans-serif' }}>
                            {fullCert.issueDate ? new Date(fullCert.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                          </p>
                        </div>
                        <div>
                          <p className="text-[7px] md:text-[9px] font-black tracking-[0.2em] text-[#012970] uppercase mb-1" style={{ fontFamily: 'sans-serif' }}>Instructor</p>
                          <p className="text-sm md:text-[18px] text-[#172033]" style={{ fontFamily: "'Brush Script MT', cursive" }}>{fullCert.instructorName}</p>
                          <div className="h-px w-16 md:w-24 bg-slate-400 mt-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* Gold seal */}
                    <div className="absolute bottom-6 md:bottom-8 right-[4%] md:right-[6%]">
                      <svg viewBox="0 0 64 64" className="w-12 h-12 md:w-16 md:h-16">
                        <defs><path id="vcircle" d="M 32,32 m -22,0 a 22,22 0 1,1 44,0 a 22,22 0 1,1 -44,0" /></defs>
                        <circle cx="32" cy="32" r="30" fill="#F5B400" stroke="#dba100" strokeWidth="1.5" />
                        <circle cx="32" cy="32" r="22" fill="#ffc83b" stroke="#F5B400" strokeWidth="1" />
                        <circle cx="32" cy="32" r="14" fill="#F5B400" />
                        <circle cx="32" cy="32" r="9" fill="#dba100" />
                        <circle cx="32" cy="32" r="5" fill="#F5B400" />
                        <text fontSize="5" fill="#012970" fontWeight="bold" letterSpacing="1.5" style={{ fontFamily: 'sans-serif' }}>
                          <textPath href="#vcircle">certificate of achievement • • •</textPath>
                        </text>
                      </svg>
                    </div>

                    {/* Code */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-full text-center">
                      <p className="text-[6px] md:text-[8px] text-slate-400 font-mono tracking-wider">{fullCert.certificateCode}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Social Share & Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <Button size="sm" variant="outline" onClick={handleCopyLink} className="text-xs">
                  {copied ? <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
                  {copied ? 'Verification Link Copied!' : 'Copy Verification Link'}
                </Button>
                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  <Button size="sm" onClick={() => window.print()} className="w-full sm:w-auto text-xs bg-[#006EF3] hover:bg-[#005AD3] text-white">
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Print / Download Credential
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
