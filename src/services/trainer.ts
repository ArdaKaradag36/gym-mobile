import type {
  DailyPlan,
  Exercise,
  Food,
  Profile,
  Program,
} from '../types/database';
import type { AssignmentForm } from '../forms/studentDayAssignment';
import { normalizeSetsReps, parseSetsReps } from '../forms/setsReps';
import { PLAN_EMBED, PROFILE_COLUMNS, PROGRAM_COLUMNS } from './queries';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { amountDisplayForSave, gramsFromQuantity, parseGrams } from '../forms/macros';
import { noteForDayIndex, packDailyNotes } from '../forms/dailyNotes';
import { addDaysIso, daysBetweenIso, parseOptionalNumber, todayIsoDate } from '../utils/format';
import { fetchUnreadNoteCounts } from './studentNotes';
import { sortStudentWorkouts } from '../utils/workoutSort';
import type { DietWithFoods, StudentPlanDay, WorkoutWithExercise } from './workouts';

export type StudentStatus = {
  hasDailyNote: boolean;
  unreadNotes: number;
  workoutCompleted: boolean;
  workoutInProgress: boolean;
  hydrationOnTrack: boolean;
  completedCount: number;
  totalWorkouts: number;
  compliancePercent: number | null;
};

export type TrainerStudent = Profile & {
  status: StudentStatus;
};

export type { WorkoutWithExercise, StudentPlanDay };

const PROGRAM_LENGTH_DAYS = 14;

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function emptyStatus(): StudentStatus {
  return {
    hasDailyNote: false,
    unreadNotes: 0,
    workoutCompleted: false,
    workoutInProgress: false,
    hydrationOnTrack: false,
    completedCount: 0,
    totalWorkouts: 0,
    compliancePercent: null,
  };
}

function statusFromPlan(
  plan: StudentPlanDay | null | undefined,
  program?: { start_date: string; daily_notes?: Program['daily_notes'] } | null,
): StudentStatus {
  if (!plan) return emptyStatus();

  const workouts = plan.daily_workouts ?? [];
  const completedCount = workouts.filter((item) => item.is_completed).length;
  const totalWorkouts = workouts.length;
  const workoutCompleted = totalWorkouts > 0 && completedCount === totalWorkouts;
  const workoutInProgress = completedCount > 0 && !workoutCompleted;
  const hydrationOnTrack =
    plan.water_goal != null &&
    Number(plan.water_goal) > 0 &&
    Number(plan.water_consumed ?? 0) >= Number(plan.water_goal);
  const dayIndex = program?.start_date ? daysBetweenIso(program.start_date, plan.date) : 0;
  const packedNote = noteForDayIndex(program?.daily_notes, dayIndex);

  return {
    hasDailyNote: Boolean(packedNote.trim() || plan.daily_note?.trim()),
    unreadNotes: 0,
    workoutCompleted,
    workoutInProgress,
    hydrationOnTrack,
    completedCount,
    totalWorkouts,
    compliancePercent:
      totalWorkouts === 0 ? null : Math.round((completedCount / totalWorkouts) * 100),
  };
}

function toStudentPlanDay(
  plan: DailyPlan & {
    daily_workouts?: WorkoutWithExercise[] | null;
    daily_diets?: DietWithFoods[] | null;
  },
  studentId: string,
): StudentPlanDay {
  return {
    ...plan,
    student_id: studentId,
    daily_workouts: sortStudentWorkouts(
      (plan.daily_workouts ?? []).map((workout) => ({
        ...workout,
        exercises: unwrapOne(workout.exercises as never),
      })),
    ),
    daily_diets: (plan.daily_diets ?? []).map((diet) => ({
      ...diet,
      diet_foods: (diet.diet_foods ?? [])
        .slice()
        .sort((a, b) => a.order_index - b.order_index)
        .map((food) => ({
          ...food,
          foods: unwrapOne(food.foods as never),
        })),
    })),
  };
}

