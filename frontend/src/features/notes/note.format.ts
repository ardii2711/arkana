const timestampFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Makassar',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatNoteTimestamp(value: string) {
  return timestampFormatter.format(new Date(value));
}
