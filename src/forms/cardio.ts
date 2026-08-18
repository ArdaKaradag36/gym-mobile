export const CARDIO_TEMPOS = [
  { key: 'slow', label: 'Yavaş' },
  { key: 'moderate', label: 'Orta' },
  { key: 'fast', label: 'Hızlı' },
] as const;

export type CardioParams = {
  minutes: string;
  tempo: string;
};

export function parseCardioParams(raw?: string | null): CardioParams {
  if (!raw?.trim()) return { minutes: '20', tempo: 'moderate' };
  try {
    const parsed = JSON.parse(raw) as { minutes?: unknown; dk?: unknown; tempo?: unknown };
    return {
      minutes: String(parsed.minutes ?? parsed.dk ?? '20'),
      tempo: String(parsed.tempo ?? 'moderate'),
    };
  } catch {
    const minutes = raw.replace(/[^\d]/g, '') || '20';
    return { minutes, tempo: 'moderate' };
  }
}

export function encodeCardioParams(params: CardioParams): string {
  return JSON.stringify({
    minutes: params.minutes.trim(),
    tempo: params.tempo,
  });
}

export function cardioTempoLabel(tempo?: string | null) {
  const found = CARDIO_TEMPOS.find((item) => item.key === tempo);
  return found?.label ?? tempo ?? 'Orta';
}

export function formatCardioSummary(raw?: string | null) {
  const { minutes, tempo } = parseCardioParams(raw);
  return `${minutes || '—'} dk · ${cardioTempoLabel(tempo)}`;
}
