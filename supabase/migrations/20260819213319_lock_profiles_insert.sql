DROP POLICY IF EXISTS profiles_insert ON public.profiles;

CREATE OR REPLACE FUNCTION app_private.profiles_guard_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'profiles insert not allowed';
END;
$fn$;

DROP TRIGGER IF EXISTS profiles_guard_insert ON public.profiles;
CREATE TRIGGER profiles_guard_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION app_private.profiles_guard_insert();

REVOKE INSERT ON public.profiles FROM anon, authenticated, PUBLIC;
