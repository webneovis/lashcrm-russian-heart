import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Gem, Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Регистрация владельца — LashCRM" },
      { name: "description", content: "Создание аккаунта владельца салона в LashCRM" },
      { property: "og:title", content: "Регистрация владельца — LashCRM" },
      { property: "og:description", content: "Создайте первый аккаунт администратора салона" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Register,
});

function Register() {
  const [exists, setExists] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.rpc("owner_exists").then(({ data }) => setExists(Boolean(data)));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Пароль должен содержать не менее 8 символов");
    if (password !== confirm) return setError("Пароли не совпадают");
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth`, data: { full_name: name } },
    });
    setLoading(false);
    if (error) {
      setError(error.message.includes("registered") ? "Этот адрес уже зарегистрирован" : "Не удалось зарегистрироваться. Попробуйте ещё раз");
      return;
    }
    if (data.session) {
      await supabase.rpc("claim_owner", { _full_name: name });
      window.location.assign("/");
      return;
    }
    setSent(true);
  };

  return (
    <main className="auth-scene flex min-h-screen items-center justify-center p-5">
      <div className="w-full max-w-md rounded-lg bg-card p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground"><Gem /></span>
          <span className="font-display text-xl font-semibold">LashCRM</span>
        </div>
        {exists === null ? (
          <Loader2 className="mx-auto animate-spin text-primary" />
        ) : sent ? (
          <div className="text-center">
            <MailCheck className="mx-auto size-10 text-primary" />
            <h1 className="mt-4 font-display text-3xl font-semibold">Проверьте почту</h1>
            <p className="mt-3 text-sm text-muted-foreground">Мы отправили письмо на {email}. Перейдите по ссылке, затем войдите в систему.</p>
            <Button asChild className="mt-6 w-full"><Link to="/auth">Перейти ко входу</Link></Button>
          </div>
        ) : exists ? (
          <div className="text-center">
            <h1 className="font-display text-3xl font-semibold">Регистрация закрыта</h1>
            <p className="mt-3 text-sm text-muted-foreground">Владелец салона уже зарегистрирован.</p>
            <Button asChild className="mt-6 w-full"><Link to="/auth">Перейти ко входу</Link></Button>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-primary">Первый запуск</p>
            <h1 className="mt-2 font-display text-4xl font-semibold">Регистрация владельца</h1>
            <p className="mt-3 text-sm text-muted-foreground">Этот аккаунт получит полный доступ к CRM</p>
            <form onSubmit={submit} className="mt-8 space-y-4">
              <div className="space-y-2"><Label htmlFor="name">Имя</Label><Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Анна Иванова" /></div>
              <div className="space-y-2"><Label htmlFor="email">Электронная почта</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.ru" /></div>
              <div className="space-y-2"><Label htmlFor="password">Пароль</Label><Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Не менее 8 символов" /></div>
              <div className="space-y-2"><Label htmlFor="confirm">Повторите пароль</Label><Input id="confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Повторите пароль" /></div>
              {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
              <Button className="h-11 w-full" disabled={loading}>{loading ? <><Loader2 className="animate-spin" />Создаём…</> : "Зарегистрироваться"}</Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">Уже есть аккаунт? <Link to="/auth" className="font-medium text-primary">Войти</Link></p>
          </>
        )}
      </div>
    </main>
  );
}
