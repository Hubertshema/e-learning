import React from 'react';
import Link from 'next/link';
import { BookOpen, CheckCircle, ShieldCheck, Sparkles, Star } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      {/* Left decorative brand side */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-[#132519] p-8 lg:p-10 text-white lg:flex overflow-hidden">
        <div className="absolute inset-0 bg-[#132519]" />

        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center bg-white px-4 py-2.5 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-98"
          >
            <img
              src="/real-logo.png"
              alt="LinguaChris Academy"
              className="h-9 w-auto object-contain"
            />
          </Link>
        </div>

        <div className="relative z-10 max-w-md space-y-4 my-auto">
          <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#7BA27A] bg-[#315B36]/40 rounded-full border border-[#7BA27A]/30">
            Certified CEFR Learning
          </span>
          <h1 className="text-2xl xl:text-3xl font-extrabold leading-snug tracking-tight text-white">
            Empowering your career and communication through certified language mastery.
          </h1>

          <div className="space-y-2.5 text-xs xl:text-sm text-slate-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>International CEFR standard levels from Starter (Pre-A1) to C2</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Interactive lessons in Grammar, Speaking, Listening & Vocabulary</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Direct teacher feedback and verifiable digital credentials</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-2 border-t border-slate-800/80 pt-3.5 text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <span>Trusted by thousands of students & instructors</span>
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="h-3.5 w-3.5 fill-current" />
              <Star className="h-3.5 w-3.5 fill-current" />
              <Star className="h-3.5 w-3.5 fill-current" />
              <Star className="h-3.5 w-3.5 fill-current" />
              <Star className="h-3.5 w-3.5 fill-current" />
              <span className="ml-1 font-bold text-white">4.9/5</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-0.5 text-[11px] text-slate-500">
            <a
              href="https://nexastack.net"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
            >
              <img
                src="/nexaLogo.png"
                alt="Nexa Stack Ltd"
                className="h-3.5 w-auto object-contain brightness-125"
              />
              <span>
                POWERED BY <strong className="text-slate-300 font-bold">NEXASTACK Ltd</strong>
              </span>
            </a>
            <span className="text-[10.5px] text-slate-500">Official CEFR Platform</span>
          </div>
        </div>
      </div>

      {/* Right form side */}
      <div className="flex h-full w-full items-center justify-center p-4 sm:p-6 lg:w-1/2 overflow-y-auto lg:overflow-hidden">
        <div className="w-full max-w-md my-auto">{children}</div>
      </div>
    </div>
  );
}
