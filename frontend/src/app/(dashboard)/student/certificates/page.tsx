'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, BookOpen, ShieldCheck, Download, ExternalLink, Mail, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useCachedData } from '@/lib/cache';
import { CardGridSkeleton } from '@/components/ui/card-grid-skeleton';
import { useAuth } from '@/contexts/auth-context';

interface Certificate {
  id: string;
  certificateCode: string;
  levelCompleted: string;
  finalGrade: number;
  issueDate: string;
  studentName?: string;
  course: {
    title: string;
    level: string;
    teacher: {
      user: { firstName: string; lastName: string };
    };
  };
  user?: { firstName: string; lastName: string };
}

function formatRecipientName(raw?: string | null): string {
  if (!raw) return '';
  return raw
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

// ─── LinguaChris Academy Certificate Document ────────────────────────────────

function CertificateDocument({
  cert,
  scale = 1,
  fallbackStudentName,
}: {
  cert: Certificate;
  scale?: number;
  fallbackStudentName?: string;
}) {
  const rawName =
    cert.studentName ||
    (cert.user?.firstName ? `${cert.user.firstName} ${cert.user.lastName || ''}`.trim() : null) ||
    fallbackStudentName ||
    'Student';

  const studentName = formatRecipientName(rawName) || 'Student';
  const issueDate = new Date(cert.issueDate).toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).replace(/\//g, ' / ');
  const instructorName = `${cert.course.teacher.user.firstName}`;
  const courseTitle = cert.course.title;
  const grade = `${cert.finalGrade}%`;
  const certCode = cert.certificateCode;

  const s = {
    certificate: {
      position: 'relative' as const,
      width: 900,
      height: 600,
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #fffefa 0%, #fffdf7 60%, #f8f3e8 100%)',
      boxShadow: '0 35px 80px rgba(0,25,55,.24), 0 10px 25px rgba(0,0,0,.12)',
      fontFamily: '"DM Sans", sans-serif',
    },
    outerBorder: {
      position: 'absolute' as const,
      inset: 20,
      border: '1px solid rgba(16,80,100,.65)',
      pointerEvents: 'none' as const,
      zIndex: 30,
    },
    innerBorder: {
      position: 'absolute' as const,
      inset: 32,
      border: '1px solid rgba(1,41,112,.12)',
      pointerEvents: 'none' as const,
      zIndex: 30,
    },
    navyPanel: {
      position: 'absolute' as const,
      right: -150,
      top: -110,
      width: 460,
      height: 800,
      background: 'linear-gradient(145deg, #006EF3 0%, #012970 42%, #011438 100%)',
      transform: 'rotate(8deg)',
      zIndex: 1,
    },
    goldRibbon: {
      position: 'absolute' as const,
      right: 228,
      top: -80,
      width: 88,
      height: 800,
      background: 'linear-gradient(90deg, #c49000 0%, #F5B400 28%, #fedb66 50%, #F5B400 72%, #c49000 100%)',
      transform: 'rotate(-10deg)',
      zIndex: 3,
      boxShadow: '8px 0 20px rgba(0,0,0,.08)',
    },
    arc: {
      position: 'absolute' as const,
      left: -190,
      bottom: -390,
      width: 720,
      height: 530,
      borderRadius: '50%',
      borderTop: '2px solid rgba(0,110,243,.25)',
      zIndex: 4,
    },
    pattern: {
      position: 'absolute' as const,
      left: 0,
      top: 0,
      width: 540,
      height: '100%',
      opacity: 0.025,
      backgroundImage: 'linear-gradient(45deg,#012970 25%,transparent 25%),linear-gradient(-45deg,#012970 25%,transparent 25%)',
      backgroundSize: '30px 30px',
      zIndex: 2,
    },
  };

  return (
    <div style={{ ...s.certificate, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Great+Vibes&display=swap');`}</style>

      {/* Backgrounds */}
      <div style={s.pattern} />
      <div style={s.navyPanel} />
      <div style={s.goldRibbon} />
      <div style={s.arc} />

      {/* Borders */}
      <div style={s.outerBorder} />
      <div style={s.innerBorder} />

      {/* Corners */}
      {(['tl','tr','bl','br'] as const).map((pos) => {
        const corner: React.CSSProperties = {
          position: 'absolute', width: 75, height: 75, zIndex: 31,
          ...(pos === 'tl' ? { left: 43, top: 43 } : {}),
          ...(pos === 'tr' ? { right: 43, top: 43 } : {}),
          ...(pos === 'bl' ? { left: 43, bottom: 43 } : {}),
          ...(pos === 'br' ? { right: 43, bottom: 43 } : {}),
        };
        return (
          <div key={pos} style={corner}>
            <div style={{ position: 'absolute', width: '100%', height: 1, background: '#F5B400',
              ...(pos === 'tr' || pos === 'br' ? { transformOrigin: 'right', transform: 'rotate(90deg) translateX(100%)' } : {}),
              ...(pos === 'bl' ? { top: 'auto', bottom: 0, transform: 'rotate(-90deg) translateY(100%)', transformOrigin: 'left' } : {}),
              ...(pos === 'br' ? { bottom: 0, top: 'auto' } : {}),
            }} />
            <div style={{ position: 'absolute', width: 1, height: '100%', background: '#F5B400',
              ...(pos === 'tr' ? { left: 'auto', right: 0 } : {}),
              ...(pos === 'br' ? { left: 'auto', right: 0 } : {}),
            }} />
          </div>
        );
      })}

      {/* Brand */}
      <div style={{ position: 'absolute', top: 50, left: 70, display: 'flex', alignItems: 'center', gap: 10, zIndex: 10 }}>
        <img src="/logo.png" alt="LinguaChris" style={{ width: 38, height: 38, objectFit: 'contain' }} />
        <div style={{ color: '#012970', fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' }}>
          LinguaChris Academy
        </div>
      </div>

      {/* Main Content */}
      <main style={{ position: 'relative', zIndex: 10, width: 540, marginLeft: 70, paddingTop: 100 }}>
        {/* Eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#c49000', fontSize: 8, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase' }}>
          <div style={{ width: 32, height: 1, background: '#F5B400' }} />
          Recognition of Excellence
        </div>

        {/* Title */}
        <h1 style={{ margin: '10px 0 0', color: '#012970', fontFamily: '"Playfair Display", serif', fontSize: 46, fontWeight: 500, letterSpacing: 4, lineHeight: 1 }}>
          CERTIFICATE
        </h1>
        <div style={{ marginTop: 10, color: '#006EF3', fontSize: 10, fontWeight: 600, letterSpacing: 6 }}>
          OF COMPLETION
        </div>

        {/* Recipient */}
        <div style={{ marginTop: 36, color: '#667085', fontSize: 8, letterSpacing: 3, textTransform: 'uppercase' }}>
          This certificate is proudly presented to
        </div>
        <div style={{ marginTop: 2, color: '#172033', fontFamily: '"Great Vibes", cursive', fontSize: 52, lineHeight: 1.15 }}>
          {studentName}
        </div>
        <div style={{ width: 330, height: 1, marginTop: 5, background: 'linear-gradient(90deg, #F5B400, rgba(245,180,0,0))' }} />

        {/* Description */}
        <p style={{ width: 460, marginTop: 14, color: '#667085', fontSize: 10, lineHeight: 1.75, letterSpacing: 0.15 }}>
          This certificate recognizes the successful completion of{' '}
          <strong style={{ color: '#172033' }}>{courseTitle}</strong>, demonstrating
          commitment and achievement of the required learning outcomes.
        </p>

        {/* Info row — no signature */}
        <div style={{ display: 'flex', gap: 60, marginTop: 28 }}>
          <div>
            <div style={{ marginBottom: 7, color: '#c49000', fontSize: 7, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' }}>Final Grade</div>
            <div style={{ color: '#172033', fontSize: 10, fontWeight: 600, letterSpacing: 1.5 }}>{grade}</div>
          </div>
          <div>
            <div style={{ marginBottom: 7, color: '#c49000', fontSize: 7, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' }}>Issue Date</div>
            <div style={{ color: '#172033', fontSize: 10, fontWeight: 600, letterSpacing: 1.5 }}>{issueDate}</div>
          </div>
          <div>
            <div style={{ marginBottom: 7, color: '#c49000', fontSize: 7, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' }}>Level</div>
            <div style={{ color: '#172033', fontSize: 10, fontWeight: 600, letterSpacing: 1.5 }}>{cert.levelCompleted}</div>
          </div>
        </div>
      </main>

      {/* Right panel text */}
      <div style={{ position: 'absolute', right: 56, top: 118, zIndex: 10, width: 145, textAlign: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 7, letterSpacing: 3, textTransform: 'uppercase' }}>CEFR English</div>
        <div style={{ marginTop: 12, color: 'white', fontFamily: '"Playfair Display", serif', fontSize: 19, lineHeight: 1.3 }}>
          Proficiency<br />Award
        </div>
        <div style={{ width: 42, height: 1, margin: '15px auto', background: '#F5B400' }} />
        <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 7.5, lineHeight: 1.7, letterSpacing: 0.5 }}>
          Awarded upon successful completion of all required learning activities and assessments.
        </div>
      </div>

      {/* Seal */}
      <div style={{ position: 'absolute', right: 56, bottom: 70, width: 110, height: 110, zIndex: 15 }}>
        <div style={{
          position: 'absolute', inset: 4, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 25%, #fff6d0 0%, #fcd34d 42%, #c49000 100%)',
          border: '2px solid #fedb66',
          boxShadow: '0 8px 20px rgba(0,0,0,.25), inset 0 0 0 3px rgba(255,255,255,.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ position: 'absolute', inset: 13, borderRadius: '50%', border: '1px dashed rgba(93,66,17,.7)' }} />
          <img src="/logo.png" alt="seal" style={{ width: 36, height: 36, objectFit: 'contain', zIndex: 1, position: 'relative' }} />
        </div>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#74561c', fontSize: 5, fontWeight: 700, letterSpacing: 1.5, textAlign: 'center',
          paddingTop: 90,
        }}>
          LINGUACHRIS • VERIFIED
        </div>
      </div>

      {/* Certificate ID */}
      <div style={{ position: 'absolute', left: 70, bottom: 32, zIndex: 12, color: '#667085', fontSize: 7, letterSpacing: 2 }}>
        CERTIFICATE No. {certCode}
      </div>

      {/* Verification */}
      <div style={{ position: 'absolute', right: 56, bottom: 36, zIndex: 12, color: 'rgba(255,255,255,.55)', fontSize: 6, letterSpacing: 1.5, textTransform: 'uppercase' }}>
        Verify • {certCode}
      </div>
    </div>
  );
}

// ─── Responsive Certificate Preview ──────────────────────────────────────────
function CertificatePreview({
  cert,
  onDownload,
  isDownloading,
  onResendEmail,
  isResending,
  resendStatus,
  fallbackStudentName,
}: {
  cert: Certificate;
  onDownload: () => void;
  isDownloading: boolean;
  onResendEmail?: () => void;
  isResending?: boolean;
  resendStatus?: string;
  fallbackStudentName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(0.38);

  const measureAndScale = useCallback(() => {
    if (containerRef.current) {
      const w = containerRef.current.clientWidth;
      if (w > 0) {
        setScale(w / 900);
      }
    }
  }, []);

  useEffect(() => {
    measureAndScale();
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setScale(w / 900);
        }
      }
    });

    observer.observe(el);
    window.addEventListener('resize', measureAndScale);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measureAndScale);
    };
  }, [measureAndScale]);

  return (
    <div
      className="group cursor-pointer rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col"
      onClick={() => {
        if (!isDownloading) onDownload();
      }}
    >
      {/* Scaled certificate wrapper maintaining exact 900×600 aspect ratio on all devices */}
      <div
        ref={containerRef}
        className="w-full relative overflow-hidden bg-[#fffefa]"
        style={{
          aspectRatio: '900 / 600',
          height: scale > 0 ? `${Math.round(600 * scale)}px` : undefined,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 900,
            height: 600,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            pointerEvents: 'none',
          }}
        >
          <CertificateDocument cert={cert} fallbackStudentName={fallbackStudentName} />
        </div>
      </div>

      {/* Bottom info & action bar */}
      <div className="border-t border-slate-100 dark:border-slate-800 px-3.5 sm:px-4 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2.5 bg-white dark:bg-slate-900 mt-auto">
        <Link
          href={`/verify/certificate/${cert.certificateCode}`}
          target="_blank"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 min-w-0 hover:opacity-80 transition-opacity"
          title="Verify credential online"
        >
          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="text-[11px] sm:text-xs text-slate-500 font-mono truncate max-w-[140px] sm:max-w-[200px]">
            {cert.certificateCode}
          </span>
          <ExternalLink className="h-3 w-3 text-slate-400 shrink-0" />
        </Link>

        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          {onResendEmail && (
            <Button
              size="sm"
              variant="outline"
              disabled={isResending}
              className="text-xs h-8 px-2.5 sm:px-3 gap-1.5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-[#006EF3] hover:border-[#006EF3] font-medium"
              onClick={(e) => {
                e.stopPropagation();
                onResendEmail();
              }}
              title="Send this certificate directly to your email"
            >
              {isResending ? (
                <div className="h-3 w-3 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
              ) : resendStatus ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Mail className="h-3.5 w-3.5 text-[#006EF3]" />
              )}
              <span>{resendStatus || 'Email Me'}</span>
            </Button>
          )}

          <Button
            size="sm"
            disabled={isDownloading}
            className="text-xs h-8 px-3 sm:px-3.5 gap-1.5 bg-[#c79a3b] hover:bg-[#a87521] text-white border-0 shadow-sm transition-all shrink-0 font-medium"
            onClick={(e) => {
              e.stopPropagation();
              if (!isDownloading) onDownload();
            }}
          >
            {isDownloading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Generating…</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                <span>Download PDF</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}


// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudentCertificatesPage() {
  const { user: currentUser } = useAuth();
  const currentUserName = currentUser ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() : '';

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendStatusMap, setResendStatusMap] = useState<Record<string, string>>({});
  const [certToDownload, setCertToDownload] = useState<Certificate | null>(null);
  const downloadRef = useRef<HTMLDivElement>(null);

  const resendCertificateEmail = async (cert: Certificate) => {
    try {
      setResendingId(cert.id);
      await apiClient.post(`/student/certificates/${encodeURIComponent(cert.certificateCode)}/resend-email`);
      setResendStatusMap((prev) => ({ ...prev, [cert.id]: 'Sent to Email!' }));
      setTimeout(() => {
        setResendStatusMap((prev) => {
          const next = { ...prev };
          delete next[cert.id];
          return next;
        });
      }, 4000);
    } catch (err: any) {
      console.error('Failed to resend email', err);
      setResendStatusMap((prev) => ({ ...prev, [cert.id]: 'Failed to send' }));
    } finally {
      setResendingId(null);
    }
  };

  const downloadCertificate = useCallback(async (cert: Certificate) => {
    setDownloadingId(cert.id);
    setCertToDownload(cert);

    // Wait for DOM to render the certificate off-screen
    await new Promise((resolve) => setTimeout(resolve, 80));

    try {
      if (!downloadRef.current) return;
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(downloadRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#fffefa',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      // A4 landscape in mm: 297 x 210
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      const safeName = (cert.course.title || 'certificate').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      pdf.save(`LinguaChris_Certificate_${safeName}.pdf`);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloadingId(null);
      setCertToDownload(null);
    }
  }, []);

  const { data: certificatesData, loading } = useCachedData<Certificate[]>(
    'student_certificates',
    async () => {
      const res = await apiClient.get<any>('/student/certificates');
      return Array.isArray(res) ? res : (res as any)?.data ?? [];
    },
    { ttl: 15000, initialData: [] }
  );

  const certificates = certificatesData || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">Accreditation &amp; Credentials</Badge>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Certificates
          </h1>
          <p className="text-xs text-slate-500">
            Official verifiable credentials awarded upon course completion.
          </p>
        </div>
      </div>

      {/* Certificate grid */}
      <div className="space-y-6">
        {loading ? (
          <CardGridSkeleton count={2} columns="2" />
        ) : certificates.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {certificates.map((cert) => (
              <CertificatePreview
                key={cert.id}
                cert={cert}
                onDownload={() => downloadCertificate(cert)}
                isDownloading={downloadingId === cert.id}
                onResendEmail={() => resendCertificateEmail(cert)}
                isResending={resendingId === cert.id}
                resendStatus={resendStatusMap[cert.id]}
                fallbackStudentName={currentUserName}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
            <Award className="mx-auto h-12 w-12 text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No certificates earned yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Complete all units and checkpoints in an enrolled course to receive your official certificate.
            </p>
            <Link href="/student/my-courses">
              <Button size="sm" variant="gradient">
                <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                Continue Learning
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Hidden offscreen certificate for direct html2canvas rendering */}
      {certToDownload && (
        <div
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            width: 900,
            height: 600,
            overflow: 'hidden',
            zIndex: -100,
            pointerEvents: 'none',
          }}
        >
          <div ref={downloadRef} style={{ width: 900, height: 600 }}>
            <CertificateDocument cert={certToDownload} fallbackStudentName={currentUserName} />
          </div>
        </div>
      )}
    </div>
  );
}
