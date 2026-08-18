import type {
  DailyDiet,
  DailyPlan,
  DailyWorkout,
  Exercise,
  Food,
  MealType,
  Measurement,
  Profile,
  Program,
} from '../types/database';
import type { AssignmentForm, DayAssignment } from '../forms/studentDayAssignment';
import { normalizeSetsReps, parseSetsReps } from '../forms/setsReps';
import { MEASUREMENT_COLUMNS, PLAN_EMBED, PROFILE_COLUMNS, PROGRAM_COLUMNS } from './queries';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { amountDisplayForSave, gramsFromQuantity, parseGrams } from '../forms/macros';
import { packDailyNotes } from '../forms/dailyNotes';
import { addDaysIso, parseOptionalNumber, todayIsoDate } from '../utils/format';
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

function statusFromPlan(plan: StudentPlanDay | null | undefined): StudentStatus {
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

  return {
    hasDailyNote: Boolean(plan.daily_note?.trim()),
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

  const { data: planRows, error: plansError } = await supabase
    .from('daily_plans')
    .select(
      `
      ${PLAN_EMBED},
      programs!inner ( id, student_id, status )
    `,
    )
    .eq('date', today)
    .in('programs.student_id', ids);

  if (plansError) {
    console.warn('[trainer] today plan status query failed:', plansError.message);
  } else {
    for (const row of planRows ?? []) {
      const typed = row as unknown as DailyPlan & {
        programs: { id: string; student_id: string } | { id: string; student_id: string }[];
        daily_workouts?: WorkoutWithExercise[] | null;
        daily_diets?: DietWithFoods[] | null;
      };
      const program = Array.isArray(typed.programs) ? typed.programs[0] : typed.programs;
      if (!program?.student_id) continue;
      planByStudent.set(program.student_id, toStudentPlanDay(typed, program.student_id));
    }
  }

  const unreadCounts = await fetchUnreadNoteCounts(trainerId).catch(() => ({} as Record<string, number>));

  return (students as Profile[]).map((student) => {
    const status = statusFromPlan(planByStudent.get(student.id));
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

export async function fetchLatestProgramForStudent(
  studentId: string,
): Promise<Program | null> {
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

export async function fetchStudentPlanForDate(
  studentId: string,
  date: string,
): Promise<StudentPlanDay | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('daily_plans')
    .select(
      `
      ${PLAN_EMBED},
      programs!inner ( id, student_id )
    `,
    )
    .eq('date', date)
    .eq('programs.student_id', studentId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const typed = data as unknown as DailyPlan & {
    programs: { id: string; student_id: string } | { id: string; student_id: string }[];
    daily_workouts?: WorkoutWithExercise[] | null;
    daily_diets?: DietWithFoods[] | null;
  };
  const program = Array.isArray(typed.programs) ? typed.programs[0] : typed.programs;
  return toStudentPlanDay(typed, program?.student_id ?? studentId);
}

async function replaceDayContents(planId: string, day: DayAssignment): Promise<void> {
  await supabase.from('daily_workouts').delete().eq('daily_plan_id', planId);
  await supabase.from('daily_diets').delete().eq('daily_plan_id', planId);

  const workoutRows = day.workouts
    .filter((row) => row.is_cardio || row.exercise_id.trim())
    .map((row, index) => {
      const scheme = row.is_cardio ? '' : normalizeSetsReps(row.reps_scheme);
      const { sets, reps } = parseSetsReps(scheme);
      return {
      daily_plan_id: planId,
      exercise_id: row.exercise_id.trim() || null,
      order_index: index + 1,
      target_sets: row.is_cardio ? null : parseOptionalNumber(sets),
      target_reps: row.is_cardio ? null : reps || null,
      reps_scheme: row.is_cardio ? null : scheme || null,
      rest_seconds: row.is_cardio ? null : parseOptionalNumber(row.rest_seconds),
      muscle_group: row.is_cardio ? 'cardio' : row.muscle_group || null,
      is_cardio: row.is_cardio,
      cardio_params: row.is_cardio ? row.cardio_params || null : null,
      weight_min: row.is_cardio ? null : parseOptionalNumber(row.weight_min),
      weight_max: row.is_cardio ? null : parseOptionalNumber(row.weight_max),
      actual_weight_used: null,
      student_note: null,
      is_completed: false,
    };
    });

  if (workoutRows.length > 0) {
    const { error } = await supabase.from('daily_workouts').insert(workoutRows);
    if (error) throw error;
  }

  const foodUnits = await fetchFoodUnitMap(
    day.meals.flatMap((meal) => meal.foods.map((food) => food.food_id)),
  );

  for (const meal of day.meals) {
    const foods = meal.foods.filter((food) => food.food_id.trim());
    if (foods.length === 0) continue;

    const content = foods
      .map((food) => {
        const qty = parseGrams(food.amount_grams);
        const unit = foodUnits.get(food.food_id);
        const amount = amountDisplayForSave(qty, unit);
        return `${food.food_name || 'Besin'}${amount ? ` ${amount}` : ''}`;
      })
      .join(', ');

    const { data: dietRow, error: dietError } = await supabase
      .from('daily_diets')
      .insert({
        daily_plan_id: planId,
        meal_type: meal.meal_type as MealType,
        content,
        is_completed: false,
      })
      .select('id')
      .single();

    if (dietError) throw dietError;

    if (dietRow) {
      const { error: foodError } = await supabase.from('diet_foods').insert(
        foods.map((food, index) => {
          const qty = parseGrams(food.amount_grams);
          const unit = foodUnits.get(food.food_id);
          const grams = gramsFromQuantity(qty, unit);
          return {
            daily_diet_id: dietRow.id,
            food_id: food.food_id.trim() || null,
            food_name: food.food_name.trim() || 'Besin',
            amount: amountDisplayForSave(qty, unit),
            amount_in_grams: grams > 0 ? grams : null,
            note: food.note.trim() || null,
            training_day_only: food.training_day_only,
            order_index: index,
          };
        }),
      );
      if (foodError) throw foodError;
    }
  }
}

export async function publishAssignment(params: {
  studentId: string;
  trainerId: string;
  form: AssignmentForm;
  existingProgramId?: string | null;
  publish: boolean;
}): Promise<Program> {
  const startDate = params.form.days[0]?.date ?? todayIsoDate();
  const endDate = addDaysIso(startDate, PROGRAM_LENGTH_DAYS - 1);
  const status = params.publish ? 'active' : 'draft';

  const payload = {
    student_id: params.studentId,
    trainer_id: params.trainerId,
    start_date: startDate,
    end_date: endDate,
    title: params.form.title.trim() || '14 günlük program',
    status,
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
  };

  let program: Program;

  if (params.existingProgramId) {
    const { data, error } = await supabase
      .from('programs')
      .update(payload)
      .eq('id', params.existingProgramId)
      .select(PROGRAM_COLUMNS)
      .single();
    if (error) throw error;
    program = data as Program;
  } else {
    const { data, error } = await supabase
      .from('programs')
      .insert(payload)
      .select(PROGRAM_COLUMNS)
      .single();
    if (error) throw error;
    program = data as Program;
  }

  const writeDay = async (day: (typeof params.form.days)[number]) => {
    const planFields = {
      program_id: program.id,
      date: day.date,
      water_goal: parseOptionalNumber(day.water_goal) ?? 4000,
      water_consumed: 0,
      daily_note: null,
      workout_title: day.workout_title.trim() || null,
      is_rest_day: day.is_rest_day,
      is_training_day: day.is_training_day,
      steps_count: 0,
    };

    let planId = day.planId;
    if (planId) {
      const { error } = await supabase.from('daily_plans').update(planFields).eq('id', planId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from('daily_plans')
        .upsert(planFields, { onConflict: 'program_id,date' })
        .select('id')
        .single();
      if (error) throw error;
      planId = data.id as string;
    }

    if (!planId) {
      throw new Error(`${day.date} için günlük plan bulunamadı.`);
    }

    await replaceDayContents(planId, day);
  };

  const BATCH = 4;
  for (let index = 0; index < params.form.days.length; index += BATCH) {
    await Promise.all(params.form.days.slice(index, index + BATCH).map(writeDay));
  }

  return program;
}

export async function addStudentMeasurement(
  studentId: string,
  fields: Partial<Measurement> & { date: string },
): Promise<Measurement> {
  const { data, error } = await supabase
    .from('measurements')
    .insert({
      student_id: studentId,
      source: fields.source ?? 'manual',
      body_fat: fields.body_fat ?? fields.body_fat_percent ?? null,
      ...fields,
    })
    .select(MEASUREMENT_COLUMNS)
    .single();

  if (error) throw error;
  return data as Measurement;
}

export async function fetchStudentMeasurements(studentId: string): Promise<Measurement[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('measurements')
    .select(MEASUREMENT_COLUMNS)
    .eq('student_id', studentId)
    .order('date', { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data ?? []) as Measurement[];
}

export async function assignWorkoutExercise(params: {
  studentId: string;
  date: string;
  exerciseId: string;
  targetSets: number;
  targetReps: number;
  workoutTitle?: string;
}): Promise<void> {
  const plan = await fetchStudentPlanForDate(params.studentId, params.date);
  if (!plan) {
    throw new Error('Önce 14 günlük program oluştur, sonra egzersiz ata.');
  }

  const { count } = await supabase
    .from('daily_workouts')
    .select('id', { count: 'exact', head: true })
    .eq('daily_plan_id', plan.id);

  const { error } = await supabase.from('daily_workouts').insert({
    daily_plan_id: plan.id,
    exercise_id: params.exerciseId,
    order_index: (count ?? 0) + 1,
    target_sets: params.targetSets,
    target_reps: String(params.targetReps),
    reps_scheme: String(params.targetReps),
    is_completed: false,
  });

  if (error) throw error;
}

export async function assignDietMeal(params: {
  studentId: string;
  date: string;
  mealType: MealType;
  content: string;
}): Promise<void> {
  const plan = await fetchStudentPlanForDate(params.studentId, params.date);
  if (!plan) {
    throw new Error('Önce 14 günlük program oluştur, sonra öğün ata.');
  }

  const { error } = await supabase.from('daily_diets').insert({
    daily_plan_id: plan.id,
    meal_type: params.mealType,
    content: params.content,
    is_completed: false,
  });

  if (error) throw error;
}

export type { DailyDiet, DailyWorkout };
