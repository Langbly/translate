import { describe, it, expect } from "vitest";
import { splitMarkdown, assembleMarkdown } from "../src/formats/markdown";

describe("splitMarkdown", () => {
  it("splits frontmatter from body", () => {
    const content = `---
title: Hello
lang: en
---

# My Document

Some content here.`;

    const result = splitMarkdown(content);
    expect(result.frontmatter).toBe("---\ntitle: Hello\nlang: en\n---");
    expect(result.body).toBe("\n\n# My Document\n\nSome content here.");
  });

  it("returns null frontmatter when none present", () => {
    const content = "# Just a heading\n\nSome text.";
    const result = splitMarkdown(content);
    expect(result.frontmatter).toBeNull();
    expect(result.body).toBe(content);
  });

  it("handles content starting with --- but no closing delimiter", () => {
    const content = "---\ntitle: Incomplete\nThis is not valid frontmatter.";
    const result = splitMarkdown(content);
    expect(result.frontmatter).toBeNull();
    expect(result.body).toBe(content);
  });

  it("handles empty body after frontmatter", () => {
    const content = "---\ntitle: Empty\n---";
    const result = splitMarkdown(content);
    expect(result.frontmatter).toBe("---\ntitle: Empty\n---");
    expect(result.body).toBe("");
  });

  it("handles leading whitespace", () => {
    const content = "\n\n---\ntitle: Test\n---\n\nBody";
    const result = splitMarkdown(content);
    expect(result.frontmatter).toBe("---\ntitle: Test\n---");
    expect(result.body).toBe("\n\nBody");
  });
});

describe("assembleMarkdown", () => {
  it("reassembles frontmatter and translated body", () => {
    const frontmatter = "---\ntitle: Hello\n---";
    const body = "\n\n# Mon Document\n\nContenu traduit.";

    const result = assembleMarkdown(frontmatter, body);
    expect(result).toBe("---\ntitle: Hello\n---\n\n# Mon Document\n\nContenu traduit.");
  });

  it("returns just body when no frontmatter", () => {
    const body = "# Just text\n\nSome translated content.";
    const result = assembleMarkdown(null, body);
    expect(result).toBe(body);
  });

  it("roundtrips split and assemble", () => {
    const original = "---\ntitle: Test\nlang: en\n---\n\n# Hello World\n\nContent here.";
    const { frontmatter, body } = splitMarkdown(original);
    const reassembled = assembleMarkdown(frontmatter, body);
    expect(reassembled).toBe(original);
  });
});
