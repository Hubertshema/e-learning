'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Award,
  Download,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Certificate {
  id: string;
  certificateCode: string;
  levelCompleted: string;
  finalGrade: number;
  issueDate: string;
  course: {
    title: string;
    level: string;
    teacher: {
      user: {
        firstName: string;
        lastName: string;
      };
    };
  };
}

export default function StudentCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<Certificate[]>('/student/certificates');
        if (res.data) {
          setCertificates(res.data);
        }
      } catch (err) {
        console.error('Failed to load certificates', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">Accreditation & Credentials</Badge>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            My English Proficiency Certificates
          </h1>
          <p className="text-xs text-slate-500">
            Official verifiable CEFR credentials awarded upon 100% course syllabus completion.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-24 text-center text-xs text-slate-400">Loading your credentials...</div>
        ) : certificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.map((cert) => (
              <Card key={cert.id} className="p-6 border-l-4 border-l-emerald-500 flex flex-col justify-between space-y-4 shadow-md">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="success">Verified Credential</Badge>
                    <span className="font-mono text-xs text-slate-500 font-bold">{cert.certificateCode}</span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
                    {cert.course.title}
                  </h3>

                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-300">
                    <span>Level: <strong>{cert.levelCompleted}</strong></span>
                    <span>Final Grade: <strong>{cert.finalGrade}%</strong></span>
                    <span>Issued: <strong>{new Date(cert.issueDate).toLocaleDateString()}</strong></span>
                  </div>

                  <p className="text-xs text-slate-500 mt-2">
                    Certified by Instructor {cert.course.teacher.user.firstName} {cert.course.teacher.user.lastName}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    Publicly Verifiable
                  </span>
                  <Button
                    size="sm"
                    variant="gradient"
                    onClick={() => setSelectedCert(cert)}
                    className="text-xs"
                  >
                    <Award className="mr-1.5 h-3.5 w-3.5" />
                    View Certificate
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Award className="mx-auto h-12 w-12 text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No certificates earned yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Complete all units, assignments, and quizzes in an enrolled course to receive your official CEFR certificate.
            </p>
            <Link href="/student/courses">
              <Button size="sm" variant="gradient">
                <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                Continue Learning
              </Button>
            </Link>
          </Card>
        )}
      </div>

      {/* Certificate Modal View */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-2xl shadow-2xl p-8 bg-[#F4F7F4] border-4 border-[#3B6748]/40 dark:bg-emerald-950/40">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-2xl bg-amber-100 flex items-center justify-center border-2 border-amber-300 dark:bg-amber-950">
                  <Award className="h-8 w-8 text-amber-600" />
                </div>
              </div>

              <div>
                <span className="text-xs uppercase tracking-widest font-black text-amber-600">
                  FluentEdge Academy • Certificate of Completion
                </span>
                <h2 className="text-2xl font-serif font-black text-slate-900 dark:text-white mt-1">
                  CEFR English Proficiency Award
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  This certifies that the candidate has successfully completed all required modules for
                </p>
                <h3 className="text-lg font-bold text-primary-700 dark:text-primary-300 mt-1">
                  {selectedCert.course.title} ({selectedCert.levelCompleted})
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Final Grade</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedCert.finalGrade}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Issue Date</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {new Date(selectedCert.issueDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Verification Code</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {selectedCert.certificateCode}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button size="sm" variant="outline" onClick={() => setSelectedCert(null)}>
                  Close
                </Button>
                <Button
                  size="sm"
                  variant="gradient"
                  onClick={() => window.print()}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Print / Save PDF
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
