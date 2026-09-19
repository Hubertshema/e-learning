'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import {
  Briefcase,
  Code,
  HeartPulse,
  Utensils,
  UserCheck,
  Globe2,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Award,
  Layers,
} from 'lucide-react';

interface DomainTrack {
  id: string;
  title: string;
  badge: string;
  level: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgLight: string;
  description: string;
  targetAudience: string;
  curriculum: {
    unit: string;
    topics: string[];
  }[];
  keyVocabulary: string[];
  sampleDrill: string;
}

const DOMAIN_TRACKS: DomainTrack[] = [
  {
    id: 'business',
    title: 'Executive Business English & Negotiation',
    badge: 'High Impact',
    level: 'B2 – C1',
    icon: Briefcase,
    color: 'text-blue-600',
    bgLight: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    description:
      'Master high-stakes boardroom meetings, diplomatic email etiquette, corporate presentations, contract negotiations, and executive cross-cultural communication.',
    targetAudience: 'Executives, Project Managers, Entrepreneurs, Sales Leaders',
    curriculum: [
      {
        unit: 'Unit 1: Diplomatic Disagreement & Persuasion',
        topics: ['Hedging strategies', 'Tactful pushback', 'Constructive consensus building'],
      },
      {
        unit: 'Unit 2: Financial & Quarterly Reports',
        topics: ['Interpreting revenue trends', 'Executive summaries', 'Data storytelling'],
      },
      {
        unit: 'Unit 3: Cross-Border Contract Negotiations',
        topics: ['Conditional bargaining', 'Concessions & caveats', 'Closing agreements'],
      },
    ],
    keyVocabulary: ['Synergy', 'Mitigate risk', 'Leverage', 'Core competency', 'Deliverables', 'Stakeholder alignment'],
    sampleDrill: 'Deliver a 90-second impromptu pitch persuading stakeholders to approve a 15% budget expansion.',
  },
  {
    id: 'it',
    title: 'English for IT, Software & Tech Engineering',
    badge: 'Tech Standard',
    level: 'B1 – C1',
    icon: Code,
    color: 'text-purple-600',
    bgLight: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
    description:
      'Communicate effortlessly during Agile standups, architecture reviews, pull request discussions, incident post-mortems, and asynchronous engineering docs.',
    targetAudience: 'Software Developers, QA Engineers, DevOps, Tech Leads',
    curriculum: [
      {
        unit: 'Unit 1: Daily Standups & Sprint Demos',
        topics: ['Blockers & progress updates', 'Async standup summaries', 'Sprint retrospective feedback'],
      },
      {
        unit: 'Unit 2: Code Reviews & Constructive Critique',
        topics: ['Commenting on PRs', 'Architecture trade-offs', 'Performance bottleneck analysis'],
      },
      {
        unit: 'Unit 3: Production Outage Post-Mortems',
        topics: ['Root-cause analysis phrasing', 'Timeline reporting', 'Mitigation commitments'],
      },
    ],
    keyVocabulary: ['Idempotent', 'Technical debt', 'Latency', 'Deprecate', 'Refactor', 'High-availability'],
    sampleDrill: 'Explain why a distributed database transaction failed and propose a fallback solution in under 2 minutes.',
  },
  {
    id: 'healthcare',
    title: 'Medical English & Clinical Communication',
    badge: 'Accredited',
    level: 'B2 – C2',
    icon: HeartPulse,
    color: 'text-rose-600',
    bgLight: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
    description:
      'Develop empathetic patient triage skills, precise medical record documentation, clinical handover precision, and reassuring bedside manners.',
    targetAudience: 'Nurses, Medical Practitioners, Clinical Researchers, Pharmacists',
    curriculum: [
      {
        unit: 'Unit 1: Empathetic Patient Intake & History',
        topics: ['Symptom exploration', 'Non-judgmental questioning', 'Patient reassurance'],
      },
      {
        unit: 'Unit 2: Inter-Disciplinary Handover (ISBAR)',
        topics: ['Identification, Situation, Background', 'Assessment & Recommendation', 'Critical escalation'],
      },
      {
        unit: 'Unit 3: Explaining Diagnoses & Treatment Plans',
        topics: ['Translating jargon into lay terms', 'Informed consent', 'Post-discharge guidance'],
      },
    ],
    keyVocabulary: ['Prognosis', 'Contraindication', 'Acute vs Chronic', 'Triage', 'Palliative', 'Hypertension'],
    sampleDrill: 'Perform an ISBAR patient handover to the oncoming intensive care nurse during a shift change.',
  },
  {
    id: 'hospitality',
    title: 'Hospitality, Tourism & Guest Relations',
    badge: 'Service Excellence',
    level: 'A2 – B2',
    icon: Utensils,
    color: 'text-amber-600',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    description:
      'Elevate front-desk diplomacy, VIP guest interaction, culinary and concierge recommendations, and de-escalation of difficult service scenarios.',
    targetAudience: 'Hotel Staff, Concierges, Tour Guides, Restaurant Managers, Airline Cabin Crew',
    curriculum: [
      {
        unit: 'Unit 1: Welcoming Guests & Concierge Advice',
        topics: ['Warm first impressions', 'Local tourism guidance', 'Special request handling'],
      },
      {
        unit: 'Unit 2: Service De-escalation & Complaint Resolution',
        topics: ['Active listening', 'Apologizing without liability', 'Service recovery perks'],
      },
      {
        unit: 'Unit 3: Fine Dining & Event Coordination',
        topics: ['Menu description & dietary allergens', 'Banquet hosting', 'Billing etiquette'],
      },
    ],
    keyVocabulary: ['Complimentary', 'Amenities', 'Dietary restriction', 'Reservation', 'Concierge', 'Service recovery'],
    sampleDrill: 'De-escalate an upset hotel guest whose reserved luxury suite is delayed by 45 minutes.',
  },
  {
    id: 'interview',
    title: 'Global Career & Job Interview Mastery',
    badge: 'Career Accelerator',
    level: 'B1 – C2',
    icon: UserCheck,
    color: 'text-emerald-600',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    description:
      'Conquer international hiring interviews using the STAR framework, salary negotiation scripts, elevator pitches, and confident behavioral storytelling.',
    targetAudience: 'Job Seekers, University Graduates, Remote Global Workers',
    curriculum: [
      {
        unit: 'Unit 1: The 60-Second Elevator Pitch',
        topics: ['Personal branding', 'Concise career trajectory', 'Value proposition'],
      },
      {
        unit: 'Unit 2: The STAR Storytelling Method',
        topics: ['Situation & Task framing', 'Action verbs & personal impact', 'Measurable Results'],
      },
      {
        unit: 'Unit 3: Salary & Offer Package Negotiation',
        topics: ['Market value framing', 'Counter-offers', 'Non-monetary perks negotiation'],
      },
    ],
    keyVocabulary: ['Pivotal', 'Spearhead', 'Quantifiable', 'Compensation package', 'Bandwidth', 'Strategic initiative'],
    sampleDrill: 'Answer "Tell me about a time you resolved a major team conflict" using the 4-part STAR method in under 90 seconds.',
  },
  {
    id: 'rwanda',
    title: 'English for Rwanda & East African Commerce',
    badge: 'Regional Focus',
    level: 'A1 – B2',
    icon: Globe2,
    color: 'text-teal-600',
    bgLight: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800',
    description:
      'Tailored everyday, academic, and business English for Rwandan students, bilingual professionals, and East African cross-border trade.',
    targetAudience: 'Rwandan Students, Business Owners, Public Sector Staff, Service Workers',
    curriculum: [
      {
        unit: 'Unit 1: Everyday & Academic Communication',
        topics: ['Classroom discussion English', 'Pronunciation clarity', 'Essay structuring'],
      },
      {
        unit: 'Unit 2: East African Cross-Border Trade',
        topics: ['Customs & shipping terminology', 'Mobile money payment confirmations', 'Invoicing'],
      },
      {
        unit: 'Unit 3: Hospitality & National Parks Guiding',
        topics: ['Ecotourism narrative', 'Gorilla trekking briefing', 'Customer hospitality'],
      },
    ],
    keyVocabulary: ['Consignment', 'MoMo confirmation', 'Ecotourism', 'Bilingual', 'Procurement', 'Bilateral agreement'],
    sampleDrill: 'Simulate a cross-border trade discussion confirming payment receipt and dispatch schedule.',
  },
];

