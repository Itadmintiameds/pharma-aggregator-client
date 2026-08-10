# Input Component Spec

Source of truth: `.claude/input box code.txt` — a raw Figma dev-mode export of an "Input"
component containing 52 frames (13 states × 4 sizes, all `shape="Square"`). This document is
the human-readable distillation of that export: every state/size combination, the exact design
tokens each one uses, how those tokens map onto tokens already defined in
[`src/app/global.css`](../src/app/global.css), and which states are implemented in
[`FormInput.tsx`](../src/app/seller_7a3b9f2c/components/FormInput.tsx) vs. intentionally skipped.

If the Figma file changes, re-export dev-mode code for the "Input" component, diff it against
`.claude/input box code.txt`, and update this doc + `FormInput.tsx` together — they must stay in
sync since `FormInput.tsx` is the only place these states are implemented in the app.

## 1. Anatomy

Every frame follows the same three-row structure:

```
[Label] [*]                    <- optional asterisk when required
[prefix icon] [value/placeholder] [suffix icon/slot]   <- the field itself
[Hint / Supporting text] [icon]                         <- helper row below the field
```

- **Label row** — `Work Sans`, medium weight. Text color is `pneutral-900` normally, `pneutral-500`
  when disabled. A required field appends a `pneutral-900`-colored... actually `warning-500`
  colored `*` (`Open Sans`, semibold) — see the "Enabled + required" frame (line 953 of the source
  file), which is the only frame with `data-show-asterisk="true"`.
- **Field row** — the bordered box. Background, border/outline color, and box-shadow are what
  change between states. Prefix/suffix icon or slot content lives here.
- **Helper row** — "Hint" (neutral, always-available help text) or "Supporting Text" (state-driven:
  neutral by default, red for Error/Incomplete, green for Success/Complete). Error and Success rows
  additionally render a small icon next to the text: Figma names them
  `exclamation-circle/outline` (12×12 at XSmall/Small, 14×14 at Medium, 16×16 at Large) and a
  matching filled check-circle. `FormInput.tsx` renders these with `lucide-react`'s `AlertCircle`
  and `CheckCircle2` (already a project dependency, used elsewhere e.g. `CoordinatorForm.tsx`)
  sized via `SIZE_HELPER_ICON_CLASSES`, rather than emoji — matching the reference icon instead of
  approximating it.

## 2. Size scale

| Size (Figma) | Field height (min–max) | Padding | Radius | Label size | Value/placeholder size | Helper text size |
|---|---|---|---|---|---|---|
| XSmall | 28–32px | `8px 8px 4px` | 4px | 12px / 18px lh | 12px / 18px lh | 12px / 18px lh |
| Small  | 36–44px | `12px 12px 8px` | 4px | 14px / 20px lh | 12px / 18px lh | 12px / 18px lh |
| Medium | 48–52px | `12px` all sides | 8px | 16px / 24px lh | 16px / 24px lh | 14px / 20px lh |
| Large  | 52–56px | `16px 16px 12px` | 8px | 16px / 24px lh | 16px / 24px lh | 14px / 20px lh |

Font families throughout: label/helper text = `Work Sans` (→ `--font-heading`), field
value/placeholder text = `Noto Sans` (→ `--font-body`). These already exist as
`font-heading`/`font-body` utilities and `text-label-l*`/`text-p*` size tokens in `global.css` —
no new tokens are needed.

**Deviation from Figma, intentional:** every other input-like element already shipped in this app
(`FormInput.tsx`, the phone/OTP inputs in `CoordinatorForm.tsx`, etc.) uses `rounded-xl` (12px) and
a fixed `h-13` (52px) field height regardless of "size", establishing the app's actual visual
language. Rather than fragment the app with three different corner radii, `FormInput.tsx`'s `size`
prop varies **padding and font size** per the table above but keeps `rounded-xl` for every size.
The existing default (no `size` prop passed) is pinned to the current pixel-for-pixel behavior so
no existing screen changes.

## 3. States

| `data-property-1` | Border/outline | Background | Extra visual | Helper text color | Notes |
|---|---|---|---|---|---|
| Enabled | `pneutral-300` | white | — | `pneutral-600` | Default resting state. |
| Focus | `secondary-500` + glow (`0 0 4px 2px #B08DFC`) | white | glow ring | `pneutral-600` | Field has keyboard focus. |
| Active | `secondary-300` | white | — | `pneutral-600` | Focused-but-settled (no glow). Visually indistinguishable enough from Focus for a real `<input>`; native `:focus` covers this. |
| Active - Typing | `secondary-300` | white | text-cursor caret glyph, "Auto Complete" ghost text row | `pneutral-600` | An autocomplete/typeahead affordance — cursor caret + a suggestion is rendered as static content in the mock. Native browser autocomplete UI + text caret already provide this; not something to hand-build. |
| Error | `warning-500` (`#FF3B3B`) | white | warning icon before helper text | `warning-500` | |
| Success | `success-900` (`#378200`) | white | check icon before helper text | `success-900` | |
| Incomplete | `pneutral-300` | white | warning icon **inside the field**, on the right | `pneutral-600` | Field border stays neutral; only an inline icon signals "still needs input". Distinct from Error (no red border). |
| Complete | `pneutral-300` | white | check icon **inside the field**, on the right | `pneutral-600` | Same idea as Incomplete but a check icon; border stays neutral. |
| Pressed | `pneutral-300`/`pneutral-200` | `neutral-50` (`#F5F5F5`) tint | — | `pneutral-600` | Mousedown micro-state. No standard way to style `:active` on a text `<input>` distinctly from `:focus` without JS; skipped as low-value. |
| Read Only | `pneutral-300` | `pneutral-50` (`#F8F8F9`) | value text uses `pneutral-800` instead of `pneutral-500` (i.e. real value, not placeholder-gray) | `pneutral-600` | |
| Dissabled *(sic — typo in the Figma layer name)* | `pneutral-300` | `neutral-100` (`#E1E1E1`) | label + value + helper all drop to `pneutral-500` | `pneutral-500` | |
| Loading | `pneutral-300` | `pneutral-100` (`#EAEAE9`) | spinner ring (`info-500`, `#2E5BFF`) in a right-hand slot | `pneutral-500` | |

