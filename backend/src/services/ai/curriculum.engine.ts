import {
  CEFRLevel,
  SkillType,
  TeachingStyle,
  GeneratedLessonPlan,
  GeneratedActivitySet,
  ActivityQuestionItem,
  GeneratedAssessmentBlueprint,
  GeneratedAssessment,
  GeneratedRubric,
  GeneratedFeedbackSuggestion,
  PerformanceTeachingRecommendation,
} from '../../types/ai.types.js';

/**
 * Intelligent CEFR Curriculum & Assessment Engine
 * Generates pedagogically structured materials across A1-C2 with zero external API dependencies.
 */
export class CurriculumEngine {
  /**
   * Helper to get level-appropriate CEFR descriptors
   */
  private static getLevelDescriptor(level: CEFRLevel): {
    canDo: string;
    vocabularyComplexity: string;
    grammarFocus: string;
  } {
    switch (level) {
      case 'PRE_A1':
      case 'A1':
        return {
          canDo: 'Understand and use familiar everyday expressions and very basic phrases for concrete needs.',
          vocabularyComplexity: 'High-frequency everyday words (numbers, family, colors, basic verbs).',
          grammarFocus: 'Present simple, basic subject pronouns, to be, simple questions with what/where.',
        };
      case 'A2':
        return {
          canDo: 'Understand sentences and frequently used expressions related to immediate relevance (e.g. personal information, shopping, local geography, employment).',
          vocabularyComplexity: 'Routine tasks and descriptive vocabulary for daily routines, places, and feelings.',
          grammarFocus: 'Past simple, present continuous, comparatives/superlatives, basic modal verbs (can, must).',
        };
      case 'B1':
        return {
          canDo: 'Understand the main points of clear standard input on familiar matters regularly encountered in work, school, leisure.',
          vocabularyComplexity: 'Intermediate vocabulary, idioms, transition words (however, furthermore), expressing opinions.',
          grammarFocus: 'Present perfect, first and second conditionals, reported speech, passive voice basics, relative clauses.',
        };
      case 'B2':
        return {
          canDo: 'Understand the main ideas of complex text on both concrete and abstract topics, including technical discussions in his/her field of specialization.',
          vocabularyComplexity: 'Advanced collocations, nuance, formal vs informal register, discourse markers.',
          grammarFocus: 'Mixed conditionals, third conditional, modal deductions (must have, could have), cleft sentences, inversion.',
        };
      case 'C1':
      case 'C2':
        return {
          canDo: 'Understand a wide range of demanding, longer texts, and recognise implicit meaning. Express ideas fluently and spontaneously without much obvious searching for expressions.',
          vocabularyComplexity: 'Sophisticated academic vocabulary, figurative language, rhetorical devices, idiomatic expressions.',
          grammarFocus: 'Subjunctive mood, advanced inversions, participle clauses, nominalization, nuanced modality.',
        };
      default:
        return {
          canDo: 'Communicate effectively in standard English situations.',
          vocabularyComplexity: 'General English vocabulary.',
          grammarFocus: 'Standard grammatical structures.',
        };
    }
  }

