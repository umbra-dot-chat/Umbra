# Chat Input: Ghost Text Alignment Audit & Markdown Support Spec

**Author:** UX Designer Agent
**Date:** 2026-03-10
**Status:** Draft
**Applies to:** `src/components/chat/ChatInput.tsx`, Wisp `MessageInput` component

---

## Part 1: Ghost Text Autocomplete Alignment QA Checklist

The ghost text overlay renders a semi-transparent inline completion suggestion
after the user's typed text inside the chat input. It is implemented as an
absolutely positioned `<View>` + `<RNText>` layered on top of the Wisp
`MessageInput` component (web platform only).

### Current Implementation Summary

| Property | Ghost Measurement Span | Ghost Display Text | MessageInput Textarea |
|---|---|---|---|
| `fontSize` | `15` (hardcoded) | `15` (hardcoded) | `sizeConfig.fontSize` = `defaultTypography.sizes.sm.fontSize` = **14** |
| `fontFamily` | `inherit` | `inherit` | System font (`-apple-system, BlinkMacSystemFont, ...`) |
| `fontWeight` | not set (default 400) | not set (default 400) | not set (default 400) |
| `lineHeight` | not set | not set | `sizeConfig.fontSize * 1.4` = **19.6** |
| `letterSpacing` | not set | not set | not set |
| `paddingLeft` | n/a (offscreen) | `44 + ghostLeftOffset` (hardcoded) | Computed from `hPad` + icon button + gap |
| `whiteSpace` | `pre` | not set | not set |

### CRITICAL FINDING: Font Size Mismatch

The ghost text uses `fontSize: 15` while the MessageInput textarea uses
`fontSize: 14` (from `defaultTypography.sizes.sm.fontSize`). This is a
**1px font size discrepancy** that will cause visible misalignment on all
platforms. The ghost text characters will be slightly larger than the typed
characters, producing a jarring visual seam at the junction point.

---

### QA Checklist

#### 1. Font Metrics Matching

- [ ] **1.1 Font Size:** Inspect the rendered `<textarea>` element and the ghost
  text `<div>/<span>`. Confirm both have **identical computed `font-size`**.
  - Current bug: textarea = 14px, ghost = 15px. These MUST match.
  - Use DevTools > Elements > Computed tab on both elements.
