'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Video,
  Music,
  FileText,
  Sparkles,
  HelpCircle,
  Link2,
  MoveHorizontal,
  GripVertical,
  Activity as ActivityIcon,
  Layers,
  Clock,
  Eye,
  AlertCircle,
  Save
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

interface CourseOption {
  id: string;
  title: string;
  level: string;
  units?: Array<{
    id: string;
    title: string;
    orderIndex?: number;
  }>;
}

interface SectionForm {
  title: string;
  contentType: 'MARKDOWN' | 'VIDEO' | 'AUDIO' | 'VOCABULARY';
  content: string;
  mediaUrl?: string;
}

interface MatchingPairItem {
  leftTerm: string;
  rightMatch: string;
}

interface ActivityItemForm {
  title: string;
  type: 'MATCHING' | 'SENTENCE_REORDER' | 'FILL_BLANKS' | 'MULTIPLE_CHOICE';
  instructions: string;
  matchingPairs: MatchingPairItem[];
  targetSentence: string;
  jumbledTokens: string[];
  prompt: string;
  correctAnswer: string;
  options: string[];
}

const CEFR_SKILLS = [
  { value: 'GRAMMAR', label: 'Grammar & Syntax Structure', color: 'indigo' },
  { value: 'VOCABULARY', label: 'Vocabulary, Idioms & Collocations', color: 'blue' },
  { value: 'READING', label: 'Reading Comprehension & Analysis', color: 'emerald' },
  { value: 'LISTENING', label: 'Listening & Accent Comprehension', color: 'cyan' },
  { value: 'SPEAKING', label: 'Speaking & Conversational Fluency', color: 'amber' },
  { value: 'WRITING', label: 'Formal / Business Writing & Composition', color: 'purple' },
  { value: 'PRONUNCIATION', label: 'Phonetics, Intonation & Stress', color: 'rose' },
];

