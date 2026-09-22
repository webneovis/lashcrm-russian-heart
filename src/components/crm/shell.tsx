import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, CalendarDays, ChevronLeft, ChevronRight, CircleUserRound, Gem, LayoutDashboard, LogOut, Menu, Settings, Sparkles, Users, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CRMProvider } from "./data";

const nav=[
 {to:"/",label:"Главная",icon:LayoutDashboard},{to:"/clients",label:"Клиенты",icon:Users},{to:"/services",label:"Услуги",icon:Sparkles},{to:"/appointments",label:"Записи",icon:CalendarDays},{to:"/today",label:"Сегодня",icon:CircleUserRound},{to:"/finance",label:"Финансы",icon:BarChart3},{to:"/settings",label:"Настройки",icon:Settings},
] as const;
export function AppShell({children}:{children:React.ReactNode}){
 const [open,setOpen]=useState(false),[collapsed,setCollapsed]=useState(false);const path=useRouterState({select:s=>s.location.pathname});
 return <CRMProvider><div className="min-h-screen bg-background text-foreground">
  {open&&<div className="fixed inset-0 z-40 bg-overlay/50 lg:hidden" onClick={()=>setOpen(false)} />}
  <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ${open?"translate-x-0":"-translate-x-full"} ${collapsed?"lg:w-20":"lg:w-64"} w-64 lg:translate-x-0`}>
   <div className="flex h-20 items-center justify-between border-b border-sidebar-border px-5"><Link to="/" className="flex items-center gap-3 overflow-hidden"><span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"><Gem className="size-5"/></span>{!collapsed&&<span className="font-display text-xl font-semibold">LashCRM</span>}</Link><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Закрыть меню" onClick={()=>setOpen(false)}><X/></Button></div>
   <nav className="flex-1 space-y-1 p-3">{nav.map(item=>{const Icon=item.icon;const active=path===item.to;return <Link key={item.to} to={item.to} onClick={()=>setOpen(false)} className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${active?"bg-sidebar-primary text-sidebar-primary-foreground shadow-sm":"text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`} title={collapsed?item.label:undefined}><Icon className="size-5 shrink-0"/>{!collapsed&&item.label}</Link>})}</nav>
   <div className="border-t border-sidebar-border p-3"><Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={()=>void supabase.auth.signOut()}><LogOut/>{!collapsed&&"Выйти"}</Button></div>
   <Button variant="outline" size="icon" className="absolute -right-4 top-24 hidden rounded-full bg-background lg:inline-flex" onClick={()=>setCollapsed(v=>!v)} aria-label={collapsed?"Развернуть меню":"Свернуть меню"}>{collapsed?<ChevronRight/>:<ChevronLeft/>}</Button>
  </aside>
  <div className={`transition-all duration-300 ${collapsed?"lg:pl-20":"lg:pl-64"}`}><header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur md:px-8"><Button variant="ghost" size="icon" className="lg:hidden" onClick={()=>setOpen(true)} aria-label="Открыть меню"><Menu/></Button><div className="hidden text-sm text-muted-foreground sm:block">Рабочее пространство мастера</div><div className="flex items-center gap-3"><div className="text-right"><p className="text-sm font-medium">Мой салон</p><p className="text-xs text-muted-foreground">Владелец</p></div><span className="flex size-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground"><CircleUserRound className="size-5"/></span></div></header><main className="mx-auto max-w-[1500px] p-4 md:p-8">{children}</main></div>
 </div></CRMProvider>
}
export function PageHeader({title,subtitle,action}:{title:string;subtitle:string;action?:React.ReactNode}){return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">LashCRM</p><h1 className="font-display text-3xl font-semibold md:text-4xl">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{subtitle}</p></div>{action}</div>}