- [ ] **1.2 Font Family:** Confirm both elements resolve to the **same computed
  `font-family`**. The textarea inherits from the system font stack
  (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ...`). The ghost
  text uses `fontFamily: 'inherit'` which on web inherits from React Native
  Web's root, which may or may not match.
  - Verify on macOS (SF Pro), Windows (Segoe UI), and Linux (Roboto/system).
- [ ] **1.3 Font Weight:** Confirm both use `font-weight: 400` (normal). Neither
  explicitly sets a weight, so verify the computed values match.
- [ ] **1.4 Line Height:** The textarea uses `line-height: 19.6px`
  (`14 * 1.4`). The ghost text does not set `lineHeight`. Confirm the
  computed `line-height` on the ghost text element matches the textarea's
  computed value exactly.
  - Mismatch here causes vertical drift on multi-line inputs (if ever enabled).
- [ ] **1.5 Letter Spacing:** Neither element sets `letter-spacing`. Verify both
  compute to `normal` (0px). Any deviation causes cumulative horizontal drift
  that worsens with longer strings.
- [ ] **1.6 Font Variant / Font Feature Settings:** Verify no `font-variant`,
  `font-feature-settings`, or `text-rendering` differences between the two
  elements. Ligatures or kerning table differences can cause per-character
  width discrepancies.
- [ ] **1.7 Text Transform:** Confirm neither element has an unexpected
  `text-transform` applied.
- [ ] **1.8 Anti-aliasing:** On macOS, check both elements have the same
  `-webkit-font-smoothing` value. Subpixel antialiasing vs grayscale
  antialiasing can cause characters to appear at slightly different widths.

#### 2. Horizontal Position (First Character Alignment)

- [ ] **2.1 Left Padding Accuracy:** The ghost overlay uses a hardcoded
  `paddingLeft: 44 + ghostLeftOffset`. The `44` is documented as accounting
  for "icon + padding" in the pill variant. Verify this matches the actual
  computed left offset of the first character in the textarea:
  - `hPad` (pill variant) = `sizeConfig.padding * 0.75` = `12 * 0.75` = **9px**
  - Plus attachment icon button width: `sizeConfig.iconButtonSize` = **34px**
  - Plus gap: `sizeConfig.gap` = `defaultSpacing.sm` = **8px**
  - Total = 9 + 34 + 8 = **51px** (not 44px). Verify which is correct.
- [ ] **2.2 Measurement Span Fidelity:** The hidden `<RNText>` used for
  measurement (`ghostMeasureRef`) must use **exactly the same font metrics**
  as the textarea so that `offsetWidth` accurately represents the typed text
  width. Currently it uses `fontSize: 15` and `fontFamily: 'inherit'`, but
  the textarea uses `fontSize: 14`. This means the measurement span
  **over-measures** the typed text width, causing the ghost text to start
  too far to the right.
- [ ] **2.3 Box Model Consistency:** Confirm the measurement span uses
  `whiteSpace: 'pre'` (it does) and has no padding, margin, or border that
  would inflate `offsetWidth`.
- [ ] **2.4 Subpixel Precision:** After Tab completion, verify no fractional
  pixel gap or overlap between the last typed character and the first ghost
  character. Take a 2x/3x zoom screenshot and inspect the junction pixel by
  pixel.
- [ ] **2.5 Cursor Position vs Ghost Start:** Place the text cursor at the end
  of the typed text. The blinking caret should visually sit at the exact
  position where the ghost text begins. There should be zero gap and zero
  overlap between the caret and the first ghost character.
- [ ] **2.6 Right Padding Clipping:** The ghost overlay uses
  `paddingRight: 80` to avoid overlapping emoji/attachment buttons. Verify
  this value is correct. If the total right-side button area is narrower or
  wider than 80px, ghost text either gets clipped prematurely or bleeds
  under the buttons.
- [ ] **2.7 Scroll Offset:** If the textarea content is wider than the visible
  area (long input), verify the ghost text accounts for any horizontal scroll
  offset. Currently it does not -- the ghost text will be mispositioned if the
  textarea scrolls.

#### 3. Vertical Position (Baseline Alignment)

- [ ] **3.1 Vertical Centering:** The ghost overlay uses
  `justifyContent: 'center'` on a container that spans `top: 0` to
  `bottom: 0` of the relative parent. Verify this produces the same vertical
  position as the textarea text. The textarea uses `paddingVertical` for
  vertical spacing, not flexbox centering. These are different layout
  mechanisms and may produce different results.
- [ ] **3.2 Baseline Match:** The ghost text first character baseline must sit
  on the exact same horizontal line as the textarea text baseline. Use
  DevTools to overlay both elements and zoom to 400%+ to inspect baseline
  alignment. Even a 0.5px offset is visible.
- [ ] **3.3 Multi-size Inputs:** If the `size` prop is changed to `'sm'` or
  `'lg'`, verify ghost text vertical alignment still holds. Different size
  presets change `minHeight`, `padding`, and `fontSize`, all of which affect
  vertical position.
- [ ] **3.4 Reply/Edit Context Bar:** When a reply or edit context bar is
  visible above the input, verify the ghost text does not shift vertically.
  The context bar adds height above the input row but should not affect the
  relative positioning within the input container.

#### 4. Different Text Lengths

- [ ] **4.1 Short Input (`/h`):** Type `/h`. Ghost should show `elp` (completing
  `/help`). Verify horizontal alignment at this short width.
- [ ] **4.2 Medium Input (`/ghost quality`):** Type `/ghost q`. Ghost should
  show `uality <level>` or similar. Verify alignment with medium-length typed
  text plus the args hint suffix.
- [ ] **4.3 Long Input (`/ghost play-video someid`):** Type a long slash
  command. Verify:
  - Ghost text does not overflow the right padding boundary (80px from right).
  - Ghost text is properly truncated with `numberOfLines={1}`.
  - No horizontal scrolling mismatch.
- [ ] **4.4 Empty Slash (`/`):** Type just `/`. No ghost text should appear
  (guard: `message.length < 2`). Verify the overlay is not rendered.
- [ ] **4.5 Non-slash Input:** Type regular text without `/`. Verify no ghost
  text appears.
- [ ] **4.6 Exact Match (`/help`):** Type the full command `/help`. Ghost text
  should disappear because `cmd.command.toLowerCase() !== typed` evaluates
  to false. Verify no residual ghost text is visible.

#### 5. Different Viewport Widths (Responsive)

- [ ] **5.1 Desktop (1440px+):** Full-width layout. Verify alignment at
  standard desktop width.
- [ ] **5.2 Tablet (768px-1024px):** If the chat panel is narrower, verify ghost
  text does not overflow or misalign due to different container width.
- [ ] **5.3 Narrow (< 600px):** At narrow widths, the input may be compressed.
  Verify the hardcoded `paddingLeft: 44` still holds if the input layout
  reflows.
- [ ] **5.4 Window Resize:** Resize the browser window while ghost text is
  visible. Verify the ghost text repositions correctly without lag or jitter
  (measurement uses `requestAnimationFrame`).

#### 6. Tab Completion Behavior

- [ ] **6.1 Tab Accept:** Press Tab while ghost text is visible. Verify:
  - The input value updates to `message + ghostText + ' '`.
  - The ghost text overlay disappears immediately (no flash of old position).
  - The cursor is placed at the end of the completed text.
- [ ] **6.2 Post-Tab Alignment:** After Tab completion, if the completed command
  has further ghost text suggestions (e.g., args hint), verify the new ghost
  text starts at the correct position.
- [ ] **6.3 Tab with Menu Open:** When the slash command dropdown menu is open
  AND ghost text is visible, Tab should select the highlighted menu item (not
  accept ghost text). Verify this priority is correct -- the slash menu
  `handleKeyDown` checks `slashOpenRef.current` before the ghost text Tab
  handler.
- [ ] **6.4 Rapid Typing After Tab:** Accept ghost text via Tab, then
  immediately type more characters. Verify no ghost text flash or position
  jitter during the transition.

#### 7. Visual Fidelity

- [ ] **7.1 Opacity:** Ghost text uses `opacity: 0.35` on the text element and
  the text color is `theme.colors.text.muted`. Verify the resulting visual
  is clearly distinguishable from typed text but not so faint as to be
  invisible on both dark and light themes.
- [ ] **7.2 Theme Switch:** Toggle between dark and light themes while ghost
  text is visible. Verify it remains legible and correctly colored in both.
- [ ] **7.3 Pointer Events:** The ghost overlay uses `pointerEvents="none"`.
  Verify clicking on the ghost text area focuses the textarea and places the
  cursor, not intercepting the click.

---

## Part 2: Markdown Formatting Support -- Approach Analysis

### Current State

The message input uses the Wisp `MessageInput` component, which wraps a React
Native `<TextInput>` (rendered as `<textarea>` on web). It is plain text only.
Messages are parsed for markdown formatting at **display time** in
`parseMessageContent.tsx`, which supports bold, italic, underline,
strikethrough, inline code, code blocks, spoilers, links, block quotes, lists,
headers, and custom emoji shortcodes.

The input layer currently supports:
- Mention highlighting via a transparent text overlay (`highlightMentions`)
- Ghost text autocomplete via a separate overlay (`ChatInput.tsx`)
- Slash command detection and menu (`useSlashCommand`)
- Emoji picker integration
- Reply/edit context bars
- Keyboard shortcuts (Enter to send, Tab to accept ghost text)

### Approach A: Dual-Layer (Textarea + Overlay)

Keep the `<textarea>` as the source of truth for input. Add a transparent
overlay `<div>` rendered on top that shows markdown-formatted text. The user
types into the invisible textarea; the overlay mirrors the content with
formatting applied.

**How it works:**
- The textarea text color is set to `transparent` (similar to the existing
  mention highlight overlay pattern).
- The overlay renders the same text with markdown parsed and formatted (bold
  spans, italic spans, code with background, etc.).
- Cursor and selection remain in the textarea (native browser behavior).
- The overlay must have identical font metrics, padding, and layout to the
  textarea so that formatted text aligns with the cursor.

**Cursor Alignment Risk: MEDIUM**
- The overlay text must match the textarea character-for-character in width.
  Bold text is wider than regular text. If the overlay renders `**bold**` as
  wider bold glyphs while the textarea has the raw characters `**bold**`, the
  cursor will desync from the visible text.
- Workaround: Only colorize/style the markdown syntax characters (like `**`,
  `*`, `` ` ``) without changing font-weight, so character widths stay
  identical. This reduces the "preview" quality but preserves alignment.

