/**
 * Translation orchestrator: reads source files, computes diffs,
 * batches API calls, and writes translated files.
 */

import * as fs from "fs/promises";
import * as path from "path";
import * as core from "@actions/core";
import { LangblyClient } from "./client";
import {
  flattenJson,
  computeDiff,
  mergeTranslations,
  FlatEntry,
} from "./formats/json";
import { parseYaml, serializeYaml } from "./formats/yaml";
import { splitMarkdown, assembleMarkdown } from "./formats/markdown";
import { protectPlaceholders, restorePlaceholders } from "./placeholders";
import {
  detectFormat,
  resolveOutputPath,
  batchStrings,
  countCharacters,
  FileFormat,
} from "./utils";

export interface TranslateConfig {
  apiKey: string;
  sourceLanguage: string;
  targetLanguages: string[];
  files: string[];
  outputPattern: string;
  format: "json" | "yaml" | "markdown" | "auto";
  dryRun: boolean;
}

export interface TranslateResult {
  filesTranslated: number;
  charactersUsed: number;
}

/**
 * Main translation pipeline.
 */
export async function translateFiles(
  config: TranslateConfig
): Promise<TranslateResult> {
  const client = new LangblyClient(config.apiKey);
  let totalFiles = 0;
  let totalChars = 0;

  for (const sourceFile of config.files) {
    const format =
      config.format === "auto" ? detectFormat(sourceFile) : config.format;

    core.info(`Processing ${sourceFile} (${format})`);

    for (const lang of config.targetLanguages) {
      const outputPath = resolveOutputPath(
        config.outputPattern,
        lang,
        sourceFile,
        config.files[0]
      );

      let result: { files: number; chars: number };

      if (format === "markdown") {
        result = await translateMarkdownFile(client, sourceFile, outputPath, config.sourceLanguage, lang, config.dryRun);
      } else if (format === "yaml") {
        result = await translateYamlFile(client, sourceFile, outputPath, config.sourceLanguage, lang, config.dryRun);
      } else {
        result = await translateJsonFile(client, sourceFile, outputPath, config.sourceLanguage, lang, config.dryRun);
      }

      totalFiles += result.files;
      totalChars += result.chars;
    }
  }

  return { filesTranslated: totalFiles, charactersUsed: totalChars };
}

async function translateJsonFile(
  client: LangblyClient,
  sourceFile: string,
  outputPath: string,
  sourceLang: string,
  targetLang: string,
  dryRun: boolean
): Promise<{ files: number; chars: number }> {
  const sourceContent = await fs.readFile(sourceFile, "utf-8");
  const sourceJson = JSON.parse(sourceContent) as Record<string, unknown>;
  const sourceEntries = flattenJson(sourceJson);

  if (sourceEntries.length === 0) {
    core.info(`  ${targetLang}: No translatable strings found, skipping`);
    return { files: 0, chars: 0 };
  }

  // Load existing target file for incremental translation
  let existingTarget: Record<string, unknown> | null = null;
  try {
    const existing = await fs.readFile(outputPath, "utf-8");
    existingTarget = JSON.parse(existing) as Record<string, unknown>;
  } catch {
    // File doesn't exist yet, translate everything
  }

  const toTranslate = computeDiff(sourceEntries, existingTarget);

  if (toTranslate.length === 0) {
    core.info(`  ${targetLang}: All keys already translated, skipping`);
    return { files: 0, chars: 0 };
  }

  core.info(
    `  ${targetLang}: ${toTranslate.length} keys to translate (${sourceEntries.length} total)`
  );

  if (dryRun) {
    core.info(`  ${targetLang}: [dry-run] Would write to ${outputPath}`);
    return { files: 0, chars: countCharacters(toTranslate.map((e) => e.value)) };
  }

  // Batch and translate with placeholder protection
  const translated = await batchTranslateWithPlaceholders(
    client,
    toTranslate,
    sourceLang,
    targetLang
  );

  // Merge with existing translations
  const merged = mergeTranslations(sourceEntries, translated, existingTarget);

  // Detect source indent style
  const indent = detectIndent(sourceContent);

  // Write output
  await ensureDir(outputPath);
  await fs.writeFile(outputPath, JSON.stringify(merged, null, indent) + "\n");
  core.info(`  ${targetLang}: Wrote ${outputPath}`);

  return {
    files: 1,
    chars: countCharacters(toTranslate.map((e) => e.value)),
  };
}

