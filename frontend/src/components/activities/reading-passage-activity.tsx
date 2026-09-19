'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle2, HelpCircle } from 'lucide-react';

export interface ComprehensionQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

interface ReadingPassageActivityProps {
  title: string;
  passage: string;
  questions: ComprehensionQuestion[];
  onComplete: (scorePercentage: number) => void;
}

export function ReadingPassageActivity({
  title,
  passage,
  questions,
  onComplete,
}: ReadingPassageActivityProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSelectOption = (qId: string, opt: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qId]: opt }));
  };

  const handleCheckAnswers = () => {
    setSubmitted(true);
    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    const score = Math.round((correct / questions.length) * 100);
    onComplete(score);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Badge variant="indigo">Reading Comprehension & Analysis</Badge>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">{title}</h3>
        </div>
      </div>

      {/* Formatted Passage Box */}
      <Card className="p-6 bg-slate-50/70 dark:bg-slate-900/60 border-l-4 border-l-primary-600">
        <div className="prose dark:prose-invert text-xs leading-relaxed max-w-none text-slate-800 dark:text-slate-200 font-serif whitespace-pre-wrap">
          {passage}
        </div>
      </Card>

      {/* Comprehension Questions */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <HelpCircle className="h-4 w-4 text-primary-600" />
          Comprehension Questions ({questions.length})
        </h4>

        {questions.map((q, idx) => {
          const isCorrect = submitted && answers[q.id] === q.correctAnswer;
          const isWrong = submitted && answers[q.id] && answers[q.id] !== q.correctAnswer;

          return (
            <Card key={q.id} className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {idx + 1}. {q.question}
                </span>
                {submitted && (
                  <Badge variant={isCorrect ? 'success' : 'destructive'} className="text-[10px]">
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </Badge>
                )}
              </div>

              <div className="space-y-2 pt-1">
                {q.options.map((opt) => {
                  const isSelected = answers[q.id] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSelectOption(q.id, opt)}
                      className={`w-full text-left p-3 rounded-lg text-xs transition-all border flex items-center justify-between ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 text-primary-900 font-bold dark:bg-primary-950/60 dark:text-primary-200'
                          : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                      }`}
                    >
                      <span>{opt}</span>
                      <div
                        className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <div className="h-1 w-1 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {isWrong && (
                <div className="rounded-lg bg-rose-50/50 p-2.5 text-xs text-rose-800 dark:bg-rose-950/30 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                  Correct answer: <strong>{q.correctAnswer}</strong>
                  {q.explanation && <p className="text-[11px] mt-0.5">{q.explanation}</p>}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end pt-2">
        {!submitted ? (
          <Button
            variant="gradient"
            size="sm"
            disabled={Object.keys(answers).length < questions.length}
            onClick={handleCheckAnswers}
          >
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            Check Comprehension Answers
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSubmitted(false);
              setAnswers({});
            }}
          >
            Retry Questions
          </Button>
        )}
      </div>
    </div>
  );
}
