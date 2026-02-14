/**
 * Markdown file handling: split frontmatter from body,
 * translate only the body content, and reassemble.
 */

export interface MarkdownFile {
  frontmatter: string | null;
  body: string;
}

/**
 * Split a Markdown file into frontmatter (YAML between --- delimiters)
 * and body content. If there's no frontmatter, returns null for that field.
 */
export function splitMarkdown(content: string): MarkdownFile {
  const trimmed = content.trimStart();

  if (!trimmed.startsWith("---")) {
    return { frontmatter: null, body: content };
  }

  // Find the closing ---
  const endIndex = trimmed.indexOf("\n---", 3);
  if (endIndex === -1) {
    // No closing delimiter found: treat entire content as body
    return { frontmatter: null, body: content };
  }

  const frontmatter = trimmed.slice(0, endIndex + 4); // include closing ---
  const body = trimmed.slice(endIndex + 4); // everything after closing ---

  return { frontmatter, body };
}

/**
 * Reassemble a Markdown file from frontmatter and translated body.
 */
export function assembleMarkdown(
  frontmatter: string | null,
  translatedBody: string
): string {
  if (!frontmatter) {
    return translatedBody;
  }

  return frontmatter + translatedBody;
}
