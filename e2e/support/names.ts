/**
 * Derives a journey's database suffix from its title alone: lowercase, with runs outside `a-z0-9` replaced by
 * hyphens, edge hyphens stripped, truncated to 52 characters, and prefixed `e2e-`, so it fits the 56-character
 * provisioning limit. Throws when no slug remains. Global setup detects collisions.
 */
export function databaseSuffix(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 52)
    .replace(/-$/g, '');
  if (!slug) throw new Error(`Cannot derive a database name from: ${title}`);
  return `e2e-${slug}`;
}
