# Iteration 1 UX Review: Slash Command Highlighting System

**Reviewer:** UX Designer Agent
**Date:** 2026-03-10
**Component:** `src/components/chat/ChatInput.tsx`
**Scope:** Ghost text autocomplete, command gradient highlight, slash menu

---

## A. Text Alignment Audit

### A1. Horizontal Alignment -- Ghost Text

| Check | Result | Detail |
|---|---|---|
| Ghost text left edge vs typed text right edge | **PASS** | Delta: 0.08px. Hidden measurement `<span>` accurately measures typed text width. |
| Font properties match textarea | **PASS** | Both use `fontSize: 14px`, `fontFamily: -apple-system...`, `fontWeight: 400`, `lineHeight: 19.6px`. |
| `paddingLeft` calculation | **PASS** | `textareaLeftOffset + ghostLeftOffset` correctly positions ghost text immediately after typed characters. |

### A2. Horizontal Alignment -- Command Highlight

| Check | Result | Detail |
|---|---|---|
| Gradient text left edge vs textarea text left edge | **PASS** | Delta: 0px. Both start at `left: 324.5`. |
| Gap between gradient portion and args portion | **PASS** | 0.00px gap. Flex row layout butts them together correctly. |
| Total overlay width vs textarea text width | **FAIL** | **2.41px drift.** Gradient text renders `/ghost quality` at `fontWeight: 500` = 90.01px, but textarea renders the same text at `fontWeight: 400` = 87.60px. The overlay is 2.41px wider than what the textarea renders. The args text (" 1080p") starts 2.41px further right in the overlay than where the caret would actually sit in the textarea. |
| Shorter command `/help` width drift | **WARN** | 0.87px drift for `/help`. Less severe for short commands, but still present. |

### A3. Vertical Alignment

| Check | Result | Detail |
|---|---|---|
| Overlay vertical position vs textarea text | **PASS** | Delta: -0.80px. Overlay uses `alignItems: 'center'` on a 32px container with 19.6px text. Textarea uses `paddingTop: 6px`. Both center the text nearly identically. |

### A4. Normal Text (No Overlay)

| Check | Result | Detail |
|---|---|---|
| No overlay for `hello world` | **PASS** | Zero overlays rendered, textarea `color` is normal (not transparent). |

### A5. paddingRight

| Check | Result | Detail |
|---|---|---|
| Hardcoded `paddingRight: 85` vs actual button space | **WARN** | Actual space from textarea right edge to ghost container right edge is **94px**. The hardcoded 85px is 9px short. Long command text could visually overlap with the emoji/send button area. |

### A6. textareaLeftOffset Default

| Check | Result | Detail |
|---|---|---|
| Default `51px` vs measured `52px` | **WARN** | 1px off. Used only before `requestAnimationFrame` measurement fires (first frame). Brief positional flash possible. |

---

## B. Wisp Design Token Audit

### B1. Hardcoded Values vs Tokens

| Value in ChatInput | Should Be | Severity |
|---|---|---|
| `fontSize: 14` | `theme.typography.sizes.sm.fontSize` (= 14) | **WARN** -- Correct value, wrong source. Should reference token for maintainability. |
| `lineHeight: 19.6` / `'19.6px'` | Computed as `14 * 1.4`. MessageInput internally uses the same formula. Wisp token `sm.lineHeight` = 20. | **WARN** -- Both ChatInput and MessageInput diverge from the Wisp token (20 vs 19.6). The overlay matches MessageInput, so they align, but both are wrong relative to the design system. |
| `fontFamily: '-apple-system, ...'` | `theme.typography.fontFamily` (identical string) | **WARN** -- Correct value, but hardcoded as a local `const systemFontFamily` instead of reading from `theme.typography.fontFamily`. If the theme font changes, this won't update. |
| `paddingRight: 85` | Should be dynamically measured (like `textareaLeftOffset`) or derived from `sizeConfig.iconButtonSize * buttonCount + sizeConfig.gap * gapCount + hPad` | **FAIL** -- Magic number, already 9px wrong. Will break if button count, size, or gap changes. |
| `'#8B5CF6'` (reduced-motion fallback color) | `theme.colors.brand.primary` (= `'#8B5CF6'` in dark theme) | **FAIL** -- Correct in dark mode by coincidence. In light mode, `brand.primary` may differ. The hardcoded hex will not adapt to theme changes or custom themes. |
| `fontWeight: '500'` on GradientText | Should be `'400'` to match textarea, or `theme.typography.weights.regular` (= 400) | **FAIL** -- Creates the 2.41px width drift documented in A2. This is the root cause of the alignment bug. |

