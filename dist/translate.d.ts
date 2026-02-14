/**
 * Translation orchestrator: reads source files, computes diffs,
 * batches API calls, and writes translated files.
 */
export interface TranslateConfig {
    apiKey: string;
    sourceLanguage: string;
    targetLanguages: string[];
    files: string[];
    outputPattern: string;
    format: "json" | "markdown" | "auto";
    dryRun: boolean;
}
export interface TranslateResult {
    filesTranslated: number;
    charactersUsed: number;
}
/**
 * Main translation pipeline.
 */
export declare function translateFiles(config: TranslateConfig): Promise<TranslateResult>;
