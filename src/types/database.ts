export type UserRole = 'admin' | 'trainer' | 'student';

export type ProgramStatus = 'draft' | 'active' | 'archived';

export type MealType =
  | 'breakfast'
  | 'snack'
  | 'pre_workout'
  | 'post_workout'
  | 'dinner'
  | 'lunch';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'cardio'
  | 'push'
  | 'pull';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  trainer_id: string | null;
  is_active: boolean;
  avatar_url: string | null;
}

export interface Exercise {
  id: string;
  name: string;
  category: string | null;
  youtube_url: string | null;
  is_active: boolean;
  is_cardio: boolean;
}

export interface Program {
  id: string;
  student_id: string;
  trainer_id: string | null;
  start_date: string;
  end_date: string;
  title: string | null;
  status: ProgramStatus;
  start_weight: number | null;
  target_weight: number | null;
  kcal_target: number | null;
  protein_g: number | null;
  carb_g: number | null;
  fat_g: number | null;
  protein_g_off: number | null;
  carb_g_off: number | null;
  fat_g_off: number | null;
  trainer_notes: string | null;
}

export interface DailyPlan {
  id: string;
  program_id: string;
  date: string;
  water_goal: number | null;
  water_consumed: number | null;
  daily_note: string | null;
  workout_title: string | null;
  is_rest_day: boolean;
  is_training_day: boolean;
  steps_count: number;
}

export interface DietFood {
  id: string;
  daily_diet_id: string;
  food_name: string;
  amount: string | null;
  note: string | null;
  training_day_only: boolean;
  order_index: number;
}

export interface DailyDiet {
  id: string;
  daily_plan_id: string;
  meal_type: MealType;
  content: string;
  is_completed: boolean;
  diet_foods?: DietFood[];
}

export interface DailyWorkout {
  id: string;
  daily_plan_id: string;
  exercise_id: string;
  order_index: number | null;
  target_sets: number | null;
  target_reps: string | null;
  reps_scheme: string | null;
  rest_seconds: number | null;
  muscle_group: string | null;
  is_cardio: boolean;
  cardio_params: string | null;
  weight_min: number | null;
  weight_max: number | null;
  actual_weight_used: string | null;
  student_note: string | null;
  is_completed: boolean;
  exercises?: Pick<Exercise, 'id' | 'name' | 'category' | 'youtube_url' | 'is_cardio'> | null;
}

export interface Measurement {
  id: string;
  student_id: string;
  date: string;
  measured_at: string | null;
  device: string | null;
  weight: number | null;
  weight_ideal: number | null;
  body_fat: number | null;
  body_density: number | null;
  bmi: number | null;
  bmi_ideal: number | null;
  muscle_kg: number | null;
  muscle_kg_ideal: number | null;
  mineral: number | null;
  mineral_ideal: number | null;
  protein: number | null;
  protein_ideal: number | null;
  fluid_kg: number | null;
  fluid_kg_ideal: number | null;
  fat_mass_kg: number | null;
  fat_mass_kg_ideal: number | null;
  body_fat_percent: number | null;
  body_fat_percent_ideal: number | null;
  bmi_score: number | null;
  muscle_score: number | null;
  fluid_score: number | null;
  bmr_score: number | null;
  fat_score: number | null;
  metabolic_age: number | null;
  fat_free_mass_kg: number | null;
  source: 'manual' | 'pdf' | string | null;
  raw_payload: Record<string, unknown> | null;
}

export interface WorkoutTemplate {
  id: string;
  trainer_id: string;
  name: string;
  muscle_group: string | null;
  created_at?: string;
  workout_template_items?: WorkoutTemplateItem[];
}

export interface WorkoutTemplateItem {
  id: string;
  template_id: string;
  exercise_id: string | null;
  order_index: number;
  reps_scheme: string | null;
  rest_seconds: number | null;
  weight_min: number | null;
  weight_max: number | null;
  is_cardio: boolean;
  cardio_params: string | null;
  muscle_group: string | null;
  exercises?: Pick<Exercise, 'id' | 'name' | 'category' | 'youtube_url'> | null;
}

export interface DietTemplate {
  id: string;
  trainer_id: string;
  name: string;
  created_at?: string;
  diet_template_meals?: DietTemplateMeal[];
}

export interface DietTemplateMeal {
  id: string;
  template_id: string;
  meal_type: MealType;
  sort_index: number;
  diet_template_foods?: DietTemplateFood[];
}

export interface DietTemplateFood {
  id: string;
  meal_id: string;
  food_name: string;
  amount: string | null;
  note: string | null;
  training_day_only: boolean;
  order_index: number;
}

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Sabah',
  snack: 'Ara öğün',
  pre_workout: 'Antrenman öncesi',
  post_workout: 'Antrenman sonrası',
  dinner: 'Akşam',
  lunch: 'Öğle',
};

export const MEAL_SORT_ORDER: MealType[] = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'pre_workout',
  'post_workout',
];

