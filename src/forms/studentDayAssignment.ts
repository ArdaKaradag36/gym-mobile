import { encodeCardioParams } from './cardio';
import { inputQuantityFromGrams, parseGrams } from './macros';
import { normalizeSetsReps } from './setsReps';
import type { MealType, Program } from '../types/database';
import type { StudentPlanDay } from '../services/workouts';
import { addDaysIso, todayIsoDate } from '../utils/format';
import { unpackDailyNotes } from './dailyNotes';

export const PROGRAM_LENGTH_DAYS = 14;

export const DEFAULT_MEAL_TYPES: MealType[] = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
];

export type WorkoutRowForm = {
  id?: string;
  exercise_id: string;
  muscle_group: string;
  reps_scheme: string;
  rest_seconds: string;
  weight_min: string;
  weight_max: string;
  is_cardio: boolean;
  cardio_params: string;
};

export type FoodRowForm = {
  food_id: string;
  food_name: string;
  amount_grams: string;
  note: string;
  training_day_only: boolean;
};

export type MealRowForm = {
  id?: string;
  meal_type: MealType;
  foods: FoodRowForm[];
};

export type DayAssignment = {
  planId?: string;
  date: string;
  workout_title: string;
  daily_note: string;
  water_goal: string;
  is_rest_day: boolean;
  is_training_day: boolean;
  workouts: WorkoutRowForm[];
  meals: MealRowForm[];
};

export type AssignmentForm = {
  title: string;
  trainer_notes: string;
  kcal_target: string;
  start_weight: string;
  target_weight: string;
  protein_g: string;
  carb_g: string;
  fat_g: string;
  protein_g_off: string;
  carb_g_off: string;
  fat_g_off: string;
  days: DayAssignment[];
};

export function emptyWorkoutRow(): WorkoutRowForm {
  return {
    exercise_id: '',
    muscle_group: '',
    reps_scheme: '3*10',
    rest_seconds: '60',
    weight_min: '',
    weight_max: '',
    is_cardio: false,
    cardio_params: '',
  };
}

export function emptyCardioRow(): WorkoutRowForm {
  return {
    exercise_id: '',
    muscle_group: 'cardio',
    reps_scheme: '',
    rest_seconds: '',
    weight_min: '',
    weight_max: '',
    is_cardio: true,
    cardio_params: encodeCardioParams({ minutes: '20', tempo: 'moderate' }),
  };
}

export function emptyFoodRow(): FoodRowForm {
  return {
    food_id: '',
    food_name: '',
    amount_grams: '',
    note: '',
    training_day_only: false,
  };
}

export function emptyMeal(mealType: MealType): MealRowForm {
  return {
    meal_type: mealType,
    foods: [emptyFoodRow()],
  };
}

export function emptyDay(date: string): DayAssignment {
  return {
    date,
    workout_title: '',
    daily_note: '',
    water_goal: '4000',
    is_rest_day: false,
    is_training_day: true,
    workouts: [emptyWorkoutRow()],
    meals: DEFAULT_MEAL_TYPES.map(emptyMeal),
  };
}

export function emptyAssignmentForm(startDate = todayIsoDate()): AssignmentForm {
  return {
    title: '14-gün program',
    trainer_notes: '',
    kcal_target: '2310',
    start_weight: '',
    target_weight: '',
    protein_g: '',
    carb_g: '',
    fat_g: '',
    protein_g_off: '',
    carb_g_off: '',
    fat_g_off: '',
    days: Array.from({ length: PROGRAM_LENGTH_DAYS }, (_, index) =>
      emptyDay(addDaysIso(startDate, index)),
    ),
  };
}

