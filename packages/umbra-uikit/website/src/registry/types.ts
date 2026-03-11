import type React from 'react';

/** Definition for a single component prop (for the props table). */
export interface PropDef {
  name: string;
  type: string;
  default?: string;
  required?: boolean;
  description: string;
}

/** A single example section on a component detail page. */
export interface ExampleDef {
  title: string;
  render: React.ReactNode;
  code: string;
  /** Optional React Native code snippet shown in a separate tab. */
  rnCode?: string;
}

/** Category grouping for registry entries. */
export type ComponentCategory = 'tokens' | 'primitives' | 'layouts' | 'components';

/** Full metadata for a single registry entry. */
export interface ComponentEntry {
  slug: string;
  name: string;
  category: ComponentCategory;
  /** Optional subcategory for grouping within a category page. */
  subcategory?: string;
  description: string;
  cardPreview: React.ReactNode;
  variantCount?: number;
  examples: ExampleDef[];
  props: PropDef[];
  rnCode?: string;
  keywords?: string[];
}
