---
name: open-design
description: >-
  Create distinctive, production-grade frontend interfaces with strong visual direction, polished typography,
  considered layout, and working React/Next.js/Tailwind code. Use when building or beautifying web applications,
  dashboards, landing pages, and interactive UI components following Vercel Web Interface Guidelines and modern design systems.
triggers:
  - "open design"
  - "frontend design"
  - "ui design"
  - "ux design"
  - "thiết kế giao diện"
  - "làm đẹp giao diện"
  - "beautify ui"
  - "redesign"
---

# OpenDesign — Production Frontend & UI/UX Craft Skill

This skill adapts the principles of OpenDesign, Anthropic's `frontend-design`, and Vercel's Web Interface Guidelines to craft state-of-the-art web applications.

## Core Philosophy
1. **Commit to a Distinctive Direction**:
   - For developer/AI productivity tools, use a refined, dark-mode-first aesthetic (Linear/Raycast inspired).
   - Use deep obsidian canvas backgrounds (`#090a0f`), structured card elevations (`#11131a`, `#181b24`), luminous accent gradients, and crisp 1px borders with inner rim highlights.
2. **Avoid Generic AI Templates**:
   - Don't use washed-out generic purple bubbles or plain borders.
   - Use real product controls: keyboard shortcuts, active states, auto-scrolling, clear empty & loading states, and contextual tooltips.
3. **Strict Adherence to Web Interface Guidelines**:
   - Read [`references/web-interface-guidelines.md`](./references/web-interface-guidelines.md).
   - Visible focus rings with `:focus-visible`.
   - Never block paste in inputs.
   - Accessible labels on icon buttons (`aria-label`).
   - Clean micro-animations with `transform` and `opacity` only.
4. **Token Consistency**:
   - Reference [`references/design-tokens.md`](./references/design-tokens.md) for color values, spacing rhythm, and typography scale.

## Execution Checklist
- [ ] Responsive at desktop (1440px+), laptop (1024px), and mobile widths.
- [ ] Interactive states (hover, focus, active, disabled) on every button and link.
- [ ] Clear typography contrast meeting WCAG 2.1 AA (at least 4.5:1 ratio).
- [ ] Smooth transitions on interactive cards (`hover:-translate-y-0.5`).
- [ ] Thoughtful empty states with actionable buttons rather than blank canvases.
