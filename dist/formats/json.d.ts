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
export declare function flattenJson(obj: Record<string, unknown>, prefix?: string): FlatEntry[];
/**
 * Unflatten dot-notation key-value pairs back into a nested object.
 * Preserves the key order from the entries array.
 */
export declare function unflattenJson(entries: FlatEntry[]): Record<string, unknown>;
/**
 * Compute which keys need translation by comparing source entries against
 * an existing target file. Returns only entries that are new or changed.
 *
 * This enables incremental translation: unchanged keys are kept as-is,
 * preserving any manual edits in the target file.
 */
export declare function computeDiff(sourceEntries: FlatEntry[], existingTarget: Record<string, unknown> | null): FlatEntry[];
/**
 * Merge translated entries into an existing target object.
 * New translations overwrite, existing keys are preserved.
 * The result follows the key order of sourceEntries.
 */
export declare function mergeTranslations(sourceEntries: FlatEntry[], translated: Map<string, string>, existingTarget: Record<string, unknown> | null): Record<string, unknown>;
