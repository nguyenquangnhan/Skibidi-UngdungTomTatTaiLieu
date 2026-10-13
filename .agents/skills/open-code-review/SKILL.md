---
name: open-code-review
description: >-
  Performs AI-powered code review on Git changes using the `ocr` CLI from alibaba/open-code-review.
  Use when the user asks to review code, review a pull request, review staged or unstaged changes,
  review a commit, or compare branches for bugs, security issues, performance problems, and maintainability concerns.
triggers:
  - "review code"
  - "code review"
  - "review my changes"
  - "review this PR"
  - "review commit"
  - "review branch"
  - "đánh giá code"
  - "review and fix"
---

# Open Code Review

This skill uses the `ocr` CLI from [alibaba/open-code-review](https://github.com/alibaba/open-code-review) to run AI-guided code review on Git diffs and whole-file scans.

## When to use

- Review working tree changes before merge
- Review a feature branch against `main`
- Review a single commit or a PR range
- Check for bug, security, performance, and maintainability issues
- Produce structured review results that can be fixed by the host agent

## Core workflow

### 1. Gather context

Extract the user intent and project context. If available, pass business context via `--background` (or `-b`) to improve review quality.

### 2. Run the review

Assume the `ocr` CLI is installed. If the command fails with `command not found`, install it with:

```bash
npm install -g @alibaba-group/open-code-review
```

Then run the review with appropriate flags:

```bash
ocr review --audience agent --background "business context here"
ocr review --audience agent --background "business context here" --from main --to feature-branch
ocr review --audience agent --background "business context here" --commit abc123
```

Useful options:

- `--preview` or `-p`: preview files before review
- `--output <path>`: save results to a file for large reviews
- `--format json|text|sarif`: choose output format
- `--exclude '<patterns>'`: skip paths like generated files or vendor code
- `--timeout <n>`: increase timeout for slow repos

### 3. Interpret the result

OCR output usually includes:

- `path`
- `content`
- `start_line` / `end_line`
- `severity` (`critical`, `high`, `medium`, `low`)
- `category` (`bug`, `security`, `performance`, `maintainability`, `test`, `style`, etc.)

Group findings by severity, and focus on `critical`, `high`, and `medium` issues first.

### 4. Fix only when asked

- If the user asks for a review only, report findings without applying fixes.
- If the user explicitly requests "review and fix" or similar, fix the highest-value issues directly and validate the result.
- For uncertain or complex issues, explain the problem and the suggested fix rather than guessing.

## Recommended commands

```bash
# review all staged, unstaged, and untracked changes
ocr review --audience agent -b "short business context"

# review branch diff against main
ocr review --audience agent -b "short business context" --from main --to feature-branch

# scan full files instead of Git diff
ocr scan
ocr scan --path src

# save full results to file for review
ocr review --format json --output result.json
```

## Reporting template

```markdown
## Code Review Results

**Files reviewed**: N
**Issues found**: X critical, Y high, Z medium

### Critical
- **`path/to/file.ts:42`** [bug] — Brief description
  > Recommendation: Fix by ...

### High
- **`path/to/file.ts:17`** [security] — Brief description
  > Recommendation: Validate ...

### Medium
- **`path/to/file.ts:88`** [performance] — Brief description
  > Recommendation: Optimize ...
```

If no `critical`, `high`, or `medium` issues remain, state:

> Review complete — no critical, high, or medium issues found in N files.

## Troubleshooting

- If `ocr` is not found: `npm install -g @alibaba-group/open-code-review`
- If a review fails due to LLM/provider configuration, run `ocr config provider` and `ocr config model`
- If review output is too large, write to a file with `--output` and inspect the file rather than truncated stdout
- If there are project-specific review expectations, use `ocr rules check <path>` or a custom `.opencodereview/rule.json`

## Prompting tips

When the user asks for review, prefer a concise command such as:

```bash
ocr review --audience agent --background "Review the change for correctness, security, and maintainability. Focus on the patch and likely regressions."
```

This produces a high-signal, agent-friendly review result without noise from UI progress output.
