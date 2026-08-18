import type {
  DailyDiet,
  DailyPlan,
  DailyWorkout,
  DietFood,
  Exercise,
  Profile,
  Program,
} from '../types/database';
import { MEAL_LABELS } from '../types/database';
import { PLAN_EMBED, PROFILE_COLUMNS, PROGRAM_COLUMNS } from './queries';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { sortStudentWorkouts } from '../utils/workoutSort';

export type WorkoutWithExercise = DailyWorkout & {
  exercises: Pick<Exercise, 'id' | 'name' | 'category' | 'youtube_url' | 'is_cardio'> | null;
};

export type DietWithFoods = DailyDiet & {
  diet_foods: DietFood[];
};

export type StudentPlanDay = DailyPlan & {
  student_id: string;
  daily_workouts: WorkoutWithExercise[];
  daily_diets: DietWithFoods[];
};

export type TodaysWorkoutPlan = StudentPlanDay;

export type StudentProfileWithTrainer = Profile & {
  trainer: Pick<Profile, 'id' | 'full_name'> | null;
};

export type StudentProgramBundle = {
  program: Program;
  days: StudentPlanDay[];
};

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function toStudentPlanDay(
  plan: DailyPlan & {
    daily_workouts?: WorkoutWithExercise[] | null;
    daily_diets?: DietWithFoods[] | null;
  },
  studentId: string,
): StudentPlanDay {
  const diets = (plan.daily_diets ?? []).map((diet) => ({
    ...diet,
    diet_foods: (diet.diet_foods ?? [])
      .slice()
      .sort((a, b) => a.order_index - b.order_index)
      .map((food) => ({
        ...food,
        foods: unwrapOne(food.foods as never),
      })),
  }));

  return {
    ...plan,
    student_id: studentId,
    daily_workouts: sortStudentWorkouts(
      (plan.daily_workouts ?? []).map((workout) => ({
        ...workout,
        exercises: unwrapOne(workout.exercises as never),
      })),
    ),
    daily_diets: diets,
  };
}

function isPlaceholderMealContent(content?: string | null, mealType?: string) {
  const trimmed = content?.trim() ?? '';
  if (!trimmed) return true;
  if (mealType && trimmed === mealType) return true;
  return trimmed in MEAL_LABELS;
}

export function visibleMealsForDay(day: StudentPlanDay) {
  const isTrainingDay = day.is_training_day ?? true;
  const visibleFoods = (mealFoods: DietFood[] | undefined) =>
    (mealFoods ?? []).filter((food) => isTrainingDay || !food.training_day_only);

  return [...(day.daily_diets ?? [])].filter((meal) => {
    if (visibleFoods(meal.diet_foods).length > 0) return true;
    return !isPlaceholderMealContent(meal.content, meal.meal_type);
  });
}

export async function fetchStudentProfile(
  userId: string,
): Promise<StudentProfileWithTrainer | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select(`${PROFILE_COLUMNS}, trainer:trainer_id(id, full_name)`)
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as StudentProfileWithTrainer | null;
}

export async function fetchStudentProgramDays(
  studentId: string,
  options?: { status?: 'active' | 'any' },
): Promise<StudentProgramBundle | null> {
  if (!isSupabaseConfigured) return null;

  let programQuery = supabase
    .from('programs')
    .select(PROGRAM_COLUMNS)
    .eq('student_id', studentId)
    .order('start_date', { ascending: false })
    .limit(1);

  if (options?.status !== 'any') {
    programQuery = programQuery.eq('status', 'active');
  }

  const { data: program, error: programError } = await programQuery.maybeSingle();
  if (programError) throw programError;
  if (!program) return null;

  const typedProgram = program as Program;

  const { data: planRows, error: plansError } = await supabase
    .from('daily_plans')
    .select(PLAN_EMBED)
    .eq('program_id', typedProgram.id)
    .order('date', { ascending: true });

  if (plansError) throw plansError;

  const days = (planRows ?? []).map((row) =>
    toStudentPlanDay(
      row as unknown as DailyPlan & {
        daily_workouts?: WorkoutWithExercise[] | null;
        daily_diets?: DietWithFoods[] | null;
      },
      studentId,
    ),
  );

  return { program: typedProgram, days };
}

export async function updateWorkoutCompletion(
  workoutId: string,
  isCompleted: boolean,
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase
    .from('daily_workouts')
    .update({ is_completed: isCompleted })
    .eq('id', workoutId);

  if (error) throw error;
}

export async function updateDietCompletion(
  dietId: string,
  isCompleted: boolean,
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase
    .from('daily_diets')
    .update({ is_completed: isCompleted })
    .eq('id', dietId);

  if (error) throw error;
}

export async function updatePlanWater(
  planId: string,
  waterConsumed: number,
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase
    .from('daily_plans')
    .update({ water_consumed: waterConsumed })
    .eq('id', planId);

  if (error) throw error;
}
