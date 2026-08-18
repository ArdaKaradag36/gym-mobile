import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import {
  fetchStudentProgramDays,
  updateDietCompletion,
  updatePlanWater,
  updateWorkoutCompletion,
  type StudentPlanDay,
  type WorkoutWithExercise,
} from '../services/workouts';
import type { Program } from '../types/database';
import { todayIsoDate } from '../utils/format';
import { sortStudentWorkouts } from '../utils/workoutSort';

type Snapshot = {
  program: Program | null;
  days: StudentPlanDay[];
  today: StudentPlanDay | null;
};

type StudentDayState = Snapshot & {
  loading: boolean;
  error: string | null;
  updatingId: string | null;
  load: (studentId: string, opts?: { silent?: boolean }) => Promise<void>;
  toggleWorkout: (workout: WorkoutWithExercise, planId: string) => Promise<void>;
  toggleMeal: (dietId: string, planId: string, next: boolean) => Promise<void>;
  adjustWater: (delta: number) => Promise<void>;
  flushPendingWater: () => Promise<void>;
};

let waterTimer: ReturnType<typeof setTimeout> | null = null;
let pendingWater: { planId: string; amount: number; previous: number } | null = null;

function cacheKey(studentId: string) {
  return `student-plan:${studentId}`;
}

function todayFromDays(days: StudentPlanDay[]): StudentPlanDay | null {
  const today = todayIsoDate();
  return days.find((day) => day.date === today) ?? null;
}

function patchDay(
  days: StudentPlanDay[],
  planId: string,
  mapper: (day: StudentPlanDay) => StudentPlanDay,
) {
  return days.map((day) => (day.id === planId ? mapper(day) : day));
}

async function readCache(studentId: string): Promise<Snapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(studentId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Snapshot;
    if (!Array.isArray(parsed.days)) return null;
    return {
      program: parsed.program ?? null,
      days: parsed.days,
      today: parsed.today ?? todayFromDays(parsed.days),
    };
  } catch {
    return null;
  }
}

async function writeCache(studentId: string, snapshot: Snapshot) {
  try {
    await AsyncStorage.setItem(cacheKey(studentId), JSON.stringify(snapshot));
  } catch {
    // Offline cache is best-effort.
  }
}

async function persistWater(planId: string, amount: number, previous: number) {
  try {
    await updatePlanWater(planId, amount);
  } catch (err) {
    useStudentDayStore.setState((state) => {
      const rollback = (day: StudentPlanDay): StudentPlanDay =>
        day.id === planId ? { ...day, water_consumed: previous } : day;
      return {
        days: state.days.map(rollback),
        today: state.today?.id === planId ? rollback(state.today) : state.today,
        error: err instanceof Error ? err.message : 'Su güncellenemedi',
      };
    });
  }
}

async function flushWater() {
  const pending = pendingWater;
  pendingWater = null;
  if (waterTimer) {
    clearTimeout(waterTimer);
    waterTimer = null;
  }
  if (!pending) return;
  await persistWater(pending.planId, pending.amount, pending.previous);
}

export const useStudentDayStore = create<StudentDayState>((set, get) => ({
  program: null,
  days: [],
  today: null,
  loading: false,
  error: null,
  updatingId: null,

  load: async (studentId, opts) => {
    if (get().updatingId) return;
    if (!opts?.silent) set({ loading: true, error: null });
    else set({ error: null });

    if (get().days.length === 0) {
      const cached = await readCache(studentId);
      if (cached) {
        set({
          ...cached,
          loading: opts?.silent ? get().loading : true,
        });
      }
    }

    try {
      const bundle = await fetchStudentProgramDays(studentId, { status: 'active' });
      const days = bundle?.days ?? [];
      const snapshot: Snapshot = {
        program: bundle?.program ?? null,
        days,
        today: todayFromDays(days),
      };
      set({ ...snapshot, loading: false, error: null });
      await writeCache(studentId, snapshot);
    } catch (err) {
      const cached = get().days.length > 0 ? null : await readCache(studentId);
      set({
        error: err instanceof Error ? err.message : 'Program yüklenemedi',
        loading: false,
        ...(cached ?? {}),
      });
    }
  },

  toggleWorkout: async (workout, planId) => {
    const next = !workout.is_completed;
    const previousDays = get().days;
    const previousToday = get().today;
    set({ updatingId: workout.id });

    const mapWorkouts = (day: StudentPlanDay): StudentPlanDay => ({
      ...day,
      daily_workouts: sortStudentWorkouts(
        day.daily_workouts.map((item) =>
          item.id === workout.id ? { ...item, is_completed: next } : item,
        ),
      ),
    });

    set((state) => ({
      days: patchDay(state.days, planId, mapWorkouts),
      today: state.today?.id === planId ? mapWorkouts(state.today) : state.today,
    }));

    try {
      await updateWorkoutCompletion(workout.id, next);
    } catch (err) {
      set({
        days: previousDays,
        today: previousToday,
        error: err instanceof Error ? err.message : 'Egzersiz güncellenemedi',
      });
    } finally {
      set({ updatingId: null });
    }
  },

  toggleMeal: async (dietId, planId, next) => {
    const previousDays = get().days;
    const previousToday = get().today;
    set({ updatingId: dietId });
    const mapMeals = (day: StudentPlanDay): StudentPlanDay => ({
      ...day,
      daily_diets: day.daily_diets.map((item) =>
        item.id === dietId ? { ...item, is_completed: next } : item,
      ),
    });
    set((state) => ({
      days: patchDay(state.days, planId, mapMeals),
      today: state.today?.id === planId ? mapMeals(state.today) : state.today,
    }));
    try {
      await updateDietCompletion(dietId, next);
    } catch (err) {
      set({
        days: previousDays,
        today: previousToday,
        error: err instanceof Error ? err.message : 'Öğün güncellenemedi',
      });
    } finally {
      set({ updatingId: null });
    }
  },

  adjustWater: async (delta) => {
    const today = get().today;
    if (!today) return;
    const previous = Number(today.water_consumed ?? 0);
    const next = Math.max(0, previous + delta);
    set({
      today: { ...today, water_consumed: next },
      days: patchDay(get().days, today.id, (day) => ({ ...day, water_consumed: next })),
    });

    pendingWater = {
      planId: today.id,
      amount: next,
      previous: pendingWater?.planId === today.id ? pendingWater.previous : previous,
    };
    if (waterTimer) clearTimeout(waterTimer);
    waterTimer = setTimeout(() => {
      void flushWater();
    }, 400);
  },

  flushPendingWater: async () => {
    await flushWater();
  },
}));

export function daysLeftInProgram(program: Program | null): number | null {
  if (!program?.end_date) return null;
  return Math.round(
    (Date.parse(`${program.end_date}T00:00:00Z`) - Date.parse(`${todayIsoDate()}T00:00:00Z`)) /
      86_400_000,
  );
}

export function isProgramEnded(program: Program | null): boolean {
  return Boolean(program?.end_date && program.end_date < todayIsoDate());
}
