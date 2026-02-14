/**
 * JSON locale file handling: flatten nested objects to dot-notation keys,
 * compute incremental diffs, and unflatten back to the original structure.
 */

export interface FlatEntry {
  key: string;
  value: string;
}

/**
 * Flatten a nested JSON object into dot-notation key-value pairs.
 * Only string leaf values are extracted; arrays and non-string values are skipped.
 *
 * Example:
 *   { "nav": { "home": "Home", "about": "About" } }
 *   => [{ key: "nav.home", value: "Home" }, { key: "nav.about", value: "About" }]
 */
export function flattenJson(
  obj: Record<string, unknown>,
  prefix = ""
): FlatEntry[] {
  const entries: FlatEntry[] = [];

  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;

    if (typeof v === "string") {
      entries.push({ key: fullKey, value: v });
    } else if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      entries.push(...flattenJson(v as Record<string, unknown>, fullKey));
    }
    // Skip arrays, numbers, booleans, null
  }

  return entries;
}

/**
 * Unflatten dot-notation key-value pairs back into a nested object.
 * Preserves the key order from the entries array.
 */
export function unflattenJson(entries: FlatEntry[]): Record<string, unknown> {
  const root: Record<string, unknown> = {};

  for (const { key, value } of entries) {
    const parts = key.split(".");
    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current) || typeof current[part] !== "object") {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    current[parts[parts.length - 1]] = value;
  }

  return root;
}

/**
 * Compute which keys need translation by comparing source entries against
 * an existing target file. Returns only entries that are new or changed.
 *
 * This enables incremental translation: unchanged keys are kept as-is,
 * preserving any manual edits in the target file.
 */
export function computeDiff(
  sourceEntries: FlatEntry[],
  existingTarget: Record<string, unknown> | null
): FlatEntry[] {
  if (!existingTarget) {
    // No existing target file: translate everything
    return sourceEntries;
  }

  const existingFlat = new Map(
    flattenJson(existingTarget).map((e) => [e.key, e.value])
  );

  // We need the previous source to detect changes properly.
  // Since we don't store previous source state, we translate keys that
  // are missing in the target. Keys that exist in both are kept.
  return sourceEntries.filter((entry) => !existingFlat.has(entry.key));
}

/**
 * Merge translated entries into an existing target object.
 * New translations overwrite, existing keys are preserved.
 * The result follows the key order of sourceEntries.
 */
export function mergeTranslations(
  sourceEntries: FlatEntry[],
  translated: Map<string, string>,
  existingTarget: Record<string, unknown> | null
): Record<string, unknown> {
  const existingFlat = existingTarget
    ? new Map(flattenJson(existingTarget).map((e) => [e.key, e.value]))
    : new Map<string, string>();

  const merged: FlatEntry[] = sourceEntries.map((entry) => ({
    key: entry.key,
    value: translated.get(entry.key) ?? existingFlat.get(entry.key) ?? entry.value,
  }));

  return unflattenJson(merged);
}
