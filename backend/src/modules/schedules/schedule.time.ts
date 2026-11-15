const WITA_OFFSET = '+08:00';

export function startOfDayWita(value: string): Date {
  return new Date(`${value}T00:00:00.000${WITA_OFFSET}`);
}

export function endOfDayWita(value: string): Date {
  return new Date(`${value}T23:59:59.999${WITA_OFFSET}`);
}