### B2. GradientText Usage Consistency

| Aspect | ChatInput | Other Usages | Verdict |
|---|---|---|---|
| Speed | 3000ms | Settings: 10000ms, Sidebar: 4000ms, Welcome: 10000ms, PIN: 2000ms | **WARN** -- No consistent speed convention. Inline text at 3000ms is the fastest text gradient in the app. Ambient/decorative text elsewhere uses 4000-10000ms. |
| Colors | Defaults (`#8B5CF6, #EC4899, #3B82F6, #8B5CF6`) | All usages use defaults | **PASS** -- Consistent with other GradientText usages. |
| Wrapping | `<GradientText>` renders as `<View><Text>` | N/A | **PASS** -- In the flex-row overlay, the View wrapper acts as a flex item and does not introduce unwanted spacing. |

### B3. GradientBorder Consistency

| Aspect | ChatInput | Other Usages | Verdict |
|---|---|---|---|
| Speed | 3000ms | PIN input: 2000ms, Default: 3000ms | **PASS** -- Uses the component default. |
| Colors | Defaults | Defaults | **PASS** |
| Border width | 2px | 2px everywhere | **PASS** |

### B4. What Should Move Into Wisp

1. **`brandGradient` token is already in `wisp-core/tokens/colors.ts`** (`['#8B5CF6', '#EC4899', '#3B82F6']`) but is not exposed through `theme.colors`. ChatInput should import from the token, not rely on GradientText defaults.

2. **A `CommandHighlightText` or `SyntaxHighlightOverlay` primitive** should be added to Wisp. The overlay-on-transparent-textarea pattern is complex and fragile. Encapsulating it would:
   - Centralize font matching logic (no more manual `fontSize`, `lineHeight`, `fontFamily` duplication)
   - Auto-measure `paddingRight` from sibling button widths
   - Handle the `color: transparent` + `caretColor` toggle on the textarea

3. **Gradient animation speed tokens** should be defined in `wisp-core/tokens/motion.ts` alongside `durations`:
   - `gradientAmbient: 10000` (decorative, low-attention text)
   - `gradientSubtle: 5000` (accents, borders)
   - `gradientActive: 3000` (interactive, focused elements)

4. **Theme tokens for command highlight colors** -- the `#8B5CF6` fallback should reference `theme.colors.brand.primary` and gradient colors should reference a `theme.gradient.brand` array token.

---

## C. Interaction Pattern Audit

### C1. Ghost Text to Gradient Transition

| Aspect | Assessment |
|---|---|
| Correctness | **PASS** -- At `/hel` ghost text shows "p". At `/help` ghost text returns `''` and `commandHighlight` returns the match. No simultaneous render risk (both are `useMemo` on `[message]`). |
| Smoothness | **WARN** -- The transition is **abrupt**. Ghost text vanishes instantly; gradient appears instantly. There is no cross-fade, opacity transition, or shared animation state. The visual jump is noticeable because the text changes from normal-weight muted gray to medium-weight animated gradient in a single frame. |
| Recommendation | Add a 150ms opacity fade-in on the command highlight overlay using CSS transition or a brief Animated sequence. This matches the Wisp `durations.fast` token. |

### C2. Dual Gradient Animation Competition

