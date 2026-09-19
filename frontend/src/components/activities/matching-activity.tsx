'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, RotateCcw } from 'lucide-react';

export interface MatchingPair {
  id: string;
  leftTerm: string;
  rightMatch: string;
}

interface MatchingActivityProps {
  pairs: MatchingPair[];
  onComplete: (scorePercentage: number) => void;
}

export function MatchingActivity({ pairs, onComplete }: MatchingActivityProps) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState(0);

  // Shuffle right items initially
  const [shuffledRight] = useState(() =>
    [...pairs].map((p) => ({ id: p.id, text: p.rightMatch })).sort(() => Math.random() - 0.5)
  );

  const handleSelectLeft = (id: string) => {
    if (matchedIds.has(id)) return;
    setSelectedLeft(id);
    if (selectedRight) {
      evaluateMatch(id, selectedRight);
    }
  };

  const handleSelectRight = (id: string) => {
    if (matchedIds.has(id)) return;
    setSelectedRight(id);
    if (selectedLeft) {
      evaluateMatch(selectedLeft, id);
    }
  };

  const evaluateMatch = (leftId: string, rightId: string) => {
    if (leftId === rightId) {
      const updated = new Set(matchedIds);
      updated.add(leftId);
      setMatchedIds(updated);
      setSelectedLeft(null);
      setSelectedRight(null);

      if (updated.size === pairs.length) {
        const score = Math.max(50, 100 - mistakes * 10);
        onComplete(score);
      }
    } else {
      setMistakes((prev) => prev + 1);
      setTimeout(() => {
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 500);
    }
  };

  const handleReset = () => {
    setMatchedIds(new Set());
    setSelectedLeft(null);
    setSelectedRight(null);
    setMistakes(0);
  };

  const isAllMatched = matchedIds.size === pairs.length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Badge variant="indigo">Vocabulary & Concept Association</Badge>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
            Match the Correct Pairs
          </h3>
          <p className="text-xs text-slate-500">
            Click an English term on the left, then click its corresponding definition or partner on the right.
          </p>
        </div>
        <Badge variant="success" className="text-xs">
          {matchedIds.size} / {pairs.length} Matched
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Left Column: English Terms */}
        <div className="space-y-2.5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">English Terms</p>
          {pairs.map((p) => {
            const isMatched = matchedIds.has(p.id);
            const isSelected = selectedLeft === p.id;
            return (
              <button
                key={p.id}
                type="button"
                disabled={isMatched}
                onClick={() => handleSelectLeft(p.id)}
                className={`w-full text-left p-3.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-between ${
                  isMatched
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 opacity-60 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : isSelected
                    ? 'border-primary-500 bg-primary-50 text-primary-900 ring-2 ring-primary-500/30 dark:bg-primary-950 dark:text-primary-200'
                    : 'border-slate-200 bg-white hover:border-primary-300 dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <span>{p.leftTerm}</span>
                {isMatched && <Check className="h-4 w-4 text-emerald-600" />}
              </button>
            );
          })}
        </div>

        {/* Right Column: Definitions / Matches */}
        <div className="space-y-2.5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Definitions / Partners</p>
          {shuffledRight.map((item) => {
            const isMatched = matchedIds.has(item.id);
            const isSelected = selectedRight === item.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={isMatched}
                onClick={() => handleSelectRight(item.id)}
                className={`w-full text-left p-3.5 rounded-xl text-xs font-medium transition-all border flex items-center justify-between ${
                  isMatched
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 opacity-60 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : isSelected
                    ? 'border-primary-500 bg-primary-50 text-primary-900 ring-2 ring-primary-500/30 dark:bg-primary-950 dark:text-primary-200'
                    : 'border-slate-200 bg-white hover:border-primary-300 dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <span>{item.text}</span>
                {isMatched && <Check className="h-4 w-4 text-emerald-600" />}
              </button>
            );
          })}
        </div>
      </div>

      {isAllMatched && (
        <Card className="p-6 text-center space-y-3 bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800">
          <Sparkles className="mx-auto h-8 w-8 text-emerald-600" />
          <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
            All Pairs Successfully Connected!
          </h4>
          <p className="text-xs text-emerald-700 dark:text-emerald-300">
            Accuracy: {Math.max(50, 100 - mistakes * 10)}% ({mistakes} retries).
          </p>
          <Button size="sm" variant="outline" onClick={handleReset} className="text-xs">
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Play Again
          </Button>
        </Card>
      )}
    </div>
  );
}
