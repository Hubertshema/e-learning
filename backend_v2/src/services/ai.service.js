import crypto from 'crypto';
import { query } from '../config/database.js';
import { env } from '../config/env.js';

export class AIService {
  /**
   * Draft clean HTML lesson content for TinyMCE
   */
  static async draftLessonContent(teacherId, { prompt, title = '', cefrLevel = 'B1', skills = [] }) {
    const skillsStr = skills && skills.length > 0 ? skills.join(', ') : 'Grammar, Speaking, Vocabulary';

    const systemPrompt =
      `You are an elite Cambridge & Oxford accredited English Language Professor and master curriculum designer for FluentEdge Academy. ` +
      `Your mission is to generate a comprehensive, highly detailed, real-world English lesson in clean HTML format designed directly for display and editing in a TinyMCE rich text editor. ` +
      `Target CEFR Level: ${cefrLevel}. Target Skills: ${skillsStr}. ` +
      `Topic / Focus: "${prompt}". ` +
      `\nCRITICAL PEDAGOGICAL REQUIREMENTS: ` +
      `Generate fully fleshed out, substantive, educational content with NO placeholders, NO generic filler, and NO brevity. Every section must contain genuine, realistic linguistic material. ` +
      `\nThe HTML document must strictly include: ` +
      `1. On the very first line: <!--TITLE: Concise, Inspiring & Professional Lesson Title--> ` +
      `2. <h2>1. Learning Objectives & Can-Do Descriptors</h2>: A bulleted list (<ul><li>) of 3-4 specific linguistic outcomes aligned with CEFR ${cefrLevel}. ` +
      `3. <h2>2. High-Register Vocabulary & Idiomatic Collocations</h2>: A comprehensive HTML <table> with <thead><tr><th>Expression / Collocation</th><th>Register & Nuance</th><th>Meaning & Pragmatic Function</th><th>Authentic Example</th></tr></thead> and at least 5-6 rich rows in <tbody>. ` +
      `4. <h2>3. Core Linguistic Patterns & Pragmatic Strategies</h2>: In-depth explanations of grammatical and conversational conventions with sample sentences in <strong> tags and pedagogical advice inside <blockquote><strong>Teacher Pedagogy Tip:</strong> ...</blockquote>. ` +
      `5. <h2>4. Authentic Situational Dialogue</h2>: A realistic, multi-turn conversation between realistic participants (e.g. <p><strong>Agent / Officer:</strong> ...</p><p><strong>Passenger / Learner:</strong> ...</p>) demonstrating the target vocabulary in action. ` +
      `6. <h2>5. Practical Application Drills & Role-Play</h2>: Specific exercises including numbered questions (<ol><li>) for sentence completion, error analysis, and roleplay challenge, followed by an expandable or clear answer key. ` +
      `\nSTRICT FORMAT RULES: ` +
      `- Return ONLY raw HTML markup. Do NOT wrap in \`\`\`html markdown code blocks. ` +
      `- Do NOT output <html>, <head>, or <body> wrappers. ` +
      `- Use clean HTML semantic tags (<h2>, <p>, <ul>, <ol>, <li>, <table>, <thead>, <tbody>, <tr>, <th>, <td>, <strong>, <em>, <blockquote>).`;

    const userPrompt = `Create an exhaustive, professional CEFR ${cefrLevel} English lesson on: "${prompt}". Include realistic vocabulary, real-world conversations, grammar structures, and interactive drills.`;

    let htmlOutput = '';
    let suggestedTitle = title || '';
    let modelName = 'groq/openai/gpt-oss-120b';
    let tokensUsed = 1200;
    const errors = [];

    // 1. Attempt Groq
    if (process.env.GROQ_API_KEY) {
      const candidateModels = [
        process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
        'openai/gpt-oss-120b',
        'openai/gpt-oss-20b',
        'qwen/qwen3.8-27b',
      ];

      for (const m of Array.from(new Set(candidateModels))) {
        try {
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
              model: m,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
              temperature: 0.6,
              max_tokens: 3500,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const content = data?.choices?.[0]?.message?.content || '';
            if (content.trim().length > 100) {
              htmlOutput = content;
              modelName = `groq/${m}`;
              tokensUsed = (data?.usage?.prompt_tokens || 0) + (data?.usage?.completion_tokens || 0);
              break;
            }
          } else {
            const errData = await res.json().catch(() => ({}));
            errors.push(`Groq (${m}): ${errData?.error?.message || res.statusText}`);
          }
        } catch (err) {
          errors.push(`Groq (${m}): ${err.message}`);
        }
      }
    }

