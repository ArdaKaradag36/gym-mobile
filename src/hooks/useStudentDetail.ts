import { useCallback, useEffect, useState } from 'react';

import type { Measurement } from '../types/database';
import {
  addStudentMeasurement,
  assignDietMeal,
  assignWorkoutExercise,
  fetchStudentMeasurements,
  fetchStudentPlanForDate,
  type StudentPlanDay,
} from '../services/trainer';
import type { MealType } from '../types/database';
import { todayIsoDate } from '../utils/format';

export function useStudentDetail(studentId: string) {
  const [date, setDate] = useState(todayIsoDate());
  const [plan, setPlan] = useState<StudentPlanDay | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [planData, measurementData] = await Promise.all([
        fetchStudentPlanForDate(studentId, date),
        fetchStudentMeasurements(studentId),
      ]);
      setPlan(planData);
      setMeasurements(measurementData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load student detail');
    } finally {
      setLoading(false);
    }
  }, [studentId, date]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addWorkout = useCallback(
    async (params: {
      exerciseId: string;
      targetSets: number;
      targetReps: number;
      workoutTitle?: string;
    }) => {
      setSaving(true);
      setError(null);
      try {
        await assignWorkoutExercise({
          studentId,
          date,
          ...params,
        });
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to assign workout');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [studentId, date, refresh],
  );

  const addDiet = useCallback(
    async (params: { mealType: MealType; content: string }) => {
      setSaving(true);
      setError(null);
      try {
        await assignDietMeal({
          studentId,
          date,
          ...params,
        });
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to assign diet');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [studentId, date, refresh],
  );

  const addMeasurement = useCallback(
    async (params: { weight: number; bodyFat: number | null }) => {
      setSaving(true);
      setError(null);
      try {
        await addStudentMeasurement(studentId, {
          date,
          weight: params.weight,
          body_fat: params.bodyFat,
        });
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save measurement');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [studentId, date, refresh],
  );

  return {
    date,
    setDate,
    plan,
    measurements,
    loading,
    saving,
    error,
    refresh,
    addWorkout,
    addDiet,
    addMeasurement,
  };
}
