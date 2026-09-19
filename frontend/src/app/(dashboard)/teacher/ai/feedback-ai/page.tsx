'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AIHeaderTabs } from '@/components/ai/ai-header-tabs';
import { RichTextEditor, RichTextRenderer } from '@/components/ui/rich-text-editor';
import {
  Award,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  Copy,
  Save,
  Check,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Send,
  ThumbsUp,
  TrendingUp,
} from 'lucide-react';

interface GeneratedFeedback {
  overallScoreSuggested?: number;
  strengths: string[];
  areasForImprovement: string[];
  specificComments: string;
  recommendedPracticeExercises: string[];
  suggestedTeacherNotes: string;
}

export default function AIFeedbackAssistantPage() {
  const [taskPrompt, setTaskPrompt] = useState('Write an essay describing your dream job and why you are suited for it.');
  const [studentSubmission, setStudentSubmission] = useState(
    'My dream job is to become a software engineer. I have studied computer science for two years and I enjoy solving complex problems. In my opinion, technology can improve education and healthcare. However, sometimes I struggle with difficult algorithms, but I always practice everyday to get better.'
  );
  const [cefrLevel, setCefrLevel] = useState('B1');
  const [skill, setSkill] = useState('WRITING');
  const [preliminaryScore, setPreliminaryScore] = useState(85);

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<GeneratedFeedback | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cefrLevels = ['PRE_A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const skills = ['WRITING', 'SPEAKING', 'GRAMMAR', 'READING'];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentSubmission.trim() || !taskPrompt.trim()) return;

    try {
      setGenerating(true);
      setError(null);
      setSaveSuccess(false);

      const res = await api.post<{ generationId: string; feedback: GeneratedFeedback }>('/ai/feedback/generate', {
        studentSubmission,
        taskPrompt,
        cefrLevel,
        skill,
        preliminaryScore: Number(preliminaryScore),
      });

      setFeedback(res.feedback);
      setGenerationId(res.generationId);
    } catch (err: any) {
      console.error('Feedback generation failed:', err);
      setError(err.message || 'Failed to generate feedback.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!generationId || !feedback) return;
    try {
      setSaving(true);
      await api.put(`/ai/history/${generationId}`, {
        title: `Feedback on: ${taskPrompt.slice(0, 30)}...`,
        status: 'SAVED',
        output: feedback,
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
    if (!feedback) return;
    const text = `Suggested Score: ${feedback.overallScoreSuggested || preliminaryScore}%\n\nStrengths:\n${feedback.strengths.map((s) => `- ${s}`).join('\n')}\n\nAreas for Improvement:\n${feedback.areasForImprovement.map((a) => `- ${a}`).join('\n')}\n\nTeacher Comments:\n${feedback.specificComments}\n\nRecommended Practice:\n${feedback.recommendedPracticeExercises.map((r) => `- ${r}`).join('\n')}`;

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
            <Award className="h-5 w-5 text-amber-500" />
            AI Student Feedback & Grading Assistant
          </h1>
        </div>
        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400">
          Pedagogical Coaching
        </Badge>
      </div>

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: Student Submission & Parameters */}
        <div className="lg:col-span-5 space-y-5">
          <Card className="border-slate-200 dark:border-slate-800 shadow-md">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Submission Analysis Inputs
              </CardTitle>
              <CardDescription className="text-xs">
                Provide student work to receive constructive strengths-based feedback and targeted next steps.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleGenerate} className="space-y-4">
                {/* Task Prompt */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Task Prompt / Assignment Question *
                  </label>
                  <Input
                    value={taskPrompt}
                    onChange={(e) => setTaskPrompt(e.target.value)}
                    required
                    className="text-sm font-medium"
                  />
                </div>

                {/* CEFR Level & Target Skill Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      CEFR Benchmark
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
                      Skill Mode
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

                {/* Preliminary Score */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Preliminary Score (%)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={preliminaryScore}
                    onChange={(e) => setPreliminaryScore(Number(e.target.value))}
                    className="text-xs font-semibold"
                  />
                </div>

                {/* Student Submission Text */}
                <RichTextEditor
                  label="Student Submission Text (or Speech Transcript)"
                  placeholder="Paste student writing, essay paragraphs, or dialogue transcription here..."
                  value={studentSubmission}
                  onChange={setStudentSubmission}
                  minRows={6}
                  category="general"
                />

                {error && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-500">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={generating}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold text-xs py-5 shadow-lg"
                >
                  {generating ? (
                    <>
                      <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Linguistic Competencies...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Feedback & Grading Insights
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT PANEL: Feedback Analysis Output */}
        <div className="lg:col-span-7 space-y-4">
          {!feedback && !generating && (
            <Card className="border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-12 text-center">
              <Award className="mx-auto h-12 w-12 text-amber-400 opacity-60 mb-3" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                Your Pedagogical Feedback Will Appear Here
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Paste student work on the left and click <strong>Generate Feedback</strong> to generate strengths analysis, constructive growth points, and student-facing commentary.
              </p>
            </Card>
          )}

          {generating && (
            <Card className="border-slate-200 dark:border-slate-800 p-12 text-center animate-pulse">
              <div className="h-10 w-10 mx-auto mb-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Evaluating Submission Against CEFR {cefrLevel} Standards...
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2">
                Checking vocabulary range, syntax errors, cohesion, and constructing actionable next steps.
              </p>
            </Card>
          )}

          {feedback && !generating && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-600 text-white text-xs">
                    Score: {feedback.overallScoreSuggested || preliminaryScore}%
                  </Badge>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    CEFR {cefrLevel} • {skill} Analysis
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy} className="h-8 text-xs gap-1.5">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy All'}
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

              {/* Feedback Document */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-md">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <CardTitle className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <ThumbsUp className="h-5 w-5 text-amber-500" />
                    Student Feedback & Coaching Report
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-5 pt-6 text-xs">
                  {/* Strengths & Growth Areas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Strengths */}
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-emerald-300 space-y-2">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        Identified Strengths
                      </h4>
                      <ul className="space-y-1.5 pl-2">
                        {feedback.strengths.map((str, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Growth Areas */}
                    <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-4 text-amber-300 space-y-2">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-amber-200 flex items-center gap-1.5">
                        <TrendingUp className="h-4 w-4 text-amber-400" />
                        Growth & Focus Areas
                      </h4>
                      <ul className="space-y-1.5 pl-2">
                        {feedback.areasForImprovement.map((area, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-amber-400 font-bold">•</span>
                            <span>{area}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Student Facing Comments */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 space-y-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Send className="h-4 w-4 text-primary-500" />
                      Student-Facing Personalized Commentary
                    </h4>
                    <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                      <RichTextRenderer content={feedback.specificComments} />
                    </div>
                  </div>

                  {/* Recommended Exercises */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 space-y-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-indigo-500" />
                      Recommended Practice Drills & Next Steps
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pl-2">
                      {feedback.recommendedPracticeExercises.map((ex, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-indigo-500 font-bold">✓</span>
                          <span>{ex}</span>
                        </li>
                      ))}
                    </ul>
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
