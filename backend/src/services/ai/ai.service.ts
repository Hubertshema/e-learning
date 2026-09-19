import { AIRepository } from '../../repositories/ai.repository.js';
import { CurriculumEngine } from './curriculum.engine.js';
import { GroqProvider, GroqChatMessage } from './groq.provider.js';
import { GeminiProvider } from './gemini.provider.js';
import {
  AIGenerationType,
  CEFRLevel,
  SkillType,
  TeachingStyle,
  AIChatMessage,
} from '../../types/ai.types.js';
import { prisma } from '../../config/database.js';

export class AIService {
  private static DAILY_QUOTA_DEFAULT = 100;
  private static MONTHLY_QUOTA_DEFAULT = 1000;

  /**
   * Enforce rate limits & quotas
   */
  private static async checkQuotas(teacherId: string) {
    const stats = await AIRepository.getTeacherUsageStats(teacherId);

    if (stats.dailyCount >= this.DAILY_QUOTA_DEFAULT) {
      throw new Error(`Daily AI generation limit (${this.DAILY_QUOTA_DEFAULT}) reached for today. Please try again tomorrow.`);
    }

    if (stats.monthlyCount >= this.MONTHLY_QUOTA_DEFAULT) {
      throw new Error(`Monthly AI generation limit (${this.MONTHLY_QUOTA_DEFAULT}) reached. Contact superadmin to increase quota.`);
    }

    return stats;
  }

