import type { MealType } from '../types/database';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { addDaysIso } from '../utils/format';

const PROGRAM_LENGTH_DAYS = 14;

/** One day inside a 14-day program blueprint. */
export type ProgramTemplateDay = {
  day_offset?: number;
  day_index?: number;
  workout_title?: string | null;
  water_goal?: number | null;
  daily_note?: string | null;
  is_rest_day?: boolean;
  is_training_day?: boolean;
  diets?: Array<{
    meal_type: MealType;
    content: string;
    foods?: Array<{
      food_id?: string;
      food_name: string;
      amount?: string;
      amount_in_grams?: number;
      note?: string;
      training_day_only?: boolean;
    }>;
  }>;
  workouts?: Array<{
    exercise_id: string;
    target_sets?: number | null;
    target_reps?: number | string | null;
    reps_scheme?: string | null;
    rest_seconds?: number | null;
    muscle_group?: string | null;
    is_cardio?: boolean;
    cardio_params?: string | null;
    weight_min?: number | null;
    weight_max?: number | null;
  }>;
};

export type ProgramTemplateJson = {
  title?: string;
  days: ProgramTemplateDay[];
};

export type AssignTwoWeekProgramSuccess = {
  success: true;
  programId: string;
  startDate: string;
  endDate: string;
  dailyPlanCount: number;
  dietCount: number;
  workoutCount: number;
  message: string;
};

export type AssignTwoWeekProgramFailure = {
  success: false;
  error: string;
  message: string;
  programId?: string;
};

export type AssignTwoWeekProgramResult =
  | AssignTwoWeekProgramSuccess
  | AssignTwoWeekProgramFailure;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function resolveDayOffset(day: ProgramTemplateDay, fallbackIndex: number): number {
  if (typeof day.day_offset === 'number' && Number.isFinite(day.day_offset)) {
    return day.day_offset;
  }
  if (typeof day.day_index === 'number' && Number.isFinite(day.day_index)) {
    return day.day_index - 1;
  }
  return fallbackIndex;
}

function normalizeTemplateDays(template: ProgramTemplateJson): ProgramTemplateDay[] {
  const byOffset = new Map<number, ProgramTemplateDay>();

  (template.days ?? []).forEach((day, index) => {
    const offset = resolveDayOffset(day, index);
    if (offset < 0 || offset >= PROGRAM_LENGTH_DAYS) return;
    byOffset.set(offset, day);
  });

  return Array.from({ length: PROGRAM_LENGTH_DAYS }, (_, offset) => {
    const existing = byOffset.get(offset);
    return {
      day_offset: offset,
      workout_title: existing?.workout_title ?? null,
      water_goal: existing?.water_goal ?? 4000,
      daily_note: existing?.daily_note ?? null,
      is_rest_day: existing?.is_rest_day ?? false,
      is_training_day: existing?.is_training_day ?? !existing?.is_rest_day,
      diets: existing?.diets ?? [],
      workouts: existing?.workouts ?? [],
    };
  });
}

function validateArgs(
  studentId: string,
  startDate: string,
  programTemplateJson: ProgramTemplateJson,
): string | null {
  if (!studentId?.trim()) return 'Öğrenci seçilmedi.';
  if (!ISO_DATE_RE.test(startDate)) {
    return 'Başlangıç tarihi YYYY-AA-GG olmalı.';
  }
  if (!programTemplateJson || !Array.isArray(programTemplateJson.days)) {
    return 'Program şablonunda gün listesi olmalı.';
  }
  if (programTemplateJson.days.length === 0) {
    return 'Program şablonunda en az bir gün olmalı.';
  }
  return null;
}

async function rollbackProgramAssignment(programId: string): Promise<void> {
  await supabase.from('programs').delete().eq('id', programId);
}

function failure(
  error: string,
  message = '14 günlük program atanamadı.',
  programId?: string,
): AssignTwoWeekProgramFailure {
  return {
    success: false,
    error,
    message,
    ...(programId ? { programId } : {}),
  };
}

/**
 * Assigns a 14-day program as a draft. The student does not see it until ONAYLA.
 */
