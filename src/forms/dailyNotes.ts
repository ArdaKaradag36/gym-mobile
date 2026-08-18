import type { DailyNotesJson } from '../types/database';

export const NOTE_MAX_LENGTH = 400;

export type { DailyNotesJson };

function intern(messages: string[], text: string) {
  const trimmed = text.trim().slice(0, NOTE_MAX_LENGTH);
  if (!trimmed) return -1;
  const existing = messages.indexOf(trimmed);
  if (existing >= 0) return existing;
  messages.push(trimmed);
  return messages.length - 1;
}

export function packDailyNotes(all: string, perDay: string[]): DailyNotesJson {
  const messages: string[] = [];
  const allIndex = intern(messages, all);
  const days: Record<string, number> = {};

  perDay.forEach((note, index) => {
    const messageIndex = intern(messages, note);
    if (messageIndex >= 0 && messageIndex !== allIndex) {
      days[String(index)] = messageIndex;
    }
  });

  if (messages.length === 0) return {};
  const packed: DailyNotesJson = { m: messages };
  if (allIndex >= 0) packed.a = allIndex;
  if (Object.keys(days).length > 0) packed.d = days;
  return packed;
}

export function messageAt(notes: DailyNotesJson | null | undefined, index?: number) {
  if (typeof index !== 'number' || !notes?.m || index < 0) return '';
  return notes.m[index]?.trim() ?? '';
}

export function unpackDailyNotes(notes: DailyNotesJson | null | undefined, dayCount: number) {
  const all = notes?.m?.length
    ? messageAt(notes, notes.a)
    : notes?.all?.trim() ?? '';

  const perDay = Array.from({ length: dayCount }, (_, index) => {
    if (notes?.m?.length && typeof notes.d?.[String(index)] === 'number') {
      const text = messageAt(notes, notes.d[String(index)]);
      return text && text !== all ? text : '';
    }
    const legacy = notes?.days?.[String(index)]?.trim() ?? '';
    return legacy && legacy !== all ? legacy : '';
  });

  return { all, perDay };
}

export function noteForDayIndex(notes: DailyNotesJson | null | undefined, dayIndex: number) {
  if (notes?.m?.length) {
    const override = notes.d?.[String(dayIndex)];
    const fromDay = messageAt(notes, override);
    if (fromDay) return fromDay;
    return messageAt(notes, notes.a);
  }
  const legacyDay = notes?.days?.[String(dayIndex)]?.trim();
  if (legacyDay) return legacyDay;
  return notes?.all?.trim() ?? '';
}

export function clampNote(value: string) {
  return value.slice(0, NOTE_MAX_LENGTH);
}
