'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Award,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Volume2,
  Users,
  BarChart3,
  TrendingUp,
  Globe,
  Clock,
  Eye,
  RefreshCw,
  Search,
  Check,
  X,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';

interface DiagnosticQuestion {
  id: string;
  category: string;
  skill: string;
  difficulty: string;
  prompt: string;
  audioText?: string | null;
  options: string[];
  correctAnswer: string;
  explanation?: string | null;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
}

interface AttemptReviewItem {
  questionId: string;
  prompt: string;
  category: string;
  skill: string;
  difficulty: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
}

interface DiagnosticAttempt {
  id: string;
  ipAddress: string;
  userId?: string | null;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
  attemptNumber: number;
  score: number;
  totalQuestions: number;
  percentage: number | string;
  recommendedLevel: string;
  answers: AttemptReviewItem[];
  createdAt: string;
}

interface AnalyticsData {
  totalUniqueParticipants: number;
  totalAttempts: number;
  globalAverageScore: number;
  totalQuestionsCount: number;
  averageScoreByTry: Array<{
    tryLabel: string;
    tryNumber: number;
    attemptsCount: number;
    avgPercentage: number;
    avgScore: number;
  }>;
  levelDistribution: Record<string, number>;
  recentAttempts: DiagnosticAttempt[];
}

