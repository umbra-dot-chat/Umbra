/** Convert a display name to a URL-safe slug: "DatePicker" → "date-picker" */
export function toSlug(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/** Build a detail route path from category + slug. */
export function detailPath(category: string, slug: string): string {
  return `/${category}/${slug}`;
}
