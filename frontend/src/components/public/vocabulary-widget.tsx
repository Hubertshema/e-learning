'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Volume2, Sparkles } from 'lucide-react';

const ELOQUENT_WORDS = [
  { word: "Eloquent", meaning: "Fluent or persuasive in speaking or writing." },
  { word: "Mellifluous", meaning: "Sweet or musical; pleasant to hear." },
  { word: "Serendipity", meaning: "The occurrence and development of events by chance in a happy or beneficial way." },
  { word: "Ephemeral", meaning: "Lasting for a very short time." },
  { word: "Luminous", meaning: "Full of or shedding light; bright or shining, especially in the dark." },
  { word: "Ineffable", meaning: "Too great or extreme to be expressed or described in words." },
  { word: "Sycophant", meaning: "A person who acts obsequiously toward someone important in order to gain advantage." },
  { word: "Alacrity", meaning: "Brisk and cheerful readiness." },
  { word: "Pernicious", meaning: "Having a harmful effect, especially in a gradual or subtle way." },
  { word: "Cacophony", meaning: "A harsh, discordant mixture of sounds." },
  { word: "Petrichor", meaning: "A pleasant smell that frequently accompanies the first rain after a long period of warm, dry weather." },
  { word: "Sonorous", meaning: "Imposingly deep and full." },
  { word: "Halcyon", meaning: "Denoting a period of time in the past that was idyllically happy and peaceful." },
  { word: "Supine", meaning: "Failing to act or protest as a result of moral weakness or indolence." },
  { word: "Limerence", meaning: "The state of being infatuated or obsessed with another person." },
  { word: "Ethereal", meaning: "Extremely delicate and light in a way that seems too perfect for this world." },
  { word: "Phosphenes", meaning: "The light and colors produced by rubbing your eyes." },
  { word: "Defenestration", meaning: "The act of throwing someone or something out of a window." },
  { word: "Oblivion", meaning: "The state of being unaware or unconscious of what is happening." },
  { word: "Aurora", meaning: "The dawn in the early morning." },
  { word: "Labyrinthine", meaning: "Like a labyrinth; irregular and twisting." },
  { word: "Idyllic", meaning: "Extremely happy, peaceful, or picturesque." },
  { word: "Vellichor", meaning: "The strange wistfulness of used bookstores." },
  { word: "Aquiver", meaning: "Quivering, trembling." },
  { word: "Bombinate", meaning: "To make a humming or buzzing noise." },
  { word: "Incandescent", meaning: "Emitting light as a result of being heated." },
  { word: "Cromulent", meaning: "Acceptable or adequate." },
  { word: "Susurrus", meaning: "Whispering, murmuring, or rustling." },
  { word: "Tintinnabulation", meaning: "A ringing or tinkling sound." },
  { word: "Quintessential", meaning: "Representing the most perfect or typical example of a quality or class." }
];

export function VocabularyWidget() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const currentWord = ELOQUENT_WORDS[currentIndex];

  const playPronunciation = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const nextWord = () => {
    setRevealed(false);
    setCurrentIndex((prev) => (prev + 1) % ELOQUENT_WORDS.length);
  };

  const handleReveal = () => {
    if (revealed) {
      // User clicked while waiting, so just go to next word
      nextWord();
      return;
    }
    
    setRevealed(true);
    playPronunciation(currentWord.word);
  };

  return (
    <Card className="w-full max-w-sm mx-auto overflow-hidden border-[#E2E8F0] shadow-md rounded-2xl bg-white">
      <div className="bg-[#006EF3] p-4 text-center">
        <h3 className="text-white font-bold tracking-wider uppercase text-sm flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4" /> Word of the Moment
        </h3>
      </div>
      
      <div className="p-6 text-center space-y-6">
        <div className="min-h-[120px] flex flex-col justify-center items-center">
          <h2 className="text-3xl font-black text-[#172033] mb-2">{currentWord.word}</h2>
          
          {revealed ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-sm text-[#667085] italic leading-relaxed">
                "{currentWord.meaning}"
              </p>
            </div>
          ) : (
            <div className="text-sm text-[#667085] bg-slate-100 px-4 py-2 rounded-lg inline-block">
              Meaning hidden
            </div>
          )}
        </div>

        <Button 
          onClick={handleReveal} 
          className="w-full rounded-xl"
          variant={revealed ? "outline" : "default"}
        >
          {revealed ? (
            <>
              Next Word
            </>
          ) : (
            <>
              <Volume2 className="h-4 w-4 mr-2" />
              Reveal & Pronounce
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