export default function TeacherDiagnosticQuizPage() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'questions'>('analytics');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [selectedLevelFilter, setSelectedLevelFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<DiagnosticQuestion | null>(null);
  const [selectedAttemptForReview, setSelectedAttemptForReview] = useState<DiagnosticAttempt | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form State for Create / Edit
  const [formData, setFormData] = useState({
    category: 'Grammar & Syntax',
    skill: 'Grammar',
    difficulty: 'B1',
    prompt: '',
    audioText: '',
    option0: '',
    option1: '',
    option2: '',
    option3: '',
    correctAnswer: '',
    explanation: '',
    orderIndex: 1,
    isActive: true,
  });

  const fetchData = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const [analyticsData, questionsData] = await Promise.all([
        apiClient.get<AnalyticsData>('/teacher/diagnostic-quiz/analytics'),
        apiClient.get<DiagnosticQuestion[]>('/teacher/diagnostic-quiz/questions'),
      ]);

      if (analyticsData) {
        setAnalytics(analyticsData);
      }
      if (Array.isArray(questionsData)) {
        setQuestions(questionsData);
      }
    } catch (err: any) {
      console.error('Failed to load diagnostic quiz data:', err);
      setActionError('Failed to fetch data from database. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingQuestion(null);
    setFormData({
      category: 'Grammar & Syntax',
      skill: 'Grammar',
      difficulty: 'B1',
      prompt: '',
      audioText: '',
      option0: '',
      option1: '',
      option2: '',
      option3: '',
      correctAnswer: '',
      explanation: '',
      orderIndex: questions.length + 1,
      isActive: true,
    });
    setIsQuestionModalOpen(true);
  };

  const openEditModal = (q: DiagnosticQuestion) => {
    setEditingQuestion(q);
    setFormData({
      category: q.category || 'General Assessment',
      skill: q.skill || 'Grammar',
      difficulty: q.difficulty || 'B1',
      prompt: q.prompt || '',
      audioText: q.audioText || '',
      option0: q.options[0] || '',
      option1: q.options[1] || '',
      option2: q.options[2] || '',
      option3: q.options[3] || '',
      correctAnswer: q.correctAnswer || '',
      explanation: q.explanation || '',
      orderIndex: q.orderIndex || 1,
      isActive: q.isActive,
    });
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    const optionsArray = [formData.option0, formData.option1, formData.option2, formData.option3].filter(
      (opt) => opt.trim().length > 0
    );

    if (optionsArray.length < 2) {
      setActionError('Please provide at least 2 non-empty multiple choice options.');
      return;
    }

    if (!formData.correctAnswer.trim()) {
      setActionError('Please specify the exact correct answer.');
      return;
    }

    const payload = {
      category: formData.category,
      skill: formData.skill,
      difficulty: formData.difficulty,
      prompt: formData.prompt,
      audioText: formData.audioText || null,
      options: optionsArray,
      correctAnswer: formData.correctAnswer,
      explanation: formData.explanation || null,
      orderIndex: Number(formData.orderIndex),
      isActive: formData.isActive,
    };

    try {
      if (editingQuestion) {
        await apiClient.put(`/teacher/diagnostic-quiz/questions/${editingQuestion.id}`, payload);
        setActionSuccess('Diagnostic question updated successfully!');
      } else {
        await apiClient.post('/teacher/diagnostic-quiz/questions', payload);
        setActionSuccess('Diagnostic question created successfully!');
      }
      setIsQuestionModalOpen(false);
      fetchData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      console.error('Error saving question:', err);
      setActionError(err.message || 'Failed to save question. Please try again.');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this diagnostic question?')) {
      return;
    }

    try {
      await apiClient.delete(`/teacher/diagnostic-quiz/questions/${id}`);
      setActionSuccess('Question deleted successfully.');
      fetchData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      console.error('Error deleting question:', err);
      setActionError('Failed to delete question.');
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesLevel = selectedLevelFilter === 'ALL' || q.difficulty === selectedLevelFilter;
    const matchesSearch =
      q.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.skill.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2ebe2] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-[#eff4ec] px-3 py-1 text-xs font-bold text-[#315b36] mb-2 border border-[#7ba27a]/30">
            <Sparkles className="h-3.5 w-3.5 text-[#315b36]" />
            <span>Placement & Assessment Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#2e3339]">
            Diagnostic Quiz & Placement Analytics
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Real-time candidate intake analytics, IP tracking, average marks per attempt number, and questions bank CRUD.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={fetchData}
            disabled={loading}
            className="border-[#e2ebe2] hover:bg-[#eff4ec] text-[#2e3339] text-xs font-semibold rounded-xl"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={openCreateModal}
            className="bg-[#315b36] hover:bg-[#254629] text-white text-xs font-bold rounded-xl shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Question
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="rounded-xl border border-[#7ba27a] bg-[#eff4ec] p-4 text-xs font-bold text-[#315b36] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#315b36]" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs font-bold text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#e2ebe2]">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'border-[#315b36] text-[#315b36]'
              : 'border-transparent text-slate-500 hover:text-[#2e3339]'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Attempts & Performance Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'questions'
              ? 'border-[#315b36] text-[#315b36]'
              : 'border-transparent text-slate-500 hover:text-[#2e3339]'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Questions Bank Studio ({questions.length})</span>
        </button>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-[#e2ebe2] bg-white p-5 space-y-3">
                <div className="h-4 w-28 rounded bg-[#eff4ec]" />
                <div className="h-8 w-20 rounded-lg bg-[#e2ebe2]" />
                <div className="h-3 w-36 rounded bg-[#eff4ec]" />
              </div>
            ))}
          </div>
          <div className="h-64 rounded-2xl border border-[#e2ebe2] bg-white p-6 space-y-4">
            <div className="h-5 w-48 rounded bg-[#e2ebe2]" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-[#eff4ec]/60 border border-[#e2ebe2]" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: ANALYTICS & ATTEMPTS */}
      {!loading && activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* Key KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-[#e2ebe2] shadow-sm rounded-2xl bg-white">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Unique Candidates
                  </p>
                  <p className="text-3xl font-black text-[#2e3339] mt-1">
                    {analytics?.totalUniqueParticipants ?? 0}
                  </p>
                  <p className="text-[11px] text-[#315b36] font-medium mt-0.5">
                    Distinct IP addresses / users
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eff4ec] text-[#315b36]">
                  <Users className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#e2ebe2] shadow-sm rounded-2xl bg-white">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Total Attempts / Tries
                  </p>
                  <p className="text-3xl font-black text-[#2e3339] mt-1">
                    {analytics?.totalAttempts ?? 0}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Total quiz submissions
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eff4ec] text-[#315b36]">
                  <Clock className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#e2ebe2] shadow-sm rounded-2xl bg-white">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Global Avg Score
                  </p>
                  <p className="text-3xl font-black text-[#315b36] mt-1">
                    {analytics?.globalAverageScore ?? 0}%
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Across all completed assessments
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eff4ec] text-[#315b36]">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#e2ebe2] shadow-sm rounded-2xl bg-white">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Active Questions
                  </p>
                  <p className="text-3xl font-black text-[#2e3339] mt-1">
                    {analytics?.totalQuestionsCount ?? questions.filter((q) => q.isActive).length}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Active in live public placement
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eff4ec] text-[#315b36]">
                  <Award className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Average Marks Obtained on Each Try Card */}
          <Card className="border-[#e2ebe2] shadow-sm rounded-2xl bg-white">
            <CardHeader className="p-5 sm:p-6 border-b border-[#e2ebe2]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg font-black text-[#2e3339]">
                    Average Marks Obtained on Each Try
                  </CardTitle>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Tracking progression and learning curve per candidate attempt number (Try #1 vs Try #2 vs Try #3 vs Try #4+)
                  </p>
                </div>
                <Badge className="bg-[#eff4ec] text-[#315b36] border-[#7ba27a]/40 font-bold text-xs self-start">
                  Score Evolution
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {analytics?.averageScoreByTry.map((item) => (
                  <div
                    key={item.tryNumber}
                    className="rounded-2xl border border-[#e2ebe2] bg-[#eff4ec]/30 p-4 space-y-3 transition hover:border-[#7ba27a]/60 hover:bg-[#eff4ec]/60"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#2e3339]">{item.tryLabel}</span>
                      <Badge variant="outline" className="text-[10px] font-bold border-[#7ba27a]/50 text-[#315b36]">
                        {item.attemptsCount} tries
                      </Badge>
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black text-[#315b36]">
                          {item.avgPercentage}%
                        </span>
                        <span className="text-xs font-bold text-slate-600">
                          Avg: {item.avgScore} pts
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#e2ebe2]">
                        <div
                          className="h-full bg-[#315b36] transition-all duration-500 rounded-full"
                          style={{ width: `${Math.min(100, item.avgPercentage)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Attempts & IP Log Table */}
          <Card className="border-[#e2ebe2] shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="p-5 sm:p-6 border-b border-[#e2ebe2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-black text-[#2e3339]">
                  Candidate Submissions & IP Log
                </CardTitle>
                <p className="text-xs text-slate-600 mt-0.5">
                  Full historical records with candidate IP address, try number, scores, and recommended CEFR level.
                </p>
              </div>
              <Badge className="bg-[#eff4ec] text-[#315b36] border-[#7ba27a]/40 font-bold text-xs self-start">
                {analytics?.recentAttempts.length ?? 0} Recorded Submissions
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#e2ebe2] bg-[#eff4ec]/50 text-[#2e3339] font-bold">
                      <th className="py-3 px-4">Candidate / User</th>
                      <th className="py-3 px-4">Client IP Address</th>
                      <th className="py-3 px-4 text-center">Try Number</th>
                      <th className="py-3 px-4 text-center">Score & Marks</th>
                      <th className="py-3 px-4 text-center">Recommended Level</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2ebe2]">
                    {analytics?.recentAttempts && analytics.recentAttempts.length > 0 ? (
                      analytics.recentAttempts.map((att) => (
                        <tr key={att.id} className="hover:bg-[#eff4ec]/30 transition">
                          <td className="py-3.5 px-4 font-semibold text-[#2e3339]">
                            {att.user ? (
                              <div>
                                <p className="font-bold text-[#315b36]">
                                  {att.user.firstName} {att.user.lastName}
                                </p>
                                <p className="text-[11px] text-slate-500">{att.user.email}</p>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <Globe className="h-3.5 w-3.5 text-[#7ba27a]" />
                                <span>Guest Candidate</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                            {att.ipAddress}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center justify-center rounded-lg bg-[#eff4ec] px-2.5 py-1 text-xs font-bold text-[#315b36] border border-[#7ba27a]/30">
                              Try #{att.attemptNumber}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-black text-[#2e3339]">
                              {att.score}/{att.totalQuestions}
                            </span>
                            <span className="ml-1.5 font-bold text-[#315b36]">
                              ({Number(att.percentage)}%)
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <Badge className="bg-[#315b36] text-white font-bold text-[11px]">
                              {att.recommendedLevel}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(att.createdAt).toLocaleString('en-US', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedAttemptForReview(att)}
                              className="h-7 text-[11px] rounded-lg border-[#e2ebe2] hover:bg-[#eff4ec] text-[#315b36] font-bold"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Review
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-slate-500 font-medium">
                          No diagnostic test attempts recorded yet. Candidates taking the test on the public site will appear here in real time.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: QUESTIONS BANK STUDIO (CRUD) */}
      {!loading && activeTab === 'questions' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-[#e2ebe2] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-[#2e3339]">Filter Level:</span>
              <div className="flex flex-wrap gap-1">
                {['ALL', 'PRE_A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevelFilter(lvl)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                      selectedLevelFilter === lvl
                        ? 'bg-[#315b36] text-white shadow-sm'
                        : 'bg-[#eff4ec] text-[#2e3339] hover:bg-[#e2ebe2]'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search prompt, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[#e2ebe2] pl-8 pr-3 py-1.5 text-xs text-[#2e3339] placeholder-slate-400 focus:border-[#315b36] focus:outline-none"
              />
            </div>
          </div>

          {/* Questions Table */}
          <Card className="border-[#e2ebe2] shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#e2ebe2] bg-[#eff4ec]/50 text-[#2e3339] font-bold">
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4 w-20">Level</th>
                      <th className="py-3 px-4">Category & Skill</th>
                      <th className="py-3 px-4">Prompt & Options</th>
                      <th className="py-3 px-4">Correct Answer</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2ebe2]">
                    {filteredQuestions.length > 0 ? (
                      filteredQuestions.map((q) => (
                        <tr key={q.id} className="hover:bg-[#eff4ec]/30 transition">
                          <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                            {q.orderIndex}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge className="bg-[#315b36] text-white font-bold text-[11px]">
                              {q.difficulty}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-[#2e3339]">{q.category}</p>
                            <p className="text-[11px] text-slate-500 font-medium">
                              Skill: <span className="font-semibold text-[#315b36]">{q.skill}</span>
                            </p>
                          </td>
                          <td className="py-3.5 px-4 max-w-md">
                            <p className="font-semibold text-[#2e3339] line-clamp-2">{q.prompt}</p>
                            {q.audioText && (
                              <p className="text-[11px] italic text-slate-500 mt-0.5 flex items-center gap-1">
                                <Volume2 className="h-3 w-3 text-[#7ba27a]" />
                                Audio: "{q.audioText}"
                              </p>
                            )}
                            <div className="mt-1 flex flex-wrap gap-1">
                              {q.options.map((opt, i) => (
                                <span
                                  key={i}
                                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium border ${
                                    opt === q.correctAnswer
                                      ? 'border-[#7ba27a] bg-[#eff4ec] text-[#315b36] font-bold'
                                      : 'border-slate-200 bg-slate-50 text-slate-600'
                                  }`}
                                >
                                  {String.fromCharCode(65 + i)}: {opt}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-[#315b36] bg-[#eff4ec] px-2 py-1 rounded-lg border border-[#7ba27a]/40">
                              {q.correctAnswer}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {q.isActive ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                                <Check className="h-3 w-3" /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditModal(q)}
                                className="h-7 w-7 p-0 rounded-lg border-[#e2ebe2] hover:bg-[#eff4ec] text-[#315b36]"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="h-7 w-7 p-0 rounded-lg border-rose-200 hover:bg-rose-50 text-rose-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-slate-500 font-medium">
                          No diagnostic questions found matching your filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CREATE / EDIT QUESTION MODAL */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#e2ebe2]">
            <div className="flex items-center justify-between border-b border-[#e2ebe2] pb-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-[#2e3339]">
                  {editingQuestion ? 'Edit Diagnostic Question' : 'Add New Diagnostic Question'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Changes will immediately sync to the live database and be visible on the public placement test.
                </p>
              </div>
              <button
                onClick={() => setIsQuestionModalOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2e3339] mb-1">
                    CEFR Level *
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full rounded-xl border border-[#e2ebe2] px-3 py-2 text-xs font-semibold text-[#2e3339] focus:border-[#315b36] focus:outline-none"
                  >
                    {['PRE_A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2e3339] mb-1">Skill *</label>
                  <select
                    value={formData.skill}
                    onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
                    className="w-full rounded-xl border border-[#e2ebe2] px-3 py-2 text-xs font-semibold text-[#2e3339] focus:border-[#315b36] focus:outline-none"
                  >
                    {['Grammar', 'Vocabulary', 'Listening', 'Reading & Syntax', 'Advanced Fluency', 'Pronunciation'].map(
                      (s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2e3339] mb-1">Order Index</label>
                  <input
                    type="number"
                    value={formData.orderIndex}
                    onChange={(e) => setFormData({ ...formData, orderIndex: Number(e.target.value) })}
                    className="w-full rounded-xl border border-[#e2ebe2] px-3 py-2 text-xs text-[#2e3339] focus:border-[#315b36] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2e3339] mb-1">Category Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grammar & Conditional Structures"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-xl border border-[#e2ebe2] px-3 py-2 text-xs text-[#2e3339] focus:border-[#315b36] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2e3339] mb-1">Question Prompt *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Choose the correct form: 'If she _____ earlier, she wouldn't have missed the flight.'"
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  className="w-full rounded-xl border border-[#e2ebe2] px-3 py-2 text-xs text-[#2e3339] focus:border-[#315b36] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2e3339] mb-1">
                  Audio Prompt / Dialogue Script (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Optional text to be spoken aloud by TTS audio player"
                  value={formData.audioText}
                  onChange={(e) => setFormData({ ...formData, audioText: e.target.value })}
                  className="w-full rounded-xl border border-[#e2ebe2] px-3 py-2 text-xs text-[#2e3339] focus:border-[#315b36] focus:outline-none"
                />
              </div>

              {/* Multiple Choice Options */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-[#2e3339]">
                  Multiple Choice Options *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500">Option A</span>
                    <input
                      type="text"
                      required
                      placeholder="Option A"
                      value={formData.option0}
                      onChange={(e) => setFormData({ ...formData, option0: e.target.value })}
                      className="w-full rounded-xl border border-[#e2ebe2] px-3 py-1.5 text-xs text-[#2e3339] focus:border-[#315b36] focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500">Option B</span>
                    <input
                      type="text"
                      required
                      placeholder="Option B"
                      value={formData.option1}
                      onChange={(e) => setFormData({ ...formData, option1: e.target.value })}
                      className="w-full rounded-xl border border-[#e2ebe2] px-3 py-1.5 text-xs text-[#2e3339] focus:border-[#315b36] focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500">Option C</span>
                    <input
                      type="text"
                      placeholder="Option C"
                      value={formData.option2}
                      onChange={(e) => setFormData({ ...formData, option2: e.target.value })}
                      className="w-full rounded-xl border border-[#e2ebe2] px-3 py-1.5 text-xs text-[#2e3339] focus:border-[#315b36] focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500">Option D</span>
                    <input
                      type="text"
                      placeholder="Option D"
                      value={formData.option3}
                      onChange={(e) => setFormData({ ...formData, option3: e.target.value })}
                      className="w-full rounded-xl border border-[#e2ebe2] px-3 py-1.5 text-xs text-[#2e3339] focus:border-[#315b36] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2e3339] mb-1">
                  Exact Correct Answer *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Must match one of the choices above exactly"
                    value={formData.correctAnswer}
                    onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                    className="flex-1 rounded-xl border border-[#e2ebe2] px-3 py-2 text-xs font-bold text-[#315b36] focus:border-[#315b36] focus:outline-none"
                  />
                  {/* Quick autofill buttons */}
                  {[formData.option0, formData.option1, formData.option2, formData.option3]
                    .filter((opt) => opt.trim().length > 0)
                    .map((opt, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setFormData({ ...formData, correctAnswer: opt })}
                        className="rounded-xl border border-[#7ba27a] bg-[#eff4ec] px-2.5 py-1 text-[11px] font-bold text-[#315b36] hover:bg-[#e2ebe2]"
                      >
                        Set Choice {String.fromCharCode(65 + i)}
                      </button>
                    ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2e3339] mb-1">
                  Academic Explanation (Shown to Candidate in Review)
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain why this is the correct answer and grammatical rule applied."
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  className="w-full rounded-xl border border-[#e2ebe2] px-3 py-2 text-xs text-[#2e3339] focus:border-[#315b36] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-[#315b36] focus:ring-[#315b36]"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-bold text-[#2e3339]">
                  Question is Active in Live Diagnostic Test
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e2ebe2]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="rounded-xl border-[#e2ebe2] text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-[#315b36] hover:bg-[#254629] text-white text-xs font-bold shadow-md"
                >
                  {editingQuestion ? 'Update Question' : 'Save to Database'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANDIDATE ATTEMPT DETAILED REVIEW MODAL */}
      {selectedAttemptForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#e2ebe2]">
            <div className="flex items-center justify-between border-b border-[#e2ebe2] pb-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-[#2e3339]">Candidate Assessment Review</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  IP: <span className="font-mono font-bold text-[#2e3339]">{selectedAttemptForReview.ipAddress}</span> • Try #{selectedAttemptForReview.attemptNumber} • Assigned Level:{' '}
                  <span className="font-bold text-[#315b36]">{selectedAttemptForReview.recommendedLevel}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedAttemptForReview(null)}
                className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {Array.isArray(selectedAttemptForReview.answers) && selectedAttemptForReview.answers.length > 0 ? (
                selectedAttemptForReview.answers.map((item, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl border p-4 space-y-2 ${
                      item.isCorrect
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : 'border-rose-200 bg-rose-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500">
                        Question {idx + 1} • {item.category} ({item.difficulty})
                      </span>
                      {item.isCorrect ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" /> Correct (+1)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-rose-700">
                          <XCircle className="h-4 w-4" /> Incorrect (0)
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-bold text-[#2e3339]">{item.prompt}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                        <span className="text-[10px] font-bold text-slate-500 block">
                          Candidate's Selected Answer:
                        </span>
                        <span
                          className={`font-bold ${
                            item.isCorrect ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {item.selectedAnswer || '(No answer selected)'}
                        </span>
                      </div>

                      <div className="rounded-xl border border-[#7ba27a]/40 bg-[#eff4ec] p-2.5">
                        <span className="text-[10px] font-bold text-[#315b36] block">
                          Official Correct Answer:
                        </span>
                        <span className="font-bold text-[#315b36]">{item.correctAnswer}</span>
                      </div>
                    </div>

                    {item.explanation && (
                      <p className="text-[11px] text-slate-600 italic pt-1 border-t border-slate-200/60">
                        💡 {item.explanation}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-xs text-slate-500 font-medium">
                  Detailed review items are not available for this record.
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end pt-4 border-t border-[#e2ebe2]">
              <Button
                onClick={() => setSelectedAttemptForReview(null)}
                className="rounded-xl bg-[#315b36] text-white text-xs font-bold"
              >
                Close Review
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
