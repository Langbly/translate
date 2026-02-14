/**
 * Utility functions for file handling and batching.
 */

import * as path from "path";

export type FileFormat = "json" | "markdown";

/**
 * Detect file format from extension.
 */
export function detectFormat(filePath: string): FileFormat {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".md" || ext === ".mdx") {
    return "markdown";
  }
  return "json";
}

/**
 * Resolve the output path for a given source file and target language.
 * Replaces {lang} in the pattern with the language code.
 *
 * Supports glob-style patterns:
 *   "locales/{lang}.json"         => "locales/fr.json"
 *   "docs/{lang}/**\/*.md"         => preserves the relative path structure
 */
export function resolveOutputPath(
  pattern: string,
  lang: string,
  sourceFile: string,
  sourceGlob: string
): string {
  let result = pattern.replace(/\{lang\}/g, lang);

  // If the pattern contains **, preserve the relative path from source
  if (pattern.includes("**")) {
    // Find the base directory (everything before the first *)
    const globBase = sourceGlob.split("*")[0];
    const relativePath = path.relative(globBase, sourceFile);
    const patternBase = pattern.split("**")[0].replace(/\{lang\}/g, lang);
    result = path.join(patternBase, relativePath);
  }

  return result;
}

/**
 * Split an array of strings into batches that respect both
 * a maximum item count and a maximum total character count.
 */
export function batchStrings(
  strings: string[],
  maxItems: number = 50,
  maxChars: number = 10_000
): string[][] {
  const batches: string[][] = [];
  let currentBatch: string[] = [];
  let currentChars = 0;

  for (const s of strings) {
    const len = s.length;

    // If a single string exceeds maxChars, it goes in its own batch
    if (len > maxChars) {
      if (currentBatch.length > 0) {
        batches.push(currentBatch);
        currentBatch = [];
        currentChars = 0;
      }
      batches.push([s]);
      continue;
    }

    if (
      currentBatch.length >= maxItems ||
      currentChars + len > maxChars
    ) {
      batches.push(currentBatch);
      currentBatch = [];
      currentChars = 0;
    }

    currentBatch.push(s);
    currentChars += len;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

/**
 * Count total characters across an array of strings.
 */
export function countCharacters(strings: string[]): number {
  return strings.reduce((sum, s) => sum + s.length, 0);
}
