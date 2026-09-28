'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  GraduationCap,
  Sparkles,
  AlertCircle,
  Key,
  CreditCard,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface LevelOption {
  id: string;
  name: string;
  levelNumber?: number;
  description?: string;
}

interface DirectAdmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (name: string) => void;
}

export function DirectAdmissionModal({
  isOpen,
  onClose,
  onSuccess,
}: DirectAdmissionModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('Lingua2026!');
  const [levelId, setLevelId] = useState('');
  const [paymentRequirement, setPaymentRequirement] = useState<
    'PAYMENT_REQUIRED' | 'PAYMENT_ALREADY_HANDLED' | 'PAYMENT_WAIVED' | 'PAYMENT_NOT_REQUIRED'
  >('PAYMENT_REQUIRED');

  const [levels, setLevels] = useState<LevelOption[]>([]);
  const [isLoadingLevels, setIsLoadingLevels] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingLevels(true);
      apiClient
        .get<any>('/levels')
        .then((res) => {
          const list = Array.isArray(res) ? res : res?.data || res?.levels || [];
          setLevels(list);
          if (list.length > 0 && !levelId) {
            setLevelId(list[0].id);
          }
        })
        .catch((err) => console.error('Error fetching levels:', err))
        .finally(() => setIsLoadingLevels(false));
    }
  }, [isOpen]);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!firstName.trim() || !lastName.trim()) {
        throw new Error('Please enter student first and last name.');
      }
      if (!email.trim()) {
        throw new Error('Please enter student email.');
      }
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }

      await apiClient.post('/teacher/students/direct', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        levelId: levelId || null,
        paymentRequirement,
      });

      onSuccess(`${firstName} ${lastName}`);
      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create student account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Direct Student Admission"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/40 text-xs text-slate-700 dark:text-slate-300">
          <p className="font-bold text-[#315b36] dark:text-emerald-400 flex items-center gap-1.5">
            <UserPlus className="h-4 w-4" />
            Admit Student Without Prior Application
          </p>
          <p className="text-[11px] mt-0.5 text-slate-500 dark:text-slate-400">
            Instantly provision a verified student account, assign an initial CEFR level, and configure tuition payment requirements.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Name inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              First Name *
            </label>
            <Input
              required
              placeholder="e.g. Marie"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Last Name *
            </label>
            <Input
              required
              placeholder="e.g. Uwase"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Email Address *
            </label>
            <Input
              type="email"
              required
              placeholder="marie@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Phone / WhatsApp
            </label>
            <Input
              placeholder="+250 788 000 000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Initial Password *
            </label>
            <button
              type="button"
              onClick={generatePassword}
              className="text-[10px] font-bold text-[#315b36] hover:underline flex items-center gap-1"
            >
              <Key className="h-3 w-3" />
              Generate random
            </button>
          </div>
          <Input
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-9 text-xs font-mono rounded-xl"
          />
        </div>

        {/* CEFR Level assignment */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
            Initial CEFR Level Program
          </label>
          <select
            value={levelId}
            onChange={(e) => setLevelId(e.target.value)}
            className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-medium"
          >
            <option value="">-- No Level Assigned (Assign Later) --</option>
            {levels.map((lvl) => (
              <option key={lvl.id} value={lvl.id}>
                {lvl.name} {lvl.description ? `(${lvl.description})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Requirement Decision */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-[#315b36]" />
            Tuition Payment Decision *
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* 1. Payment Required */}
            <label
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                paymentRequirement === 'PAYMENT_REQUIRED'
                  ? 'border-amber-400 bg-amber-50/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 font-bold'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="paymentReq"
                  checked={paymentRequirement === 'PAYMENT_REQUIRED'}
                  onChange={() => setPaymentRequirement('PAYMENT_REQUIRED')}
                  className="accent-[#315b36]"
                />
                <span>Payment Required</span>
              </div>
              <p className="text-[10px] font-normal text-slate-500 mt-1 pl-5">
                Student must submit proof. Access is LOCKED until verified.
              </p>
            </label>

            {/* 2. Payment Already Handled */}
            <label
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                paymentRequirement === 'PAYMENT_ALREADY_HANDLED'
                  ? 'border-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-bold'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="paymentReq"
                  checked={paymentRequirement === 'PAYMENT_ALREADY_HANDLED'}
                  onChange={() => setPaymentRequirement('PAYMENT_ALREADY_HANDLED')}
                  className="accent-[#315b36]"
                />
                <span>Already Handled</span>
              </div>
              <p className="text-[10px] font-normal text-slate-500 mt-1 pl-5">
                Paid outside system. Learning access is ACTIVE immediately.
              </p>
            </label>

            {/* 3. Payment Waived */}
            <label
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                paymentRequirement === 'PAYMENT_WAIVED'
                  ? 'border-sky-400 bg-sky-50/70 dark:bg-sky-950/40 text-sky-950 dark:text-sky-200 font-bold'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="paymentReq"
                  checked={paymentRequirement === 'PAYMENT_WAIVED'}
                  onChange={() => setPaymentRequirement('PAYMENT_WAIVED')}
                  className="accent-[#315b36]"
                />
                <span>Payment Waived</span>
              </div>
              <p className="text-[10px] font-normal text-slate-500 mt-1 pl-5">
                Scholarship / full waiver. Access is ACTIVE immediately.
              </p>
            </label>

            {/* 4. Payment Not Required */}
            <label
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                paymentRequirement === 'PAYMENT_NOT_REQUIRED'
                  ? 'border-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 font-bold'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="paymentReq"
                  checked={paymentRequirement === 'PAYMENT_NOT_REQUIRED'}
                  onChange={() => setPaymentRequirement('PAYMENT_NOT_REQUIRED')}
                  className="accent-[#315b36]"
                />
                <span>Not Required</span>
              </div>
              <p className="text-[10px] font-normal text-slate-500 mt-1 pl-5">
                No payment stage. Access is ACTIVE immediately.
              </p>
            </label>
          </div>
        </div>

        {/* Modal actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-xs h-9 rounded-xl"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#315b36] hover:bg-[#25462a] text-white font-bold text-xs h-9 rounded-xl shadow-md gap-1.5"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Admitting Student...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <UserPlus className="h-3.5 w-3.5" />
                Admit Student Directly
              </span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
