'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
  Layers
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

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

export default function TeacherCreateLessonPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const courseId = params.courseId as string;
  const initialUnitId = searchParams.get('unitId') || '';

  const [units, setUnits] = useState<any[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState(initialUnitId);
  const [title, setTitle] = useState('');
  const [skill, setSkill] = useState('GRAMMAR');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [isFreePreview, setIsFreePreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Content Sections
  const [sections, setSections] = useState<SectionForm[]>([
    {
      title: 'Grammar Rule & Contextual Explanation',
      contentType: 'MARKDOWN',
      content: '### Key Grammar Rule\n\nWhen using the **Present Perfect Continuous**, we emphasize the duration or continuity of an activity up to the present moment.\n\n*Structure:* `Subject + have/has + been + Verb-ing`\n\n*Examples:*\n- *I have been working on this report since 9 AM.*\n- *She has been studying English for five months.*',
    },
    {
      title: 'Workplace Vocabulary Focus',
      contentType: 'VOCABULARY',
      content: '**Key Terms:**\n- **Deadline:** The latest time by which something should be completed.\n- **Deliverable:** A tangible or intangible good or service produced as a result of a project.\n- **Stakeholder:** A person with an interest or concern in something.',
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

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const res = await apiClient.get<any>(`/teacher/courses/${courseId}`);
        if (res?.units) {
          setUnits(res.units);
          if (!selectedUnitId && res.units.length > 0) {
            setSelectedUnitId(res.units[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load units', err);
      }
    };
    fetchUnits();
  }, [courseId, selectedUnitId]);

  // Section Handlers
  const addSection = () => {
    setSections([
      ...sections,
      {
        title: 'New Section',
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
      alert('Lesson must have at least one content section.');
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

    if (!selectedUnitId) {
      setError('Please select a unit for this lesson.');
      return;
    }

    if (!title.trim()) {
      setError('Lesson title is required.');
      return;
    }

    try {
      setSubmitting(true);
      
      // 1. Create the Lesson
      const lessonRes: any = await apiClient.post(`/teacher/courses/${courseId}/units/${selectedUnitId}/lessons`, {
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

      // 2. If lesson was created and has activities, create each activity
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

      router.push(`/teacher/courses/${courseId}/units`);
    } catch (err: any) {
      setError(err.message || 'Failed to create lesson.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link href={`/teacher/courses/${courseId}/units`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Lesson & Interactive Activity Studio
          </h1>
          <p className="text-xs text-slate-500">
            Design rich 7-skill lessons with text/media sections plus Match Questions and Drag & Drop activities.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs font-semibold text-destructive">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Lesson Settings */}
        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Belongs to Unit
              </label>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full mt-1 rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
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
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Primary Target CEFR Skill
              </label>
              <select
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                className="w-full mt-1 rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              >
                <option value="GRAMMAR">Grammar & Syntax</option>
                <option value="VOCABULARY">Vocabulary & Idioms</option>
                <option value="READING">Reading Comprehension</option>
                <option value="LISTENING">Listening & Accents</option>
                <option value="SPEAKING">Conversational & Fluency</option>
                <option value="WRITING">Formal / Business Writing</option>
                <option value="PRONUNCIATION">Phonetics & Pronunciation</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Lesson Title"
              placeholder="e.g. Navigating Workplace Negotiations & Disagreements"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <Input
              label="Estimated Study Duration (Minutes)"
              type="number"
              min={5}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(parseInt(e.target.value, 10) || 30)}
            />
          </div>
        </Card>

        {/* Section Blocks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary-600" /> 1. Lesson Content Sections ({sections.length})
            </h2>
            <Button type="button" variant="outline" size="sm" onClick={addSection}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Section Block
            </Button>
          </div>

          {sections.map((sec, idx) => (
            <Card key={idx} className="p-5 space-y-4 border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs font-bold">
                  Section #{idx + 1}
                </Badge>
                <div className="flex items-center gap-2">
                  <select
                    value={sec.contentType}
                    onChange={(e) => updateSection(idx, 'contentType', e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-800 dark:bg-slate-900"
                  >
                    <option value="MARKDOWN">Markdown / Explanation</option>
                    <option value="VOCABULARY">Vocabulary List</option>
                    <option value="AUDIO">Audio Dialogue</option>
                    <option value="VIDEO">Video Lecture</option>
                  </select>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => removeSection(idx)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <Input
                label="Section Header"
                placeholder="e.g. Vocabulary Focus, Grammar Rule"
                value={sec.title}
                onChange={(e) => updateSection(idx, 'title', e.target.value)}
                required
              />

              {(sec.contentType === 'AUDIO' || sec.contentType === 'VIDEO') && (
                <Input
                  label="Media URL (MP3, MP4 or Cloudinary Stream)"
                  placeholder="https://..."
                  value={sec.mediaUrl || ''}
                  onChange={(e) => updateSection(idx, 'mediaUrl', e.target.value)}
                />
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Section Content & Examples
                </label>
                <textarea
                  rows={4}
                  value={sec.content}
                  onChange={(e) => updateSection(idx, 'content', e.target.value)}
                  placeholder="Enter explanations, sample dialogues, or vocabulary items..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white font-mono leading-relaxed"
                  required
                />
              </div>
            </Card>
          ))}
        </div>

        {/* Interactive Practice Activities & Question Builder */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ActivityIcon className="h-4 w-4 text-emerald-600" /> 2. Interactive Practice & Exercises ({activities.length})
              </h2>
              <p className="text-[11px] text-slate-500">
                Embed Match Questions, Drag & Drop word reordering, and knowledge checks into this lesson.
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
                className="text-xs"
                onClick={() => addActivity('FILL_BLANKS')}
              >
                <Plus className="h-3 w-3 mr-1" /> Fill Blanks
              </Button>
            </div>
          </div>

          {activities.length === 0 ? (
            <Card className="p-8 text-center border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500">No interactive activities added yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Click &quot;+ Match Question&quot; or &quot;+ Drag & Drop&quot; above to add interactive exercises.
              </p>
            </Card>
          ) : (
            activities.map((act, aIdx) => (
              <Card key={aIdx} className="p-5 space-y-4 border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={act.type === 'MATCHING' ? 'indigo' : 'success'} className="text-xs font-bold">
                      {act.type === 'MATCHING' ? '🔗 Match Question' : act.type === 'SENTENCE_REORDER' ? '🔀 Drag & Drop Reorder' : act.type}
                    </Badge>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => removeActivity(aIdx)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Activity Title"
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

                {/* MATCHING BUILDER */}
                {act.type === 'MATCHING' && (
                  <div className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                        Term ➔ Match Pairs
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 border-indigo-300"
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
                            placeholder="Right Match (e.g. Definition / Synonym)"
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

                {/* DRAG & DROP / SENTENCE REORDER BUILDER */}
                {act.type === 'SENTENCE_REORDER' && (
                  <div className="space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                    <Input
                      label="Target Sentence (Correct Sequence)"
                      placeholder="e.g. They have been negotiating the contract since morning."
                      value={act.targetSentence}
                      onChange={(e) => handleSentenceChange(aIdx, e.target.value)}
                      required
                    />

                    {act.jumbledTokens.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          Interactive Word Chip Tokens:
                        </span>
                        <div className="flex flex-wrap gap-1.5 p-3 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                          {act.jumbledTokens.map((tok, tIdx) => (
                            <span
                              key={tIdx}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 shadow-sm"
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
                  <div className="space-y-2">
                    <Input
                      label="Sentence with blank (use [blank] to denote missing word)"
                      placeholder="e.g. I have [blank] living in London for 3 years."
                      value={act.prompt}
                      onChange={(e) => updateActivity(aIdx, 'prompt', e.target.value)}
                      required
                    />
                    <Input
                      label="Exact Correct Word"
                      placeholder="e.g. been"
                      value={act.correctAnswer}
                      onChange={(e) => updateActivity(aIdx, 'correctAnswer', e.target.value)}
                      required
                    />
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <Link href={`/teacher/courses/${courseId}/units`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>

          <Button type="submit" variant="gradient" disabled={submitting}>
            <CheckCircle2 className="h-4 w-4 mr-1.5" /> Save Lesson & Interactive Activities
          </Button>
        </div>
      </form>
    </div>
  );
}
