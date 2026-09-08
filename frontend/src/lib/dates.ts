export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function combineDateTime(dateKey: string, time: string): string {
  return new Date(`${dateKey}T${time}`).toISOString();
}

export function toLocalDateInput(iso: string): string {
  return toLocalDateKey(new Date(iso));
}

export function toLocalTimeInput(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function dayBounds(
  dateKey: string
): { startDate: string; endDate: string } {
  const start = new Date(`${dateKey}T00:00:00`);
  const end = new Date(`${dateKey}T23:59:59.999`);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

export function weekBounds(
  date: Date
): { startDate: string; endDate: string } {
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = addDays(date, diffToMonday);
  const sunday = addDays(monday, 6);
  const start = new Date(
    monday.getFullYear(),
    monday.getMonth(),
    monday.getDate(),
    0,
    0,
    0,
    0
  );
  const end = new Date(
    sunday.getFullYear(),
    sunday.getMonth(),
    sunday.getDate(),
    23,
    59,
    59,
    999
  );
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

export function weekDays(date: Date): Date[] {
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = addDays(date, diffToMonday);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function monthBounds(
  date: Date
): { startDate: string; endDate: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDuration(startIso: string, endIso: string): string {
  const minutes = Math.round(
    (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000
  );
  return formatMinutes(minutes);
}

export function formatMinutes(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return toLocalDateKey(a) === toLocalDateKey(b);
}