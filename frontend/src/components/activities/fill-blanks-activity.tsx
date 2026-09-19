'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, HelpCircle, ArrowRight, Sparkles } from 'lucide-react';

export interface FillBlanksQuestion {
  id: string;
  sentenceBefore: string;
  sentenceAfter: string;
  correctAnswer: string;
  options?: string[];
  explanation?: string;
}

interface FillBlanksActivityProps {
  questions: FillBlanksQuestion[];
  onComplete: (scorePercentage: number) => void;
}

export default function FillBlanksActivity({ questions, onComplete }: FillBlanksActivityProps) {
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});

  const handleInputChange = (qId: string, val: string) => {
    setUserInputs((prev) => ({ ...prev, [qId]: val }));
  };

  const handleCheckAnswers = () => {
    setSubmitted(true);
    let correct = 0;
    questions.forEach((q) => {
      const input = (userInputs[q.id] || '').trim().toLowerCase();
      if (input === q.correctAnswer.trim().toLowerCase()) {
        correct++;
      }
    });
    const score = Math.round((correct / questions.length) * 100);
    onComplete(score);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Badge variant="indigo">Grammar & Syntax Practice</Badge>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
            Fill in the Blanks
          </h3>
          <p className="text-xs text-slate-500">
            Type the correct form of the missing word to complete each sentence.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => {
          const userInput = (userInputs[q.id] || '').trim();
          const isCorrect = submitted && userInput.toLowerCase() === q.correctAnswer.trim().toLowerCase();
          const isWrong = submitted && userInput.toLowerCase() !== q.correctAnswer.trim().toLowerCase();

          return (
            <Card key={q.id} className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary-600">Question {idx + 1}</span>
                {submitted && (
                  <Badge variant={isCorrect ? 'success' : 'destructive'} className="text-[10px]">
                    {isCorrect ? 'Correct (+1)' : 'Incorrect'}
                  </Badge>
                )}
              </div>

              {/* Interactive Inline Sentence */}
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-loose flex flex-wrap items-center gap-1.5">
                <span>{q.sentenceBefore}</span>
                <input
                  type="text"
                  disabled={submitted}
                  value={userInputs[q.id] || ''}
                  onChange={(e) => handleInputChange(q.id, e.target.value)}
                  placeholder="type answer..."
                  className={`inline-block w-36 rounded-lg border px-2.5 py-1 text-xs font-bold transition-all focus:outline-none ${
                    isCorrect
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200'
                      : isWrong
                      ? 'border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/50 dark:text-rose-200'
                      : 'border-slate-300 focus:border-primary-500 dark:border-slate-700 dark:bg-slate-900'
                  }`}
                />
                <span>{q.sentenceAfter}</span>
              </div>

              {/* Word Bank Options if provided */}
              {q.options && q.options.length > 0 && !submitted && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  <span className="text-[11px] text-slate-400">Word Bank:</span>
                  {q.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleInputChange(q.id, opt)}
                      className="rounded-md border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {/* Error Explanation */}
              {isWrong && (
                <div className="rounded-lg bg-rose-50/50 p-2.5 text-xs text-rose-800 dark:bg-rose-950/30 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                  <span>Correct answer: <strong>{q.correctAnswer}</strong></span>
                  {q.explanation && <p className="text-[11px] mt-0.5 italic">{q.explanation}</p>}
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
            onClick={handleCheckAnswers}
            disabled={Object.keys(userInputs).length === 0}
          >
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            Check Answers & Score
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSubmitted(false);
              setUserInputs({});
            }}
          >
            Retry Exercise
          </Button>
        )}
      </div>
    </div>
  );
}
export { FillBlanksActivity };
