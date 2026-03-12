

## Problem
Number input spinner arrows (up/down buttons) have a white background that doesn't adapt to the theme, visible on both light and dark modes.

## Fix
Add CSS rules to `src/index.css` targeting the native number input spinner buttons across all browsers (Webkit/Blink and Firefox) to make their background transparent.

### Changes
**`src/index.css`** — Add in `@layer base`:
```css
/* Remove background from number input spinner buttons */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  background: transparent;
}
```

This is a single CSS addition — no component changes needed.

