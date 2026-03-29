const API_BASE_URL = 'http://localhost:8000';

export type TranslateParams = {
  text: string;
  sourceLang?: string;
  targetLang?: string;
  provider?: string;
};

export type TranslateResult = {
  translated_text: string;
  provider: string;
};

/**
 * REST-based translation service for on-demand translation of past text.
 * Real-time translation during recording is handled via WebSocket.
 */
export class TranslationService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async translate(params: TranslateParams): Promise<TranslateResult> {
    const body = {
      text: params.text,
      source_lang: params.sourceLang || 'EN',
      target_lang: params.targetLang || 'TR',
      provider: params.provider || 'libre',
    };

    const response = await fetch(`${this.baseUrl}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Translation failed: ${response.status} - ${error}`);
    }

    return response.json();
  }
}

export const translationService = new TranslationService();
