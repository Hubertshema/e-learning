'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AIHeaderTabs } from '@/components/ai/ai-header-tabs';
import {
  BookOpen,
  Sparkles,
  Clock,
  Layers,
  Users,
  Download,
  Save,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  RotateCcw,
  Plus,
  Trash2,
  FileText,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';

interface LessonPlanSection {
  title: string;
  durationMinutes: number;
  teacherAction: string;
  studentAction: string;
  materials?: string[];
  differentiation?: {
    forLowerLevel?: string;
    forHigherLevel?: string;
  };
}

interface GeneratedLessonPlan {
  title: string;
  courseTitle?: string;
  cefrLevel: string;
  durationMinutes: number;
  teachingStyle: string;
  targetSkill: string;
  classSize?: number;
  learningObjectives: string[];
  prerequisites: string[];
  requiredMaterials: string[];
  warmup: LessonPlanSection;
  presentation: LessonPlanSection;
  guidedPractice: LessonPlanSection;
  collaborativeActivity: LessonPlanSection;
  independentPractice: LessonPlanSection;
  assessmentWrapUp: LessonPlanSection;
  differentiationNotes: string;
  homeworkAssignment: string;
  summaryKeyTakeaways: string[];
}

export default function AILessonPlannerPage() {
  // Generation input states
  const [topic, setTopic] = useState('Present Perfect vs Past Simple');
  const [cefrLevel, setCefrLevel] = useState('B1');
  const [targetSkill, setTargetSkill] = useState('GRAMMAR');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [teachingStyle, setTeachingStyle] = useState('COMMUNICATIVE');
  const [classSize, setClassSize] = useState(25);
  const [customObjectives, setCustomObjectives] = useState<string[]>([]);
  const [newObjective, setNewObjective] = useState('');

  // Execution states
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<GeneratedLessonPlan | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cefrLevels = ['PRE_A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const skills = ['GRAMMAR', 'VOCABULARY', 'READING', 'LISTENING', 'SPEAKING', 'WRITING', 'PRONUNCIATION'];
  const styles = [
    { value: 'COMMUNICATIVE', label: 'Communicative Language Teaching (CLT)' },
    { value: 'TASK_BASED', label: 'Task-Based Learning (TBL)' },
    { value: 'PROJECT_BASED', label: 'Project-Based Learning (PBL)' },
    { value: 'TRADITIONAL', label: 'Presentation-Practice-Production (PPP)' },
    { value: 'MIXED', label: 'Eclectic / Integrated Skills' },
  ];

  const handleAddObjective = () => {
    if (newObjective.trim()) {
      setCustomObjectives([...customObjectives, newObjective.trim()]);
      setNewObjective('');
    }
  };

  const handleRemoveObjective = (index: number) => {
    setCustomObjectives(customObjectives.filter((_, i) => i !== index));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    try {
      setGenerating(true);
      setError(null);
      setSaveSuccess(false);

      const res = await api.post<{ generationId: string; lessonPlan: GeneratedLessonPlan }>('/ai/lessons/generate', {
        topic,
        cefrLevel,
        targetSkill,
        durationMinutes: Number(durationMinutes),
        teachingStyle,
        classSize: Number(classSize),
        customObjectives: customObjectives.length > 0 ? customObjectives : undefined,
      });

      setPlan(res.lessonPlan);
      setGenerationId(res.generationId);
    } catch (err: any) {
      console.error('Lesson plan generation failed:', err);
      setError(err.message || 'Failed to generate lesson plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!generationId || !plan) return;
    try {
      setSaving(true);
      await api.put(`/ai/history/${generationId}`, {
        title: plan.title,
        status: 'SAVED',
        output: plan,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!plan) return;
    const md = `# ${plan.title}
**CEFR Level:** ${plan.cefrLevel} | **Duration:** ${plan.durationMinutes} mins | **Style:** ${plan.teachingStyle}

## Learning Objectives
${plan.learningObjectives.map((o) => `- ${o}`).join('\n')}

## 1. Warm-up (${plan.warmup.durationMinutes}m): ${plan.warmup.title}
- **Teacher:** ${plan.warmup.teacherAction}
- **Students:** ${plan.warmup.studentAction}

## 2. Presentation (${plan.presentation.durationMinutes}m): ${plan.presentation.title}
- **Teacher:** ${plan.presentation.teacherAction}
- **Students:** ${plan.presentation.studentAction}

## 3. Guided Practice (${plan.guidedPractice.durationMinutes}m): ${plan.guidedPractice.title}
- **Teacher:** ${plan.guidedPractice.teacherAction}
- **Students:** ${plan.guidedPractice.studentAction}

## 4. Collaborative Activity (${plan.collaborativeActivity.durationMinutes}m): ${plan.collaborativeActivity.title}
- **Teacher:** ${plan.collaborativeActivity.teacherAction}
- **Students:** ${plan.collaborativeActivity.studentAction}

## 5. Independent Practice (${plan.independentPractice.durationMinutes}m): ${plan.independentPractice.title}
- **Teacher:** ${plan.independentPractice.teacherAction}
- **Students:** ${plan.independentPractice.studentAction}

## 6. Wrap-up (${plan.assessmentWrapUp.durationMinutes}m): ${plan.assessmentWrapUp.title}
- **Teacher:** ${plan.assessmentWrapUp.teacherAction}
- **Students:** ${plan.assessmentWrapUp.studentAction}

## Homework Assignment
${plan.homeworkAssignment}
`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Unified AI Studio Navigation Tabs */}
      <AIHeaderTabs />

      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/teacher/ai">
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-white">
              <ArrowLeft className="h-4 w-4" /> AI Hub
            </Button>
          </Link>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary-500" />
            AI Lesson Planner Studio
          </h1>
        </div>
        <Badge variant="outline" className="border-primary-500/30 bg-primary-500/10 text-primary-400">
          CEFR Curriculum Mode
        </Badge>
      </div>

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: Generation Controls */}
        <div className="lg:col-span-5 space-y-5">
          <Card className="border-slate-200 dark:border-slate-800 shadow-md">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary-500" />
                Lesson Parameters
              </CardTitle>
              <CardDescription className="text-xs">
                Configure your target language focus, CEFR benchmark, and pedagogical methodology.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleGenerate} className="space-y-4">
                {/* Topic */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Topic / Target Language Unit *
                  </label>
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Job Interviews & Modal Verbs of Obligation"
                    required
                    className="text-sm font-medium"
                  />
                </div>

                {/* CEFR Level & Target Skill Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      CEFR Level
                    </label>
                    <select
                      value={cefrLevel}
                      onChange={(e) => setCefrLevel(e.target.value)}
                      className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold"
                    >
                      {cefrLevels.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Core Skill
                    </label>
                    <select
                      value={targetSkill}
                      onChange={(e) => setTargetSkill(e.target.value)}
                      className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold"
                    >
                      {skills.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Duration & Class Size */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Duration (Minutes)
                    </label>
                    <select
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                    >
                      <option value={30}>30 Minutes</option>
                      <option value={45}>45 Minutes</option>
                      <option value={60}>60 Minutes</option>
                      <option value={90}>90 Minutes</option>
                      <option value={120}>120 Minutes</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Class Size
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={200}
                      value={classSize}
                      onChange={(e) => setClassSize(Number(e.target.value))}
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Teaching Style */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Teaching Methodology
                  </label>
                  <select
                    value={teachingStyle}
                    onChange={(e) => setTeachingStyle(e.target.value)}
                    className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                  >
                    {styles.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Learning Objectives (Optional) */}
                <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Custom Objectives (Optional)
                    </label>
                    <span className="text-[10px] text-slate-400">Auto-generated if empty</span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newObjective}
                      onChange={(e) => setNewObjective(e.target.value)}
                      placeholder="Add specific objective..."
                      className="text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddObjective();
                        }
                      }}
                    />
                    <Button type="button" size="sm" variant="outline" onClick={handleAddObjective} className="h-9 px-2.5">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {customObjectives.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {customObjectives.map((obj, i) => (
                        <div key={i} className="flex items-center justify-between rounded bg-slate-50 dark:bg-slate-800/60 px-2 py-1 text-[11px]">
                          <span className="line-clamp-1">{obj}</span>
                          <button type="button" onClick={() => handleRemoveObjective(i)} className="text-red-400 hover:text-red-600 ml-1">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-500">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={generating}
                  className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-semibold text-xs py-5 shadow-lg"
                >
                  {generating ? (
                    <>
                      <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                      Synthesizing Structured Plan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Lesson Plan
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT PANEL: Live Generated Plan */}
        <div className="lg:col-span-7 space-y-4">
          {!plan && !generating && (
            <Card className="border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-primary-400 opacity-60 mb-3" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                Your Interactive Lesson Plan Will Appear Here
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Configure the topic, level, and methodology on the left panel and click <strong>Generate Lesson Plan</strong>. You will be able to review, edit, and save drafts before publication.
              </p>
            </Card>
          )}

          {generating && (
            <Card className="border-slate-200 dark:border-slate-800 p-12 text-center animate-pulse">
              <div className="h-10 w-10 mx-auto mb-4 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                AI Curriculum Engine is Crafting Your Lesson...
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2">
                Aligning CEFR {cefrLevel} descriptors, pacing warm-up and presentation, constructing communicative drills, and formulating homework.
              </p>
            </Card>
          )}

          {plan && !generating && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary-600 text-white text-xs">{plan.cefrLevel}</Badge>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {plan.durationMinutes} mins • {plan.teachingStyle}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyMarkdown} className="h-8 text-xs gap-1.5">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy Markdown'}
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleSaveDraft}
                    disabled={saving}
                    className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {saving ? 'Saving...' : saveSuccess ? 'Draft Saved!' : 'Save Draft'}
                  </Button>
                </div>
              </div>

              {/* Main Plan Document */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-md">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-primary-500 uppercase tracking-wider">
                      {plan.courseTitle}
                    </span>
                    <CardTitle className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {plan.title}
                    </CardTitle>
                  </div>

                  {/* Learning Objectives */}
                  <div className="mt-4 rounded-xl bg-primary-50/60 dark:bg-primary-950/40 p-4 border border-primary-500/20">
                    <h4 className="text-xs font-bold text-primary-700 dark:text-primary-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Measurable Learning Objectives
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      {plan.learningObjectives.map((obj, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary-500 font-bold">•</span>
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-6 text-xs text-slate-700 dark:text-slate-300">
                  {/* Step-by-Step Sections */}
                  {[
                    { key: '1. Warm-up & Schema Activation', sec: plan.warmup, badgeColor: 'bg-amber-500/10 text-amber-500' },
                    { key: '2. Target Concept Presentation', sec: plan.presentation, badgeColor: 'bg-blue-500/10 text-blue-500' },
                    { key: '3. Guided Practice Drill', sec: plan.guidedPractice, badgeColor: 'bg-emerald-500/10 text-emerald-500' },
                    { key: '4. Collaborative Group Task', sec: plan.collaborativeActivity, badgeColor: 'bg-purple-500/10 text-purple-500' },
                    { key: '5. Independent Production', sec: plan.independentPractice, badgeColor: 'bg-rose-500/10 text-rose-500' },
                    { key: '6. Assessment Wrap-Up & Reflection', sec: plan.assessmentWrapUp, badgeColor: 'bg-slate-500/10 text-slate-400' },
                  ].map(({ key, sec, badgeColor }) => (
                    <div key={key} className="rounded-xl border border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${badgeColor}`}>
                            {sec.durationMinutes} mins
                          </span>
                          <h5 className="font-bold text-sm text-slate-900 dark:text-white">{key}</h5>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500">{sec.title}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div className="rounded-lg bg-white dark:bg-slate-800 p-3 border border-slate-200/60 dark:border-slate-700/60">
                          <span className="font-bold text-primary-600 dark:text-primary-400 block mb-1">
                            Teacher Role & Action:
                          </span>
                          <p className="leading-relaxed">{sec.teacherAction}</p>
                        </div>
                        <div className="rounded-lg bg-white dark:bg-slate-800 p-3 border border-slate-200/60 dark:border-slate-700/60">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                            Student Engagement & Action:
                          </span>
                          <p className="leading-relaxed">{sec.studentAction}</p>
                        </div>
                      </div>

                      {sec.differentiation && (
                        <div className="rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 p-2.5 text-[11px] border border-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                          <span className="font-bold">Scaffolding Differentiation: </span>
                          <span>{sec.differentiation.forLowerLevel}</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Homework & Takeaways */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900">
                      <h5 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white mb-2">
                        Homework & Extension
                      </h5>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {plan.homeworkAssignment}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900">
                      <h5 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white mb-2">
                        Differentiation Strategies
                      </h5>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {plan.differentiationNotes}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
