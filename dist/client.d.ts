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
export declare class LangblyClient {
    private apiKey;
    private baseUrl;
    private maxRetries;
    constructor(apiKey: string);
    translate(text: string, options: TranslateOptions): Promise<Translation>;
    translate(text: string[], options: TranslateOptions): Promise<Translation[]>;
    private postWithRetry;
    private sleep;
}
