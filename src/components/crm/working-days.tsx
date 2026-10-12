import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";

export function useWorkingDays() {
  const [days, setDays] = useState<Set<string>>(new Set());
  useEffect(() => {
    void supabase.from("working_days").select("work_date").then(({ data, error }) => {
      if (error) toast.error("Не удалось загрузить рабочие дни");
      setDays(new Set((data ?? []).map(d => d.work_date)));
    });
  }, []);
  const toggle = async (key: string, on: boolean) => {
    setDays(prev => { const n = new Set(prev); if (on) n.add(key); else n.delete(key); return n; });
    const { error } = on
      ? await supabase.from("working_days").insert({ work_date: key })
      : await supabase.from("working_days").delete().eq("work_date", key);
    if (error) {
      toast.error("Не удалось сохранить рабочий день");
      setDays(prev => { const n = new Set(prev); if (on) n.delete(key); else n.add(key); return n; });
    }
  };
  return { days, toggle };
}

export function WorkingDaysEditor({ range, keyOf, days, toggle }: { range: Date[]; keyOf: (d: Date) => string; days: Set<string>; toggle: (k: string, on: boolean) => void }) {
  const blanks = ((range[0]?.getDay() ?? 1) + 6) % 7;
  return <div className="workdays-editor">
    <p className="workdays-hint">Переключите день, чтобы сделать его рабочим. По умолчанию все дни нерабочие.</p>
    <div className="workdays-grid">
      {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map(d => <span key={d} className="workdays-weekday">{d}</span>)}
      {Array.from({ length: blanks }, (_, i) => <span key={`b${i}`} className="workdays-blank" />)}
      {range.map(day => { const k = keyOf(day); const on = days.has(k); return <label key={k} className={`workdays-cell ${on ? "is-working" : ""}`}>
        <b>{day.getDate()}</b>
        <Switch checked={on} onCheckedChange={v => toggle(k, v)} aria-label={`${day.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}: ${on ? "рабочий" : "нерабочий"}`} />
        <small>{on ? "Рабочий" : "Выходной"}</small>
      </label>; })}
    </div>
  </div>;
}
