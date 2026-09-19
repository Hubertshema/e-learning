'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Award,
  ArrowRight,
  BookOpen,
  RotateCcw,
  Volume2
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface PlacementQuestion {
  id: string;
  skill: string;
  level: string;
  question: string;
  options: string[];
  correct: string;
  audioPrompt?: string;
}

const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  // Grammar (A1-B2)
  {
    id: 'pq-1',
    skill: 'GRAMMAR',
    level: 'A1',
    question: 'Choose the correct form: She _____ English every morning before breakfast.',
    options: ['study', 'studies', 'studying', 'is study'],
    correct: 'studies',
  },
  {
    id: 'pq-2',
    skill: 'GRAMMAR',
    level: 'A2',
    question: 'Yesterday, we _____ to the international conference in Kigali.',
    options: ['go', 'went', 'gone', 'were go'],
    correct: 'went',
  },
  {
    id: 'pq-3',
    skill: 'GRAMMAR',
    level: 'B1',
    question: 'If you _____ harder, you would pass the IELTS exam easily.',
    options: ['worked', 'work', 'have worked', 'will work'],
    correct: 'worked',
  },
  {
    id: 'pq-4',
    skill: 'GRAMMAR',
    level: 'B2',
    question: 'By this time next year, the academy _____ over ten thousand students.',
    options: ['will train', 'will have trained', 'trains', 'is training'],
    correct: 'will have trained',
  },
  {
    id: 'pq-5',
    skill: 'GRAMMAR',
    level: 'C1',
    question: 'Hardly _____ the presentation when the CEO began asking difficult questions.',
    options: ['he had finished', 'had he finished', 'did he finish', 'he finished'],
    correct: 'had he finished',
  },

  // Vocabulary (A1-C1)
  {
    id: 'pq-6',
    skill: 'VOCABULARY',
    level: 'A1',
    question: 'What is the opposite of "expensive"?',
    options: ['cheap', 'rich', 'fast', 'heavy'],
    correct: 'cheap',
  },
  {
    id: 'pq-7',
    skill: 'VOCABULARY',
    level: 'A2',
    question: 'We need to make an _____ with the doctor for tomorrow afternoon.',
    options: ['appointment', 'opportunity', 'experiment', 'advertisement'],
    correct: 'appointment',
  },
  {
    id: 'pq-8',
    skill: 'VOCABULARY',
    level: 'B1',
    question: 'The meeting was _____ until next Friday due to the national holiday.',
    options: ['postponed', 'prevented', 'promoted', 'protected'],
    correct: 'postponed',
  },
  {
    id: 'pq-9',
    skill: 'VOCABULARY',
    level: 'B2',
    question: 'Her explanation was completely _____; everyone understood the strategy.',
    options: ['lucid', 'opaque', 'tedious', 'ambiguous'],
    correct: 'lucid',
  },
  {
    id: 'pq-10',
    skill: 'VOCABULARY',
    level: 'C1',
    question: 'The project was abandoned due to _____ financial constraints and mismanagement.',
    options: ['insurmountable', 'inaudible', 'ineligible', 'inanimate'],
    correct: 'insurmountable',
  },

  // Reading Comprehension (A2-B2)
  {
    id: 'pq-11',
    skill: 'READING',
    level: 'A2',
    question: 'Passage: "Online courses provide flexibility for professionals who balance work and studies." — What is the main benefit mentioned?',
    options: ['High tuition', 'Flexibility', 'Free certificates', 'Strict schedules'],
    correct: 'Flexibility',
  },
  {
    id: 'pq-12',
    skill: 'READING',
    level: 'B1',
    question: 'Passage: "Although automation streamlines routine workflows, human critical thinking remains indispensable in strategic leadership." — What does the author imply?',
    options: [
      'Machines will completely replace leaders',
      'Human thinking is still essential',
      'Automation is completely useless',
      'Leadership requires no critical thinking'
    ],
    correct: 'Human thinking is still essential',
  },

  // Listening & Functional Fluency (A2-C1)
  {
    id: 'pq-13',
    skill: 'LISTENING',
    level: 'A2',
    question: 'Speaker: "Could you tell me how to get to the main library?" — What is the most appropriate response?',
    options: [
      'Yes, it is down this corridor on your left.',
      'I am 24 years old.',
      'No, I like library books.',
      'Because it is raining outside.'
    ],
    correct: 'Yes, it is down this corridor on your left.',
  },
  {
    id: 'pq-14',
    skill: 'LISTENING',
    level: 'B2',
    question: 'Speaker: "I am afraid we have hit a bit of an impasse in negotiations." — What does "impasse" mean?',
    options: [
      'A deadlock where progress seems impossible',
      'A rapid acceleration of the contract',
      'A financial celebration',
      'A minor grammar error'
    ],
    correct: 'A deadlock where progress seems impossible',
  },
  {
    id: 'pq-15',
    skill: 'LISTENING',
    level: 'C1',
    question: 'Select the idiomatic expression that means "to address an issue directly":',
    options: [
      'Take the bull by the horns',
      'Cry over spilled milk',
      'Beat around the bush',
      'Bite off more than you can chew'
    ],
    correct: 'Take the bull by the horns',
  }
];

