# vercel-public

This repository contains source content and published artifacts for a static blog site focused on Delphi material.

Site generator is an open-source static site generator: http: https://github.com/bogdanpolak/cli-md2html

## What Is In This Repository

- bilingual blog content in English and Polish
- shared article styling assets

## Repository Layout

```text
.
├── index.html (404-style landing page)
├── delphi-pl/
│   ├── ... blog content files (Markdown and HTML + CSS)
│   ├── ObjectPascalReference.md
│   └── images/
└── delphi-sytnax-analysis/
    └── ... syntax Delphi analysis - basic syntax highlighting in the browser - requires improvements
```

## Content Model

The Markdown article files use front matter followed by article body content. Based on the existing files, the content model looks like this:

```yaml
---
postId: class-helpers-readable-code
language: en
date: 2026-03-13
author: "Bogdan Polak"
title: "More Readable Code with Class Helpers"
description: "How Class Helpers can improve code readability in Delphi projects?"
coverImage: "images/post001-image-001.png"
coverImageCaption: "..."
intro: "..."
---
```

That front matter matches the fields referenced by the HTML template and the generated article pages.

## Observed Workflow

The repository suggests the following publishing flow:

1. Write or update article content in Markdown (store article metadata in front matter).
2. Render the Markdown into the HTML article template (use md2html tool or similar).
3. Push changes to the repository to publish the generated HTML pages alongside the source files.

What is not visible in the repository (under development):

- generator script
- build command
- deployment configuration
- static site framework configuration

## Editing Notes

- Keep paired English and Polish article sources in sync when a post exists in both languages.
- Keep generated HTML pages consistent with their Markdown sources.
- Preserve same-folder relative links inside `delphi-pl/index.html` when adding or updating article entries.
- Reuse `blog-template.html` and `article.css` to keep published pages visually consistent.