export function assignmentFromServer(
  program: Program | null,
  days: StudentPlanDay[],
): AssignmentForm {
  const startDate = program?.start_date ?? days[0]?.date ?? todayIsoDate();
  const base = emptyAssignmentForm(startDate);
  const byDate = new Map(days.map((day) => [day.date, day]));

  const unpacked = unpackDailyNotes(program?.daily_notes, PROGRAM_LENGTH_DAYS);

  return {
    title: program?.title ?? base.title,
    trainer_notes: unpacked.all || program?.trainer_notes || '',
    kcal_target: program?.kcal_target != null ? String(program.kcal_target) : base.kcal_target,
    start_weight: program?.start_weight != null ? String(program.start_weight) : '',
    target_weight: program?.target_weight != null ? String(program.target_weight) : '',
    protein_g: program?.protein_g != null ? String(program.protein_g) : '',
    carb_g: program?.carb_g != null ? String(program.carb_g) : '',
    fat_g: program?.fat_g != null ? String(program.fat_g) : '',
    protein_g_off: program?.protein_g_off != null ? String(program.protein_g_off) : '',
    carb_g_off: program?.carb_g_off != null ? String(program.carb_g_off) : '',
    fat_g_off: program?.fat_g_off != null ? String(program.fat_g_off) : '',
    days: base.days.map((placeholder, index) => {
      const loaded = byDate.get(placeholder.date);
      if (!loaded) {
        return unpacked.perDay[index]
          ? { ...placeholder, daily_note: unpacked.perDay[index] }
          : placeholder;
      }

      const mealsByType = new Map(
        (loaded.daily_diets ?? []).map((meal) => [meal.meal_type, meal]),
      );

      return {
        planId: loaded.id,
        date: loaded.date,
        workout_title: loaded.workout_title ?? '',
        daily_note: unpacked.perDay[index] || loaded.daily_note || '',
        water_goal: loaded.water_goal != null ? String(loaded.water_goal) : '4000',
        is_rest_day: loaded.is_rest_day,
        is_training_day: !loaded.is_rest_day,
        workouts:
          loaded.daily_workouts.length > 0
            ? loaded.daily_workouts.map((workout) => ({
                id: workout.id,
                exercise_id: workout.exercise_id,
                muscle_group: workout.muscle_group ?? '',
                reps_scheme: workout.is_cardio
                  ? ''
                  : normalizeSetsReps(workout.reps_scheme ?? workout.target_reps ?? ''),
                rest_seconds: workout.rest_seconds != null ? String(workout.rest_seconds) : '60',
                weight_min: workout.weight_min != null ? String(workout.weight_min) : '',
                weight_max: workout.weight_max != null ? String(workout.weight_max) : '',
                is_cardio: workout.is_cardio,
                cardio_params: workout.cardio_params ?? '',
              }))
            : [emptyWorkoutRow()],
        meals: (() => {
          const typeOrder: MealType[] = [...DEFAULT_MEAL_TYPES];
          for (const meal of loaded.daily_diets ?? []) {
            if (!typeOrder.includes(meal.meal_type)) typeOrder.push(meal.meal_type);
          }
          return typeOrder.map((mealType) => {
            const meal = mealsByType.get(mealType);
            if (!meal) return emptyMeal(mealType);
            return {
              id: meal.id,
              meal_type: mealType,
              foods:
                meal.diet_foods && meal.diet_foods.length > 0
                  ? meal.diet_foods.map((food) => ({
                      food_id: food.food_id ?? '',
                      food_name: food.foods?.name ?? food.food_name,
                      amount_grams: (() => {
                        const grams =
                          food.amount_in_grams != null
                            ? parseGrams(food.amount_in_grams)
                            : parseGrams(food.amount);
                        return inputQuantityFromGrams(grams, food.foods);
                      })(),
                      note: food.note ?? '',
                      training_day_only: food.training_day_only,
                    }))
                  : meal.content
                    ? [
                        {
                          food_id: '',
                          food_name: meal.content,
                          amount_grams: '',
                          note: '',
                          training_day_only: false,
                        },
                      ]
                    : [emptyFoodRow()],
            };
          });
        })(),
      };
    }),
  };
}
