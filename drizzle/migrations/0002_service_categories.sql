CREATE TABLE public.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_categories TO authenticated;
GRANT ALL ON public.service_categories TO service_role;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Владелец управляет своими категориями" ON public.service_categories FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
ALTER TABLE public.services ADD COLUMN category_id uuid REFERENCES public.service_categories(id) ON DELETE SET NULL;
INSERT INTO public.service_categories (owner_id, name, created_at)
SELECT o.owner_id, n.name, now() + n.ord * interval '1 second'
FROM (SELECT DISTINCT owner_id FROM public.services) o
CROSS JOIN (VALUES ('Ресницы', 0), ('Брови', 1)) AS n(name, ord);
UPDATE public.services s SET category_id = c.id FROM public.service_categories c
WHERE c.owner_id = s.owner_id AND c.name = CASE WHEN s.name ILIKE '%бров%' THEN 'Брови' ELSE 'Ресницы' END;