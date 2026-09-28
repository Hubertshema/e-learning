import React, { Suspense } from 'react';
import { ApplyForm } from '@/components/auth/apply-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Apply for Admission — LinguaChris Academy',
  description: 'Submit your application for personalized CEFR English learning with LinguaChris Academy.',
};

export default function ApplyPage() {
  return (
    <Suspense fallback={<div className="text-center p-8 text-sm">Loading application form...</div>}>
      <ApplyForm />
    </Suspense>
  );
}
