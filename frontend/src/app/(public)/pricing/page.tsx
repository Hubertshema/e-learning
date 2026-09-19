import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';

export default function PricingPage() {
  const plans = [
    {
      name: 'Single Level Course',
      price: '$49',
      period: 'per course / 90 days access',
      description: 'Ideal for focusing on a specific CEFR level or skill set.',
      features: [
        'Full access to all unit lessons & activities',
        'Interactive grammar & vocabulary exercises',
        'Teacher-graded writing & speaking assignments',
        'Auto-graded practice quizzes & mock tests',
        'Accredited completion certificate',
      ],
      cta: 'Choose Course',
      popular: false,
    },
    {
      name: 'Full Fluency Track',
      price: '$129',
      period: '3 levels bundle / 1 year access',
      description: 'Complete multi-level progression from your baseline to target level.',
      features: [
        'Access to 3 consecutive CEFR level courses',
        'Comprehensive Placement Test & level roadmap',
        'Priority teacher evaluation & feedback',
        'Live speaking practice activities',
        '3 Verifiable CEFR certificates',
        'Downloadable offline study notes',
      ],
      cta: 'Start Fluency Track',
      popular: true,
    },
    {
      name: 'Enterprise & School',
      price: 'Custom',
      period: 'tailored per organization',
      description: 'Dedicated English training for businesses, schools, or government bodies.',
      features: [
        'Dedicated corporate classes & instructors',
        'Custom industry curricula (IT, Hospitality, Business)',
        'Superadmin analytics & progress reporting',
        'Attendance registers & compliance audits',
        'Bulk student onboarding & invoicing',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Transparent Pricing for Every Learner
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Pay once per course or level with direct teacher approval and guaranteed full curriculum access.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3 items-stretch">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`flex flex-col justify-between p-8 transition-all ${
              plan.popular
                ? 'border-2 border-primary-500 shadow-xl dark:border-primary-500 relative'
                : 'border-slate-200/80 hover:shadow-lg dark:border-slate-800'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-3 py-0.5 text-xs font-bold text-white shadow-md">
                Most Popular
              </div>
            )}

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                <p className="mt-1 text-xs text-slate-500">{plan.description}</p>
              </div>

              <div>
                <span className="text-4xl font-black text-slate-900 dark:text-white">{plan.price}</span>
                <span className="text-xs text-slate-500 ml-2">/ {plan.period}</span>
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-6 dark:border-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Includes:</p>
                {plan.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <Check className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8">
              <Link href="/register?role=STUDENT">
                <Button
                  variant={plan.popular ? 'gradient' : 'outline'}
                  className="w-full"
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
