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
  { key: 'push', label: 'İtme' },
  { key: 'pull', label: 'Çekme' },
] as const;

export type MuscleGroupKey = (typeof MUSCLE_GROUPS)[number]['key'];

export function muscleGroupLabel(key?: string | null) {
  if (!key) return 'Diğer';
  if (key.toLowerCase() === 'cardio') return 'Kardiyo';
  const found = MUSCLE_GROUPS.find((item) => item.key === key.toLowerCase());
  return found?.label ?? key;
}

const MUSCLE_GROUP_FILTERS: Record<string, string[]> = {
  chest: ['chest'],
  back: ['back'],
  legs: ['legs'],
  shoulders: ['shoulders'],
  arms: ['arms'],
  core: ['core'],
  push: ['chest', 'shoulders', 'arms', 'push'],
  pull: ['back', 'arms', 'pull'],
  cardio: ['cardio'],
};

export function exercisesForMuscleGroup<T extends { category?: string | null; is_cardio?: boolean }>(
  exercises: T[],
  muscleGroup?: string | null,
): T[] {
  if (!muscleGroup?.trim()) return exercises;
  const key = muscleGroup.toLowerCase();
  const categories = MUSCLE_GROUP_FILTERS[key] ?? [key];
  return exercises.filter((item) => {
    if (item.is_cardio) return categories.includes('cardio');
    const category = item.category?.toLowerCase();
    return category ? categories.includes(category) : false;
  });
}