export default function UniversalTeacherLessonCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryCourseId = searchParams.get('courseId') || '';
  const queryUnitId = searchParams.get('unitId') || '';

  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(queryCourseId);
  const [units, setUnits] = useState<Array<{ id: string; title: string }>>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string>(queryUnitId);

  // Quick unit creation modal/state if no units exist
  const [showQuickUnitForm, setShowQuickUnitForm] = useState(false);
  const [quickUnitTitle, setQuickUnitTitle] = useState('');
  const [creatingQuickUnit, setCreatingQuickUnit] = useState(false);

  // Lesson Attributes
  const [title, setTitle] = useState('');
  const [skill, setSkill] = useState('GRAMMAR');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [isFreePreview, setIsFreePreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Content Sections
  const [sections, setSections] = useState<SectionForm[]>([
    {
      title: 'Grammar Rule & Contextual Foundation',
      contentType: 'MARKDOWN',
      content: '### Key Grammar Rule\n\nWhen using the **Present Perfect Continuous**, we emphasize the duration or continuity of an activity up to the present moment.\n\n*Structure:* `Subject + have/has + been + Verb-ing`\n\n*Examples:*\n- *I have been working on this report since 9 AM.*\n- *She has been studying English for five months.*',
    },
    {
      title: 'Workplace Vocabulary Focus',
      contentType: 'VOCABULARY',
      content: '**Key Terms:**\n- **Deadline:** The latest time by which something should be completed.\n- **Deliverable:** A tangible product or service produced as a result of a project.\n- **Stakeholder:** A person with an interest or concern in something.',
    },
  ]);

  // Interactive Activities
  const [activities, setActivities] = useState<ActivityItemForm[]>([
    {
      title: 'Vocabulary Association Match',
      type: 'MATCHING',
      instructions: 'Match each business term on the left with its accurate explanation on the right.',
      matchingPairs: [
        { leftTerm: 'Deliverable', rightMatch: 'A tangible product or service to be completed' },
        { leftTerm: 'Stakeholder', rightMatch: 'A party that has an interest in a company or project' },
        { leftTerm: 'Deadline', rightMatch: 'The latest date or time by which something should be finished' },
      ],
      targetSentence: '',
      jumbledTokens: [],
      prompt: 'Match each business term with its definition',
      correctAnswer: '',
      options: [],
    },
    {
      title: 'Drag & Drop Sentence Builder',
      type: 'SENTENCE_REORDER',
      instructions: 'Arrange the scrambled word tokens in the correct grammatical sequence.',
      matchingPairs: [],
      targetSentence: 'They have been negotiating the contract since morning.',
      jumbledTokens: ['negotiating', 'They', 'since', 'have', 'the', 'morning', 'been', 'contract'],
      prompt: 'Reconstruct the sentence in present perfect continuous',
      correctAnswer: 'They have been negotiating the contract since morning.',
      options: ['They', 'have', 'been', 'negotiating', 'the', 'contract', 'since', 'morning'],
    },
  ]);

  // Load teacher courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);
        const res = await apiClient.get<any>('/teacher/courses');
        const courseList = Array.isArray(res) ? res : res?.data || [];
        setCourses(courseList);

        if (courseList.length > 0) {
          const targetCourseId = queryCourseId && courseList.some((c: any) => c.id === queryCourseId)
            ? queryCourseId
            : courseList[0].id;
          setSelectedCourseId(targetCourseId);
        }
      } catch (err) {
        console.error('Failed to load courses', err);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, [queryCourseId]);

  // Load units whenever selected course changes
  useEffect(() => {
    if (!selectedCourseId) {
      setUnits([]);
      return;
    }

    const fetchCourseDetails = async () => {
      try {
        setLoadingUnits(true);
        const res = await apiClient.get<any>(`/teacher/courses/${selectedCourseId}`);
        if (res?.units) {
          setUnits(res.units);
          if (queryUnitId && res.units.some((u: any) => u.id === queryUnitId)) {
            setSelectedUnitId(queryUnitId);
          } else if (res.units.length > 0) {
            setSelectedUnitId(res.units[0].id);
          } else {
            setSelectedUnitId('');
          }
        } else {
          setUnits([]);
          setSelectedUnitId('');
        }
      } catch (err) {
        console.error('Failed to load course units', err);
      } finally {
        setLoadingUnits(false);
      }
    };

    fetchCourseDetails();
  }, [selectedCourseId, queryUnitId]);

  // Quick unit creation
  const handleCreateQuickUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUnitTitle.trim() || !selectedCourseId) return;

    try {
      setCreatingQuickUnit(true);
      const newUnit: any = await apiClient.post(`/teacher/courses/${selectedCourseId}/units`, {
        title: quickUnitTitle.trim(),
        orderIndex: units.length + 1,
      });

      const createdId = newUnit?.id || newUnit?.data?.id;
      setUnits((prev) => [...prev, { id: createdId || `unit-${Date.now()}`, title: quickUnitTitle.trim() }]);
      if (createdId) setSelectedUnitId(createdId);
      setQuickUnitTitle('');
      setShowQuickUnitForm(false);
    } catch (err: any) {
      alert(err.message || 'Failed to create unit');
    } finally {
      setCreatingQuickUnit(false);
    }
  };

  // Section Handlers
  const addSection = () => {
    setSections([
      ...sections,
      {
        title: `Section #${sections.length + 1}`,
        contentType: 'MARKDOWN',
        content: '',
      },
    ]);
  };

  const updateSection = (index: number, field: keyof SectionForm, value: any) => {
    setSections((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeSection = (index: number) => {
    if (sections.length === 1) {
      alert('A lesson must have at least one content section.');
      return;
    }
    setSections((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Activity Handlers
  const addActivity = (type: ActivityItemForm['type']) => {
    if (type === 'MATCHING') {
      setActivities((prev) => [
        ...prev,
        {
          title: 'Matching Exercise',
          type: 'MATCHING',
          instructions: 'Match each English item on the left with its corresponding partner on the right.',
          matchingPairs: [
            { leftTerm: 'Term 1', rightMatch: 'Meaning 1' },
            { leftTerm: 'Term 2', rightMatch: 'Meaning 2' },
          ],
          targetSentence: '',
          jumbledTokens: [],
          prompt: 'Match the pairs correctly',
          correctAnswer: '',
          options: [],
        },
      ]);
    } else if (type === 'SENTENCE_REORDER') {
      const sentence = 'We should schedule the kickoff meeting for next Tuesday.';
      const words = sentence.split(' ');
      const shuffled = [...words].sort(() => Math.random() - 0.5);
      setActivities((prev) => [
        ...prev,
        {
          title: 'Drag & Drop Sentence Builder',
          type: 'SENTENCE_REORDER',
          instructions: 'Reorder the words to construct the proper sentence.',
          matchingPairs: [],
          targetSentence: sentence,
          jumbledTokens: shuffled,
          prompt: 'Reconstruct the correct sentence',
          correctAnswer: sentence,
          options: words,
        },
      ]);
    } else {
      setActivities((prev) => [
        ...prev,
        {
          title: 'Practice Question',
          type,
          instructions: 'Answer the question carefully.',
          matchingPairs: [],
          targetSentence: '',
          jumbledTokens: [],
          prompt: '',
          correctAnswer: '',
          options: ['', '', '', ''],
        },
      ]);
    }
  };

  const updateActivity = (index: number, field: keyof ActivityItemForm, value: any) => {
    setActivities((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeActivity = (index: number) => {
    setActivities((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSentenceChange = (aIdx: number, sentence: string) => {
    setActivities((prev) => {
      const updated = [...prev];
      const words = sentence
        .trim()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
        .split(/\s+/)
        .filter(Boolean);
      const shuffled = [...words].sort(() => Math.random() - 0.5);

      updated[aIdx].targetSentence = sentence;
      updated[aIdx].correctAnswer = sentence;
      updated[aIdx].options = words;
      updated[aIdx].jumbledTokens = shuffled;
      return updated;
    });
  };

  const addMatchingPair = (aIdx: number) => {
    setActivities((prev) => {
      const updated = [...prev];
      updated[aIdx].matchingPairs.push({ leftTerm: '', rightMatch: '' });
      return updated;
    });
  };

  const updateMatchingPair = (aIdx: number, pIdx: number, field: 'leftTerm' | 'rightMatch', val: string) => {
    setActivities((prev) => {
      const updated = [...prev];
      updated[aIdx].matchingPairs[pIdx][field] = val;
      return updated;
    });
  };

  const removeMatchingPair = (aIdx: number, pIdx: number) => {
    setActivities((prev) => {
      const updated = [...prev];
      updated[aIdx].matchingPairs = updated[aIdx].matchingPairs.filter((_, idx) => idx !== pIdx);
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCourseId) {
      setError('Please select a course for this lesson.');
      return;
    }

    if (!selectedUnitId) {
      setError('Please select or create a unit for this lesson.');
      return;
    }

    if (!title.trim()) {
      setError('Lesson title is required.');
      return;
    }

    try {
      setSubmitting(true);

      // 1. Create the Lesson
      const lessonRes: any = await apiClient.post(`/teacher/courses/${selectedCourseId}/units/${selectedUnitId}/lessons`, {
        title,
        skill,
        estimatedMinutes: Number(estimatedMinutes),
        isFreePreview,
        isPublished: true,
        sections: sections.map((s, idx) => ({
          title: s.title,
          contentType: s.contentType,
          content: s.content,
          mediaUrl: s.mediaUrl || undefined,
          orderIndex: idx + 1,
        })),
      });

      const lessonId = lessonRes?.id || lessonRes?.data?.id;

      // 2. Create interactive activities if attached
      if (lessonId && activities.length > 0) {
        for (let i = 0; i < activities.length; i++) {
          const act = activities[i];
          let questionsPayload: any[] = [];

          if (act.type === 'MATCHING') {
            const validPairs = act.matchingPairs.filter((p) => p.leftTerm.trim() && p.rightMatch.trim());
            if (validPairs.length > 0) {
              questionsPayload = [
                {
                  prompt: act.prompt || 'Match each term with its corresponding partner',
                  options: validPairs.map((p) => `${p.leftTerm.trim()}::${p.rightMatch.trim()}`),
                  correctAnswer: validPairs.map((p) => `${p.leftTerm.trim()}::${p.rightMatch.trim()}`).join('|'),
                  explanation: 'Pair associations verified.',
                  orderIndex: 1,
                },
              ];
            }
          } else if (act.type === 'SENTENCE_REORDER') {
            if (act.targetSentence.trim()) {
              questionsPayload = [
                {
                  prompt: act.prompt || 'Reconstruct the sentence by arranging the words in order',
                  options: act.jumbledTokens.length > 0 ? act.jumbledTokens : act.options,
                  correctAnswer: act.targetSentence.trim(),
                  explanation: 'Grammatical syntax order.',
                  orderIndex: 1,
                },
              ];
            }
          } else {
            if (act.prompt.trim()) {
              questionsPayload = [
                {
                  prompt: act.prompt,
                  options: act.options.filter(Boolean),
                  correctAnswer: act.correctAnswer || act.options[0] || 'Correct',
                  orderIndex: 1,
                },
              ];
            }
          }

          if (questionsPayload.length > 0) {
            try {
              await apiClient.post(`/activities/lesson/${lessonId}`, {
                title: act.title || `Interactive Activity #${i + 1}`,
                type: act.type,
                instructions: act.instructions || '',
                orderIndex: i + 1,
                questions: questionsPayload,
              });
            } catch (actErr) {
              console.warn('Failed to attach activity to lesson:', actErr);
            }
          }
        }
      }

      // Redirect back to the Curriculum Studio
      router.push(selectedCourseId ? `/studio/${selectedCourseId}` : '/teacher/courses');
    } catch (err: any) {
      setError(err.message || 'Failed to create lesson.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={selectedCourseId ? `/studio/${selectedCourseId}` : '/teacher/courses'}>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="indigo" className="text-[11px] font-bold">
                Teacher Studio
              </Badge>
              <span className="text-slate-400 text-xs">/</span>
              <span className="text-xs font-semibold text-slate-500">Curriculum Authoring</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Create Multi-Skill Lesson
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Design rich, CEFR-aligned learning modules with rich text, media resources, Match Questions, and Drag & Drop builders.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/teacher/courses">
            <Button variant="outline" size="sm">
              <BookOpen className="h-3.5 w-3.5 mr-1.5" /> All Courses
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300 shadow-sm animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Course & Unit Placement */}
        <Card className="p-6 border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Layers className="h-4 w-4 text-primary-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              1. Curriculum Placement & Skill Target
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Course Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Course Curriculum <span className="text-rose-500">*</span>
              </label>
              {loadingCourses ? (
                <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              ) : courses.length > 0 ? (
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white font-medium"
                  required
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.level}] {c.title}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800">
                  No courses found. Please create a course first.
                </div>
              )}
            </div>

            {/* Unit Selector & Quick Unit Creator */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Belongs to Unit <span className="text-rose-500">*</span>
                </label>
                {selectedCourseId && !showQuickUnitForm && (
                  <button
                    type="button"
                    onClick={() => setShowQuickUnitForm(true)}
                    className="text-[11px] font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> New Unit
                  </button>
                )}
              </div>

              {loadingUnits ? (
                <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              ) : showQuickUnitForm ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Unit 2: Business Negotiations"
                    value={quickUnitTitle}
                    onChange={(e) => setQuickUnitTitle(e.target.value)}
                    className="text-xs"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="gradient"
                    onClick={handleCreateQuickUnit}
                    disabled={creatingQuickUnit || !quickUnitTitle.trim()}
                  >
                    {creatingQuickUnit ? 'Saving...' : 'Add'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowQuickUnitForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : units.length > 0 ? (
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white font-medium"
                  required
                >
                  {units.map((u, idx) => (
                    <option key={u.id} value={u.id}>
                      Unit {idx + 1}: {u.title}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 text-xs text-amber-800 dark:text-amber-300">
                  <span>This course has no units yet.</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 border-amber-300"
                    onClick={() => setShowQuickUnitForm(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Create First Unit
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-3 border-t border-slate-100 dark:border-slate-800">
            {/* Primary Skill Focus */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Primary 7-Skill Focus
              </label>
              <select
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white font-medium"
              >
                {CEFR_SKILLS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Estimated Duration */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Est. Duration (Minutes)
              </label>
              <Input
                type="number"
                min={5}
                max={180}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(parseInt(e.target.value, 10) || 30)}
                required
              />
            </div>

            {/* Free Preview Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Eye className="h-3.5 w-3.5 text-slate-400" />
                Student Access Setting
              </label>
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors">
                <input
                  type="checkbox"
                  checked={isFreePreview}
                  onChange={(e) => setIsFreePreview(e.target.checked)}
                  className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                />
                <span className="text-xs font-medium text-slate-900 dark:text-white">
                  Allow Free Preview (Trial Students)
                </span>
              </label>
            </div>
          </div>

          {/* Lesson Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Lesson Title <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="e.g. Mastering Modal Verbs in Executive Business Negotiations"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm font-semibold"
              required
            />
          </div>
        </Card>

        {/* Step 2: Content Sections Authoring */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary-600" />
                2. Lesson Content Sections ({sections.length})
              </h2>
              <p className="text-xs text-slate-500">
                Structure your lesson into modular blocks featuring rich text, grammar rules, vocabulary items, audio tracks, or video lectures.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addSection}>
              <Plus className="h-3.5 w-3.5 mr-1.5 text-primary-600" /> Add Section Block
            </Button>
          </div>

          <div className="space-y-4">
            {sections.map((sec, idx) => (
              <Card key={idx} className="p-6 space-y-4 border-slate-200/80 dark:border-slate-800 shadow-sm relative group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-black text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Content Block #{idx + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={sec.contentType}
                      onChange={(e) => updateSection(idx, 'contentType', e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium dark:border-slate-800 dark:bg-slate-900"
                    >
                      <option value="MARKDOWN">Markdown / Grammar Explanation</option>
                      <option value="VOCABULARY">Vocabulary & Glossary</option>
                      <option value="AUDIO">Audio Dialogue & Pronunciation</option>
                      <option value="VIDEO">Video Lecture Stream</option>
                    </select>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                      onClick={() => removeSection(idx)}
                      title="Remove section"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Section Header / Topic Title
                  </label>
                  <Input
                    placeholder="e.g. Grammar Rule: Present Perfect vs Simple Past"
                    value={sec.title}
                    onChange={(e) => updateSection(idx, 'title', e.target.value)}
                    required
                  />
                </div>

                {(sec.contentType === 'AUDIO' || sec.contentType === 'VIDEO') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                        {sec.contentType === 'AUDIO' ? (
                          <Music className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Video className="h-3.5 w-3.5 text-blue-500" />
                        )}
                        Media Stream URL (MP3, MP4, Vimeo, YouTube)
                      </label>
                      <Input
                        placeholder={sec.contentType === 'AUDIO' ? 'https://cdn.example.com/dialogue.mp3' : 'https://vimeo.com/...'}
                        value={sec.mediaUrl || ''}
                        onChange={(e) => updateSection(idx, 'mediaUrl', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <RichTextEditor
                  label="Section Content, Examples & Rules (Markdown, Tables, Callouts & CEFR Notes)"
                  value={sec.content}
                  onChange={(val) => updateSection(idx, 'content', val)}
                  placeholder="Type or format your lesson explanations, conversation transcripts, grammar rules, or exercises..."
                  minRows={6}
                  category="lesson"
                />
              </Card>
            ))}
          </div>
        </div>

        {/* Step 3: Interactive Practice & Question Builders */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ActivityIcon className="h-5 w-5 text-emerald-600" />
                3. Interactive Exercises & Activities ({activities.length})
              </h2>
              <p className="text-xs text-slate-500">
                Engage students with Match Questions (Term & Definition pairs), Drag & Drop sentence word reordering, and knowledge checks.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300 font-bold"
                onClick={() => addActivity('MATCHING')}
              >
                <Link2 className="h-3.5 w-3.5 mr-1.5" /> + Match Question
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 font-bold"
                onClick={() => addActivity('SENTENCE_REORDER')}
              >
                <MoveHorizontal className="h-3.5 w-3.5 mr-1.5" /> + Drag & Drop Reorder
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => addActivity('FILL_BLANKS')}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Fill in Blanks
              </Button>
            </div>
          </div>

          {activities.length === 0 ? (
            <Card className="p-8 text-center border-dashed border-slate-200 dark:border-slate-800">
              <Sparkles className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No interactive exercises added yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Click &quot;+ Match Question&quot; or &quot;+ Drag & Drop Reorder&quot; above to add interactive activities.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {activities.map((act, aIdx) => (
                <Card key={aIdx} className="p-6 space-y-4 border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={act.type === 'MATCHING' ? 'indigo' : act.type === 'SENTENCE_REORDER' ? 'success' : 'outline'}
                        className="text-xs font-bold"
                      >
                        {act.type === 'MATCHING' ? '🔗 Match Question' : act.type === 'SENTENCE_REORDER' ? '🔀 Drag & Drop Word Reorder' : act.type}
                      </Badge>
                      <span className="text-xs text-slate-500 font-medium">Activity #{aIdx + 1}</span>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                      onClick={() => removeActivity(aIdx)}
                      title="Remove activity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Activity Title
                      </label>
                      <Input
                        placeholder="e.g. Vocabulary Collocation Match"
                        value={act.title}
                        onChange={(e) => updateActivity(aIdx, 'title', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Student Instructions
                      </label>
                      <Input
                        placeholder="e.g. Drag each term to its matching definition"
                        value={act.instructions}
                        onChange={(e) => updateActivity(aIdx, 'instructions', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* 1. MATCHING BUILDER */}
                  {act.type === 'MATCHING' && (
                    <div className="p-4 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                          Matching Pair Associations ({act.matchingPairs.length} pairs)
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 border-indigo-200 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:text-indigo-300"
                          onClick={() => addMatchingPair(aIdx)}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Pair
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {act.matchingPairs.map((pair, pIdx) => (
                          <div key={pIdx} className="flex items-center gap-2">
                            <Input
                              placeholder="Left Term (e.g. Overtime)"
                              value={pair.leftTerm}
                              onChange={(e) => updateMatchingPair(aIdx, pIdx, 'leftTerm', e.target.value)}
                              className="text-xs bg-white dark:bg-slate-900"
                            />
                            <span className="text-slate-400 font-bold text-xs shrink-0">⟷</span>
                            <Input
                              placeholder="Right Definition (e.g. Extra hours worked)"
                              value={pair.rightMatch}
                              onChange={(e) => updateMatchingPair(aIdx, pIdx, 'rightMatch', e.target.value)}
                              className="text-xs bg-white dark:bg-slate-900"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive h-8 w-8 p-0 shrink-0"
                              onClick={() => removeMatchingPair(aIdx, pIdx)}
                              disabled={act.matchingPairs.length <= 1}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. DRAG & DROP SENTENCE BUILDER */}
                  {act.type === 'SENTENCE_REORDER' && (
                    <div className="p-4 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-300 mb-1">
                          Target Full Sentence (Correct Order)
                        </label>
                        <Input
                          placeholder="e.g. She has been managing this client account for three years."
                          value={act.targetSentence}
                          onChange={(e) => handleSentenceChange(aIdx, e.target.value)}
                          className="text-xs bg-white dark:bg-slate-900 font-medium"
                        />
                        <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400 mt-1">
                          The system automatically tokenizes this sentence into interactive draggable tokens for students to reorder.
                        </p>
                      </div>

                      {act.jumbledTokens && act.jumbledTokens.length > 0 && (
                        <div className="pt-2">
                          <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block mb-1.5">
                            Scrambled Preview:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {act.jumbledTokens.map((tok, tIdx) => (
                              <Badge key={tIdx} variant="outline" className="text-xs py-1 px-2.5 bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-700">
                                {tok}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. FILL IN BLANKS */}
                  {act.type === 'FILL_BLANKS' && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Prompt / Incomplete Sentence
                        </label>
                        <Input
                          placeholder="e.g. I look forward to _____ from you soon. (hear / hearing / heard)"
                          value={act.prompt}
                          onChange={(e) => updateActivity(aIdx, 'prompt', e.target.value)}
                          className="text-xs bg-white dark:bg-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Correct Target Answer
                        </label>
                        <Input
                          placeholder="e.g. hearing"
                          value={act.correctAnswer}
                          onChange={(e) => updateActivity(aIdx, 'correctAnswer', e.target.value)}
                          className="text-xs bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Action Bottom Bar */}
        <div className="sticky bottom-4 z-20 flex items-center justify-between rounded-2xl bg-white/95 dark:bg-slate-900/95 p-4 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-md">
          <Link href={selectedCourseId ? `/studio/${selectedCourseId}` : '/teacher/courses'}>
            <Button type="button" variant="outline" size="sm">
              Cancel
            </Button>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:inline">
              {sections.length} Section{sections.length !== 1 ? 's' : ''} &bull; {activities.length} Activit{activities.length !== 1 ? 'ies' : 'y'}
            </span>
            <Button type="submit" variant="gradient" size="sm" disabled={submitting} className="min-w-[160px]">
              <Save className="mr-1.5 h-4 w-4" />
              {submitting ? 'Publishing Lesson...' : 'Save & Publish Lesson'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
