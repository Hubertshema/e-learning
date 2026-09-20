'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  HelpCircle,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Layers,
  BookOpen,
  MoveHorizontal,
  Link2,
  RotateCcw,
  Copy,
  ChevronUp,
  ChevronDown,
  Award,
  FileQuestion,
  RefreshCw,
  Eye,
  FileText,
  Headphones,
  PenTool,
  CheckSquare,
  Wand2,
  TrendingDown,
  TrendingUp,
  FolderPlus,
  Volume2,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export interface MatchingPair {
  id: string;
  leftTerm: string;
  rightMatch: string;
}

export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'MULTIPLE_SELECT'
  | 'TRUE_FALSE'
  | 'FILL_BLANKS'
  | 'MATCHING'
  | 'ORDERING'
  | 'READING_COMPREHENSION'
  | 'LISTENING'
  | 'WRITING';

export interface QuestionForm {
  id: string;
  prompt: string;
  questionType: QuestionType;
  level: string;
  skill: string;
  options: string[];
  matchingPairs: MatchingPair[];
  jumbledWords: string[];
  passage?: string;
  audioScript?: string;
  multipleCorrectAnswers?: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
}

interface PlacementTestOption {
  id: string;
  title: string;
  description?: string | null;
  isActive: boolean;
  questionCount?: number;
}

