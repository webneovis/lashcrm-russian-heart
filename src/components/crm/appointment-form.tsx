import { useEffect, useState } from "react";
import { FormModal, Field } from "./modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { type Appointment, type Break, useCRM } from "./data";

const today = new Date().toISOString().slice(0, 10);
type FormState = { client_id: string; service_id: string; appointment_date: string; start_time: string; end_time: string; price: number; comment: string; status: Appointment["status"] };
type BreakState = { break_date: string; start_time: string; end_time: string; title: string };

export function AppointmentForm({ open, onOpenChange, editing, editingBreak, presetDate }: { open: boolean; onOpenChange: (v: boolean) => void; editing?: Appointment | null; editingBreak?: Break | null; presetDate?: string }) {
  const { clients, services, saveAppointment, saveBreak } = useCRM();
  const [kind, setKind] = useState<"appointment" | "break">("appointment");
  const [form, setForm] = useState<FormState>({ client_id: "", service_id: "", appointment_date: today, start_time: "10:00", end_time: "", price: 0, comment: "", status: "scheduled" });
  const [brk, setBrk] = useState<BreakState>({ break_date: today, start_time: "13:00", end_time: "14:00", title: "" });
  const durationOf = (id: string) => Number(services.find(x => x.id === id)?.duration_minutes ?? 0);
  const endTime = (start: string, minutes: number) => { const [h, m] = start.split(":").map(Number); const total = Math.min((h || 0) * 60 + (m || 0) + minutes, 1439); return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`; };
  const withEnd = (next: Omit<FormState, "end_time">): FormState => { const d = durationOf(next.service_id); return { ...next, end_time: d > 0 ? endTime(next.start_time, d) : "" }; };
  useEffect(() => {
    if (!open) return;
    setKind(editingBreak ? "break" : "appointment");
    if (editing) setForm({ ...editing, price: Number(editing.price), comment: editing.comment ?? "" });
    else setForm(withEnd({ client_id: clients[0]?.id ?? "", service_id: services[0]?.id ?? "", appointment_date: presetDate ?? today, start_time: "10:00", price: Number(services[0]?.price ?? 0), comment: "", status: "scheduled" }));
    if (editingBreak) setBrk({ break_date: editingBreak.break_date, start_time: editingBreak.start_time.slice(0, 5), end_time: editingBreak.end_time.slice(0, 5), title: editingBreak.title });
    else setBrk({ break_date: presetDate ?? today, start_time: "13:00", end_time: "14:00", title: "" });
  }, [editing, editingBreak, open]);
  const serviceChanged = (id: string) => { const s = services.find(x => x.id === id); setForm(withEnd({ ...form, service_id: id, price: Number(s?.price ?? 0) })); };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (kind === "break") {
      if (!brk.title.trim() || brk.end_time <= brk.start_time) return;
      if (await saveBreak({ ...brk, title: brk.title.trim() }, editingBreak?.id)) onOpenChange(false);
      return;
    }
    if (!form.client_id || !form.service_id) return;
    if (await saveAppointment(form, editing?.id)) onOpenChange(false);
  };
  const isEdit = !!(editing || editingBreak);
  const title = kind === "break" ? (editingBreak ? "Редактировать перерыв" : "Новый перерыв") : editing ? "Редактировать запись" : "Новая запись";
  return <FormModal open={open} onOpenChange={onOpenChange} title={title} description={kind === "break" ? "Время, недоступное для записи клиентов" : "Заполните данные визита"} onSubmit={submit} submitLabel={kind === "break" ? "Сохранить перерыв" : "Сохранить"}>
    {!isEdit && <div className="segmented form-kind" role="tablist">
      <Button type="button" variant="ghost" role="tab" aria-selected={kind === "appointment"} className={kind === "appointment" ? "active" : ""} onClick={() => setKind("appointment")}>Запись клиента</Button>
      <Button type="button" variant="ghost" role="tab" aria-selected={kind === "break"} className={kind === "break" ? "active" : ""} onClick={() => setKind("break")}>Перерыв</Button>
    </div>}
    {kind === "break" ? <>
      <Field label="Название перерыва"><Input required value={brk.title} onChange={e => setBrk({ ...brk, title: e.target.value })} placeholder="Например, обед" /></Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Дата"><Input type="date" required value={brk.break_date} onChange={e => setBrk({ ...brk, break_date: e.target.value })} /></Field>
        <Field label="Начало"><Input type="time" required value={brk.start_time} onChange={e => setBrk({ ...brk, start_time: e.target.value })} /></Field>
        <Field label="Окончание"><Input type="time" required min={brk.start_time} value={brk.end_time} onChange={e => setBrk({ ...brk, end_time: e.target.value })} /></Field>
      </div>
      {brk.end_time && brk.end_time <= brk.start_time && <p className="text-sm text-destructive">Окончание должно быть позже начала</p>}
    </> : <>
      <Field label="Клиент"><select required className="select-native w-full" value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}><option value="">Выберите клиента</option>{clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}</select></Field>
      <Field label="Услуга"><select required className="select-native w-full" value={form.service_id} onChange={e => serviceChanged(e.target.value)}><option value="">Выберите услугу</option>{services.filter(s => s.is_active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
      <div className="grid gap-4 sm:grid-cols-3"><Field label="Дата"><Input type="date" required value={form.appointment_date} onChange={e => setForm({ ...form, appointment_date: e.target.value })} /></Field><Field label="Начало"><Input type="time" required value={form.start_time} onChange={e => setForm(withEnd({ ...form, start_time: e.target.value }))} /></Field><Field label="Окончание"><Input type="time" required value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} /></Field></div>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Стоимость, ₽"><Input type="number" min="0" required value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} /></Field><Field label="Статус"><select className="select-native w-full" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Appointment["status"] })}><option value="scheduled">Запланировано</option><option value="completed">Выполнено</option><option value="cancelled">Отменено</option></select></Field></div>
      <Field label="Комментарий"><Textarea value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} placeholder="Дополнительная информация" /></Field>
    </>}
  </FormModal>;
}
