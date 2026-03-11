/**
 * @module theme/editor-fields
 * @description Data-driven schema describing every editable token in the Wisp
 * theme system. Both React DOM and React Native import this schema and render
 * platform-appropriate controls based on each field's `control` type.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Top-level tabs in the ThemeEditor. */
export type ThemeEditorTab = 'colors' | 'spacing' | 'typography' | 'radii';

/** Control type that determines which UI primitive renders for a field. */
export type ThemeEditorControlType = 'color' | 'slider' | 'number' | 'text';

/** Metadata for numeric controls (slider / number input). */
export interface ThemeEditorFieldMeta {
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
}

/**
 * Describes a single editable token in the theme.
 *
 * The `path` is a dot-delimited key into the resolved `WispTheme` object
 * (e.g. `'colors.background.canvas'`). The React/RN ThemeEditor reads the
 * current value via {@link getNestedValue} and writes overrides via
 * {@link setNestedValue}.
 */
export interface ThemeEditorFieldDescriptor {
  /** Dot-path into the theme object (e.g. `'colors.background.canvas'`). */
  path: string;
  /** Human-readable label (e.g. `'Canvas'`). */
  label: string;
  /** Section group name (e.g. `'Background'`). */
  group: string;
  /** Which top-level tab this field belongs to. */
  tab: ThemeEditorTab;
  /** Which control to render. */
  control: ThemeEditorControlType;
  /** Optional constraints for numeric controls. */
  meta?: ThemeEditorFieldMeta;
}

/** Tab definition for the ThemeEditor. */
export interface ThemeEditorTabDef {
  value: ThemeEditorTab;
  label: string;
}

