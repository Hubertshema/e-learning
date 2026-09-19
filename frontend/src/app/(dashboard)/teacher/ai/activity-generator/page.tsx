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
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  Copy,
  Save,
  Check,
  Eye,
  EyeOff,
  HelpCircle,
  FileQuestion,
} from 'lucide-react';

interface ActivityItem {
  prompt: string;
  type: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  points?: number;
  rubricCriteria?: string[];
}

interface GeneratedActivitySet {
  title: string;
  topic: string;
  cefrLevel: string;
  skill: string;
  estimatedMinutes: number;
  instructions: string;
  passageOrScript?: string;
  items: ActivityItem[];
}

export default function AIActivityGeneratorPage() {
  const [topic, setTopic] = useState('Travel & Accommodation Vocabulary');
  const [cefrLevel, setCefrLevel] = useState('B1');
  const [skill, setSkill] = useState('VOCABULARY');
  const [activityType, setActivityType] = useState('MULTIPLE_CHOICE');
  const [itemCount, setItemCount] = useState(5);
  const [difficulty, setDifficulty] = useState<'EASY' | 'NORMAL' | 'HARD'>('NORMAL');

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activities, setActivities] = useState<GeneratedActivitySet | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [showAnswers, setShowAnswers] = useState(true);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cefrLevels = ['PRE_A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const skills = ['VOCABULARY', 'GRAMMAR', 'READING', 'LISTENING', 'SPEAKING', 'WRITING', 'PRONUNCIATION'];
  const activityTypes = [
    { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice Questions (MCQs)' },
    { value: 'TRUE_FALSE', label: 'True / False Statements' },
    { value: 'FILL_BLANKS', label: 'Fill in the Blanks / Gap Fill' },
    { value: 'SENTENCE_ORDER', label: 'Sentence Unscramble / Word Order' },
    { value: 'SHORT_ANSWER', label: 'Short Answer Comprehension' },
    { value: 'SPEAKING_PRACTICE', label: 'Speaking Prompt & Rubric' },
    { value: 'READING_COMPREHENSION', label: 'Reading Passage with Questions' },
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    try {
      setGenerating(true);
      setError(null);
      setSaveSuccess(false);

      const res = await api.post<{ generationId: string; activitySet: GeneratedActivitySet }>('/ai/activities/generate', {
        topic,
        cefrLevel,
        skill,
        activityType,
        itemCount: Number(itemCount),
        difficulty,
      });

      setActivities(res.activitySet);
      setGenerationId(res.generationId);
    } catch (err: any) {
      console.error('Activity generation failed:', err);
      setError(err.message || 'Failed to generate activities.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!generationId || !activities) return;
    try {
      setSaving(true);
      await api.put(`/ai/history/${generationId}`, {
        title: activities.title,
        status: 'SAVED',
        output: activities,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    if (!activities) return;
    let text = `# ${activities.title}\n\n**Instructions:** ${activities.instructions}\n\n`;
    if (activities.passageOrScript) {
      text += `**Contextual Passage:**\n${activities.passageOrScript}\n\n---\n\n`;
    }
    activities.items.forEach((item, i) => {
      text += `### ${i + 1}. ${item.prompt} (${item.points || 2} pts)\n`;
      if (item.options && item.options.length > 0) {
        item.options.forEach((opt) => {
          text += `- ${opt}\n`;
        });
      }
      text += `\n**Answer:** ${item.correctAnswer}\n**Explanation:** ${item.explanation || 'N/A'}\n\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Unified AI Studio Navigation Tabs */}
      <AIHeaderTabs />

      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/teacher/ai">
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-white">
              <ArrowLeft className="h-4 w-4" /> AI Hub
            </Button>
          </Link>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            AI Activity & Exercise Studio
          </h1>
        </div>
        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
          Interactive Exercises
        </Badge>
      </div>

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: Generation Controls */}
        <div className="lg:col-span-5 space-y-5">
          <Card className="border-slate-200 dark:border-slate-800 shadow-md">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                Exercise Configuration
              </CardTitle>
              <CardDescription className="text-xs">
                Select target skill, question typology, and difficulty for automatic generation.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleGenerate} className="space-y-4">
                {/* Topic */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Topic / Vocabulary Target *
                  </label>
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Environmental Issues & Conditionals"
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
                      Target Skill
                    </label>
                    <select
                      value={skill}
                      onChange={(e) => setSkill(e.target.value)}
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

                {/* Activity Typology */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Exercise / Question Type
                  </label>
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value)}
                    className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                  >
                    {activityTypes.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Item Count & Difficulty */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Number of Items
                    </label>
                    <select
                      value={itemCount}
                      onChange={(e) => setItemCount(Number(e.target.value))}
                      className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                    >
                      <option value={3}>3 Items</option>
                      <option value={5}>5 Items</option>
                      <option value={8}>8 Items</option>
                      <option value={10}>10 Items</option>
                      <option value={15}>15 Items</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Difficulty Level
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as any)}
                      className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                    >
                      <option value="EASY">Easy / Scaffolded</option>
                      <option value="NORMAL">Standard CEFR</option>
                      <option value="HARD">Challenging / Advanced</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-500">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={generating}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs py-5 shadow-lg"
                >
                  {generating ? (
                    <>
                      <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                      Generating Interactive Items...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Activity Set
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT PANEL: Generated Activity Output */}
        <div className="lg:col-span-7 space-y-4">
          {!activities && !generating && (
            <Card className="border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-12 text-center">
              <FileQuestion className="mx-auto h-12 w-12 text-emerald-400 opacity-60 mb-3" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                Generated Exercises Will Be Displayed Here
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Configure your exercise parameters and click <strong>Generate Activity Set</strong>. Exercises will be complete with point allocations, distractors, and teacher answer keys.
              </p>
            </Card>
          )}

          {generating && (
            <Card className="border-slate-200 dark:border-slate-800 p-12 text-center animate-pulse">
              <div className="h-10 w-10 mx-auto mb-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Building Interactive Questions & Answer Keys...
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2">
                Synthesizing CEFR {cefrLevel} distractors, checking syntactic alignment, and generating explanations.
              </p>
            </Card>
          )}

          {activities && !generating && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-600 text-white text-xs">{activities.cefrLevel}</Badge>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {activities.skill} • {activities.items.length} Items ({activities.estimatedMinutes} mins)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAnswers(!showAnswers)}
                    className="h-8 text-xs gap-1.5"
                  >
                    {showAnswers ? <EyeOff className="h-3.5 w-3.5 text-amber-500" /> : <Eye className="h-3.5 w-3.5" />}
                    {showAnswers ? 'Hide Answers' : 'Show Answers'}
                  </Button>

                  <Button variant="outline" size="sm" onClick={handleCopy} className="h-8 text-xs gap-1.5">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy Text'}
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleSaveDraft}
                    disabled={saving}
                    className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Draft'}
                  </Button>
                </div>
              </div>

              {/* Activity Document */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-md">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <CardTitle className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {activities.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    <strong>Instructions:</strong> {activities.instructions}
                  </CardDescription>

                  {activities.passageOrScript && (
                    <div className="mt-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 p-3.5 border border-slate-200 dark:border-slate-700 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                      <span className="font-bold text-primary-500 block mb-1">Stimulus / Reading Passage:</span>
                      {activities.passageOrScript}
                    </div>
                  )}
                </CardHeader>

                <CardContent className="space-y-4 pt-6 text-xs">
                  {activities.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/40 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {item.prompt}
                        </h4>
                        <Badge variant="secondary" className="text-[10px] shrink-0 font-mono">
                          {item.points || 2} Pts
                        </Badge>
                      </div>

                      {/* Options */}
                      {item.options && item.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {item.options.map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 font-medium"
                            >
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Answer Key & Explanation */}
                      {showAnswers && (
                        <div className="rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 p-3 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            Correct Answer: <span className="font-mono text-emerald-700 dark:text-emerald-200">{item.correctAnswer}</span>
                          </div>
                          {item.explanation && (
                            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 pl-5">
                              <strong>Pedagogical Note:</strong> {item.explanation}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
