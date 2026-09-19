'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, RotateCcw, Sparkles, ArrowRight } from 'lucide-react';

export interface SentenceItem {
  id: string;
  jumbledWords: string[];
  correctSentence: string;
  hint?: string;
}

interface SentenceReorderActivityProps {
  sentences: SentenceItem[];
  onComplete: (scorePercentage: number) => void;
}

export function SentenceReorderActivity({ sentences, onComplete }: SentenceReorderActivityProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [constructedWords, setConstructedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>(() => [
    ...(sentences[0]?.jumbledWords || []),
  ]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [scores, setScores] = useState<number[]>([]);

  const currentSentence = sentences[currentIdx];

  const handleSelectWord = (word: string, index: number) => {
    setConstructedWords([...constructedWords, word]);
    const remaining = [...availableWords];
    remaining.splice(index, 1);
    setAvailableWords(remaining);
  };

  const handleRemoveWord = (word: string, index: number) => {
    setAvailableWords([...availableWords, word]);
    const remaining = [...constructedWords];
    remaining.splice(index, 1);
    setConstructedWords(remaining);
  };

  const handleCheck = () => {
    const constructed = constructedWords.join(' ').trim();
    const target = currentSentence.correctSentence.trim();
    const correct = constructed.toLowerCase() === target.toLowerCase();

    setIsCorrect(correct);
    const roundScore = correct ? 100 : 0;
    const updatedScores = [...scores, roundScore];
    setScores(updatedScores);

    if (currentIdx === sentences.length - 1) {
      const avg = Math.round(updatedScores.reduce((a, b) => a + b, 0) / updatedScores.length);
      onComplete(avg);
    }
  };

  const handleNext = () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx < sentences.length) {
      setCurrentIdx(nextIdx);
      setConstructedWords([]);
      setAvailableWords([...sentences[nextIdx].jumbledWords]);
      setIsCorrect(null);
    }
  };

  const handleResetCurrent = () => {
    setConstructedWords([]);
    setAvailableWords([...currentSentence.jumbledWords]);
    setIsCorrect(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Badge variant="indigo">Syntax & Word Order</Badge>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
            Sentence Unscrambling
          </h3>
          <p className="text-xs text-slate-500">
            Click words from the bank in the correct grammatical sequence.
          </p>
        </div>
        <span className="text-xs font-bold text-slate-500">
          {currentIdx + 1} of {sentences.length}
        </span>
      </div>

      <Card className="p-6 space-y-6">
        {/* Constructed Sentence Display Area */}
        <div className="min-h-[80px] rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50/30 p-4 flex flex-wrap items-center gap-2 dark:border-primary-900/40 dark:bg-slate-900">
          {constructedWords.length > 0 ? (
            constructedWords.map((word, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleRemoveWord(word, i)}
                className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-primary-700 transition-transform active:scale-95"
              >
                {word}
              </button>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic">
              Click the words below to build your sentence...
            </span>
          )}
        </div>

        {/* Word Bank */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Available Words:
          </p>
          <div className="flex flex-wrap gap-2">
            {availableWords.map((word, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectWord(word, idx)}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-sm hover:border-primary-400 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
              >
                {word}
              </button>
            ))}
          </div>
        </div>

        {/* Evaluation Banner */}
        {isCorrect !== null && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center justify-between ${
              isCorrect
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-900 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            <div>
              <p className="font-bold">{isCorrect ? 'Well done! Correct syntax.' : 'Incorrect word order.'}</p>
              {!isCorrect && (
                <p className="mt-0.5 text-[11px]">
                  Target: <strong>{currentSentence.correctSentence}</strong>
                </p>
              )}
            </div>
            {!isCorrect && (
              <Button size="sm" variant="ghost" onClick={handleResetCurrent} className="text-xs">
                <RotateCcw className="mr-1 h-3 w-3" />
                Try Again
              </Button>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetCurrent}
            disabled={constructedWords.length === 0}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset
          </Button>

          {isCorrect === null ? (
            <Button
              size="sm"
              variant="gradient"
              onClick={handleCheck}
              disabled={constructedWords.length === 0}
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              Check Sentence
            </Button>
          ) : (
            currentIdx < sentences.length - 1 && (
              <Button size="sm" variant="gradient" onClick={handleNext}>
                Next Sentence
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            )
          )}
        </div>
      </Card>
    </div>
  );
}
