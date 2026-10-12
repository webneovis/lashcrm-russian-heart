import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Edit2, Plus, Settings, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/crm/shell";
import { type Appointment, money, statusLabels, useCRM } from "@/components/crm/data";
import { AppointmentForm } from "@/components/crm/appointment-form";
import { WorkingDaysEditor, useWorkingDays } from "@/components/crm/working-days";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/appointments")({
  head: () => ({ meta: [{ title: "Записи — LashCRM" }, { name: "description", content: "Календарь записей салона" }, { property: "og:title", content: "Записи — LashCRM" }, { property: "og:description", content: "Календарь и управление записями" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Appointments,
});

const localDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function Appointments() {
  const { appointments, clients, services, removeAppointment } = useCRM();
  const [date, setDate] = useState(new Date());
  const [mode, setMode] = useState<"day" | "week" | "month">("week");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [setup, setSetup] = useState(false);
  const { days: workDays, toggle: toggleDay } = useWorkingDays();
  const dateKey = localDateKey(date);
  const todayKey = localDateKey(new Date());
  const range = useMemo(() => {
    const start = new Date(date);
    if (mode === "week") start.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    if (mode === "month") start.setDate(1);
    const days = mode === "day" ? 1 : mode === "week" ? 7 : new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => { const day = new Date(start); day.setDate(start.getDate() + i); return day; });
  }, [date, mode]);
  const move = (step: number) => {
    const next = new Date(date);
    if (mode === "month") { next.setDate(1); next.setMonth(next.getMonth() + step); }
    else next.setDate(next.getDate() + step * (mode === "week" ? 7 : 1));
    setDate(next);
  };
  const renderItems = (key: string) => {
    const items = appointments.filter(a => a.appointment_date === key).sort((a, b) => a.start_time.localeCompare(b.start_time));
    return items.length ? <div className="space-y-2">{items.map(a => {
      const client = clients.find(c => c.id === a.client_id);
      const service = services.find(s => s.id === a.service_id);
      return <article key={a.id} className={`appointment-chip appointment-${a.status}`}>
        <div className="appointment-summary"><strong>{a.start_time.slice(0, 5)}</strong><span>{money(Number(a.price))}</span></div>
        <p>{client?.full_name}</p><small>{service?.name}</small>
        <div className="appointment-footer"><span>{statusLabels[a.status]}</span><div className="appointment-actions">
          <Button variant="ghost" size="icon" title="Редактировать запись" aria-label="Редактировать запись" onClick={() => { setEditing(a); setOpen(true); }}><Edit2 /></Button>
          <Button variant="ghost" size="icon" title="Удалить запись" aria-label="Удалить запись" onClick={() => { if (confirm("Удалить запись?")) void removeAppointment(a.id); }}><Trash2 /></Button>
        </div></div>
      </article>;
    })}</div> : <p className="calendar-empty">Нет записей</p>;
  };
  return <>
    <PageHeader title="Записи" subtitle="Планируйте визиты и управляйте расписанием" action={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus />Добавить запись</Button>} />
    <div className="calendar-controls">
      <div className="calendar-navigation"><div className="flex shrink-0 items-center gap-1"><Button variant="outline" size="icon" onClick={() => move(-1)} aria-label="Назад"><ChevronLeft /></Button><Button variant="outline" onClick={() => setDate(new Date())}>Сегодня</Button><Button variant="outline" size="icon" onClick={() => move(1)} aria-label="Вперёд"><ChevronRight /></Button></div><div className="flex min-w-0 items-center justify-end gap-1 sm:justify-start"><strong className="min-w-0 capitalize">{date.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}</strong><Button variant={setup ? "default" : "ghost"} size="icon" title="Настроить рабочие дни" aria-label="Настроить рабочие дни" aria-pressed={setup} onClick={() => { setSetup(!setup); if (!setup) setMode("month"); }}><Settings /></Button></div></div>
      {!setup && <div className="segmented">{([['day', 'День'], ['week', 'Неделя'], ['month', 'Месяц']] as const).map(([value, label]) => <Button variant="ghost" key={value} aria-pressed={mode === value} className={mode === value ? "active" : ""} onClick={() => setMode(value)}>{label}</Button>)}</div>}
      {setup && <Button variant="outline" onClick={() => setSetup(false)}>Готово</Button>}
    </div>
    {setup ? <WorkingDaysEditor range={range} keyOf={localDateKey} days={workDays} toggle={(k, on) => void toggleDay(k, on)} /> : <>
    {mode === "month" && <div className="mobile-month-calendar">
      <div className="mobile-month-weekdays">{["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map(day => <span key={day}>{day}</span>)}</div>
      <div className="mobile-month-dates">
        {Array.from({ length: ((range[0]?.getDay() ?? 1) + 6) % 7 }, (_, i) => <span key={`blank-${i}`} />)}
        {range.map(day => { const key = localDateKey(day); const count = appointments.filter(a => a.appointment_date === key).length; return <Button key={key} variant="ghost" className={`mobile-date ${key === dateKey ? "selected" : ""} ${key === todayKey ? "today" : ""} ${workDays.has(key) ? "" : "is-off"}`} aria-pressed={key === dateKey} aria-label={`${day.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}, записей: ${count}`} onClick={() => setDate(day)}><b>{day.getDate()}</b><span>{count > 0 ? count : ""}</span></Button>; })}
      </div>
      <section className="mobile-day-agenda"><h2>{date.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}{workDays.has(dateKey) ? "" : " · выходной"}</h2>{renderItems(dateKey)}</section>
    </div>}
    <div className={`calendar-grid calendar-${mode}`}>{range.map(day => { const key = localDateKey(day); const off = !workDays.has(key); return <section key={key} className={`calendar-day ${key === todayKey ? "is-current" : ""} ${off ? "is-off" : ""}`}><header><span>{day.toLocaleDateString("ru-RU", { weekday: "short" })}{off ? " · выходной" : ""}</span><b>{day.getDate()}</b></header>{renderItems(key)}</section>; })}</div>
    </>}
    <AppointmentForm open={open} onOpenChange={setOpen} editing={editing} />
  </>;
}