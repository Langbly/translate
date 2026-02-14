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
export declare function splitMarkdown(content: string): MarkdownFile;
/**
 * Reassemble a Markdown file from frontmatter and translated body.
 */
export declare function assembleMarkdown(frontmatter: string | null, translatedBody: string): string;
