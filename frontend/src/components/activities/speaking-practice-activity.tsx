'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, Play, CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';

export interface SpeakingPrompt {
  id: string;
  topic: string;
  prompt: string;
  sampleAudioText: string;
  guidelines: string[];
}

interface SpeakingPracticeActivityProps {
  prompts: SpeakingPrompt[];
  onComplete: (scorePercentage: number) => void;
}

export function SpeakingPracticeActivity({ prompts, onComplete }: SpeakingPracticeActivityProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<boolean>(false);
  const [selfRating, setSelfRating] = useState<number | null>(null);

  const currentPrompt = prompts[currentIdx] || prompts[0];

  const handleListenSample = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentPrompt.sampleAudioText);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleToggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setRecordedAudio(true);
      }, 4000);
    } else {
      setIsRecording(false);
      setRecordedAudio(true);
    }
  };

  const handleNext = () => {
    if (currentIdx < prompts.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setRecordedAudio(false);
      setSelfRating(null);
    } else {
      onComplete(90);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Badge variant="indigo">Speaking & Phonetics Studio</Badge>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
            Speaking & Conversation Practice
          </h3>
          <p className="text-xs text-slate-500">
            Listen to the model response, record your speaking clip, and review your intonation.
          </p>
        </div>
        <span className="text-xs font-bold text-slate-500">
          {currentIdx + 1} of {prompts.length}
        </span>
      </div>

      <Card className="p-6 space-y-6 shadow-md">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600">
            {currentPrompt.topic}
          </span>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">
            {currentPrompt.prompt}
          </h2>
        </div>

        {/* Sample Audio Model */}
        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Native Audio Sample</span>
            <p className="text-xs text-slate-700 dark:text-slate-300 italic">
              "{currentPrompt.sampleAudioText}"
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={handleListenSample} className="shrink-0">
            <Volume2 className="mr-1.5 h-4 w-4 text-primary-600" />
            Listen Model
          </Button>
        </div>

        {/* Guidelines List */}
        {currentPrompt.guidelines && currentPrompt.guidelines.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pronunciation Key Focus:</p>
            <ul className="text-xs text-slate-600 dark:text-slate-400 list-disc pl-4 space-y-1">
              {currentPrompt.guidelines.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Voice Recorder Widget */}
        <div className="text-center py-6 border-t border-b border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleToggleRecording}
              className={`h-20 w-20 rounded-full flex items-center justify-center transition-all shadow-xl ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-400/40'
                  : recordedAudio
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
            </button>
          </div>

          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {isRecording
              ? 'Recording your voice... (Speak clearly into your microphone)'
              : recordedAudio
              ? 'Voice clip captured! Listen below or re-record.'
              : 'Click microphone to record your response.'}
          </p>

          {/* Waveform graphic representation */}
          {isRecording && (
            <div className="flex items-center justify-center gap-1 h-6">
              {[40, 70, 90, 60, 100, 75, 45, 80, 60, 30].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-rose-500 rounded-full animate-bounce"
                  style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Self-Rating Rubric */}
        {recordedAudio && (
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900 text-center space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Rate your pronunciation fluency:
            </span>
            <div className="flex justify-center gap-2">
              {[
                { score: 3, label: 'Needs Practice' },
                { score: 4, label: 'Good' },
                { score: 5, label: 'Fluent & Clear' },
              ].map((r) => (
                <button
                  key={r.score}
                  onClick={() => setSelfRating(r.score)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    selfRating === r.score
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-slate-200 bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Control Footer */}
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="gradient"
            disabled={!recordedAudio}
            onClick={handleNext}
          >
            {currentIdx < prompts.length - 1 ? 'Next Prompt' : 'Complete Speaking Module'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
