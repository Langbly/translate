import { describe, it, expect } from "vitest";
import { batchStrings, countCharacters, detectFormat, resolveOutputPath } from "../src/utils";

describe("batchStrings", () => {
  it("creates a single batch for small inputs", () => {
    const strings = ["Hello", "World"];
    const batches = batchStrings(strings, 50, 10_000);
    expect(batches).toEqual([["Hello", "World"]]);
  });

  it("splits on max items", () => {
    const strings = ["a", "b", "c", "d", "e"];
    const batches = batchStrings(strings, 2, 10_000);
    expect(batches).toEqual([["a", "b"], ["c", "d"], ["e"]]);
  });

  it("splits on max characters", () => {
    const strings = ["hello", "world", "foo"];
    // "hello" = 5 fits batch 1. Adding "world" = 10 > 8, new batch.
    // "world" = 5, adding "foo" = 8 <= 8, stays in same batch.
    const batches = batchStrings(strings, 50, 8);
    expect(batches).toEqual([["hello"], ["world", "foo"]]);
  });

  it("puts oversized strings in their own batch", () => {
    const strings = ["short", "a".repeat(20_000), "also short"];
    const batches = batchStrings(strings, 50, 10_000);
    expect(batches.length).toBe(3);
    expect(batches[0]).toEqual(["short"]);
    expect(batches[1]).toEqual(["a".repeat(20_000)]);
    expect(batches[2]).toEqual(["also short"]);
  });

  it("returns empty array for empty input", () => {
    expect(batchStrings([], 50, 10_000)).toEqual([]);
  });
});

describe("countCharacters", () => {
  it("counts total characters", () => {
    expect(countCharacters(["Hello", "World"])).toBe(10);
  });

  it("returns 0 for empty array", () => {
    expect(countCharacters([])).toBe(0);
  });
});

describe("detectFormat", () => {
  it("detects JSON files", () => {
    expect(detectFormat("locales/en.json")).toBe("json");
  });

  it("detects Markdown files", () => {
    expect(detectFormat("docs/intro.md")).toBe("markdown");
    expect(detectFormat("docs/intro.mdx")).toBe("markdown");
  });

  it("detects YAML files", () => {
    expect(detectFormat("locales/en.yaml")).toBe("yaml");
    expect(detectFormat("locales/en.yml")).toBe("yaml");
  });

  it("defaults to JSON for unknown extensions", () => {
    expect(detectFormat("file.txt")).toBe("json");
  });
});

describe("resolveOutputPath", () => {
  it("replaces {lang} placeholder", () => {
    const result = resolveOutputPath(
      "locales/{lang}.json",
      "fr",
      "locales/en.json",
      "locales/en.json"
    );
    expect(result).toBe("locales/fr.json");
  });

  it("handles multiple {lang} occurrences", () => {
    const result = resolveOutputPath(
      "i18n/{lang}/{lang}.json",
      "de",
      "i18n/en/en.json",
      "i18n/en/en.json"
    );
    expect(result).toBe("i18n/de/de.json");
  });
});
