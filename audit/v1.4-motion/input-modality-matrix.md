# Input Modality Matrix

| Modality | Detection | Press behavior | Target contract | Hover/focus behavior | Evidence |
| --- | --- | --- | --- | --- | --- |
| Fine pointer | `(pointer: fine)` / mouse or pen pointerdown | `scale(.975)` through `ApplePressable` | 34px control token; existing primary controls retain their established size | Hover affordance only when `(hover: hover)`; `:focus-visible` outline remains available | Chromium + WebKit motion suite |
| Coarse pointer | `(pointer: coarse)` / touch or pen pointerdown | `scale(.96)` | 44px control token; touch-action prevents accidental browser gesture interference | No hover dependency; touch controls keep visible state | Chromium/mobile + WebKit motion suite |
| Keyboard | Tab/Arrow keydown changes active modality | No pointer-only feedback requirement | Existing semantic buttons/links remain keyboard reachable | 3px high-contrast focus-visible ring with offset; PhysicalSheet traps Tab and restores focus | Chromium + WebKit focus test |
| 200% effective zoom | Browser/device layout plus `document.documentElement.style.zoom = '2'` gate | Same semantic controls; no alternate gesture model | No horizontal overflow in the required learning viewport | Focus remains on a real control, not body | Chromium/mobile + WebKit motion suite |

## Accessibility invariants

- `prefers-reduced-motion` and the in-app reduced-motion setting both produce the reduced profile.
- No pointermove handler updates React state for PhysicalSheet geometry.
- The close control is a real named button; the sheet has dialog semantics, labelled title, focus trap, Escape close, and focus restoration.
