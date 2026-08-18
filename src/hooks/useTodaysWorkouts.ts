import { useCallback, useEffect, useState } from 'react';

import {
  fetchTodaysWorkoutPlan,
  type TodaysWorkoutPlan,
  type WorkoutWithExercise,
  updateWorkoutCompletion,
  updateWorkoutWeight,
} from '../services/workouts';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';

export function useTodaysWorkouts() {
  const [plan, setPlan] = useState<TodaysWorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured) {
        setPlan(null);
        setError('Supabase ayarlı değil. .env anahtarlarını kontrol et.');
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setPlan(null);
        setError('Bugünkü antrenmanı görmek için giriş yap.');
        return;
      }

      const data = await fetchTodaysWorkoutPlan(user.id);
      setPlan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Antrenmanlar yüklenemedi');
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleComplete = useCallback(async (workout: WorkoutWithExercise) => {
    const next = !workout.is_completed;
    setUpdatingId(workout.id);
    setPlan((current) => {
      if (!current) return current;
      return {
        ...current,
        daily_workouts: current.daily_workouts.map((item) =>
          item.id === workout.id ? { ...item, is_completed: next } : item,
        ),
      };
    });

    try {
      await updateWorkoutCompletion(workout.id, next);
    } catch (err) {
      setPlan((current) => {
        if (!current) return current;
        return {
          ...current,
          daily_workouts: current.daily_workouts.map((item) =>
            item.id === workout.id
              ? { ...item, is_completed: workout.is_completed }
              : item,
          ),
        };
      });
      setError(err instanceof Error ? err.message : 'Egzersiz güncellenemedi');
    } finally {
      setUpdatingId(null);
    }
  }, []);

  const saveWeight = useCallback(
    async (workoutId: string, weightText: string) => {
      const trimmed = weightText.trim();
      const parsed = trimmed === '' ? null : Number(trimmed);

      if (parsed !== null && Number.isNaN(parsed)) {
        setError('Geçerli bir kilo gir.');
        return;
      }

      setUpdatingId(workoutId);
      setPlan((current) => {
        if (!current) return current;
        return {
          ...current,
          daily_workouts: current.daily_workouts.map((item) =>
            item.id === workoutId
              ? { ...item, actual_weight_used: parsed == null ? null : String(parsed) }
              : item,
          ),
        };
      });

      try {
        await updateWorkoutWeight(workoutId, parsed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Kilo kaydedilemedi');
        await refresh();
      } finally {
        setUpdatingId(null);
      }
    },
    [refresh],
  );

  const workouts = plan?.daily_workouts ?? [];
  const completedCount = workouts.filter((item) => item.is_completed).length;

  return {
    plan,
    workouts,
    completedCount,
    loading,
    error,
    updatingId,
    refresh,
    toggleComplete,
    saveWeight,
  };
}
