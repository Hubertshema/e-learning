'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Volume2, RotateCcw, Check, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';

export interface FlashcardItem {
  id: string;
  word: string;
  phonetic?: string;
  partOfSpeech?: string;
  definition: string;
  example: string;
  translation?: string;
}

interface FlashcardActivityProps {
  cards: FlashcardItem[];
  onComplete: (scorePercentage: number) => void;
}

export function FlashcardActivity({ cards, onComplete }: FlashcardActivityProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());

  const currentCard = cards[currentIndex] || cards[0];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      const score = Math.round((masteredIds.size / cards.length) * 100);
      onComplete(score || 100);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleMarkMastered = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = new Set(masteredIds);
    updated.add(currentCard.id);
    setMasteredIds(updated);
    handleNext();
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentCard.word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-slate-700 dark:text-slate-300">
          Card {currentIndex + 1} of {cards.length}
        </span>
        <Badge variant="success" className="text-[10px]">
          {masteredIds.size} of {cards.length} Mastered
        </Badge>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full bg-primary-600 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      {/* 3D Flip Card Container */}
      <div
        onClick={handleFlip}
        className="cursor-pointer perspective-1000 min-h-[300px] flex items-center justify-center"
      >
        <Card
          className={`w-full p-8 text-center transition-all duration-500 transform shadow-xl border-2 flex flex-col justify-between min-h-[280px] ${
            isFlipped
              ? 'bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-primary-500'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary-300'
          }`}
        >
          {!isFlipped ? (
            /* Front Side: Word & Audio */
            <div className="space-y-4 my-auto">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Click Card to Flip Definition
              </span>
              <div className="flex items-center justify-center gap-3">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                  {currentCard.word}
                </h3>
                <button
                  onClick={handleSpeak}
                  title="Listen to native pronunciation"
                  className="rounded-full bg-primary-50 p-2 text-primary-600 hover:bg-primary-100 dark:bg-primary-950 dark:text-primary-300"
                >
                  <Volume2 className="h-5 w-5" />
                </button>
              </div>
              {currentCard.phonetic && (
                <p className="font-mono text-xs text-primary-600 dark:text-primary-400">
                  {currentCard.phonetic}
                </p>
              )}
              {currentCard.partOfSpeech && (
                <Badge variant="outline" className="text-[10px]">
                  {currentCard.partOfSpeech}
                </Badge>
              )}
            </div>
          ) : (
            /* Back Side: Definition & Examples */
            <div className="space-y-4 my-auto">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-300">
                Definition & Context
              </span>
              <p className="text-sm font-semibold text-white leading-relaxed">
                {currentCard.definition}
              </p>
              <div className="rounded-xl bg-white/10 p-3 text-xs text-primary-100 italic">
                "{currentCard.example}"
              </div>
              {currentCard.translation && (
                <p className="text-xs text-slate-300">
                  Translation: <strong>{currentCard.translation}</strong>
                </p>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>Flip card for full details</span>
            <RotateCcw className="h-4 w-4" />
          </div>
        </Card>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          disabled={currentIndex === 0}
          onClick={handlePrev}
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Previous
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={handleMarkMastered}
          className="bg-emerald-600 hover:bg-emerald-700 text-xs"
        >
          <Check className="mr-1.5 h-3.5 w-3.5" />
          Mark as Mastered
        </Button>

        <Button
          variant="gradient"
          size="sm"
          onClick={handleNext}
        >
          {currentIndex < cards.length - 1 ? 'Next' : 'Finish Activity'}
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
