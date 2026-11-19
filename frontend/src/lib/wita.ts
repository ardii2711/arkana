// Satu sumber WITA (Asia/Makassar) untuk seluruh frontend.
export const WITA = 'Asia/Makassar';
export const WITA_OFFSET = '+08:00';

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: WITA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: WITA,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** 'YYYY-MM-DD' dalam WITA. */
export function witaDatePart(value: string | Date) {
  return dateFormatter.format(new Date(value));
}

/** 'HH:mm' dalam WITA. */
export function witaTimePart(value: string | Date) {
  return timeFormatter.format(new Date(value));
}

/** ISO string untuk tanggal+jam WITA (dikirim ke API). */
export function toWitaIso(date: string, time: string) {
  return new Date(`${date}T${time}:00${WITA_OFFSET}`).toISOString();
}

export function currentWitaDate() {
  return witaDatePart(new Date());
}

/** Tambah hari pada tanggal WITA 'YYYY-MM-DD'. */
export function addDaysWita(value: string, days: number) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

/** Rentang minggu Senin–Minggu (WITA) untuk tanggal yang diberikan. */
export function weekRangeWita(date: string) {
  const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  const from = addDaysWita(date, offset);

  return { from, to: addDaysWita(from, 6) };
}

/** Rentang satu bulan (WITA) untuk tanggal yang diberikan. */
export function monthRangeWita(fromDate: string) {
  const year = Number(fromDate.slice(0, 4));
  const month = Number(fromDate.slice(5, 7));
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return {
    from: `${fromDate.slice(0, 7)}-01`,
    to: `${fromDate.slice(0, 7)}-${String(lastDay).padStart(2, '0')}`,
  };
}

/** Rentang “Mendatang”: hari ini sampai 30 hari ke depan. */
export function upcomingRangeWita(today: string) {
  return { from: today, to: addDaysWita(today, 30) };
}
