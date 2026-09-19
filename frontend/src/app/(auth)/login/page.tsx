import React from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In — LinguaChris Academy',
  description: 'Log into your LinguaChris account to continue your English learning or teaching journey.',
};

export default function LoginPage() {
  return <LoginForm />;
}
