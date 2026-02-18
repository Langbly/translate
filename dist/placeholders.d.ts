/**
 * ICU / placeholder protection for i18n strings.
 * Replaces placeholder tokens with unique markers before translation,
 * then restores them after. This prevents the translation engine
 * from mangling variables, format strings, and interpolation tokens.
 */
export interface ProtectedText {
    text: string;
    placeholders: Map<string, string>;
}
/**
 * Replace all recognized placeholders with unique tokens (__PH0__, __PH1__, etc).
 * Returns the modified text and a map to restore the originals.
 */
export declare function protectPlaceholders(text: string): ProtectedText;
/**
 * Restore placeholder tokens back to the original values.
 */
export declare function restorePlaceholders(text: string, placeholders: Map<string, string>): string;