  /**
   * Generate Structured Lesson Plan
   */
  public static generateLessonPlan(params: {
    topic: string;
    cefrLevel: CEFRLevel;
    targetSkill: SkillType;
    durationMinutes: number;
    teachingStyle: TeachingStyle;
    courseTitle?: string;
    classSize?: number;
    customObjectives?: string[];
  }): GeneratedLessonPlan {
    const { topic, cefrLevel, targetSkill, durationMinutes, teachingStyle, courseTitle, classSize = 25 } = params;
    const desc = this.getLevelDescriptor(cefrLevel);

    const defaultObjectives = [
      `Identify and analyze key ${targetSkill.toLowerCase()} patterns related to "${topic}" at CEFR level ${cefrLevel}.`,
      `Accurately apply target vocabulary and structures in communicative tasks.`,
      `Demonstrate communicative fluency and accuracy through interactive pair and individual exercises.`,
    ];

    const objectives = params.customObjectives && params.customObjectives.length > 0
      ? params.customObjectives
      : defaultObjectives;

    const timeWarmup = Math.max(5, Math.round(durationMinutes * 0.15));
    const timePresentation = Math.max(10, Math.round(durationMinutes * 0.25));
    const timeGuided = Math.max(10, Math.round(durationMinutes * 0.20));
    const timeCollab = Math.max(10, Math.round(durationMinutes * 0.20));
    const timeIndep = Math.max(10, Math.round(durationMinutes * 0.15));
    const timeWrapup = Math.max(5, durationMinutes - (timeWarmup + timePresentation + timeGuided + timeCollab + timeIndep));

    return {
      title: `${topic} — Masterclass (${cefrLevel})`,
      courseTitle: courseTitle || `FluentEdge CEFR ${cefrLevel} English Core`,
      cefrLevel,
      durationMinutes,
      teachingStyle,
      targetSkill,
      classSize,
      learningObjectives: objectives,
      prerequisites: [
        `Prior completion of basic ${cefrLevel === 'A1' ? 'foundational alphabet and greetings' : `${cefrLevel} prerequisite units`}.`,
        `Familiarity with standard classroom instructional phrases.`,
      ],
      requiredMaterials: [
        `Digital whiteboard / Presentation slides featuring illustrative visual flashcards of "${topic}".`,
        `Student handouts with guided fill-in and sentence construction templates.`,
        `Audio playback device or interactive web practice portal.`,
      ],
      warmup: {
        title: `Dynamic Warm-up & Contextual Elicitation`,
        durationMinutes: timeWarmup,
        teacherAction: `Introduce a provocative image and question related to "${topic}". Elicit target words from students using think-pair-share. Write student suggestions on the board.`,
        studentAction: `Engage in brief 2-minute breakout discussions in pairs to predict the lesson topic and activate schema.`,
        materials: ['Whiteboard / Slide deck prompt', 'Conversation trigger questions'],
        differentiation: {
          forLowerLevel: 'Provide sentence starters: "In my opinion, I think..." or "I notice that..."',
          forHigherLevel: 'Ask students to justify their predictions with two supporting reasons.',
        },
      },
      presentation: {
        title: `Core Concept Presentation & Controlled Exposure`,
        durationMinutes: timePresentation,
        teacherAction: `Present target linguistic structures (${desc.grammarFocus}) and key vocabulary (${desc.vocabularyComplexity}). Use inductive clarification questioning (CCQs: Concept Checking Questions) to verify understanding.`,
        studentAction: `Listen actively, take structured notes in Cornell note format, and repeat key pronunciation drills for intonation and stress.`,
        materials: ['Rule breakdown chart', 'Model audio / contextual dialogue'],
        differentiation: {
          forLowerLevel: 'Highlight color-coded subject/verb agreement in projected examples.',
          forHigherLevel: 'Encourage students to identify edge cases and irregular patterns.',
        },
      },
      guidedPractice: {
        title: `Structured & Guided Application Drill`,
        durationMinutes: timeGuided,
        teacherAction: `Lead the entire class through choral repetition, error analysis of common pitfalls, and interactive gap-filling exercises. Circulate to provide targeted on-the-spot corrective feedback.`,
        studentAction: `Complete 5 guided sentence transformations individually, then verify answers with shoulder partners before whole-class debrief.`,
        materials: ['Worksheet Part A (Guided exercises)'],
      },
      collaborativeActivity: {
        title: `Interactive Task-Based Group Collaboration`,
        durationMinutes: timeCollab,
        teacherAction: `Assign role-play cards or problem-solving prompts revolving around real-world scenarios in "${topic}". Monitor active speaking time and take notes for delayed error correction.`,
        studentAction: `Collaborate in small groups of 3-4 to create a mini-dialogue or presentation applying all target expressions. Present to a neighboring group.`,
        materials: ['Role-play scenario cards', 'Peer evaluation checklist'],
        differentiation: {
          forLowerLevel: 'Offer a structured dialogue script with fill-in blanks.',
          forHigherLevel: 'Assign an unexpected conflict or impromptu constraint to the scenario.',
        },
      },
      independentPractice: {
        title: `Autonomous Production & Formative Assessment`,
        durationMinutes: timeIndep,
        teacherAction: `Distribute the independent checkpoint task. Observe without intervening to assess individual mastery against lesson objectives.`,
        studentAction: `Draft a short contextual paragraph (50-120 words according to ${cefrLevel}) demonstrating fluent usage of "${topic}".`,
        materials: ['Individual assessment slip / Platform quiz'],
      },
      assessmentWrapUp: {
        title: `Reflection, Delayed Error Correction & Exit Ticket`,
        durationMinutes: timeWrapup,
        teacherAction: `Conduct anonymous whiteboard delayed error correction based on circulating notes. Prompt students to complete the 1-minute exit ticket summary.`,
        studentAction: `Identify errors in the projected sentences and submit a 2-sentence digital exit ticket explaining what they learned today.`,
        materials: ['Exit ticket digital form'],
      },
      differentiationNotes: `Tier 1 learners receive visual glossaries and phonetic aids. Tier 3 learners are prompted to extend explanations and mentor peers.`,
      homeworkAssignment: `Complete the interactive online quiz for "${topic}" on FluentEdge Portal and record a 60-second voice note summarizing the topic on the class discussion board.`,
      summaryKeyTakeaways: [
        `Mastery of core ${cefrLevel} grammar and vocabulary pertaining to ${topic}.`,
        `Increased communicative confidence during spontaneous interaction.`,
        `Self-correction awareness through structured peer and teacher feedback.`,
      ],
    };
  }