export default function TracksPage() {
  const [selectedTrack, setSelectedTrack] = useState<DomainTrack>(DOMAIN_TRACKS[0]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3.5 py-1 text-xs font-semibold text-primary-700 dark:border-primary-800 dark:bg-primary-950/60 dark:text-primary-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Section 41 & 42 Specialized Curricula</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Specialized Professional <span className="text-primary-600">English Tracks</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
              Accelerate your career with industry-specific English programs designed for high-impact global workplaces, from tech and healthcare to executive negotiation.
            </p>
          </div>

          {/* Grid of Tracks */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DOMAIN_TRACKS.map((track) => {
              const Icon = track.icon;
              const isSelected = selectedTrack.id === track.id;
              return (
                <div
                  key={track.id}
                  onClick={() => setSelectedTrack(track)}
                  className={`cursor-pointer rounded-2xl border p-6 transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'border-primary-600 bg-white shadow-lg ring-2 ring-primary-600/20 dark:bg-slate-900'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-xl ${track.bgLight}`}>
                        <Icon className={`h-6 w-6 ${track.color}`} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {track.level}
                        </span>
                        <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                          {track.badge}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                        {track.title}
                      </h3>
                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                        {track.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">For {track.targetAudience.split(',')[0]}</span>
                    <span className={isSelected ? 'text-primary-600' : 'text-slate-400'}>
                      {isSelected ? 'Viewing Curriculum' : 'Click to inspect'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Deep Track Inspector */}
          <div className="mt-14 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-primary-50 px-2 py-1 text-xs font-bold text-primary-600 dark:bg-primary-950 dark:text-primary-400">
                    CEFR {selectedTrack.level} Syllabus
                  </span>
                  <span className="text-xs text-slate-500">Target: {selectedTrack.targetAudience}</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {selectedTrack.title}
                </h2>
              </div>

              <Link
                href="/register?role=student"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-primary-700 transition"
              >
                <span>Enroll in This Track</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Syllabus Breakdown */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary-600" />
                  <span>Curriculum Blueprint</span>
                </h3>

                <div className="space-y-3">
                  {selectedTrack.curriculum.map((unit, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-800/40"
                    >
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {unit.unit}
                      </h4>
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {unit.topics.map((t, tidx) => (
                          <span
                            key={tidx}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
                          >
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            <span>{t}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vocabulary & Speaking Drill Preview */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <span>Essential Industry Lexicon</span>
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTrack.keyVocabulary.map((vocab, vidx) => (
                      <span
                        key={vidx}
                        className="rounded-md bg-blue-100/60 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                      >
                        {vocab}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900 dark:bg-amber-950/30 space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    <span>Sample Capstone Speaking Drill</span>
                  </h3>
                  <p className="text-xs text-amber-950 dark:text-amber-200 leading-relaxed italic">
                    "{selectedTrack.sampleDrill}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
