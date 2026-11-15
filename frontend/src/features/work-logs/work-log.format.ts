const activityDateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function formatActivityDate(value: string) {
  return activityDateFormatter.format(new Date(`${value}T00:00:00`));
}