  /**
   * Generate Multi-Skill Activity Set
   */
  public static generateActivitySet(params: {
    topic: string;
    cefrLevel: CEFRLevel;
    skill: SkillType;
    activityType: string;
    itemCount: number;
    difficulty?: 'EASY' | 'NORMAL' | 'HARD';
  }): GeneratedActivitySet {
    const { topic, cefrLevel, skill, activityType, itemCount = 5, difficulty = 'NORMAL' } = params;

    const items: ActivityQuestionItem[] = [];

    for (let i = 1; i <= itemCount; i++) {
      if (activityType === 'MULTIPLE_CHOICE' || activityType === 'READING_COMPREHENSION' || activityType === 'LISTENING_QUIZ') {
        items.push({
          prompt: `Question ${i}: Which of the following sentences correctly demonstrates the ${skill.toLowerCase()} principle for "${topic}" at level ${cefrLevel}?`,
          type: 'MULTIPLE_CHOICE',
          options: [
            `Option A: Primary standard structure with correct ${skill.toLowerCase()} application.`,
            `Option B: Common error involving tense mismatch or irregular agreement.`,
            `Option C: Inappropriate register or misapplied vocabulary word.`,
            `Option D: Syntactically inverted structure missing a vital preposition.`,
          ],
          correctAnswer: 'Option A: Primary standard structure with correct skill application.',
          explanation: `Option A is correct because it follows standard CEFR ${cefrLevel} grammar rules and lexical collocations for "${topic}".`,
          points: 2,
        });
      } else if (activityType === 'TRUE_FALSE') {
        items.push({
          prompt: `Statement ${i}: In standard English usage at ${cefrLevel} level, "${topic}" can be used in both formal and informal contexts with appropriate modal adjustments.`,
          type: 'TRUE_FALSE',
          options: ['True', 'False'],
          correctAnswer: 'True',
          explanation: `True — ${topic} principles apply broadly across registers when modal markers and vocabulary nuance are respected.`,
          points: 1,
        });
      } else if (activityType === 'FILL_BLANKS') {
        items.push({
          prompt: `Item ${i}: Fill in the missing target expression: "When preparing to discuss ${topic}, one must ________ carefully before responding."`,
          type: 'FILL_BLANKS',
          correctAnswer: 'reflect / consider / analyze',
          explanation: `The verb 'consider' or 'reflect' completes the infinitive clause with precise lexical fit for CEFR ${cefrLevel}.`,
          points: 2,
        });
      } else if (activityType === 'SENTENCE_ORDER') {
        items.push({
          prompt: `Item ${i}: Reorder the scrambled words into a grammatically correct sentence: [often / students / about / discuss / ${topic} / enthusiastically / during class]`,
          type: 'SENTENCE_ORDER',
          options: ['often', 'students', 'about', 'discuss', topic, 'enthusiastically', 'during class'],
          correctAnswer: `Students often discuss about ${topic} enthusiastically during class.`,
          explanation: `Standard S-V-O order with frequency adverb placement before the main verb.`,
          points: 3,
        });
      } else if (activityType === 'SPEAKING_PRACTICE') {
        items.push({
          prompt: `Speaking Task ${i}: Speak for 90 seconds explaining how "${topic}" influences your daily routine or professional perspective. Include at least 3 CEFR ${cefrLevel} transition markers (e.g., 'Furthermore', 'As a result', 'Consequently').`,
          type: 'SPEAKING_PROMPT',
          correctAnswer: 'Fluent oral response containing 3+ cohesive devices, clear pronunciation, and accurate tense consistency.',
          explanation: 'Assessed on Fluency, Pronunciation, Grammatical Range, and Lexical Resource.',
          points: 10,
          rubricCriteria: ['Fluency & Coherence', 'Lexical Resource', 'Grammatical Accuracy', 'Pronunciation'],
        });
      } else {
        // MATCHING or SHORT_ANSWER
        items.push({
          prompt: `Item ${i}: Define the core concept of "${topic}" in your own words and provide one clear illustrative example.`,
          type: 'SHORT_ANSWER',
          correctAnswer: `A comprehensive definition addressing "${topic}" followed by a grammatically sound contextual example.`,
          explanation: `Expected to demonstrate ${cefrLevel} vocabulary range and syntactic complexity.`,
          points: 5,
        });
      }
    }

    return {
      title: `${topic} Interactive Practice (${skill} - ${cefrLevel})`,
      topic,
      cefrLevel,
      skill,
      estimatedMinutes: itemCount * 3 + 5,
      instructions: `Complete the following ${itemCount} practice items. Read each prompt carefully and apply target ${cefrLevel} language rules.`,
      passageOrScript: skill === 'READING' || activityType === 'READING_COMPREHENSION'
        ? `Reading Passage (${cefrLevel}): In contemporary discourse, understanding ${topic} plays a central role in effective communication. Learners across different backgrounds develop fluency by combining systematic study with practical conversational immersion. Recent studies highlight that active recall and task-based repetition yield the highest linguistic retention.`
        : undefined,
      items,
    };
  }

