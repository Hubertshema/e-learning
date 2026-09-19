import React from 'react';
import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';

export default function LevelsPage() {
  const levels = [
    {
      code: 'Pre-A1 Starter',
      title: 'Foundations & Phonics',
      description: 'Ideal for absolute beginners with zero or limited exposure to English.',
      outcomes: ['Recognize alphabet & basic phonics', 'Introduce yourself & spell names', 'Count numbers & tell the time', 'Understand basic survival phrases'],
    },
    {
      code: 'A1 Beginner',
      title: 'Everyday Basic Communication',
      description: 'Build confidence with basic vocabulary, simple tenses, and daily interactions.',
      outcomes: ['Ask and answer simple personal questions', 'Order food and make simple purchases', 'Describe basic daily routines', 'Write short, simple messages'],
    },
    {
      code: 'A2 Elementary',
      title: 'Practical Communication',
      description: 'Communicate in routine tasks requiring simple and direct exchange of information.',
      outcomes: ['Describe your background and immediate environment', 'Talk about past experiences and future plans', 'Handle travel and shopping conversations', 'Understand short workplace memos'],
    },
    {
      code: 'B1 Intermediate',
      title: 'Independent Communicator',
      description: 'Understand the main points of clear standard input on familiar matters.',
      outcomes: ['Enter unprepared into conversations on familiar topics', 'Express thoughts, hopes, and ambitions', 'Write coherent connected text', 'Communicate in professional work meetings'],
    },
    {
      code: 'B2 Upper Intermediate',
      title: 'Professional Fluency',
      description: 'Interact with a degree of fluency and spontaneity that makes regular interaction effortless.',
      outcomes: ['Give clear, detailed descriptions on wide subjects', 'Explain viewpoints on topical issues', 'Participate actively in business negotiations', 'Write detailed reports and essays'],
    },
    {
      code: 'C1 Advanced',
      title: 'Effective Operational Proficiency',
      description: 'Express ideas fluently and spontaneously without much obvious searching for expressions.',
      outcomes: ['Use language flexibly for social, academic & professional purposes', 'Produce clear, well-structured, detailed text on complex subjects', 'Understand implicit meanings in nuanced texts', 'Deliver technical executive presentations'],
    },
    {
      code: 'C2 Mastery',
      title: 'Native-Level Precision',
      description: 'Understand with ease virtually everything heard or read.',
      outcomes: ['Summarize information from different spoken and written sources', 'Reconstruct arguments coherently in presentation', 'Express yourself spontaneously, very fluently and precisely', 'Differentiate finer shades of meaning'],
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-16 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
      <div className="space-y-3 max-w-3xl">
        <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#315B36] bg-[#EFF4EC] rounded-full border border-[#E2EBE2]">
          Proficiency Scale
        </span>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#2E3339]">
          The CEFR Language Progression Framework
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          The Common European Framework of Reference for Languages (CEFR) is the international standard for describing language ability, ensuring transparent, measurable progress for every student.
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {levels.map((lvl) => (
          <Card key={lvl.code} className="p-5 sm:p-6 bg-white border border-[#E2EBE2] shadow-sm rounded-2xl hover:border-[#315B36] transition-colors">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6 items-start">
              <div className="md:col-span-4 space-y-2">
                <span className="inline-block rounded-full bg-[#EFF4EC] text-[#315B36] border border-[#E2EBE2] px-3 py-0.5 text-xs font-bold">
                  {lvl.code}
                </span>
                <h2 className="text-lg font-bold text-[#2E3339]">{lvl.title}</h2>
                <p className="text-xs sm:text-sm text-slate-600">{lvl.description}</p>
              </div>

              <div className="md:col-span-8">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                  Key Competencies & Outcomes:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {lvl.outcomes.map((outcome, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                      <div className="p-0.5 rounded-full bg-[#EFF4EC] text-[#315B36] shrink-0 mt-0.5">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span className="leading-snug">{outcome}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
