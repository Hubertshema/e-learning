'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImageIcon, Mic, Sparkles, CheckCircle2, Volume2 } from 'lucide-react';

export interface PicturePromptItem {
  id: string;
  imageUrl: string;
  title: string;
  guidingQuestions: string[];
  sampleVocabulary: string[];
  modelDescription: string;
}

interface PictureDescriptionActivityProps {
  items: PicturePromptItem[];
  onComplete: (scorePercentage: number) => void;
}

export function PictureDescriptionActivity({
  items,
  onComplete,
}: PictureDescriptionActivityProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [studentText, setStudentText] = useState('');
  const [showModel, setShowModel] = useState(false);

  const currentItem = items[currentIdx] || items[0];

  const handleNext = () => {
    if (currentIdx < items.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setStudentText('');
      setShowModel(false);
    } else {
      onComplete(95);
    }
  };

  const handleListenModel = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentItem.modelDescription);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Badge variant="indigo">Visual Speaking & Description</Badge>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
            Picture Description Exercise
          </h3>
          <p className="text-xs text-slate-500">
            Analyze the scene and describe what you see using targeted vocabulary.
          </p>
        </div>
        <span className="text-xs font-bold text-slate-500">
          {currentIdx + 1} of {items.length}
        </span>
      </div>

      <Card className="p-6 space-y-6 shadow-md">
        {/* Picture Container */}
        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 max-h-72 flex items-center justify-center relative">
          {currentItem.imageUrl?.startsWith('http') ? (
            <img
              src={currentItem.imageUrl}
              alt={currentItem.title}
              className="w-full h-full object-cover max-h-72"
            />
          ) : (
            <div className="py-16 text-center space-y-2">
              <ImageIcon className="mx-auto h-12 w-12 text-slate-400" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Scene: {currentItem.title}
              </p>
            </div>
          )}
        </div>

        {/* Guiding Questions & Target Vocabulary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-900 space-y-1.5 border border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider">
              Guiding Questions:
            </span>
            <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-400">
              {currentItem.guidingQuestions.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-900 space-y-1.5 border border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider">
              Key Vocabulary to Use:
            </span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {currentItem.sampleVocabulary.map((v, i) => (
                <Badge key={i} variant="indigo" className="text-[10px]">{v}</Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Text / Speaking response box */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Your Description (Spoken or Written):
          </label>
          <textarea
            rows={4}
            placeholder="In this image, I can see a group of professionals having a meeting in an office..."
            value={studentText}
            onChange={(e) => setStudentText(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
          />
        </div>

        {/* Model description reveal */}
        {showModel && (
          <div className="rounded-xl bg-emerald-50/70 p-4 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                Model Native Description:
              </span>
              <Button size="sm" variant="ghost" onClick={handleListenModel} className="text-xs h-7">
                <Volume2 className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                Listen
              </Button>
            </div>
            <p className="text-xs text-emerald-800 dark:text-emerald-200 italic">
              "{currentItem.modelDescription}"
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowModel(!showModel)}
            className="text-xs"
          >
            {showModel ? 'Hide Model Answer' : 'Show Model Answer'}
          </Button>

          <Button
            size="sm"
            variant="gradient"
            onClick={handleNext}
          >
            {currentIdx < items.length - 1 ? 'Next Picture' : 'Complete Activity'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
