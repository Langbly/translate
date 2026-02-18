/**
 * YAML locale file handling: parse YAML i18n files,
 * reuse JSON flatten/unflatten for key extraction.
 */

import * as yaml from "js-yaml";
import { flattenJson, unflattenJson, FlatEntry } from "./json";

/**
 * Parse a YAML string into flat key-value entries.
 */
export function parseYaml(content: string): FlatEntry[] {
  const parsed = yaml.load(content) as Record<string, unknown>;
  if (!parsed || typeof parsed !== "object") {
    return [];
  }
  return flattenJson(parsed);
}

/**
 * Serialize flat entries back to a YAML string.
 */
export function serializeYaml(entries: FlatEntry[]): string {
  const obj = unflattenJson(entries);
  return yaml.dump(obj, { lineWidth: -1, noRefs: true, quotingType: '"' });
}
