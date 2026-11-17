export const AT_LEAST_ONE_FIELD_MESSAGE = 'Minimal satu field harus diisi';

export function hasAtLeastOneField(value: Record<string, unknown>): boolean {
  return Object.values(value).some((field) => field !== undefined);
}
