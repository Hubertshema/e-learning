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
}
