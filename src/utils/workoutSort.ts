import type { DailyWorkout } from '../types/database';

const MUSCLE_RANK: Record<string, number> = {
  chest: 10,
  shoulders: 20,
  triceps: 30,
  push: 35,
  back: 40,
  biceps: 50,
  pull: 55,
  arms: 60,
  legs: 70,
  core: 80,
  cardio: 900,
};

function muscleRank(workout: Pick<DailyWorkout, 'muscle_group' | 'is_cardio'>): number {
  if (workout.is_cardio) return 900;
  const key = (workout.muscle_group ?? '').toLowerCase();
  return MUSCLE_RANK[key] ?? 100;
}

function byPlanOrder<T extends Pick<DailyWorkout, 'order_index' | 'is_cardio' | 'muscle_group'>>(
  a: T,
  b: T,
) {
  const muscle = muscleRank(a) - muscleRank(b);
  if (muscle !== 0) return muscle;
  return (a.order_index ?? 0) - (b.order_index ?? 0);
}

/** Muscle groups in plan order; cardio last. Completion does not reshuffle cards. */
export function sortStudentWorkouts<
  T extends Pick<DailyWorkout, 'order_index' | 'is_completed' | 'is_cardio' | 'muscle_group'>,
>(workouts: T[]): T[] {
  const cardio = workouts.filter((item) => item.is_cardio);
  const rest = workouts.filter((item) => !item.is_cardio);
  return [...rest.slice().sort(byPlanOrder), ...cardio.slice().sort(byPlanOrder)];
}

export function groupStudentWorkouts<
  T extends Pick<DailyWorkout, 'order_index' | 'is_completed' | 'is_cardio' | 'muscle_group'>,
>(workouts: T[]): Array<{ key: string; items: T[] }> {
  const groups: Array<{ key: string; items: T[] }> = [];
  for (const item of sortStudentWorkouts(workouts)) {
    const key = item.is_cardio ? 'cardio' : (item.muscle_group || 'other').toLowerCase();
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(item);
    } else {
      groups.push({ key, items: [item] });
    }
  }
  return groups;
}
