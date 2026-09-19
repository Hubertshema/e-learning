'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
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
  Link2,
  MoveHorizontal,
  GripVertical,
  Activity as ActivityIcon,
  Layers,
  Clock,
  Eye,
  Check,
  ChevronRight,
  ChevronLeft,
  Volume2,
  Play,
  HelpCircle,
  Award,
  Zap,
  Sliders,
  Maximize2,
  Edit3,
  X,
  AlertCircle,
  Lightbulb,
  CheckSquare
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { RichTextEditor, RichTextRenderer } from '@/components/ui/rich-text-editor';
import { ActivityContainer, ActivityData } from '@/components/activities/activity-container';

export interface SectionForm {
  id?: string;
  title: string;
  contentType: 'MARKDOWN' | 'VOCABULARY' | 'AUDIO' | 'VIDEO';
  content: string;
  mediaUrl?: string;
}

export interface MatchingPairItem {
  leftTerm: string;
  rightMatch: string;
}

export interface ActivityItemForm {
  id?: string;
  title: string;
  type: 'MATCHING' | 'SENTENCE_REORDER' | 'FILL_BLANKS' | 'MULTIPLE_CHOICE' | 'SPEAKING_PRACTICE';
  instructions: string;
  matchingPairs: MatchingPairItem[];
  targetSentence: string;
  jumbledTokens: string[];
  prompt: string;
  correctAnswer: string;
  options: string[];
  explanation?: string;
}

export const SKILL_OPTIONS = [
  { value: 'GRAMMAR', label: 'Grammar & Syntax', icon: '🔤', desc: 'Rules, structures, tenses & sentence mechanics' },
  { value: 'VOCABULARY', label: 'Vocabulary & Idioms', icon: '📚', desc: 'Contextual lexicon, collocations & phrasal verbs' },
  { value: 'SPEAKING', label: 'Speaking & Fluency', icon: '🗣️', desc: 'Conversational dialogue, roleplay & pronunciation' },
  { value: 'LISTENING', label: 'Listening & Accents', icon: '🎧', desc: 'Audio dialogues, podcasts & accent comprehension' },
  { value: 'READING', label: 'Reading Comprehension', icon: '📖', desc: 'Passages, articles & analytical questions' },
  { value: 'WRITING', label: 'Writing & Composition', icon: '✍️', desc: 'Formal emails, essays & report formatting' },
  { value: 'PRONUNCIATION', label: 'Phonetics & Intonation', icon: '🔊', desc: 'IPA sounds, word stress & connected speech' },
  { value: 'COMMUNICATION', label: 'Real-World Tasks', icon: '🌐', desc: 'Workplace simulations & negotiation scenarios' },
];

interface LessonFormStudioProps {
  courseId: string;
  initialUnitId?: string;
  lessonId?: string; // If provided, mode is 'edit'
  mode?: 'create' | 'edit';
}