| Aspect | Assessment |
|---|---|
| Both active simultaneously | **Yes** -- GradientBorder (focus) and GradientText (command highlight) both animate when the input is focused and contains a valid command. |
| Same speed | **Yes** -- Both 3000ms. |
| Same colors | **Yes** -- Both use `#8B5CF6, #EC4899, #3B82F6, #8B5CF6`. |
| Different motion types | **Yes** -- Border uses conic-gradient rotation. Text uses linear-gradient horizontal shift. |
| Visual assessment | **WARN** -- Two simultaneous gradient animations with the same speed but different motion patterns creates **visual noise**. The eye is pulled in two directions. Neither element reads as the primary focal point. |
| Recommendation | (a) Slow the text gradient to 5000-6000ms for a subtle shimmer while the border rotates faster, creating visual hierarchy. Or (b) use a static (non-animated) gradient on the text when the border is already animated, reserving animation for one element. Or (c) pause the border animation when command highlight is active. |

### C3. Gradient Speed (3000ms) for Inline Text

| Aspect | Assessment |
|---|---|
| Comparison to other text gradients | **WARN** -- 3000ms is the **fastest** text gradient in the app. Settings descriptions use 10000ms. Sidebar empty state uses 4000ms. Welcome screen uses 10000ms. The inline command text moves noticeably faster than all other gradient text, which feels inconsistent and potentially distracting during typing. |
| Recommendation | Increase to 5000-6000ms to sit between the ambient decorative speed (10000ms) and the border active speed (3000ms). |

### C4. fontWeight: 500 on Gradient Text

| Aspect | Assessment |
|---|---|
| Visual intent | The medium weight likely aims to make the command text feel "bolder" or more prominent. |
| Problem | Creates a measurable 2.41px width drift from the transparent textarea text underneath. On longer commands, this drift compounds. The caret position will not match the visual boundary between gradient and args text. |
| Severity | **FAIL** -- Must be fixed. Use `fontWeight: '400'` (or `theme.typography.weights.regular`) to match the textarea. If visual prominence is needed, the gradient effect alone provides sufficient differentiation. |

---

## D. Summary

### PASS (5)
- Ghost text horizontal alignment (0.08px delta)
- Gradient text left-edge alignment (0px delta)
- Gradient-to-args gap (0px)
- Vertical alignment (0.80px delta)
- No overlay for normal (non-command) text

### WARN (7)
- `paddingRight: 85` is 9px short of actual 94px needed (could overflow on long text)
- `textareaLeftOffset` default 51 is 1px off measured 52 (brief flash on mount)
- `fontSize: 14` hardcoded instead of `theme.typography.sizes.sm.fontSize`
- `lineHeight: 19.6` diverges from Wisp token `sm.lineHeight: 20` (but matches MessageInput)
- `fontFamily` hardcoded instead of `theme.typography.fontFamily`
- Gradient speed 3000ms is fastest text gradient in app, inconsistent with other usages
- Dual gradient animations (border + text) at same speed create visual competition

### FAIL (3)
- **`fontWeight: '500'` on gradient text** causes 2.41px width drift from textarea weight 400. Root cause of caret/overlay misalignment. Must change to `'400'`.
- **`paddingRight: 85` is a hardcoded magic number** that is already 9px wrong. Must be dynamically measured or derived from layout constants.
- **`'#8B5CF6'` fallback color hardcoded** instead of `theme.colors.brand.primary`. Will not adapt to light mode, custom themes, or brand color changes.

### RECOMMEND (4)
- Create a `CommandHighlightOverlay` (or `SyntaxHighlightOverlay`) Wisp primitive that encapsulates the transparent-textarea + overlay pattern, auto-measures padding, and centralizes font matching.
- Define gradient speed tokens in `wisp-core/tokens/motion.ts` (`gradientAmbient`, `gradientSubtle`, `gradientActive`).
- Add a 150ms opacity fade-in transition when the command highlight overlay appears (matching `durations.fast`).
- Differentiate text gradient speed from border gradient speed (text: 5000-6000ms, border: 3000ms) to create animation hierarchy and reduce visual noise.
