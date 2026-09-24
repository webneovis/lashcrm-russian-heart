CREATE UNIQUE INDEX IF NOT EXISTS profiles_single_owner ON public.profiles ((true));
CREATE OR REPLACE FUNCTION public.owner_exists() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles) $$;
CREATE OR REPLACE FUNCTION public.claim_owner(_full_name text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE owner_id = auth.uid()) THEN RETURN true; END IF;
  IF EXISTS (SELECT 1 FROM public.profiles) THEN RETURN false; END IF;
  INSERT INTO public.profiles (owner_id, email, full_name)
  SELECT auth.uid(), u.email, COALESCE(NULLIF(_full_name, ''), 'Владелец салона') FROM auth.users u WHERE u.id = auth.uid();
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.owner_exists() FROM public;
REVOKE ALL ON FUNCTION public.claim_owner(text) FROM public;
GRANT EXECUTE ON FUNCTION public.owner_exists() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_owner(text) TO authenticated;