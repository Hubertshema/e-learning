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
  ClipboardList,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  Copy,
  Save,
  Check,
  Layers,
  Award,
  BookOpen,
  Eye,
  EyeOff,
  Scale,
} from 'lucide-react';

interface AssessmentSection {
  sectionName: string;
  instructions: string;
  totalMarks: number;
  questions: Array<{
    prompt: string;
    type: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
    points?: number;
    rubricCriteria?: string[];
  }>;
}

interface GeneratedAssessment {
  title: string;
  assessmentType: string;
  cefrLevel: string;
  durationMinutes: number;
  totalMarks: number;
  sections: AssessmentSection[];
  answerKey: Array<{
    questionIndex: number;
    questionPrompt: string;
    correctAnswer: string;
    markingGuidance: string;
    marks: number;
  }>;
  markingScheme?: Array<{
    criterion: string;
    maxMarks: number;
    description: string;
  }>;
}

export default function AIAssessmentGeneratorPage() {
  const [title, setTitle] = useState('Mid-Term Progress Examination');
  const [topic, setTopic] = useState('B1 Intermediate English Mastery');
  const [assessmentType, setAssessmentType] = useState('Comprehensive Examination');
  const [cefrLevel, setCefrLevel] = useState('B1');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [totalMarks, setTotalMarks] = useState(50);

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [assessment, setAssessment] = useState<GeneratedAssessment | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [showAnswerKey, setShowAnswerKey] = useState(true);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cefrLevels = ['PRE_A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const assessmentTypes = [
    'Comprehensive Examination',
    'Mid-Term Progress Exam',
    'Final Course Exam',
    'Diagnostic / Placement Assessment',
    'Formative Skills Quiz',
    'Grammar & Vocabulary Test',
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    try {
      setGenerating(true);
      setError(null);
      setSaveSuccess(false);

      const res = await api.post<{ generationId: string; assessment: GeneratedAssessment }>('/ai/assessments/generate', {
        title,
        assessmentType,
        cefrLevel,
        topic,
        durationMinutes: Number(durationMinutes),
        totalMarks: Number(totalMarks),
      });

      setAssessment(res.assessment);
      setGenerationId(res.generationId);
    } catch (err: any) {
      console.error('Assessment generation failed:', err);
      setError(err.message || 'Failed to generate assessment.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!generationId || !assessment) return;
    try {
      setSaving(true);
      await api.put(`/ai/history/${generationId}`, {
        title: assessment.title,
        status: 'SAVED',
        output: assessment,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    if (!assessment) return;
    let text = `# ${assessment.title}\n**Type:** ${assessment.assessmentType} | **Level:** ${assessment.cefrLevel} | **Duration:** ${assessment.durationMinutes} mins | **Total Marks:** ${assessment.totalMarks}\n\n---\n\n`;

    assessment.sections.forEach((sec) => {
      text += `## ${sec.sectionName} (${sec.totalMarks} Marks)\n*${sec.instructions}*\n\n`;
      sec.questions.forEach((q, qi) => {
        text += `### ${qi + 1}. ${q.prompt} [${q.points || 2} marks]\n`;
        if (q.options) {
          q.options.forEach((opt) => (text += `- ${opt}\n`));
        }
        text += `\n`;
      });
      text += `\n---\n\n`;
    });

    text += `## Complete Answer Key & Marking Guidance\n\n`;
    assessment.answerKey.forEach((ak) => {
      text += `- **Q${ak.questionIndex}:** ${ak.correctAnswer} (${ak.marks} pts) — *${ak.markingGuidance}*\n`;
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
            <ClipboardList className="h-5 w-5 text-purple-500" />
            AI Assessment & Exam Studio
          </h1>
        </div>
        <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-400">
          Bloom's Taxonomy Engine
        </Badge>
      </div>

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: Generation Controls */}
        <div className="lg:col-span-5 space-y-5">
          <Card className="border-slate-200 dark:border-slate-800 shadow-md">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Assessment Parameters
              </CardTitle>
              <CardDescription className="text-xs">
                Configure exam type, curriculum topics, mark allocation, and test duration.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleGenerate} className="space-y-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Assessment Title *
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="text-sm font-medium"
                  />
                </div>

                {/* Topic */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Topic / Syllabus Coverage *
                  </label>
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Units 1-4: Tenses, Modals & Reading Skills"
                    required
                    className="text-sm"
                  />
                </div>

                {/* Assessment Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Assessment Format
                  </label>
                  <select
                    value={assessmentType}
                    onChange={(e) => setAssessmentType(e.target.value)}
                    className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold"
                  >
                    {assessmentTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CEFR Level & Marks Grid */}
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
                      Total Marks
                    </label>
                    <select
                      value={totalMarks}
                      onChange={(e) => setTotalMarks(Number(e.target.value))}
                      className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                    >
                      <option value={20}>20 Marks</option>
                      <option value={30}>30 Marks</option>
                      <option value={50}>50 Marks</option>
                      <option value={80}>80 Marks</option>
                      <option value={100}>100 Marks</option>
                    </select>
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Duration
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                  >
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes (1 Hour)</option>
                    <option value={90}>90 Minutes (1.5 Hours)</option>
                    <option value={120}>120 Minutes (2 Hours)</option>
                  </select>
                </div>

                {error && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-500">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={generating}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-xs py-5 shadow-lg"
                >
                  {generating ? (
                    <>
                      <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                      Generating Complete Exam...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Assessment & Key
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT PANEL: Generated Assessment */}
        <div className="lg:col-span-7 space-y-4">
          {!assessment && !generating && (
            <Card className="border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-12 text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-purple-400 opacity-60 mb-3" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                Your Complete Examination Document Will Appear Here
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Configure your exam parameters on the left and click <strong>Generate Assessment & Key</strong>. Sections, questions, scoring keys, and rubrics will be generated together.
              </p>
            </Card>
          )}

          {generating && (
            <Card className="border-slate-200 dark:border-slate-800 p-12 text-center animate-pulse">
              <div className="h-10 w-10 mx-auto mb-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Synthesizing Multi-Section Examination...
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2">
                Structuring Grammar, Vocabulary, Reading, and Writing sections with comprehensive marking criteria.
              </p>
            </Card>
          )}

          {assessment && !generating && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-600 text-white text-xs">{assessment.cefrLevel}</Badge>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {assessment.totalMarks} Total Marks • {assessment.durationMinutes} mins
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAnswerKey(!showAnswerKey)}
                    className="h-8 text-xs gap-1.5"
                  >
                    {showAnswerKey ? <EyeOff className="h-3.5 w-3.5 text-amber-500" /> : <Eye className="h-3.5 w-3.5" />}
                    {showAnswerKey ? 'Hide Answer Key' : 'Show Answer Key'}
                  </Button>

                  <Button variant="outline" size="sm" onClick={handleCopy} className="h-8 text-xs gap-1.5">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy Test'}
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

              {/* Assessment Paper */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-md">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-purple-500 uppercase tracking-wider">
                        {assessment.assessmentType}
                      </span>
                      <CardTitle className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {assessment.title}
                      </CardTitle>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <div>Time: {assessment.durationMinutes} mins</div>
                      <div className="font-bold text-slate-900 dark:text-white">Max Marks: {assessment.totalMarks}</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-6 text-xs">
                  {/* Sections */}
                  {assessment.sections.map((sec, sIdx) => (
                    <div key={sIdx} className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                        <h4 className="font-bold text-sm text-purple-600 dark:text-purple-400">
                          {sec.sectionName}
                        </h4>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {sec.totalMarks} Marks
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 italic">{sec.instructions}</p>

                      <div className="space-y-3 pt-1">
                        {sec.questions.map((q, qIdx) => (
                          <div
                            key={qIdx}
                            className="rounded-lg border border-slate-100 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/40 space-y-2"
                          >
                            <div className="flex items-start justify-between">
                              <span className="font-bold text-slate-900 dark:text-white">{q.prompt}</span>
                              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                [{q.points || 2} marks]
                              </span>
                            </div>

                            {q.options && q.options.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 pl-2">
                                {q.options.map((opt, oi) => (
                                  <div key={oi} className="text-[11px] text-slate-600 dark:text-slate-300">
                                    {opt}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Marking Scheme Breakdown */}
                  {assessment.markingScheme && (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 space-y-2">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Scale className="h-4 w-4 text-purple-500" />
                        Comprehensive Marking Scheme
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {assessment.markingScheme.map((ms, i) => (
                          <div key={i} className="rounded bg-slate-50 dark:bg-slate-800 p-2.5 text-[11px]">
                            <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                              <span>{ms.criterion}</span>
                              <span className="text-purple-500">{ms.maxMarks} Marks</span>
                            </div>
                            <p className="text-slate-500 text-[10px] mt-1">{ms.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Complete Answer Key Section */}
                  {showAnswerKey && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-emerald-300 space-y-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                        <Check className="h-4 w-4 text-emerald-400" />
                        Teacher's Master Answer Key & Guidance
                      </h4>
                      <div className="space-y-2 text-xs">
                        {assessment.answerKey.map((ak) => (
                          <div key={ak.questionIndex} className="rounded bg-emerald-900/30 p-2 border border-emerald-500/20">
                            <div className="flex items-center justify-between font-bold text-emerald-100">
                              <span>Question {ak.questionIndex}</span>
                              <span className="font-mono text-emerald-300">Award: {ak.marks} Mark(s)</span>
                            </div>
                            <div className="text-[11px] mt-1">
                              <strong>Expected Answer:</strong> {ak.correctAnswer}
                            </div>
                            <div className="text-[10px] text-emerald-400/80 mt-0.5">
                              <strong>Guidance:</strong> {ak.markingGuidance}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