async function translateYamlFile(
  client: LangblyClient,
  sourceFile: string,
  outputPath: string,
  sourceLang: string,
  targetLang: string,
  dryRun: boolean
): Promise<{ files: number; chars: number }> {
  const sourceContent = await fs.readFile(sourceFile, "utf-8");
  const sourceEntries = parseYaml(sourceContent);

  if (sourceEntries.length === 0) {
    core.info(`  ${targetLang}: No translatable strings found, skipping`);
    return { files: 0, chars: 0 };
  }

  // Load existing target file for incremental translation
  let existingTarget: Record<string, unknown> | null = null;
  try {
    const existing = await fs.readFile(outputPath, "utf-8");
    const yaml = await import("js-yaml");
    existingTarget = yaml.load(existing) as Record<string, unknown>;
  } catch {
    // File doesn't exist yet, translate everything
  }

  const toTranslate = computeDiff(sourceEntries, existingTarget);

  if (toTranslate.length === 0) {
    core.info(`  ${targetLang}: All keys already translated, skipping`);
    return { files: 0, chars: 0 };
  }

  core.info(
    `  ${targetLang}: ${toTranslate.length} keys to translate (${sourceEntries.length} total)`
  );

  if (dryRun) {
    core.info(`  ${targetLang}: [dry-run] Would write to ${outputPath}`);
    return { files: 0, chars: countCharacters(toTranslate.map((e) => e.value)) };
  }

  // Batch and translate with placeholder protection
  const translated = await batchTranslateWithPlaceholders(
    client,
    toTranslate,
    sourceLang,
    targetLang
  );

  // Merge with existing translations
  const merged = mergeTranslations(sourceEntries, translated, existingTarget);

  // Convert merged object back to flat entries for YAML serialization
  const mergedEntries = flattenJson(merged);
  const yamlOutput = serializeYaml(mergedEntries);

  await ensureDir(outputPath);
  await fs.writeFile(outputPath, yamlOutput);
  core.info(`  ${targetLang}: Wrote ${outputPath}`);

  return {
    files: 1,
    chars: countCharacters(toTranslate.map((e) => e.value)),
  };
}

async function translateMarkdownFile(
  client: LangblyClient,
  sourceFile: string,
  outputPath: string,
  sourceLang: string,
  targetLang: string,
  dryRun: boolean
): Promise<{ files: number; chars: number }> {
  const sourceContent = await fs.readFile(sourceFile, "utf-8");
  const { frontmatter, body } = splitMarkdown(sourceContent);

  if (!body.trim()) {
    core.info(`  ${targetLang}: Empty body, skipping`);
    return { files: 0, chars: 0 };
  }

  core.info(`  ${targetLang}: Translating markdown (${body.length} chars)`);

  if (dryRun) {
    core.info(`  ${targetLang}: [dry-run] Would write to ${outputPath}`);
    return { files: 0, chars: body.length };
  }

  // Translate the body as HTML format to preserve markdown formatting
  const result = await client.translate(body, {
    target: targetLang,
    source: sourceLang,
    format: "html",
  });

  const translatedContent = assembleMarkdown(frontmatter, result.text);

  await ensureDir(outputPath);
  await fs.writeFile(outputPath, translatedContent);
  core.info(`  ${targetLang}: Wrote ${outputPath}`);

  return { files: 1, chars: body.length };
}

/**
 * Translate entries in batches with placeholder protection.
 * Protects ICU placeholders ({name}, %s, etc.) before sending to the API,
 * then restores them in the translated output.
 */
async function batchTranslateWithPlaceholders(
  client: LangblyClient,
  entries: FlatEntry[],
  sourceLang: string,
  targetLang: string
): Promise<Map<string, string>> {
  // Protect placeholders in all values
  const protectedEntries = entries.map((e) => ({
    ...e,
    protected: protectPlaceholders(e.value),
  }));

  const values = protectedEntries.map((e) => e.protected.text);
  const batches = batchStrings(values, 50, 10_000);
  const translated = new Map<string, string>();

  let entryIndex = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    core.debug(`  Batch ${i + 1}/${batches.length}: ${batch.length} strings`);

    const results = await client.translate(batch, {
      target: targetLang,
      source: sourceLang,
    });

    const resultArray = Array.isArray(results) ? results : [results];

    for (const result of resultArray) {
      const entry = protectedEntries[entryIndex];
      // Restore placeholders in the translated text
      const restored = restorePlaceholders(result.text, entry.protected.placeholders);
      translated.set(entry.key, restored);
      entryIndex++;
    }
  }

  return translated;
}

/**
 * Detect the indentation style of a JSON file (2 spaces, 4 spaces, or tab).
 */
function detectIndent(content: string): number | string {
  const match = content.match(/^(\s+)/m);
  if (!match) return 2;
  const indent = match[1];
  if (indent.includes("\t")) return "\t";
  return indent.length;
}

/**
 * Ensure the directory for a file path exists.
 */
async function ensureDir(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}
