CREATE TABLE public.working_days (
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  work_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, work_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.working_days TO authenticated;
GRANT ALL ON public.working_days TO service_role;
ALTER TABLE public.working_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Владелец управляет рабочими днями" ON public.working_days FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());