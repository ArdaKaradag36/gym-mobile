export const FORGE_YOUTUBE_URL = 'https://www.youtube.com/watch?v=dw0kt0TQJAY';

export function exerciseVideoUrl(url?: string | null) {
  const trimmed = url?.trim();
  return trimmed || FORGE_YOUTUBE_URL;
}

export const MUSCLE_GROUPS = [
  { key: 'chest', label: 'Göğüs' },
  { key: 'back', label: 'Sırt' },
  { key: 'legs', label: 'Bacak' },
  { key: 'shoulders', label: 'Omuz' },
  { key: 'arms', label: 'Kol' },
  { key: 'core', label: 'Karın' },
  { key: 'cardio', label: 'Kardiyo' },
  { key: 'push', label: 'İtme' },
  { key: 'pull', label: 'Çekme' },
] as const;

export type MuscleGroupKey = (typeof MUSCLE_GROUPS)[number]['key'];

export function muscleGroupLabel(key?: string | null) {
  if (!key) return 'Diğer';
  const found = MUSCLE_GROUPS.find((item) => item.key === key.toLowerCase());
  return found?.label ?? key;
}
