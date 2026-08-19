CREATE OR REPLACE FUNCTION app_private.save_assignment(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_actor uuid := (SELECT auth.uid());
  v_role text := app_private.current_role();
  v_student uuid;
  v_trainer uuid;
  v_publish boolean;
  v_new_period boolean;
  v_program_id uuid;
  v_status text;
  v_day jsonb;
  v_plan_id uuid;
  v_rest boolean;
  v_workout jsonb;
  v_meal jsonb;
  v_food jsonb;
  v_wid uuid;
  v_mid uuid;
  v_keep_w uuid[] := ARRAY[]::uuid[];
  v_keep_m uuid[] := ARRAY[]::uuid[];
  v_order int;
  v_old_fp text;
  v_new_fp text;
  v_keep_completed boolean;
  v_diet_id uuid;
  v_food_order int;
  v_old_meal_type text;
  v_result jsonb;
BEGIN
  IF v_role IS NULL OR v_role NOT IN ('trainer', 'admin') THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  v_student := (payload->>'student_id')::uuid;
  v_trainer := (payload->>'trainer_id')::uuid;
  v_publish := COALESCE((payload->>'publish')::boolean, false);
  v_new_period := COALESCE((payload->>'new_period')::boolean, false);
  v_program_id := NULLIF(btrim(COALESCE(payload->>'program_id', '')), '')::uuid;

  IF v_student IS NULL OR v_trainer IS NULL THEN
    RAISE EXCEPTION 'student_id and trainer_id required';
  END IF;

  IF v_role <> 'admin' THEN
    IF v_actor IS DISTINCT FROM v_trainer THEN
      RAISE EXCEPTION 'not allowed';
    END IF;
    IF NOT app_private.trains_student(v_student) THEN
      RAISE EXCEPTION 'not allowed';
    END IF;
  END IF;

  IF v_new_period THEN
    v_program_id := NULL;
  END IF;

  v_status := CASE WHEN v_publish THEN 'active' ELSE 'draft' END;

  IF v_publish THEN
    UPDATE public.programs
    SET status = 'archived'
    WHERE student_id = v_student
      AND status = 'active'
      AND (v_program_id IS NULL OR id IS DISTINCT FROM v_program_id);
  END IF;

  IF v_program_id IS NULL THEN
    INSERT INTO public.programs (
      student_id, trainer_id, start_date, end_date, title, status,
      start_weight, target_weight, kcal_target, protein_g, carb_g, fat_g,
      protein_g_off, carb_g_off, fat_g_off,
      trainer_notes, daily_notes
    ) VALUES (
      v_student,
      v_trainer,
      (payload->>'start_date')::date,
      (payload->>'end_date')::date,
      NULLIF(btrim(COALESCE(payload->>'title', '')), ''),
      v_status,
      NULLIF(payload->>'start_weight', '')::numeric,
      NULLIF(payload->>'target_weight', '')::numeric,
      NULLIF(payload->>'kcal_target', '')::integer,
      NULLIF(payload->>'protein_g', '')::numeric,
      NULLIF(payload->>'carb_g', '')::numeric,
      NULLIF(payload->>'fat_g', '')::numeric,
      NULLIF(payload->>'protein_g_off', '')::numeric,
      NULLIF(payload->>'carb_g_off', '')::numeric,
      NULLIF(payload->>'fat_g_off', '')::numeric,
      NULLIF(btrim(COALESCE(payload->>'trainer_notes', '')), ''),
      COALESCE(payload->'daily_notes', '{}'::jsonb)
    )
    RETURNING id INTO v_program_id;
  ELSE
    UPDATE public.programs
    SET
      trainer_id = v_trainer,
      start_date = (payload->>'start_date')::date,
      end_date = (payload->>'end_date')::date,
      title = NULLIF(btrim(COALESCE(payload->>'title', '')), ''),
      status = v_status,
      start_weight = NULLIF(payload->>'start_weight', '')::numeric,
      target_weight = NULLIF(payload->>'target_weight', '')::numeric,
      kcal_target = NULLIF(payload->>'kcal_target', '')::integer,
      protein_g = NULLIF(payload->>'protein_g', '')::numeric,
      carb_g = NULLIF(payload->>'carb_g', '')::numeric,
      fat_g = NULLIF(payload->>'fat_g', '')::numeric,
      protein_g_off = NULLIF(payload->>'protein_g_off', '')::numeric,
      carb_g_off = NULLIF(payload->>'carb_g_off', '')::numeric,
      fat_g_off = NULLIF(payload->>'fat_g_off', '')::numeric,
      trainer_notes = NULLIF(btrim(COALESCE(payload->>'trainer_notes', '')), ''),
      daily_notes = COALESCE(payload->'daily_notes', '{}'::jsonb)
    WHERE id = v_program_id
      AND student_id = v_student
    RETURNING id INTO v_program_id;

    IF v_program_id IS NULL THEN
      RAISE EXCEPTION 'program not found';
    END IF;
  END IF;

  FOR v_day IN SELECT * FROM jsonb_array_elements(COALESCE(payload->'days', '[]'::jsonb))
  LOOP
    v_plan_id := NULLIF(btrim(COALESCE(v_day->>'plan_id', '')), '')::uuid;
    v_rest := COALESCE((v_day->>'is_rest_day')::boolean, false);

    IF v_plan_id IS NOT NULL THEN
      UPDATE public.daily_plans
      SET
        date = (v_day->>'date')::date,
        water_goal = COALESCE(NULLIF(v_day->>'water_goal', '')::numeric, 4000),
        daily_note = NULL,
        workout_title = NULLIF(btrim(COALESCE(v_day->>'workout_title', '')), ''),
        is_rest_day = v_rest,
        is_training_day = COALESCE((v_day->>'is_training_day')::boolean, NOT v_rest)
      WHERE id = v_plan_id AND program_id = v_program_id;
      IF NOT FOUND THEN
        v_plan_id := NULL;
      END IF;
    END IF;

    IF v_plan_id IS NULL THEN
      INSERT INTO public.daily_plans (
        program_id, date, water_goal, water_consumed, daily_note,
        workout_title, is_rest_day, is_training_day, steps_count
      ) VALUES (
        v_program_id,
        (v_day->>'date')::date,
        COALESCE(NULLIF(v_day->>'water_goal', '')::numeric, 4000),
        0,
        NULL,
        NULLIF(btrim(COALESCE(v_day->>'workout_title', '')), ''),
        v_rest,
        COALESCE((v_day->>'is_training_day')::boolean, NOT v_rest),
        0
      )
      ON CONFLICT (program_id, date) DO UPDATE SET
        water_goal = EXCLUDED.water_goal,
        daily_note = NULL,
        workout_title = EXCLUDED.workout_title,
        is_rest_day = EXCLUDED.is_rest_day,
        is_training_day = EXCLUDED.is_training_day
      RETURNING id INTO v_plan_id;
    END IF;

    v_keep_w := ARRAY[]::uuid[];
    v_keep_m := ARRAY[]::uuid[];

    IF v_rest THEN
      DELETE FROM public.daily_workouts WHERE daily_plan_id = v_plan_id;
    ELSE
      v_order := 0;
      FOR v_workout IN SELECT * FROM jsonb_array_elements(COALESCE(v_day->'workouts', '[]'::jsonb))
      LOOP
        v_order := v_order + 1;
        v_wid := NULLIF(btrim(COALESCE(v_workout->>'id', '')), '')::uuid;

        IF v_wid IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.daily_workouts w WHERE w.id = v_wid AND w.daily_plan_id = v_plan_id
        ) THEN
          UPDATE public.daily_workouts
          SET
            exercise_id = NULLIF(btrim(COALESCE(v_workout->>'exercise_id', '')), '')::uuid,
            order_index = v_order,
            target_sets = NULLIF(v_workout->>'target_sets', '')::integer,
            target_reps = NULLIF(v_workout->>'target_reps', ''),
            reps_scheme = NULLIF(v_workout->>'reps_scheme', ''),
            rest_seconds = NULLIF(v_workout->>'rest_seconds', '')::integer,
            muscle_group = NULLIF(v_workout->>'muscle_group', ''),
            is_cardio = COALESCE((v_workout->>'is_cardio')::boolean, false),
            cardio_params = NULLIF(v_workout->>'cardio_params', ''),
            weight_min = NULLIF(v_workout->>'weight_min', '')::numeric,
            weight_max = NULLIF(v_workout->>'weight_max', '')::numeric
          WHERE id = v_wid;
          v_keep_w := v_keep_w || v_wid;
        ELSE
          INSERT INTO public.daily_workouts (
            daily_plan_id, exercise_id, order_index, target_sets, target_reps, reps_scheme,
            rest_seconds, muscle_group, is_cardio, cardio_params, weight_min, weight_max,
            actual_weight_used, student_note, is_completed
          ) VALUES (
            v_plan_id,
            NULLIF(btrim(COALESCE(v_workout->>'exercise_id', '')), '')::uuid,
            v_order,
            NULLIF(v_workout->>'target_sets', '')::integer,
            NULLIF(v_workout->>'target_reps', ''),
            NULLIF(v_workout->>'reps_scheme', ''),
            NULLIF(v_workout->>'rest_seconds', '')::integer,
            NULLIF(v_workout->>'muscle_group', ''),
            COALESCE((v_workout->>'is_cardio')::boolean, false),
            NULLIF(v_workout->>'cardio_params', ''),
            NULLIF(v_workout->>'weight_min', '')::numeric,
            NULLIF(v_workout->>'weight_max', '')::numeric,
            NULL,
            NULL,
            false
          )
          RETURNING id INTO v_wid;
          v_keep_w := v_keep_w || v_wid;
        END IF;
      END LOOP;

      IF cardinality(v_keep_w) = 0 THEN
        DELETE FROM public.daily_workouts WHERE daily_plan_id = v_plan_id;
      ELSE
        DELETE FROM public.daily_workouts
        WHERE daily_plan_id = v_plan_id AND NOT (id = ANY (v_keep_w));
      END IF;
    END IF;

    FOR v_meal IN SELECT * FROM jsonb_array_elements(COALESCE(v_day->'meals', '[]'::jsonb))
    LOOP
      IF jsonb_array_length(COALESCE(v_meal->'foods', '[]'::jsonb)) = 0 THEN
        CONTINUE;
      END IF;

      v_new_fp := (
        SELECT COALESCE(string_agg(
          COALESCE(f->>'food_id', '') || ':'
            || COALESCE(round(NULLIF(f->>'amount_in_grams', '')::numeric, 2)::text, '')
            || ':' || COALESCE(f->>'training_day_only', 'false'),
          '|' ORDER BY COALESCE(NULLIF(f->>'order_index', '')::int, 0)
        ), '')
        FROM jsonb_array_elements(v_meal->'foods') f
      );

      v_mid := NULLIF(btrim(COALESCE(v_meal->>'id', '')), '')::uuid;
      v_diet_id := NULL;
      v_keep_completed := false;

      IF v_mid IS NOT NULL THEN
        SELECT d.id INTO v_diet_id
        FROM public.daily_diets d
        WHERE d.id = v_mid AND d.daily_plan_id = v_plan_id;
      END IF;

      IF v_diet_id IS NOT NULL THEN
        SELECT COALESCE(string_agg(
          COALESCE(food_id::text, '') || ':' || COALESCE(round(amount_in_grams, 2)::text, '')
            || ':' || training_day_only::text,
          '|' ORDER BY order_index
        ), '')
        INTO v_old_fp
        FROM public.diet_foods
        WHERE daily_diet_id = v_diet_id;

        SELECT meal_type, is_completed INTO v_old_meal_type, v_keep_completed
        FROM public.daily_diets WHERE id = v_diet_id;

        IF v_old_meal_type IS DISTINCT FROM (v_meal->>'meal_type')
          OR v_old_fp IS DISTINCT FROM v_new_fp THEN
          v_keep_completed := false;
        END IF;

        UPDATE public.daily_diets
        SET
          meal_type = v_meal->>'meal_type',
          content = COALESCE(v_meal->>'content', ''),
          is_completed = v_keep_completed
        WHERE id = v_diet_id;

        DELETE FROM public.diet_foods WHERE daily_diet_id = v_diet_id;
      ELSE
        INSERT INTO public.daily_diets (daily_plan_id, meal_type, content, is_completed)
        VALUES (
          v_plan_id,
          v_meal->>'meal_type',
          COALESCE(v_meal->>'content', ''),
          false
        )
        RETURNING id INTO v_diet_id;
      END IF;

      v_food_order := 0;
      FOR v_food IN SELECT * FROM jsonb_array_elements(v_meal->'foods')
      LOOP
        INSERT INTO public.diet_foods (
          daily_diet_id, food_id, food_name, amount, amount_in_grams, note,
          training_day_only, order_index
        ) VALUES (
          v_diet_id,
          NULLIF(btrim(COALESCE(v_food->>'food_id', '')), '')::uuid,
          COALESCE(NULLIF(btrim(v_food->>'food_name'), ''), 'Besin'),
          NULLIF(v_food->>'amount', ''),
          NULLIF(v_food->>'amount_in_grams', '')::numeric,
          NULLIF(v_food->>'note', ''),
          COALESCE((v_food->>'training_day_only')::boolean, false),
          COALESCE(NULLIF(v_food->>'order_index', '')::integer, v_food_order)
        );
        v_food_order := v_food_order + 1;
      END LOOP;

      v_keep_m := v_keep_m || v_diet_id;
    END LOOP;

    IF cardinality(v_keep_m) = 0 THEN
      DELETE FROM public.daily_diets WHERE daily_plan_id = v_plan_id;
    ELSE
      DELETE FROM public.daily_diets
      WHERE daily_plan_id = v_plan_id AND NOT (id = ANY (v_keep_m));
    END IF;
  END LOOP;

  SELECT to_jsonb(p.*) INTO v_result FROM public.programs p WHERE p.id = v_program_id;
  RETURN v_result;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.save_assignment(payload jsonb)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path TO 'public'
AS $fn$
  SELECT app_private.save_assignment(payload);
$fn$;

REVOKE ALL ON FUNCTION public.save_assignment(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.save_assignment(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.save_assignment(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_assignment(jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.save_assignment(jsonb) FROM anon;
REVOKE ALL ON FUNCTION app_private.save_assignment(jsonb) FROM anon;