const CEFR_LEVELS = ['PRE_A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

const SKILL_OPTIONS = [
  'GRAMMAR',
  'VOCABULARY',
  'READING',
  'LISTENING',
  'WRITING',
  'SPEAKING',
  'PRONUNCIATION',
] as const;

const PROMPT_SUGGESTIONS = [
  'Create a 15-question placement test spanning A1 to C1 testing Grammar, Vocabulary, and Contextual Listening.',
  'Generate a 10-question B1-B2 diagnostic assessment focusing on Conditionals, Tenses, and Modal Verbs with 6 MCQs and 4 matching pairs.',
  'Craft a 12-question diagnostic placement test on Business English, Collocations, and Idiomatic Usage.',
  'Build an 8-question A1-A2 beginner diagnostic test testing basic syntax, everyday vocabulary, and sentence ordering.',
];

function CreateDiagnosticQuestionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlPlacementId = searchParams.get('placementId') || '';
  const urlAiOpen = searchParams.get('ai') === 'true';

  const [placements, setPlacements] = useState<PlacementTestOption[]>([]);
  const [loadingPlacements, setLoadingPlacements] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Target Placement State
  const [placementMode, setPlacementMode] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [selectedPlacementId, setSelectedPlacementId] = useState(urlPlacementId);
  const [newBatchTitle, setNewBatchTitle] = useState('');
  const [newBatchDescription, setNewBatchDescription] = useState('');
  const [newBatchActive, setNewBatchActive] = useState(true);

  // Questions Canvas (starts empty for a clean slate)
  const [questions, setQuestions] = useState<QuestionForm[]>([]);

  // AI Assistant Studio State
  const [showAiModal, setShowAiModal] = useState(urlAiOpen);
  const [aiInstruction, setAiInstruction] = useState('');
  const [aiCefrLevel, setAiCefrLevel] = useState<string>('B1');
  const [aiSelectedSkills, setAiSelectedSkills] = useState<string[]>([
    'GRAMMAR',
    'VOCABULARY',
    'READING',
  ]);
  const [aiQuestionCount, setAiQuestionCount] = useState<number>(10);
  const [aiTopic, setAiTopic] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiProgressStep, setAiProgressStep] = useState(0);
  const [aiProgressMessage, setAiProgressMessage] = useState('');
  const [aiGeneratedQuiz, setAiGeneratedQuiz] = useState<any | null>(null);
  const [showConfirmOverwrite, setShowConfirmOverwrite] = useState(false);
  const [transformingQuestionId, setTransformingQuestionId] = useState<string | null>(null);
  const [activeTransformDropdownId, setActiveTransformDropdownId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load Placements
  useEffect(() => {
    const loadPlacements = async () => {
      try {
        setLoadingPlacements(true);
        const res = await apiClient.get<PlacementTestOption[]>('/teacher/placements');
        const list: PlacementTestOption[] = Array.isArray(res) ? res : (res as any)?.data || [];
        setPlacements(list);

        if (list.length > 0) {
          if (urlPlacementId && list.some((p) => p.id === urlPlacementId)) {
            setSelectedPlacementId(urlPlacementId);
            setPlacementMode('EXISTING');
          } else {
            setSelectedPlacementId(list[0].id);
          }
          setNewBatchTitle(`Placement #${list.length + 1}: `);
        } else {
          setPlacementMode('NEW');
          setNewBatchTitle('Placement #1: General English Diagnostic Test');
        }
      } catch (err) {
        console.error('Failed to load placements', err);
      } finally {
        setLoadingPlacements(false);
      }
    };
    loadPlacements();
  }, [urlPlacementId]);

  // Add Question with type-specific defaults
  const addQuestion = (type: QuestionType = 'MULTIPLE_CHOICE') => {
    const newId = `q-${Date.now()}`;
    const defaultLevel = 'B1';

    let skill = 'GRAMMAR';
    if (type === 'MATCHING') skill = 'VOCABULARY';
    else if (type === 'READING_COMPREHENSION') skill = 'READING';
    else if (type === 'LISTENING') skill = 'LISTENING';
    else if (type === 'WRITING') skill = 'WRITING';

    if (type === 'MATCHING') {
      setQuestions((prev) => [
        ...prev,
        {
          id: newId,
          prompt: '',
          questionType: 'MATCHING',
          level: defaultLevel,
          skill: 'VOCABULARY',
          options: [],
          matchingPairs: [
            { id: '1', leftTerm: '', rightMatch: '' },
            { id: '2', leftTerm: '', rightMatch: '' },
          ],
          jumbledWords: [],
          correctAnswer: '',
          explanation: '',
          points: 10,
        },
      ]);
    } else if (type === 'ORDERING') {
      setQuestions((prev) => [
        ...prev,
        {
          id: newId,
          prompt: '',
          questionType: 'ORDERING',
          level: defaultLevel,
          skill: 'GRAMMAR',
          options: [],
          matchingPairs: [],
          jumbledWords: [],
          correctAnswer: '',
          explanation: '',
          points: 10,
        },
      ]);
    } else if (type === 'TRUE_FALSE') {
      setQuestions((prev) => [
        ...prev,
        {
          id: newId,
          prompt: '',
          questionType: 'TRUE_FALSE',
          level: defaultLevel,
          skill: 'GRAMMAR',
          options: ['True', 'False'],
          matchingPairs: [],
          jumbledWords: [],
          correctAnswer: 'True',
          explanation: '',
          points: 10,
        },
      ]);
    } else if (type === 'FILL_BLANKS') {
      setQuestions((prev) => [
        ...prev,
        {
          id: newId,
          prompt: '',
          questionType: 'FILL_BLANKS',
          level: defaultLevel,
          skill: 'GRAMMAR',
          options: [],
          matchingPairs: [],
          jumbledWords: [],
          correctAnswer: '',
          explanation: '',
          points: 10,
        },
      ]);
    } else if (type === 'MULTIPLE_SELECT') {
      setQuestions((prev) => [
        ...prev,
        {
          id: newId,
          prompt: '',
          questionType: 'MULTIPLE_SELECT',
          level: defaultLevel,
          skill: 'GRAMMAR',
          options: ['', '', '', ''],
          matchingPairs: [],
          jumbledWords: [],
          multipleCorrectAnswers: [],
          correctAnswer: '',
          explanation: '',
          points: 10,
        },
      ]);
    } else if (type === 'READING_COMPREHENSION') {
      setQuestions((prev) => [
        ...prev,
        {
          id: newId,
          prompt: '',
          questionType: 'READING_COMPREHENSION',
          level: defaultLevel,
          skill: 'READING',
          passage: '',
          options: ['', '', '', ''],
          matchingPairs: [],
          jumbledWords: [],
          correctAnswer: '',
          explanation: '',
          points: 10,
        },
      ]);
    } else if (type === 'LISTENING') {
      setQuestions((prev) => [
        ...prev,
        {
          id: newId,
          prompt: '',
          questionType: 'LISTENING',
          level: defaultLevel,
          skill: 'LISTENING',
          audioScript: '',
          options: ['', '', '', ''],
          matchingPairs: [],
          jumbledWords: [],
          correctAnswer: '',
          explanation: '',
          points: 10,
        },
      ]);
    } else if (type === 'WRITING') {
      setQuestions((prev) => [
        ...prev,
        {
          id: newId,
          prompt: '',
          questionType: 'WRITING',
          level: defaultLevel,
          skill: 'WRITING',
          options: [],
          matchingPairs: [],
          jumbledWords: [],
          correctAnswer: 'Communicative open-response task',
          explanation: '',
          points: 15,
        },
      ]);
    } else {
      setQuestions((prev) => [
        ...prev,
        {
          id: newId,
          prompt: '',
          questionType: 'MULTIPLE_CHOICE',
          level: defaultLevel,
          skill,
          options: ['', '', '', ''],
          matchingPairs: [],
          jumbledWords: [],
          correctAnswer: '',
          explanation: '',
          points: 10,
        },
      ]);
    }
  };

  const updateQuestion = (index: number, field: keyof QuestionForm, value: any) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const updateOption = (qIdx: number, optIdx: number, value: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const newOptions = [...updated[qIdx].options];
      const oldVal = newOptions[optIdx];
      newOptions[optIdx] = value;
      updated[qIdx].options = newOptions;

      if (updated[qIdx].correctAnswer === oldVal) {
        updated[qIdx].correctAnswer = value;
      }
      return updated;
    });
  };

  const addOptionToQuestion = (qIdx: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIdx].options = [...updated[qIdx].options, ''];
      return updated;
    });
  };

  const removeOptionFromQuestion = (qIdx: number, optIdx: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const optVal = updated[qIdx].options[optIdx];
      updated[qIdx].options = updated[qIdx].options.filter((_, idx) => idx !== optIdx);
      if (updated[qIdx].correctAnswer === optVal) {
        updated[qIdx].correctAnswer = '';
      }
      return updated;
    });
  };

  const toggleMultiSelectOption = (qIdx: number, optVal: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const currentAnswers = updated[qIdx].multipleCorrectAnswers || [];
      let nextAnswers: string[];
      if (currentAnswers.includes(optVal)) {
        nextAnswers = currentAnswers.filter((a) => a !== optVal);
      } else {
        nextAnswers = [...currentAnswers, optVal];
      }
      updated[qIdx].multipleCorrectAnswers = nextAnswers;
      updated[qIdx].correctAnswer = nextAnswers.join('|');
      return updated;
    });
  };

  // Matching pair handlers
  const addMatchingPair = (qIdx: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const pairs = [
        ...updated[qIdx].matchingPairs,
        { id: String(Date.now()), leftTerm: '', rightMatch: '' },
      ];
      updated[qIdx].matchingPairs = pairs;
      updated[qIdx].correctAnswer = pairs
        .filter((p) => p.leftTerm.trim() && p.rightMatch.trim())
        .map((p) => `${p.leftTerm.trim()}::${p.rightMatch.trim()}`)
        .join('|');
      return updated;
    });
  };

  const updateMatchingPair = (qIdx: number, pIdx: number, field: 'leftTerm' | 'rightMatch', val: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const pairs = [...updated[qIdx].matchingPairs];
      pairs[pIdx] = { ...pairs[pIdx], [field]: val };
      updated[qIdx].matchingPairs = pairs;
      updated[qIdx].options = pairs.map((p) => `${p.leftTerm} ➔ ${p.rightMatch}`);
      updated[qIdx].correctAnswer = pairs
        .filter((p) => p.leftTerm.trim() && p.rightMatch.trim())
        .map((p) => `${p.leftTerm.trim()}::${p.rightMatch.trim()}`)
        .join('|');
      return updated;
    });
  };

  const removeMatchingPair = (qIdx: number, pIdx: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const pairs = updated[qIdx].matchingPairs.filter((_, idx) => idx !== pIdx);
      updated[qIdx].matchingPairs = pairs;
      updated[qIdx].options = pairs.map((p) => `${p.leftTerm} ➔ ${p.rightMatch}`);
      updated[qIdx].correctAnswer = pairs
        .filter((p) => p.leftTerm.trim() && p.rightMatch.trim())
        .map((p) => `${p.leftTerm.trim()}::${p.rightMatch.trim()}`)
        .join('|');
      return updated;
    });
  };

  // Sentence ordering handlers
  const handleSentenceChange = (qIdx: number, sentence: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const words = sentence
        .trim()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
        .split(/\s+/)
        .filter(Boolean);
      const shuffled = [...words].sort(() => Math.random() - 0.5);

      updated[qIdx].correctAnswer = sentence;
      updated[qIdx].options = words;
      updated[qIdx].jumbledWords = shuffled;
      return updated;
    });
  };

  // Web Speech API for listening preview
  const playAudioTranscript = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // Manipulation: duplicate, reorder, delete
  const duplicateQuestion = (index: number) => {
    setQuestions((prev) => {
      const target = prev[index];
      const cloned: QuestionForm = {
        ...target,
        id: `q-${Date.now()}`,
        prompt: `${target.prompt} (Copy)`,
        matchingPairs: target.matchingPairs.map((p) => ({ ...p, id: String(Date.now() + Math.random()) })),
        options: [...target.options],
        jumbledWords: [...target.jumbledWords],
        multipleCorrectAnswers: target.multipleCorrectAnswers ? [...target.multipleCorrectAnswers] : [],
      };
      const next = [...prev];
      next.splice(index + 1, 0, cloned);
      return next;
    });
  };

  const moveQuestion = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= questions.length) return;
    setQuestions((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, idx) => idx !== index));
  };

  // -------------------------------------------------------------
  // AI Generation Handlers
  // -------------------------------------------------------------
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setAiGenerating(false);
    setAiProgressMessage('Generation stopped by teacher.');
  };

  const handleStartAiGeneration = async (mode: 'FULL' | 'MORE' | 'REGENERATE' = 'FULL') => {
    try {
      setAiGenerating(true);
      setError(null);
      setFeedback(null);
      setAiProgressStep(1);
      setAiProgressMessage(`Analyzing CEFR diagnostic criteria for ${aiCefrLevel}...`);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const timer1 = setTimeout(() => {
        setAiProgressStep(2);
        setAiProgressMessage('Formulating placement test drills & proficiency benchmarks...');
      }, 1500);

      const timer2 = setTimeout(() => {
        setAiProgressStep(3);
        setAiProgressMessage('Structuring distractors & pedagogical explanations...');
      }, 3500);

      const timer3 = setTimeout(() => {
        setAiProgressStep(4);
        setAiProgressMessage('Calibrating difficulty gradients & assembling placement...');
      }, 5500);

      const payload = {
        instruction:
          aiInstruction.trim() ||
          `Create a CEFR ${aiCefrLevel} English placement test focusing on ${aiTopic || 'Grammar and Vocabulary'}`,
        cefrLevel: aiCefrLevel === 'ALL' ? 'B1' : aiCefrLevel,
        skills: aiSelectedSkills,
        count: mode === 'MORE' ? 3 : aiQuestionCount,
        topic: aiTopic || 'Diagnostic English Placement',
      };

      const res = await apiClient.post<any>('/ai/quizzes/generate-advanced', payload);

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      const generatedQuiz = res?.data || res;

      if (!generatedQuiz || !Array.isArray(generatedQuiz.questions) || generatedQuiz.questions.length === 0) {
        throw new Error('AI could not produce valid placement questions for this prompt.');
      }

      if (questions.length > 0 && mode === 'FULL') {
        setAiGeneratedQuiz(generatedQuiz);
        setShowConfirmOverwrite(true);
        setAiGenerating(false);
        return;
      }

      applyGeneratedQuiz(generatedQuiz, mode === 'MORE' ? 'APPEND' : 'REPLACE');
      setShowAiModal(false);
      setAiGenerating(false);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setAiProgressMessage('Generation stopped.');
      } else {
        setError(err.message || 'AI generation failed.');
      }
      setAiGenerating(false);
    } finally {
      abortControllerRef.current = null;
    }
  };

  const applyGeneratedQuiz = (quizData: any, strategy: 'REPLACE' | 'APPEND') => {
    const formattedQuestions: QuestionForm[] = quizData.questions.map((q: any, i: number) => {
      let qSkill = 'GRAMMAR';
      if (q.skill) {
        qSkill = String(q.skill).toUpperCase();
      } else if (q.questionType === 'READING_COMPREHENSION') {
        qSkill = 'READING';
      } else if (q.questionType === 'LISTENING') {
        qSkill = 'LISTENING';
      } else if (q.questionType === 'WRITING') {
        qSkill = 'WRITING';
      } else if (q.questionType === 'MATCHING') {
        qSkill = 'VOCABULARY';
      }

      return {
        id: `ai-q-${Date.now()}-${i}`,
        prompt: q.prompt || q.question || '',
        questionType: q.questionType || 'MULTIPLE_CHOICE',
        level: q.difficulty || q.level || (aiCefrLevel === 'ALL' ? 'B1' : aiCefrLevel),
        skill: qSkill,
        passage: q.passage || '',
        audioScript: q.audioScript || '',
        options: Array.isArray(q.options)
          ? q.options
          : q.questionType === 'TRUE_FALSE'
          ? ['True', 'False']
          : [],
        matchingPairs: Array.isArray(q.matchingPairs) ? q.matchingPairs : [],
        jumbledWords: Array.isArray(q.jumbledWords) ? q.jumbledWords : [],
        multipleCorrectAnswers:
          q.questionType === 'MULTIPLE_SELECT' && q.correctAnswer
            ? q.correctAnswer.split('|').map((s: string) => s.trim())
            : [],
        correctAnswer: q.correctAnswer || q.correct || '',
        explanation: q.explanation || '',
        points: Number(q.points) || 10,
      };
    });

    if (strategy === 'APPEND') {
      setQuestions((prev) => [...prev, ...formattedQuestions]);
      setFeedback(`✨ Appended ${formattedQuestions.length} AI-generated diagnostic questions!`);
    } else {
      setQuestions(formattedQuestions);
      if (placementMode === 'NEW' && quizData.title && !newBatchTitle.trim()) {
        setNewBatchTitle(quizData.title);
      }
      setFeedback(`✨ Generated ${formattedQuestions.length} diagnostic questions with AI!`);
    }

    setShowConfirmOverwrite(false);
    setAiGeneratedQuiz(null);
  };

  // Per-question transformation
  const handleTransformQuestion = async (
    qIdx: number,
    action: 'MAKE_EASIER' | 'MAKE_HARDER' | 'IMPROVE' | 'ADD_EXPLANATION'
  ) => {
    const targetQ = questions[qIdx];
    try {
      setTransformingQuestionId(targetQ.id);
      setActiveTransformDropdownId(null);
      setError(null);
      const res = await apiClient.post<any>('/ai/quizzes/transform-question', {
        question: targetQ,
        action,
        targetLevel: targetQ.level,
        context: 'English Language Placement Diagnostic Assessment',
      });
      const updated = res?.data || res;
      if (updated) {
        setQuestions((prev) => {
          const next = [...prev];
          next[qIdx] = {
            ...next[qIdx],
            ...updated,
            id: targetQ.id,
          };
          return next;
        });
        const actionLabels: Record<string, string> = {
          MAKE_EASIER: 'simplified (CEFR -1)',
          MAKE_HARDER: 'advanced (CEFR +1)',
          IMPROVE: 'polished & enhanced',
          ADD_EXPLANATION: 'explanation added',
        };
        setFeedback(`✨ Question #${qIdx + 1} ${actionLabels[action]}!`);
      }
    } catch (err: any) {
      setError(`Failed to transform question: ${err.message || 'Unknown error'}`);
    } finally {
      setTransformingQuestionId(null);
    }
  };

  // -------------------------------------------------------------
  // Validation & Submit
  // -------------------------------------------------------------
  const selectedPlacementObj = placements.find((p) => p.id === selectedPlacementId);

  // Calculate Level and Skill counts for summary
  const levelCounts: Record<string, number> = {};
  const skillCounts: Record<string, number> = {};
  questions.forEach((q) => {
    levelCounts[q.level] = (levelCounts[q.level] || 0) + 1;
    skillCounts[q.skill] = (skillCounts[q.skill] || 0) + 1;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (placementMode === 'NEW' && !newBatchTitle.trim()) {
      setError('Please enter a placement title for the new batch.');
      return;
    }

    if (placementMode === 'EXISTING' && !selectedPlacementId) {
      setError('Please select a target placement batch.');
      return;
    }

    if (questions.length === 0) {
      setError('Please add at least one question before saving.');
      return;
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.prompt.trim()) {
        setError(`Question #${i + 1} prompt cannot be empty.`);
        return;
      }
      if (q.questionType === 'MATCHING') {
        if (q.matchingPairs.length < 2) {
          setError(`Matching Question #${i + 1} must have at least 2 pairs.`);
          return;
        }
        for (const p of q.matchingPairs) {
          if (!p.leftTerm.trim() || !p.rightMatch.trim()) {
            setError(`Matching Question #${i + 1} has an empty term or match.`);
            return;
          }
        }
      } else if (q.questionType === 'ORDERING') {
        if (!q.correctAnswer.trim() || q.options.length < 2) {
          setError(`Ordering Question #${i + 1} must have a valid complete sentence.`);
          return;
        }
      } else if (q.questionType === 'TRUE_FALSE') {
        if (!q.correctAnswer) {
          setError(`True/False Question #${i + 1} must have a selected answer.`);
          return;
        }
      } else if (q.questionType === 'MULTIPLE_CHOICE') {
        const validOptions = q.options.filter((o) => o.trim().length > 0);
        if (validOptions.length < 2) {
          setError(`Question #${i + 1} must have at least 2 non-empty options.`);
          return;
        }
        if (!q.correctAnswer.trim()) {
          setError(`Question #${i + 1} must have a designated correct answer.`);
          return;
        }
      } else if (q.questionType === 'MULTIPLE_SELECT') {
        if (!q.multipleCorrectAnswers || q.multipleCorrectAnswers.length === 0) {
          setError(`Multi-Select Question #${i + 1} must have at least one correct choice.`);
          return;
        }
      } else if (q.questionType === 'READING_COMPREHENSION') {
        if (!q.passage?.trim()) {
          setError(`Reading Question #${i + 1} must include a reading passage.`);
          return;
        }
        if (!q.correctAnswer.trim()) {
          setError(`Reading Question #${i + 1} must have a correct answer selected.`);
          return;
        }
      } else if (q.questionType === 'LISTENING') {
        if (!q.audioScript?.trim()) {
          setError(`Listening Question #${i + 1} must include an audio script/transcript.`);
          return;
        }
        if (!q.correctAnswer.trim()) {
          setError(`Listening Question #${i + 1} must have a correct answer selected.`);
          return;
        }
      } else if (q.questionType === 'WRITING') {
        if (!q.correctAnswer.trim()) {
          setError(`Writing Question #${i + 1} must include evaluation criteria or sample response.`);
          return;
        }
      }
    }

    try {
      setSubmitting(true);

      // Prepare payload questions formatted for placement_questions table
      const payloadQuestions = questions.map((q, idx) => {
        let optionsArray: string[] = [];

        if (q.questionType === 'MATCHING') {
          optionsArray = q.matchingPairs.map((p) => `${p.leftTerm.trim()} ➔ ${p.rightMatch.trim()}`);
        } else if (q.questionType === 'ORDERING') {
          optionsArray = q.options;
        } else if (q.questionType === 'TRUE_FALSE') {
          optionsArray = ['True', 'False'];
        } else if (q.questionType === 'READING_COMPREHENSION') {
          optionsArray = q.options.filter((o) => o.trim().length > 0);
        } else if (q.questionType === 'LISTENING') {
          optionsArray = q.options.filter((o) => o.trim().length > 0);
        } else {
          optionsArray = q.options.filter((o) => o.trim().length > 0);
        }

        // Include passage / audioScript in prompt context if applicable
        let finalPrompt = q.prompt.trim();
        if (q.questionType === 'READING_COMPREHENSION' && q.passage?.trim()) {
          finalPrompt = `[READING PASSAGE]\n${q.passage.trim()}\n\n[QUESTION]\n${finalPrompt}`;
        } else if (q.questionType === 'LISTENING' && q.audioScript?.trim()) {
          finalPrompt = `[AUDIO SCRIPT]\n${q.audioScript.trim()}\n\n[QUESTION]\n${finalPrompt}`;
        }

        return {
          level: q.level,
          skill: q.skill,
          prompt: finalPrompt,
          options: optionsArray,
          correctAnswer: q.correctAnswer,
          orderIndex: idx + 1,
        };
      });

      if (placementMode === 'NEW') {
        await apiClient.post('/teacher/placements', {
          title: newBatchTitle.trim(),
          description: newBatchDescription.trim() || undefined,
          isActive: newBatchActive,
          questions: payloadQuestions,
        });
      } else {
        await apiClient.post(`/teacher/placements/${selectedPlacementId}/questions/bulk`, {
          questions: payloadQuestions,
        });
      }

      router.push('/teacher/diagnostic-quiz');
    } catch (err: any) {
      console.error('Failed to save placement questions', err);
      setError(err.message || 'Failed to save placement questions.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl pb-24 animate-fade-in">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/teacher/diagnostic-quiz">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-[#315b36] text-white text-[10px] font-mono py-0">
                Diagnostic Studio
              </Badge>
              <span className="text-xs text-slate-500">CEFR Placement Assessment Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Diagnostic & Placement Question Studio
            </h1>
          </div>
        </div>

        {/* Global AI Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAiModal(true)}
            className="border-[#7ba27a]/60 bg-gradient-to-r from-[#eff4ec] to-[#ddeadc] text-[#315b36] hover:from-[#e2ebe2] hover:to-[#cce2cc] font-bold shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5 text-[#315b36]" />
            AI Placement Assistant
          </Button>

          {questions.length > 0 && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleStartAiGeneration('MORE')}
                disabled={aiGenerating}
                className="text-xs font-semibold"
                title="Quickly add 3 more questions aligned with this placement"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add 3 More with AI
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleStartAiGeneration('REGENERATE')}
                disabled={aiGenerating}
                className="text-xs text-slate-500 hover:text-slate-800"
                title="Regenerate all questions"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${aiGenerating ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
            </>
          )}
        </div>
      </div>

      {feedback && (
        <div className="flex items-center justify-between rounded-2xl p-4 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-2xl p-4 text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Step 1: Target Placement Batch */}
          <Card className="p-6 space-y-5 rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#315b36]" /> 1. Target Placement Batch
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPlacementMode('EXISTING')}
                  className={`text-xs px-2.5 py-1 rounded-lg font-bold transition ${
                    placementMode === 'EXISTING'
                      ? 'bg-[#315b36] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Existing Batch
                </button>
                <button
                  type="button"
                  onClick={() => setPlacementMode('NEW')}
                  className={`text-xs px-2.5 py-1 rounded-lg font-bold transition ${
                    placementMode === 'NEW'
                      ? 'bg-[#315b36] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  + New Batch
                </button>
              </div>
            </div>

            {placementMode === 'EXISTING' ? (
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Placement Test to Add Questions To
                </label>
                <select
                  value={selectedPlacementId}
                  onChange={(e) => setSelectedPlacementId(e.target.value)}
                  className="w-full mt-1.5 rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 font-medium outline-none focus:border-[#315b36] dark:border-slate-800 dark:bg-slate-900 dark:text-white shadow-xs"
                >
                  {placements.length === 0 ? (
                    <option value="">No existing placement tests found</option>
                  ) : (
                    placements.map((p, idx) => (
                      <option key={p.id} value={p.id}>
                        Placement #{idx + 1}: {p.title} ({p.questionCount || 0} questions)
                      </option>
                    ))
                  )}
                </select>
                {selectedPlacementObj && (
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Target: <strong className="text-slate-700 dark:text-slate-300">{selectedPlacementObj.title}</strong> currently has {selectedPlacementObj.questionCount || 0} questions.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  label="Placement Batch Title"
                  placeholder="e.g. Placement #3: Intermediate & Advanced Diagnostic Test"
                  value={newBatchTitle}
                  onChange={(e) => setNewBatchTitle(e.target.value)}
                  required
                />
                <Input
                  label="Description / Diagnostic Focus (Optional)"
                  placeholder="e.g. Evaluates A1 through C1 CEFR proficiency across grammar, vocabulary, reading, and listening."
                  value={newBatchDescription}
                  onChange={(e) => setNewBatchDescription(e.target.value)}
                />
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="newBatchActive"
                    checked={newBatchActive}
                    onChange={(e) => setNewBatchActive(e.target.checked)}
                    className="rounded border-slate-300 text-[#315b36] focus:ring-[#315b36]"
                  />
                  <label htmlFor="newBatchActive" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Set this placement test as active for students
                  </label>
                </div>
              </div>
            )}
          </Card>

          {/* Step 2: Assessment Questions Builder */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#315b36]" /> 2. Placement Questions ({questions.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Build multi-skill CEFR diagnostic exercises. Click an exercise type below to manually add or use AI.
                </p>
              </div>

              {/* Type Picker Buttons */}
              <div className="flex flex-wrap gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={() => addQuestion('MULTIPLE_CHOICE')}
                >
                  <Plus className="h-3 w-3 mr-1" /> MCQ
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={() => addQuestion('MULTIPLE_SELECT')}
                >
                  <CheckSquare className="h-3 w-3 mr-1" /> Multi-Select
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={() => addQuestion('TRUE_FALSE')}
                >
                  <Plus className="h-3 w-3 mr-1" /> T/F
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={() => addQuestion('FILL_BLANKS')}
                >
                  <Plus className="h-3 w-3 mr-1" /> Blanks
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 px-2 border-[#7ba27a]/40 bg-[#eff4ec]/60 text-[#315b36] hover:bg-[#eff4ec] font-bold"
                  onClick={() => addQuestion('MATCHING')}
                >
                  <Link2 className="h-3 w-3 mr-1" /> Match
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 px-2 border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 font-bold"
                  onClick={() => addQuestion('ORDERING')}
                >
                  <MoveHorizontal className="h-3 w-3 mr-1" /> Order
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={() => addQuestion('READING_COMPREHENSION')}
                >
                  <FileText className="h-3 w-3 mr-1" /> Reading
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={() => addQuestion('LISTENING')}
                >
                  <Headphones className="h-3 w-3 mr-1" /> Listening
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={() => addQuestion('WRITING')}
                >
                  <PenTool className="h-3 w-3 mr-1" /> Writing
                </Button>
              </div>
            </div>

            {/* Questions Canvas */}
            {questions.length === 0 ? (
              <Card className="p-8 text-center border-dashed border-2 border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 space-y-4">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-[#eff4ec] text-[#315b36] flex items-center justify-center">
                  <FileQuestion className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No placement questions added yet
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Start by launching the AI Placement Assistant with your custom instructions, or choose an exercise type above.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setShowAiModal(true)}
                    className="bg-[#315b36] hover:bg-[#254629] text-white font-bold shadow-sm"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Open AI Placement Assistant
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => addQuestion('MULTIPLE_CHOICE')}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Multiple Choice
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => addQuestion('MATCHING')}
                  >
                    <Link2 className="h-3.5 w-3.5 mr-1" /> Matching Pairs
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {questions.map((q, qIdx) => {
                  const isTransforming = transformingQuestionId === q.id;

                  return (
                    <Card
                      key={q.id}
                      className="p-5 rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 space-y-4"
                    >
                      {/* Question Card Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#eff4ec] text-[11px] font-black text-[#315b36]">
                            #{qIdx + 1}
                          </span>

                          <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 text-[10px] font-bold">
                            {q.questionType.replace('_', ' ')}
                          </Badge>

                          {/* CEFR Level Tag Selector */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-400">CEFR:</span>
                            <select
                              value={q.level}
                              onChange={(e) => updateQuestion(qIdx, 'level', e.target.value)}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold text-[#315b36] outline-none focus:border-[#315b36] dark:border-slate-700 dark:bg-slate-800"
                            >
                              {CEFR_LEVELS.map((lvl) => (
                                <option key={lvl} value={lvl}>
                                  {lvl}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Skill Selector */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-400">Skill:</span>
                            <select
                              value={q.skill}
                              onChange={(e) => updateQuestion(qIdx, 'skill', e.target.value)}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-700 outline-none focus:border-[#315b36] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                              {SKILL_OPTIONS.map((sk) => (
                                <option key={sk} value={sk}>
                                  {sk}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Card Controls & Per-Question AI Tools */}
                        <div className="flex items-center gap-1">
                          {/* AI Quick Tools Dropdown */}
                          <div className="relative">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setActiveTransformDropdownId(
                                  activeTransformDropdownId === q.id ? null : q.id
                                )
                              }
                              disabled={isTransforming}
                              className="h-7 px-2 text-[11px] font-bold border-[#7ba27a]/40 bg-[#eff4ec]/60 text-[#315b36] hover:bg-[#eff4ec]"
                            >
                              <Wand2 className={`h-3 w-3 mr-1 ${isTransforming ? 'animate-spin' : ''}`} />
                              AI Tools
                            </Button>

                            {activeTransformDropdownId === q.id && (
                              <div className="absolute right-0 mt-1 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-20 dark:border-slate-700 dark:bg-slate-800 space-y-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleTransformQuestion(qIdx, 'MAKE_EASIER')}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700 flex items-center gap-2"
                                >
                                  <TrendingDown className="h-3.5 w-3.5 text-emerald-600" />
                                  Make Easier (CEFR -1)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleTransformQuestion(qIdx, 'MAKE_HARDER')}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700 flex items-center gap-2"
                                >
                                  <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
                                  Make Harder (CEFR +1)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleTransformQuestion(qIdx, 'IMPROVE')}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700 flex items-center gap-2"
                                >
                                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                  Polish & Enhance
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleTransformQuestion(qIdx, 'ADD_EXPLANATION')}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700 flex items-center gap-2"
                                >
                                  <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                                  Add Explanation
                                </button>
                              </div>
                            )}
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={qIdx === 0}
                            onClick={() => moveQuestion(qIdx, qIdx - 1)}
                            className="h-7 w-7 p-0"
                            title="Move Up"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={qIdx === questions.length - 1}
                            onClick={() => moveQuestion(qIdx, qIdx + 1)}
                            className="h-7 w-7 p-0"
                            title="Move Down"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => duplicateQuestion(qIdx)}
                            className="h-7 w-7 p-0"
                            title="Duplicate"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(qIdx)}
                            className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Question Prompt */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Question Prompt / Instruction
                        </label>
                        <textarea
                          rows={2}
                          value={q.prompt}
                          onChange={(e) => updateQuestion(qIdx, 'prompt', e.target.value)}
                          placeholder="e.g. Choose the correct verb form to complete the sentence: 'By the time she arrived, they ___ dinner.'"
                          className="w-full mt-1 rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 font-medium outline-none focus:border-[#315b36] dark:border-slate-800 dark:bg-slate-950 dark:text-white shadow-xs resize-none"
                        />
                      </div>

                      {/* Question Specific Body */}
                      {/* 1. MATCHING PAIRS */}
                      {q.questionType === 'MATCHING' && (
                        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <Link2 className="h-3.5 w-3.5 text-[#315b36]" /> Matching Pairs (Term ➔ Match)
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addMatchingPair(qIdx)}
                              className="text-[11px] h-6 px-2"
                            >
                              <Plus className="h-3 w-3 mr-1" /> Add Pair
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {q.matchingPairs.map((pair, pIdx) => (
                              <div key={pair.id} className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 w-4">
                                  {pIdx + 1}.
                                </span>
                                <input
                                  type="text"
                                  placeholder="Left Term (e.g. 'Look up to')"
                                  value={pair.leftTerm}
                                  onChange={(e) =>
                                    updateMatchingPair(qIdx, pIdx, 'leftTerm', e.target.value)
                                  }
                                  className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs outline-none focus:border-[#315b36] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                />
                                <span className="text-xs font-bold text-slate-400">➔</span>
                                <input
                                  type="text"
                                  placeholder="Matching Definition (e.g. 'Admire or respect')"
                                  value={pair.rightMatch}
                                  onChange={(e) =>
                                    updateMatchingPair(qIdx, pIdx, 'rightMatch', e.target.value)
                                  }
                                  className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs outline-none focus:border-[#315b36] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                />
                                {q.matchingPairs.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => removeMatchingPair(qIdx, pIdx)}
                                    className="p-1 text-rose-500 hover:text-rose-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 2. SENTENCE ORDERING */}
                      {q.questionType === 'ORDERING' && (
                        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <MoveHorizontal className="h-3.5 w-3.5 text-emerald-600" /> Complete Correct Sentence
                          </span>
                          <input
                            type="text"
                            placeholder="Enter the full sentence in correct order (e.g. 'If I had known, I would have helped.')"
                            value={q.correctAnswer}
                            onChange={(e) => handleSentenceChange(qIdx, e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[#315b36] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          />
                          {q.jumbledWords.length > 0 && (
                            <div className="pt-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                Jumbled Tokens Preview (what students will see):
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {q.jumbledWords.map((word, wIdx) => (
                                  <span
                                    key={wIdx}
                                    className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300"
                                  >
                                    {word}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 3. READING COMPREHENSION */}
                      {q.questionType === 'READING_COMPREHENSION' && (
                        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-blue-600" /> Reading Passage
                          </span>
                          <textarea
                            rows={4}
                            value={q.passage || ''}
                            onChange={(e) => updateQuestion(qIdx, 'passage', e.target.value)}
                            placeholder="Paste the English reading passage here for students to analyze..."
                            className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-[#315b36] dark:border-slate-700 dark:bg-slate-900 dark:text-white resize-none"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                              Options (select the correct radio):
                            </span>
                            <div className="space-y-2">
                              {q.options.map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`rc-opt-${q.id}`}
                                    checked={q.correctAnswer === opt && opt.length > 0}
                                    onChange={() => updateQuestion(qIdx, 'correctAnswer', opt)}
                                    className="text-[#315b36] focus:ring-[#315b36]"
                                  />
                                  <input
                                    type="text"
                                    placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                    value={opt}
                                    onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                                    className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs outline-none focus:border-[#315b36] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 4. LISTENING */}
                      {q.questionType === 'LISTENING' && (
                        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <Headphones className="h-3.5 w-3.5 text-indigo-600" /> Audio Transcript & Speech Preview
                            </span>
                            {q.audioScript && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => playAudioTranscript(q.audioScript || '')}
                                className="h-6 px-2 text-[11px] font-bold text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                              >
                                <Volume2 className="h-3 w-3 mr-1" />
                                Test TTS Audio
                              </Button>
                            )}
                          </div>
                          <textarea
                            rows={3}
                            value={q.audioScript || ''}
                            onChange={(e) => updateQuestion(qIdx, 'audioScript', e.target.value)}
                            placeholder="Enter the dialogue or listening script. Students can listen via text-to-speech audio..."
                            className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-[#315b36] dark:border-slate-700 dark:bg-slate-900 dark:text-white resize-none"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                              Options:
                            </span>
                            <div className="space-y-2">
                              {q.options.map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`listen-opt-${q.id}`}
                                    checked={q.correctAnswer === opt && opt.length > 0}
                                    onChange={() => updateQuestion(qIdx, 'correctAnswer', opt)}
                                    className="text-[#315b36] focus:ring-[#315b36]"
                                  />
                                  <input
                                    type="text"
                                    placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                    value={opt}
                                    onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                                    className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs outline-none focus:border-[#315b36] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 5. MULTIPLE CHOICE */}
                      {q.questionType === 'MULTIPLE_CHOICE' && (
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Options (select the radio button next to the correct answer)
                          </label>
                          <div className="space-y-2">
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`mcq-correct-${q.id}`}
                                  checked={q.correctAnswer === opt && opt.length > 0}
                                  onChange={() => updateQuestion(qIdx, 'correctAnswer', opt)}
                                  className="text-[#315b36] focus:ring-[#315b36]"
                                />
                                <span className="text-xs font-bold text-slate-400 w-4">
                                  {String.fromCharCode(65 + optIdx)}.
                                </span>
                                <input
                                  type="text"
                                  placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                  value={opt}
                                  onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                                  className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs outline-none focus:border-[#315b36] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                />
                                {q.options.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => removeOptionFromQuestion(qIdx, optIdx)}
                                    className="p-1 text-rose-500 hover:text-rose-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          {q.options.length < 6 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => addOptionToQuestion(qIdx)}
                              className="text-xs text-[#315b36] hover:bg-[#eff4ec] font-bold h-7 px-2 mt-1"
                            >
                              <Plus className="h-3 w-3 mr-1" /> Add Another Option
                            </Button>
                          )}
                        </div>
                      )}

                      {/* 6. MULTIPLE SELECT */}
                      {q.questionType === 'MULTIPLE_SELECT' && (
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Multi-Select Options (check all that apply as correct)
                          </label>
                          <div className="space-y-2">
                            {q.options.map((opt, optIdx) => {
                              const isChecked = q.multipleCorrectAnswers?.includes(opt);
                              return (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleMultiSelectOption(qIdx, opt)}
                                    className="rounded border-slate-300 text-[#315b36] focus:ring-[#315b36]"
                                  />
                                  <span className="text-xs font-bold text-slate-400 w-4">
                                    {String.fromCharCode(65 + optIdx)}.
                                  </span>
                                  <input
                                    type="text"
                                    placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                    value={opt}
                                    onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                                    className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs outline-none focus:border-[#315b36] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                  />
                                  {q.options.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => removeOptionFromQuestion(qIdx, optIdx)}
                                      className="p-1 text-rose-500 hover:text-rose-700"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {q.options.length < 6 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => addOptionToQuestion(qIdx)}
                              className="text-xs text-[#315b36] hover:bg-[#eff4ec] font-bold h-7 px-2 mt-1"
                            >
                              <Plus className="h-3 w-3 mr-1" /> Add Option
                            </Button>
                          )}
                        </div>
                      )}

                      {/* 7. TRUE / FALSE */}
                      {q.questionType === 'TRUE_FALSE' && (
                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                            Select Correct Answer
                          </label>
                          <div className="flex gap-3">
                            {['True', 'False'].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => updateQuestion(qIdx, 'correctAnswer', val)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                                  q.correctAnswer === val
                                    ? 'border-[#315b36] bg-[#eff4ec] text-[#315b36] shadow-xs'
                                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 8. FILL IN BLANKS */}
                      {q.questionType === 'FILL_BLANKS' && (
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Correct Missing Word or Phrase
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 'would have gone'"
                            value={q.correctAnswer}
                            onChange={(e) => updateQuestion(qIdx, 'correctAnswer', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[#315b36] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          />
                        </div>
                      )}

                      {/* 9. WRITING TASK */}
                      {q.questionType === 'WRITING' && (
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Evaluation Criteria / Sample Ideal Response
                          </label>
                          <textarea
                            rows={3}
                            value={q.correctAnswer}
                            onChange={(e) => updateQuestion(qIdx, 'correctAnswer', e.target.value)}
                            placeholder="Provide rubric guidelines or a benchmark response for evaluating the student's writing..."
                            className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-[#315b36] dark:border-slate-700 dark:bg-slate-900 dark:text-white resize-none"
                          />
                        </div>
                      )}

                      {/* Explanation */}
                      <div className="pt-1">
                        <label className="text-[11px] font-semibold text-slate-500">
                          Pedagogical Explanation & Feedback (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 'The third conditional requires had + past participle in the if-clause.'"
                          value={q.explanation}
                          onChange={(e) => updateQuestion(qIdx, 'explanation', e.target.value)}
                          className="w-full mt-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs outline-none focus:border-[#315b36] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Summary & Save Actions (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="sticky top-6 space-y-5">
            <Card className="p-5 rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="h-4 w-4 text-[#315b36]" /> Assessment Summary
              </h3>

              <div className="rounded-xl bg-[#eff4ec]/50 p-3 space-y-2 text-xs border border-[#e2ebe2]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Target Batch:</span>
                  <span className="font-bold text-[#2e3339] line-clamp-1 max-w-[150px]">
                    {placementMode === 'NEW'
                      ? newBatchTitle || 'New Batch'
                      : selectedPlacementObj?.title || 'Selected Batch'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Questions:</span>
                  <Badge className="bg-[#315b36] text-white font-bold text-[10px]">
                    {questions.length} Total
                  </Badge>
                </div>
              </div>

              {/* CEFR Level Breakdown */}
              {questions.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    CEFR Level Distribution:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(levelCounts).map(([lvl, count]) => (
                      <span
                        key={lvl}
                        className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-300"
                      >
                        {lvl}: <strong className="text-[#315b36]">{count}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Skill Breakdown */}
              {questions.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Skill Breakdown:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(skillCounts).map(([sk, count]) => (
                      <span
                        key={sk}
                        className="rounded-md bg-[#eff4ec] px-2 py-0.5 text-[10px] font-bold text-[#315b36]"
                      >
                        {sk}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 space-y-2">
                <Button
                  type="submit"
                  disabled={submitting || questions.length === 0}
                  className="w-full bg-[#315b36] hover:bg-[#254629] text-white font-bold py-2.5 rounded-xl shadow-md text-xs flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Saving Questions...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Save Questions to Placement
                    </>
                  )}
                </Button>

                <Link href="/teacher/diagnostic-quiz" className="block">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full text-xs font-semibold rounded-xl"
                  >
                    Cancel & Return
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </form>

      {/* AI Assistant Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eff4ec] text-[#315b36]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    AI Placement Assistant
                  </h3>
                  <p className="text-xs text-slate-500">
                    Auto-generate CEFR-calibrated diagnostic questions for your placement test.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (aiGenerating) handleStopGeneration();
                  setShowAiModal(false);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Prompt Instructions */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Instruction / Prompt:
              </label>
              <textarea
                rows={3}
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                placeholder="e.g. Create a 15-question placement test spanning A1 to C1 testing Grammar, Vocabulary, and Contextual Listening..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs outline-none focus:border-[#315b36] dark:border-slate-700 dark:bg-slate-800 dark:text-white shadow-xs resize-none"
              />

              {/* Suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PROMPT_SUGGESTIONS.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAiInstruction(sug)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-[#eff4ec] hover:text-[#315b36] hover:border-[#7ba27a]/60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    💡 {sug.slice(0, 50)}...
                  </button>
                ))}
              </div>
            </div>

            {/* CEFR Level & Count & Topic */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Target CEFR Level:
                </label>
                <select
                  value={aiCefrLevel}
                  onChange={(e) => setAiCefrLevel(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-[#315b36] outline-none focus:border-[#315b36] dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="ALL">ALL (Comprehensive A1-C1)</option>
                  {CEFR_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Question Count:
                </label>
                <select
                  value={aiQuestionCount}
                  onChange={(e) => setAiQuestionCount(Number(e.target.value))}
                  className="w-full mt-1 rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#315b36] dark:border-slate-700 dark:bg-slate-800"
                >
                  {[5, 10, 15, 20].map((cnt) => (
                    <option key={cnt} value={cnt}>
                      {cnt} Questions
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Topic / Domain:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Business English"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-slate-200 bg-white p-2 text-xs outline-none focus:border-[#315b36] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Skills Checkboxes */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Skills to Include:
              </label>
              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map((sk) => {
                  const isChecked = aiSelectedSkills.includes(sk);
                  return (
                    <button
                      key={sk}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setAiSelectedSkills((prev) => prev.filter((s) => s !== sk));
                        } else {
                          setAiSelectedSkills((prev) => [...prev, sk]);
                        }
                      }}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold border transition ${
                        isChecked
                          ? 'border-[#315b36] bg-[#eff4ec] text-[#315b36]'
                          : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {sk}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Progress Bar if Generating */}
            {aiGenerating && (
              <div className="space-y-2 rounded-2xl bg-[#eff4ec]/60 border border-[#7ba27a]/40 p-4 animate-fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-[#315b36]">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#315b36]" />
                    {aiProgressMessage || 'Generating placement assessment...'}
                  </span>
                  <span>Step {aiProgressStep}/4</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full bg-[#315b36] transition-all duration-500"
                    style={{ width: `${(aiProgressStep / 4) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (aiGenerating) handleStopGeneration();
                  setShowAiModal(false);
                }}
                className="text-xs font-semibold"
              >
                Cancel
              </Button>

              {aiGenerating ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleStopGeneration}
                  className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl"
                >
                  Stop Generation
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => handleStartAiGeneration('FULL')}
                  className="bg-[#315b36] hover:bg-[#254629] text-white text-xs font-bold rounded-xl shadow-md"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Generate Questions
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overwrite Confirmation Modal */}
      {showConfirmOverwrite && aiGeneratedQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Questions already exist
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              You currently have {questions.length} questions. How would you like to apply the {aiGeneratedQuiz.questions?.length || 0} newly generated questions?
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="button"
                onClick={() => {
                  applyGeneratedQuiz(aiGeneratedQuiz, 'APPEND');
                  setShowAiModal(false);
                }}
                className="w-full bg-[#315b36] hover:bg-[#254629] text-white text-xs font-bold rounded-xl"
              >
                Append to Existing Questions (+{aiGeneratedQuiz.questions?.length || 0})
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  applyGeneratedQuiz(aiGeneratedQuiz, 'REPLACE');
                  setShowAiModal(false);
                }}
                className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl"
              >
                Replace All Existing Questions
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowConfirmOverwrite(false)}
                className="w-full text-xs font-semibold"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateDiagnosticQuestionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500 font-medium">Loading Placement Studio...</div>}>
      <CreateDiagnosticQuestionContent />
    </Suspense>
  );
}