export async function assignTwoWeekProgram(
  studentId: string,
  startDate: string,
  programTemplateJson: ProgramTemplateJson,
  trainerId?: string,
): Promise<AssignTwoWeekProgramResult> {
  if (!isSupabaseConfigured) {
    return failure(
      'Supabase ayarlı değil.',
      'Devam etmek için EXPO_PUBLIC_SUPABASE_URL ve EXPO_PUBLIC_SUPABASE_ANON_KEY ekle.',
    );
  }

  const validationError = validateArgs(studentId, startDate, programTemplateJson);
  if (validationError) {
    return failure(validationError, validationError);
  }

  const days = normalizeTemplateDays(programTemplateJson);
  const endDate = addDaysIso(startDate, PROGRAM_LENGTH_DAYS - 1);
  let programId: string | undefined;

  try {
    const { data: programRow, error: programError } = await supabase
      .from('programs')
      .insert({
        student_id: studentId,
        trainer_id: trainerId ?? null,
        start_date: startDate,
        end_date: endDate,
        title: programTemplateJson.title ?? '14 günlük program',
        status: 'draft',
      })
      .select('id, student_id, start_date, end_date')
      .single();

    if (programError || !programRow) {
      return failure(
        programError?.message ?? 'Program kaydı oluşturulamadı.',
        'Program kaydı oluşturulamadı.',
      );
    }

    programId = (programRow as { id: string }).id;

    const dailyPlanPayloads = days.map((day) => ({
      program_id: programId,
      date: addDaysIso(startDate, day.day_offset ?? 0),
      water_goal: day.water_goal ?? 4000,
      water_consumed: 0,
      daily_note: day.daily_note ?? null,
      workout_title: day.workout_title ?? null,
      is_rest_day: day.is_rest_day ?? false,
      is_training_day: day.is_training_day ?? true,
      steps_count: 0,
    }));

    const { data: planRows, error: plansError } = await supabase
      .from('daily_plans')
      .insert(dailyPlanPayloads)
      .select('id, date');

    if (plansError || !planRows?.length) {
      await rollbackProgramAssignment(programId);
      return failure(
        plansError?.message ?? 'Günlük planlar oluşturulamadı.',
        'Günlük planlar oluşturulamadığı için program geri alındı.',
        programId,
      );
    }

    const planIdByDate = new Map(
      (planRows as Array<{ id: string; date: string }>).map((plan) => [plan.date, plan.id]),
    );

    let dietCount = 0;
    let workoutCount = 0;

    for (const day of days) {
      const date = addDaysIso(startDate, day.day_offset ?? 0);
      const dailyPlanId = planIdByDate.get(date);
      if (!dailyPlanId) {
        await rollbackProgramAssignment(programId);
        return failure(`${date} için günlük plan eksik.`, 'Tarih eşlemesi hatası, program geri alındı.', programId);
      }

      const workoutPayloads = (day.workouts ?? []).map((workout, index) => ({
        daily_plan_id: dailyPlanId,
        exercise_id: workout.exercise_id,
        order_index: index + 1,
        target_sets: workout.target_sets ?? null,
        target_reps:
          workout.reps_scheme ??
          (workout.target_reps == null ? null : String(workout.target_reps)),
        reps_scheme:
          workout.reps_scheme ??
          (workout.target_reps == null ? null : String(workout.target_reps)),
        rest_seconds: workout.rest_seconds ?? null,
        muscle_group: workout.muscle_group ?? null,
        is_cardio: workout.is_cardio ?? false,
        cardio_params: workout.cardio_params ?? null,
        weight_min: workout.weight_min ?? null,
        weight_max: workout.weight_max ?? null,
        is_completed: false,
      }));

      if (workoutPayloads.length > 0) {
        const { error } = await supabase.from('daily_workouts').insert(workoutPayloads);
        if (error) {
          await rollbackProgramAssignment(programId);
          return failure(error.message, 'Antrenmanlar kaydedilemedi, program geri alındı.', programId);
        }
        workoutCount += workoutPayloads.length;
      }

      for (const diet of day.diets ?? []) {
        const { data: dietRow, error: dietError } = await supabase
          .from('daily_diets')
          .insert({
            daily_plan_id: dailyPlanId,
            meal_type: diet.meal_type,
            content: diet.content,
            is_completed: false,
          })
          .select('id')
          .single();

        if (dietError) {
          await rollbackProgramAssignment(programId);
          return failure(dietError.message, 'Diyetler kaydedilemedi, program geri alındı.', programId);
        }
        dietCount += 1;

        const foods = diet.foods?.filter((food) => food.food_id?.trim() || food.food_name.trim()) ?? [];
        if (foods.length > 0 && dietRow) {
          const { error: foodError } = await supabase.from('diet_foods').insert(
            foods.map((food, index) => {
              const grams = food.amount_in_grams ?? null;
              return {
                daily_diet_id: dietRow.id,
                food_id: food.food_id?.trim() || null,
                food_name: food.food_name,
                amount: food.amount ?? (grams != null ? `${grams} g` : null),
                amount_in_grams: grams,
                note: food.note ?? null,
                training_day_only: food.training_day_only ?? false,
                order_index: index,
              };
            }),
          );
          if (foodError) {
            await rollbackProgramAssignment(programId);
            return failure(foodError.message, 'Besinler kaydedilemedi, program geri alındı.', programId);
          }
        }
      }
    }

    return {
      success: true,
      programId,
      startDate,
      endDate,
      dailyPlanCount: planRows.length,
      dietCount,
      workoutCount,
      message: `14 günlük taslak program oluşturuldu (${startDate} → ${endDate}). ONAYLA ile yayınla.`,
    };
  } catch (err) {
    if (programId) {
      try {
        await rollbackProgramAssignment(programId);
      } catch {
        // keep original error
      }
    }
    const errorMessage =
      err instanceof Error ? err.message : 'Program atanırken beklenmeyen hata.';
    return failure(errorMessage, 'Program ataması başarısız.', programId);
  }
}
