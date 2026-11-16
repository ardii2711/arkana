export function getDisplayName(user: {
  titleBefore?: string | null;
  name: string;
  titleAfter?: string | null;
}): string {
  return [user.titleBefore, user.name, user.titleAfter]
    .map((part) => part?.trim() ?? '')
    .filter(Boolean)
    .join(' ');
}