    // 2. Attempt Gemini fallback
    if (!htmlOutput && process.env.GEMINI_API_KEY) {
      const geminiModels = [process.env.GEMINI_MODEL || 'gemini-3.6-flash', 'gemini-3.6-flash', 'gemini-flash-latest'];
      for (const gm of Array.from(new Set(geminiModels))) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${gm}:generateContent?key=${process.env.GEMINI_API_KEY}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: userPrompt }] }],
              systemInstruction: { parts: [{ text: systemPrompt }] },
              generationConfig: { temperature: 0.6 },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (content.trim().length > 100) {
              htmlOutput = content;
              modelName = `gemini/${gm}`;
              tokensUsed = data?.usageMetadata?.totalTokenCount || Math.round((userPrompt.length + content.length) / 4);
              break;
            }
          } else {
            const errData = await res.json().catch(() => ({}));
            errors.push(`Gemini (${gm}): ${errData?.error?.message || res.statusText}`);
          }
        } catch (err) {
          errors.push(`Gemini (${gm}): ${err.message}`);
        }
      }
    }

    if (!htmlOutput) {
      const error = new Error(`AI generation failed. Details: ${errors.join(' | ')}`);
      error.statusCode = 500;
      throw error;
    }

    // Extract title if present in <!--TITLE: ...-->
    const titleMatch = htmlOutput.match(/<!--TITLE:\s*(.*?)-->/);
    if (titleMatch && titleMatch[1]) {
      suggestedTitle = titleMatch[1].trim();
      htmlOutput = htmlOutput.replace(/<!--TITLE:.*?-->/, '').trim();
    }

    htmlOutput = htmlOutput.replace(/^```html\s*/i, '').replace(/\s*```$/, '').trim();

    // Log to ai_generations table using direct SQL
    try {
      const genId = crypto.randomUUID();
      await query(
        `INSERT INTO "public"."ai_generations"
          (id, "teacherId", type, title, prompt, "inputContext", output, status, model, "tokensUsed", "createdAt", "updatedAt")
         VALUES ($1, $2, 'LESSON', $3, $4, $5, $6, 'COMPLETED', $7, $8, NOW(), NOW())`,
        [
          genId,
          teacherId,
          suggestedTitle || `Lesson Draft: ${prompt.slice(0, 40)}`,
          prompt,
          JSON.stringify({ cefrLevel, skills }),
          JSON.stringify({ contentHtml: htmlOutput, title: suggestedTitle }),
          modelName,
          tokensUsed,
        ]
      );
    } catch (logErr) {
      console.warn('Could not log AI generation to database:', logErr.message);
    }

    return {
      title: suggestedTitle || title,
      contentHtml: htmlOutput,
    };
  }

  /**
   * General AI Chat
   */
  static async chat(teacherId, { messages, context }) {
    if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
      throw new Error('No AI provider configured');
    }

    const systemPrompt = `You are FluentEdge AI, an expert pedagogical assistant for English language teachers.`;
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
        messages: formattedMessages,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      throw new Error('Groq chat completion failed');
    }

    const data = await res.json();
    return {
      reply: data?.choices?.[0]?.message?.content || '',
    };
  }

  /**
   * Generate interactive quiz questions using AI
   */
  static async generateQuizQuestions(teacherId, { lessonTitle, cefrLevel = 'B1', topic = '', count = 3 }) {
    if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
      throw new Error('No AI provider configured');
    }

    const systemPrompt =
      `You are an expert Cambridge English Language Professor and assessment designer. ` +
      `Generate ${count} high-quality, CEFR ${cefrLevel} interactive quiz questions for a lesson titled "${lessonTitle}". ` +
      `Focus: "${topic || lessonTitle}". ` +
      `\nFormat Requirements: Return ONLY a valid JSON array of objects with this schema: ` +
      `[ ` +
      `  { ` +
      `    "prompt": "Clear question text?", ` +
      `    "questionType": "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_BLANKS" | "MATCHING" | "ORDERING", ` +
      `    "options": ["Option 1", "Option 2", "Option 3", "Option 4"], ` +
      `    "matchingPairs": [{"id": "1", "leftTerm": "Term", "rightMatch": "Meaning"}], ` +
      `    "jumbledWords": ["word1", "word2"], ` +
      `    "correctAnswer": "Exact correct answer string", ` +
      `    "explanation": "Pedagogical explanation of why this answer is correct", ` +
      `    "points": 10 ` +
      `  } ` +
      `] ` +
      `Include a realistic mix of question types (e.g. MULTIPLE_CHOICE, FILL_BLANKS, MATCHING, ORDERING, TRUE_FALSE). ` +
      `Do NOT wrap in markdown code blocks. Return valid JSON only.`;

    const userPrompt = `Generate ${count} CEFR ${cefrLevel} quiz questions for: "${lessonTitle}".`;

    let rawJson = '';
    if (process.env.GROQ_API_KEY) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.5,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          rawJson = data?.choices?.[0]?.message?.content || '';
        }
      } catch (e) {
        console.warn('Groq quiz generation failed:', e.message);
      }
    }

    if (!rawJson && process.env.GEMINI_API_KEY) {
      try {
        const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${process.env.GEMINI_API_KEY}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
      } catch (e) {
        console.warn('Gemini quiz generation failed:', e.message);
      }
    }

    const cleaned = rawJson.replace(/^```(json)?\s*/i, '').replace(/\s*```$/, '').trim();
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) return parsed;
    } catch {}

    return [];
  }

  /**
   * Helper to execute AI queries across Groq and Gemini with model fallbacks
   */
  static async callAI({ systemPrompt, userPrompt, temperature = 0.6, maxTokens = 4000 }) {
    const errors = [];

    if (process.env.GROQ_API_KEY) {
      const candidateModels = [
        process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
        'openai/gpt-oss-120b',
        'openai/gpt-oss-20b',
        'qwen/qwen3.8-27b',
      ];
      for (const m of Array.from(new Set(candidateModels))) {
        try {
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
              model: m,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
              temperature,
              max_tokens: maxTokens,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            const text = data?.choices?.[0]?.message?.content || '';
            if (text.trim()) {
              return { text: text.trim(), model: `groq/${m}` };
            }
          } else {
            const errData = await res.json().catch(() => ({}));
            errors.push(`Groq (${m}): ${errData?.error?.message || res.statusText}`);
          }
        } catch (e) {
          errors.push(`Groq (${m}): ${e.message}`);
        }
      }
    }

    if (process.env.GEMINI_API_KEY) {
      const geminiModels = [process.env.GEMINI_MODEL || 'gemini-2.0-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      for (const gm of Array.from(new Set(geminiModels))) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${gm}:generateContent?key=${process.env.GEMINI_API_KEY}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: userPrompt }] }],
              systemInstruction: { parts: [{ text: systemPrompt }] },
              generationConfig: { temperature, maxOutputTokens: maxTokens },
            }),
          });
          if (res.ok) {
            const data = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text.trim()) {
              return { text: text.trim(), model: `gemini/${gm}` };
            }
          } else {
            const errData = await res.json().catch(() => ({}));
            errors.push(`Gemini (${gm}): ${errData?.error?.message || res.statusText}`);
          }
        } catch (e) {
          errors.push(`Gemini (${gm}): ${e.message}`);
        }
      }
    }

    throw new Error(`AI generation failed: ${errors.join(' | ') || 'No AI key configured'}`);
  }

  /**
   * Advanced AI Quiz Assistant for English Language Learning
   * Generates comprehensive quizzes from teacher instructions, topic, lesson, or learning materials.
   */
  static async generateAdvancedQuiz(teacherId, {
    instruction = '',
    cefrLevel = 'B1',
    skills = [],
    count = 5,
    questionTypeCounts = {},
    topic = '',
    lessonTitle = '',
    learningMaterial = '',
  }) {
    const skillsList = skills.length > 0
      ? skills.join(', ')
      : 'Grammar, Vocabulary, Reading, Listening, Writing, Conversation';

    const systemPrompt =
      `You are the Chief Assessment Officer and Cambridge/Oxford ELT pedagogical director at FluentEdge English Academy. ` +
      `Your platform is dedicated EXCLUSIVELY to English language learning. ` +
      `You specialize in CEFR-aligned assessments (A1 Beginner to C2 Mastery). ` +
      `\nLinguistic Target Competencies: ` +
      `- CEFR Level: ${cefrLevel} (Strictly calibrate vocabulary difficulty, syntactic complexity, and communicative nuance to this level). ` +
      `- Skills in focus: ${skillsList}. ` +
      `\nSUPPORTED QUESTION TYPES: ` +
      `1. MULTIPLE_CHOICE: Single correct answer among 4 options. ` +
      `2. MULTIPLE_SELECT: 2 or more correct answers among 4-5 options. Correct answer string has pipe-separated values (e.g. "Option A|Option C"). ` +
      `3. TRUE_FALSE: options must be ["True", "False"]. ` +
      `4. FILL_BLANKS: prompt contains "[blank]" where the word belongs. correctAnswer is the exact target word/phrase. ` +
      `5. MATCHING: matchingPairs array with { id, leftTerm, rightMatch }. options: ["left ➔ right", ...]. correctAnswer: "left::right|...". ` +
      `6. ORDERING: correctAnswer is the complete grammatically correct sentence. jumbledWords is an array of scrambled word tokens. ` +
      `7. READING_COMPREHENSION: includes a realistic authentic English text in "passage", followed by a comprehension prompt, options, and correctAnswer. ` +
      `8. LISTENING: includes a realistic spoken English transcript in "audioScript", followed by a listening comprehension prompt, options, and correctAnswer. ` +
      `9. WRITING: communicative writing task (e.g. email, essay, response), with prompt, word count guidance, and model answer/evaluation criteria in "explanation". ` +
      `\nOUTPUT FORMAT: ` +
      `Return ONLY a single valid JSON object with this exact structure: ` +
      `{ ` +
      `  "title": "Concise, professional quiz title", ` +
      `  "description": "Student instructions", ` +
      `  "cefrLevel": "${cefrLevel}", ` +
      `  "timeLimitMinutes": 15, ` +
      `  "passingScore": 70, ` +
      `  "questions": [ ` +
      `    { ` +
      `      "prompt": "Question prompt text", ` +
      `      "questionType": "MULTIPLE_CHOICE" | "MULTIPLE_SELECT" | "TRUE_FALSE" | "FILL_BLANKS" | "MATCHING" | "ORDERING" | "READING_COMPREHENSION" | "LISTENING" | "WRITING", ` +
      `      "passage": "Only for READING_COMPREHENSION (reading passage)", ` +
      `      "audioScript": "Only for LISTENING (spoken dialogue transcript)", ` +
      `      "options": ["A", "B", "C", "D"], ` +
      `      "matchingPairs": [{"id": "1", "leftTerm": "Term", "rightMatch": "Meaning"}], ` +
      `      "jumbledWords": ["word1", "word2"], ` +
      `      "correctAnswer": "Target correct answer", ` +
      `      "explanation": "In-depth pedagogical feedback explaining the grammatical rule or vocabulary meaning.", ` +
      `      "points": 10, ` +
      `      "difficulty": "${cefrLevel}" ` +
      `    } ` +
      `  ] ` +
      `} ` +
      `\nCRITICAL: Do NOT wrap in markdown code blocks (\`\`\`json). Output pure parseable JSON.`;

    let userPrompt = `Teacher Instruction: "${instruction || `Create a CEFR ${cefrLevel} English assessment on ${topic || lessonTitle || 'General English'}`}".\n`;
    if (topic) userPrompt += `Target Topic: ${topic}\n`;
    if (lessonTitle) userPrompt += `Curriculum Lesson: ${lessonTitle}\n`;
    if (count) userPrompt += `Desired Question Count: ${count}\n`;
    if (questionTypeCounts && Object.keys(questionTypeCounts).length > 0) {
      userPrompt += `Question Type Breakdown: ${JSON.stringify(questionTypeCounts)}\n`;
    }
    if (learningMaterial) {
      userPrompt += `\nBase the questions on this uploaded learning material / text:\n"""\n${learningMaterial.slice(0, 4000)}\n"""\n`;
    }

    const { text, model } = await this.callAI({
      systemPrompt,
      userPrompt,
      temperature: 0.5,
      maxTokens: 4000,
    });

    const cleaned = text.replace(/^```(json)?\s*/i, '').replace(/\s*```$/, '').trim();
    let result = null;
    try {
      result = JSON.parse(cleaned);
    } catch (parseErr) {
      // Try extracting json block
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        result = JSON.parse(match[0]);
      } else {
        throw new Error('Failed to parse AI quiz response as JSON');
      }
    }

    // Ensure safe defaults
    const questions = (Array.isArray(result.questions) ? result.questions : []).map((q, idx) => ({
      id: `ai-q-${Date.now()}-${idx}`,
      prompt: q.prompt || 'Question Prompt',
      questionType: q.questionType || 'MULTIPLE_CHOICE',
      passage: q.passage || '',
      audioScript: q.audioScript || '',
      options: Array.isArray(q.options) ? q.options : (q.questionType === 'TRUE_FALSE' ? ['True', 'False'] : []),
      matchingPairs: Array.isArray(q.matchingPairs) ? q.matchingPairs : [],
      jumbledWords: Array.isArray(q.jumbledWords) ? q.jumbledWords : [],
      correctAnswer: q.correctAnswer || '',
      explanation: q.explanation || '',
      points: Number(q.points) || 10,
      difficulty: q.difficulty || cefrLevel,
    }));

    return {
      title: result.title || `Quiz: ${topic || lessonTitle || instruction.slice(0, 35)}`,
      description: result.description || `Assessment designed for CEFR ${cefrLevel} English learners.`,
      cefrLevel: result.cefrLevel || cefrLevel,
      timeLimitMinutes: Number(result.timeLimitMinutes) || Math.max(10, Math.min(60, questions.length * 2)),
      passingScore: Number(result.passingScore) || 70,
      questions,
    };
  }

  /**
   * Per-question AI transformation: Make Easier, Make Harder, Improve, Add Explanation
   */
  static async transformQuestion(teacherId, { question, action, targetLevel, context = '' }) {
    const systemPrompt =
      `You are a master Cambridge English Language educator and assessment expert. ` +
      `Your task is to transform or enhance an English language learning quiz question based on a teacher's action request. ` +
      `\nSupported actions: ` +
      `- MAKE_EASIER: Reduce syntactic complexity, simplify vocabulary, lower CEFR level by 1 grade, make distractors more clearly distinguishable. ` +
      `- MAKE_HARDER: Increase lexical density, add subtle natural distractors, test advanced pragmatic/grammatical nuance, raise CEFR level by 1 grade. ` +
      `- IMPROVE: Enhance clarity, remove ambiguity, balance option lengths, ensure strict Cambridge ELT pedagogical formatting. ` +
      `- ADD_EXPLANATION: Write a comprehensive, learner-friendly grammatical explanation detailing why the correct answer is right, common pitfalls, and why other options are wrong. ` +
      `\nOUTPUT FORMAT: Return ONLY the transformed question as a single JSON object with the exact same structure as the input question. No markdown wrappers.`;

    const userPrompt =
      `Action: ${action}\n` +
      `Target Level: ${targetLevel || question.difficulty || 'B1'}\n` +
      (context ? `Context/Lesson: ${context}\n` : '') +
      `Current Question:\n${JSON.stringify(question, null, 2)}`;

    const { text } = await this.callAI({
      systemPrompt,
      userPrompt,
      temperature: 0.4,
      maxTokens: 1500,
    });

    const cleaned = text.replace(/^```(json)?\s*/i, '').replace(/\s*```$/, '').trim();
    try {
      const parsed = JSON.parse(cleaned);
      return {
        ...question,
        ...parsed,
        id: question.id, // preserve original id
      };
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          ...question,
          ...parsed,
          id: question.id,
        };
      }
      throw new Error('Failed to transform question');
    }
  }

  /**
   * Generate Diagnostic Placement Questions using AI
   * Calibrated for Cambridge English Placement Standards across CEFR levels
   */
  static async generateDiagnosticQuestions(teacherId, {
    instruction = '',
    cefrLevel = 'ALL', // 'ALL' for multi-level ladder or specific 'A1'..'C2'
    skills = [],
    count = 10,
    topic = '',
  }) {
    const skillsList = skills.length > 0
      ? skills.join(', ')
      : 'Grammar, Vocabulary, Contextual Listening, Reading & Syntax, Idiomatic Fluency';

    const validLevels = ['PRE_A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

    const systemPrompt =
      `You are the Chief Diagnostic Assessment Officer at FluentEdge English Academy. ` +
      `Your platform is dedicated EXCLUSIVELY to English language learning and candidate placement. ` +
      `You specialize in CEFR-aligned placement diagnostics (Cambridge English Placement Test style). ` +
      `\nTarget Assessment Parameters: ` +
      `- Level Scope: ${cefrLevel === 'ALL' ? 'Multi-level progressive ladder from PRE_A1/A1 to C1/C2 to determine accurate candidate placement' : `Focused exclusively on CEFR ${cefrLevel}`}. ` +
      `- Skills Tested: ${skillsList}. ` +
      `- Each question MUST strictly evaluate an authentic English language competency. ` +
      `\nVALID CEFR LEVEL VALUES: Exactly one of: ["PRE_A1", "A1", "A2", "B1", "B2", "C1", "C2"]. ` +
      `\nOUTPUT FORMAT: ` +
      `Return ONLY a valid JSON array of question objects with this exact structure: ` +
      `[ ` +
      `  { ` +
      `    "category": "e.g. Grammar & Conditional Structures", ` +
      `    "skill": "Grammar" | "Vocabulary" | "Listening" | "Reading & Syntax" | "Pronunciation" | "Advanced Fluency", ` +
      `    "difficulty": "PRE_A1" | "A1" | "A2" | "B1" | "B2" | "C1" | "C2", ` +
      `    "prompt": "Clear, grammatically rigorous question prompt", ` +
      `    "audioText": "Only for Listening or spoken dialogues: transcript to be read by TTS (or null)", ` +
      `    "options": ["Option A", "Option B", "Option C", "Option D"], ` +
      `    "correctAnswer": "Exact correct string matching one of the options", ` +
      `    "explanation": "Clear academic explanation of why the answer is correct and the linguistic rule applied.", ` +
      `    "orderIndex": 1, ` +
      `    "isActive": true ` +
      `  } ` +
      `] ` +
      `\nCRITICAL: Do NOT wrap in markdown code blocks (\`\`\`json). Output pure parseable JSON.`;

    let userPrompt = `Teacher Diagnostic Instruction: "${instruction || `Generate a ${count}-question placement test covering ${skillsList}`}".\n`;
    if (topic) userPrompt += `Placement Focus / Topic: ${topic}\n`;
    if (cefrLevel !== 'ALL') userPrompt += `Calibrate all questions to CEFR Level: ${cefrLevel}\n`;
    userPrompt += `Number of questions to generate: ${count}\n`;

    const { text } = await this.callAI({
      systemPrompt,
      userPrompt,
      temperature: 0.5,
      maxTokens: 4000,
    });

    const cleaned = text.replace(/^```(json)?\s*/i, '').replace(/\s*```$/, '').trim();
    let questions = [];

    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        questions = parsed;
      } else if (parsed && Array.isArray(parsed.questions)) {
        questions = parsed.questions;
      }
    } catch {
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (match) {
        questions = JSON.parse(match[0]);
      } else {
        throw new Error('Failed to parse AI diagnostic questions as JSON');
      }
    }

    // Normalize and validate
    return questions.map((q, idx) => {
      let level = (q.difficulty || 'B1').toUpperCase().replace('-', '_');
      if (!validLevels.includes(level)) {
        level = 'B1';
      }

      const options = Array.isArray(q.options) && q.options.length >= 2
        ? q.options.map((o) => String(o).trim())
        : ['Option A', 'Option B', 'Option C', 'Option D'];

      let correctAnswer = String(q.correctAnswer || '').trim();
      if (!options.includes(correctAnswer)) {
        correctAnswer = options[0];
      }

      return {
        id: `ai-diag-${Date.now()}-${idx + 1}`,
        category: q.category || 'General Assessment',
        skill: q.skill || 'Grammar',
        difficulty: level,
        prompt: q.prompt || `Diagnostic Question #${idx + 1}`,
        audioText: q.audioText ? String(q.audioText).trim() : null,
        options,
        correctAnswer,
        explanation: q.explanation || 'Pedagogical explanation for this question.',
        orderIndex: Number(q.orderIndex) || idx + 1,
        isActive: true,
      };
    });
  }

  /**
   * Generate a complete assignment (title + rich instructions + rubric) for a given lesson/topic
   */
  static async generateAssignment(teacherId, { skillType = 'WRITING', cefrLevel = 'B1', topic = '', lessonTitle = '', courseTitle = '', instruction = '' }) {
    const systemPrompt =
      `You are an expert CEFR-certified English Language teacher and assessment designer at FluentEdge Academy. ` +
      `Generate a complete, ready-to-publish student assignment for a ${cefrLevel} English class. ` +
      `Skill domain: ${skillType}. Lesson: "${lessonTitle || topic}". Course: "${courseTitle}". ` +
      `Your output must be a single valid JSON object (no markdown, no code blocks) with this exact structure:\n` +
      `{\n` +
      `  "title": "Concise, motivating assignment title (max 80 chars)",\n` +
      `  "description": "<FULL HTML CONTENT — see rules below>",\n` +
      `  "suggestedMaxScore": 100,\n` +
      `  "skillType": "${skillType}"\n` +
      `}\n\n` +
      `DESCRIPTION HTML RULES — The "description" field must be a rich HTML string (NOT Markdown) ready for a TinyMCE editor:\n` +
      `- Use <h2> for major section headings (e.g. Task Overview, Requirements, Rubric)\n` +
      `- Use <h3> for sub-headings\n` +
      `- Use <p> for paragraphs with <strong> for bold terms and <em> for emphasis\n` +
      `- Use <ul><li> for bullet lists and <ol><li> for numbered lists\n` +
      `- Use <blockquote> for teacher tips or important notes\n` +
      `- Include a grading rubric as an HTML <table> with <thead><tr><th> headers and <tbody><tr><td> rows — columns: Criterion | Weight | Excellent | Satisfactory | Needs Work\n` +
      `- DO NOT use markdown syntax (no ##, no **, no |---|, no backticks). Use only clean HTML tags.\n` +
      `- DO NOT wrap in <html>, <head>, or <body> tags.\n` +
      `- Content must be 300-500 words total covering: task description, specific requirements (length, format, vocabulary targets), time guidance, and rubric.\n\n` +
      `STRICT OUTPUT RULE: Return ONLY the raw JSON object. No preamble, no explanation, no markdown fences.`;

    const userPrompt = instruction.trim()
      ? `Create a ${cefrLevel} ${skillType} assignment based on this instruction: "${instruction}". Lesson context: "${lessonTitle || topic}". Return the JSON object with HTML in the description field.`
      : `Create a ${cefrLevel} ${skillType} assignment for the lesson: "${lessonTitle || topic || 'General English'}". Make it practical, engaging, and academically rigorous. Return the JSON object with HTML in the description field.`;

    let raw = '';
    const errors = [];

    // 1. Groq
    if (process.env.GROQ_API_KEY) {
      const models = [process.env.GROQ_MODEL || 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];
      for (const m of Array.from(new Set(models))) {
        try {
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
            body: JSON.stringify({
              model: m,
              messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
              temperature: 0.7,
              max_tokens: 3000,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            const content = data?.choices?.[0]?.message?.content || '';
            if (content.trim().length > 50) { raw = content; break; }
          } else {
            const e = await res.json().catch(() => ({}));
            errors.push(`Groq(${m}): ${e?.error?.message || res.statusText}`);
          }
        } catch (err) { errors.push(`Groq(${m}): ${err.message}`); }
      }
    }

    // 2. Gemini fallback
    if (!raw && process.env.GEMINI_API_KEY) {
      const gModels = [process.env.GEMINI_MODEL || 'gemini-3.6-flash', 'gemini-flash-latest'];
      for (const gm of Array.from(new Set(gModels))) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${gm}:generateContent?key=${process.env.GEMINI_API_KEY}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: userPrompt }] }],
              systemInstruction: { parts: [{ text: systemPrompt }] },
              generationConfig: { temperature: 0.7, maxOutputTokens: 3000 },
            }),
          });
          if (res.ok) {
            const data = await res.json();
            const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (content.trim().length > 50) { raw = content; break; }
          } else {
            const e = await res.json().catch(() => ({}));
            errors.push(`Gemini(${gm}): ${e?.error?.message || res.statusText}`);
          }
        } catch (err) { errors.push(`Gemini(${gm}): ${err.message}`); }
      }
    }

    if (!raw) {
      const err = new Error(`AI assignment generation failed: ${errors.join(' | ')}`);
      err.statusCode = 500;
      throw err;
    }

    // Strip possible markdown fences
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Try to extract JSON object from anywhere in the text
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch { /* fall through */ }
      }
    }

    if (!parsed || !parsed.title || !parsed.description) {
      const err = new Error('AI returned an invalid assignment format. Please try again.');
      err.statusCode = 500;
      throw err;
    }

    return {
      title: String(parsed.title || '').slice(0, 160),
      description: String(parsed.description || ''),
      suggestedMaxScore: Number(parsed.suggestedMaxScore) || 100,
      skillType: String(parsed.skillType || skillType).toUpperCase(),
    };
  }
}


