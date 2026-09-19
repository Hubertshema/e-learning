import React, { Suspense } from 'react';
import { RegisterForm } from '@/components/auth/register-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account — LinguaChris Academy',
  description: 'Join LinguaChris Academy as a student or certified English instructor.',
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="text-center p-8 text-sm">Loading registration...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
