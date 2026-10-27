/** Derive a PostgreSQL suffix solely from the journey name (56-character provisioning limit). */
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
