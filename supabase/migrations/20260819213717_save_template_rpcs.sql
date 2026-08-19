CREATE OR REPLACE FUNCTION app_private.save_workout_template(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_actor uuid := (SELECT auth.uid());
  v_role text := app_private.current_role();
  v_trainer uuid;
  v_template uuid;
  v_item jsonb;
  v_order int := 0;
  v_result jsonb;
BEGIN
  IF v_role IS NULL OR v_role NOT IN ('trainer', 'admin') THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  v_trainer := (payload->>'trainer_id')::uuid;
  v_template := NULLIF(btrim(COALESCE(payload->>'template_id', '')), '')::uuid;

  IF v_trainer IS NULL THEN
    RAISE EXCEPTION 'trainer_id required';
  END IF;
  IF v_role <> 'admin' AND v_actor IS DISTINCT FROM v_trainer THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  IF v_template IS NULL THEN
    INSERT INTO public.workout_templates (trainer_id, name, muscle_group)
    VALUES (
      v_trainer,
      NULLIF(btrim(COALESCE(payload->>'name', '')), ''),
      NULLIF(btrim(COALESCE(payload->>'muscle_group', '')), '')
    )
    RETURNING id INTO v_template;
  ELSE
    UPDATE public.workout_templates
    SET
      name = NULLIF(btrim(COALESCE(payload->>'name', '')), ''),
      muscle_group = NULLIF(btrim(COALESCE(payload->>'muscle_group', '')), '')
    WHERE id = v_template
      AND (trainer_id = v_actor OR v_role = 'admin')
    RETURNING id INTO v_template;
    IF v_template IS NULL THEN
      RAISE EXCEPTION 'template not found';
    END IF;
    DELETE FROM public.workout_template_items WHERE template_id = v_template;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(payload->'items', '[]'::jsonb))
  LOOP
    v_order := v_order + 1;
    INSERT INTO public.workout_template_items (
      template_id, exercise_id, order_index, reps_scheme, rest_seconds,
      weight_min, weight_max, is_cardio, cardio_params, muscle_group
    ) VALUES (
      v_template,
      NULLIF(btrim(COALESCE(v_item->>'exercise_id', '')), '')::uuid,
      v_order,
      NULLIF(v_item->>'reps_scheme', ''),
      NULLIF(v_item->>'rest_seconds', '')::integer,
      NULLIF(v_item->>'weight_min', '')::numeric,
      NULLIF(v_item->>'weight_max', '')::numeric,
      COALESCE((v_item->>'is_cardio')::boolean, false),
      NULLIF(v_item->>'cardio_params', ''),
      NULLIF(v_item->>'muscle_group', '')
    );
  END LOOP;

  SELECT to_jsonb(t.*) INTO v_result FROM public.workout_templates t WHERE t.id = v_template;
  RETURN v_result;
END;
$fn$;

CREATE OR REPLACE FUNCTION app_private.save_diet_template(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_actor uuid := (SELECT auth.uid());
  v_role text := app_private.current_role();
  v_trainer uuid;
  v_template uuid;
  v_meal jsonb;
  v_food jsonb;
  v_meal_id uuid;
  v_sort int := 0;
  v_food_order int;
  v_result jsonb;
BEGIN
  IF v_role IS NULL OR v_role NOT IN ('trainer', 'admin') THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  v_trainer := (payload->>'trainer_id')::uuid;
  v_template := NULLIF(btrim(COALESCE(payload->>'template_id', '')), '')::uuid;

  IF v_trainer IS NULL THEN
    RAISE EXCEPTION 'trainer_id required';
  END IF;
  IF v_role <> 'admin' AND v_actor IS DISTINCT FROM v_trainer THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  IF v_template IS NULL THEN
    INSERT INTO public.diet_templates (trainer_id, name)
    VALUES (v_trainer, NULLIF(btrim(COALESCE(payload->>'name', '')), ''))
    RETURNING id INTO v_template;
  ELSE
    UPDATE public.diet_templates
    SET name = NULLIF(btrim(COALESCE(payload->>'name', '')), '')
    WHERE id = v_template
      AND (trainer_id = v_actor OR v_role = 'admin')
    RETURNING id INTO v_template;
    IF v_template IS NULL THEN
      RAISE EXCEPTION 'template not found';
    END IF;
    DELETE FROM public.diet_template_meals WHERE template_id = v_template;
  END IF;

  FOR v_meal IN SELECT * FROM jsonb_array_elements(COALESCE(payload->'meals', '[]'::jsonb))
  LOOP
    IF jsonb_array_length(COALESCE(v_meal->'foods', '[]'::jsonb)) = 0 THEN
      CONTINUE;
    END IF;
    INSERT INTO public.diet_template_meals (template_id, meal_type, sort_index)
    VALUES (v_template, v_meal->>'meal_type', v_sort)
    RETURNING id INTO v_meal_id;
    v_sort := v_sort + 1;
    v_food_order := 0;
    FOR v_food IN SELECT * FROM jsonb_array_elements(v_meal->'foods')
    LOOP
      INSERT INTO public.diet_template_foods (
        meal_id, food_id, food_name, amount, amount_in_grams, note,
        training_day_only, order_index
      ) VALUES (
        v_meal_id,
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
  END LOOP;

  SELECT to_jsonb(t.*) INTO v_result FROM public.diet_templates t WHERE t.id = v_template;
  RETURN v_result;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.save_workout_template(payload jsonb)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path TO 'public'
AS $fn$ SELECT app_private.save_workout_template(payload) $fn$;

CREATE OR REPLACE FUNCTION public.save_diet_template(payload jsonb)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path TO 'public'
AS $fn$ SELECT app_private.save_diet_template(payload) $fn$;

REVOKE ALL ON FUNCTION app_private.save_workout_template(jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app_private.save_diet_template(jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.save_workout_template(jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.save_diet_template(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.save_workout_template(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.save_diet_template(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_workout_template(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_diet_template(jsonb) TO authenticated;
