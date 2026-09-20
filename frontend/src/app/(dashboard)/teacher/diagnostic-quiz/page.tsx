'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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
  Wand2,
  Square,
  ArrowRight,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  FolderPlus,
  BookOpen,
  Settings2,
  HelpCircle,
  Save,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';

interface PlacementQuestion {
  id: string;
  placementTestId: string;
  level: string;
  skill: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  orderIndex: number;
}

interface PlacementTest {
  id: string;
  title: string;
  description?: string | null;
  courseId?: string | null;
  isActive: boolean;
  questionCount?: number;
  attemptCount?: number;
  createdAt: string;
  questions?: PlacementQuestion[];
}

interface AttemptReviewItem {
  questionId: string;
  prompt: string;
  skill: string;
  level: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

interface PlacementAttempt {
  id: string;
  placementTestId: string;
  placementTitle: string;
  studentId: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
  score: number;
  recommendedLevel: string;
  answers: AttemptReviewItem[];
  createdAt: string;
}

interface AnalyticsData {
  totalUniqueParticipants: number;
  totalAttempts: number;
  globalAverageScore: number;
  totalPlacementsCount: number;
  totalQuestionsCount: number;
  placementBatches: Array<{
    id: string;
    title: string;
    attemptCount: number;
    avgScore: number;
    questionCount: number;
  }>;
  levelDistribution: Record<string, number>;
  recentAttempts: PlacementAttempt[];
}

const SUGGESTED_PROMPTS = [
  'Create a 15-question placement test spanning A1 to C1 testing Grammar, Vocabulary, and Contextual Listening',
  'Generate a 10-question B1-B2 diagnostic assessment focusing on Conditionals, Tenses, and Modal Verbs',
  'Craft a 12-question diagnostic placement test on Business English, Collocations, and Idiomatic Usage',
  'Build an 8-question A1-A2 beginner diagnostic test testing basic syntax and everyday routine vocabulary',
];

const SKILL_OPTIONS = [
  'GRAMMAR',
  'VOCABULARY',
  'READING',
  'LISTENING',
  'SPEAKING',
  'WRITING',
  'PRONUNCIATION',
];

const LEVEL_OPTIONS = ['PRE_A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function TeacherPlacementStudioPage() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'batches'>('analytics');
  const [placements, setPlacements] = useState<PlacementTest[]>([]);
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null);
  const [selectedPlacementDetails, setSelectedPlacementDetails] = useState<PlacementTest | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  // Filters & Search
  const [selectedLevelFilter, setSelectedLevelFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Notifications
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modals
  const [isCreatePlacementModalOpen, setIsCreatePlacementModalOpen] = useState(false);
  const [editingPlacement, setEditingPlacement] = useState<PlacementTest | null>(null);
  const [placementFormData, setPlacementFormData] = useState({
    title: '',
    description: '',
    isActive: true,
  });

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<PlacementQuestion | null>(null);
  const [questionFormData, setQuestionFormData] = useState({
    level: 'B1',
    skill: 'GRAMMAR',
    prompt: '',
    option0: '',
    option1: '',
    option2: '',
    option3: '',
    correctAnswer: '',
    orderIndex: 1,
  });

  const [selectedAttemptForReview, setSelectedAttemptForReview] = useState<PlacementAttempt | null>(null);

  // AI Assistant Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiProgress, setAiProgress] = useState<{ step: number; message: string }>({ step: 0, message: '' });
  const [aiPrompt, setAiPrompt] = useState(SUGGESTED_PROMPTS[0]);
  const [aiLevel, setAiLevel] = useState('ALL');
  const [aiSkills, setAiSkills] = useState<string[]>(['GRAMMAR', 'VOCABULARY', 'LISTENING']);
  const [aiCount, setAiCount] = useState(10);
  const [aiTopic, setAiTopic] = useState('');
  const [aiGeneratedPreview, setAiGeneratedPreview] = useState<any[] | null>(null);
  const [isSavingAiBulk, setIsSavingAiBulk] = useState(false);
  const [transformingQuestionId, setTransformingQuestionId] = useState<string | null>(null);
  const [activeTransformDropdownId, setActiveTransformDropdownId] = useState<string | null>(null);

  const aiAbortController = useRef<AbortController | null>(null);

  // Initial Data Fetching
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [placementsData, analyticsData] = await Promise.all([
        apiClient.get<PlacementTest[]>('/teacher/placements'),
        apiClient.get<AnalyticsData>('/teacher/placements/analytics'),
      ]);

      setPlacements(Array.isArray(placementsData) ? placementsData : []);
      setAnalytics(analyticsData || null);

      // Select first placement if none selected
      if (Array.isArray(placementsData) && placementsData.length > 0 && !selectedPlacementId) {
        setSelectedPlacementId(placementsData[0].id);
        fetchPlacementDetails(placementsData[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load placement data:', err);
      setActionError(err.message || 'Failed to load placement data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlacementDetails = async (id: string) => {
    try {
      setQuestionsLoading(true);
      const data = await apiClient.get<PlacementTest>(`/teacher/placements/${id}`);
      if (data) {
        setSelectedPlacementDetails(data);
      }
    } catch (err: any) {
      console.error('Failed to fetch placement details:', err);
      setActionError('Failed to fetch placement questions.');
    } finally {
      setQuestionsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleSelectPlacement = (id: string) => {
    setSelectedPlacementId(id);
    fetchPlacementDetails(id);
  };

  // Create / Edit Placement Batch
  const openCreatePlacementModal = () => {
    setEditingPlacement(null);
    setPlacementFormData({
      title: `Placement #${placements.length + 1}: `,
      description: '',
      isActive: true,
    });
    setIsCreatePlacementModalOpen(true);
  };

  const openEditPlacementModal = (p: PlacementTest) => {
    setEditingPlacement(p);
    setPlacementFormData({
      title: p.title,
      description: p.description || '',
      isActive: p.isActive,
    });
    setIsCreatePlacementModalOpen(true);
  };

  const handleSavePlacement = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (!placementFormData.title.trim()) {
      setActionError('Please provide a title for the placement batch.');
      return;
    }

    try {
      if (editingPlacement) {
        await apiClient.put(`/teacher/placements/${editingPlacement.id}`, placementFormData);
        setActionSuccess('Placement batch updated successfully!');
      } else {
        const created = await apiClient.post<PlacementTest>('/teacher/placements', placementFormData);
        setActionSuccess('New placement batch created successfully!');
        if (created && created.id) {
          setSelectedPlacementId(created.id);
          fetchPlacementDetails(created.id);
        }
      }
      setIsCreatePlacementModalOpen(false);
      fetchAllData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      console.error('Error saving placement:', err);
      setActionError(err.message || 'Failed to save placement batch.');
    }
  };

  const handleDeletePlacement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this placement batch and all its questions?')) return;

    try {
      await apiClient.delete(`/teacher/placements/${id}`);
      setActionSuccess('Placement batch deleted successfully.');
      setSelectedPlacementId(null);
      setSelectedPlacementDetails(null);
      fetchAllData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      console.error('Error deleting placement:', err);
      setActionError('Failed to delete placement batch.');
    }
  };

  // Create / Edit Question inside Placement
  const openAddQuestionModal = () => {
    if (!selectedPlacementDetails) return;
    setEditingQuestion(null);
    setQuestionFormData({
      level: 'B1',
      skill: 'GRAMMAR',
      prompt: '',
      option0: '',
      option1: '',
      option2: '',
      option3: '',
      correctAnswer: '',
      orderIndex: (selectedPlacementDetails.questions?.length || 0) + 1,
    });
    setIsQuestionModalOpen(true);
  };

  const openEditQuestionModal = (q: PlacementQuestion) => {
    setEditingQuestion(q);
    setQuestionFormData({
      level: q.level,
      skill: q.skill,
      prompt: q.prompt,
      option0: q.options[0] || '',
      option1: q.options[1] || '',
      option2: q.options[2] || '',
      option3: q.options[3] || '',
      correctAnswer: q.correctAnswer,
      orderIndex: q.orderIndex,
    });
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlacementId) return;
    setActionError(null);

    const optionsArray = [
      questionFormData.option0,
      questionFormData.option1,
      questionFormData.option2,
      questionFormData.option3,
    ].filter((opt) => opt.trim().length > 0);

    if (optionsArray.length < 2) {
      setActionError('Please provide at least 2 options.');
      return;
    }

    if (!questionFormData.correctAnswer.trim()) {
      setActionError('Please specify the exact correct answer.');
      return;
    }

    const payload = {
      level: questionFormData.level,
      skill: questionFormData.skill,
      prompt: questionFormData.prompt,
      options: optionsArray,
      correctAnswer: questionFormData.correctAnswer,
      orderIndex: Number(questionFormData.orderIndex),
    };

    try {
      if (editingQuestion) {
        await apiClient.put(`/teacher/placements/questions/${editingQuestion.id}`, payload);
        setActionSuccess('Question updated successfully!');
      } else {
        await apiClient.post(`/teacher/placements/${selectedPlacementId}/questions`, payload);
        setActionSuccess('Question added to placement successfully!');
      }
      setIsQuestionModalOpen(false);
      fetchPlacementDetails(selectedPlacementId);
      fetchAllData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      console.error('Error saving question:', err);
      setActionError(err.message || 'Failed to save question.');
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm('Are you sure you want to remove this question from the placement test?')) return;
    try {
      await apiClient.delete(`/teacher/placements/questions/${qId}`);
      setActionSuccess('Question removed.');
      if (selectedPlacementId) {
        fetchPlacementDetails(selectedPlacementId);
      }
      fetchAllData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      console.error('Error deleting question:', err);
      setActionError('Failed to delete question.');
    }
  };

  // Reordering Questions
  const handleMoveQuestion = async (index: number, direction: 'up' | 'down') => {
    if (!selectedPlacementDetails || !selectedPlacementDetails.questions) return;
    const questions = [...selectedPlacementDetails.questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= questions.length) return;

    // Swap
    const temp = questions[index];
    questions[index] = questions[targetIndex];
    questions[targetIndex] = temp;

    const orderedIds = questions.map((q) => q.id);

    try {
      await apiClient.put(`/teacher/placements/${selectedPlacementDetails.id}/reorder`, {
        questionIds: orderedIds,
      });
      fetchPlacementDetails(selectedPlacementDetails.id);
    } catch (err) {
      console.error('Failed to reorder questions:', err);
    }
  };

  // Per-Question AI Transformation
  const handleTransformQuestion = async (q: PlacementQuestion, action: string) => {
    setTransformingQuestionId(q.id);
    setActiveTransformDropdownId(null);
    setActionError(null);

    try {
      const res = await apiClient.post<any>('/ai/quizzes/transform-question', {
        question: {
          id: q.id,
          prompt: q.prompt,
          options: q.options,
          correctAnswer: q.correctAnswer,
          difficulty: q.level,
        },
        action,
        targetLevel: q.level,
      });

      if (res) {
        await apiClient.put(`/teacher/placements/questions/${q.id}`, {
          prompt: res.prompt || q.prompt,
          options: res.options || q.options,
          correctAnswer: res.correctAnswer || q.correctAnswer,
          level: res.difficulty || q.level,
          skill: q.skill,
          orderIndex: q.orderIndex,
        });

        setActionSuccess(`Question transformed (${action}) and updated in database!`);
        if (selectedPlacementId) fetchPlacementDetails(selectedPlacementId);
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err: any) {
      console.error('Error transforming question:', err);
      setActionError(err.message || 'Failed to transform question.');
    } finally {
      setTransformingQuestionId(null);
    }
  };

  // AI Placement Generation
  const handleGenerateAiPlacement = async () => {
    if (isAiGenerating) return;
    setIsAiGenerating(true);
    setAiProgress({ step: 1, message: 'Connecting to AI placement engine...' });
    setActionError(null);
    setAiGeneratedPreview(null);

    const controller = new AbortController();
    aiAbortController.current = controller;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

      const response = await fetch(`${apiBase}/ai/diagnostic/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          instruction: aiPrompt,
          cefrLevel: aiLevel,
          skills: aiSkills,
          count: aiCount,
          topic: aiTopic,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'AI generation failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Streaming response not available');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = 'message';
        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.replace('event:', '').trim();
          } else if (line.startsWith('data:')) {
            const dataStr = line.replace('data:', '').trim();
            if (dataStr) {
              try {
                const data = JSON.parse(dataStr);
                if (currentEvent === 'progress') {
                  setAiProgress({ step: data.step, message: data.message });
                } else if (currentEvent === 'complete') {
                  if (Array.isArray(data.questions)) {
                    setAiGeneratedPreview(data.questions);
                  }
                }
              } catch (e) {
                console.warn('Failed to parse SSE line:', e);
              }
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setActionSuccess('Generation stopped by teacher.');
      } else {
        console.error('AI generation error:', err);
        setActionError(err.message || 'Failed to generate questions.');
      }
    } finally {
      setIsAiGenerating(false);
      aiAbortController.current = null;
    }
  };

  const handleSaveAiQuestionsToPlacement = async () => {
    if (!selectedPlacementId || !aiGeneratedPreview || aiGeneratedPreview.length === 0) return;

    try {
      setIsSavingAiBulk(true);
      for (const q of aiGeneratedPreview) {
        await apiClient.post(`/teacher/placements/${selectedPlacementId}/questions`, {
          level: q.difficulty || 'B1',
          skill: q.skill?.toUpperCase() || 'GRAMMAR',
          prompt: q.prompt,
          options: q.options,
          correctAnswer: q.correctAnswer,
        });
      }

      setActionSuccess(`Added ${aiGeneratedPreview.length} questions to ${selectedPlacementDetails?.title}!`);
      setIsAiModalOpen(false);
      setAiGeneratedPreview(null);
      fetchPlacementDetails(selectedPlacementId);
      fetchAllData();
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      console.error('Error saving generated questions:', err);
      setActionError(err.message || 'Failed to save questions to placement.');
    } finally {
      setIsSavingAiBulk(false);
    }
  };

  const filteredQuestions = (selectedPlacementDetails?.questions || []).filter((q) => {
    const matchesLevel = selectedLevelFilter === 'ALL' || q.level === selectedLevelFilter;
    const matchesSearch =
      q.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
            Placement Analytics & Batch Management
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Track student intake performance by placement batch, manage Placement #1, #2, #3... questions dynamically, and generate assessments with AI.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            onClick={fetchAllData}
            disabled={loading}
            className="border-[#e2ebe2] hover:bg-[#eff4ec] text-[#2e3339] text-xs font-semibold rounded-xl"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Link href="/teacher/diagnostic-quiz/create">
            <Button
              className="bg-[#315b36] hover:bg-[#254629] text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Question Studio
            </Button>
          </Link>

          <Button
            variant="outline"
            onClick={openCreatePlacementModal}
            className="border-[#e2ebe2] hover:bg-[#eff4ec] text-[#2e3339] text-xs font-semibold rounded-xl flex items-center gap-1.5"
          >
            <FolderPlus className="h-4 w-4" />
            Create Placement Batch
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="rounded-xl border border-[#7ba27a] bg-[#eff4ec] p-4 text-xs font-bold text-[#315b36] flex items-center justify-between animate-in fade-in">
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
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs font-bold text-rose-800 flex items-center justify-between animate-in fade-in">
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
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 ${activeTab === 'analytics'
              ? 'border-[#315b36] text-[#315b36]'
              : 'border-transparent text-slate-500 hover:text-[#2e3339]'
            }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Placement Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('batches')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 ${activeTab === 'batches'
              ? 'border-[#315b36] text-[#315b36]'
              : 'border-transparent text-slate-500 hover:text-[#2e3339]'
            }`}
        >
          <Layers className="h-4 w-4" />
          <span>Placement Batches & Questions Studio ({placements.length})</span>
        </button>
      </div>

      {/* TAB 1: PLACEMENT ANALYTICS */}
      {activeTab === 'analytics' && (
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
                    Distinct student takers
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
                    Total Attempts
                  </p>
                  <p className="text-3xl font-black text-[#2e3339] mt-1">
                    {analytics?.totalAttempts ?? 0}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Total placement submissions
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
                    Across all placement tests
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
                    Placement Batches
                  </p>
                  <p className="text-3xl font-black text-[#2e3339] mt-1">
                    {analytics?.totalPlacementsCount ?? placements.length}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Active placement tests
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eff4ec] text-[#315b36]">
                  <Award className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance by Placement Batch Cards */}
          <Card className="border-[#e2ebe2] shadow-sm rounded-2xl bg-white">
            <CardHeader className="p-5 sm:p-6 border-b border-[#e2ebe2]">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black text-[#2e3339]">
                    Performance by Placement Batch
                  </CardTitle>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Evaluation breakdown across Placement #1, Placement #2, Placement #3...
                  </p>
                </div>
                <Badge className="bg-[#eff4ec] text-[#315b36] border-[#7ba27a]/40 font-bold text-xs">
                  {analytics?.placementBatches.length || placements.length} Batches Configured
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {(analytics?.placementBatches || placements.map(p => ({
                  id: p.id,
                  title: p.title,
                  attemptCount: p.attemptCount || 0,
                  avgScore: 0,
                  questionCount: p.questionCount || 0,
                }))).map((batch, idx) => (
                  <div
                    key={batch.id}
                    className="rounded-2xl border border-[#e2ebe2] bg-[#eff4ec]/30 p-5 space-y-4 hover:border-[#7ba27a]/60 hover:bg-[#eff4ec]/60 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#7ba27a]">
                          Batch #{idx + 1}
                        </span>
                        <h4 className="text-sm font-black text-[#2e3339] line-clamp-1 mt-0.5">
                          {batch.title}
                        </h4>
                      </div>
                      <Badge className="bg-white border-[#e2ebe2] text-[#315b36] font-bold text-[10px]">
                        {batch.questionCount} Questions
                      </Badge>
                    </div>

                    <div className="flex items-baseline justify-between pt-2 border-t border-[#e2ebe2]">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Avg Score</p>
                        <p className="text-2xl font-black text-[#315b36]">{batch.avgScore}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Submissions</p>
                        <p className="text-lg font-bold text-[#2e3339]">{batch.attemptCount} tries</p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleSelectPlacement(batch.id);
                        setActiveTab('batches');
                      }}
                      className="w-full rounded-xl border-[#7ba27a]/40 bg-white hover:bg-[#eff4ec] text-[#315b36] text-xs font-bold"
                    >
                      Manage Questions & Reorder
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Submissions Table */}
          <Card className="border-[#e2ebe2] shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="p-5 sm:p-6 border-b border-[#e2ebe2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-black text-[#2e3339]">
                  Student Placement Submissions Log
                </CardTitle>
                <p className="text-xs text-slate-600 mt-0.5">
                  Historical placement test attempts evaluated against the database.
                </p>
              </div>
              <Badge className="bg-[#eff4ec] text-[#315b36] border-[#7ba27a]/40 font-bold text-xs self-start">
                {analytics?.recentAttempts.length ?? 0} Recorded Attempts
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#e2ebe2] bg-[#eff4ec]/50 text-[#2e3339] font-bold">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Placement Batch</th>
                      <th className="py-3 px-4 text-center">Score</th>
                      <th className="py-3 px-4 text-center">Assigned Level</th>
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
                              <span className="text-slate-600">Enrolled Student</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#2e3339]">
                            {att.placementTitle}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-black text-[#315b36] text-sm">
                              {att.score}%
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
                        <td colSpan={6} className="text-center py-10 text-slate-500 font-medium">
                          No student placement submissions recorded yet. When students complete a placement test, attempts will appear here in real time.
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

      {/* TAB 2: PLACEMENT BATCHES & QUESTIONS STUDIO */}
      {activeTab === 'batches' && (
        <div className="space-y-6">
          {/* Placement Batches Cards Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Select Placement Batch:
              </span>
              <Button
                size="sm"
                onClick={openCreatePlacementModal}
                className="bg-[#315b36] hover:bg-[#254629] text-white text-xs font-bold rounded-xl h-7"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                New Placement
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {placements.map((p, idx) => {
                const isSelected = selectedPlacementId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPlacement(p.id)}
                    className={`rounded-2xl p-4 text-left transition-all border ${isSelected
                        ? 'border-[#315b36] bg-[#eff4ec] shadow-md ring-2 ring-[#315b36]/30'
                        : 'border-[#e2ebe2] bg-white hover:border-[#7ba27a]/60 hover:bg-[#eff4ec]/30'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#315b36]">
                        Placement #{idx + 1}
                      </span>
                      {p.isActive ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-[#2e3339] mt-1 line-clamp-1">{p.title}</p>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-[#e2ebe2]/60">
                      <span>{p.questionCount || 0} Questions</span>
                      <span>{p.attemptCount || 0} Attempts</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Placement Details & Questions Studio */}
          {selectedPlacementDetails && (
            <div className="space-y-6 pt-2">
              {/* Batch Banner & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-[#e2ebe2] bg-white p-6 shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-[#2e3339]">
                      {selectedPlacementDetails.title}
                    </h2>
                    <Badge className="bg-[#315b36] text-white text-xs font-bold">
                      {selectedPlacementDetails.questions?.length || 0} Questions
                    </Badge>
                  </div>
                  {selectedPlacementDetails.description && (
                    <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                      {selectedPlacementDetails.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditPlacementModal(selectedPlacementDetails)}
                    className="rounded-xl border-[#e2ebe2] text-xs font-bold text-slate-700 hover:bg-[#eff4ec]"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                    Edit Batch
                  </Button>

                  <Link href={`/teacher/diagnostic-quiz/create?placementId=${selectedPlacementDetails.id}&ai=true`}>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-[#315b36] to-[#4a8352] hover:from-[#254629] hover:to-[#38643e] text-white text-xs font-bold rounded-xl shadow-sm"
                    >
                      <Wand2 className="h-3.5 w-3.5 mr-1" />
                      AI Generate Questions
                    </Button>
                  </Link>

                  <Link href={`/teacher/diagnostic-quiz/create?placementId=${selectedPlacementDetails.id}`}>
                    <Button
                      size="sm"
                      className="bg-[#315b36] hover:bg-[#254629] text-white text-xs font-bold rounded-xl shadow-sm"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Question
                    </Button>
                  </Link>

                  {placements.length > 1 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeletePlacement(selectedPlacementDetails.id)}
                      className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Questions Filters */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-[#e2ebe2] bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  <span className="text-xs font-bold text-[#2e3339] whitespace-nowrap">Filter Level:</span>
                  <div className="flex flex-wrap gap-1">
                    {['ALL', 'PRE_A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setSelectedLevelFilter(lvl)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${selectedLevelFilter === lvl
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
                    placeholder="Search prompt or skill..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-[#e2ebe2] pl-8 pr-3 py-1.5 text-xs text-[#2e3339] placeholder-slate-400 focus:border-[#315b36] focus:outline-none"
                  />
                </div>
              </div>

              {/* Questions List for this Placement */}
              <Card className="border-[#e2ebe2] shadow-sm rounded-2xl bg-white overflow-hidden">
                <CardContent className="p-0">
                  {questionsLoading ? (
                    <div className="p-8 text-center text-xs text-slate-500 font-medium animate-pulse">
                      Loading placement questions...
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-[#e2ebe2] bg-[#eff4ec]/50 text-[#2e3339] font-bold">
                            <th className="py-3 px-4 w-16 text-center">Order</th>
                            <th className="py-3 px-4 w-24">Level & Skill</th>
                            <th className="py-3 px-4">Question Prompt & Options</th>
                            <th className="py-3 px-4">Correct Answer</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e2ebe2]">
                          {filteredQuestions.length > 0 ? (
                            filteredQuestions.map((q, idx) => {
                              const isTransforming = transformingQuestionId === q.id;

                              return (
                                <tr key={q.id} className="hover:bg-[#eff4ec]/30 transition">
                                  {/* Order & Reorder Arrows */}
                                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                    <div className="flex items-center justify-center gap-1">
                                      <span className="font-bold text-slate-700 w-5">
                                        {q.orderIndex}
                                      </span>
                                      <div className="flex flex-col gap-0.5">
                                        <button
                                          disabled={idx === 0}
                                          onClick={() => handleMoveQuestion(idx, 'up')}
                                          className="p-0.5 hover:bg-[#eff4ec] rounded text-slate-500 disabled:opacity-30"
                                        >
                                          <ArrowUp className="h-3 w-3" />
                                        </button>
                                        <button
                                          disabled={idx === filteredQuestions.length - 1}
                                          onClick={() => handleMoveQuestion(idx, 'down')}
                                          className="p-0.5 hover:bg-[#eff4ec] rounded text-slate-500 disabled:opacity-30"
                                        >
                                          <ArrowDown className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>
                                  </td>

                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <Badge className="bg-[#315b36] text-white font-bold text-[11px] block w-fit">
                                      {q.level}
                                    </Badge>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase mt-1 block">
                                      {q.skill}
                                    </span>
                                  </td>

                                  <td className="py-3.5 px-4 max-w-lg">
                                    <p className="font-bold text-[#2e3339] leading-relaxed">
                                      {q.prompt}
                                    </p>
                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                      {q.options.map((opt, i) => (
                                        <span
                                          key={i}
                                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium border ${opt === q.correctAnswer
                                              ? 'border-[#7ba27a] bg-[#eff4ec] text-[#315b36] font-bold'
                                              : 'border-slate-200 bg-slate-50 text-slate-600'
                                            }`}
                                        >
                                          {String.fromCharCode(65 + i)}: {opt}
                                        </span>
                                      ))}
                                    </div>
                                  </td>

                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <span className="font-bold text-[#315b36] bg-[#eff4ec] px-2 py-1 rounded-lg border border-[#7ba27a]/40 inline-block">
                                      {q.correctAnswer}
                                    </span>
                                  </td>

                                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {/* AI Transform Dropdown */}
                                      <div className="relative inline-block text-left">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          disabled={isTransforming}
                                          onClick={() =>
                                            setActiveTransformDropdownId(
                                              activeTransformDropdownId === q.id ? null : q.id
                                            )
                                          }
                                          className="h-7 px-2 text-[11px] rounded-lg border-[#7ba27a]/50 bg-[#eff4ec] text-[#315b36] font-bold hover:bg-[#e2ebe2]"
                                        >
                                          {isTransforming ? (
                                            <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                                          ) : (
                                            <Wand2 className="h-3 w-3 mr-1" />
                                          )}
                                          AI Tools
                                          <ChevronDown className="h-3 w-3 ml-1" />
                                        </Button>

                                        {activeTransformDropdownId === q.id && (
                                          <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl bg-white p-1.5 shadow-xl border border-[#e2ebe2] text-left animate-in fade-in">
                                            <button
                                              onClick={() => handleTransformQuestion(q, 'MAKE_EASIER')}
                                              className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-[#2e3339] hover:bg-[#eff4ec] hover:text-[#315b36] rounded-lg flex items-center gap-1.5"
                                            >
                                              <span>📉</span> Make Easier
                                            </button>
                                            <button
                                              onClick={() => handleTransformQuestion(q, 'MAKE_HARDER')}
                                              className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-[#2e3339] hover:bg-[#eff4ec] hover:text-[#315b36] rounded-lg flex items-center gap-1.5"
                                            >
                                              <span>📈</span> Make Harder
                                            </button>
                                            <button
                                              onClick={() => handleTransformQuestion(q, 'IMPROVE')}
                                              className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-[#2e3339] hover:bg-[#eff4ec] hover:text-[#315b36] rounded-lg flex items-center gap-1.5"
                                            >
                                              <span>✨</span> Polish & Improve
                                            </button>
                                          </div>
                                        )}
                                      </div>

                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openEditQuestionModal(q)}
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
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={5} className="text-center py-12 text-slate-500 font-medium">
                                <p className="text-sm font-bold text-[#2e3339]">
                                  No questions in this placement batch yet.
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                  Use the Question Studio to craft rich questions or generate with AI.
                                </p>
                                <div className="mt-4 flex items-center justify-center gap-2">
                                  <Link href={`/teacher/diagnostic-quiz/create?placementId=${selectedPlacementDetails.id}&ai=true`}>
                                    <Button size="sm" variant="outline" className="text-xs font-bold rounded-xl border-[#7ba27a]/60 bg-[#eff4ec] text-[#315b36]">
                                      <Wand2 className="h-3.5 w-3.5 mr-1" />
                                      AI Placement Assistant
                                    </Button>
                                  </Link>
                                  <Link href={`/teacher/diagnostic-quiz/create?placementId=${selectedPlacementDetails.id}`}>
                                    <Button size="sm" className="bg-[#315b36] hover:bg-[#254629] text-white text-xs font-bold rounded-xl">
                                      <Plus className="h-3.5 w-3.5 mr-1" />
                                      Open Question Studio
                                    </Button>
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT PLACEMENT BATCH MODAL */}
      {isCreatePlacementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#e2ebe2]">
            <div className="flex items-center justify-between border-b border-[#e2ebe2] pb-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-[#2e3339]">
                  {editingPlacement ? 'Edit Placement Batch' : 'Create Placement Batch'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Placement batches organize intake tests (e.g. Placement #1, Placement #2).
                </p>
              </div>
              <button
                onClick={() => setIsCreatePlacementModalOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlacement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2e3339] mb-1">
                  Placement Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Placement #3: Business English Assessment"
                  value={placementFormData.title}
                  onChange={(e) => setPlacementFormData({ ...placementFormData, title: e.target.value })}
                  className="w-full rounded-xl border border-[#e2ebe2] px-3 py-2 text-xs font-bold text-[#2e3339] focus:border-[#315b36] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2e3339] mb-1">
                  Description / Purpose
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Multi-skill assessment designed for adult executive learners..."
                  value={placementFormData.description}
                  onChange={(e) => setPlacementFormData({ ...placementFormData, description: e.target.value })}
                  className="w-full rounded-xl border border-[#e2ebe2] px-3 py-2 text-xs text-[#2e3339] focus:border-[#315b36] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="placementActiveToggle"
                  checked={placementFormData.isActive}
                  onChange={(e) => setPlacementFormData({ ...placementFormData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-[#315b36] focus:ring-[#315b36]"
                />
                <label htmlFor="placementActiveToggle" className="text-xs font-bold text-[#2e3339]">
                  Placement Batch is Active & Available for Candidates
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e2ebe2]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreatePlacementModalOpen(false)}
                  className="rounded-xl border-[#e2ebe2] text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-[#315b36] hover:bg-[#254629] text-white text-xs font-bold shadow-md"
                >
                  {editingPlacement ? 'Update Batch' : 'Create Batch'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT QUESTION MODAL */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#e2ebe2]">
            <div className="flex items-center justify-between border-b border-[#e2ebe2] pb-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-[#2e3339]">
                  {editingQuestion ? 'Edit Question' : 'Add Question to Placement'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Belongs to: <span className="font-bold text-[#315b36]">{selectedPlacementDetails?.title}</span>
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
                    value={questionFormData.level}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, level: e.target.value })}
                    className="w-full rounded-xl border border-[#e2ebe2] px-3 py-2 text-xs font-semibold text-[#2e3339] focus:border-[#315b36] focus:outline-none"
                  >
                    {LEVEL_OPTIONS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2e3339] mb-1">Skill *</label>
                  <select
                    value={questionFormData.skill}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, skill: e.target.value })}
                    className="w-full rounded-xl border border-[#e2ebe2] px-3 py-2 text-xs font-semibold text-[#2e3339] focus:border-[#315b36] focus:outline-none"
                  >
                    {SKILL_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2e3339] mb-1">Order Index</label>
                  <input
                    type="number"
                    value={questionFormData.orderIndex}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, orderIndex: Number(e.target.value) })}
                    className="w-full rounded-xl border border-[#e2ebe2] px-3 py-2 text-xs text-[#2e3339] focus:border-[#315b36] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2e3339] mb-1">Question Prompt *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Choose the correct form: 'She _____ English every morning before breakfast.'"
                  value={questionFormData.prompt}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, prompt: e.target.value })}
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
                      value={questionFormData.option0}
                      onChange={(e) => setQuestionFormData({ ...questionFormData, option0: e.target.value })}
                      className="w-full rounded-xl border border-[#e2ebe2] px-3 py-1.5 text-xs text-[#2e3339] focus:border-[#315b36] focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500">Option B</span>
                    <input
                      type="text"
                      required
                      placeholder="Option B"
                      value={questionFormData.option1}
                      onChange={(e) => setQuestionFormData({ ...questionFormData, option1: e.target.value })}
                      className="w-full rounded-xl border border-[#e2ebe2] px-3 py-1.5 text-xs text-[#2e3339] focus:border-[#315b36] focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500">Option C</span>
                    <input
                      type="text"
                      placeholder="Option C"
                      value={questionFormData.option2}
                      onChange={(e) => setQuestionFormData({ ...questionFormData, option2: e.target.value })}
                      className="w-full rounded-xl border border-[#e2ebe2] px-3 py-1.5 text-xs text-[#2e3339] focus:border-[#315b36] focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500">Option D</span>
                    <input
                      type="text"
                      placeholder="Option D"
                      value={questionFormData.option3}
                      onChange={(e) => setQuestionFormData({ ...questionFormData, option3: e.target.value })}
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
                    value={questionFormData.correctAnswer}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, correctAnswer: e.target.value })}
                    className="flex-1 rounded-xl border border-[#e2ebe2] px-3 py-2 text-xs font-bold text-[#315b36] focus:border-[#315b36] focus:outline-none"
                  />
                  {[questionFormData.option0, questionFormData.option1, questionFormData.option2, questionFormData.option3]
                    .filter((opt) => opt.trim().length > 0)
                    .map((opt, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setQuestionFormData({ ...questionFormData, correctAnswer: opt })}
                        className="rounded-xl border border-[#7ba27a] bg-[#eff4ec] px-2.5 py-1 text-[11px] font-bold text-[#315b36] hover:bg-[#e2ebe2]"
                      >
                        Set {String.fromCharCode(65 + i)}
                      </button>
                    ))}
                </div>
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
                  {editingQuestion ? 'Update Question' : 'Add Question'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI GENERATE QUESTIONS MODAL */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#e2ebe2]">
            <div className="flex items-center justify-between border-b border-[#e2ebe2] pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eff4ec] text-[#315b36] border border-[#7ba27a]/40">
                  <Wand2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#2e3339]">
                    AI Question Generator
                  </h2>
                  <p className="text-xs text-slate-500">
                    Target: <span className="font-bold text-[#315b36]">{selectedPlacementDetails?.title}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (isAiGenerating && aiAbortController.current) {
                    aiAbortController.current.abort();
                  }
                  setIsAiModalOpen(false);
                }}
                className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!aiGeneratedPreview && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-[#2e3339] mb-1.5">
                    Teacher Instruction Prompt *
                  </label>
                  <textarea
                    rows={3}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full rounded-2xl border border-[#e2ebe2] p-3 text-xs text-[#2e3339] focus:border-[#315b36] focus:outline-none"
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {SUGGESTED_PROMPTS.map((prompt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAiPrompt(prompt)}
                        className="rounded-lg bg-[#eff4ec] px-2.5 py-1 text-[11px] font-medium text-[#315b36] hover:bg-[#e2ebe2] text-left"
                      >
                        💡 {prompt.slice(0, 50)}...
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#2e3339] mb-1">
                      CEFR Placement Scope
                    </label>
                    <select
                      value={aiLevel}
                      onChange={(e) => setAiLevel(e.target.value)}
                      className="w-full rounded-xl border border-[#e2ebe2] px-3 py-2 text-xs font-semibold text-[#2e3339] focus:border-[#315b36] focus:outline-none"
                    >
                      <option value="ALL">All Levels (Multi-Level Ladder)</option>
                      {LEVEL_OPTIONS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          Level {lvl} Only
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2e3339] mb-1">
                      Question Count
                    </label>
                    <input
                      type="number"
                      min={3}
                      max={25}
                      value={aiCount}
                      onChange={(e) => setAiCount(Math.max(3, Math.min(25, Number(e.target.value))))}
                      className="w-full rounded-xl border border-[#e2ebe2] px-3 py-2 text-xs font-bold text-[#2e3339] focus:border-[#315b36] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2e3339] mb-1">
                      Topic Focus (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Workplace Idioms"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      className="w-full rounded-xl border border-[#e2ebe2] px-3 py-2 text-xs text-[#2e3339] focus:border-[#315b36] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Progress Bar & Stop Button */}
                {isAiGenerating && (
                  <div className="rounded-2xl border border-[#7ba27a] bg-[#eff4ec] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#315b36]">
                        <RefreshCw className="h-4 w-4 animate-spin text-[#315b36]" />
                        <span>{aiProgress.message || 'Generating questions...'}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => aiAbortController.current?.abort()}
                        className="rounded-xl border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold"
                      >
                        <Square className="h-3 w-3 mr-1 fill-current" />
                        Stop
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-[#e2ebe2]">
                  <Button
                    disabled={isAiGenerating || !aiPrompt.trim()}
                    onClick={handleGenerateAiPlacement}
                    className="rounded-xl bg-[#315b36] hover:bg-[#254629] text-white text-xs font-bold shadow-md px-6 py-2.5"
                  >
                    {isAiGenerating ? 'Generating...' : 'Generate Questions'}
                  </Button>
                </div>
              </div>
            )}

            {aiGeneratedPreview && (
              <div className="space-y-6 animate-in zoom-in-95">
                <div className="bg-[#eff4ec] p-4 rounded-2xl border border-[#7ba27a]/40 flex items-center justify-between">
                  <h3 className="text-sm font-black text-[#315b36]">
                    Generated {aiGeneratedPreview.length} Questions for {selectedPlacementDetails?.title}
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAiGeneratedPreview(null)}
                    className="text-xs rounded-xl font-bold border-[#7ba27a]/50 text-[#315b36]"
                  >
                    Back
                  </Button>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-3">
                  {aiGeneratedPreview.map((q, idx) => (
                    <div key={idx} className="rounded-2xl border border-[#e2ebe2] bg-white p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-[#315b36] text-white text-[10px] font-bold">
                          {q.difficulty}
                        </Badge>
                        <span className="text-xs font-bold text-[#2e3339]">{q.prompt}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        {q.options?.map((opt: string, i: number) => (
                          <div
                            key={i}
                            className={`rounded-lg px-2.5 py-1 text-[11px] border ${opt === q.correctAnswer
                                ? 'border-[#7ba27a] bg-[#eff4ec] text-[#315b36] font-bold'
                                : 'border-slate-200 bg-slate-50 text-slate-700'
                              }`}
                          >
                            {String.fromCharCode(65 + i)}: {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#e2ebe2]">
                  <Button
                    variant="outline"
                    onClick={() => setAiGeneratedPreview(null)}
                    className="rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={isSavingAiBulk}
                    onClick={handleSaveAiQuestionsToPlacement}
                    className="rounded-xl bg-[#315b36] hover:bg-[#254629] text-white text-xs font-bold shadow-md"
                  >
                    {isSavingAiBulk ? 'Saving to Placement...' : `Save ${aiGeneratedPreview.length} Questions to Placement`}
                  </Button>
                </div>
              </div>
            )}
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
                  Test: <span className="font-bold text-[#315b36]">{selectedAttemptForReview.placementTitle}</span> • Score:{' '}
                  <span className="font-bold text-[#315b36]">{selectedAttemptForReview.score}%</span> • Level:{' '}
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
                    className={`rounded-2xl border p-4 space-y-2 ${item.isCorrect
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : 'border-rose-200 bg-rose-50/40'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500">
                        Question {idx + 1} • {item.skill} ({item.level})
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
                          Student Selected:
                        </span>
                        <span
                          className={`font-bold ${item.isCorrect ? 'text-emerald-700' : 'text-rose-700'
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
                    Bro, why are the placement questions hardcoded like `const PLACEMENT_QUESTIONS`?

                    Refactor this to make placement questions **fully dynamic and database-driven**.

                    On the first tab, teachers should see **Placement Analytics** and manage placement questions by batches/categories.

                    Example structure:
                    - **Placement #1** → Q1, Q2, Q3, ...
                    - **Placement #2** → Q1, Q2, Q3, ...
                    - **Placement #3** → Q1, Q2, Q3, ...

                    Teachers should be able to create a new placement, add/edit/delete questions, reorder questions, and manage each placement independently.

                    The frontend should fetch placements and questions from the backend/database. **Do not hardcode placement questions in the frontend.**                  </div>
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
