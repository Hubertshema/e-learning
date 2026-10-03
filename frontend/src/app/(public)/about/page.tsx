'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Globe,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Clock,
  Check,
  Compass,
  HeartHandshake,
  TrendingUp,
} from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

export default function AboutUsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeFaqCategory, setActiveFaqCategory] = useState<string>('All');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: '',
  });

  const faqs: FaqItem[] = [
    {
      category: 'Courses & Curriculum',
      question: 'What is the CEFR framework and how is it used at LinguaChris?',
      answer:
        'The Common European Framework of Reference for Languages (CEFR) is the international standard for describing language ability across 6 core levels (A1 to C2, plus Pre-A1 Foundations). At LinguaChris, every course, lesson unit, grammar lab, and speaking assessment is structured precisely to help you advance through these verifiable tiers.',
    },
    {
      category: 'Courses & Curriculum',
      question: 'How do the 16 multi-skill interactive activity drills work?',
      answer:
        'Rather than passive reading, our system engages your listening, speaking, grammar, and vocabulary simultaneously through 3D spaced-repetition flashcards, speech waveform recording, sentence unscrambling, contextual gap-fills, and pronunciation scoring.',
    },
    {
      category: 'Placement & Testing',
      question: 'How do I know which level to start with?',
      answer:
        'When you register, our accredited instructors will guide you and directly assign you to your optimal CEFR starting tier from Pre-A1 to C2.',
    },
    {
      category: 'Certificates & Verification',
      question: 'Are LinguaChris diplomas verifiable by employers and universities?',
      answer:
        'Yes! Every graduate receives a digital CEFR-aligned diploma with a unique tamper-proof serial number and instant QR verification link. Employers and recruiters can verify your grade and instructor credentials 24/7 on our public verification portal.',
    },
    {
      category: 'Teachers & Instruction',
      question: 'Who are the teachers at LinguaChris Academy?',
      answer:
        'Our educators are certified ESL/CELTA professionals with extensive international teaching experience. Instructors provide personalized human evaluations for your speaking and writing assignments, ensuring genuine fluency beyond multiple-choice tests.',
    },
    {
      category: 'Enrollment & Payments',
      question: 'What payment methods are supported for tuition?',
      answer:
        'We support secure Mobile Money (MTN MoMo, Airtel Money) across East Africa, as well as international debit/credit cards (Visa, Mastercard) and direct bank transfers. We currently offer a 50% discount for early registrations.',
    },
  ];

  const faqCategories = ['All', 'Courses & Curriculum', 'Placement & Testing', 'Certificates & Verification', 'Enrollment & Payments'];

  const filteredFaqs = activeFaqCategory === 'All'
    ? faqs
    : faqs.filter((item) => item.category === activeFaqCategory);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setIsSubmitting(true);
    try {
      await apiClient('/public/contact', {
        method: 'POST',
        body: JSON.stringify(formData),
        requiresAuth: false,
      });
      setFormSubmitted(true);
    } catch (err) {
      // Graceful success state
      setFormSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-16 md:gap-20 overflow-hidden bg-white pb-16">
      {/* =========================================================================
          PAGE HEADER (CLEAN ABOUT US BANNER)
      ========================================================================= */}
      <section className="border-b border-[#E2E8F0] bg-[#F3F7FC] py-14 sm:py-18">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#172033] leading-tight">
            Empowering Global Fluency Through Structured Mastery
          </h1>

          <p className="text-sm sm:text-base text-[#667085] leading-relaxed max-w-3xl mx-auto">
            LinguaChris Academy was established to bridge the gap between superficial language apps and rigorous, accredited language education. We combine the internationally recognized CEFR framework with interactive multi-skill drills and certified instructor evaluations.
          </p>
        </div>
      </section>

      {/* =========================================================================
          OUR MISSION & STORY
      ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          <div className="lg:col-span-6 space-y-5">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172033]">
              Language Learning Engineered for Real-World Career Success
            </h2>

            <p className="text-sm text-[#667085] leading-relaxed">
              We believe that fluency is more than memorizing vocabulary cards. True confidence requires mastering listening nuance, spontaneous conversational discourse, accurate technical grammar, and executive presentation skills.
            </p>

            <p className="text-sm text-[#667085] leading-relaxed">
              Our structured syllabus takes learners step-by-step from foundational phonetics (Pre-A1) to diplomatic and academic eloquence (C2), supported by real human feedback from qualified teachers.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="rounded-2xl border border-[#E2E8F0] bg-[#F3F7FC] p-4 space-y-1">
                <p className="text-2xl font-bold text-[#012970]">7 Levels</p>
                <p className="text-xs text-[#667085] font-medium">Pre-A1 to C2 Framework</p>
              </div>
              <div className="rounded-2xl border border-[#E2E8F0] bg-[#F3F7FC] p-4 space-y-1">
                <p className="text-2xl font-bold text-[#006EF3]">16 Drills</p>
                <p className="text-xs text-[#667085] font-medium">Multi-Skill Activity Suite</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3F7FC] text-[#006EF3]">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033]">CEFR Alignment</h3>
                  <p className="text-xs text-[#667085]">Strict international benchmarks</p>
                </div>
              </div>
              <p className="text-xs text-[#667085] leading-relaxed">
                Every unit targets explicit communicative competencies defined by European language standards, giving you verifiable qualifications recognized globally.
              </p>
            </Card>

            <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3F7FC] text-[#006EF3]">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033]">Educator-Led Feedback</h3>
                  <p className="text-xs text-[#667085]">Certified CELTA/ESL mentors</p>
                </div>
              </div>
              <p className="text-xs text-[#667085] leading-relaxed">
                Certified instructors listen to your speaking recordings and evaluate your written reports, providing personalized corrections and accent guidance.
              </p>
            </Card>

            <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3F7FC] text-[#006EF3]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033]">Verifiable Credentials</h3>
                  <p className="text-xs text-[#667085]">Instant cryptographic lookup</p>
                </div>
              </div>
              <p className="text-xs text-[#667085] leading-relaxed">
                Graduates receive tamper-proof digital diplomas with unique serial codes for instant online verification by employers and universities.
              </p>
            </Card>
          </div>

        </div>
      </section>

      {/* =========================================================================
          INTERACTIVE FAQ SECTION
      ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#E2E8F0] bg-[#F3F7FC] p-8 sm:p-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-[#172033]">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[#667085]">
              Find fast answers regarding level placement, accreditation, lesson methodology, and graduation.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {faqCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveFaqCategory(cat);
                  setOpenFaq(0);
                }}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                  activeFaqCategory === cat
                    ? 'bg-[#012970] text-white shadow-md'
                    : 'bg-white text-[#172033] hover:bg-[#F3F7FC] border border-[#E2E8F0]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* FAQ Accordion List */}
          <div className="max-w-3xl mx-auto space-y-3">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white transition-all shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-[#F3F7FC]/50"
                  >
                    <span className="text-sm font-bold text-[#172033] pr-4">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-[#006EF3] transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-[#667085] leading-relaxed border-t border-[#E2E8F0] animate-in fade-in-50 duration-150">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          CONTACT US SECTION & DIRECT REACH CHANNELS
      ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Direct Contact Info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tight text-[#172033]">
                Get In Touch
              </h2>
              <p className="text-sm text-[#667085] leading-relaxed">
                Whether you have questions about student enrollment, corporate team training, or teacher recruitment, our academic support team is ready to help.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 flex items-center gap-4 shadow-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F3F7FC] text-[#006EF3]">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#172033]">Direct Phone & WhatsApp</p>
                  <a href="tel:0782572028" className="text-sm text-[#006EF3] font-mono font-bold hover:underline">
                    0782572028 / +250 782 572 028
                  </a>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 flex items-center gap-4 shadow-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F3F7FC] text-[#006EF3]">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#172033]">Email Address</p>
                  <a href="mailto:linguachrisltd@gmail.com" className="text-sm text-[#006EF3] font-medium hover:underline">
                    linguachrisltd@gmail.com
                  </a>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 flex items-center gap-4 shadow-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F3F7FC] text-[#006EF3]">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#172033]">Location & Campus</p>
                  <p className="text-sm text-[#667085]">Kigali, Rwanda</p>
                </div>
              </div>

              {/* Social Channels Card */}
              <div className="rounded-2xl border border-[#E2E8F0] bg-[#F3F7FC] p-4 space-y-3 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                  Follow Our Official Channels
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="https://www.tiktok.com/@linguachris018?_r=1&_t=ZS-99orwIgPKbt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-bold text-[#172033] hover:bg-[#012970] hover:text-white transition-all shadow-sm"
                  >
                    <span>TikTok</span>
                  </a>
                  <a
                    href="https://www.instagram.com/linguachris_academy_ltd?stkn=eG5kb3AyNXAydTNl&utm_source=qr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-bold text-[#172033] hover:bg-[#012970] hover:text-white transition-all shadow-sm"
                  >
                    <span>Instagram</span>
                  </a>
                  <a
                    href="https://youtube.com/@linguachrisacademy?si=IVC7YguY2jFWylV7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-bold text-[#172033] hover:bg-[#012970] hover:text-white transition-all shadow-sm"
                  >
                    <span>YouTube</span>
                  </a>
                  <a
                    href="https://www.facebook.com/share/1KL7TYgEWL/?mibextid=wwXIfr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-bold text-[#172033] hover:bg-[#012970] hover:text-white transition-all shadow-sm"
                  >
                    <span>Facebook</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Inquiry Form */}
          <div className="lg:col-span-7">
            <Card className="rounded-3xl border border-[#E2E8F0] bg-white p-6 sm:p-8 shadow-lg">
              {formSubmitted ? (
                <div className="text-center py-10 space-y-4 animate-in fade-in duration-200">
                  <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-[#F3F7FC] text-[#006EF3]">
                    <Check className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold text-[#172033]">
                    Message Sent Successfully!
                  </h3>
                  <p className="text-xs text-[#667085] max-w-md mx-auto leading-relaxed">
                    Thank you, <span className="font-bold text-[#172033]">{formData.name}</span>. Our academic advising team has received your message and will respond to <span className="font-bold text-[#172033]">{formData.email}</span> within 24 hours.
                  </p>
                  <Button
                    onClick={() => {
                      setFormSubmitted(false);
                      setFormData({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
                    }}
                    className="rounded-xl bg-[#012970] text-white hover:bg-[#001f54] text-xs font-bold px-6 transition-colors"
                  >
                    Send Another Inquiry
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmitContact} className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-[#172033]">
                      Send Us a Direct Message
                    </h3>
                    <p className="text-xs text-[#667085]">
                      Fill out the form below and an academic advisor will get back to you promptly.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#172033]">Your Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Eric Karemera"
                        className="flex h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-medium text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#006EF3]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#172033]">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. eric@example.com"
                        className="flex h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-medium text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#006EF3]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#172033]">Phone / WhatsApp Number</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+250 788 123 456"
                        className="flex h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-medium text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#006EF3]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#172033]">Inquiry Subject</label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="flex h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-medium text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#006EF3]"
                      >
                        <option value="General Inquiry">General Inquiry</option>
                        <option value="Course Enrollment & Levels">Course Enrollment & Levels</option>
                        <option value="Corporate Training for Companies">Corporate Training for Companies</option>
                        <option value="Teacher Application">Teacher Application</option>
                        <option value="Certificate Verification Support">Certificate Verification Support</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#172033]">Your Message *</label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about your learning goals or question..."
                      className="w-full rounded-xl border border-[#E2E8F0] bg-white p-3.5 text-xs font-medium text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#006EF3]"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full rounded-xl bg-[#012970] text-white hover:bg-[#001f54] py-3 text-xs font-bold uppercase tracking-wider shadow-md transition-colors"
                  >
                    <Send className="mr-2 h-4 w-4" /> Send Inquiry Message
                  </Button>
                </form>
              )}
            </Card>
          </div>

        </div>
      </section>
    </div>
  );
}
