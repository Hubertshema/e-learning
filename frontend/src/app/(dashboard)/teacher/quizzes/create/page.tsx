'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
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
  GripVertical,
  MoveHorizontal,
  Link2,
  Check,
  RotateCcw,
  Copy,
  ChevronUp,
  ChevronDown,
  Clock,
  Award,
  ListChecks,
  FileQuestion,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Eye,
  Settings2,
  Volume2,
  FileText,
  Headphones,
  PenTool,
  CheckSquare,
  Wand2,
  TrendingDown,
  TrendingUp,
  StopCircle,
  X,
  AlignLeft,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface LessonOption {
  id: string;
  title: string;
  unitId: string;
}

interface UnitOption {
  id: string;
  title: string;
  lessons: LessonOption[];
}

interface CourseOption {
  id: string;
  title: string;
  level: string;
  units: UnitOption[];
}

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
  options: string[];
  matchingPairs: MatchingPair[];
  jumbledWords: string[];
  passage?: string;
  audioScript?: string;
  multipleCorrectAnswers?: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
  difficulty?: string;
}

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

const ENGLISH_SKILLS = [
  'Grammar',
  'Vocabulary',
  'Reading',
  'Listening',
  'Writing',
  'Spelling & Pronunciation',
  'Everyday Conversation',
] as const;

const PROMPT_SUGGESTIONS = [
  'Create a 20-question B1 quiz on Past Simple vs Present Perfect, with 10 MCQs, 5 fill-in-the-blanks, 3 true/false, and 2 ordering questions.',
  'Generate a 10-question B2 quiz on Business English Collocations & Phrasal Verbs with 6 MCQs and 4 matching pairs.',
  'Create an A2 quiz on Airport & Travel Essentials with 5 MCQs, 3 fill-in-the-blanks, and 2 listening questions.',
  'Design an advanced C1 quiz on Inversion, Conditionals & Cleft Sentences with 5 reading comprehension and 5 multiple select questions.',
];

function CreateQuizForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCourseId = searchParams.get('courseId') || '';
  const urlLessonId = searchParams.get('lessonId') || '';

  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Assessment Settings
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  const [passingScore, setPassingScore] = useState(70);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [isPublished, setIsPublished] = useState(true);

  // Initial state: Starts with no pre-created questions for an empty canvas
  const [questions, setQuestions] = useState<QuestionForm[]>([]);

  // AI Quiz Assistant Studio state
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiInstruction, setAiInstruction] = useState('');
  const [aiCefrLevel, setAiCefrLevel] = useState<string>('B1');
  const [aiSelectedSkills, setAiSelectedSkills] = useState<string[]>([
    'Grammar',
    'Vocabulary',
    'Everyday Conversation',
  ]);
  const [aiQuestionCount, setAiQuestionCount] = useState<number>(10);
  const [aiLearningMaterial, setAiLearningMaterial] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiProgressStep, setAiProgressStep] = useState(0);
  const [aiProgressMessage, setAiProgressMessage] = useState('');
  const [aiGeneratedQuiz, setAiGeneratedQuiz] = useState<any | null>(null);
  const [showConfirmOverwrite, setShowConfirmOverwrite] = useState(false);
  const [transformingQuestionId, setTransformingQuestionId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load courses
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoadingCourses(true);
        const res = await apiClient.get<CourseOption[]>('/teacher/courses');
        const list: CourseOption[] = Array.isArray(res) ? res : (res as any)?.data || [];
        setCourses(list);

        if (list.length > 0) {
          const targetCourse: CourseOption = list.find((c: CourseOption) => c.id === urlCourseId) || list[0];
          setSelectedCourseId(targetCourse.id);

          const allLessons: LessonOption[] = targetCourse.units?.flatMap((u: UnitOption) => u.lessons || []) || [];
          const targetLesson: LessonOption | undefined = allLessons.find((l: LessonOption) => l.id === urlLessonId) || allLessons[0];
          if (targetLesson) {
            setSelectedLessonId(targetLesson.id);
          }
        }
      } catch (err) {
        console.error('Failed to load courses', err);
      } finally {
        setLoadingCourses(false);
      }
    };
    loadCourses();
  }, [urlCourseId, urlLessonId]);

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    const crs = courses.find((c) => c.id === courseId);
    const allLessons = crs?.units?.flatMap((u) => u.lessons || []) || [];
    if (allLessons.length > 0) {
      setSelectedLessonId(allLessons[0].id);
    } else {
      setSelectedLessonId('');
    }
  };

  // Add Question with type-specific defaults
  const addQuestion = (type: QuestionType = 'MULTIPLE_CHOICE') => {
    const newId = `q-${Date.now()}`;
    if (type === 'MATCHING') {
      setQuestions((prev) => [
        ...prev,
        {
          id: newId,
          prompt: '',
          questionType: 'MATCHING',
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
          options: [],
          matchingPairs: [],
          jumbledWords: [],
          correctAnswer: 'Open communicative writing task',
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

      // If this option was selected as the correct answer, update correctAnswer too
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

  // Toggle multi-select correct answer option
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

  // Question manipulation: duplicate, reorder, delete
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
    setAiProgressMessage('Generation stopped by user.');
  };

  const handleStartAiGeneration = async (mode: 'FULL' | 'MORE' | 'REGENERATE' = 'FULL') => {
    try {
      setAiGenerating(true);
      setError(null);
      setFeedback(null);
      setAiProgressStep(1);
      setAiProgressMessage(`Analyzing English pedagogical goals for CEFR ${aiCefrLevel}...`);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const currentCrs = courses.find((c) => c.id === selectedCourseId);
      const allLessons = currentCrs?.units?.flatMap((u) => u.lessons || []) || [];
      const currentLesson = allLessons.find((l) => l.id === selectedLessonId);

      const timer1 = setTimeout(() => {
        setAiProgressStep(2);
        setAiProgressMessage('Designing communicative context & linguistic drills...');
      }, 1500);

      const timer2 = setTimeout(() => {
        setAiProgressStep(3);
        setAiProgressMessage('Formulating distractors & pedagogical explanations...');
      }, 3500);

      const timer3 = setTimeout(() => {
        setAiProgressStep(4);
        setAiProgressMessage('Validating answer keys & assembling quiz...');
      }, 5500);

      const payload = {
        instruction: aiInstruction.trim() || `Create a CEFR ${aiCefrLevel} English quiz on ${aiTopic || currentLesson?.title || 'General English'}`,
        cefrLevel: aiCefrLevel,
        skills: aiSelectedSkills,
        count: mode === 'MORE' ? 3 : aiQuestionCount,
        topic: aiTopic || currentLesson?.title || '',
        lessonTitle: currentLesson?.title || '',
        learningMaterial: aiLearningMaterial.trim(),
      };

      const res = await apiClient.post<any>('/ai/quizzes/generate-advanced', payload);

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      const generatedQuiz = res?.data || res;

      if (!generatedQuiz || !Array.isArray(generatedQuiz.questions) || generatedQuiz.questions.length === 0) {
        throw new Error('AI could not produce valid questions for this prompt.');
      }

      // Check if existing questions exist and mode is FULL
      if (questions.length > 0 && mode === 'FULL') {
        setAiGeneratedQuiz(generatedQuiz);
        setShowConfirmOverwrite(true);
        setAiGenerating(false);
        return;
      }

      // Apply directly if empty or appending
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
    const formattedQuestions: QuestionForm[] = quizData.questions.map((q: any, i: number) => ({
      id: `ai-q-${Date.now()}-${i}`,
      prompt: q.prompt || '',
      questionType: q.questionType || 'MULTIPLE_CHOICE',
      passage: q.passage || '',
      audioScript: q.audioScript || '',
      options: Array.isArray(q.options) ? q.options : (q.questionType === 'TRUE_FALSE' ? ['True', 'False'] : []),
      matchingPairs: Array.isArray(q.matchingPairs) ? q.matchingPairs : [],
      jumbledWords: Array.isArray(q.jumbledWords) ? q.jumbledWords : [],
      multipleCorrectAnswers: q.questionType === 'MULTIPLE_SELECT' && q.correctAnswer
        ? q.correctAnswer.split('|').map((s: string) => s.trim())
        : [],
      correctAnswer: q.correctAnswer || '',
      explanation: q.explanation || '',
      points: Number(q.points) || 10,
      difficulty: q.difficulty || aiCefrLevel,
    }));

    if (strategy === 'APPEND') {
      setQuestions((prev) => [...prev, ...formattedQuestions]);
      setFeedback(`✨ Appended ${formattedQuestions.length} AI-generated questions!`);
    } else {
      setQuestions(formattedQuestions);
      if (quizData.title && (!title.trim() || title.startsWith('Quiz:'))) {
        setTitle(quizData.title);
      }
      if (quizData.description && !description.trim()) {
        setDescription(quizData.description);
      }
      if (quizData.timeLimitMinutes) {
        setTimeLimitMinutes(quizData.timeLimitMinutes);
      }
      if (quizData.passingScore) {
        setPassingScore(quizData.passingScore);
      }
      setFeedback(`✨ Generated complete ${formattedQuestions.length}-question CEFR ${quizData.cefrLevel || aiCefrLevel} assessment!`);
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
      setError(null);
      const res = await apiClient.post<any>('/ai/quizzes/transform-question', {
        question: targetQ,
        action,
        targetLevel: targetQ.difficulty || aiCefrLevel,
        context: title || description || 'English Learning Quiz',
      });
      const updated = res?.data || res;
      if (updated) {
        setQuestions((prev) => {
          const next = [...prev];
          next[qIdx] = {
            ...next[qIdx],
            ...updated,
            id: targetQ.id, // preserve original ID
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
  const currentCourse = courses.find((c) => c.id === selectedCourseId);
  const availableLessons = currentCourse?.units?.flatMap((u) => u.lessons || []) || [];

  const totalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);
  const passingPointsNeeded = Math.ceil((totalPoints * passingScore) / 100);

  const isFormValid =
    Boolean(selectedLessonId) &&
    Boolean(title.trim()) &&
    questions.length > 0 &&
    questions.every((q) => {
      if (!q.prompt.trim()) return false;
      if (q.questionType === 'MATCHING') {
        return q.matchingPairs.length >= 2 && q.matchingPairs.every((p) => p.leftTerm.trim() && p.rightMatch.trim());
      }
      return Boolean(q.correctAnswer.trim());
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedLessonId) {
      setError('Please select a target lesson to attach this assessment to.');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a quiz title.');
      return;
    }

    if (questions.length === 0) {
      setError('Please add at least one question before saving the quiz.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.prompt.trim()) {
        setError(`Question #${i + 1} prompt cannot be empty.`);
        return;
      }
      if (q.questionType === 'MATCHING') {
        if (q.matchingPairs.length < 2) {
          setError(`Match Question #${i + 1} must have at least 2 pairs.`);
          return;
        }
        for (const p of q.matchingPairs) {
          if (!p.leftTerm.trim() || !p.rightMatch.trim()) {
            setError(`Question #${i + 1} contains an incomplete matching pair.`);
            return;
          }
        }
      } else if (!q.correctAnswer.trim()) {
        setError(`Please designate the correct answer for Question #${i + 1}.`);
        return;
      }
    }

    try {
      setSubmitting(true);
      await apiClient.post('/teacher/quizzes', {
        lessonId: selectedLessonId,
        title,
        description,
        timeLimitMinutes: Number(timeLimitMinutes),
        passingScore: Number(passingScore),
        maxAttempts: Number(maxAttempts),
        isPublished,
        questions: questions.map((q, idx) => {
          let formattedOptions = q.options.filter((o) => o.trim().length > 0);
          if (q.questionType === 'MATCHING') {
            formattedOptions = q.matchingPairs.map((p) => `${p.leftTerm.trim()}::${p.rightMatch.trim()}`);
          } else if (q.questionType === 'ORDERING') {
            formattedOptions = q.jumbledWords.length > 0 ? q.jumbledWords : q.options;
          } else if (q.questionType === 'READING_COMPREHENSION' && q.passage) {
            // Keep passage with options or metadata
            formattedOptions = [q.passage, ...formattedOptions];
          } else if (q.questionType === 'LISTENING' && q.audioScript) {
            // Keep audioScript with options or metadata
            formattedOptions = [q.audioScript, ...formattedOptions];
          }

          return {
            prompt: q.prompt,
            questionType: q.questionType,
            options: formattedOptions,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            points: Number(q.points),
            orderIndex: idx + 1,
          };
        }),
      });

      router.push('/teacher/quizzes');
    } catch (err: any) {
      setError(err.message || 'Failed to create quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl pb-24 animate-fade-in">
      {/* Top Bar with AI Assistant Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/teacher/quizzes">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="indigo" className="text-[10px] font-mono py-0">
                Studio Mode
              </Badge>
              <span className="text-xs text-slate-400">CEFR Assessment Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Assessment Studio & Quiz Builder
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
            className="border-indigo-300 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:from-indigo-100 hover:to-purple-100 dark:from-indigo-950/60 dark:to-purple-950/60 dark:border-indigo-800 dark:text-indigo-300 font-bold shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5 text-indigo-600 dark:text-indigo-400" />
            AI Quiz Assistant
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
                title="Quickly add 3 more questions aligned with this quiz"
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
          {/* Step 1: Target Course & Lesson */}
          <Card className="p-6 space-y-5 rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary-600" /> 1. Curriculum Placement & Target Lesson
              </h2>
              <span className="text-[11px] text-slate-400">Required</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Course Program
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full mt-1.5 rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 font-medium outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white shadow-xs"
                >
                  {courses.map((crs) => (
                    <option key={crs.id} value={crs.id}>
                      [{crs.level}] {crs.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Lesson
                </label>
                <select
                  value={selectedLessonId}
                  onChange={(e) => setSelectedLessonId(e.target.value)}
                  className="w-full mt-1.5 rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 font-medium outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white shadow-xs"
                >
                  {availableLessons.length === 0 ? (
                    <option value="">No lessons found in this course</option>
                  ) : (
                    availableLessons.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              <Input
                label="Quiz Title"
                placeholder="e.g. Unit 2 Review: Past Simple vs Present Perfect"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <Input
                label="Instructions & Learning Context (Optional)"
                placeholder="e.g. Read each item carefully. You have 15 minutes to complete all questions."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </Card>

          {/* Step 2: Assessment Questions Builder */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary-600" /> 2. Assessment Questions ({questions.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Build multi-skill English exercises. Click an exercise type below to manually add or use AI.
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
                  className="text-xs h-7 px-2 border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300 font-bold"
                  onClick={() => addQuestion('MATCHING')}
                >
                  <Link2 className="h-3 w-3 mr-1" /> Match
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 px-2 border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 font-bold"
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

            {/* Questions List */}
            {questions.length === 0 ? (
              <Card className="p-8 text-center border-dashed border-2 border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 space-y-4">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 flex items-center justify-center">
                  <FileQuestion className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No questions added yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Start by asking the AI Quiz Assistant with your custom instruction, or choose an exercise type below.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <Button
                    type="button"
                    variant="gradient"
                    size="sm"
                    onClick={() => setShowAiModal(true)}
                    className="font-bold shadow-sm"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Open AI Quiz Assistant
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
                    onClick={() => addQuestion('FILL_BLANKS')}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Fill Blank
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300 font-bold"
                    onClick={() => addQuestion('MATCHING')}
                  >
                    <Link2 className="h-3.5 w-3.5 mr-1" /> Match Pairs
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 font-bold"
                    onClick={() => addQuestion('ORDERING')}
                  >
                    <MoveHorizontal className="h-3.5 w-3.5 mr-1" /> Sentence Reorder
                  </Button>
                </div>
              </Card>
            ) : (
              questions.map((q, qIdx) => {
                const isMatch = q.questionType === 'MATCHING';
                const isOrdering = q.questionType === 'ORDERING';
                const isTF = q.questionType === 'TRUE_FALSE';
                const isBlank = q.questionType === 'FILL_BLANKS';
                const isMultiSelect = q.questionType === 'MULTIPLE_SELECT';
                const isReading = q.questionType === 'READING_COMPREHENSION';
                const isListening = q.questionType === 'LISTENING';
                const isWriting = q.questionType === 'WRITING';
                const isChoice = q.questionType === 'MULTIPLE_CHOICE';
                const isTransforming = transformingQuestionId === q.id;

                return (
                  <Card
                    key={q.id || qIdx}
                    className={`p-5 space-y-4 rounded-2xl border transition-all ${
                      isTransforming
                        ? 'border-indigo-400 bg-indigo-50/20 animate-pulse'
                        : 'border-slate-200/90 dark:border-slate-800 shadow-md hover:border-primary-400/50'
                    }`}
                  >
                    {/* Question Card Top Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="indigo" className="text-xs font-bold px-2.5 py-0.5">
                          Question #{qIdx + 1}
                        </Badge>
                        {q.difficulty && (
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {q.difficulty}
                          </Badge>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={q.points}
                            onChange={(e) => updateQuestion(qIdx, 'points', parseInt(e.target.value, 10) || 10)}
                            className="w-16 h-7 text-xs text-center font-mono font-bold"
                          />
                          <span className="text-[11px]">Points</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Question Type Selector */}
                        <select
                          value={q.questionType}
                          onChange={(e) => {
                            const newType = e.target.value as QuestionType;
                            updateQuestion(qIdx, 'questionType', newType);
                            if (newType === 'MATCHING' && q.matchingPairs.length === 0) {
                              updateQuestion(qIdx, 'matchingPairs', [
                                { id: '1', leftTerm: '', rightMatch: '' },
                                { id: '2', leftTerm: '', rightMatch: '' },
                              ]);
                            } else if (newType === 'TRUE_FALSE' && !q.correctAnswer) {
                              updateQuestion(qIdx, 'correctAnswer', 'True');
                            } else if ((newType === 'MULTIPLE_CHOICE' || newType === 'MULTIPLE_SELECT' || newType === 'READING_COMPREHENSION' || newType === 'LISTENING') && q.options.length === 0) {
                              updateQuestion(qIdx, 'options', ['', '', '', '']);
                            }
                          }}
                          className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 shadow-xs outline-none"
                        >
                          <option value="MULTIPLE_CHOICE">🔘 Multiple Choice</option>
                          <option value="MULTIPLE_SELECT">☑️ Multiple Select</option>
                          <option value="TRUE_FALSE">🔤 True / False</option>
                          <option value="FILL_BLANKS">📝 Fill in Blank</option>
                          <option value="MATCHING">🔗 Match Pairs</option>
                          <option value="ORDERING">🔀 Sentence Ordering</option>
                          <option value="READING_COMPREHENSION">📖 Reading Comprehension</option>
                          <option value="LISTENING">🎧 Listening Comprehension</option>
                          <option value="WRITING">✍️ Writing Task</option>
                        </select>

                        {/* Reorder / Move Buttons */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={qIdx === 0}
                          onClick={() => moveQuestion(qIdx, qIdx - 1)}
                          className="h-7 w-7 p-0 text-slate-500"
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
                          className="h-7 w-7 p-0 text-slate-500"
                          title="Move Down"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>

                        {/* Duplicate Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicateQuestion(qIdx)}
                          className="h-7 w-7 p-0 text-slate-500"
                          title="Duplicate Question"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>

                        {/* Delete Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          onClick={() => removeQuestion(qIdx)}
                          title="Delete Question"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Per-Question AI Quick Tools */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs">
                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                        AI Question Tools:
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isTransforming}
                          onClick={() => handleTransformQuestion(qIdx, 'IMPROVE')}
                          className="h-6 text-[10px] px-2"
                          title="Polish prompt & distractors for clarity"
                        >
                          <Wand2 className="h-2.5 w-2.5 mr-1 text-indigo-600" />
                          Improve
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isTransforming}
                          onClick={() => handleTransformQuestion(qIdx, 'MAKE_EASIER')}
                          className="h-6 text-[10px] px-2 text-emerald-700 dark:text-emerald-300"
                          title="Simplify vocabulary & grammar (CEFR -1)"
                        >
                          <TrendingDown className="h-2.5 w-2.5 mr-1" />
                          Make Easier
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isTransforming}
                          onClick={() => handleTransformQuestion(qIdx, 'MAKE_HARDER')}
                          className="h-6 text-[10px] px-2 text-purple-700 dark:text-purple-300"
                          title="Increase lexical range & nuance (CEFR +1)"
                        >
                          <TrendingUp className="h-2.5 w-2.5 mr-1" />
                          Make Harder
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isTransforming}
                          onClick={() => handleTransformQuestion(qIdx, 'ADD_EXPLANATION')}
                          className="h-6 text-[10px] px-2"
                          title="Add pedagogical feedback"
                        >
                          <Sparkles className="h-2.5 w-2.5 mr-1" />
                          Add Explanation
                        </Button>
                      </div>
                    </div>

                    {/* READING COMPREHENSION PASSAGE */}
                    {isReading && (
                      <div className="space-y-1.5 p-3 rounded-xl border border-indigo-100 bg-indigo-50/20 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                        <label className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-indigo-600" />
                          Reading Comprehension Passage (Text excerpt for students to read)
                        </label>
                        <textarea
                          rows={4}
                          value={q.passage || ''}
                          onChange={(e) => updateQuestion(qIdx, 'passage', e.target.value)}
                          placeholder="Paste or write the reading article, story, or dialogue here..."
                          className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 shadow-xs outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}

                    {/* LISTENING TRANSCRIPT & AUDIO PREVIEW */}
                    {isListening && (
                      <div className="space-y-2 p-3 rounded-xl border border-purple-100 bg-purple-50/20 dark:border-purple-900/40 dark:bg-purple-950/20">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                            <Headphones className="h-3.5 w-3.5 text-purple-600" />
                            Listening Audio Script (Dialogue / Monologue)
                          </label>
                          {q.audioScript && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 text-[11px] border-purple-300 text-purple-700 dark:text-purple-300 font-bold"
                              onClick={() => playAudioTranscript(q.audioScript || '')}
                            >
                              <Volume2 className="h-3 w-3 mr-1" /> 🔊 Listen (TTS Preview)
                            </Button>
                          )}
                        </div>
                        <textarea
                          rows={3}
                          value={q.audioScript || ''}
                          onChange={(e) => updateQuestion(qIdx, 'audioScript', e.target.value)}
                          placeholder="Speaker A: 'Excuse me, is this the train to Edinburgh?' Speaker B: 'No, that train departs from platform 3 in ten minutes.'"
                          className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 shadow-xs outline-none focus:border-purple-500"
                        />
                      </div>
                    )}

                    {/* Question Prompt */}
                    <Input
                      label="Question Prompt / Instructions"
                      placeholder={
                        isChoice
                          ? 'e.g. Which modal verb expresses strong obligation in formal business context?'
                          : isMultiSelect
                          ? 'e.g. Select all adjectives that can be used with the adverb "absolutely".'
                          : isTF
                          ? 'e.g. The past continuous tense is used for an action that was in progress when another action occurred.'
                          : isBlank
                          ? 'e.g. If I had known about the schedule change, I [blank] arrived on time.'
                          : isMatch
                          ? 'e.g. Match the business idioms with their appropriate definitions.'
                          : isReading
                          ? 'e.g. According to paragraph 2, why did the company decide to expand into Asian markets?'
                          : isListening
                          ? 'e.g. Where does the passenger need to go next?'
                          : isWriting
                          ? 'e.g. Write a 50-word email apologizing to a colleague for missing yesterday\'s planning session.'
                          : 'e.g. Arrange the words into the correct grammatical sentence order.'
                      }
                      value={q.prompt}
                      onChange={(e) => updateQuestion(qIdx, 'prompt', e.target.value)}
                      required
                    />

                    {/* 1. MULTIPLE CHOICE BUILDER */}
                    {(isChoice || isReading || isListening) && (
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Options & Correct Answer (Select the radio of the correct choice)
                          </label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addOptionToQuestion(qIdx)}
                            className="h-7 text-xs px-2.5"
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Option
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {q.options.map((opt, optIdx) => {
                            const isCorrect = Boolean(q.correctAnswer && q.correctAnswer === opt);
                            return (
                              <div
                                key={optIdx}
                                className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                                  isCorrect
                                    ? 'border-emerald-400 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/30'
                                    : 'border-slate-200 dark:border-slate-800'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`correct-${q.id || qIdx}`}
                                  checked={isCorrect && opt.length > 0}
                                  onChange={() => updateQuestion(qIdx, 'correctAnswer', opt)}
                                  className="h-4 w-4 text-emerald-600 accent-emerald-600 cursor-pointer ml-1"
                                  title="Mark as correct answer"
                                />
                                <Input
                                  placeholder={`Option ${optIdx + 1}`}
                                  value={opt}
                                  onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                                  className="border-0 focus:ring-0 shadow-none text-xs bg-transparent"
                                />
                                {isCorrect && (
                                  <Badge variant="success" className="text-[10px] py-0 shrink-0">
                                    Correct
                                  </Badge>
                                )}
                                {q.options.length > 2 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-slate-400 hover:text-destructive"
                                    onClick={() => removeOptionFromQuestion(qIdx, optIdx)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 2. MULTIPLE SELECT BUILDER */}
                    {isMultiSelect && (
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Options (Check all choices that are correct)
                          </label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addOptionToQuestion(qIdx)}
                            className="h-7 text-xs px-2.5"
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Option
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {q.options.map((opt, optIdx) => {
                            const isCorrect = (q.multipleCorrectAnswers || []).includes(opt);
                            return (
                              <div
                                key={optIdx}
                                className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                                  isCorrect
                                    ? 'border-emerald-400 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/30'
                                    : 'border-slate-200 dark:border-slate-800'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isCorrect && opt.length > 0}
                                  onChange={() => toggleMultiSelectOption(qIdx, opt)}
                                  className="h-4 w-4 text-emerald-600 rounded accent-emerald-600 cursor-pointer ml-1"
                                  title="Check if this option is correct"
                                />
                                <Input
                                  placeholder={`Option ${optIdx + 1}`}
                                  value={opt}
                                  onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                                  className="border-0 focus:ring-0 shadow-none text-xs bg-transparent"
                                />
                                {isCorrect && (
                                  <Badge variant="success" className="text-[10px] py-0 shrink-0">
                                    Correct Choice
                                  </Badge>
                                )}
                                {q.options.length > 2 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-slate-400 hover:text-destructive"
                                    onClick={() => removeOptionFromQuestion(qIdx, optIdx)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 3. TRUE / FALSE BUILDER */}
                    {isTF && (
                      <div className="space-y-2 pt-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Designate Correct Value
                        </label>
                        <div className="flex gap-3">
                          {['True', 'False'].map((val) => {
                            const isSelected = q.correctAnswer === val;
                            return (
                              <button
                                key={val}
                                type="button"
                                onClick={() => updateQuestion(qIdx, 'correctAnswer', val)}
                                className={`flex-1 py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                  isSelected
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-sm'
                                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <div
                                  className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                                    isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-400'
                                  }`}
                                >
                                  {isSelected && <Check className="h-3 w-3" />}
                                </div>
                                <span>{val}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 4. FILL IN THE BLANK BUILDER */}
                    {isBlank && (
                      <div className="space-y-2 pt-1">
                        <Input
                          label="Exact Correct Answer (or keyword)"
                          placeholder="e.g. would have / had been / have lived"
                          value={q.correctAnswer}
                          onChange={(e) => updateQuestion(qIdx, 'correctAnswer', e.target.value)}
                          required
                        />
                        <p className="text-[11px] text-slate-400">
                          Tip: In your question prompt above, use <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">[blank]</code> to indicate where the student will fill in the word.
                        </p>
                      </div>
                    )}

                    {/* 5. MATCHING PAIRS BUILDER */}
                    {isMatch && (
                      <div className="space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/30 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                              <Link2 className="h-3.5 w-3.5 text-indigo-600" />
                              Match Question Pairs (Left Term ➔ Right Meaning)
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Learners see randomized tokens and must connect left items to their matching right items.
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 border-indigo-300 text-indigo-700 dark:text-indigo-300"
                            onClick={() => addMatchingPair(qIdx)}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Pair
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {q.matchingPairs.map((pair, pIdx) => (
                            <div key={pair.id || pIdx} className="flex items-center gap-2">
                              <div className="w-5 text-center text-xs font-bold text-slate-400">
                                {pIdx + 1}
                              </div>
                              <Input
                                placeholder="Left Term (e.g. Word or Concept)"
                                value={pair.leftTerm}
                                onChange={(e) => updateMatchingPair(qIdx, pIdx, 'leftTerm', e.target.value)}
                                className="flex-1 text-xs"
                              />
                              <span className="text-indigo-400 font-bold text-xs">➔</span>
                              <Input
                                placeholder="Right Match (e.g. Definition or Example)"
                                value={pair.rightMatch}
                                onChange={(e) => updateMatchingPair(qIdx, pIdx, 'rightMatch', e.target.value)}
                                className="flex-1 text-xs"
                              />
                              {q.matchingPairs.length > 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-destructive"
                                  onClick={() => removeMatchingPair(qIdx, pIdx)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 6. SENTENCE ORDERING BUILDER */}
                    {isOrdering && (
                      <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                        <div>
                          <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                            <MoveHorizontal className="h-3.5 w-3.5 text-emerald-600" />
                            Sentence Ordering & Word Rebuilder
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Enter the full target sentence below. The system automatically creates interactive, randomized word chips for students to reassemble.
                          </p>
                        </div>

                        <Input
                          label="Target Correct Sentence"
                          placeholder="e.g. She has been managing international accounts for three years."
                          value={q.correctAnswer}
                          onChange={(e) => handleSentenceChange(qIdx, e.target.value)}
                          required
                        />

                        {q.jumbledWords.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                              Interactive Student Preview (Randomized Tokens):
                            </span>
                            <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs">
                              {q.jumbledWords.map((word, wIdx) => (
                                <span
                                  key={wIdx}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 shadow-xs"
                                >
                                  <GripVertical className="h-3 w-3 text-slate-400" />
                                  {word}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 7. WRITING TASK BUILDER */}
                    {isWriting && (
                      <div className="space-y-2 pt-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Model Answer & Evaluation Rubric (Shown to student after teacher review)
                        </label>
                        <textarea
                          rows={3}
                          value={q.explanation}
                          onChange={(e) => updateQuestion(qIdx, 'explanation', e.target.value)}
                          placeholder="Key phrases expected: 'I am writing to apologize...', 'Due to unforeseen circumstances...', polite closing."
                          className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 shadow-xs outline-none"
                        />
                      </div>
                    )}

                    {/* Pedagogical Explanation Field (for non-writing) */}
                    {!isWriting && (
                      <Input
                        label="Pedagogical Explanation & Feedback (Shown after student submits)"
                        placeholder="e.g. 'Since' is used for a specific starting point in time, while 'for' is used for a duration."
                        value={q.explanation}
                        onChange={(e) => updateQuestion(qIdx, 'explanation', e.target.value)}
                      />
                    )}
                  </Card>
                );
              })
            )}

            {/* Bottom Add Question Speed-Dial */}
            {questions.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Add another question:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => addQuestion('MULTIPLE_CHOICE')}
                  >
                    <Plus className="h-3 w-3 mr-1" /> MCQ
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => addQuestion('MULTIPLE_SELECT')}
                  >
                    <CheckSquare className="h-3 w-3 mr-1" /> Multi-Select
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => addQuestion('TRUE_FALSE')}
                  >
                    <Plus className="h-3 w-3 mr-1" /> True/False
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => addQuestion('FILL_BLANKS')}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Fill Blank
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300 font-bold"
                    onClick={() => addQuestion('MATCHING')}
                  >
                    <Link2 className="h-3 w-3 mr-1" /> Match Pairs
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 font-bold"
                    onClick={() => addQuestion('ORDERING')}
                  >
                    <MoveHorizontal className="h-3 w-3 mr-1" /> Sentence Reorder
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => addQuestion('READING_COMPREHENSION')}
                  >
                    <FileText className="h-3 w-3 mr-1" /> Reading
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => addQuestion('LISTENING')}
                  >
                    <Headphones className="h-3 w-3 mr-1" /> Listening
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => addQuestion('WRITING')}
                  >
                    <PenTool className="h-3 w-3 mr-1" /> Writing
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar / Sticky Assessment Summary (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Assessment Parameters */}
          <Card className="p-5 space-y-4 rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-md">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <Settings2 className="h-4 w-4 text-primary-600" /> Assessment Settings
            </h3>

            <div className="space-y-3">
              <Input
                label="Time Limit (Minutes)"
                type="number"
                min={1}
                max={180}
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value, 10) || 15)}
              />

              <Input
                label="Passing Benchmark (%)"
                type="number"
                min={1}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(parseInt(e.target.value, 10) || 70)}
              />

              <Input
                label="Max Student Attempts"
                type="number"
                min={1}
                max={10}
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(parseInt(e.target.value, 10) || 3)}
              />

              <div className="pt-2">
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Publish to Students
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isPublished ? 'Visible in student curriculum' : 'Saved as private draft'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="h-4 w-4 text-primary-600 rounded accent-primary-600"
                  />
                </label>
              </div>
            </div>
          </Card>

          {/* Live Scorecard Card */}
          <Card className="p-5 space-y-4 rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-md bg-white dark:bg-slate-900 sticky top-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <Award className="h-4 w-4 text-amber-500" /> Assessment Scorecard
            </h3>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Questions</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{questions.length}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Score</p>
                <p className="text-2xl font-black text-primary-600 dark:text-primary-400 mt-0.5">{totalPoints} Pts</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pass Benchmark</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{passingScore}% ({passingPointsNeeded} pts)</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Est. Duration</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">~{timeLimitMinutes} Mins</p>
              </div>
            </div>

            {/* Quality Checklist */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <ListChecks className="h-3.5 w-3.5 text-primary-600" /> Assessment Readiness Checklist:
              </p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-3.5 w-3.5 ${selectedLessonId ? 'text-emerald-500' : 'text-slate-300'}`} />
                  <span className={selectedLessonId ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}>
                    Target Lesson Linked
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-3.5 w-3.5 ${title.trim() ? 'text-emerald-500' : 'text-slate-300'}`} />
                  <span className={title.trim() ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}>
                    Quiz Title Defined
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-3.5 w-3.5 ${questions.length > 0 && questions.every((q) => q.prompt.trim()) ? 'text-emerald-500' : 'text-slate-300'}`} />
                  <span className={questions.length > 0 && questions.every((q) => q.prompt.trim()) ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}>
                    All Questions Have Prompts
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-3.5 w-3.5 ${isFormValid ? 'text-emerald-500' : 'text-slate-300'}`} />
                  <span className={isFormValid ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}>
                    Correct Answers Marked
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="submit"
                variant="gradient"
                disabled={submitting || !isFormValid}
                className="w-full h-10 font-bold shadow-lg shadow-primary-500/20"
              >
                {submitting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                {isPublished ? 'Save & Publish Assessment' : 'Save as Draft Quiz'}
              </Button>

              <Link href="/teacher/quizzes" className="block">
                <Button type="button" variant="outline" className="w-full text-xs h-9">
                  Cancel
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </form>

      {/* ------------------------------------------------------------- */}
      {/* AI QUIZ ASSISTANT MODAL */}
      {/* ------------------------------------------------------------- */}
      {showAiModal && (
        <Modal
          isOpen={showAiModal}
          onClose={() => {
            if (aiGenerating) handleStopGeneration();
            setShowAiModal(false);
          }}
          size="full"
          title={
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  AI Quiz Assistant Studio
                </h3>
                <p className="text-[11px] text-slate-500 font-normal">
                  Dedicated English language assessment generator (CEFR A1–C2)
                </p>
              </div>
            </div>
          }
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-slate-500">
                {aiGenerating && (
                  <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    {aiProgressMessage}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {aiGenerating ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleStopGeneration}
                    className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950 font-bold text-xs"
                  >
                    <StopCircle className="h-3.5 w-3.5 mr-1" />
                    Stop Generation
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAiModal(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="gradient"
                      size="sm"
                      onClick={() => handleStartAiGeneration('FULL')}
                      className="font-bold text-xs shadow-md shadow-indigo-500/20"
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      Generate Quiz
                    </Button>
                  </>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
            {/* Natural Language Prompt Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>Teacher Prompt / Natural Language Instruction</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  e.g. "Create a 20-question B1 quiz on Past Simple vs Present Perfect..."
                </span>
              </label>
              <textarea
                rows={3}
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                placeholder="Type your instruction: e.g. Create a 20-question B1 quiz on Past Simple vs Present Perfect, with 10 MCQs, 5 fill-in-the-blanks, 3 true/false, and 2 ordering questions."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 shadow-xs outline-none focus:border-indigo-500 leading-relaxed"
              />

              {/* Sample Prompt Chips */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Quick Examples (Click to load):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PROMPT_SUGGESTIONS.map((suggestion, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => setAiInstruction(suggestion)}
                      className="text-left text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 dark:bg-slate-800 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300 text-slate-700 dark:text-slate-300 transition-colors border border-transparent hover:border-indigo-200"
                    >
                      💡 {suggestion.length > 75 ? `${suggestion.slice(0, 75)}...` : suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* CEFR Level Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Target CEFR Proficiency Level
              </label>
              <div className="grid grid-cols-6 gap-2">
                {CEFR_LEVELS.map((level) => {
                  const isSelected = aiCefrLevel === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setAiCefrLevel(level)}
                      className={`py-2 px-3 rounded-xl border text-xs font-black transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target English Skills Focus */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                English Skill Competencies
              </label>
              <div className="flex flex-wrap gap-2">
                {ENGLISH_SKILLS.map((skill) => {
                  const isChecked = aiSelectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setAiSelectedSkills(aiSelectedSkills.filter((s) => s !== skill));
                        } else {
                          setAiSelectedSkills([...aiSelectedSkills, skill]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                        isChecked
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-800 dark:border-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-200 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '}
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question Count & Topic */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                  Question Count: <span className="text-primary-600 font-mono">{aiQuestionCount} Questions</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={30}
                    value={aiQuestionCount}
                    onChange={(e) => setAiQuestionCount(parseInt(e.target.value, 10))}
                    className="flex-1 accent-indigo-600"
                  />
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={aiQuestionCount}
                    onChange={(e) => setAiQuestionCount(parseInt(e.target.value, 10) || 5)}
                    className="w-16 h-8 text-xs text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <Input
                  label="Specific Topic / Grammar Unit (Optional)"
                  placeholder="e.g. Past Simple vs Present Perfect"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                />
              </div>
            </div>

            {/* Optional Source Learning Material Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>Base on Custom Learning Material / Lesson Notes (Optional)</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Paste an article, dialogue, or grammar notes to generate questions from
                </span>
              </label>
              <textarea
                rows={3}
                value={aiLearningMaterial}
                onChange={(e) => setAiLearningMaterial(e.target.value)}
                placeholder="Paste reading passage, vocabulary list, or grammar lesson notes here..."
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 shadow-xs outline-none focus:border-indigo-500"
              />
            </div>

            {/* Progress / Streaming Indicator */}
            {aiGenerating && (
              <div className="p-4 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 dark:border-indigo-900 dark:from-indigo-950/40 dark:to-purple-950/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                    Generating CEFR {aiCefrLevel} Assessment ({aiProgressStep}/4)
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleStopGeneration}
                    className="h-7 text-xs text-rose-600 border-rose-300 font-bold"
                  >
                    <StopCircle className="h-3 w-3 mr-1" />
                    Stop
                  </Button>
                </div>

                <div className="w-full bg-indigo-200/60 dark:bg-indigo-900/60 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${(aiProgressStep / 4) * 100}%` }}
                  />
                </div>

                <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
                  {aiProgressMessage}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CONFIRM OVERWRITE MODAL */}
      {/* ------------------------------------------------------------- */}
      {showConfirmOverwrite && aiGeneratedQuiz && (
        <Modal
          isOpen={showConfirmOverwrite}
          onClose={() => setShowConfirmOverwrite(false)}
          size="md"
          title="Existing Questions Detected"
          description={`Your quiz already has ${questions.length} questions. How would you like to handle the ${aiGeneratedQuiz.questions.length} new AI-generated questions?`}
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirmOverwrite(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyGeneratedQuiz(aiGeneratedQuiz, 'APPEND')}
                className="text-xs font-bold"
              >
                Append to Existing ({questions.length + aiGeneratedQuiz.questions.length} total)
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => applyGeneratedQuiz(aiGeneratedQuiz, 'REPLACE')}
                className="text-xs font-bold"
              >
                Replace All ({aiGeneratedQuiz.questions.length})
              </Button>
            </div>
          }
        >
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <p>
              • <strong>Append:</strong> Keeps your current questions and adds the new questions to the end.
            </p>
            <p>
              • <strong>Replace All:</strong> Clears current questions and replaces them with the new AI-generated set.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function TeacherCreateQuizPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading assessment studio...</div>}>
      <CreateQuizForm />
    </Suspense>
  );
}