## 4. Token mapping (Figma variable → app token)

Every Figma variable in the export already exists in `src/app/global.css` under the same value —
there is nothing to add to the design system, only to consume correctly:

| Figma variable (with fallback) | `global.css` token | Tailwind v4 utility |
|---|---|---|
| `--Colors-Primary-Neutral-pneutral-50, #F8F8F9` | `--pneutral-50` | `bg-pneutral-50` |
| `--Colors-Primary-Neutral-pneutral-100, #EAEAE9` | `--pneutral-100` | `bg-pneutral-100` |
| `--Colors-Primary-Neutral-pneutral-200, #D5D5D4` | `--pneutral-200` | `border-pneutral-200` |
| `--Colors-Primary-Neutral-pneutral-300, #C0C1BE` | `--pneutral-300` | `border-pneutral-300` |
| `--Colors-Primary-Neutral-pneutral-500, #969793` | `--pneutral-500` | `text-pneutral-500` |
| `--Colors-Primary-Neutral-pneutral-600, #787975` | `--pneutral-600` | `text-pneutral-600` |
| `--Colors-Primary-Neutral-pneutral-800, #3C3D3A` | `--pneutral-800` | `text-pneutral-800` |
| `--Colors-Primary-Neutral-pneutral-900, #1E1E1D` | `--pneutral-900` | `text-pneutral-900` |
| `--Colors-Secondary-Secondary-300, #C4AAFD` | `--secondary-300` | `border-secondary-300` |
| `--Colors-Secondary-Secondary-500, #9F75FC` | `--secondary-500` | `border-secondary-500` |
| `--Colors-Warning-warning-500, #FF3B3B` | `--warning-500` | `border-warning-500` / `text-warning-500` |
| `--Colors-Success-Success-900, #378200` | `--success-900` | `border-success-900` / `text-success-900` |
| `--Colors-Info-Info-500, #2E5BFF` | `--info-500` | `border-info-500` |
| `--Colors-Shades-white, white` | n/a — literal `white` | `bg-white` |
| `--Colors-Secondary-Neutral-Secondary-50, #F5F5F5` | not yet defined | closest existing: `pneutral-100` (`#EAEAE9`, slightly darker) — see open question below |
| `--Colors-Secondary-Neutral-Secondary-100, #E1E1E1` | not yet defined | closest existing: `pneutral-200` (`#D5D5D4`, slightly darker) — see open question below |

**Open question:** the Pressed and Disabled background colors (`#F5F5F5`, `#E1E1E1`) don't have an
exact token in `global.css` today (`pneutral-100`/`pneutral-200` are close but not identical).
Since Pressed isn't being implemented (see §3) and Disabled already has a shipped treatment
(`bg-neutral-100`/`text-pneutral-500` in the current `FormInput.tsx`), this repo's existing
Disabled styling was left as-is rather than introduced a near-duplicate token — flag this to
design if pixel-exact match matters.

## 5. What's implemented in `FormInput.tsx` vs. skipped

| State | Implemented? | How |
|---|---|---|
| Enabled | ✅ | default prop values |
| Focus | ✅ | `focus:` pseudo-class (native, no prop needed) |
| Error | ✅ | `error` prop (string) — was already there |
| Success | ✅ | `success` prop (string) — new |
| Read Only | ✅ | native `readOnly` prop — new background/text treatment |
| Loading | ✅ | `loading` prop (boolean) — new spinner + background |
| Disabled | ✅ | `disabled` prop — was already there |
| Active / Active-Typing | Native only | covered by browser `:focus` + native autocomplete UI, no custom styling added |
| Pressed | ❌ skipped | no reliable `:active` styling for text inputs distinct from focus; not worth the complexity |
| Incomplete / Complete | ❌ skipped | no current form in the app validates a field to "still needs input" vs. "done" as a third state distinct from Error/Success — would be speculative. Revisit if a real use case shows up (e.g. a multi-step field like OTP digits). |

`size` was added (`"xs" | "sm" | "md" | "lg"`, default `"lg"` = current pixel behavior) so new
call sites can opt into the Figma XSmall/Small/Medium sizing without touching existing usages.
