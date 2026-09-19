'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, RotateCcw, Sparkles, ArrowRight, Lightbulb } from 'lucide-react';

export interface ScrambleItem {
  id: string;
  targetWord: string;
  scrambledLetters: string[];
  hint: string;
}

interface WordScrambleActivityProps {
  items: ScrambleItem[];
  onComplete: (scorePercentage: number) => void;
}

export function WordScrambleActivity({ items, onComplete }: WordScrambleActivityProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [placedLetters, setPlacedLetters] = useState<string[]>([]);
  const [remainingLetters, setRemainingLetters] = useState<string[]>(() => [
    ...(items[0]?.scrambledLetters || []),
  ]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [scores, setScores] = useState<number[]>([]);

  const currentItem = items[currentIdx];

  const handleSelectLetter = (letter: string, index: number) => {
    setPlacedLetters([...placedLetters, letter]);
    const updated = [...remainingLetters];
    updated.splice(index, 1);
    setRemainingLetters(updated);
  };

  const handleRemoveLetter = (letter: string, index: number) => {
    setRemainingLetters([...remainingLetters, letter]);
    const updated = [...placedLetters];
    updated.splice(index, 1);
    setPlacedLetters(updated);
  };

  const handleCheck = () => {
    const constructed = placedLetters.join('').toLowerCase();
    const target = currentItem.targetWord.toLowerCase();
    const correct = constructed === target;

    setIsCorrect(correct);
    const roundScore = correct ? 100 : 0;
    const updatedScores = [...scores, roundScore];
    setScores(updatedScores);

    if (currentIdx === items.length - 1) {
      const avg = Math.round(updatedScores.reduce((a, b) => a + b, 0) / updatedScores.length);
      onComplete(avg);
    }
  };

  const handleNext = () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx < items.length) {
      setCurrentIdx(nextIdx);
      setPlacedLetters([]);
      setRemainingLetters([...items[nextIdx].scrambledLetters]);
      setIsCorrect(null);
    }
  };

  const handleReset = () => {
    setPlacedLetters([]);
    setRemainingLetters([...currentItem.scrambledLetters]);
    setIsCorrect(null);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Badge variant="indigo">Spelling & Vocabulary Precision</Badge>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
            Word Spelling & Scramble
          </h3>
          <p className="text-xs text-slate-500">
            Unscramble the letters to spell the vocabulary term correctly.
          </p>
        </div>
        <span className="text-xs font-bold text-slate-500">
          {currentIdx + 1} of {items.length}
        </span>
      </div>

      <Card className="p-6 space-y-6 shadow-md text-center">
        {/* Hint banner */}
        <div className="rounded-xl bg-amber-50 p-3.5 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-center justify-center gap-2 text-xs text-amber-900 dark:text-amber-200">
          <Lightbulb className="h-4 w-4 text-amber-600 shrink-0" />
          <span><strong>Clue:</strong> {currentItem.hint}</span>
        </div>

        {/* Formed Letter Slots */}
        <div className="flex justify-center gap-2 min-h-[50px]">
          {placedLetters.length > 0 ? (
            placedLetters.map((char, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleRemoveLetter(char, i)}
                className="h-12 w-12 rounded-xl bg-primary-600 text-white font-black text-lg flex items-center justify-center shadow-md hover:bg-primary-700 transition-transform active:scale-95"
              >
                {char.toUpperCase()}
              </button>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic my-auto">
              Select letters below to spell the word
            </span>
          )}
        </div>

        {/* Available Scrambled Letter Bank */}
        <div className="pt-2">
          <div className="flex justify-center flex-wrap gap-2">
            {remainingLetters.map((char, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectLetter(char, idx)}
                className="h-12 w-12 rounded-xl border-2 border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center justify-center hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950 shadow-sm transition-all active:scale-95"
              >
                {char.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback message */}
        {isCorrect !== null && (
          <div
            className={`p-3 rounded-xl text-xs font-bold ${
              isCorrect
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-rose-50 text-rose-900 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
            }`}
          >
            {isCorrect ? 'Correctly spelled!' : `Incorrect. Word was "${currentItem.targetWord}".`}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            disabled={placedLetters.length === 0}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset
          </Button>

          {isCorrect === null ? (
            <Button
              size="sm"
              variant="gradient"
              onClick={handleCheck}
              disabled={placedLetters.length !== currentItem.targetWord.length}
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              Check Spelling
            </Button>
          ) : (
            currentIdx < items.length - 1 && (
              <Button size="sm" variant="gradient" onClick={handleNext}>
                Next Word
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            )
          )}
        </div>
      </Card>
    </div>
  );
}
