export function parseSetsReps(raw?: string | null): { sets: string; reps: string } {
  const trimmed = raw?.trim() ?? '';
  if (!trimmed || trimmed === '*') return { sets: '', reps: '' };

  const star = trimmed.indexOf('*');
  if (star >= 0) {
    return {
      sets: digits(trimmed.slice(0, star)),
      reps: digits(trimmed.slice(star + 1)),
    };
  }

  const crossed = trimmed.match(/^(\d+)\s*[xX×]\s*(.+)$/);
  if (crossed) {
    return { sets: crossed[1], reps: digits(crossed[2]) };
  }

  return { sets: '', reps: digits(trimmed) };
}

export function formatSetsReps(sets: string, reps: string): string {
  const nextSets = digits(sets);
  const nextReps = digits(reps);
  if (!nextSets && !nextReps) return '';
  return `${nextSets}*${nextReps}`;
}

export function normalizeSetsReps(raw?: string | null): string {
  const { sets, reps } = parseSetsReps(raw);
  return formatSetsReps(sets, reps);
}

function digits(value: string) {
  return value.match(/\d+/)?.[0] ?? '';
}
