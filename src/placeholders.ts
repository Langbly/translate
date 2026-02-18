/**
 * ICU / placeholder protection for i18n strings.
 * Replaces placeholder tokens with unique markers before translation,
 * then restores them after. This prevents the translation engine
 * from mangling variables, format strings, and interpolation tokens.
 */

const PLACEHOLDER_PATTERNS = [
  /\{\{[a-zA-Z_]\w*\}\}/g,     // {{name}} - Angular, Handlebars
  /\{[a-zA-Z_]\w*\}/g,         // {name} - i18next, React Intl, FormatJS
  /%\d+\$[sdfu@]/g,            // %1$s, %2$d - Android, Java positional
  /%[sdfu@]/g,                  // %s, %d - printf, Android
  /\$\{[a-zA-Z_]\w*\}/g,       // ${variable} - template literals
  /\$t\([^)]+\)/g,             // $t(key) - i18next nested
];

export interface ProtectedText {
  text: string;
  placeholders: Map<string, string>;
}

/**
 * Replace all recognized placeholders with unique tokens (__PH0__, __PH1__, etc).
 * Returns the modified text and a map to restore the originals.
 */
export function protectPlaceholders(text: string): ProtectedText {
  const placeholders = new Map<string, string>();
  let idx = 0;
  let result = text;

  for (const pattern of PLACEHOLDER_PATTERNS) {
    result = result.replace(pattern, (match) => {
      const token = `__PH${idx}__`;
      placeholders.set(token, match);
      idx++;
      return token;
    });
  }

  return { text: result, placeholders };
}

/**
 * Restore placeholder tokens back to the original values.
 */
export function restorePlaceholders(
  text: string,
  placeholders: Map<string, string>
): string {
  let result = text;
  for (const [token, original] of placeholders) {
    result = result.replace(token, original);
  }
  return result;
}
