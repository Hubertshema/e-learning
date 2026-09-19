import React from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In — FluentEdge Academy',
  description: 'Log into your FluentEdge account to continue your English learning or teaching journey.',
};

export default function LoginPage() {
  return <LoginForm />;
}
