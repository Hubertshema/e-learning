'use client';

import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Headphones, Play, Pause, RotateCcw, CheckCircle2, HelpCircle } from 'lucide-react';

export interface ListeningQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

interface ListeningQuizActivityProps {
  title: string;
  audioUrl?: string;
  audioText?: string;
  questions: ListeningQuestion[];
  onComplete: (scorePercentage: number) => void;
}

export function ListeningQuizActivity({
  title,
  audioUrl,
  audioText,
  questions,
  onComplete,
}: ListeningQuizActivityProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handlePlayTTS = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && audioText) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(audioText);
      utterance.lang = 'en-US';
      utterance.rate = playbackSpeed;
      utterance.onend = () => setIsPlaying(false);
      setIsPlaying(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStopTTS = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const handleSelectOption = (qId: string, opt: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qId]: opt }));
  };

  const handleCheck = () => {
    setSubmitted(true);
    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) correct++;
    });
    const score = Math.round((correct / questions.length) * 100);
    onComplete(score);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Badge variant="indigo">Listening & Auditory Comprehension</Badge>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">{title}</h3>
        </div>
      </div>

      {/* Audio Track Player Box */}
      <Card className="p-6 bg-[#132519] border border-[#3B6748]/30 text-white shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-primary-300">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Audio Track & Dialogue</p>
              <p className="text-[11px] text-primary-200/80">Listen attentively before answering</p>
            </div>
          </div>

          {/* Speed Toggles */}
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-lg text-[10px] font-bold">
            {[0.75, 1.0, 1.25].map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-2 py-0.5 rounded transition-all ${
                  playbackSpeed === speed
                    ? 'bg-primary-500 text-white'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Player controls */}
        {audioUrl ? (
          <audio controls className="w-full mt-2">
            <source src={audioUrl} />
            Your browser does not support audio.
          </audio>
        ) : (
          <div className="flex items-center justify-center gap-3 pt-2">
            {!isPlaying ? (
              <Button size="sm" variant="secondary" onClick={handlePlayTTS} className="font-bold text-xs">
                <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                Play Native Dialogue ({playbackSpeed}x)
              </Button>
            ) : (
              <Button size="sm" variant="destructive" onClick={handleStopTTS} className="text-xs">
                <Pause className="mr-1.5 h-3.5 w-3.5" />
                Stop Playback
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Questions */}
      <div className="space-y-4">
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
            onClick={handleCheck}
          >
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            Check Answers
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
            Retry Listening Quiz
          </Button>
        )}
      </div>
    </div>
  );
}
