import { describe, it, expect } from "vitest";
import {
  flattenJson,
  unflattenJson,
  computeDiff,
  mergeTranslations,
} from "../src/formats/json";

describe("flattenJson", () => {
  it("flattens a simple nested object", () => {
    const input = {
      nav: { home: "Home", about: "About Us" },
      footer: { copyright: "Copyright 2026" },
    };

    expect(flattenJson(input)).toEqual([
      { key: "nav.home", value: "Home" },
      { key: "nav.about", value: "About Us" },
      { key: "footer.copyright", value: "Copyright 2026" },
    ]);
  });

  it("handles flat (non-nested) objects", () => {
    const input = { greeting: "Hello", farewell: "Goodbye" };

    expect(flattenJson(input)).toEqual([
      { key: "greeting", value: "Hello" },
      { key: "farewell", value: "Goodbye" },
    ]);
  });

  it("handles deeply nested objects", () => {
    const input = { a: { b: { c: { d: "deep" } } } };

    expect(flattenJson(input)).toEqual([
      { key: "a.b.c.d", value: "deep" },
    ]);
  });

  it("skips non-string values", () => {
    const input = {
      text: "Hello",
      count: 42,
      active: true,
      items: ["a", "b"],
      empty: null,
    };

    expect(flattenJson(input)).toEqual([
      { key: "text", value: "Hello" },
    ]);
  });

  it("returns empty array for empty object", () => {
    expect(flattenJson({})).toEqual([]);
  });
});

describe("unflattenJson", () => {
  it("unflattens dot-notation entries to nested object", () => {
    const entries = [
      { key: "nav.home", value: "Accueil" },
      { key: "nav.about", value: "A propos" },
      { key: "footer.copyright", value: "Droits 2026" },
    ];

    expect(unflattenJson(entries)).toEqual({
      nav: { home: "Accueil", about: "A propos" },
      footer: { copyright: "Droits 2026" },
    });
  });

  it("handles flat entries", () => {
    const entries = [
      { key: "greeting", value: "Bonjour" },
      { key: "farewell", value: "Au revoir" },
    ];

    expect(unflattenJson(entries)).toEqual({
      greeting: "Bonjour",
      farewell: "Au revoir",
    });
  });

  it("roundtrips with flattenJson", () => {
    const original = {
      nav: { home: "Home", about: "About" },
      settings: { theme: { dark: "Dark Mode", light: "Light Mode" } },
    };

    const flat = flattenJson(original);
    const restored = unflattenJson(flat);
    expect(restored).toEqual(original);
  });
});

describe("computeDiff", () => {
  it("returns all entries when no existing target", () => {
    const source = [
      { key: "a", value: "Hello" },
      { key: "b", value: "World" },
    ];

    expect(computeDiff(source, null)).toEqual(source);
  });

  it("returns only missing keys", () => {
    const source = [
      { key: "a", value: "Hello" },
      { key: "b", value: "World" },
      { key: "c", value: "New" },
    ];

    const existing = { a: "Bonjour", b: "Monde" };

    const diff = computeDiff(source, existing);
    expect(diff).toEqual([{ key: "c", value: "New" }]);
  });

  it("returns empty array when all keys exist", () => {
    const source = [
      { key: "a", value: "Hello" },
      { key: "b", value: "World" },
    ];

    const existing = { a: "Bonjour", b: "Monde" };

    expect(computeDiff(source, existing)).toEqual([]);
  });
});

describe("mergeTranslations", () => {
  it("merges new translations with existing", () => {
    const sourceEntries = [
      { key: "a", value: "Hello" },
      { key: "b", value: "World" },
      { key: "c", value: "New" },
    ];

    const translated = new Map([["c", "Nouveau"]]);
    const existing = { a: "Bonjour", b: "Monde" };

    const result = mergeTranslations(sourceEntries, translated, existing);
    expect(result).toEqual({
      a: "Bonjour",
      b: "Monde",
      c: "Nouveau",
    });
  });

  it("uses translated values when no existing target", () => {
    const sourceEntries = [
      { key: "a", value: "Hello" },
      { key: "b", value: "World" },
    ];

    const translated = new Map([
      ["a", "Bonjour"],
      ["b", "Monde"],
    ]);

    const result = mergeTranslations(sourceEntries, translated, null);
    expect(result).toEqual({ a: "Bonjour", b: "Monde" });
  });
});