export default function StudentPlacementTestPage() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    recommendedLevel: string;
    message: string;
  } | null>(null);

  const currentQ = PLACEMENT_QUESTIONS[currentIdx];

  const handleSelectOption = (option: string) => {
    setAnswers((prev) => ({ ...prev, [currentQ.id]: option }));
  };

  const handleNext = () => {
    if (currentIdx < PLACEMENT_QUESTIONS.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleSubmitTest = async () => {
    try {
      setLoading(true);
      const formattedAnswers = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
        questionId,
        selectedAnswer,
      }));

      // Calculate score
      let correct = 0;
      PLACEMENT_QUESTIONS.forEach((q) => {
        if (answers[q.id] === q.correct) {
          correct++;
        }
      });
      const score = Math.round((correct / PLACEMENT_QUESTIONS.length) * 100);

      const res = await apiClient.post<{ score: number; recommendedLevel: string; message: string }>(
        '/student/placement-test',
        {
          answers: formattedAnswers,
        }
      );

      if (res.data) {
        setResult(res.data);
      } else {
        let rec = 'B1';
        if (score < 40) rec = 'A1';
        else if (score < 60) rec = 'A2';
        else if (score < 75) rec = 'B1';
        else if (score < 88) rec = 'B2';
        else rec = 'C1';

        setResult({
          score,
          recommendedLevel: rec,
          message: `Evaluation completed! Your diagnostic score is ${score}%.`,
        });
      }
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit placement test', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <Badge variant="indigo" className="px-3 py-1">CEFR Diagnostic Assessment</Badge>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          English Proficiency Placement Test
        </h1>
        <p className="text-xs text-slate-500 max-w-lg mx-auto">
          Assess your baseline across Grammar, Vocabulary, Reading Comprehension, and Functional Listening to determine your starting CEFR level.
        </p>
      </div>

      {!submitted ? (
        <Card className="p-6 sm:p-8 space-y-6 shadow-xl">
          {/* Progress Bar & Question Counter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Question {currentIdx + 1} of {PLACEMENT_QUESTIONS.length}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="indigo">{currentQ.skill}</Badge>
                <Badge variant="outline">{currentQ.level}</Badge>
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-primary-600 transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / PLACEMENT_QUESTIONS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Prompt */}
          <div className="py-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-relaxed">
              {currentQ.question}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {currentQ.options.map((opt) => {
              const isSelected = answers[currentQ.id] === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelectOption(opt)}
                  className={`w-full text-left p-4 rounded-xl text-xs transition-all flex items-center justify-between border ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 text-primary-900 font-bold dark:bg-primary-950/60 dark:text-primary-200 ring-2 ring-primary-500/20'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                  }`}
                >
                  <span>{opt}</span>
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              disabled={currentIdx === 0}
              onClick={handlePrev}
            >
              Previous
            </Button>

            {currentIdx < PLACEMENT_QUESTIONS.length - 1 ? (
              <Button
                variant="gradient"
                size="sm"
                disabled={!answers[currentQ.id]}
                onClick={handleNext}
              >
                Next Question
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                variant="gradient"
                size="sm"
                disabled={loading || Object.keys(answers).length < PLACEMENT_QUESTIONS.length}
                onClick={handleSubmitTest}
              >
                {loading ? 'Evaluating...' : 'Complete & Calculate CEFR Level'}
              </Button>
            )}
          </div>
        </Card>
      ) : (
        /* Results Card */
        <Card className="p-8 text-center space-y-6 shadow-2xl border-2 border-primary-200 bg-gradient-to-b from-white to-primary-50/20 dark:from-slate-900 dark:to-slate-950">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
            <Sparkles className="h-8 w-8" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Recommended Starting CEFR Level
            </span>
            <div className="mt-2 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-600 px-6 py-2 text-3xl font-black text-white shadow-lg">
              {result?.recommendedLevel || 'B1'}
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-3">
              Diagnostic Score: {result?.score}%
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Your profile level has been updated. We recommend beginning your study path with our tailored {result?.recommendedLevel} curriculum.
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSubmitted(false);
                setCurrentIdx(0);
                setAnswers({});
              }}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Retake Test
            </Button>
            <Link href="/student/courses">
              <Button variant="gradient" size="sm">
                <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                View Recommended Courses
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