/** A group of fields sharing the same `group` name. */
export interface ThemeEditorFieldGroup {
  name: string;
  fields: ThemeEditorFieldDescriptor[];
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

export const themeEditorTabs: ThemeEditorTabDef[] = [
  { value: 'colors', label: 'Colors' },
  { value: 'spacing', label: 'Spacing' },
  { value: 'typography', label: 'Typography' },
  { value: 'radii', label: 'Radii' },
];

// ---------------------------------------------------------------------------
// Field helpers (internal)
// ---------------------------------------------------------------------------

function colorField(
  group: string,
  token: string,
  label: string,
  groupPath: string,
): ThemeEditorFieldDescriptor {
  return {
    path: `colors.${groupPath}.${token}`,
    label,
    group,
    tab: 'colors',
    control: 'color',
  };
}

function colorGroup(
  group: string,
  groupPath: string,
  tokens: [string, string][],
): ThemeEditorFieldDescriptor[] {
  return tokens.map(([token, label]) => colorField(group, token, label, groupPath));
}

function spacingField(token: string, label: string): ThemeEditorFieldDescriptor {
  return {
    path: `spacing.${token}`,
    label,
    group: 'Spacing',
    tab: 'spacing',
    control: 'slider',
    meta: { min: 0, max: 128, step: 1, unit: 'px' },
  };
}

function typographySizeField(
  step: string,
  stepLabel: string,
  prop: 'fontSize' | 'lineHeight',
  propLabel: string,
): ThemeEditorFieldDescriptor {
  return {
    path: `typography.sizes.${step}.${prop}`,
    label: `${stepLabel} ${propLabel}`,
    group: `Size: ${stepLabel}`,
    tab: 'typography',
    control: 'number',
    meta: { min: 6, max: 96, step: 1, unit: 'px' },
  };
}

function typographyWeightField(
  weight: string,
  label: string,
): ThemeEditorFieldDescriptor {
  return {
    path: `typography.weights.${weight}`,
    label,
    group: 'Font Weights',
    tab: 'typography',
    control: 'number',
    meta: { min: 100, max: 900, step: 100 },
  };
}

function radiiField(token: string, label: string): ThemeEditorFieldDescriptor {
  return {
    path: `radii.${token}`,
    label,
    group: 'Border Radius',
    tab: 'radii',
    control: 'slider',
    meta: { min: 0, max: 32, step: 1, unit: 'px' },
  };
}

// ---------------------------------------------------------------------------
// Field definitions
// ---------------------------------------------------------------------------

export const themeEditorFields: ThemeEditorFieldDescriptor[] = [
  // ---- Colors: Background ----
  ...colorGroup('Background', 'background', [
    ['canvas', 'Canvas'],
    ['sunken', 'Sunken'],
    ['surface', 'Surface'],
    ['raised', 'Raised'],
    ['overlay', 'Overlay'],
  ]),

  // ---- Colors: Text ----
  ...colorGroup('Text', 'text', [
    ['primary', 'Primary'],
    ['secondary', 'Secondary'],
    ['muted', 'Muted'],
    ['inverse', 'Inverse'],
    ['link', 'Link'],
    ['onRaised', 'On Raised'],
    ['onRaisedSecondary', 'On Raised Secondary'],
  ]),

  // ---- Colors: Border ----
  ...colorGroup('Border', 'border', [
    ['subtle', 'Subtle'],
    ['strong', 'Strong'],
    ['focus', 'Focus'],
    ['active', 'Active'],
  ]),

  // ---- Colors: Accent ----
  ...colorGroup('Accent', 'accent', [
    ['primary', 'Primary'],
    ['primaryHover', 'Primary Hover'],
    ['primaryActive', 'Primary Active'],
    ['secondary', 'Secondary'],
    ['highlight', 'Highlight'],
    ['highlightRaised', 'Highlight Raised'],
    ['mutedRaised', 'Muted Raised'],
    ['dividerRaised', 'Divider Raised'],
  ]),

  // ---- Colors: Status ----
  ...colorGroup('Status', 'status', [
    ['success', 'Success'],
    ['successSurface', 'Success Surface'],
    ['successBorder', 'Success Border'],
    ['warning', 'Warning'],
    ['warningSurface', 'Warning Surface'],
    ['warningBorder', 'Warning Border'],
    ['danger', 'Danger'],
    ['dangerSurface', 'Danger Surface'],
    ['dangerBorder', 'Danger Border'],
    ['info', 'Info'],
    ['infoSurface', 'Info Surface'],
    ['infoBorder', 'Info Border'],
  ]),

  // ---- Colors: Brand ----
  ...colorGroup('Brand', 'brand', [
    ['primary', 'Primary'],
    ['hover', 'Hover'],
    ['active', 'Active'],
    ['surface', 'Surface'],
    ['border', 'Border'],
    ['text', 'Text'],
  ]),

  // ---- Colors: Data ----
  ...colorGroup('Data', 'data', [
    ['blue', 'Blue'],
    ['violet', 'Violet'],
    ['amber', 'Amber'],
    ['emerald', 'Emerald'],
    ['cyan', 'Cyan'],
  ]),

  // ---- Colors: Palette ----
  ...colorGroup('Palette', 'palette', [
    ['creamyPeach', 'Creamy Peach'],
    ['rosyHighlight', 'Rosy Highlight'],
    ['softBlue', 'Soft Blue'],
    ['brewedMustard', 'Brewed Mustard'],
    ['oldGeranium', 'Old Geranium'],
    ['sawtoothOak', 'Sawtooth Oak'],
    ['summertime', 'Summertime'],
    ['cornflower', 'Cornflower'],
    ['tigerlily', 'Tigerlily'],
    ['deepRose', 'Deep Rose'],
    ['purpleMountainMajesty', 'Purple Mountain Majesty'],
    ['roguePink', 'Rogue Pink'],
    ['squeaky', 'Squeaky'],
    ['appleValley', 'Apple Valley'],
    ['pencilLead', 'Pencil Lead'],
    ['purpleCorallite', 'Purple Corallite'],
    ['flamingoPink', 'Flamingo Pink'],
    ['blueCuracao', 'Blue Curacao'],
    ['porcelainRose', 'Porcelain Rose'],
    ['biscay', 'Biscay'],
  ]),

  // ---- Spacing ----
  spacingField('none', 'None'),
  spacingField('2xs', '2XS'),
  spacingField('xs', 'XS'),
  spacingField('sm', 'SM'),
  spacingField('md', 'MD'),
  spacingField('lg', 'LG'),
  spacingField('xl', 'XL'),
  spacingField('2xl', '2XL'),
  spacingField('3xl', '3XL'),
  spacingField('4xl', '4XL'),

  // ---- Typography: Font Family ----
  {
    path: 'typography.fontFamily',
    label: 'Font Family',
    group: 'Font Family',
    tab: 'typography',
    control: 'text',
    meta: { placeholder: 'system-ui, sans-serif' },
  },

  // ---- Typography: Size Steps ----
  ...(['2xs', 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'] as const).flatMap(
    (step) => {
      const stepLabel = step.toUpperCase();
      return [
        typographySizeField(step, stepLabel, 'fontSize', 'Size'),
        typographySizeField(step, stepLabel, 'lineHeight', 'Line Height'),
      ];
    },
  ),

  // ---- Typography: Weights ----
  typographyWeightField('regular', 'Regular'),
  typographyWeightField('medium', 'Medium'),
  typographyWeightField('semibold', 'Semibold'),
  typographyWeightField('bold', 'Bold'),

  // ---- Radii ----
  radiiField('sm', 'Small'),
  radiiField('md', 'Medium'),
  radiiField('lg', 'Large'),
  radiiField('xl', 'Extra Large'),
  radiiField('full', 'Full'),
];

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

/** Return all fields for a given tab. */
export function getFieldsByTab(tab: ThemeEditorTab): ThemeEditorFieldDescriptor[] {
  return themeEditorFields.filter((f) => f.tab === tab);
}

/** Return fields grouped by their `group` property for a given tab. */
export function getGroupsForTab(tab: ThemeEditorTab): ThemeEditorFieldGroup[] {
  const fields = getFieldsByTab(tab);
  const groupMap = new Map<string, ThemeEditorFieldDescriptor[]>();

  for (const field of fields) {
    const existing = groupMap.get(field.group);
    if (existing) {
      existing.push(field);
    } else {
      groupMap.set(field.group, [field]);
    }
  }

  return Array.from(groupMap.entries()).map(([name, groupFields]) => ({
    name,
    fields: groupFields,
  }));
}

// ---------------------------------------------------------------------------
// Dot-path utilities
// ---------------------------------------------------------------------------

/**
 * Read a value from a nested object using a dot-delimited path.
 *
 * @example
 * ```ts
 * getNestedValue(theme, 'colors.background.canvas'); // '#000000'
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

/**
 * Immutably set a value in a nested object using a dot-delimited path.
 * Creates shallow copies at every level along the path.
 *
 * @example
 * ```ts
 * const next = setNestedValue(overrides, 'colors.background.canvas', '#111');
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setNestedValue(obj: Record<string, any>, path: string, value: any): Record<string, any> {
  const keys = path.split('.');
  const result = { ...obj };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = result;

  for (let i = 0; i < keys.length - 1; i++) {
    current[keys[i]] = { ...(current[keys[i]] ?? {}) };
    current = current[keys[i]];
  }

  current[keys[keys.length - 1]] = value;
  return result;
}
