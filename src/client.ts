/**
 * Lightweight Langbly API client for use in the GitHub Action.
 * Avoids the SDK's ESM-only package which doesn't bundle with ncc (CJS).
 *
 * Implements the same translate() interface with retry logic.
 */

export interface Translation {
  text: string;
  source: string;
}

export interface TranslateOptions {
  target: string;
  source?: string;
  format?: "text" | "html";
}

const RETRIABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

export class LangblyClient {
  private apiKey: string;
  private baseUrl: string;
  private maxRetries: number;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = "https://api.langbly.com";
    this.maxRetries = 2;
  }

  async translate(
    text: string,
    options: TranslateOptions
  ): Promise<Translation>;
  async translate(
    text: string[],
    options: TranslateOptions
  ): Promise<Translation[]>;
  async translate(
    text: string | string[],
    options: TranslateOptions
  ): Promise<Translation | Translation[]> {
    const q = Array.isArray(text) ? text : [text];

    const body: Record<string, unknown> = { q, target: options.target };
    if (options.source) body.source = options.source;
    if (options.format) body.format = options.format;

    const data = await this.postWithRetry("/language/translate/v2", body);

    const translations: Translation[] = data.data.translations.map(
      (item: Record<string, string>) => ({
        text: item.translatedText,
        source: item.detectedSourceLanguage ?? options.source ?? "",
      })
    );

    return Array.isArray(text) ? translations : translations[0];
  }

  private async postWithRetry(
    path: string,
    body: unknown
  ): Promise<Record<string, any>> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "langbly-github-action/1.0.0",
    };

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      let resp: Response;

      try {
        resp = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(30_000),
        });
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < this.maxRetries) {
          await this.sleep(500 * 2 ** attempt);
          continue;
        }
        throw new Error(
          `Langbly API request failed after ${this.maxRetries + 1} attempts: ${lastError.message}`
        );
      }

      if (resp.ok) {
        return (await resp.json()) as Record<string, any>;
      }

      if (!RETRIABLE_STATUS_CODES.has(resp.status)) {
        const errBody = await resp.json().catch(() => ({}));
        const message =
          (errBody as any)?.error?.message ?? resp.statusText;
        throw new Error(`Langbly API error (${resp.status}): ${message}`);
      }

      if (attempt < this.maxRetries) {
        const retryAfter = resp.headers.get("retry-after");
        const delay = retryAfter
          ? Math.min(Number(retryAfter) * 1000, 30_000)
          : 500 * 2 ** attempt;
        await this.sleep(delay);
        continue;
      }

      const errBody = await resp.json().catch(() => ({}));
      const message = (errBody as any)?.error?.message ?? resp.statusText;
      throw new Error(`Langbly API error (${resp.status}): ${message}`);
    }

    throw lastError ?? new Error("Request failed");
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