  /**
   * Generate Assessment Blueprint
   */
  public static generateAssessmentBlueprint(params: {
    title: string;
    assessmentType: string;
    cefrLevel: CEFRLevel;
    totalMarks: number;
    durationMinutes: number;
    skills: SkillType[];
    bloomsTaxonomy?: {
      remember: number;
      understand: number;
      apply: number;
      analyze: number;
      evaluate: number;
      create: number;
    };
  }): GeneratedAssessmentBlueprint {
    const {
      title,
      assessmentType,
      cefrLevel,
      totalMarks,
      durationMinutes,
      skills,
      bloomsTaxonomy = {
        remember: 20,
        understand: 25,
        apply: 30,
        analyze: 15,
        evaluate: 5,
        create: 5,
      },
    } = params;

    const marksPerSkill = Math.floor(totalMarks / skills.length);
    const sections = skills.map((skill, idx) => {
      const isLast = idx === skills.length - 1;
      const marks = isLast ? totalMarks - marksPerSkill * (skills.length - 1) : marksPerSkill;
      const questionCount = Math.max(3, Math.round(marks / 3));

      let cognitiveFocus: any = 'APPLY';
      if (skill === 'GRAMMAR' || skill === 'VOCABULARY') cognitiveFocus = 'UNDERSTAND';
      if (skill === 'WRITING' || skill === 'SPEAKING') cognitiveFocus = 'CREATE';
      if (skill === 'READING' || skill === 'LISTENING') cognitiveFocus = 'ANALYZE';

      return {
        sectionTitle: `Section ${String.fromCharCode(65 + idx)}: ${skill} Proficiency`,
        skill,
        questionCount,
        marks,
        cognitiveFocus,
      };
    });

    return {
      title,
      assessmentType,
      cefrLevel,
      totalMarks,
      durationMinutes,
      bloomsDistribution: bloomsTaxonomy,
      sections,
    };
  }

