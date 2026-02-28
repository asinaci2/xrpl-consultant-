---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices". Checks accessibility, focus states, forms, animation, typography, performance, dark mode, and more.
---

# Web Interface Guidelines

Review files for compliance with Web Interface Guidelines. Adapted from Vercel's Web Interface Guidelines for this TextRP / Fortuna DAO project.

## How to Use

When the user asks to review a file or component:
1. Read the specified files
2. Check against all rules below
3. Output findings in terse `file:line` format
4. Group by file; mark clean files with `✓ pass`

## Project Context

- **Stack**: React 18 + TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Theme**: Dark default (`bg-black`, `#050505`), Day mode via `data-theme="day"` on `<html>`
- **Colors**: Purple `#9333EA` (primary), Orange `#EA580C` (secondary/CTA gradient)
- **Routing**: Wouter (use `<Link>` not `<a>` for internal nav)
- **Forms**: react-hook-form + shadcn Form component + zodResolver

---

## Rules

### Accessibility

- Icon-only buttons need `aria-label`
- Form controls need `<label>` or `aria-label`
- Interactive elements need keyboard handlers (`onKeyDown`/`onKeyUp`)
- `<button>` for actions, `<Link>`/`<a>` for navigation (not `<div onClick>`)
- Images need `alt` (or `alt=""` if decorative)
- Decorative icons need `aria-hidden="true"`
- Async updates (toasts, validation) need `aria-live="polite"`
- Use semantic HTML (`<button>`, `<a>`, `<label>`) before ARIA
- Headings hierarchical `<h1>`–`<h6>`

### Focus States

- Interactive elements need visible focus: `focus-visible:ring-*` or equivalent
- Never `outline-none` / `outline: none` without focus replacement
- Use `:focus-visible` over `:focus`

### Forms

- Inputs need `autocomplete` and meaningful `name`
- Use correct `type` (`email`, `tel`, `url`, `number`) and `inputmode`
- Never block paste (`onPaste` + `preventDefault`)
- Labels clickable (`htmlFor` or wrapping control)
- Disable spellcheck on emails, codes, usernames (`spellCheck={false}`)
- Submit button stays enabled until request starts; spinner during request
- Errors inline next to fields; focus first error on submit
- `autocomplete="off"` on non-auth fields to avoid password manager triggers

### Animation

- Honor `prefers-reduced-motion` (provide reduced variant or disable)
- Animate `transform`/`opacity` only (compositor-friendly)
- Never `transition: all`—list properties explicitly
- Framer Motion: use `useReducedMotion()` hook to conditionally skip animations

### Typography

- `…` not `...`
- Curly quotes `"` `"` not straight `"`
- Loading states end with `…`: `"Loading…"`, `"Saving…"`
- `font-variant-numeric: tabular-nums` for number columns
- Use `text-wrap: balance` on headings

### Content Handling

- Text containers handle long content: `truncate`, `line-clamp-*`, or `break-words`
- Flex children need `min-w-0` to allow text truncation
- Handle empty states—don't render broken UI for empty strings/arrays

### Images

- `<img>` needs explicit `width` and `height` (prevents CLS)
- Below-fold images: `loading="lazy"`
- Above-fold critical images: `fetchpriority="high"`

### Performance

- Large lists (>50 items): virtualize
- No layout reads in render (`getBoundingClientRect`, `offsetHeight`, etc.)
- Prefer uncontrolled inputs; controlled inputs must be cheap per keystroke

### Navigation & State

- URL reflects state—filters, tabs, pagination in query params
- Links use `<Link>` from wouter (supports Cmd/Ctrl+click)
- Destructive actions need confirmation modal—never immediate

### Touch & Interaction

- `touch-action: manipulation` on interactive elements (prevents double-tap zoom)
- `overscroll-behavior: contain` in modals/drawers

### Dark Mode & Theming (Project-specific)

- Dark mode is the default (no `data-theme`); day mode uses `data-theme="day"`
- Scope day-mode-only rules with `[data-theme="day"]`
- Scope dark-mode-only rules with `:root:not([data-theme="day"])`
- `color-scheme: dark` should be set on `<html>` in dark mode
- Use CSS custom properties from `index.css` rather than hardcoded hex values where possible
- Green Tailwind classes are remapped to purple/orange in `index.css` — don't add new raw `green-*` classes for brand colors; use the remap system

### Anti-patterns (flag these)

- `user-scalable=no` or `maximum-scale=1` disabling zoom
- `onPaste` with `preventDefault`
- `transition: all`
- `outline-none` without `focus-visible` replacement
- Inline `onClick` navigation without `<Link>`/`<a>`
- `<div>` or `<span>` with click handlers (should be `<button>`)
- Images without `alt`
- Form inputs without labels
- Icon buttons without `aria-label`
- Hardcoded date/number formats (use `Intl.*`)

---

## Output Format

Group by file. Use `file:line` format. Terse findings.

```text
## src/components/Button.tsx

src/components/Button.tsx:42 - icon button missing aria-label
src/components/Button.tsx:18 - input lacks label

## src/components/Modal.tsx

✓ pass
```

State issue + location. Skip explanation unless fix is non-obvious. No preamble.