export function LessonFormStudio({
  courseId,
  initialUnitId = '',
  lessonId,
  mode = 'create',
}: LessonFormStudioProps) {
  const router = useRouter();

  // Wizard Step (1: Concept, 2: Content, 3: Activities, 4: Simulator)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  // Course & Units Context
  const [units, setUnits] = useState<any[]>([]);
  const [courseLevel, setCourseLevel] = useState('B1');
  const [courseTitle, setCourseTitle] = useState('');
  const [loadingInitial, setLoadingInitial] = useState(mode === 'edit');

  // Step 1: Lesson Concept
  const [selectedUnitId, setSelectedUnitId] = useState(initialUnitId);
  const [title, setTitle] = useState('');
  const [skill, setSkill] = useState('GRAMMAR');
  const [supportingSkills, setSupportingSkills] = useState<string[]>(['VOCABULARY', 'SPEAKING']);
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [isFreePreview, setIsFreePreview] = useState(false);

  // Step 2: Content Sections
  const [sections, setSections] = useState<SectionForm[]>([
    {
      title: 'Grammar Rule & Contextual Demonstration',
      contentType: 'MARKDOWN',
      content: '### Key Language Concept\n\nWhen using the **Present Perfect Continuous**, we emphasize the ongoing duration or continuity of an activity leading up to now.\n\n*Formula:* `Subject + have/has + been + Verb-ing`\n\n*Examples:*\n- *I have been leading the marketing project since January.*\n- *They have been discussing the contract terms all morning.*',
    },
    {
      title: 'Target Vocabulary & Expression Bank',
      contentType: 'VOCABULARY',
      content: '**Key Industry Terms:**\n- **Deliverable:** Any unique and verifiable product, result, or capability required to complete a process.\n- **Stakeholder:** Any individual, group, or organization with an interest in a project.\n- **Milestone:** A significant stage or event in the development of something.',
    },
  ]);

  // Step 3: Interactive Exercises
  const [activities, setActivities] = useState<ActivityItemForm[]>([
    {
      title: 'Key Term Association Match',
      type: 'MATCHING',
      instructions: 'Connect each term on the left with its precise operational meaning on the right.',
      matchingPairs: [
        { leftTerm: 'Deliverable', rightMatch: 'A tangible product or service to be finalized' },
        { leftTerm: 'Stakeholder', rightMatch: 'A person with a direct interest in project outcomes' },
        { leftTerm: 'Milestone', rightMatch: 'A critical event or target deadline in the roadmap' },
      ],
      targetSentence: '',
      jumbledTokens: [],
      prompt: 'Match the business expressions with their definitions',
      correctAnswer: '',
      options: [],
      explanation: 'Verified terminology definitions.',
    },
    {
      title: 'Drag & Drop Sentence Builder',
      type: 'SENTENCE_REORDER',
      instructions: 'Arrange the scrambled word tokens in the correct grammatical syntax.',
      matchingPairs: [],
      targetSentence: 'They have been negotiating the contract since morning.',
      jumbledTokens: ['negotiating', 'They', 'since', 'have', 'the', 'morning', 'been', 'contract'],
      prompt: 'Reconstruct the sentence in present perfect continuous',
      correctAnswer: 'They have been negotiating the contract since morning.',
      options: ['They', 'have', 'been', 'negotiating', 'the', 'contract', 'since', 'morning'],
      explanation: 'Subject + have been + verb-ing + prepositional time phrase.',
    },
  ]);

  // Status & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // AI Modal State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCefrLevel, setAiCefrLevel] = useState('B1');
  const [aiSkill, setAiSkill] = useState('GRAMMAR');
  const [aiDuration, setAiDuration] = useState(45);
  const [aiTeachingStyle, setAiTeachingStyle] = useState('COMMUNICATIVE');

  // Load Course and existing Lesson if editing
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingInitial(true);
        const courseRes = await apiClient.get<any>(`/teacher/courses/${courseId}`);
        if (courseRes) {
          setCourseTitle(courseRes.title || 'Course');
          if (courseRes.level) {
            setCourseLevel(courseRes.level);
            setAiCefrLevel(courseRes.level);
          }
          if (courseRes.units) {
            setUnits(courseRes.units);
            if (!selectedUnitId && courseRes.units.length > 0) {
              setSelectedUnitId(courseRes.units[0].id);
            }
          }
        }

        // If in edit mode, fetch existing lesson data
        if (mode === 'edit' && lessonId) {
          const lessonRes = await apiClient.get<any>(`/teacher/lessons/${lessonId}`);
          const lData = lessonRes?.data || lessonRes;
          if (lData) {
            setTitle(lData.title || '');
            setSkill(lData.skill || 'GRAMMAR');
            setEstimatedMinutes(lData.estimatedMinutes || 30);
            setIsFreePreview(Boolean(lData.isFreePreview));
            if (lData.unitId) setSelectedUnitId(lData.unitId);

            if (lData.sections && lData.sections.length > 0) {
              setSections(
                lData.sections.map((s: any) => ({
                  id: s.id,
                  title: s.title,
                  contentType: s.contentType || 'MARKDOWN',
                  content: s.content || '',
                  mediaUrl: s.mediaUrl,
                }))
              );
            }

            if (lData.activities && lData.activities.length > 0) {
              const mappedActs: ActivityItemForm[] = lData.activities.map((a: any) => {
                const q = a.questions?.[0];
                if (a.type === 'MATCHING') {
                  const pairs: MatchingPairItem[] = (q?.options || []).map((optStr: string) => {
                    const [left, right] = optStr.split('::');
                    return { leftTerm: left || '', rightMatch: right || '' };
                  });
                  return {
                    id: a.id,
                    title: a.title,
                    type: 'MATCHING',
                    instructions: a.instructions || 'Match the terms',
                    matchingPairs: pairs.length > 0 ? pairs : [{ leftTerm: '', rightMatch: '' }],
                    targetSentence: '',
                    jumbledTokens: [],
                    prompt: q?.prompt || '',
                    correctAnswer: q?.correctAnswer || '',
                    options: [],
                    explanation: q?.explanation,
                  };
                } else if (a.type === 'SENTENCE_REORDER') {
                  const target = q?.correctAnswer || '';
                  const tokens = q?.options || target.split(' ');
                  return {
                    id: a.id,
                    title: a.title,
                    type: 'SENTENCE_REORDER',
                    instructions: a.instructions || 'Reconstruct the sentence',
                    matchingPairs: [],
                    targetSentence: target,
                    jumbledTokens: tokens,
                    prompt: q?.prompt || 'Arrange tokens',
                    correctAnswer: target,
                    options: tokens,
                    explanation: q?.explanation,
                  };
                } else {
                  return {
                    id: a.id,
                    title: a.title,
                    type: a.type || 'MULTIPLE_CHOICE',
                    instructions: a.instructions || '',
                    matchingPairs: [],
                    targetSentence: '',
                    jumbledTokens: [],
                    prompt: q?.prompt || '',
                    correctAnswer: q?.correctAnswer || '',
                    options: q?.options || ['', '', '', ''],
                    explanation: q?.explanation,
                  };
                }
              });
              setActivities(mappedActs);
            }
          }
        }
      } catch (err: any) {
        console.error('Failed to load lesson studio data:', err);
        setError('Could not load curriculum data.');
      } finally {
        setLoadingInitial(false);
      }
    };

    loadData();
  }, [courseId, lessonId, mode]);

  // Section Handlers
  const addSection = (type: SectionForm['contentType'] = 'MARKDOWN') => {
    let defaultTitle = 'Core Concept Explanation';
    let defaultContent = '';

    if (type === 'VOCABULARY') {
      defaultTitle = 'Key Vocabulary & Phrases';
      defaultContent = '**Vocabulary Focus:**\n- **Term 1:** Definition and usage in context.\n- **Term 2:** Example sentence illustrating natural speech.';
    } else if (type === 'AUDIO') {
      defaultTitle = 'Contextual Audio Dialogue';
      defaultContent = '### Audio Dialogue Script\n\n**Speaker A:** Good morning, how is the project tracking?\n**Speaker B:** We are on schedule for delivery by Friday.';
    } else if (type === 'VIDEO') {
      defaultTitle = 'Video Masterclass';
      defaultContent = 'Watch the interactive video lecture and take note of the stress patterns and idioms used.';
    }

    setSections((prev) => [
      ...prev,
      {
        title: defaultTitle,
        contentType: type,
        content: defaultContent,
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
      alert('Lesson must include at least one content section.');
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
          title: 'Contextual Term Match',
          type: 'MATCHING',
          instructions: 'Connect each term with its accurate definition or synonym.',
          matchingPairs: [
            { leftTerm: 'Colleague', rightMatch: 'A person with whom one works in a profession' },
            { leftTerm: 'Agenda', rightMatch: 'A list of items to be discussed at a formal meeting' },
          ],
          targetSentence: '',
          jumbledTokens: [],
          prompt: 'Match each term with its definition',
          correctAnswer: '',
          options: [],
        },
      ]);
    } else if (type === 'SENTENCE_REORDER') {
      const sentence = 'We should confirm the project timeline before the kickoff meeting.';
      const words = sentence.split(' ');
      const shuffled = [...words].sort(() => Math.random() - 0.5);
      setActivities((prev) => [
        ...prev,
        {
          title: 'Drag & Drop Sentence Builder',
          type: 'SENTENCE_REORDER',
          instructions: 'Reconstruct the scrambled words into the proper grammatical sequence.',
          matchingPairs: [],
          targetSentence: sentence,
          jumbledTokens: shuffled,
          prompt: 'Reconstruct the sentence',
          correctAnswer: sentence,
          options: words,
        },
      ]);
    } else if (type === 'FILL_BLANKS') {
      setActivities((prev) => [
        ...prev,
        {
          title: 'Grammar Fill-in-the-Blank',
          type: 'FILL_BLANKS',
          instructions: 'Type the missing word that completes the sentence with grammatical accuracy.',
          matchingPairs: [],
          targetSentence: '',
          jumbledTokens: [],
          prompt: 'She has [blank] working on the design prototype since Monday.',
          correctAnswer: 'been',
          options: [],
          explanation: 'The present perfect continuous requires "has been + -ing".',
        },
      ]);
    } else {
      setActivities((prev) => [
        ...prev,
        {
          title: 'Multiple Choice Checkpoint',
          type: 'MULTIPLE_CHOICE',
          instructions: 'Select the best phrase or answer from the options below.',
          matchingPairs: [],
          targetSentence: '',
          jumbledTokens: [],
          prompt: 'Which phrase is most appropriate for opening a formal business inquiry?',
          correctAnswer: 'I am writing to inquire about...',
          options: [
            'I am writing to inquire about...',
            'Hey there, what is up with...',
            'Just wanted to see...',
            'Can you tell me stuff regarding...',
          ],
          explanation: 'Standard professional correspondence opening formula.',
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

  // Toggle Supporting Skill
  const toggleSupportingSkill = (sVal: string) => {
    if (supportingSkills.includes(sVal)) {
      setSupportingSkills(supportingSkills.filter((s) => s !== sVal));
    } else {
      setSupportingSkills([...supportingSkills, sVal]);
    }
  };

  // AI Generator Integration
  const handleGenerateWithAi = async () => {
    if (!aiTopic.trim()) {
      alert('Please enter a lesson topic for AI generation.');
      return;
    }

    try {
      setAiGenerating(true);

      const aiRes = await apiClient.post<any>('/ai/lessons/generate', {
        topic: aiTopic.trim(),
        cefrLevel: aiCefrLevel,
        targetSkill: aiSkill,
        durationMinutes: Number(aiDuration) || 45,
        teachingStyle: aiTeachingStyle,
      });

      const lessonPlan = aiRes?.data || aiRes;

      if (lessonPlan) {
        setTitle(lessonPlan.title || `${aiTopic.trim()} (CEFR ${aiCefrLevel})`);
        setSkill(aiSkill);
        setEstimatedMinutes(Number(aiDuration) || 45);

        // Build rich structured sections
        const generatedSections: SectionForm[] = [];

        if (lessonPlan.presentation) {
          generatedSections.push({
            title: lessonPlan.presentation.title || '1. Core Language Rule & Presentation',
            contentType: 'MARKDOWN',
            content: `### ${lessonPlan.presentation.title || 'Core Rule & Context'}\n\n**Instructor Demonstration:**\n${lessonPlan.presentation.teacherAction}\n\n**Learner Focus:**\n${lessonPlan.presentation.studentAction}\n\n${
              lessonPlan.presentation.differentiation?.forLowerLevel
                ? `> **Scaffolding Note (Tier 1):** ${lessonPlan.presentation.differentiation.forLowerLevel}\n\n`
                : ''
            }${
              lessonPlan.presentation.differentiation?.forHigherLevel
                ? `> **Extension Challenge (Tier 3):** ${lessonPlan.presentation.differentiation.forHigherLevel}\n`
                : ''
            }`,
          });
        }

        if (lessonPlan.warmup) {
          generatedSections.push({
            title: lessonPlan.warmup.title || '2. Warm-Up Dialogue & Discussion',
            contentType: 'MARKDOWN',
            content: `### Contextual Warm-Up\n\n${lessonPlan.warmup.teacherAction}\n\n*Interactive Task:* ${lessonPlan.warmup.studentAction}\n\n**Target Materials:**\n${(lessonPlan.warmup.materials || []).map((m: string) => `- ${m}`).join('\n')}`,
          });
        }

        if (lessonPlan.summaryKeyTakeaways && lessonPlan.summaryKeyTakeaways.length > 0) {
          generatedSections.push({
            title: '3. Vocabulary Bank & Key Takeaways',
            contentType: 'VOCABULARY',
            content: `### CEFR ${aiCefrLevel} Essential Expressions\n\n${lessonPlan.summaryKeyTakeaways.map((k: string) => `✅ **Key Point:** ${k}`).join('\n\n')}\n\n**Homework Task:** ${lessonPlan.homeworkAssignment || 'Review key expressions and record a 60-second summary.'}`,
          });
        }

        if (generatedSections.length > 0) {
          setSections(generatedSections);
        }

        // Generate matching or sentence reorder activities with AI
        try {
          const actRes = await apiClient.post<any>('/ai/activities/generate', {
            topic: aiTopic.trim(),
            cefrLevel: aiCefrLevel,
            skill: aiSkill,
            activityType: 'SENTENCE_ORDER',
            itemCount: 2,
          });
          const actData = actRes?.data || actRes;

          const newActivities: ActivityItemForm[] = [
            {
              title: `${aiTopic.trim()} Key Expression Match`,
              type: 'MATCHING',
              instructions: `Connect key expressions related to ${aiTopic.trim()} with their proper communicative meanings.`,
              matchingPairs: [
                { leftTerm: `${aiTopic.trim()} (Concept)`, rightMatch: `Key linguistic application at CEFR ${aiCefrLevel}` },
                { leftTerm: 'Communicative Accuracy', rightMatch: 'Grammatically sound syntactic usage in context' },
                { leftTerm: 'Contextual Fluency', rightMatch: 'Spontaneous and natural expression in conversation' },
              ],
              targetSentence: '',
              jumbledTokens: [],
              prompt: `Match the key expressions for ${aiTopic.trim()}`,
              correctAnswer: '',
              options: [],
              explanation: 'Accurate contextual definitions.',
            },
          ];

          if (actData?.items && actData.items.length > 0) {
            const item = actData.items[0];
            const sentence = item.correctAnswer || `We discussed ${aiTopic.trim()} during the communicative session.`;
            const words = sentence.trim().split(/\s+/);
            const shuffled = [...words].sort(() => Math.random() - 0.5);

            newActivities.push({
              title: 'Drag & Drop Sentence Builder',
              type: 'SENTENCE_REORDER',
              instructions: 'Reconstruct the scrambled tokens into the grammatically sound sentence.',
              matchingPairs: [],
              targetSentence: sentence,
              jumbledTokens: shuffled,
              prompt: item.prompt || `Reconstruct the sentence for ${aiTopic.trim()}`,
              correctAnswer: sentence,
              options: words,
              explanation: 'Proper syntactic order.',
            });
          }

          setActivities(newActivities);
        } catch (actErr) {
          console.warn('Activity generation fallback', actErr);
        }

        setShowAiModal(false);
        setSuccessBanner(`✨ AI generated complete multi-skill lesson for "${aiTopic.trim()}". Review the sections and interactive exercises before saving.`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate lesson with AI.');
    } finally {
      setAiGenerating(false);
    }
  };

  // Submit Handler (Create or Update)
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (!selectedUnitId) {
      setError('Please select a Curriculum Unit for this lesson.');
      setActiveStep(1);
      return;
    }

    if (!title.trim()) {
      setError('Lesson title is required.');
      setActiveStep(1);
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        title: title.trim(),
        skill,
        estimatedMinutes: Number(estimatedMinutes) || 30,
        isFreePreview,
        isPublished: true,
        sections: sections.map((s, idx) => ({
          title: s.title,
          contentType: s.contentType,
          content: s.content,
          mediaUrl: s.mediaUrl || undefined,
          orderIndex: idx + 1,
        })),
      };

      let finalLessonId = lessonId;

      if (mode === 'edit' && lessonId) {
        await apiClient.patch(`/teacher/lessons/${lessonId}`, payload);
      } else {
        const lessonRes: any = await apiClient.post(
          `/teacher/courses/${courseId}/units/${selectedUnitId}/lessons`,
          payload
        );
        finalLessonId = lessonRes?.id || lessonRes?.data?.id;
      }

      // Attach / Create interactive activities
      if (finalLessonId && activities.length > 0) {
        for (let i = 0; i < activities.length; i++) {
          const act = activities[i];
          let questionsPayload: any[] = [];

          if (act.type === 'MATCHING') {
            const validPairs = act.matchingPairs.filter((p) => p.leftTerm.trim() && p.rightMatch.trim());
            if (validPairs.length > 0) {
              questionsPayload = [
                {
                  prompt: act.prompt || 'Match each term with its corresponding meaning',
                  options: validPairs.map((p) => `${p.leftTerm.trim()}::${p.rightMatch.trim()}`),
                  correctAnswer: validPairs.map((p) => `${p.leftTerm.trim()}::${p.rightMatch.trim()}`).join('|'),
                  explanation: act.explanation || 'Pair associations verified.',
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
                  explanation: act.explanation || 'Grammatical syntax order.',
                  orderIndex: 1,
                },
              ];
            }
          } else if (act.type === 'FILL_BLANKS') {
            if (act.prompt.trim()) {
              questionsPayload = [
                {
                  prompt: act.prompt,
                  options: [],
                  correctAnswer: act.correctAnswer.trim(),
                  explanation: act.explanation,
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
                  explanation: act.explanation,
                  orderIndex: 1,
                },
              ];
            }
          }

          if (questionsPayload.length > 0) {
            try {
              await apiClient.post(`/activities/lesson/${finalLessonId}`, {
                title: act.title || `Interactive Exercise #${i + 1}`,
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

      router.push(`/teacher/courses/${courseId}/units`);
    } catch (err: any) {
      setError(err.message || 'Failed to save lesson.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-8 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <Card className="h-96 bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
      </div>
    );
  }

  // Simulated activity for Live Simulator Step 4
  const currentSimulatedActivity: ActivityData | null =
    activities.length > 0
      ? {
          id: `sim-act-preview`,
          title: activities[0].title,
          type: activities[0].type,
          instructions: activities[0].instructions,
          skillType: skill,
          questions:
            activities[0].type === 'MATCHING'
              ? [
                  {
                    id: 'q-match',
                    prompt: activities[0].prompt || 'Match terms with meanings',
                    options: activities[0].matchingPairs.map((p) => `${p.leftTerm}::${p.rightMatch}`),
                    correctAnswer: activities[0].matchingPairs.map((p) => `${p.leftTerm}::${p.rightMatch}`).join('|'),
                    explanation: activities[0].explanation,
                  },
                ]
              : activities[0].type === 'SENTENCE_REORDER'
              ? [
                  {
                    id: 'q-reorder',
                    prompt: activities[0].prompt || 'Arrange the words in order',
                    options: activities[0].jumbledTokens,
                    correctAnswer: activities[0].targetSentence,
                    explanation: activities[0].explanation,
                  },
                ]
              : [
                  {
                    id: 'q-mc',
                    prompt: activities[0].prompt || 'Sample Question',
                    options: activities[0].options,
                    correctAnswer: activities[0].correctAnswer || activities[0].options[0],
                    explanation: activities[0].explanation,
                  },
                ],
        }
      : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 animate-fade-in">
      {/* 1. TOP HEADER & BREADCRUMB */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href={`/teacher/courses/${courseId}/units`}>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="indigo" className="font-bold text-xs">
                CEFR {courseLevel}
              </Badge>
              <span className="text-xs text-slate-500 font-medium">
                {courseTitle}
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary-600" />
              {mode === 'edit' ? 'Edit Multi-Skill Lesson' : 'Multi-Skill Lesson Studio'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAiModal(true)}
            className="h-9 text-xs font-bold border-primary-200 bg-primary-50/50 text-primary-700 hover:bg-primary-100 dark:bg-primary-950/40 dark:border-primary-800 dark:text-primary-300"
          >
            <Sparkles className="h-4 w-4 mr-1.5 text-primary-600 animate-pulse" />
            ✨ AI Co-Pilot
          </Button>

          <Button
            type="button"
            variant="gradient"
            size="sm"
            disabled={submitting}
            onClick={() => handleSubmit()}
            className="h-9 px-4 text-xs font-bold shadow-md"
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            {submitting ? 'Saving...' : mode === 'edit' ? 'Update Lesson' : 'Publish Lesson'}
          </Button>
        </div>
      </div>

      {/* 2. SUCCESS & ERROR BANNERS */}
      {successBanner && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs font-semibold text-destructive animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-destructive/60 hover:text-destructive">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 3. STEP PROGRESS NAVIGATION BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100/80 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
        {[
          { step: 1, title: '1. Concept & Skills', icon: Sliders, subtitle: 'Unit, CEFR & Duration' },
          { step: 2, title: '2. Multi-Skill Content', icon: FileText, subtitle: `${sections.length} Sections` },
          { step: 3, title: '3. Interactive Exercises', icon: ActivityIcon, subtitle: `${activities.length} Drills` },
          { step: 4, title: '4. Live Simulator', icon: Eye, subtitle: 'Student Sandbox' },
        ].map((item) => {
          const isActive = activeStep === item.step;
          const isPassed = activeStep > item.step;
          const Icon = item.icon;

          return (
            <button
              key={item.step}
              type="button"
              onClick={() => setActiveStep(item.step as any)}
              className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-primary-700 dark:text-white shadow-xs font-bold'
                  : isPassed
                  ? 'text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : isPassed
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {isPassed ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate leading-tight">{item.title}</p>
                <p className="text-[10px] text-slate-400 font-normal truncate">{item.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* 4. STEP 1: CONCEPT & SKILL MATRIX */}
      {activeStep === 1 && (
        <Card className="p-6 space-y-6 border-slate-200/80 dark:border-slate-800 animate-in fade-in duration-150">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary-600" /> Lesson Concept & CEFR Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Define the curricular scope, target CEFR skill, and estimated study duration.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Belongs to Curriculum Unit <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full mt-1.5 rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                required
              >
                {units.map((u, idx) => (
                  <option key={u.id} value={u.id}>
                    Unit {idx + 1}: {u.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Input
                label="Lesson Title"
                placeholder="e.g. Navigating Workplace Negotiations & Disagreements"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
          </div>

          {/* PRIMARY TARGET SKILL CARDS */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Primary Target CEFR Skill Focus <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {SKILL_OPTIONS.map((sk) => {
                const isSelected = skill === sk.value;
                return (
                  <button
                    key={sk.value}
                    type="button"
                    onClick={() => setSkill(sk.value)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-950/40 text-primary-900 dark:text-primary-200 ring-2 ring-primary-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-lg mb-1">{sk.icon}</div>
                    <p className="text-xs font-bold leading-tight">{sk.label}</p>
                    <p className="text-[10px] text-slate-400 font-normal mt-0.5 line-clamp-1">{sk.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SUPPORTING SKILLS CHIPS */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Supporting Integrated Skills (Multi-Skill Matrix)
              </label>
              <span className="text-[11px] text-slate-400 font-medium">Select all secondary skills applied</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.filter((s) => s.value !== skill).map((s) => {
                const isSelected = supportingSkills.includes(s.value);
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => toggleSupportingSkill(s.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                    }`}
                  >
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                    {isSelected && <Check className="h-3 w-3 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DURATION & FREE PREVIEW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Input
              label="Estimated Study Duration (Minutes)"
              type="number"
              min={5}
              max={180}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(parseInt(e.target.value, 10) || 30)}
            />

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 mt-auto">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Free Sample Preview</p>
                <p className="text-[11px] text-slate-400">Allow prospective students to preview this lesson before enrolling.</p>
              </div>
              <input
                type="checkbox"
                checked={isFreePreview}
                onChange={(e) => setIsFreePreview(e.target.checked)}
                className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
              />
            </div>
          </div>
        </Card>
      )}

      {/* 5. STEP 2: MULTI-SKILL CONTENT SECTIONS */}
      {activeStep === 2 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary-600" /> Multi-Skill Content Blocks ({sections.length})
              </h2>
              <p className="text-xs text-slate-500">
                Structure your lesson with explanations, vocabulary banks, and embedded audio/video dialogues.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs font-bold"
                onClick={() => addSection('MARKDOWN')}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> + Rule / Theory
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs font-bold"
                onClick={() => addSection('VOCABULARY')}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> + Vocabulary List
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs font-bold"
                onClick={() => addSection('AUDIO')}
              >
                <Music className="h-3.5 w-3.5 mr-1 text-primary-600" /> + Audio Dialogue
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs font-bold"
                onClick={() => addSection('VIDEO')}
              >
                <Video className="h-3.5 w-3.5 mr-1 text-indigo-600" /> + Video Lecture
              </Button>
            </div>
          </div>

          {sections.map((sec, idx) => (
            <Card key={idx} className="p-5 space-y-4 border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="indigo" className="text-xs font-bold">
                    Section #{idx + 1}
                  </Badge>
                  <span className="text-xs font-semibold text-slate-500">
                    {sec.contentType === 'MARKDOWN'
                      ? '📖 Concept Rule'
                      : sec.contentType === 'VOCABULARY'
                      ? '📚 Vocabulary Bank'
                      : sec.contentType === 'AUDIO'
                      ? '🎧 Audio Dialogue'
                      : '🎬 Video Lecture'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={sec.contentType}
                    onChange={(e) => updateSection(idx, 'contentType', e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold dark:border-slate-800 dark:bg-slate-900"
                  >
                    <option value="MARKDOWN">Markdown Explanation</option>
                    <option value="VOCABULARY">Vocabulary List</option>
                    <option value="AUDIO">Audio Dialogue</option>
                    <option value="VIDEO">Video Lecture</option>
                  </select>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                    onClick={() => removeSection(idx)}
                    title="Remove Section"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <Input
                label="Section Header"
                placeholder="e.g. Grammar Rule: Present Perfect Continuous vs Simple"
                value={sec.title}
                onChange={(e) => updateSection(idx, 'title', e.target.value)}
                required
              />

              {(sec.contentType === 'AUDIO' || sec.contentType === 'VIDEO') && (
                <div className="space-y-2 p-3.5 rounded-xl border border-primary-100 bg-primary-50/30 dark:border-primary-900/40 dark:bg-primary-950/20">
                  <Input
                    label="Media Stream URL (MP3 / MP4 or Cloudinary Stream)"
                    placeholder="https://storage.googleapis.com/... or https://res.cloudinary.com/..."
                    value={sec.mediaUrl || ''}
                    onChange={(e) => updateSection(idx, 'mediaUrl', e.target.value)}
                  />
                  {sec.mediaUrl && (
                    <div className="flex items-center gap-2 text-xs text-primary-700 dark:text-primary-300 pt-1">
                      <Play className="h-3.5 w-3.5" />
                      <span>Stream linked: {sec.mediaUrl}</span>
                    </div>
                  )}
                </div>
              )}

              <RichTextEditor
                label="Section Content, Dialogue Script & Teaching Notes"
                value={sec.content}
                onChange={(val) => updateSection(idx, 'content', val)}
                placeholder="Write clear explanations, dialogue transcripts, example sentences, and CEFR grammar notes..."
                minRows={6}
                category="lesson"
              />
            </Card>
          ))}
        </div>
      )}

      {/* 6. STEP 3: INTERACTIVE EXERCISES */}
      {activeStep === 3 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ActivityIcon className="h-4 w-4 text-emerald-600" /> Interactive Skill Drills ({activities.length})
              </h2>
              <p className="text-xs text-slate-500">
                Embed Drag & Drop sentence builders, Match Questions, and knowledge checks into this lesson.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300 font-bold"
                onClick={() => addActivity('MATCHING')}
              >
                <Link2 className="h-3.5 w-3.5 mr-1" /> + Match Question
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 font-bold"
                onClick={() => addActivity('SENTENCE_REORDER')}
              >
                <MoveHorizontal className="h-3.5 w-3.5 mr-1" /> + Drag & Drop
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs font-bold"
                onClick={() => addActivity('FILL_BLANKS')}
              >
                <Edit3 className="h-3 w-3 mr-1 text-amber-600" /> + Fill Blanks
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs font-bold"
                onClick={() => addActivity('MULTIPLE_CHOICE')}
              >
                <CheckSquare className="h-3 w-3 mr-1 text-primary-600" /> + Multiple Choice
              </Button>
            </div>
          </div>

          {activities.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No interactive exercises added yet.</p>
              <p className="text-xs text-slate-400 mt-1">
                Choose an exercise type above or click &quot;✨ AI Co-Pilot&quot; to auto-generate exercises.
              </p>
            </Card>
          ) : (
            activities.map((act, aIdx) => (
              <Card key={aIdx} className="p-5 space-y-4 border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        act.type === 'MATCHING'
                          ? 'indigo'
                          : act.type === 'SENTENCE_REORDER'
                          ? 'success'
                          : act.type === 'FILL_BLANKS'
                          ? 'warning'
                          : 'primary'
                      }
                      className="text-xs font-bold"
                    >
                      {act.type === 'MATCHING'
                        ? '🔗 Match Question'
                        : act.type === 'SENTENCE_REORDER'
                        ? '🔀 Drag & Drop Reorder'
                        : act.type === 'FILL_BLANKS'
                        ? '✏️ Fill in the Blanks'
                        : '🔘 Multiple Choice'}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-500">Exercise #{aIdx + 1}</span>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                    onClick={() => removeActivity(aIdx)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Exercise Title"
                    value={act.title}
                    onChange={(e) => updateActivity(aIdx, 'title', e.target.value)}
                    required
                  />
                  <Input
                    label="Instructions for Student"
                    value={act.instructions}
                    onChange={(e) => updateActivity(aIdx, 'instructions', e.target.value)}
                  />
                </div>

                {/* MATCHING PAIRS BUILDER */}
                {act.type === 'MATCHING' && (
                  <div className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                        Left Item ➔ Right Match Pair Configuration
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 border-indigo-300 font-bold"
                        onClick={() => addMatchingPair(aIdx)}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Pair
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {act.matchingPairs.map((pair, pIdx) => (
                        <div key={pIdx} className="flex items-center gap-2">
                          <span className="w-5 text-center text-xs font-bold text-slate-400">{pIdx + 1}</span>
                          <Input
                            placeholder="Left Term (e.g. Vocabulary Word)"
                            value={pair.leftTerm}
                            onChange={(e) => updateMatchingPair(aIdx, pIdx, 'leftTerm', e.target.value)}
                            className="flex-1 text-xs"
                          />
                          <span className="text-slate-400 font-bold text-xs">➔</span>
                          <Input
                            placeholder="Right Match (e.g. Operational Definition)"
                            value={pair.rightMatch}
                            onChange={(e) => updateMatchingPair(aIdx, pIdx, 'rightMatch', e.target.value)}
                            className="flex-1 text-xs"
                          />
                          {act.matchingPairs.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-destructive"
                              onClick={() => removeMatchingPair(aIdx, pIdx)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* DRAG & DROP SENTENCE BUILDER */}
                {act.type === 'SENTENCE_REORDER' && (
                  <div className="space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                    <Input
                      label="Target Sentence (Correct Sequence)"
                      placeholder="e.g. We have been negotiating the contract since morning."
                      value={act.targetSentence}
                      onChange={(e) => handleSentenceChange(aIdx, e.target.value)}
                      required
                    />

                    {act.jumbledTokens.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          Interactive Draggable Token Preview:
                        </span>
                        <div className="flex flex-wrap gap-1.5 p-3 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                          {act.jumbledTokens.map((tok, tIdx) => (
                            <span
                              key={tIdx}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 shadow-xs"
                            >
                              <GripVertical className="h-3 w-3 text-slate-400" />
                              {tok}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* FILL IN THE BLANKS */}
                {act.type === 'FILL_BLANKS' && (
                  <div className="space-y-3 rounded-xl border border-amber-100 bg-amber-50/30 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                    <Input
                      label="Prompt Sentence with [blank] placeholder"
                      placeholder="e.g. I have [blank] living in London for three years."
                      value={act.prompt}
                      onChange={(e) => updateActivity(aIdx, 'prompt', e.target.value)}
                      required
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Exact Correct Word"
                        placeholder="e.g. been"
                        value={act.correctAnswer}
                        onChange={(e) => updateActivity(aIdx, 'correctAnswer', e.target.value)}
                        required
                      />
                      <Input
                        label="Grammar Rule Explanation (Shown on submit)"
                        placeholder="e.g. Present perfect continuous requires 'been'."
                        value={act.explanation || ''}
                        onChange={(e) => updateActivity(aIdx, 'explanation', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* MULTIPLE CHOICE */}
                {act.type === 'MULTIPLE_CHOICE' && (
                  <div className="space-y-3 rounded-xl border border-primary-100 bg-primary-50/30 dark:border-primary-900/50 dark:bg-primary-950/20">
                    <Input
                      label="Question Prompt"
                      placeholder="e.g. Which modal verb expresses high certainty in the past?"
                      value={act.prompt}
                      onChange={(e) => updateActivity(aIdx, 'prompt', e.target.value)}
                      required
                    />

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Answer Options (Select the radio of the correct answer)
                      </label>
                      {act.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct_mc_${aIdx}`}
                            checked={act.correctAnswer === opt && opt !== ''}
                            onChange={() => updateActivity(aIdx, 'correctAnswer', opt)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 cursor-pointer"
                          />
                          <Input
                            placeholder={`Option ${oIdx + 1}`}
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...act.options];
                              newOpts[oIdx] = e.target.value;
                              updateActivity(aIdx, 'options', newOpts);
                            }}
                            className="flex-1 text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* 7. STEP 4: LIVE STUDENT SIMULATOR PREVIEW */}
      {activeStep === 4 && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs">
              <Eye className="h-5 w-5 text-amber-600 shrink-0" />
              <span>
                <strong>Live Student Simulator:</strong> Test drive your lesson material and interactive drills in real-time as a student.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Content Flow */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="indigo" className="text-xs font-bold mb-1">
                      {skill} • CEFR {courseLevel}
                    </Badge>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                      {title || 'Untitled Lesson'}
                    </h2>
                  </div>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {estimatedMinutes} mins
                  </span>
                </div>
              </Card>

              {sections.map((sec, idx) => (
                <Card key={idx} className="p-6 space-y-3 border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      {sec.title}
                    </h3>
                    <Badge variant="outline" className="text-[10px]">
                      {sec.contentType}
                    </Badge>
                  </div>

                  {sec.mediaUrl && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center gap-2 text-xs">
                      <Play className="h-4 w-4 text-primary-600" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Embedded Media Stream:
                      </span>
                      <span className="text-slate-400 truncate">{sec.mediaUrl}</span>
                    </div>
                  )}

                  <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    <RichTextRenderer content={sec.content} />
                  </div>
                </Card>
              ))}
            </div>

            {/* Right: Live Interactive Drill Sandbox */}
            <div className="space-y-4">
              <Card className="p-4 border-slate-200/80 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <ActivityIcon className="h-3.5 w-3.5 text-emerald-600" /> Interactive Drills Sandbox
                </h3>
                {currentSimulatedActivity ? (
                  <ActivityContainer
                    activity={currentSimulatedActivity}
                    onFinished={(score) => alert(`Simulator test score: ${score}%`)}
                  />
                ) : (
                  <p className="text-xs text-slate-400 italic p-4 text-center">
                    Add interactive exercises in Step 3 to test-run them here.
                  </p>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* 8. STICKY BOTTOM NAVIGATION & SAVE BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-3 px-4 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            {activeStep > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveStep((activeStep - 1) as any)}
                className="text-xs font-bold"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous Step
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {activeStep < 4 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveStep((activeStep + 1) as any)}
                className="text-xs font-bold"
              >
                Next Step <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : null}

            <Button
              type="button"
              variant="gradient"
              size="sm"
              disabled={submitting}
              onClick={() => handleSubmit()}
              className="text-xs font-bold px-5 shadow-md"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              {submitting ? 'Saving Lesson...' : mode === 'edit' ? 'Save Changes' : 'Save & Publish Lesson'}
            </Button>
          </div>
        </div>
      </div>

      {/* 9. AI MULTI-SKILL LESSON CO-PILOT MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="max-w-xl w-full p-6 space-y-5 border-primary-500/30 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 text-white shadow-md">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    AI Multi-Skill Lesson Co-Pilot
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Instantly generate CEFR-aligned presentation rules, vocabulary lists, and interactive exercises.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Lesson Topic / Communicative Focus
                </label>
                <Input
                  placeholder="e.g. Master Conditional Sentences in Job Interviews & Negotiations"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    CEFR Level
                  </label>
                  <select
                    value={aiCefrLevel}
                    onChange={(e) => setAiCefrLevel(e.target.value)}
                    className="w-full mt-1 rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="A1">A1 - Beginner</option>
                    <option value="A2">A2 - Elementary</option>
                    <option value="B1">B1 - Intermediate</option>
                    <option value="B2">B2 - Upper Intermediate</option>
                    <option value="C1">C1 - Advanced</option>
                    <option value="C2">C2 - Mastery</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Target Skill
                  </label>
                  <select
                    value={aiSkill}
                    onChange={(e) => setAiSkill(e.target.value)}
                    className="w-full mt-1 rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  >
                    {SKILL_OPTIONS.map((sk) => (
                      <option key={sk.value} value={sk.value}>
                        {sk.icon} {sk.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Duration (Minutes)
                  </label>
                  <Input
                    type="number"
                    min={15}
                    max={120}
                    value={aiDuration}
                    onChange={(e) => setAiDuration(parseInt(e.target.value, 10) || 45)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Pedagogical Style
                </label>
                <select
                  value={aiTeachingStyle}
                  onChange={(e) => setAiTeachingStyle(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  <option value="COMMUNICATIVE">Communicative Language Teaching (CLT)</option>
                  <option value="TASK_BASED">Task-Based Learning (TBL)</option>
                  <option value="DIRECT_METHOD">Direct Immersion Method</option>
                  <option value="SCAFFOLDED">Scaffolded Presentation-Practice-Production (PPP)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAiModal(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="gradient"
                  size="sm"
                  disabled={aiGenerating}
                  onClick={handleGenerateWithAi}
                  className="font-bold shadow-md"
                >
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  {aiGenerating ? 'Generating Structured Lesson...' : 'Generate Complete Lesson Plan'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
