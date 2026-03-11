# Wisp Enforcement Rules

These rules are mandatory for ALL agents that touch UI code. Violations are treated as bugs.

## Rule 1: Zero Custom UI Primitives

If a component exists in Wisp, you MUST use it. No exceptions. No "quick" custom versions. No "temporary" wrappers.

Wisp provides 38 primitives, 21 layouts, and 150+ composed components. Before creating any UI element, search `AGENTS/domain/wisp-uikit.md` for an existing component.

**Common violations:**
- Custom `<TouchableOpacity>` button → Use `<Button>` from Wisp
- Custom `<TextInput>` wrapper → Use `<Input>` from Wisp
- Custom card/panel `<View>` → Use `<Card>` or `<Box>` from Wisp
- Custom modal → Use `<Dialog>` or `<Sheet>` from Wisp
- Custom avatar circle → Use `<Avatar>` from Wisp
- Custom toggle/switch → Use `<Toggle>` from Wisp
- Custom dropdown → Use `<Select>` or `<DropdownMenu>` from Wisp
- Custom tabs → Use `<Tabs>` or `<SegmentedControl>` from Wisp
- Custom list item → Use `<ListItem>` from Wisp
- Custom badge/chip → Use `<Badge>` or `<Chip>` from Wisp
- Custom tooltip → Use `<Tooltip>` from Wisp
- Custom progress bar → Use `<Progress>` from Wisp

## Rule 2: Audit on Entry

When a frontend-engineer (or any agent touching UI) begins a task, it MUST:

1. **Scan the files it will modify** for Wisp violations before writing any new code
2. **Catalog any violations found** using the format below
3. **Report violations to the user** before proceeding with the assigned task
4. **Ask the user**: "I found N Wisp violations in the files I'm about to modify. Should I fix them as part of this task?"

This audit takes priority over the assigned task. Do NOT silently ignore violations.

## Rule 3: No StyleSheet.create()

All styling is done through Wisp component props. Never import `StyleSheet` from `react-native`.

```typescript
// WRONG
const styles = StyleSheet.create({ container: { padding: 16, backgroundColor: '#1a1a1a' } });

// RIGHT
<Box padding={16} style={{ backgroundColor: colors.background.surface }}>
```

## Rule 4: No Hardcoded Colors

All colors come from `useTheme()` tokens. No hex values, no rgb(), no hardcoded color strings.

```typescript
// WRONG
style={{ color: '#ffffff', backgroundColor: '#2a2a2a' }}

// RIGHT
style={{ color: colors.text.primary, backgroundColor: colors.background.surface }}
```

## Rule 5: No Arbitrary Spacing

Use the spacing scale: 4, 8, 12, 16, 24, 32, 48. No values like `padding: 15` or `margin: 7`.

## Violation Catalog Format

When reporting violations, use this exact format:

```
## Wisp Violations Found

| # | File | Line | Violation | Wisp Replacement |
|---|------|------|-----------|-----------------|
| 1 | src/components/chat/ChatHeader.tsx | 42 | Custom `<TouchableOpacity>` button | `<Button>` from Wisp |
| 2 | src/components/chat/ChatHeader.tsx | 67 | `StyleSheet.create()` | Use Wisp component props |
| 3 | src/components/settings/Profile.tsx | 15 | Hardcoded color `#fff` | `colors.text.primary` |

**Total: 3 violations in 2 files**

Should I fix these before proceeding with the assigned task?
```

## Scanning Procedure

To scan for violations, check for:

1. **`StyleSheet.create`** — grep for this pattern. Any occurrence is a violation.
2. **`TouchableOpacity` / `Pressable`** used as buttons — should be `<Button>`
3. **`TextInput`** from react-native — should be `<Input>` or `<TextArea>` from Wisp
4. **Hardcoded color values** — hex codes (`#xxx`), `rgb()`, `rgba()`, named colors
5. **`<View>` used for layout** that should be `<Box>`, `<Stack>`, `<Card>`, etc.
6. **Custom wrapper components** that duplicate Wisp functionality
7. **Inline fontSize/fontWeight** — should use Wisp `<Text>` variant props

## When Wisp Doesn't Have What You Need

If you genuinely need a UI pattern that doesn't exist in Wisp:

1. **First**: Compose existing Wisp components to achieve the pattern
2. **Second**: If composition won't work, build the new component INSIDE Wisp at `packages/umbra-uikit/packages/react-native/src/components/` or `src/primitives/`
3. **Never**: Create the component in `src/components/` as a custom app-level element

New Wisp components must:
- Use Wisp tokens for all colors, spacing, and typography
- Accept a `style` prop for composability
- Use `useTheme()` for theming
- Be exported from the package index
