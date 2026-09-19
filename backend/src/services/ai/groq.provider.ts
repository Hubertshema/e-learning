/**
 * Groq AI Cloud Provider
 * Ultra-low latency Llama-3.3-70b-versatile LLM inference for FluentEdge AI Teaching Assistant.
 */

export interface GroqChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class GroqProvider {
  private static API_URL = 'https://api.groq.com/openai/v1/chat/completions';

  /**
   * Check if Groq API is configured
   */
  public static isConfigured(): boolean {
    return Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== '');
  }

  /**
   * Execute Chat Completion
   */
  public static async chat(
    messages: GroqChatMessage[],
    options: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
      response_format?: { type: 'json_object' | 'text' };
    } = {}
  ): Promise<{ content: string; tokensUsed: number; model: string }> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not configured.');
    }

    const model = options.model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    const response = await fetch(this.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 2048,
        ...(options.response_format && { response_format: options.response_format }),
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const msg = errBody?.error?.message || response.statusText;
      throw new Error(`Groq API Error (${response.status}): ${msg}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const tokensUsed = (data.usage?.prompt_tokens || 0) + (data.usage?.completion_tokens || 0);

    return {
      content,
      tokensUsed,
      model,
    };
  }

  /**
   * Generate Structured JSON Output
   */
  public static async generateJSON<T = any>(
    systemPrompt: string,
    userPrompt: string,
    options: { model?: string; temperature?: number } = {}
  ): Promise<{ data: T; tokensUsed: number; model: string }> {
    const messages: GroqChatMessage[] = [
      {
        role: 'system',
        content: `${systemPrompt}\n\nCRITICAL: Return ONLY valid JSON that matches the requested schema. Do not enclose in markdown code fences (\`\`\`json).`,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ];

    const result = await this.chat(messages, {
      ...options,
      response_format: { type: 'json_object' },
    });

    let cleaned = result.content.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleaned) as T;
    return {
      data: parsed,
      tokensUsed: result.tokensUsed,
      model: result.model,
    };
  }
}
