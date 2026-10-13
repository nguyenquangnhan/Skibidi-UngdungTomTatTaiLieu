---
name: open-code-review-delegate
description: >-
  Delegation mode for Open Code Review: the host agent performs the code review itself while OCR handles deterministic engineering tasks like file selection and rule resolution.
  Use when the user wants the coding agent to review code using its own model with no OCR LLM endpoint required.
triggers:
  - "delegate review"
  - "host agent review"
  - "ocr delegation"
  - "review with my model"
  - "review and fix with agent"
---

# Open Code Review — Delegation Mode

Use this skill when the coding agent should drive the review with its own model rather than using an OCR-managed LLM endpoint.

## Purpose

Open Code Review delegation mode keeps OCR for deterministic operations such as:

- selecting the target files and diff scope
- resolving review rules
- preparing the review context
- delegating final analysis to the host agent

This is useful when the host model is already available and the user wants the review to happen inside the current coding agent session.

## Typical commands

```bash
ocr delegate preview
ocr delegate rule src/main.go src/handler.go
```

Use the first command to preview what OCR would review, and the second to see which rule applies before running a delegated review.

## Workflow

### 1. Clarify the review target

Determine whether the user wants a:

- working tree review
- review against a branch (`--from` / `--to`)
- single commit review
- full-file or directory scan

### 2. Start delegation mode

Run OCR delegation using the project’s normal review route while keeping the host agent in charge of reasoning and final findings.

### 3. Keep the signal sharp

Focus on:

- correctness bugs
- security risk
- maintainability regressions
- performance problems
- missing tests and risky assumptions

### 4. Apply fixes only with explicit intent

If the user asked for a review only, report the findings without editing code. If the user explicitly said "review and fix" or similar, apply the highest-confidence fixes and validate them.

## Recommended review prompt pattern

```text
Review this change for logic errors, security issues, and maintainability problems.
Focus on the actual diff, ignore generated files, and summarize only issues that are likely to matter.
```

## Notes

- OCR still needs to be installed: `npm install -g @alibaba-group/open-code-review`
- This mode is useful when the user wants agent-native review behavior without requiring a dedicated OCR LLM key
- It is best paired with a code-focused review rule set and a concise business background context