**Compatibility with Existing Features:**
- Mentions: Already uses a transparent-text overlay pattern. Two overlays on
  the same textarea could conflict. Would need to merge them into a single
  overlay pass that handles both mentions and markdown.
- Slash commands: No conflict. Slash detection works on raw text value.
- Ghost text autocomplete: Ghost text is a separate overlay. Adding a third
  overlay increases z-index complexity but is technically compatible.
- Emoji picker: No conflict.

**Implementation Complexity: MEDIUM**
- Need to write a markdown-to-styled-spans renderer that produces output with
  identical character count and per-character width as the raw text.
- Must handle line wrapping identically between textarea and overlay (matching
  `word-break`, `overflow-wrap`, `white-space` properties).
- Must handle textarea scrolling -- when the textarea scrolls vertically, the
  overlay must scroll in sync.

**User Experience: FAIR**
- If bold/italic rendering changes character widths, the user sees a cursor
  that does not align with the visible text. This is confusing and feels
  broken.
- If formatting is limited to colorization only (no weight/style changes), the
  UX is syntax-highlighting rather than true WYSIWYG. Still useful but less
  impressive.
- Users cannot see actual bold/italic rendering until the message is sent.

**Mobile Compatibility (React Native TextInput): POOR**
- React Native `TextInput` on iOS/Android does not support transparent text
  color with a custom overlay reliably. Text selection handles, magnification
  loupes, and autocorrect popups all assume the text is visible in the
  TextInput.
