export function withAlpha(hex: string, alpha: number) {
  if (!hex.startsWith('#') || hex.length < 7) {
    return hex;
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function todayIsoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysIso(startDate: string, days: number): string {
  const [year, month, day] = startDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function daysBetweenIso(fromDate: string, toDate: string): number {
  const from = Date.parse(`${fromDate}T00:00:00Z`);
  const to = Date.parse(`${toDate}T00:00:00Z`);
  return Math.round((to - from) / 86_400_000);
}

const WEEKDAYS_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'] as const;
const MONTHS_SHORT = [
  'Oca',
  'Şub',
  'Mar',
  'Nis',
  'May',
  'Haz',
  'Tem',
  'Ağu',
  'Eyl',
  'Eki',
  'Kas',
  'Ara',
] as const;

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

function parseIsoDateParts(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return null;
  return { year, month, day, date: new Date(year, month - 1, day) };
}

export function formatShortDate(isoDate: string) {
  const parts = parseIsoDateParts(isoDate);
  if (!parts) return isoDate;
  return `${WEEKDAYS_SHORT[parts.date.getDay()]} ${parts.day} ${MONTHS_SHORT[parts.month - 1]}`;
}

export function formatWeekdayDay(isoDate: string) {
  const parts = parseIsoDateParts(isoDate);
  if (!parts) return isoDate;
  return `${WEEKDAYS_SHORT[parts.date.getDay()]} ${parts.day}`;
}

export function formatNumericDate(isoDate: string) {
  const parts = parseIsoDateParts(isoDate);
  if (!parts) return isoDate;
  return `${pad2(parts.day)}.${pad2(parts.month)}.${parts.year}`;
}

export function initialsFromName(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function formatNoteTime(iso: string) {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return '';
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function parseOptionalNumber(value: string | number | null | undefined): number | null {
  if (value == null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
