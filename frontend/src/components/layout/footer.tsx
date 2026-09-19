import React from 'react';
import Link from 'next/link';
import { BookOpen, Globe, Award, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand Col */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="LinguaChris Academy Logo"
                className="h-9 w-auto object-contain"
              />
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Lingua<span className="text-[#0f3d6a]">Chris</span> Academy
              </span>
            </Link>
            <p className="mt-4 text-sm text-slate-600 max-w-sm">
              Empowering learners worldwide with structured CEFR English curriculum, interactive multi-skill practice, and verified certifications.
            </p>
            <div className="mt-6 flex gap-4 text-slate-400">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                <Globe className="h-4 w-4 text-sky-500" /> CEFR Certified
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                <Award className="h-4 w-4 text-sky-500" /> Verifiable Diplomas
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                <ShieldCheck className="h-4 w-4 text-sky-500" /> Secure Payments
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Platform
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
              <li>
                <Link href="/about" className="hover:text-sky-600">About Us</Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-sky-600">Explore Courses</Link>
              </li>
              <li>
                <Link href="/quiz" className="hover:text-sky-600">Diagnostic Quiz</Link>
              </li>
              <li>
                <Link href="/levels" className="hover:text-sky-600">CEFR Levels (Pre-A1 to C2)</Link>
              </li>
            </ul>
          </div>

          {/* Specializations */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Specialties
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
              <li>Business & Workplace English</li>
              <li>English for IT Professionals</li>
              <li>Interview & Career Fluency</li>
              <li>Grammar & Pronunciation Lab</li>
              <li>English for Rwanda Initiative</li>
            </ul>
          </div>

          {/* Contact / Portal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Portals
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
              <li>
                <Link href="/register?role=TEACHER" className="hover:text-[#0f3d6a]">Become a Teacher</Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#0f3d6a]">Student Sign In</Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#0f3d6a]">Teacher Sign In</Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#0f3d6a]">About Our Methodology</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-200 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} LinguaChris Academy. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
            <Link href="/security" className="hover:underline">Security Standards</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
