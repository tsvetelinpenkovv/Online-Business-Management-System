

# Apple Device Optimization Plan

## Summary
Add iOS/Safari-specific meta tags, CSS optimizations for WebKit/touch, and ensure the app follows Apple HIG guidelines for touch targets, safe areas, and Retina displays.

## Changes

### 1. `index.html` — Add Apple-specific meta tags
- Add `apple-mobile-web-app-capable` and `apple-mobile-web-app-status-bar-style` meta tags for standalone PWA behavior on iOS
- Add `apple-mobile-web-app-title` meta tag
- Ensure viewport meta includes `viewport-fit=cover` for notch/safe area support on modern iPhones

### 2. `src/index.css` — Safari & touch optimizations
Add a new section with:
- **Safe area padding** using `env(safe-area-inset-*)` for iPhone notch/home indicator
- **Touch target minimum sizes** — global rule ensuring all interactive elements (buttons, links, inputs) have min 44x44px touch targets per Apple HIG
- **WebKit-specific fixes**:
  - `-webkit-tap-highlight-color: transparent` to remove blue tap highlight on iOS
  - `-webkit-overflow-scrolling: touch` for smooth momentum scrolling
  - `-webkit-text-size-adjust: 100%` to prevent auto text zoom in Safari
  - `touch-action: manipulation` to eliminate 300ms tap delay
- **Retina border fix** — use `0.5px` borders on devices with `min-resolution: 2dppx`
- **Input zoom prevention** — set font-size ≥ 16px on inputs to prevent Safari auto-zoom on focus

### 3. `tailwind.config.ts` — Add Apple system font fallback
- Prepend `-apple-system, BlinkMacSystemFont` to the `fontFamily.sans` array before `Open Sans`, so on Apple devices the system font loads instantly as fallback

### 4. `src/components/ui/button.tsx` — Touch target enforcement
- Add `min-h-[44px] min-w-[44px]` as base classes to ensure all buttons meet Apple's 44px minimum touch target guideline (only for non-icon sizes on mobile)

## Technical Details
- `viewport-fit=cover` + `env(safe-area-inset-*)` handles the iPhone notch and home bar
- `touch-action: manipulation` removes the 300ms delay without disabling pinch-zoom
- Font-size ≥ 16px on inputs is the only reliable way to prevent Safari's auto-zoom behavior
- All changes are CSS/HTML only — no JavaScript changes needed
- No breaking changes to existing layout or design

