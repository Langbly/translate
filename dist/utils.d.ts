/**
 * Utility functions for file handling and batching.
 */
export type FileFormat = "json" | "yaml" | "markdown";
/**
 * Detect file format from extension.
 */
export declare function detectFormat(filePath: string): FileFormat;
/**
 * Resolve the output path for a given source file and target language.
 * Replaces {lang} in the pattern with the language code.
 *
 * Supports glob-style patterns:
 *   "locales/{lang}.json"         => "locales/fr.json"
 *   "docs/{lang}/**\/*.md"         => preserves the relative path structure
 */
export declare function resolveOutputPath(pattern: string, lang: string, sourceFile: string, sourceGlob: string): string;
/**
 * Split an array of strings into batches that respect both
 * a maximum item count and a maximum total character count.
 */
export declare function batchStrings(strings: string[], maxItems?: number, maxChars?: number): string[][];
/**
 * Count total characters across an array of strings.
 */
export declare function countCharacters(strings: string[]): number;
