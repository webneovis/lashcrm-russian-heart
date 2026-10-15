import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Trash2 } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/crm/shell";
import { type Appointment, cancelReasonLabels, hasConflict, money, toMin, useCRM } from "@/components/crm/data";
import { FormModal, Field } from "@/components/crm/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/cancellations")({
  head: () => ({ meta: [{ title: "Журнал отмен — LashCRM" }, { name: "description", content: "Отменённые записи салона" }, { property: "og:title", content: "Журнал отмен — LashCRM" }, { property: "og:description", content: "Отменённые записи и их перенос" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Cancellations,
});

function Cancellations() {
  const { appointments, breaks, clients, services, rescheduleAppointment, removeAppointment } = useCRM();
  const [filter, setFilter] = useState<"master" | "client">("master");
  const [moving, setMoving] = useState<Appointment | null>(null);
  const [form, setForm] = useState({ date: "", start: "", end: "" });
  const cancelled = appointments.filter(a => a.status === "cancelled");
  const reasonOf = (a: Appointment) => (a.cancel_reason === "client" ? "client" : "master");
  const list = cancelled.filter(a => reasonOf(a) === filter).sort((a, b) => (a.appointment_date + a.start_time).localeCompare(b.appointment_date + b.start_time));
  const openMove = (a: Appointment) => { setMoving(a); setForm({ date: a.appointment_date, start: a.start_time.slice(0, 5), end: a.end_time.slice(0, 5) }); };
  const shiftEnd = (start: string) => {
    if (!moving || !start) return form.end;
    const dur = toMin(moving.end_time) - toMin(moving.start_time);
    const m = Math.min(toMin(start) + dur, 23 * 60 + 59);
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  };
  return <>
    <PageHeader title="Журнал отмен" subtitle="Отменённые визиты можно перенести на новое время или удалить" />
    <div className="segmented mb-5">{(["master", "client"] as const).map(r => <Button key={r} variant="ghost" aria-pressed={filter === r} className={filter === r ? "active" : ""} onClick={() => setFilter(r)}>{cancelReasonLabels[r]} · {cancelled.filter(a => reasonOf(a) === r).length}</Button>)}</div>
    <section className="panel"><div className="space-y-3">
      {list.map(a => { const c = clients.find(x => x.id === a.client_id), s = services.find(x => x.id === a.service_id); return <article key={a.id} className="today-row">
        <div className="today-time"><span>{new Date(`${a.appointment_date}T12:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</span><span>{a.start_time.slice(0, 5)}–{a.end_time.slice(0, 5)}</span></div>
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3>{c?.full_name ?? "Клиент"}</h3><span className="status status-cancelled">{cancelReasonLabels[reasonOf(a)]}</span></div><p>{s?.name} · {money(Number(a.price))}</p>{a.comment && <p>{a.comment}</p>}</div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => openMove(a)}><CalendarClock />Перенести запись</Button><Button variant="outline" size="sm" onClick={() => { if (confirm("Удалить запись навсегда? Это действие нельзя отменить.")) void removeAppointment(a.id); }}><Trash2 />Удалить</Button></div>
      </article>; })}
      {!list.length && <div className="py-16 text-center"><p className="font-display text-xl">Здесь пока пусто</p><p className="mt-2 text-sm text-muted-foreground">Нет записей с причиной «{cancelReasonLabels[filter]}»</p></div>}
    </div></section>
    <FormModal open={!!moving} onOpenChange={v => { if (!v) setMoving(null); }} title="Перенести запись" description="Выберите новую дату и время — запись снова станет запланированной" submitLabel="Перенести" onSubmit={async e => {
      e.preventDefault(); if (!moving) return;
      if (!form.date || !form.start || !form.end || toMin(form.end) <= toMin(form.start)) { toast.error("Окончание должно быть позже начала"); return; }
      if (hasConflict(appointments, breaks, form.date, form.start, form.end, moving.id)) { toast.error("Это время уже занято"); return; }
      if (await rescheduleAppointment(moving.id, form.date, form.start, form.end)) setMoving(null);
    }}>
      <Field label="Дата"><Input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3"><Field label="Начало"><Input type="time" required value={form.start} onChange={e => setForm({ ...form, start: e.target.value, end: shiftEnd(e.target.value) })} /></Field><Field label="Окончание"><Input type="time" required value={form.end} onChange={e => setForm({ ...form, end: e.target.value })} /></Field></div>
    </FormModal>
  </>;
}
