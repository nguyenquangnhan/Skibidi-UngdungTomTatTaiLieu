# Design Tokens & Aesthetic Standards (Linear & Raycast Inspired)

## 1. Dark Theme Color Palette
- **Canvas Base:** `#090a0f` (Deep obsidian background)
- **Surface Level 1:** `#11131a` (Sidebar, navigation, panel containers)
- **Surface Level 2:** `#181b24` (Cards, elevated dropdowns, modal layers)
- **Surface Level 3:** `#222634` (Inputs, active buttons, chat bubbles)
- **Border Subtlety:**
  - Standard: `rgba(255, 255, 255, 0.08)`
  - Elevated / Focus: `rgba(99, 102, 241, 0.4)`
  - Active: `rgba(99, 102, 241, 0.8)`
- **Brand Primary Accent:**
  - Indigo Glow: `#6366f1` / `#4f46e5`
  - Radiant Cyan: `#06b6d4`
  - Violet Gradient: `linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)`
  - Emerald Success: `#10b981`
  - Amber Warning: `#f59e0b`
  - Rose Error: `#f43f5e`

## 2. Glassmorphism & Shadow Depth
- **Frosted Glass:** `backdrop-filter: blur(16px); background: rgba(17, 19, 26, 0.75); border: 1px solid rgba(255, 255, 255, 0.08);`
- **Inner Rim Light:** `box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.08);`
- **Luminous Glow:** `box-shadow: 0 0 24px -4px rgba(99, 102, 241, 0.35);`

## 3. Typography & Rhythm
- Font family: `'Inter', -apple-system, sans-serif`
- Tracking (Letter-spacing): `-0.015em` on headings, normal on body
- Line-height: `1.6` for readable Vietnamese paragraph text
- Headings: `font-weight: 600` or `700`, with subtle text gradient where appropriate

## 4. Interaction Craft
- Micro-elevations: `hover:-translate-y-0.5 transition-all duration-200 ease-out`
- Buttons: Subtle top highlight, crisp active click state (`active:translate-y-0 active:scale-[0.99]`)
- Scrollbar: 4px–6px minimal thumb with rounded corners, hidden track
