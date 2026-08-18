import { z } from 'zod';

import { parseCardioParams } from './cardio';
import { parseSetsReps } from './setsReps';
import { MEAL_LABELS, type MealType } from '../types/database';

export const assignmentFormSchema = z.object({
  title: z.string(),
  trainer_notes: z.string(),
  kcal_target: z.string(),
  start_weight: z.string(),
  target_weight: z.string(),
  protein_g: z.string(),
  carb_g: z.string(),
  fat_g: z.string(),
  days: z.array(
    z.object({
      planId: z.string().optional(),
      date: z.string(),
      workout_title: z.string(),
      daily_note: z.string(),
      water_goal: z.string(),
      is_rest_day: z.boolean(),
      is_training_day: z.boolean(),
      workouts: z.array(
        z.object({
          id: z.string().optional(),
          exercise_id: z.string(),
          muscle_group: z.string(),
          reps_scheme: z.string(),
          rest_seconds: z.string(),
          weight_min: z.string(),
          weight_max: z.string(),
          is_cardio: z.boolean(),
          cardio_params: z.string(),
        }),
      ),
      meals: z.array(
        z.object({
          id: z.string().optional(),
          meal_type: z.string(),
          foods: z.array(
            z.object({
              food_id: z.string(),
              food_name: z.string(),
              amount_grams: z.string(),
              note: z.string(),
              training_day_only: z.boolean(),
            }),
          ),
        }),
      ),
    }),
  ),
});

export function validateAssignment(values: z.infer<typeof assignmentFormSchema>): string | null {
  const parsed = assignmentFormSchema.safeParse(values);
  if (!parsed.success) {
    return 'Form alanlarını kontrol edin.';
  }

  for (const [index, day] of parsed.data.days.entries()) {
    if (day.is_rest_day) continue;
    for (const workout of day.workouts) {
      if (workout.is_cardio) {
        const { minutes } = parseCardioParams(workout.cardio_params);
        if (!minutes.trim()) {
          return `Gün ${index + 1}: kardiyo dakikası girin.`;
        }
        continue;
      }
      if (workout.exercise_id) {
        const { sets, reps } = parseSetsReps(workout.reps_scheme);
        if (!sets || !reps) {
          return `Gün ${index + 1}: set ve tekrar sayısı girin.`;
        }
      }
    }
    for (const meal of day.meals) {
      const missingFood = meal.foods.some((food) => !food.food_id.trim() && food.amount_grams.trim());
      if (missingFood) {
        return `Gün ${index + 1}: ${MEAL_LABELS[meal.meal_type as MealType] ?? meal.meal_type} öğününde gramaj var, besin seçilmedi.`;
      }
      const missingGrams = meal.foods.some((food) => food.food_id.trim() && !food.amount_grams.trim());
      if (missingGrams) {
        return `Gün ${index + 1}: ${MEAL_LABELS[meal.meal_type as MealType] ?? meal.meal_type} öğününde miktar girin.`;
      }
    }
  }
  return null;
}
