import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarDays, Sparkles, Users, WalletCards } from "lucide-react";
import { PageHeader } from "@/components/crm/shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Аналитика — LashCRM" },
      { name: "description", content: "Клиенты, услуги, график и финансы салона" },
      { property: "og:title", content: "Аналитика — LashCRM" },
      { property: "og:description", content: "Клиенты, услуги, график и финансы салона" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Analytics,
});

const sections = [
  { title: "Клиенты", to: "/clients", icon: Users },
  { title: "Услуги", to: "/services", icon: Sparkles },
  { title: "График", to: "/appointments", icon: CalendarDays },
  { title: "Финансы", to: "/finance", icon: WalletCards },
] as const;

function Analytics() {
  return (
    <>
      <PageHeader title="Аналитика" subtitle="Клиенты, услуги, график и финансы" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {sections.map(({ title, to, icon: Icon }) => (
          <Button
            key={to}
            asChild
            variant="outline"
            className="h-44 min-w-0 flex-col items-start justify-between whitespace-normal border-border bg-card p-6 text-card-foreground hover:border-primary/50"
          >
            <Link to={to}>
              <span className="flex w-full items-start justify-between">
                <span className="flex size-11 items-center justify-center rounded-md bg-secondary text-primary">
                  <Icon className="size-5" />
                </span>
                <ArrowUpRight className="text-muted-foreground" />
              </span>
              <span className="font-display text-xl font-semibold">{title}</span>
            </Link>
          </Button>
        ))}
      </div>
    </>
  );
}