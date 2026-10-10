import { createFileRoute } from "@tanstack/react-router";
import { Clock3, Edit2, Plus, Sparkles, Tags, Trash2 } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/crm/shell";
import { money, type Category, type Service, useCRM } from "@/components/crm/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FormModal, Field } from "@/components/crm/modal";

export const Route = createFileRoute("/_authenticated/services")({
  head: () => ({ meta: [{ title: "Услуги — LashCRM" }, { name: "description", content: "Услуги, категории и цены салона" }, { property: "og:title", content: "Услуги — LashCRM" }, { property: "og:description", content: "Управление услугами и категориями салона" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Services,
});

const empty = { name: "", description: "", duration_minutes: 120, price: 2500, is_active: true, category_id: "" };

function Services() {
  const { services, categories, saveService, removeService, saveCategory, removeCategory } = useCRM();
  const [open, setOpen] = useState(false), [editing, setEditing] = useState<Service | null>(null), [form, setForm] = useState(empty);
  const [catOpen, setCatOpen] = useState(false), [catEditing, setCatEditing] = useState<Category | null>(null), [catName, setCatName] = useState("");
  const [filter, setFilter] = useState("all");

  const start = (s?: Service) => {
    setEditing(s ?? null);
    setForm(s ? { name: s.name, description: s.description ?? "", duration_minutes: s.duration_minutes, price: Number(s.price), is_active: s.is_active, category_id: s.category_id ?? "" } : { ...empty, category_id: categories[0]?.id ?? "" });
    setOpen(true);
  };
  const submit = async (e: React.FormEvent) => { e.preventDefault(); if (!form.category_id) return; if (await saveService(form, editing?.id)) setOpen(false); };
  const startCat = (c?: Category) => { setCatEditing(c ?? null); setCatName(c?.name ?? ""); setCatOpen(true); };
  const submitCat = async (e: React.FormEvent) => { e.preventDefault(); if (!catName.trim()) return; if (await saveCategory(catName.trim(), catEditing?.id)) { setCatEditing(null); setCatName(""); } };
  const delCat = (c: Category) => {
    const n = services.filter(s => s.category_id === c.id).length;
    if (confirm(n ? `Удалить категорию «${c.name}»? ${n} услуг(и) останутся без категории.` : `Удалить категорию «${c.name}»?`)) void removeCategory(c.id);
  };
  const catName_ = (id: string | null) => categories.find(c => c.id === id)?.name ?? "Без категории";
  const shown = services.filter(s => filter === "all" || (filter === "none" ? !s.category_id : s.category_id === filter));
  const hasUncategorized = services.some(s => !s.category_id);

  return <>
    <PageHeader title="Услуги" subtitle="Процедуры, категории, длительность и стоимость" action={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => startCat()}><Tags />Категории</Button><Button onClick={() => start()}><Plus />Добавить услугу</Button></div>} />
    <div className="mb-5 flex flex-wrap gap-2">
      <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>Все</Button>
      {categories.map(c => <Button key={c.id} size="sm" variant={filter === c.id ? "default" : "outline"} onClick={() => setFilter(c.id)}>{c.name}</Button>)}
      {hasUncategorized && <Button size="sm" variant={filter === "none" ? "default" : "outline"} onClick={() => setFilter("none")}>Без категории</Button>}
    </div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{shown.map(s => <article className="service-card" key={s.id}>
      <div className="flex items-start justify-between"><span className="service-icon"><Sparkles /></span><div className="flex flex-wrap justify-end gap-2"><span className="status status-scheduled">{catName_(s.category_id)}</span><span className={`status ${s.is_active ? "status-confirmed" : "status-cancelled"}`}>{s.is_active ? "Активна" : "Неактивна"}</span></div></div>
      <h2>{s.name}</h2><p>{s.description || "Описание не добавлено"}</p>
      <div className="mt-6 flex items-end justify-between border-t pt-5"><div><span className="flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="size-4" />{s.duration_minutes} мин</span><strong className="mt-2 block text-xl">{money(Number(s.price))}</strong></div>
        <div className="flex"><Button variant="ghost" size="icon" onClick={() => start(s)} aria-label="Редактировать"><Edit2 /></Button><Button variant="ghost" size="icon" onClick={() => confirm("Удалить эту услугу?") && void removeService(s.id)} aria-label="Удалить"><Trash2 /></Button></div></div>
    </article>)}</div>
    {shown.length === 0 && <p className="py-10 text-center text-muted-foreground">В этой категории пока нет услуг</p>}

    <FormModal open={open} onOpenChange={setOpen} title={editing ? "Редактировать услугу" : "Новая услуга"} description="Укажите категорию, название, длительность и стоимость" onSubmit={submit}>
      <Field label="Категория"><select required className="select-native w-full" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}><option value="">Выберите категорию</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
      <Field label="Название"><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Классическое наращивание" /></Field>
      <Field label="Описание"><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Кратко опишите процедуру" /></Field>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Длительность, мин"><Input type="number" min="1" required value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: Number(e.target.value) })} /></Field><Field label="Стоимость, ₽"><Input type="number" min="0" required value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} /></Field></div>
      <div className="flex items-center justify-between rounded-md border p-3"><span className="text-sm font-medium">Услуга активна</span><Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} /></div>
    </FormModal>

    <FormModal open={catOpen} onOpenChange={setCatOpen} title="Категории услуг" description="Добавляйте, переименовывайте и удаляйте категории" onSubmit={submitCat} submitLabel={catEditing ? "Переименовать" : "Добавить категорию"}>
      <ul className="divide-y rounded-md border">{categories.map(c => <li key={c.id} className="flex items-center justify-between gap-2 p-3"><span className="font-medium">{c.name} <span className="text-sm text-muted-foreground">· {services.filter(s => s.category_id === c.id).length}</span></span><div className="flex"><Button type="button" variant="ghost" size="icon" onClick={() => startCat(c)} aria-label="Переименовать"><Edit2 /></Button><Button type="button" variant="ghost" size="icon" onClick={() => delCat(c)} aria-label="Удалить"><Trash2 /></Button></div></li>)}
        {categories.length === 0 && <li className="p-3 text-sm text-muted-foreground">Категорий пока нет</li>}</ul>
      <Field label={catEditing ? `Новое название для «${catEditing.name}»` : "Новая категория"}><Input value={catName} onChange={e => setCatName(e.target.value)} placeholder="Например, Брови" /></Field>
      {catEditing && <Button type="button" variant="ghost" size="sm" onClick={() => { setCatEditing(null); setCatName(""); }}>Отменить переименование</Button>}
    </FormModal>
  </>;
}
