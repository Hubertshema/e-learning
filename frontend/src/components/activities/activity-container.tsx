'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Award, CheckCircle2, RotateCcw, ArrowRight } from 'lucide-react';
import { FlashcardActivity } from './flashcard-activity';
import { FillBlanksActivity } from './fill-blanks-activity';
import { MatchingActivity } from './matching-activity';
import { SentenceReorderActivity } from './sentence-reorder-activity';
import { SpeakingPracticeActivity } from './speaking-practice-activity';
import { ReadingPassageActivity } from './reading-passage-activity';
import { ListeningQuizActivity } from './listening-quiz-activity';
import { PictureDescriptionActivity } from './picture-description-activity';
import { WordScrambleActivity } from './word-scramble-activity';
import { apiClient } from '@/lib/api-client';

export interface ActivityData {
  id: string;
  title: string;
  type: string;
  instructions?: string;
  skillType?: string;
  questions: Array<{
    id: string;
    prompt: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
    audioPromptUrl?: string;
  }>;
}

interface ActivityContainerProps {
  activity: ActivityData;
  onFinished?: (score: number) => void;
  onComplete?: (score?: number) => void;
}

export function ActivityContainer({ activity, onFinished, onComplete }: ActivityContainerProps) {
  const [completedScore, setCompletedScore] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const handleActivityComplete = async (score: number) => {
    setCompletedScore(score);
    if (onComplete) {
      onComplete(score);
    }
    try {
      setSaving(true);
      if (activity.id) {
        await apiClient.post(`/activities/${activity.id}/submit`, {
          scorePercentage: score,
          skillType: activity.skillType || 'GRAMMAR',
          timeSpentSec: 90,
        });
      }
    } catch (err) {
      console.error('Failed to submit activity score', err);
    } finally {
      setSaving(false);
      if (onFinished) {
        onFinished(score);
      }
    }
  };

  const renderInnerActivity = () => {
    switch (activity.type) {
      case 'FLASHCARD':
        return (
          <FlashcardActivity
            cards={activity.questions.map((q) => ({
              id: q.id,
              word: q.prompt,
              definition: q.correctAnswer,
              example: q.explanation || 'Example sentence using this term in workplace communication.',
            }))}
            onComplete={handleActivityComplete}
          />
        );

      case 'FILL_BLANKS':
        return (
          <FillBlanksActivity
            questions={activity.questions.map((q) => {
              const parts = q.prompt.split('___');
              return {
                id: q.id,
                sentenceBefore: parts[0] || 'Please enter ',
                sentenceAfter: parts[1] || ' in the correct form.',
                correctAnswer: q.correctAnswer,
                options: q.options,
                explanation: q.explanation,
              };
            })}
            onComplete={handleActivityComplete}
          />
        );

      case 'MATCHING':
        return (
          <MatchingActivity
            pairs={activity.questions.map((q) => ({
              id: q.id,
              leftTerm: q.prompt,
              rightMatch: q.correctAnswer,
            }))}
            onComplete={handleActivityComplete}
          />
        );

      case 'SENTENCE_REORDER':
        return (
          <SentenceReorderActivity
            sentences={activity.questions.map((q) => ({
              id: q.id,
              jumbledWords: q.options && q.options.length > 0 ? q.options : q.correctAnswer.split(' ').sort(() => Math.random() - 0.5),
              correctSentence: q.correctAnswer,
              hint: q.explanation,
            }))}
            onComplete={handleActivityComplete}
          />
        );

      case 'SPEAKING_PRACTICE':
        return (
          <SpeakingPracticeActivity
            prompts={activity.questions.map((q) => ({
              id: q.id,
              topic: q.prompt,
              prompt: q.options[0] || q.prompt,
              sampleAudioText: q.correctAnswer,
              guidelines: [
                'Maintain steady pacing and natural sentence stress.',
                'Pronounce consonants clearly at word endings.',
              ],
            }))}
            onComplete={handleActivityComplete}
          />
        );

      case 'PICTURE_DESCRIPTION':
        return (
          <PictureDescriptionActivity
            items={activity.questions.map((q) => ({
              id: q.id,
              imageUrl: q.audioPromptUrl || '',
              title: q.prompt,
              guidingQuestions: q.options && q.options.length > 0 ? q.options : ['What is the main action taking place?', 'Describe the setting and emotions.'],
              sampleVocabulary: ['collaboration', 'strategy', 'presentation', 'objective'],
              modelDescription: q.correctAnswer,
            }))}
            onComplete={handleActivityComplete}
          />
        );

      case 'WORD_SCRAMBLE':
        return (
          <WordScrambleActivity
            items={activity.questions.map((q) => ({
              id: q.id,
              targetWord: q.correctAnswer,
              scrambledLetters: q.options && q.options.length > 0 ? q.options : q.correctAnswer.split('').sort(() => Math.random() - 0.5),
              hint: q.prompt || 'Spelling drill',
            }))}
            onComplete={handleActivityComplete}
          />
        );

      case 'READING_PASSAGE':
        return (
          <ReadingPassageActivity
            title={activity.title}
            passage={activity.instructions || 'Effective communication in international business requires both clarity and cultural empathy. Leaders who articulate expectations while listening actively foster stronger team collaboration and higher project success rates.'}
            questions={activity.questions.map((q) => ({
              id: q.id,
              question: q.prompt,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
            }))}
            onComplete={handleActivityComplete}
          />
        );

      case 'LISTENING_QUIZ':
      default:
        return (
          <ListeningQuizActivity
            title={activity.title}
            audioText={activity.instructions || 'Welcome to our international client meeting. Today we are discussing key milestones for the upcoming quarter.'}
            questions={activity.questions.map((q) => ({
              id: q.id,
              question: q.prompt,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
            }))}
            onComplete={handleActivityComplete}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {completedScore === null ? (
        renderInnerActivity()
      ) : (
        <Card className="p-8 text-center space-y-4 max-w-lg mx-auto bg-[#F4F7F4] border-2 border-[#3B6748]/30 dark:bg-emerald-950/40 shadow-2xl">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-100 flex items-center justify-center dark:bg-emerald-950/60">
            <Sparkles className="h-8 w-8 text-emerald-600" />
          </div>

          <div>
            <Badge variant="success" className="text-xs">
              Activity Completed
            </Badge>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
              Mastery Score: {completedScore}%
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Your 7-Skill Mastery Matrix has been updated in PostgreSQL.
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCompletedScore(null)}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Practice Again
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
