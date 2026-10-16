import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { type Appointment, type Client } from "./data";

const pad = (n: number) => String(n).padStart(2, "0");
export const localKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const hoursWord = (h: number) => {
  const m10 = h % 10, m100 = h % 100;
  if (m10 === 1 && m100 !== 11) return "час";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "часа";
  return "часов";
};

export function formatRemaining(totalMin: number) {
  const h = Math.floor(totalMin / 60), m = totalMin % 60;
  const text = h ? `${h} ${hoursWord(h)}${m ? ` ${m} мин` : ""}` : `${m} мин`;
  return { verb: totalMin === 1 ? "осталась" : "осталось", text };
}

export function findNext(appointments: Appointment[], now: Date) {
  const key = localKey(now);
  return appointments
    .filter(a => a.appointment_date === key && a.status === "scheduled")
    .map(a => { const [h = 0, m = 0] = a.start_time.split(":").map(Number); const start = new Date(now); start.setHours(h, m, 0, 0); return { a, start }; })
    .filter(x => x.start.getTime() > now.getTime())
    .sort((x, y) => x.start.getTime() - y.start.getTime() || x.a.created_at.localeCompare(y.a.created_at))[0] ?? null;
}

export function NextClient({ appointments, clients }: { appointments: Appointment[]; clients: Client[] }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); const t = setInterval(() => setNow(new Date()), 10000); return () => clearInterval(t); }, []);
  if (!now) return null;
  const next = findNext(appointments, now);
  if (!next) return null;
  const mins = Math.max(1, Math.ceil((next.start.getTime() - now.getTime()) / 60000));
  const { verb, text } = formatRemaining(mins);
  const name = clients.find(c => c.id === next.a.client_id)?.full_name ?? "";
  return <section className="panel mb-4 flex items-center gap-3" aria-live="polite">
    <Clock className="size-5 shrink-0 text-primary" />
    <p className="font-display text-lg">До клиента {name} {verb} <strong>{text}</strong></p>
  </section>;
}
