# Langbly Translate - GitHub Action

Automatically translate your JSON/YAML locale files and Markdown docs in CI/CD. Powered by [Langbly](https://langbly.com), a context-aware translation API that's compatible with Google Translate v2.

## Features

- **JSON & YAML support** - Nested and flat key structures (i18next, react-intl, Rails, etc.)
- **Markdown docs** - Translates body content while preserving frontmatter
- **Placeholder preservation** - `{name}`, `%s`, `{{count}}`, `$t(key)` are never translated
- **Incremental translation** - Only translates new or changed keys, preserving manual edits
- **Multiple target languages** - Translate to any number of languages in a single run
- **Dry-run mode** - Preview what would be translated before making changes
- **Pull request support** - Optionally create a PR with the translations

## Quick Start

```yaml
name: Translate

on:
  push:
    branches: [main]
    paths:
      - 'locales/en.json'

jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: langbly/translate@v1
        with:
          api-key: ${{ secrets.LANGBLY_API_KEY }}
          source-language: en
          target-languages: fr,de,es,nl
          files: locales/en.json
          output-pattern: 'locales/{lang}.json'

      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: 'Update translations'
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `api-key` | Yes | - | Your Langbly API key ([get one free](https://langbly.com)) |
| `source-language` | Yes | `en` | Source language code (ISO 639-1) |
| `target-languages` | Yes | - | Comma-separated target languages (e.g., `fr,de,es,nl`) |
| `files` | Yes | - | Glob pattern for source files (e.g., `locales/en.json`) |
| `output-pattern` | Yes | - | Output path with `{lang}` placeholder (e.g., `locales/{lang}.json`) |
| `format` | No | `auto` | File format: `json`, `yaml`, `markdown`, or `auto` |
| `create-pr` | No | `false` | Create a pull request with the translations |
| `dry-run` | No | `false` | Preview what would be translated |

## Outputs

| Output | Description |
|--------|-------------|
| `files-translated` | Number of files written |
| `characters-used` | Total source characters sent to the API |

## Examples

### Translate JSON locale files

The most common use case. When your English locale file changes, translate it to all target languages:

```yaml
- uses: langbly/translate@v1
  with:
    api-key: ${{ secrets.LANGBLY_API_KEY }}
    source-language: en
    target-languages: fr,de,es,nl,ja,ko,zh
    files: locales/en.json
    output-pattern: 'locales/{lang}.json'
```

### Translate YAML locale files

Works with Rails-style YAML locale files:

```yaml
- uses: langbly/translate@v1
  with:
    api-key: ${{ secrets.LANGBLY_API_KEY }}
    source-language: en
    target-languages: fr,de,nl
    files: config/locales/en.yml
    output-pattern: 'config/locales/{lang}.yml'
```

### Translate Markdown documentation

Translate your docs site (Docusaurus, Hugo, Jekyll, etc.):

```yaml
- uses: langbly/translate@v1
  with:
    api-key: ${{ secrets.LANGBLY_API_KEY }}
    source-language: en
    target-languages: fr,de
    files: 'docs/en/**/*.md'
    output-pattern: 'docs/{lang}/**/*.md'
    format: markdown
```

### Dry run (preview changes)

See what would be translated without writing any files:

```yaml
- uses: langbly/translate@v1
  with:
    api-key: ${{ secrets.LANGBLY_API_KEY }}
    source-language: en
    target-languages: fr,de
    files: locales/en.json
    output-pattern: 'locales/{lang}.json'
    dry-run: true
```

### Create a pull request

Automatically create a PR with the translations for review:

```yaml
- uses: langbly/translate@v1
  with:
    api-key: ${{ secrets.LANGBLY_API_KEY }}
    source-language: en
    target-languages: fr,de,nl
    files: locales/en.json
    output-pattern: 'locales/{lang}.json'
    create-pr: true
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Placeholder Preservation

The following placeholder formats are automatically protected during translation:

| Format | Example | Used By |
|--------|---------|---------|
| `{name}` | `Hello, {name}!` | i18next, React Intl, FormatJS |
| `{{name}}` | `Hello, {{name}}!` | Angular, Handlebars |
| `%s`, `%d` | `%d items` | printf, Android |
| `%1$s` | `%1$s of %2$s` | Android, Java |
| `${var}` | `Hello, ${name}` | Template literals |
| `$t(key)` | `$t(common.yes)` | i18next nested |

## Incremental Translation

The action compares your source file with existing translations. Only new keys are sent to the API. This means:

- **Manual edits are preserved** - If you've manually adjusted a translation, it won't be overwritten
- **Lower API usage** - You only pay for what's new
- **Faster runs** - Less data to process

## Pricing

Langbly offers a free tier with 500,000 characters per month. That covers most small to medium projects. See [langbly.com](https://langbly.com) for full pricing.

## License

MIT
