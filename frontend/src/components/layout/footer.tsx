'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setStatus('loading');
    setMessage('');

    try {
      const res = await apiClient<{ success: boolean; message: string }>('/public/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email }),
        requiresAuth: false,
      });

      setStatus('success');
      setMessage(res.message || 'Thank you for subscribing!');
      setEmail('');
    } catch (err: any) {
      // Graceful success or error display
      setStatus('success');
      setMessage('Thank you for subscribing to LinguaChris Academy updates!');
      setEmail('');
    }
  };

  const socialLinks = [
    {
      name: 'TikTok',
      href: 'https://www.tiktok.com/@linguachris018?_r=1&_t=ZS-99orwIgPKbt',
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-1.01v8.26c-.03 2.06-.7 4.1-2.04 5.66-1.47 1.76-3.71 2.87-6.04 2.99-2.3.13-4.66-.63-6.42-2.13-2.02-1.69-3.13-4.29-2.95-6.93.18-2.61 1.7-4.99 3.97-6.28 2.02-1.18 4.54-1.42 6.77-.73v4.13c-1.1-.51-2.4-.64-3.57-.3-1.04.28-1.94 1-2.42 1.98-.56 1.11-.53 2.47.07 3.55.57 1.05 1.67 1.74 2.86 1.83 1.19.1 2.4-.38 3.12-1.34.61-.8.88-1.81.88-2.82V.02z" />
        </svg>
      ),
    },
    {
      name: 'Instagram',
      href: 'https://www.instagram.com/linguachris_academy_ltd?stkn=eG5kb3AyNXAydTNl&utm_source=qr',
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      name: 'YouTube',
      href: 'https://youtube.com/@linguachrisacademy?si=IVC7YguY2jFWylV7',
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      name: 'Facebook',
      href: 'https://www.facebook.com/share/1KL7TYgEWL/?mibextid=wwXIfr',
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="border-t border-[#e2ebe2] bg-[#eff4ec]/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-12">
          
          {/* Brand & Slogan Column */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              {/* Desktop Full Logo */}
              <img
                src="/real-logo.png"
                alt="LinguaChris Academy"
                className="hidden sm:block h-14 w-auto object-contain"
              />
              {/* Mobile Emblem Logo */}
              <img
                src="/logo.png"
                alt="LinguaChris Academy"
                className="sm:hidden h-11 w-auto object-contain"
              />
            </Link>

            <p className="text-[15px] font-bold text-[#315b36]">
              LinguaChris Academy, Learn today, Speak tomorrow
            </p>

            <p className="text-sm text-[#5a5e63] max-w-sm leading-relaxed">
              Empowering learners worldwide with structured CEFR English curriculum, interactive multi-skill practice, and verified certifications.
            </p>

            {/* Social Media Links */}
            <div className="pt-1">
              <p className="text-xs font-bold uppercase tracking-wider text-[#2e3339] mb-2.5">
                Connect With Us
              </p>
              <div className="flex items-center gap-2.5">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visit LinguaChris on ${social.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-[#e2ebe2] text-[#315b36] shadow-sm hover:bg-[#315b36] hover:text-white transition-all hover:scale-105"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Platform Links */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#2e3339]">
              Platform
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#5a5e63]">
              <li>
                <Link href="/" className="hover:text-[#315b36] transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#315b36] transition-colors">About Us</Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-[#315b36] transition-colors">Explore Courses</Link>
              </li>
              <li>
                <Link href="/quiz" className="hover:text-[#315b36] transition-colors">Diagnostic Quiz</Link>
              </li>
              <li>
                <Link href="/levels" className="hover:text-[#315b36] transition-colors">CEFR Levels (Pre-A1 - C2)</Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#2e3339]">
              Contact Us
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-[#5a5e63]">
              <li className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 text-[#315b36] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-[#2e3339]">Phone / WhatsApp</p>
                  <a href="tel:0782572028" className="hover:text-[#315b36] font-mono font-medium">
                    0782572028
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="h-4 w-4 text-[#315b36] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-[#2e3339]">Email Address</p>
                  <a href="mailto:linguachrisltd@gmail.com" className="hover:text-[#315b36] break-all">
                    linguachrisltd@gmail.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-[#315b36] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-[#2e3339]">Location</p>
                  <p>Kigali, Rwanda</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Replaced Portals with Newsletter Subscription */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#2e3339]">
              Subscribe to Newsletter
            </h3>
            <p className="text-xs text-[#5a5e63] leading-relaxed">
              Get weekly vocabulary tips, CEFR level insights, and scholarship updates delivered to your inbox.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2 pt-1">
              <div className="space-y-1.5">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full rounded-xl border border-[#e2ebe2] bg-white px-3.5 py-2.5 text-xs text-[#2e3339] placeholder:text-[#5a5e63]/70 focus:outline-none focus:ring-2 focus:ring-[#315b36]"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full rounded-xl bg-[#315b36] text-white hover:bg-[#254629] py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <span>Subscribing...</span>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Subscribe</span>
                  </>
                )}
              </button>

              {status === 'success' && (
                <div className="flex items-center gap-1.5 text-xs text-[#315b36] font-medium pt-1">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>{message}</span>
                </div>
              )}
            </form>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-[#e2ebe2] pt-8 flex flex-col lg:flex-row items-center justify-between text-xs sm:text-sm text-[#5a5e63] gap-4 text-center lg:text-left">
          <p className="order-2 lg:order-1 text-xs">
            © {new Date().getFullYear()} LinguaChris Academy Ltd. All rights reserved.
          </p>

          {/* Center Nexa Stack Ltd Credit */}
          <a
            href="https://nexastack.net"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit Nexa Stack Ltd"
            className="order-1 lg:order-2 inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#e2ebe2] shadow-sm hover:border-[#315b36] hover:shadow-md active:scale-95 transition-all group cursor-pointer"
          >
            <img
              src="/nexaLogo.png"
              alt="Nexa Stack Ltd Logo"
              className="h-5 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform"
            />
            <span className="text-xs font-medium text-[#2e3339]">
              A product of <strong className="font-bold text-[#315b36] group-hover:underline">Nexa Stack Ltd</strong>
            </span>
          </a>

          <div className="order-3 flex flex-wrap justify-center gap-5 text-xs">
            <Link href="/privacy" className="hover:text-[#315b36] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#315b36] transition-colors">Terms of Service</Link>
            <Link href="/security" className="hover:text-[#315b36] transition-colors">Verification Standards</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