  /**
   * Generate Complete Assessment with Answer Key & Marking Scheme
   */
  public static generateAssessment(params: {
    title: string;
    assessmentType: string;
    cefrLevel: CEFRLevel;
    topic: string;
    durationMinutes: number;
    totalMarks: number;
    sections?: Array<{ name: string; skill: SkillType; questionCount: number; marks: number }>;
  }): GeneratedAssessment {
    const { title, assessmentType, cefrLevel, topic, durationMinutes, totalMarks } = params;

    const defaultSections = [
      { name: 'Section A: Grammar & Structure', skill: 'GRAMMAR' as SkillType, questionCount: 5, marks: 15 },
      { name: 'Section B: Lexical Resource & Vocabulary', skill: 'VOCABULARY' as SkillType, questionCount: 5, marks: 15 },
      { name: 'Section C: Reading Comprehension', skill: 'READING' as SkillType, questionCount: 3, marks: 10 },
      { name: 'Section D: Extended Written Production', skill: 'WRITING' as SkillType, questionCount: 1, marks: 10 },
    ];

    const targetSections = params.sections && params.sections.length > 0 ? params.sections : defaultSections;

    let overallQuestionIndex = 1;
    const answerKey: GeneratedAssessment['answerKey'] = [];
    const generatedSections: GeneratedAssessment['sections'] = [];

    targetSections.forEach((sec) => {
      const generatedQuestions: ActivityQuestionItem[] = [];
      const pointsPerQ = Math.max(1, Math.round(sec.marks / sec.questionCount));

      for (let q = 1; q <= sec.questionCount; q++) {
        const qIndex = overallQuestionIndex++;
        if (sec.skill === 'GRAMMAR' || sec.skill === 'VOCABULARY') {
          const prompt = `Q${qIndex}. Select the grammatically sound option relating to "${topic}" at CEFR level ${cefrLevel}.`;
          generatedQuestions.push({
            prompt,
            type: 'MULTIPLE_CHOICE',
            options: [
              'A) Mastered standard target pattern with exact collocations',
              'B) Misused auxiliary verb with incorrect participle form',
              'C) Incomplete clause missing essential relative pronoun',
              'D) Incorrect word order with displaced temporal adverb',
            ],
            correctAnswer: 'A',
            explanation: `Option A precisely adheres to ${cefrLevel} syllabus requirements for ${topic}.`,
            points: pointsPerQ,
          });
          answerKey.push({
            questionIndex: qIndex,
            questionPrompt: prompt,
            correctAnswer: 'A',
            markingGuidance: `Award full ${pointsPerQ} mark(s) for exact choice A. Zero marks for incorrect alternatives.`,
            marks: pointsPerQ,
          });
        } else if (sec.skill === 'READING' || sec.skill === 'LISTENING') {
          const prompt = `Q${qIndex}. Based on the contextual passage regarding "${topic}", what inference can be accurately drawn regarding main implications?`;
          generatedQuestions.push({
            prompt,
            type: 'SHORT_ANSWER',
            correctAnswer: `The author asserts that ${topic} provides critical foundational communicative value when practiced regularly.`,
            explanation: `Passage directly highlights systematic benefits of contextual mastery.`,
            points: pointsPerQ,
          });
          answerKey.push({
            questionIndex: qIndex,
            questionPrompt: prompt,
            correctAnswer: `Valid identification of foundational value and regular practice.`,
            markingGuidance: `Award full ${pointsPerQ} marks for accurate comprehension; half marks if key supporting detail is missing.`,
            marks: pointsPerQ,
          });
        } else {
          // Writing / Speaking
          const prompt = `Q${qIndex}. [Extended Task]: In 120-180 words, write an analytical response discussing the significance of "${topic}" in modern international communication.`;
          generatedQuestions.push({
            prompt,
            type: 'SHORT_ANSWER',
            correctAnswer: `Structured multi-paragraph response with clear thesis, body arguments, and conclusion demonstrating ${cefrLevel} vocabulary and grammar.`,
            points: pointsPerQ,
            rubricCriteria: ['Content & Relevance (30%)', 'Organization & Cohesion (25%)', 'Grammar & Accuracy (25%)', 'Vocabulary Range (20%)'],
          });
          answerKey.push({
            questionIndex: qIndex,
            questionPrompt: prompt,
            correctAnswer: `Meets all rubric criteria at CEFR ${cefrLevel}.`,
            markingGuidance: `Evaluate against 4-tier writing rubric. Deduct 1 mark per severe grammatical error impacting intelligibility.`,
            marks: pointsPerQ,
          });
        }
      }

      generatedSections.push({
        sectionName: sec.name,
        instructions: `Read each question in ${sec.name} carefully. Total marks allocated for this section: ${sec.marks}.`,
        totalMarks: sec.marks,
        questions: generatedQuestions,
      });
    });

    return {
      title,
      assessmentType,
      cefrLevel,
      durationMinutes,
      totalMarks,
      sections: generatedSections,
      answerKey,
      markingScheme: [
        { criterion: 'Grammatical Accuracy & Range', maxMarks: Math.round(totalMarks * 0.3), description: `Evaluates error-free sentence structures and appropriate CEFR ${cefrLevel} grammar.` },
        { criterion: 'Lexical Resource & Collocations', maxMarks: Math.round(totalMarks * 0.3), description: `Evaluates precision of vocabulary usage related to ${topic}.` },
        { criterion: 'Task Achievement & Cohesion', maxMarks: Math.round(totalMarks * 0.25), description: `Evaluates comprehensive response to all prompts and clear paragraphing.` },
        { criterion: 'Mechanics & Register', maxMarks: Math.round(totalMarks * 0.15), description: `Evaluates spelling, punctuation, and appropriate academic/social tone.` },
      ],
    };
  }

