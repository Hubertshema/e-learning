'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  GripVertical,
  Shuffle,
  MoveHorizontal,
  Link2,
  Check,
  RotateCcw,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface CourseOption {
  id: string;
  title: string;
  level: string;
  units: Array<{
    id: string;
    title: string;
    lessons: Array<{
      id: string;
      title: string;
    }>;
  }>;
}

export interface MatchingPair {
  id: string;
  leftTerm: string;
  rightMatch: string;
}

export interface QuestionForm {
  prompt: string;
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANKS' | 'MATCHING' | 'ORDERING';
  options: string[];
  matchingPairs: MatchingPair[];
  jumbledWords: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
}

export default function TeacherCreateQuizPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  const [passingScore, setPassingScore] = useState(70);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [isPublished, setIsPublished] = useState(true);

  const [questions, setQuestions] = useState<QuestionForm[]>([
    {
      prompt: 'Which sentence uses the present perfect tense correctly?',
      questionType: 'MULTIPLE_CHOICE',
      options: [
        'She has lived here for three years.',
        'She is living here for three years.',
        'She lives here since three years.',
        'She lived here for three years ago.',
      ],
      matchingPairs: [],
      jumbledWords: [],
      correctAnswer: 'She has lived here for three years.',
      explanation: 'Present perfect (has + past participle) is used for actions continuing to the present.',
      points: 10,
    },
    {
      prompt: 'Match each business English idiom with its correct meaning:',
      questionType: 'MATCHING',
      options: [],
      matchingPairs: [
        { id: '1', leftTerm: 'Break the ice', rightMatch: 'Initiate conversation in a social setting' },
        { id: '2', leftTerm: 'Touch base', rightMatch: 'Briefly contact or update someone' },
        { id: '3', leftTerm: 'Call it a day', rightMatch: 'Stop working on something for the day' },
      ],
      jumbledWords: [],
      correctAnswer: 'Break the ice::Initiate conversation in a social setting|Touch base::Briefly contact or update someone|Call it a day::Stop working on something for the day',
      explanation: 'Common corporate idioms frequently tested in business negotiations.',
      points: 15,
    },
    {
      prompt: 'Drag and arrange the words in the correct grammatical order:',
      questionType: 'ORDERING',
      options: ['She', 'has', 'been', 'studying', 'English', 'for', 'five', 'months'],
      matchingPairs: [],
      jumbledWords: ['English', 'studying', 'She', 'five', 'has', 'months', 'been', 'for'],
      correctAnswer: 'She has been studying English for five months.',
      explanation: 'Structure: Subject + has/have + been + verb-ing + time duration.',
      points: 15,
    },
  ]);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoadingCourses(true);
        const res = await apiClient.get<CourseOption[]>('/teacher/courses');
        if (res && res.length > 0) {
          setCourses(res);
          setSelectedCourseId(res[0].id);
          if (res[0].units?.[0]?.lessons?.[0]) {
            setSelectedLessonId(res[0].units[0].lessons[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load courses', err);
      } finally {
        setLoadingCourses(false);
      }
    };
    loadCourses();
  }, []);

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    const crs = courses.find((c) => c.id === courseId);
    if (crs && crs.units?.[0]?.lessons?.[0]) {
      setSelectedLessonId(crs.units[0].lessons[0].id);
    } else {
      setSelectedLessonId('');
    }
  };

  const addQuestion = (type: QuestionForm['questionType'] = 'MULTIPLE_CHOICE') => {
    if (type === 'MATCHING') {
      setQuestions((prev) => [
        ...prev,
        {
          prompt: 'Match the vocabulary words with their correct definitions:',
          questionType: 'MATCHING',
          options: [],
          matchingPairs: [
            { id: '1', leftTerm: 'Eloquent', rightMatch: 'Fluent and persuasive in speaking' },
            { id: '2', leftTerm: 'Punctual', rightMatch: 'Arriving or doing something at the agreed time' },
          ],
          jumbledWords: [],
          correctAnswer: 'Eloquent::Fluent and persuasive in speaking|Punctual::Arriving or doing something at the agreed time',
          explanation: '',
          points: 10,
        },
      ]);
    } else if (type === 'ORDERING') {
      setQuestions((prev) => [
        ...prev,
        {
          prompt: 'Drag and arrange the words in the correct sentence order:',
          questionType: 'ORDERING',
          options: ['We', 'will', 'finalize', 'the', 'quarterly', 'report', 'today'],
          matchingPairs: [],
          jumbledWords: ['quarterly', 'We', 'report', 'finalize', 'today', 'will', 'the'],
          correctAnswer: 'We will finalize the quarterly report today.',
          explanation: '',
          points: 10,
        },
      ]);
    } else {
      setQuestions((prev) => [
        ...prev,
        {
          prompt: '',
          questionType: type,
          options: type === 'MULTIPLE_CHOICE' ? ['', '', '', ''] : [],
          matchingPairs: [],
          jumbledWords: [],
          correctAnswer: type === 'TRUE_FALSE' ? 'True' : '',
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
      newOptions[optIdx] = value;
      updated[qIdx].options = newOptions;
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

  // Drag & drop sentence ordering handlers
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

  const removeQuestion = (index: number) => {
    if (questions.length === 1) {
      alert('A quiz must contain at least one question.');
      return;
    }
    setQuestions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedLessonId) {
      setError('Please select a lesson to attach this quiz to.');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a quiz title.');
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
      } else if (!q.correctAnswer.trim()) {
        setError(`Please specify the correct answer for Question #${i + 1}.`);
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

  const currentCourse = courses.find((c) => c.id === selectedCourseId);
  const availableLessons = currentCourse?.units?.flatMap((u) => u.lessons) || [];

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/teacher/quizzes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Create Interactive Quiz & Multi-Skill Assessments
          </h1>
          <p className="text-xs text-slate-500">
            Build Multiple Choice, True/False, Fill in the Blanks, Match Pairs, and Drag & Drop Word Order questions.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs font-semibold text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Basic Quiz Settings */}
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary-600" /> 1. Target Course & Lesson
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Course
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="w-full mt-1 rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              >
                {courses.map((crs) => (
                  <option key={crs.id} value={crs.id}>
                    [{crs.level}] {crs.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Target Lesson
              </label>
              <select
                value={selectedLessonId}
                onChange={(e) => setSelectedLessonId(e.target.value)}
                className="w-full mt-1 rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <Input
              label="Quiz Title"
              placeholder="e.g. Unit 3 Review: Workplace Idioms & Sentence Mechanics"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Input
              label="Short Instructions / Description"
              placeholder="Test your vocabulary retention and grammatical accuracy."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <Input
              label="Time Limit (Minutes)"
              type="number"
              min={1}
              value={timeLimitMinutes}
              onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value, 10) || 15)}
            />
            <Input
              label="Passing Score (%)"
              type="number"
              min={1}
              max={100}
              value={passingScore}
              onChange={(e) => setPassingScore(parseInt(e.target.value, 10) || 70)}
            />
            <Input
              label="Max Attempts Allowed"
              type="number"
              min={1}
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(parseInt(e.target.value, 10) || 3)}
            />
          </div>
        </Card>

        {/* Step 2: Question Builder */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary-600" /> 2. Assessment Questions ({questions.length})
            </h2>

            {/* Question Type Add Buttons */}
            <div className="flex flex-wrap gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => addQuestion('MULTIPLE_CHOICE')}
              >
                <Plus className="h-3 w-3 mr-1" /> Choice
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
                <Link2 className="h-3 w-3 mr-1" /> Match Question
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-8 border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 font-bold"
                onClick={() => addQuestion('ORDERING')}
              >
                <MoveHorizontal className="h-3 w-3 mr-1" /> Drag & Drop
              </Button>
            </div>
          </div>

          {questions.map((q, qIdx) => (
            <Card key={qIdx} className="p-5 space-y-4 relative border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="indigo" className="text-xs font-bold">
                    Question #{qIdx + 1}
                  </Badge>
                  <span className="text-[11px] font-mono text-slate-500">{q.points} Points</span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={q.questionType}
                    onChange={(e) => {
                      const newType = e.target.value as QuestionForm['questionType'];
                      updateQuestion(qIdx, 'questionType', newType);
                      if (newType === 'MATCHING' && q.matchingPairs.length === 0) {
                        updateQuestion(qIdx, 'matchingPairs', [
                          { id: '1', leftTerm: 'Term 1', rightMatch: 'Definition 1' },
                          { id: '2', leftTerm: 'Term 2', rightMatch: 'Definition 2' },
                        ]);
                      } else if (newType === 'ORDERING' && !q.correctAnswer) {
                        handleSentenceChange(qIdx, 'She has been studying English for five months.');
                      }
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                    <option value="TRUE_FALSE">True / False</option>
                    <option value="FILL_BLANKS">Fill in the Blanks</option>
                    <option value="MATCHING">🔗 Match Pairs</option>
                    <option value="ORDERING">🔀 Drag & Drop (Sentence Reorder)</option>
                  </select>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => removeQuestion(qIdx)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <Input
                label="Question Prompt / Instructions"
                placeholder="e.g. Match the words with their meanings / Reorder the words into a correct sentence..."
                value={q.prompt}
                onChange={(e) => updateQuestion(qIdx, 'prompt', e.target.value)}
                required
              />

              {/* MULTIPLE CHOICE BUILDER */}
              {q.questionType === 'MULTIPLE_CHOICE' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Answer Options & Correct Choice
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qIdx}`}
                          checked={q.correctAnswer === opt && opt.length > 0}
                          onChange={() => updateQuestion(qIdx, 'correctAnswer', opt)}
                          className="h-4 w-4 text-primary-600 accent-primary-600"
                          title="Set as correct answer"
                        />
                        <Input
                          placeholder={`Option ${optIdx + 1}`}
                          value={opt}
                          onChange={(e) => {
                            updateOption(qIdx, optIdx, e.target.value);
                            if (q.correctAnswer === opt) {
                              updateQuestion(qIdx, 'correctAnswer', e.target.value);
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Select the radio button next to the option that represents the correct answer.
                  </p>
                </div>
              )}

              {/* TRUE / FALSE BUILDER */}
              {q.questionType === 'TRUE_FALSE' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Correct Value
                  </label>
                  <div className="flex gap-4">
                    {['True', 'False'].map((val) => (
                      <label key={val} className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                        <input
                          type="radio"
                          name={`tf-${qIdx}`}
                          value={val}
                          checked={q.correctAnswer === val}
                          onChange={() => updateQuestion(qIdx, 'correctAnswer', val)}
                          className="h-4 w-4 text-primary-600 accent-primary-600"
                        />
                        <span>{val}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* FILL IN THE BLANKS BUILDER */}
              {q.questionType === 'FILL_BLANKS' && (
                <Input
                  label="Exact Correct Answer (or keyword)"
                  placeholder="e.g. have been"
                  value={q.correctAnswer}
                  onChange={(e) => updateQuestion(qIdx, 'correctAnswer', e.target.value)}
                  required
                />
              )}

              {/* MATCHING PAIRS BUILDER */}
              {q.questionType === 'MATCHING' && (
                <div className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                        <Link2 className="h-3.5 w-3.5 text-indigo-600" />
                        Match Question Pairs (Left Term ➔ Right Meaning)
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Learners will be presented with shuffled items and must match left cards to right cards.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 border-indigo-300"
                      onClick={() => addMatchingPair(qIdx)}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Pair
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {q.matchingPairs.map((pair, pIdx) => (
                      <div key={pair.id || pIdx} className="flex items-center gap-2">
                        <div className="w-6 text-center text-xs font-bold text-slate-400">
                          {pIdx + 1}
                        </div>
                        <Input
                          placeholder={`Left Term (e.g. Idiom / Word)`}
                          value={pair.leftTerm}
                          onChange={(e) => updateMatchingPair(qIdx, pIdx, 'leftTerm', e.target.value)}
                          className="flex-1 text-xs"
                        />
                        <span className="text-slate-400 font-bold text-xs">➔</span>
                        <Input
                          placeholder={`Right Match (e.g. Definition / Synonym)`}
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

              {/* DRAG & DROP / SENTENCE ORDERING BUILDER */}
              {q.questionType === 'ORDERING' && (
                <div className="space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                  <div>
                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <MoveHorizontal className="h-3.5 w-3.5 text-emerald-600" />
                      Drag & Drop Word Ordering / Sentence Builder
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Type the target sentence below. The system automatically splits it into interactive draggable/clickable tokens for students.
                    </p>
                  </div>

                  <Input
                    label="Target Correct Sentence"
                    placeholder="e.g. She has been studying English for five months."
                    value={q.correctAnswer}
                    onChange={(e) => handleSentenceChange(qIdx, e.target.value)}
                    required
                  />

                  {q.jumbledWords.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        Interactive Student Token Preview (Shuffled Chips):
                      </span>
                      <div className="flex flex-wrap gap-1.5 p-3 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                        {q.jumbledWords.map((word, wIdx) => (
                          <span
                            key={wIdx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 shadow-sm"
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

              <Input
                label="Answer Explanation (shown upon submission review)"
                placeholder="e.g. In English, we use 'since' with points in time and 'for' with durations."
                value={q.explanation}
                onChange={(e) => updateQuestion(qIdx, 'explanation', e.target.value)}
              />
            </Card>
          ))}
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <Link href="/teacher/quizzes">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>

          <Button type="submit" variant="gradient" disabled={submitting}>
            <CheckCircle2 className="h-4 w-4 mr-1.5" /> Save and Publish Quiz
          </Button>
        </div>
      </form>
    </div>
  );
}
