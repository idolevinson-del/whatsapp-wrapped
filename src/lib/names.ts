/**
 * Returns the first name from a full display name, for privacy on
 * person-referencing cards (e.g. "Jane Doe" -> "Jane").
 */
export function firstName(fullName: string): string {
  const trimmed = fullName.trim();
  const spaceIndex = trimmed.search(/\s/);
  return spaceIndex === -1 ? trimmed : trimmed.slice(0, spaceIndex);
}
