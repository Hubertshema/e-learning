'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Clock,
  CheckCircle2,
  Lock,
  Users,
  ShieldCheck,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { LessonSettingsData } from './types';

interface SettingsTabProps {
  settings: LessonSettingsData;
  onChangeSettings: (updates: Partial<LessonSettingsData>) => void;
}

export function SettingsTab({ settings, onChangeSettings }: SettingsTabProps) {
  const [newObj, setNewObj] = useState('');

  const handleAddObjective = () => {
    if (!newObj.trim()) return;
    onChangeSettings({
      objectives: [...settings.objectives, newObj.trim()],
    });
    setNewObj('');
  };

  const handleRemoveObjective = (index: number) => {
    onChangeSettings({
      objectives: settings.objectives.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-10 flex justify-center">
      <div className="w-full max-w-3xl space-y-8 pb-16">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Lesson Settings & Metadata</h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure learning objectives, prerequisites, completion benchmarks, and student access rules.
          </p>
        </div>

        {/* 1. Basic Metadata */}
        <Card className="p-6 space-y-4 border-slate-200/90 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="h-4 w-4 text-[#315b36]" />
            <span>General Information</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Lesson Title
              </label>
              <Input
                value={settings.title}
                onChange={(e) => onChangeSettings({ title: e.target.value })}
                placeholder="e.g. Master Conditional Sentences & Hypotheticals"
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Summary Description
              </label>
              <textarea
                rows={3}
                value={settings.description}
                onChange={(e) => onChangeSettings({ description: e.target.value })}
                placeholder="Provide a concise summary of what students will explore in this lesson..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-[#315b36] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Estimated Duration (Minutes)
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    type="number"
                    min="5"
                    max="180"
                    value={settings.estimatedDuration}
                    onChange={(e) => onChangeSettings({ estimatedDuration: Number(e.target.value) })}
                    className="pl-9 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Public Free Preview</p>
                  <p className="text-[10px] text-slate-400">Available to unenrolled prospective learners</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.isFreePreview}
                  onChange={(e) => onChangeSettings({ isFreePreview: e.target.checked })}
                  className="rounded accent-[#315b36] h-4 w-4"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* 2. Learning Objectives */}
        <Card className="p-6 space-y-4 border-slate-200/90 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🎯</span>
              <span>Measurable Learning Objectives</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#eef5ee] text-[#315b36]">
              {settings.objectives.length} Objectives
            </span>
          </div>

          <div className="space-y-2">
            {settings.objectives.map((obj, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-xs"
              >
                <div className="flex items-start gap-2">
                  <span className="text-[#315b36] font-bold">•</span>
                  <span className="text-slate-800 dark:text-slate-200">{obj}</span>
                </div>
                <button
                  onClick={() => handleRemoveObjective(i)}
                  className="text-slate-400 hover:text-rose-500 p-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            <div className="flex gap-2 pt-2">
              <Input
                placeholder="e.g. Can write an executive summary with zero grammatical ambiguity..."
                value={newObj}
                onChange={(e) => setNewObj(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddObjective();
                }}
                className="text-xs"
              />
              <Button
                type="button"
                onClick={handleAddObjective}
                variant="gradient"
                size="sm"
                className="shrink-0 text-xs font-bold"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>
          </div>
        </Card>

        {/* 3. Completion Rules */}
        <Card className="p-6 space-y-4 border-slate-200/90 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#315b36]" />
            <span>Completion Benchmarks</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {[
              { id: 'opened', label: 'Mark complete when opened', desc: 'Instant completion upon viewing' },
              { id: 'all_blocks', label: 'Complete all lesson blocks', desc: 'Student must interact with all blocks' },
              { id: 'quiz_passed', label: 'Pass embedded quiz', desc: 'Requires passing score on quiz questions' },
              { id: 'min_score', label: 'Minimum passing score', desc: 'Custom percentage threshold' },
            ].map((rule) => {
              const isSelected = settings.completionRule === rule.id;
              return (
                <div
                  key={rule.id}
                  onClick={() => onChangeSettings({ completionRule: rule.id as any })}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#315b36] bg-[#eef5ee]/50 dark:bg-emerald-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-bold text-slate-800 dark:text-slate-200">{rule.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{rule.desc}</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 4. Personalization & Access Scope */}
        <Card className="p-6 space-y-4 border-slate-200/90 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-4 w-4 text-[#315b36]" />
            <span>Cohort Access & Personalization</span>
          </h3>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'level', label: 'Entire Level Cohort', desc: 'All students enrolled in this CEFR level' },
                { id: 'course', label: 'Course Enrollees', desc: 'Only students enrolled in this syllabus' },
                { id: 'selected_students', label: 'Adaptive Track', desc: 'Assigned to specific students' },
              ].map((scope) => {
                const isSelected = settings.accessScope === scope.id;
                return (
                  <div
                    key={scope.id}
                    onClick={() => onChangeSettings({ accessScope: scope.id as any })}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#315b36] bg-[#eef5ee]/50 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{scope.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{scope.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