export async function fetchTrainerStudents(
  trainerId: string,
): Promise<TrainerStudent[]> {
  if (!isSupabaseConfigured) return [];

  const today = todayIsoDate();

  const { data: students, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('trainer_id', trainerId)
    .eq('role', 'student')
    .order('full_name', { ascending: true });

  if (error) throw error;
  if (!students?.length) return [];

  const ids = students.map((student) => student.id);
  const planByStudent = new Map<string, StudentPlanDay>();

  const programByStudent = new Map<
    string,
    { start_date: string; daily_notes?: Program['daily_notes'] }
  >();

  const { data: planRows, error: plansError } = await supabase
    .from('daily_plans')
    .select(
      `
      ${PLAN_EMBED},
      programs!inner ( id, student_id, status, start_date, daily_notes )
    `,
    )
    .eq('date', today)
    .eq('programs.status', 'active')
    .in('programs.student_id', ids);

  if (plansError) {
    console.warn('[trainer] today plan status query failed:', plansError.message);
  } else {
    for (const row of planRows ?? []) {
      const typed = row as unknown as DailyPlan & {
        programs:
          | {
              id: string;
              student_id: string;
              start_date: string;
              daily_notes?: Program['daily_notes'];
            }
          | {
              id: string;
              student_id: string;
              start_date: string;
              daily_notes?: Program['daily_notes'];
            }[];
        daily_workouts?: WorkoutWithExercise[] | null;
        daily_diets?: DietWithFoods[] | null;
      };
      const program = Array.isArray(typed.programs) ? typed.programs[0] : typed.programs;
      if (!program?.student_id) continue;
      planByStudent.set(program.student_id, toStudentPlanDay(typed, program.student_id));
      programByStudent.set(program.student_id, program);
    }
  }

  const unreadCounts = await fetchUnreadNoteCounts(trainerId).catch(() => ({} as Record<string, number>));

  return (students as Profile[]).map((student) => {
    const status = statusFromPlan(
      planByStudent.get(student.id),
      programByStudent.get(student.id),
    );
    return {
      ...student,
      status: {
        ...status,
        unreadNotes: unreadCounts[student.id] ?? 0,
      },
    };
  });
}

export async function setStudentActive(studentId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', studentId);

  if (error) throw error;
}

export async function fetchActiveExercises(): Promise<Exercise[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, category, youtube_url, is_active, is_cardio')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Exercise[];
}

export async function fetchActiveFoods(): Promise<Food[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('foods')
    .select(
      'id, name, category, kcal_per_100g, protein_per_100g, carb_per_100g, fat_per_100g, is_active, meal_types, unit_label, grams_per_unit',
    )
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Food[];
}

export async function fetchFoodUnitMap(ids: string[]) {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  const empty = new Map<string, Pick<Food, 'id' | 'name' | 'unit_label' | 'grams_per_unit'>>();
  if (!unique.length || !isSupabaseConfigured) return empty;

  const { data, error } = await supabase
    .from('foods')
    .select('id, name, unit_label, grams_per_unit')
    .in('id', unique);

  if (error) throw error;
  return new Map((data ?? []).map((item) => [item.id, item as Pick<Food, 'id' | 'name' | 'unit_label' | 'grams_per_unit'>]));
}

async function fetchProgramByStatus(
  studentId: string,
  status: 'active' | 'draft',
): Promise<Program | null> {
  const { data, error } = await supabase
    .from('programs')
    .select(PROGRAM_COLUMNS)
    .eq('student_id', studentId)
    .eq('status', status)
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as Program | null;
}

export async function fetchLatestProgramForStudent(
  studentId: string,
): Promise<Program | null> {
  const active = await fetchProgramByStatus(studentId, 'active');
  if (active) return active;
  const draft = await fetchProgramByStatus(studentId, 'draft');
  if (draft) return draft;

  const { data, error } = await supabase
    .from('programs')
    .select(PROGRAM_COLUMNS)
    .eq('student_id', studentId)
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as Program | null;
}

export async function fetchTrainerPlanWindow(
  studentId: string,
): Promise<{ program: Program | null; days: StudentPlanDay[] }> {
  if (!isSupabaseConfigured) return { program: null, days: [] };

  const program = await fetchLatestProgramForStudent(studentId);
  if (!program) return { program: null, days: [] };

  const { data: planRows, error } = await supabase
    .from('daily_plans')
    .select(PLAN_EMBED)
    .eq('program_id', program.id)
    .order('date', { ascending: true });

  if (error) throw error;

  const days = (planRows ?? []).map((row) =>
    toStudentPlanDay(
      row as unknown as DailyPlan & {
        daily_workouts?: WorkoutWithExercise[] | null;
        daily_diets?: DietWithFoods[] | null;
      },
      studentId,
    ),
  );

  return { program, days };
}

export async function publishAssignment(params: {
  studentId: string;
  trainerId: string;
  form: AssignmentForm;
  existingProgramId?: string | null;
  publish: boolean;
  newPeriod?: boolean;
}): Promise<Program> {
  const startDate = params.form.days[0]?.date ?? todayIsoDate();
  const endDate = addDaysIso(startDate, PROGRAM_LENGTH_DAYS - 1);
  const foodUnits = await fetchFoodUnitMap(
    params.form.days.flatMap((day) =>
      day.meals.flatMap((meal) => meal.foods.map((food) => food.food_id)),
    ),
  );

  const payload = {
    student_id: params.studentId,
    trainer_id: params.trainerId,
    program_id: params.newPeriod ? null : params.existingProgramId ?? null,
    publish: params.publish,
    new_period: Boolean(params.newPeriod),
    start_date: startDate,
    end_date: endDate,
    title: params.form.title.trim() || '14 günlük program',
    start_weight: parseOptionalNumber(params.form.start_weight),
    target_weight: parseOptionalNumber(params.form.target_weight),
    kcal_target: parseOptionalNumber(params.form.kcal_target),
    protein_g: parseOptionalNumber(params.form.protein_g),
    carb_g: parseOptionalNumber(params.form.carb_g),
    fat_g: parseOptionalNumber(params.form.fat_g),
    trainer_notes: params.form.trainer_notes.trim() || null,
    daily_notes: packDailyNotes(
      params.form.trainer_notes,
      params.form.days.map((day) => day.daily_note),
    ),
    days: params.form.days.map((day) => ({
      plan_id: params.newPeriod ? null : day.planId ?? null,
      date: day.date,
      water_goal: parseOptionalNumber(day.water_goal) ?? 4000,
      workout_title: day.workout_title.trim() || null,
      is_rest_day: day.is_rest_day,
      is_training_day: !day.is_rest_day,
      workouts: day.is_rest_day
        ? []
        : day.workouts
            .filter((row) => row.is_cardio || row.exercise_id.trim())
            .map((row) => {
              const scheme = row.is_cardio ? '' : normalizeSetsReps(row.reps_scheme);
              const { sets, reps } = parseSetsReps(scheme);
              return {
                id: row.id ?? null,
                exercise_id: row.exercise_id.trim() || null,
                target_sets: row.is_cardio ? null : parseOptionalNumber(sets),
                target_reps: row.is_cardio ? null : reps || null,
                reps_scheme: row.is_cardio ? null : scheme || null,
                rest_seconds: row.is_cardio ? null : parseOptionalNumber(row.rest_seconds),
                muscle_group: row.is_cardio ? 'cardio' : row.muscle_group || null,
                is_cardio: row.is_cardio,
                cardio_params: row.is_cardio ? row.cardio_params || null : null,
                weight_min: row.is_cardio ? null : parseOptionalNumber(row.weight_min),
                weight_max: row.is_cardio ? null : parseOptionalNumber(row.weight_max),
              };
            }),
      meals: day.meals.flatMap((meal) => {
        const foods = meal.foods.filter((food) => food.food_id.trim());
        if (foods.length === 0) return [];
        const content = foods
          .map((food) => {
            const qty = parseGrams(food.amount_grams);
            const unit = foodUnits.get(food.food_id);
            const amount = amountDisplayForSave(qty, unit);
            return `${food.food_name || 'Besin'}${amount ? ` ${amount}` : ''}`;
          })
          .join(', ');
        return [
          {
            id: meal.id ?? null,
            meal_type: meal.meal_type,
            content,
            foods: foods.map((food, index) => {
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
                order_index: index,
              };
            }),
          },
        ];
      }),
    })),
  };

  const { data, error } = await supabase.rpc('save_assignment', { payload });
  if (error) throw error;
  if (!data) throw new Error('Program kaydedilemedi.');
  return data as Program;
}
