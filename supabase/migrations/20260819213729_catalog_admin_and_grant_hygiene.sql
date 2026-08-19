DROP POLICY IF EXISTS exercises_insert ON public.exercises;
DROP POLICY IF EXISTS exercises_update ON public.exercises;
DROP POLICY IF EXISTS exercises_delete ON public.exercises;
CREATE POLICY exercises_insert ON public.exercises FOR INSERT TO authenticated WITH CHECK ("current_role"() = 'admin');
CREATE POLICY exercises_update ON public.exercises FOR UPDATE TO authenticated USING ("current_role"() = 'admin') WITH CHECK ("current_role"() = 'admin');
CREATE POLICY exercises_delete ON public.exercises FOR DELETE TO authenticated USING ("current_role"() = 'admin');

DROP POLICY IF EXISTS foods_insert ON public.foods;
DROP POLICY IF EXISTS foods_update ON public.foods;
DROP POLICY IF EXISTS foods_delete ON public.foods;
CREATE POLICY foods_insert ON public.foods FOR INSERT TO authenticated WITH CHECK ("current_role"() = 'admin');
CREATE POLICY foods_update ON public.foods FOR UPDATE TO authenticated USING ("current_role"() = 'admin') WITH CHECK ("current_role"() = 'admin');
CREATE POLICY foods_delete ON public.foods FOR DELETE TO authenticated USING ("current_role"() = 'admin');

DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM authenticated, anon, PUBLIC', r.tablename);
  END LOOP;
END $$;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app_private FROM anon, PUBLIC;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app_private TO authenticated;
REVOKE ALL ON FUNCTION public.current_role() FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.is_active_student() FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.trains_student(uuid) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.save_assignment(jsonb) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_student() TO authenticated;
GRANT EXECUTE ON FUNCTION public.trains_student(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_assignment(jsonb) TO authenticated;
