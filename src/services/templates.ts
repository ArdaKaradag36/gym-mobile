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
import { amountDisplayForSave, gramsFromQuantity, inputQuantityFromGrams, parseGrams } from '../forms/macros';
import { fetchFoodUnitMap } from './trainer';
import { parseOptionalNumber } from '../utils/format';
import { normalizeSetsReps } from '../forms/setsReps';

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
      food_id,
      food_name,
      amount,
      amount_in_grams,
      note,
      training_day_only,
      order_index,
      foods ( id, name, category, kcal_per_100g, protein_per_100g, carb_per_100g, fat_per_100g, unit_label, grams_per_unit )
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
  return ((data ?? []) as unknown as DietTemplate[]).map((template) => ({
    ...template,
    diet_template_meals: (template.diet_template_meals ?? []).map((meal) => ({
      ...meal,
      diet_template_foods: (meal.diet_template_foods ?? []).map((food) => ({
        ...food,
        foods: Array.isArray(food.foods) ? (food.foods[0] ?? null) : (food.foods ?? null),
      })),
    })),
  }));
}

export async function saveWorkoutTemplate(
  trainerId: string,
  form: WorkoutTemplateForm,
  templateId?: string,
): Promise<WorkoutTemplate> {
  const payload = {
    trainer_id: trainerId,
    template_id: templateId ?? null,
    name: form.name.trim(),
    muscle_group: form.muscle_group.trim() || null,
    items: form.items
      .filter((item) => item.is_cardio || item.exercise_id.trim())
      .map((item) => ({
        exercise_id: item.exercise_id.trim() || null,
        reps_scheme: item.is_cardio ? null : normalizeSetsReps(item.reps_scheme) || null,
        rest_seconds: item.is_cardio ? null : parseOptionalNumber(item.rest_seconds),
        weight_min: item.is_cardio ? null : parseOptionalNumber(item.weight_min),
        weight_max: item.is_cardio ? null : parseOptionalNumber(item.weight_max),
        is_cardio: item.is_cardio,
        cardio_params: item.is_cardio ? item.cardio_params || null : null,
        muscle_group: item.is_cardio ? 'cardio' : item.muscle_group || null,
      })),
  };

  const { data, error } = await supabase.rpc('save_workout_template', { payload });
  if (error) throw error;
  if (!data) throw new Error('Şablon kaydedilemedi.');
  return data as WorkoutTemplate;
}

export async function saveDietTemplate(
  trainerId: string,
  form: DietTemplateForm,
  templateId?: string,
): Promise<DietTemplate> {
  const foodUnits = await fetchFoodUnitMap(
    form.meals.flatMap((meal) => meal.foods.map((food) => food.food_id)),
  );

  const payload = {
    trainer_id: trainerId,
    template_id: templateId ?? null,
    name: form.name.trim(),
    meals: form.meals.flatMap((meal) => {
      const foods = meal.foods.filter((food) => food.food_id.trim());
      if (foods.length === 0) return [];
      return [
        {
          meal_type: meal.meal_type,
          foods: foods.map((food, foodIndex) => {
            const qty = parseGrams(food.amount_grams);
            const unit = foodUnits.get(food.food_id);
            const grams = gramsFromQuantity(qty, unit);
            return {
              food_id: food.food_id.trim() || null,
              food_name: food.food_name.trim() || 'Besin',
              amount: amountDisplayForSave(qty, unit),
              amount_in_grams: grams > 0 ? grams : null,
              note: food.note.trim() || null,
              training_day_only: food.training_day_only,
              order_index: foodIndex,
            };
          }),
        },
      ];
    }),
  };

  const { data, error } = await supabase.rpc('save_diet_template', { payload });
  if (error) throw error;
  if (!data) throw new Error('Şablon kaydedilemedi.');
  return data as DietTemplate;
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
      reps_scheme: item.is_cardio ? '' : normalizeSetsReps(item.reps_scheme),
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
    food_id: string;
    food_name: string;
    amount_grams: string;
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
        .map((food) => {
          const grams =
            food.amount_in_grams != null ? parseGrams(food.amount_in_grams) : parseGrams(food.amount);
          return {
            food_id: food.food_id ?? '',
            food_name: food.foods?.name ?? food.food_name,
            amount_grams: inputQuantityFromGrams(grams, food.foods),
            note: food.note ?? '',
            training_day_only: food.training_day_only,
          };
        }),
    }));
}