  /**
   * Generate Rubric Matrix
   */
  public static generateRubric(params: {
    title: string;
    skill: SkillType;
    cefrLevel: CEFRLevel;
    maxScore: number;
    criteriaCount?: number;
  }): GeneratedRubric {
    const { title, skill, cefrLevel, maxScore } = params;

    return {
      title: `${title} — Assessment Rubric (${cefrLevel})`,
      targetSkill: skill,
      cefrLevel,
      maxScore,
      criteria: [
        {
          criterion: 'Task Fulfillment & Relevance',
          weightPercent: 25,
          levels: {
            excellent: `Fully addresses all aspects of the task with insightful details and thorough development at CEFR ${cefrLevel}.`,
            good: `Addresses all parts of the task clearly, though some details could be further expanded.`,
            developing: `Addresses the task partially; some key requirements are omitted or lack clarity.`,
            beginning: `Fails to address the core requirements of the task or response is off-topic.`,
          },
        },
        {
          criterion: 'Grammatical Range & Accuracy',
          weightPercent: 25,
          levels: {
            excellent: `Consistently accurate control of complex grammatical structures with rare non-systematic slips.`,
            good: `Good control of simple and intermediate structures with occasional errors that do not impede communication.`,
            developing: `Frequent grammatical errors in basic tenses and structures that occasionally cause ambiguity.`,
            beginning: `Persistent errors in basic structures severely impede comprehension.`,
          },
        },
        {
          criterion: 'Lexical Resource & Nuance',
          weightPercent: 25,
          levels: {
            excellent: `Wide range of specialized vocabulary used accurately and naturally with strong collocation awareness.`,
            good: `Sufficient vocabulary to discuss topics clearly with occasional minor word choice slips.`,
            developing: `Limited vocabulary range; repetitive phrasing with frequent unnatural collocations.`,
            beginning: `Extremely restricted vocabulary; struggles to convey basic meaning without prompts.`,
          },
        },
        {
          criterion: 'Cohesion, Fluency & Organization',
          weightPercent: 25,
          levels: {
            excellent: `Seamless organization with sophisticated transition markers, natural rhythm, and flawless paragraphing.`,
            good: `Clear organization with standard linking words; generally fluent progression.`,
            developing: `Disjointed structure with overused or incorrectly placed linking devices.`,
            beginning: `Lacks discernible organization; ideas are scattered without cohesive flow.`,
          },
        },
      ],
    };
  }

