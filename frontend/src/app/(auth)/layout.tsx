import React from 'react';
import Link from 'next/link';
import { CheckCircle, Star } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#E2E5E9] dark:bg-[#0F172A] h-screen max-h-screen overflow-hidden flex items-center justify-center p-3 sm:p-4 md:p-6 antialiased selection:bg-[#315B36] selection:text-white transition-colors duration-200">
      <div className="relative w-full max-w-[1000px] max-h-[96vh] bg-white dark:bg-slate-900 rounded-[2rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side */}
        <div className="relative w-full md:w-[45%] bg-[#132519] text-white p-6 md:p-8 flex flex-col justify-between overflow-hidden z-10">
          
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

          <div className="relative z-10 max-w-md space-y-3 my-auto py-3">
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

          <div className="hidden md:block absolute -right-1 top-0 bottom-0 w-24 pointer-events-none select-none z-20 overflow-hidden">
            <svg className="absolute inset-y-0 right-0 h-full w-24 text-[#315B36]/40 fill-current" preserveAspectRatio="none" viewBox="0 0 100 600">
              <path d="M0,0 Q35,50 15,100 Q-5,150 25,200 Q55,250 20,300 Q-15,350 25,400 Q65,450 15,500 Q-35,550 20,600 L100,600 L100,0 Z"></path>
            </svg>
            <svg className="absolute inset-y-0 right-0 h-full w-20 text-[#7BA27A]/20 fill-current" preserveAspectRatio="none" viewBox="0 0 100 600">
              <path d="M10,0 Q50,45 25,95 Q0,145 35,195 Q70,245 30,295 Q-10,345 35,395 Q80,445 25,495 Q-30,545 30,600 L100,600 L100,0 Z"></path>
            </svg>
            <svg className="absolute inset-y-0 right-0 h-full w-14 text-white dark:text-slate-900 fill-current" preserveAspectRatio="none" viewBox="0 0 100 600">
              <path d="M30,0 Q70,40 45,90 Q20,140 55,190 Q90,240 50,290 Q10,340 55,390 Q100,440 45,490 Q-10,540 50,600 L100,600 L100,0 Z"></path>
            </svg>
          </div>
          
          <div className="block md:hidden absolute left-0 right-0 -bottom-1 h-10 pointer-events-none select-none overflow-hidden z-20">
            <svg className="w-full h-full text-white dark:text-slate-900 fill-current" preserveAspectRatio="none" viewBox="0 0 400 50">
              <path d="M0,50 Q50,15 100,35 Q150,5 200,30 Q250,10 300,35 Q350,15 400,45 L400,50 L0,50 Z"></path>
            </svg>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex-1 bg-white dark:bg-slate-900 p-6 sm:p-8 lg:p-10 flex flex-col justify-center relative z-10 transition-colors duration-200">
          <div className="max-w-[380px] w-full mx-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
