/**
 * YAML locale file handling: parse YAML i18n files,
 * reuse JSON flatten/unflatten for key extraction.
 */
import { FlatEntry } from "./json";
/**
 * Parse a YAML string into flat key-value entries.
 */
export declare function parseYaml(content: string): FlatEntry[];
/**
 * Serialize flat entries back to a YAML string.
 */
export declare function serializeYaml(entries: FlatEntry[]): string;
