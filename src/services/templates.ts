import type {
  DietTemplate,
  DietTemplateFood,
  DietTemplateMeal,
  MealType,
  WorkoutTemplate,
  WorkoutTemplateItem,
} from '../types/database';
import type { DietTemplateForm, WorkoutTemplateForm } from '../forms/templateForm';
import type { WorkoutRowForm } from '../forms/studentDayAssignment';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { parseOptionalNumber } from '../utils/format';

const WORKOUT_TEMPLATE_EMBED = `
  id,
  trainer_id,
  name,
  muscle_group,
  created_at,
  workout_template_items (
    id,
    template_id,
    exercise_id,
    order_index,
    reps_scheme,
    rest_seconds,
    weight_min,
    weight_max,
    is_cardio,
    cardio_params,
    muscle_group,
    exercises ( id, name, category, youtube_url )
  )
`;

const DIET_TEMPLATE_EMBED = `
  id,
  trainer_id,
  name,
  created_at,
  diet_template_meals (
    id,
    template_id,
    meal_type,
    sort_index,
    diet_template_foods (
      id,
      meal_id,
      food_name,
      amount,
      note,
      training_day_only,
      order_index
    )
  )
`;

export async function fetchWorkoutTemplates(trainerId: string): Promise<WorkoutTemplate[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('workout_templates')
    .select(WORKOUT_TEMPLATE_EMBED)
    .eq('trainer_id', trainerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as WorkoutTemplate[];
}

export async function fetchDietTemplates(trainerId: string): Promise<DietTemplate[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('diet_templates')
    .select(DIET_TEMPLATE_EMBED)
    .eq('trainer_id', trainerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as DietTemplate[];
}

export async function saveWorkoutTemplate(
  trainerId: string,
  form: WorkoutTemplateForm,
  templateId?: string,
): Promise<WorkoutTemplate> {
  const payload = {
    trainer_id: trainerId,
    name: form.name.trim(),
    muscle_group: form.muscle_group.trim() || null,
  };

  let saved: WorkoutTemplate;

  if (templateId) {
    const { data, error } = await supabase
      .from('workout_templates')
      .update(payload)
      .eq('id', templateId)
      .select('id, trainer_id, name, muscle_group, created_at')
      .single();
    if (error) throw error;
    saved = data as WorkoutTemplate;
    await supabase.from('workout_template_items').delete().eq('template_id', templateId);
  } else {
    const { data, error } = await supabase
      .from('workout_templates')
      .insert(payload)
      .select('id, trainer_id, name, muscle_group, created_at')
      .single();
    if (error) throw error;
    saved = data as WorkoutTemplate;
  }

  const items = form.items
    .filter((item) => item.exercise_id.trim())
    .map((item, index) => ({
      template_id: saved.id,
      exercise_id: item.exercise_id,
      order_index: index + 1,
      reps_scheme: item.reps_scheme || null,
      rest_seconds: parseOptionalNumber(item.rest_seconds),
      weight_min: parseOptionalNumber(item.weight_min),
      weight_max: parseOptionalNumber(item.weight_max),
      is_cardio: item.is_cardio,
      cardio_params: item.cardio_params || null,
      muscle_group: item.muscle_group || null,
    }));

  if (items.length > 0) {
    const { error } = await supabase.from('workout_template_items').insert(items);
    if (error) throw error;
  }

  return saved;
}

export async function saveDietTemplate(
  trainerId: string,
  form: DietTemplateForm,
  templateId?: string,
): Promise<DietTemplate> {
  const payload = {
    trainer_id: trainerId,
    name: form.name.trim(),
  };

  let saved: DietTemplate;
  if (templateId) {
    const { data, error } = await supabase
      .from('diet_templates')
      .update(payload)
      .eq('id', templateId)
      .select('id, trainer_id, name, created_at')
      .single();
    if (error) throw error;
    saved = data as DietTemplate;
    await supabase.from('diet_template_meals').delete().eq('template_id', templateId);
  } else {
    const { data, error } = await supabase
      .from('diet_templates')
      .insert(payload)
      .select('id, trainer_id, name, created_at')
      .single();
    if (error) throw error;
    saved = data as DietTemplate;
  }

  for (const [index, meal] of form.meals.entries()) {
    const foods = meal.foods.filter((food) => food.food_name.trim());
    if (foods.length === 0) continue;

    const { data: mealRow, error: mealError } = await supabase
      .from('diet_template_meals')
      .insert({
        template_id: saved.id,
        meal_type: meal.meal_type,
        sort_index: index,
      })
      .select('id')
      .single();

    if (mealError) throw mealError;

    const { error: foodError } = await supabase.from('diet_template_foods').insert(
      foods.map((food, foodIndex) => ({
        meal_id: mealRow.id,
        food_name: food.food_name.trim(),
        amount: food.amount.trim() || null,
        note: food.note.trim() || null,
        training_day_only: food.training_day_only,
        order_index: foodIndex,
      })),
    );
    if (foodError) throw foodError;
  }

  return saved;
}

export async function deleteWorkoutTemplate(templateId: string): Promise<void> {
  const { error } = await supabase.from('workout_templates').delete().eq('id', templateId);
  if (error) throw error;
}

export async function deleteDietTemplate(templateId: string): Promise<void> {
  const { error } = await supabase.from('diet_templates').delete().eq('id', templateId);
  if (error) throw error;
}

export function templateItemsToWorkoutRows(
  items: WorkoutTemplateItem[] | undefined,
): WorkoutRowForm[] {
  if (!items?.length) return [];
  return items
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .map((item) => ({
      id: undefined,
      exercise_id: item.exercise_id ?? '',
      muscle_group: item.muscle_group ?? '',
      reps_scheme: item.reps_scheme ?? '',
      rest_seconds: item.rest_seconds != null ? String(item.rest_seconds) : '60',
      weight_min: item.weight_min != null ? String(item.weight_min) : '',
      weight_max: item.weight_max != null ? String(item.weight_max) : '',
      is_cardio: item.is_cardio,
      cardio_params: item.cardio_params ?? '',
    }));
}

export function dietTemplateToMeals(template: DietTemplate): Array<{
  meal_type: MealType;
  foods: Array<{
    food_name: string;
    amount: string;
    note: string;
    training_day_only: boolean;
  }>;
}> {
  return (template.diet_template_meals ?? [])
    .slice()
    .sort((a, b) => a.sort_index - b.sort_index)
    .map((meal: DietTemplateMeal) => ({
      meal_type: meal.meal_type,
      foods: (meal.diet_template_foods ?? [])
        .slice()
        .sort((a: DietTemplateFood, b: DietTemplateFood) => a.order_index - b.order_index)
        .map((food) => ({
          food_name: food.food_name,
          amount: food.amount ?? '',
          note: food.note ?? '',
          training_day_only: food.training_day_only,
        })),
    }));
}