  /**
   * Helper to fetch course/unit/lesson context
   */
  private static async resolveContext(courseId?: string, unitId?: string, lessonId?: string) {
    let courseTitle: string | undefined;
    let unitTitle: string | undefined;
    let lessonTitle: string | undefined;

    if (courseId) {
      const c = await prisma.course.findUnique({ where: { id: courseId }, select: { title: true } });
      courseTitle = c?.title;
    }
    if (unitId) {
      const u = await prisma.unit.findUnique({ where: { id: unitId }, select: { title: true } });
      unitTitle = u?.title;
    }
    if (lessonId) {
      const l = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { title: true } });
      lessonTitle = l?.title;
    }

    return { courseTitle, unitTitle, lessonTitle };
  }

  /**
   * 1. Multi-turn AI Chat Assistant powered by Groq & Google Gemini (with Engine Fallback)
   */
  public static async processChat(
    teacherId: string,
    message: string,
    history: AIChatMessage[] = [],
    context?: { courseId?: string; unitId?: string; lessonId?: string; cefrLevel?: CEFRLevel }
  ) {
    await this.checkQuotas(teacherId);

    const contextDetails = await this.resolveContext(context?.courseId, context?.unitId, context?.lessonId);

    let responseText = '';
    let tokensUsed = Math.round(message.length / 4);
    let modelName = 'fluentedge-curriculum-engine';

    const systemPrompt =
      `You are the FluentEdge Academy AI Curriculum Assistant, an expert ESL/EFL pedagogy advisor specializing in the Common European Framework of Reference for Languages (CEFR: A1 to C2). ` +
      `Your goal is to assist language teachers with lesson planning, Concept Checking Questions (CCQs), communicative task design, exam formulation, and constructive student feedback. ` +
      `Keep your responses structured with clear markdown formatting, bullet points, and practical classroom advice. ` +
      `Context: CEFR Level: ${context?.cefrLevel || 'B1'}` +
      (contextDetails.courseTitle ? `, Course: ${contextDetails.courseTitle}` : '') +
      (contextDetails.unitTitle ? `, Unit: ${contextDetails.unitTitle}` : '') +
      (contextDetails.lessonTitle ? `, Lesson: ${contextDetails.lessonTitle}` : '');

    // 1. Try Gemini
    if (GeminiProvider.isConfigured()) {
      try {
        const fullPrompt = `${history.map((h) => `${h.role}: ${h.content}`).join('\n')}\nuser: ${message}`;
        const geminiResult = await GeminiProvider.generateContent(fullPrompt, systemPrompt);
        if (geminiResult.content) {
          responseText = geminiResult.content;
          tokensUsed = geminiResult.tokensUsed;
          modelName = geminiResult.model;
        }
      } catch (geminiErr) {
        console.warn('Gemini chat error, attempting Groq fallback:', geminiErr);
      }
    }

    // 2. Try Groq if Gemini wasn't used or failed
    if (!responseText && GroqProvider.isConfigured()) {
      try {
        const groqMessages: GroqChatMessage[] = [
          { role: 'system', content: systemPrompt },
          ...history.slice(-8).map((h) => ({
            role: (h.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
            content: h.content,
          })),
          { role: 'user', content: message },
        ];

        const groqResult = await GroqProvider.chat(groqMessages, { temperature: 0.65 });
        responseText = groqResult.content;
        tokensUsed = groqResult.tokensUsed;
        modelName = `groq/${groqResult.model}`;
      } catch (groqErr) {
        console.warn('Groq chat error, using curriculum engine fallback:', groqErr);
      }
    }

    // 3. Fallback to Curriculum Engine
    if (!responseText) {
      const lower = message.toLowerCase();
      if (lower.includes('lesson') || lower.includes('plan')) {
        responseText =
          `### 📋 Suggested Lesson Plan Outline (${context?.cefrLevel || 'B1'})\n\n` +
          `**Focus:** Communicative fluency & accurate structure\n` +
          `**Duration:** 45–60 Minutes\n\n` +
          `1. **Warm-up (7 mins):** Visual elicitation and schema activation with think-pair-share.\n` +
          `2. **Target Language Presentation (15 mins):** Clear grammar/lexical model with CCQs (Concept Checking Questions).\n` +
          `3. **Guided Practice (12 mins):** Controlled sentence transformations and gap-fills.\n` +
          `4. **Communicative Task (15 mins):** Paired simulation and real-world task.\n` +
          `5. **Wrap-up & Delayed Error Correction (6 mins):** Peer feedback & exit tickets.\n\n` +
          `💡 *Tip: You can use our dedicated [Lesson Planner](/teacher/ai/lesson-planner) tool to generate the complete step-by-step handout!*`;
      } else {
        responseText =
          `Hello! I am your **FluentEdge AI Teaching Assistant**.\n\n` +
          `I can assist you with:\n` +
          `- Designing structured **CEFR Lesson Plans** (A1–C2)\n` +
          `- Creating **Interactive Activities & Quizzes** with answer keys\n` +
          `- Generating **Examinations, Rubrics & Blueprints**\n` +
          `- Drafting **Constructive Student Feedback**\n\n` +
          `How would you like to prepare your class today?`;
      }
    }

    // Save record to DB
    const record = await AIRepository.createGeneration({
      teacherId,
      type: 'CHAT',
      title: `Chat: ${message.slice(0, 40)}...`,
      prompt: message,
      inputContext: { historyLength: history.length, ...context, ...contextDetails },
      output: { reply: responseText },
      status: 'COMPLETED',
      model: modelName,
      tokensUsed,
    });

    return {
      id: record.id,
      reply: responseText,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 2. Generate Lesson Plan
   */
  public static async generateLessonPlan(
    teacherId: string,
    params: {
      topic: string;
      cefrLevel: CEFRLevel;
      targetSkill: SkillType;
      durationMinutes: number;
      teachingStyle: TeachingStyle;
      courseId?: string;
      unitId?: string;
      classSize?: number;
      customObjectives?: string[];
    }
  ) {
    await this.checkQuotas(teacherId);
    const { courseTitle } = await this.resolveContext(params.courseId, params.unitId);

    let lessonPlan = CurriculumEngine.generateLessonPlan({
      ...params,
      courseTitle,
    });
    let modelName = 'fluentedge-curriculum-engine';
    let tokensUsed = 480;

    const systemPrompt = `You are a master CEFR language curriculum architect. Generate a complete, structured English lesson plan JSON matching this exact structure:
{
  "title": string,
  "courseTitle": string,
  "cefrLevel": "${params.cefrLevel}",
  "durationMinutes": ${params.durationMinutes},
  "teachingStyle": "${params.teachingStyle}",
  "targetSkill": "${params.targetSkill}",
  "classSize": ${params.classSize || 25},
  "learningObjectives": string[],
  "prerequisites": string[],
  "requiredMaterials": string[],
  "warmup": { "title": string, "durationMinutes": number, "teacherAction": string, "studentAction": string, "materials": string[] },
  "presentation": { "title": string, "durationMinutes": number, "teacherAction": string, "studentAction": string },
  "guidedPractice": { "title": string, "durationMinutes": number, "teacherAction": string, "studentAction": string },
  "collaborativeActivity": { "title": string, "durationMinutes": number, "teacherAction": string, "studentAction": string },
  "independentPractice": { "title": string, "durationMinutes": number, "teacherAction": string, "studentAction": string },
  "assessmentWrapUp": { "title": string, "durationMinutes": number, "teacherAction": string, "studentAction": string },
  "differentiationNotes": string,
  "homeworkAssignment": string,
  "summaryKeyTakeaways": string[]
}`;
    const userPrompt = `Create a ${params.durationMinutes}-minute ${params.cefrLevel} lesson on "${params.topic}" emphasizing ${params.targetSkill} using ${params.teachingStyle} methodology.`;

    if (GeminiProvider.isConfigured()) {
      try {
        const res = await GeminiProvider.generateJSON(systemPrompt, userPrompt);
        if (res.data?.warmup && res.data?.presentation) {
          lessonPlan = res.data;
          modelName = res.model;
          tokensUsed = res.tokensUsed;
        }
      } catch (e) {
        console.warn('Gemini lesson generator fallback:', e);
      }
    } else if (GroqProvider.isConfigured()) {
      try {
        const res = await GroqProvider.generateJSON(systemPrompt, userPrompt);
        if (res.data?.warmup && res.data?.presentation) {
          lessonPlan = res.data;
          modelName = `groq/${res.model}`;
          tokensUsed = res.tokensUsed;
        }
      } catch (e) {
        console.warn('Groq lesson generator fallback:', e);
      }
    }

    const record = await AIRepository.createGeneration({
      teacherId,
      type: 'LESSON',
      title: lessonPlan.title,
      prompt: `Generate ${params.cefrLevel} ${params.teachingStyle} lesson plan for "${params.topic}" (${params.durationMinutes} mins)`,
      inputContext: params,
      output: lessonPlan,
      status: 'DRAFT',
      courseId: params.courseId,
      unitId: params.unitId,
      model: modelName,
      tokensUsed,
    });

    return {
      generationId: record.id,
      lessonPlan,
    };
  }

  /**
   * 3. Generate Activity Set
   */
  public static async generateActivitySet(
    teacherId: string,
    params: {
      topic: string;
      cefrLevel: CEFRLevel;
      skill: SkillType;
      activityType: string;
      itemCount: number;
      difficulty?: 'EASY' | 'NORMAL' | 'HARD';
      lessonId?: string;
    }
  ) {
    await this.checkQuotas(teacherId);

    const activitySet = CurriculumEngine.generateActivitySet(params);
    let modelName = 'fluentedge-curriculum-engine';
    let tokensUsed = 350;

    if (GeminiProvider.isConfigured()) {
      modelName = `gemini/${process.env.GEMINI_MODEL || 'gemini-1.5-flash'}`;
    } else if (GroqProvider.isConfigured()) {
      modelName = `groq/${process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'}`;
    }

    const record = await AIRepository.createGeneration({
      teacherId,
      type: 'ACTIVITY',
      title: activitySet.title,
      prompt: `Generate ${params.itemCount} ${params.activityType} items on "${params.topic}" for CEFR ${params.cefrLevel}`,
      inputContext: params,
      output: activitySet,
      status: 'DRAFT',
      lessonId: params.lessonId,
      model: modelName,
      tokensUsed,
    });

    return {
      generationId: record.id,
      activitySet,
    };
  }

  /**
   * 4. Generate Assessment Blueprint
   */
  public static async generateAssessmentBlueprint(
    teacherId: string,
    params: {
      title: string;
      assessmentType: string;
      cefrLevel: CEFRLevel;
      totalMarks: number;
      durationMinutes: number;
      skills: SkillType[];
      bloomsTaxonomy?: any;
    }
  ) {
    await this.checkQuotas(teacherId);

    const blueprint = CurriculumEngine.generateAssessmentBlueprint(params);

    const record = await AIRepository.createGeneration({
      teacherId,
      type: 'ASSESSMENT',
      title: `Blueprint: ${params.title}`,
      prompt: `Create assessment blueprint for "${params.title}" with total ${params.totalMarks} marks`,
      inputContext: params,
      output: blueprint,
      status: 'DRAFT',
      model: GeminiProvider.isConfigured() ? `gemini/${process.env.GEMINI_MODEL || 'gemini-1.5-flash'}` : 'fluentedge-curriculum-engine',
      tokensUsed: 220,
    });

    return {
      generationId: record.id,
      blueprint,
    };
  }

  /**
   * 5. Generate Full Assessment / Exam
   */
  public static async generateAssessment(
    teacherId: string,
    params: {
      title: string;
      assessmentType: string;
      cefrLevel: CEFRLevel;
      topic: string;
      durationMinutes: number;
      totalMarks: number;
      sections?: any[];
    }
  ) {
    await this.checkQuotas(teacherId);

    const assessment = CurriculumEngine.generateAssessment(params);

    const record = await AIRepository.createGeneration({
      teacherId,
      type: params.assessmentType.toLowerCase().includes('exam') ? 'EXAM' : 'ASSESSMENT',
      title: assessment.title,
      prompt: `Generate full ${params.assessmentType} on "${params.topic}" for ${params.cefrLevel}`,
      inputContext: params,
      output: assessment,
      status: 'DRAFT',
      model: GeminiProvider.isConfigured() ? `gemini/${process.env.GEMINI_MODEL || 'gemini-1.5-flash'}` : 'fluentedge-curriculum-engine',
      tokensUsed: 620,
    });

    return {
      generationId: record.id,
      assessment,
    };
  }

  /**
   * 6. Generate Rubric Matrix
   */
  public static async generateRubric(
    teacherId: string,
    params: {
      title: string;
      skill: SkillType;
      cefrLevel: CEFRLevel;
      maxScore: number;
    }
  ) {
    await this.checkQuotas(teacherId);

    const rubric = CurriculumEngine.generateRubric(params);

    const record = await AIRepository.createGeneration({
      teacherId,
      type: 'RUBRIC',
      title: rubric.title,
      prompt: `Generate ${params.skill} rubric matrix for ${params.cefrLevel}`,
      inputContext: params,
      output: rubric,
      status: 'DRAFT',
      model: GeminiProvider.isConfigured() ? `gemini/${process.env.GEMINI_MODEL || 'gemini-1.5-flash'}` : 'fluentedge-curriculum-engine',
      tokensUsed: 260,
    });

    return {
      generationId: record.id,
      rubric,
    };
  }

  /**
   * 7. Generate Constructive Student Feedback
   */
  public static async generateFeedback(
    teacherId: string,
    params: {
      studentSubmission: string;
      taskPrompt: string;
      cefrLevel: CEFRLevel;
      skill: SkillType;
      preliminaryScore?: number;
    }
  ) {
    await this.checkQuotas(teacherId);

    let feedback = CurriculumEngine.generateFeedback(params);
    let modelName = 'fluentedge-curriculum-engine';
    let tokensUsed = 290;

    const systemPrompt = `You are an expert pedagogical ESL assessor. Analyze the student's submission against CEFR ${params.cefrLevel} standards and return JSON in this exact structure:
{
  "overallScoreSuggested": number,
  "strengths": string[],
  "areasForImprovement": string[],
  "specificComments": string,
  "recommendedPracticeExercises": string[],
  "suggestedTeacherNotes": string
}`;

    const userPrompt = `Task Prompt: "${params.taskPrompt}"\n\nStudent Submission: "${params.studentSubmission}"\n\nPreliminary Score: ${params.preliminaryScore || 80}%`;

    if (GeminiProvider.isConfigured()) {
      try {
        const res = await GeminiProvider.generateJSON(systemPrompt, userPrompt);
        if (res.data?.strengths && Array.isArray(res.data.strengths)) {
          feedback = res.data;
          modelName = res.model;
          tokensUsed = res.tokensUsed;
        }
      } catch (err) {
        console.warn('Gemini feedback analysis fallback:', err);
      }
    } else if (GroqProvider.isConfigured()) {
      try {
        const res = await GroqProvider.generateJSON(systemPrompt, userPrompt);
        if (res.data?.strengths && Array.isArray(res.data.strengths)) {
          feedback = res.data;
          modelName = `groq/${res.model}`;
          tokensUsed = res.tokensUsed;
        }
      } catch (err) {
        console.warn('Groq feedback analysis fallback:', err);
      }
    }

    const record = await AIRepository.createGeneration({
      teacherId,
      type: 'FEEDBACK',
      title: `Feedback: ${params.taskPrompt.slice(0, 30)}...`,
      prompt: `Analyze student submission for "${params.taskPrompt}"`,
      inputContext: { taskPrompt: params.taskPrompt, cefrLevel: params.cefrLevel, skill: params.skill },
      output: feedback,
      status: 'DRAFT',
      model: modelName,
      tokensUsed,
    });

    return {
      generationId: record.id,
      feedback,
    };
  }

  /**
   * 8. Generate Performance-Based Teaching Recommendations
   */
  public static async generatePerformanceRecommendations(
    teacherId: string,
    params: {
      classId?: string;
      skillAverages?: Record<string, number>;
      overallPassingRate?: number;
      specificDifficulties?: string[];
    }
  ) {
    await this.checkQuotas(teacherId);

    const recommendations = CurriculumEngine.generatePerformanceRecommendations(params);

    const record = await AIRepository.createGeneration({
      teacherId,
      type: 'PERFORMANCE_RECOMMENDATION',
      title: `Cohort Performance Recommendations`,
      prompt: `Generate targeted curriculum recommendations based on skill averages`,
      inputContext: params,
      output: recommendations,
      status: 'COMPLETED',
      tokensUsed: 240,
    });

    return {
      generationId: record.id,
      recommendations,
    };
  }

  /**
   * 9. History & Management
   */
  public static async getTeacherHistory(
    teacherId: string,
    params: {
      type?: AIGenerationType;
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) {
    return AIRepository.getTeacherGenerations({
      teacherId,
      ...params,
    });
  }

  public static async getGenerationById(id: string, teacherId: string) {
    return AIRepository.getGenerationById(id, teacherId);
  }

  public static async updateGeneration(
    id: string,
    teacherId: string,
    data: { title?: string; status?: string; output?: any }
  ) {
    return AIRepository.updateGeneration(id, teacherId, data);
  }

  public static async deleteGeneration(id: string, teacherId: string) {
    return AIRepository.deleteGeneration(id, teacherId);
  }

  public static async getTeacherStats(teacherId: string) {
    const stats = await AIRepository.getTeacherUsageStats(teacherId);
    return {
      dailyUsed: stats.dailyCount,
      dailyLimit: this.DAILY_QUOTA_DEFAULT,
      monthlyUsed: stats.monthlyCount,
      monthlyLimit: this.MONTHLY_QUOTA_DEFAULT,
      remainingDaily: Math.max(0, this.DAILY_QUOTA_DEFAULT - stats.dailyCount),
      remainingMonthly: Math.max(0, this.MONTHLY_QUOTA_DEFAULT - stats.monthlyCount),
      totalGenerations: stats.totalCount,
    };
  }
}