- This approach is web-only.

---

### Approach B: ContentEditable / Rich Text Editor

Replace the `<textarea>` with a `contenteditable` div or integrate a rich text
editor library (Slate.js, Tiptap/ProseMirror, Lexical).

**How it works:**
- The editor manages its own DOM and cursor. Text is stored as a structured
  document model (not a plain string).
- Markdown syntax is parsed in real time and rendered as formatted elements
  (bold, italic, code, etc.).
- The user sees true WYSIWYG formatting as they type.

**Cursor Alignment Risk: LOW (if using a mature library)**
- Mature editors like Lexical or Tiptap handle cursor positioning natively
  within their formatted DOM. There is no cursor-vs-overlay desync issue
  because the cursor lives inside the formatted content.
- However, custom overlays (ghost text, mention highlighting) that depend on
  textarea cursor position would break. These would need to be reimplemented
  as editor plugins/decorations within the rich text framework.

**Compatibility with Existing Features:**
- Mentions: Would need to be reimplemented as editor nodes/decorations.
  Libraries like Lexical and Tiptap have first-class mention node support, so
  this is feasible but requires rewriting `useMention`.
- Slash commands: The `useSlashCommand` hook reads `text.startsWith('/')`.
  With a rich editor, extracting plain text requires calling the editor's
  serialization API. The hook would need modification.
- Ghost text autocomplete: Would need to be reimplemented as an editor
  decoration (a non-editable inline node appended after the cursor). This is
  architecturally different from the current overlay approach.
- Emoji picker: Insert operations change from string concatenation to editor
  commands (`editor.insertText(emoji)`).

**Implementation Complexity: HIGH**
- Full rewrite of the input layer. Every interaction (typing, pasting,
  selection, keyboard shortcuts, mentions, slash commands, ghost text) must be
  rebuilt on top of the editor's API.
- Bundle size increase: Lexical ~30KB gzipped, Tiptap ~50KB+, ProseMirror
  ~40KB+.
- Must maintain the Wisp `MessageInput` visual design (pill shape, gradient
  border, icon buttons) while replacing its internal `<TextInput>`.
- Testing burden: Rich text editors have notoriously complex edge cases around
  composition events (IME input for CJK languages), paste handling, undo/redo,
  and mobile keyboards.

**User Experience: EXCELLENT**
- True WYSIWYG markdown editing. Bold text appears bold, code appears in
  monospace with background, links are clickable.
- Familiar to users of Notion, Slack (which uses Quill), and GitHub.
- Can support keyboard shortcuts for formatting (Ctrl+B for bold, etc.).

**Mobile Compatibility (React Native TextInput): POOR**
- ContentEditable is web-only. React Native does not support it.
- Lexical has experimental React Native support but it is not production-ready.
- Would require maintaining two completely different input implementations:
  rich editor for web, plain TextInput for native. This doubles the
  maintenance burden and creates feature parity issues.