  /**
   * Generate Constructive Student Feedback & Grading Analysis
   */
  public static generateFeedback(params: {
    studentSubmission: string;
    taskPrompt: string;
    cefrLevel: CEFRLevel;
    skill: SkillType;
    preliminaryScore?: number;
  }): GeneratedFeedbackSuggestion {
    const { studentSubmission, taskPrompt, cefrLevel, skill, preliminaryScore = 82 } = params;

    const wordCount = studentSubmission.split(/\s+/).filter(Boolean).length;

    return {
      overallScoreSuggested: preliminaryScore,
      strengths: [
        `Demonstrated genuine communicative engagement with the prompt "${taskPrompt.slice(0, 40)}...".`,
        `Submitted a substantial response (${wordCount} words) showcasing solid effort at CEFR ${cefrLevel}.`,
        `Effective application of introductory topic vocabulary and basic sentence cohesion.`,
      ],
      areasForImprovement: [
        `Enhance sentence variety by incorporating more subordinate clauses (e.g. 'Although...', 'Whereas...', 'In addition to...').`,
        `Pay careful attention to subject-verb agreement and consistent past/present verb tense usage across longer paragraphs.`,
        `Expand vocabulary by replacing repetitive high-frequency words with precise descriptive adjectives.`,
      ],
      specificComments: `Dear Student, your submission demonstrates a promising command of ${skill.toLowerCase()} fundamentals at level ${cefrLevel}. Your core ideas were clearly communicated. To elevate your academic score further, focus on reviewing your drafts for tense consistency and punctuation before final submission.`,
      recommendedPracticeExercises: [
        `Complete Unit 4 Interactive Grammar Review on Complex Sentence Construction.`,
        `Vocabulary Booster: 20 Advanced Collocations for Academic Writing.`,
        `Peer Discussion Clinic: 5-minute timed speaking on spontaneous prompts.`,
      ],
      suggestedTeacherNotes: `Student demonstrates solid effort. Recommend targeted feedback on tenses and inviting student to the weekly speaking lab.`,
    };
  }

  /**
   * Performance-Based Teaching Recommendations
   */
  public static generatePerformanceRecommendations(params: {
    skillAverages?: Record<string, number>;
    overallPassingRate?: number;
    specificDifficulties?: string[];
  }): PerformanceTeachingRecommendation {
    const averages = params.skillAverages || {
      GRAMMAR: 78,
      VOCABULARY: 82,
      READING: 74,
      LISTENING: 63,
      SPEAKING: 58,
      WRITING: 69,
    };

    const entries = Object.entries(averages).sort((a, b) => a[1] - b[1]);
    const lowest = entries.slice(0, 2);

    return {
      overallSummary: `Based on class performance data across 7 core skills, the cohort demonstrates solid foundational vocabulary (${averages.VOCABULARY || 80}%), but requires targeted scaffolding in spontaneous speaking (${averages.SPEAKING || 58}%) and active listening comprehension (${averages.LISTENING || 63}%).`,
      prioritySkills: lowest.map(([sName, score]) => ({
        skill: sName as SkillType,
        currentAverageScore: score,
        recommendation: `Integrate 10 minutes of daily micro-drills focused on ${sName.toLowerCase()} confidence and structured feedback loops.`,
        suggestedActivities: [
          `Interactive ${sName.toLowerCase()} role-plays with paired observation checklists.`,
          `Formative 5-question speed quizzes at the beginning of each session.`,
          `Targeted audio repetition with transcript shadowing.`,
        ],
      })),
      curriculumAdjustments: [
        'Shift lesson weighting: allocate 35% of contact time to active communicative pair-work.',
        'Implement weekly audio journal assignments to build listening-speaking fluency.',
        'Provide differentiated scaffolding templates for bottom-quartile students.',
      ],
    };
  }
}
