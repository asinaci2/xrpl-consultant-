---
name: canvas-overlay-debugging
description: Debug and fix HTML5 canvas overlay effects (e.g. matrix rain, particle effects) that are invisible or not rendering correctly. Use when a canvas animation works on some pages but not others, is invisible in a specific theme/mode, or is being blocked by page background elements. Covers CSS z-index stacking, mix-blend-mode, opacity, and canvas drawing logic.
---

# Canvas Overlay Debugging

Covers the full diagnostic and fix workflow for canvas-based visual effects (rain, particles, etc.) that are invisible despite the canvas element existing in the DOM.

## Diagnostic Checklist — Run In Order

### 1. Confirm the canvas exists and has dimensions
Use automated testing to check:
```javascript
const canvas = document.querySelector('[data-testid="canvas-matrix-rain"]');
const ctx = canvas.getContext('2d');
console.log(canvas.width, canvas.height, canvas.offsetWidth);
```
If width/height are 0 — the resize function ran before layout. Fix: use `window.innerWidth/innerHeight` or ensure a `ResizeObserver` re-runs resize after layout.

### 2. Check computed CSS on the canvas
```javascript
const s = window.getComputedStyle(canvas);
console.log(s.position, s.opacity, s.zIndex, s.mixBlendMode);
```
Common gotchas:
- `opacity: 0.2` class conflicts with `opacity: 1 !important` CSS override — check specificity
- `position: absolute` from component base class overrides `position: fixed` from className prop (last in CSS file wins, unpredictable in Tailwind JIT). **Fix: never mix absolute + fixed on same element.**

### 3. Pixel-scan the canvas buffer directly
Don't sample 3 random pixels — that's ~2% coverage. Scan ALL pixels:
```javascript
const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
let orangeCount = 0;
for (let i = 0; i < data.length; i += 4) {
  if (data[i] > 150 && data[i+1] < 130 && data[i+2] < 100) orangeCount++;
}
console.log('orange pixels:', orangeCount, 'of', canvas.width * canvas.height);
```
- **0 orange pixels** → drawing loop not running, or canvas dimensions are 0
- **Few orange pixels (< 500)** → trail fade is too fast (characters vanish in < 5 frames)
- **Thousands of orange pixels** → canvas is drawing correctly; the problem is CSS stacking

### 4. Determine the stacking issue
If the canvas is drawing but invisible to the user, the problem is CSS layering. Two common causes:

**A. Page background covers the canvas**
A full-page `bg-black → white` div paints on top of a `z-0` or `z-auto` canvas.
Fix: lift the canvas above all content using CSS:
```css
[data-theme="day"] canvas[data-testid="canvas-matrix-rain"] {
  z-index: 50 !important;
  mix-blend-mode: multiply !important;
  opacity: 1 !important;
}
```

**B. Wrapper div creates an isolated stacking context**
```jsx
// BAD — wrapper with z-index creates stacking context, breaking mix-blend-mode
<div className="fixed inset-0 z-0">
  <canvas className="absolute inset-0" />
</div>

// GOOD — canvas fixed directly, composites against page background
<canvas className="fixed inset-0 w-full h-full pointer-events-none" />
```
Any wrapper `div` with an explicit `z-index` creates a stacking context. `mix-blend-mode` then composites against the wrapper's transparent background (invisible) rather than the page.

---

## Fix: Making Canvas Rain Visible on Light Backgrounds

### The Core Technique: `mix-blend-mode: multiply`
- **White canvas areas × white page** = white (invisible — canvas background disappears)
- **Colored chars × white page** = colored chars (visible against the white background)
- **White canvas areas × dark content** = dark content (canvas doesn't wash out text)
- `pointer-events: none` is required so the canvas doesn't block clicks

### CSS — Apply in Theme Scope Only
```css
/* Day mode: lift above all content, blend multiplicatively */
[data-theme="day"] canvas[data-testid="canvas-matrix-rain"] {
  z-index: 50 !important;        /* above all page content */
  mix-blend-mode: multiply !important; /* white = transparent, color = visible */
  opacity: 1 !important;         /* override any Tailwind opacity-XX class */
}
```

### Canvas Drawing — Day vs Dark Mode
```javascript
const draw = () => {
  const day = document.documentElement.getAttribute('data-theme') === 'day';

  // Trail fill — fades old characters. Slow = dense trails, fast = sparse dots
  ctx.fillStyle = day
    ? 'rgba(255, 255, 255, 0.08)' // slow white fade → ~40 frame trails → dense
    : 'rgba(0, 0, 0, 0.05)';      // slow black fade → classic dark rain
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Characters
  ctx.fillStyle = day
    ? `rgba(234, 88, 12, ${alpha})`  // orange-600: high contrast on white with multiply
    : `rgba(147, 51, 234, ${alpha})`; // purple-600: bright on black
  ctx.fillText(text, x, y);
};
```

**Why NOT `clearRect` for day mode:** Clearing each frame leaves only 1 character per column per frame — ~90 scattered dots on a 1280×800 screen (< 0.02% coverage), invisible to the naked eye. The trail fill is essential for visible rain columns.

**Why white fill (not tinted):** `rgba(245, 240, 255, 0.18)` (tinted) accumulates to solid off-white after many frames. At 40% CSS opacity, light-purple × white = nearly invisible. Use pure `rgba(255,255,255,X)` so the background stays truly white and multiply blend works correctly.

**Trail fade speed:** Fill alpha of `0.08` = each character stays > 50% visibility for ~8 frames → ~8 characters stacked per column = dense visible columns. At `0.25`, characters vanish in 3 frames = 3 chars per column = too sparse.

---

## Positioning Rules

Never put both `absolute` and `fixed` on the same canvas element. Tailwind JIT generates them in unpredictable order — one silently overrides the other.

```jsx
// BAD — component adds 'absolute', className adds 'fixed', one will lose
<canvas className={`absolute inset-0 w-full h-full ${className}`} />
// Called as: <MatrixRain className="fixed inset-0 ..." />

// GOOD — component doesn't set position, callers own it entirely
<canvas className={className} />
// Called as: <MatrixRain className="fixed inset-0 w-full h-full opacity-20 pointer-events-none" />
```

---

## Key CSS Stacking Rules

| Scenario | Result |
|---|---|
| `z-0` on canvas | Creates stacking context at z=0, painted after normal-flow elements |
| `z-auto` + `mix-blend-mode` | Creates stacking context at z=auto, same paint step as normal-flow elements |
| Wrapper div with `z-0` around canvas | Isolates canvas stacking context — `mix-blend-mode` composites against transparent wrapper, not page |
| `z-50` on canvas in day mode (CSS override) | Canvas above all z-10 content, `mix-blend-mode` composites against full page |

---

## Automated Testing Pattern

Always pixel-scan (not spot-check) to diagnose canvas issues:
```javascript
const result = await runTest(`
  1. Navigate to the page
  2. Set day mode: document.documentElement.setAttribute('data-theme', 'day')
  3. Wait 4 seconds for animation to build up
  4. Scan canvas: count pixels where r>150 && g<130 && b<100
  5. Report: orange pixel count, canvas computed z-index, position, mix-blend-mode
  6. Describe what is visually visible
`);
```

Expected healthy values:
- z-index: `50` (day mode)
- mix-blend-mode: `multiply`
- Orange pixels: `1000+` (confirms drawing is working)
