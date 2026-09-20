/**
 * Google Gemini AI Provider
 * Supports gemini-1.5-flash and gemini-1.5-pro for FluentEdge AI Teaching Assistant.
 */

export class GeminiProvider {
  /**
   * Check if Gemini API key is configured
   */
  public static isConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');
  }

  /**
   * Execute Gemini Generate Content
   */
  public static async generateContent(
    prompt: string,
    systemInstruction?: string,
    options: { model?: string; temperature?: number; jsonMode?: boolean } = {}
  ): Promise<{ content: string; tokensUsed: number; model: string }> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const model = options.model || process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body: any = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        ...(options.jsonMode && { responseMimeType: 'application/json' }),
      },
    };

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errBody: any = await response.json().catch(() => ({}));
      const msg = errBody?.error?.message || response.statusText;
      throw new Error(`Google Gemini API Error (${response.status}): ${msg}`);
    }

    const data: any = await response.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const tokensUsed = data?.usageMetadata?.totalTokenCount || Math.round((prompt.length + content.length) / 4);

    return {
      content,
      tokensUsed,
      model: `gemini/${model}`,
    };
  }

  /**
   * Generate Structured JSON with Gemini
   */
  public static async generateJSON<T = any>(
    systemPrompt: string,
    userPrompt: string,
    options: { model?: string; temperature?: number } = {}
  ): Promise<{ data: T; tokensUsed: number; model: string }> {
    const result = await this.generateContent(userPrompt, systemPrompt, {
      ...options,
      jsonMode: true,
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