---

### Approach C: Syntax Highlighting Overlay

Keep the textarea. Add an overlay that colorizes markdown syntax characters
without rendering formatted output. The `**` delimiters turn a different color,
backticks get a subtle background, `>` quote markers are tinted, etc.

**How it works:**
- Identical architecture to Approach A, but the overlay only changes color
  and background of syntax tokens. No font-weight or font-style changes.
- The overlay text is character-for-character identical to the textarea text
  in width, because no typographic properties are altered.
- Cursor stays in the textarea and is always perfectly aligned.

**Cursor Alignment Risk: VERY LOW**
- Since the overlay applies only color and background changes (not weight,
  style, or family), every character has the same width in both the textarea
  and the overlay. Cursor position is guaranteed to match.
- This is the same technique the existing mention highlighting uses.

**Compatibility with Existing Features:**
- Mentions: Must be merged into the same overlay rendering pass. The existing
  mention overlay already sets textarea text to transparent and renders
  colored spans. Adding markdown syntax highlighting is an extension of this
  same pattern.
- Slash commands: No conflict. Works on raw text value.
- Ghost text autocomplete: No conflict. Ghost text is a separate overlay at a
  different z-level.
- Emoji picker: No conflict.

**Implementation Complexity: LOW-MEDIUM**
- Need a tokenizer that identifies markdown syntax characters and classifies
  them (bold delimiter, italic delimiter, code delimiter, link syntax, etc.).
- The tokenizer output feeds the overlay renderer, which wraps each token in
  a colored `<span>`.
- Can reuse the existing `parseMessageContent` logic or build a lighter
  tokenizer specifically for syntax highlighting.
- Must handle the overlay scroll sync (same as Approach A).

**User Experience: GOOD**
- Users get immediate visual feedback that their markdown is being recognized.
- `**bold**` shows the asterisks in a muted color, signaling that formatting
  will be applied.
- Backtick-wrapped code shows a subtle background tint.
- Not true WYSIWYG, but provides enough feedback to write markdown confidently.
- Low learning curve -- if you know markdown, the highlighting confirms your
  syntax is correct.

**Mobile Compatibility (React Native TextInput): POOR on native, GOOD on web**
- Same limitation as Approach A: transparent text + overlay is not reliable on
  native iOS/Android TextInput.
- On web (React Native Web), this works well because the TextInput renders as
  a standard `<textarea>`.

---

### Approach D: Preview-on-Send

Do not format anything inside the input. When markdown syntax is detected in
the input text, show a small live preview panel above the input bar that
renders the formatted output.

