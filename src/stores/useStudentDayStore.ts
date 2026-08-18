import { create } from 'zustand';

import {
  fetchStudentProgramDays,
  fetchTodaysWorkoutPlan,
  updateDietCompletion,
  updatePlanWater,
  updateWorkoutCompletion,
  updateWorkoutWeight,
  type StudentPlanDay,
  type WorkoutWithExercise,
} from '../services/workouts';
import type { Program } from '../types/database';
import { todayIsoDate } from '../utils/format';
import { sortStudentWorkouts } from '../utils/workoutSort';

type StudentDayState = {
  program: Program | null;
  days: StudentPlanDay[];
  today: StudentPlanDay | null;
  loading: boolean;
  error: string | null;
  updatingId: string | null;
  load: (studentId: string, opts?: { silent?: boolean }) => Promise<void>;
  toggleWorkout: (workout: WorkoutWithExercise, planId: string) => Promise<void>;
  saveWeight: (workoutId: string, planId: string, weightText: string) => Promise<void>;
  toggleMeal: (dietId: string, planId: string, next: boolean) => Promise<void>;
  adjustWater: (delta: number) => Promise<void>;
};

let waterTimer: ReturnType<typeof setTimeout> | null = null;

function patchDay(
  days: StudentPlanDay[],
  planId: string,
  mapper: (day: StudentPlanDay) => StudentPlanDay,
) {
  return days.map((day) => (day.id === planId ? mapper(day) : day));
}

export const useStudentDayStore = create<StudentDayState>((set, get) => ({
  program: null,
  days: [],
  today: null,
  loading: false,
  error: null,
  updatingId: null,

  load: async (studentId, opts) => {
    if (!opts?.silent) set({ loading: true, error: null });
    else set({ error: null });
    try {
      const [bundle, todayPlan] = await Promise.all([
        fetchStudentProgramDays(studentId, { status: 'active' }),
        fetchTodaysWorkoutPlan(studentId),
      ]);
      set({
        program: bundle?.program ?? null,
        days: bundle?.days ?? [],
        today: todayPlan,
        loading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Program yüklenemedi',
        loading: false,
        program: null,
        days: [],
        today: null,
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

  saveWeight: async (workoutId, planId, weightText) => {
    const trimmed = weightText.trim();
    const mapWorkouts = (day: StudentPlanDay): StudentPlanDay => ({
      ...day,
      daily_workouts: day.daily_workouts.map((item) =>
        item.id === workoutId ? { ...item, actual_weight_used: trimmed || null } : item,
      ),
    });
    set((state) => ({
      days: patchDay(state.days, planId, mapWorkouts),
      today: state.today?.id === planId ? mapWorkouts(state.today) : state.today,
    }));
    await updateWorkoutWeight(workoutId, trimmed || null);
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
    const next = Math.max(0, Number(today.water_consumed ?? 0) + delta);
    set({
      today: { ...today, water_consumed: next },
      days: patchDay(get().days, today.id, (day) => ({ ...day, water_consumed: next })),
    });

    if (waterTimer) clearTimeout(waterTimer);
    waterTimer = setTimeout(() => {
      void updatePlanWater(today.id, next);
    }, 400);
  },
}));

export function daysLeftInProgram(program: Program | null): number | null {
  if (!program?.end_date) return null;
  const today = todayIsoDate();
  const from = Date.parse(`${today}T00:00:00Z`);
  const to = Date.parse(`${program.end_date}T00:00:00Z`);
  return Math.max(0, Math.round((to - from) / 86_400_000));
}