**How it works:**
- A detection function checks if the input text contains any markdown syntax
  (`**`, `*`, `` ` ``, `>`, `#`, `[]()`  etc.).
- When detected, a preview panel slides in above the input (similar to the
  reply/edit context bar).
- The preview panel renders the text through `parseMessageContent` to show
  the formatted result.
- The input textarea remains completely unchanged.

**Cursor Alignment Risk: NONE**
- The textarea is untouched. No overlays, no transparent text, no cursor
  alignment concerns whatsoever.

**Compatibility with Existing Features:**
- Mentions: No conflict. Mention highlighting overlay continues to work
  independently.
- Slash commands: No conflict.
- Ghost text autocomplete: No conflict.
- Emoji picker: No conflict.
- Reply/edit context bar: The preview panel needs to coexist with the
  reply/edit bar. Could stack vertically (reply bar, then markdown preview)
  or share the same slot with a mode toggle.

**Implementation Complexity: LOW**
- The markdown renderer already exists (`parseMessageContent.tsx`). Reuse it
  in a preview panel component.
- Detect markdown presence with a simple regex check.
- Add a collapsible panel with slide-in animation (can reuse
  `AnimatedPresence` with `slideUp` preset).
- Estimated effort: 1-2 days.

**User Experience: ADEQUATE**
- Users can see what their formatted message will look like before sending.
- The preview is spatially separated from the input, which creates a
  disconnect between typing and seeing the result.
- No in-place WYSIWYG feel. Users must mentally map between raw markdown in
  the input and formatted text in the preview.
- For simple formatting (bold a word, inline code), the preview overhead may
  feel unnecessary.
- For complex formatting (multi-line code blocks, nested lists), the preview
  is very helpful.

**Mobile Compatibility (React Native TextInput): EXCELLENT**
- Fully compatible with React Native on all platforms. The preview panel is
  standard RN View + Text components. The TextInput is untouched.
- Works on iOS, Android, and web identically.

---

### Comparison Matrix

| Criterion | A: Dual-Layer | B: Rich Editor | C: Syntax Highlight | D: Preview |
|---|---|---|---|---|
| Cursor alignment risk | Medium | Low (library) | Very Low | None |
| Mention compat | Needs merge | Full rewrite | Needs merge | No conflict |
| Slash cmd compat | No conflict | Needs rework | No conflict | No conflict |
| Ghost text compat | No conflict | Full rewrite | No conflict | No conflict |
| Impl complexity | Medium | High | Low-Medium | Low |
| UX quality | Fair | Excellent | Good | Adequate |
| Mobile native compat | Poor | Poor | Poor (web only) | Excellent |
| Bundle size impact | Minimal | +30-50KB | Minimal | Minimal |
| Maintenance burden | Medium | High | Low | Low |

---

### Recommendation

**Phase 1 (immediate): Approach D -- Preview-on-Send**

This is the safest and fastest path to ship markdown support with zero risk of
breaking the existing input system. It can be built in 1-2 days by reusing
`parseMessageContent.tsx` in a preview panel component.

Rationale:
- The cursor alignment problem is the highest-risk concern in this codebase.
  The ghost text overlay already has alignment bugs (font size mismatch,
  hardcoded padding offset). Adding another overlay increases the surface area
  for alignment regressions. Approach D avoids this entirely.
- Mobile compatibility is critical for Umbra (React Native app). Approaches A,
  B, and C all have significant limitations on native iOS/Android.
  Approach D is the only option that works identically across all platforms.
- The existing `parseMessageContent` renderer already handles the full markdown
  spec needed. No new rendering code is required.

**Phase 2 (follow-up): Approach C -- Syntax Highlighting Overlay (web only)**

Once the ghost text alignment bugs are fixed (font size mismatch, padding
offset), add syntax highlighting as a web-only enhancement. This gives web
users immediate visual feedback while typing markdown, complementing the
preview panel.

Implementation plan:
1. First, fix the ghost text overlay to use the correct `fontSize: 14` (matching
   the textarea) and dynamically compute `paddingLeft` from the actual DOM
   layout instead of a hardcoded `44`.
2. Merge the mention highlight overlay and the markdown syntax highlight
   overlay into a single rendering pass to avoid multiple transparent-text
   overlays.
3. Gate this behind a `Platform.OS === 'web'` check so native platforms are
   unaffected.

**Not recommended: Approach B (Rich Editor)**

While the UX would be the best, the implementation cost is prohibitive given:
- The existing feature surface (mentions, slash commands, ghost text) would
  need to be fully reimplemented as editor plugins.
- No production-ready React Native rich text editor exists that matches the
  Wisp design system.
- The maintenance burden of two separate input implementations (web: rich
  editor, native: TextInput) is unsustainable for the team size.

---

### Appendix: Ghost Text Bug Fixes Required Before Phase 2

These bugs were identified during the alignment audit and should be fixed
regardless of which markdown approach is chosen:

1. **Font size mismatch:** `ChatInput.tsx` lines 455-456 and 481 use
   `fontSize: 15` for both the measurement span and the ghost display text.
   The MessageInput textarea uses `fontSize: 14` (from `messageInputSizeMap.md`).
   Change both to `14` or, better, read the size from the MessageInput's
   `sizeConfig`.

2. **Hardcoded paddingLeft:** The `44` value on line 475 is an approximation
   of the textarea's left inset. The actual value depends on `hPad` (9px for
   pill variant), icon button width (34px), and gap (8px), totaling 51px.
   This should be dynamically measured from the DOM rather than hardcoded.

3. **Missing lineHeight on ghost text:** The ghost display text (line 481-487)
   does not set `lineHeight`. The textarea uses `lineHeight: 19.6`
   (`14 * 1.4`). The ghost text should explicitly set `lineHeight: 19.6` (or
   the equivalent computed value) to ensure baseline alignment.

4. **whiteSpace inconsistency:** The measurement span uses `whiteSpace: 'pre'`
   but the ghost display text does not. If the ghost text contains spaces
   (e.g., args hints like `<track-id>`), the rendering may differ. Both
   should use consistent whitespace handling.
