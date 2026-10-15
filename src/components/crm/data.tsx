import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Client = { id:string; full_name:string; phone:string; instagram:string|null; birth_date:string|null; notes:string|null; created_at:string };
export type Category = { id:string; name:string; created_at:string };
export type Service = { id:string; name:string; description:string|null; duration_minutes:number; price:number; is_active:boolean; category_id:string|null; created_at:string };
export type Appointment = { id:string; client_id:string; service_id:string; appointment_date:string; start_time:string; end_time:string; price:number; comment:string|null; status:"scheduled"|"completed"|"cancelled"; cancel_reason?:"master"|"client"|null; created_at:string };
export type Break = { id:string; break_date:string; start_time:string; end_time:string; title:string; created_at:string };

type CRMContextValue = {
  clients: Client[]; services: Service[]; categories: Category[]; appointments: Appointment[]; breaks: Break[]; loading:boolean;
  saveBreak:(value:{break_date:string;start_time:string;end_time:string;title:string},id?:string)=>Promise<boolean>; removeBreak:(id:string)=>Promise<boolean>;
  refresh:()=>Promise<void>; saveClient:(value:Partial<Client>&{full_name:string;phone:string}, id?:string)=>Promise<boolean>;
  removeClient:(id:string)=>Promise<boolean>; saveService:(value:Partial<Service>&{name:string;duration_minutes:number;price:number},id?:string)=>Promise<boolean>;
  removeService:(id:string)=>Promise<boolean>; saveAppointment:(value:Partial<Appointment>&{client_id:string;service_id:string;appointment_date:string;start_time:string;end_time:string;price:number},id?:string)=>Promise<boolean>;
  removeAppointment:(id:string)=>Promise<boolean>; setStatus:(id:string,status:Appointment["status"])=>Promise<void>;
  cancelAppointment:(id:string,reason:"master"|"client")=>Promise<boolean>; rescheduleAppointment:(id:string,date:string,start:string,end:string)=>Promise<boolean>;
  saveCategory:(name:string,id?:string)=>Promise<boolean>; removeCategory:(id:string)=>Promise<boolean>;
};
const CRMContext=createContext<CRMContextValue|null>(null);
const defaults=[
 {name:"Классическое наращивание",description:"Естественный объём и выразительный взгляд",duration_minutes:120,price:2500},
 {name:"Объём 2D",description:"Мягкий двойной объём",duration_minutes:150,price:3000},
 {name:"Объём 3D",description:"Пышный тройной объём",duration_minutes:180,price:3500},
 {name:"Коррекция ресниц",description:"Обновление формы и объёма",duration_minutes:90,price:2000},
 {name:"Снятие ресниц",description:"Бережное снятие материала",duration_minutes:30,price:700},
];
export function CRMProvider({children}:{children:ReactNode}){
 const [clients,setClients]=useState<Client[]>([]),[services,setServices]=useState<Service[]>([]),[categories,setCategories]=useState<Category[]>([]),[appointments,setAppointments]=useState<Appointment[]>([]),[breaks,setBreaks]=useState<Break[]>([]),[loading,setLoading]=useState(true);
 const refresh=async()=>{setLoading(true);const [c,s,a,k,b]=await Promise.all([supabase.from("clients").select("*").order("created_at",{ascending:false}),supabase.from("services").select("*").order("created_at"),supabase.from("appointments").select("*").order("appointment_date").order("start_time"),supabase.from("service_categories").select("*").order("created_at"),supabase.from("breaks").select("*").order("break_date").order("start_time")]);if(c.error||s.error||a.error||k.error||b.error)toast.error("Не удалось загрузить данные");setClients((c.data??[]) as Client[]);setServices((s.data??[]) as Service[]);setAppointments((a.data??[]) as Appointment[]);setCategories((k.data??[]) as Category[]);setBreaks((b.data??[]) as Break[]);setLoading(false)};
 useEffect(()=>{void (async()=>{await refresh();let changed=false;const {count:catCount}=await supabase.from("service_categories").select("id",{count:"exact",head:true});let lashId:string|undefined;if(catCount===0){const {data}=await supabase.from("service_categories").insert([{name:"Ресницы"}]).select();lashId=data?.[0]?.id;await supabase.from("service_categories").insert([{name:"Брови"}]);changed=true}const {count}=await supabase.from("services").select("id",{count:"exact",head:true});if(count===0){if(!lashId){const {data}=await supabase.from("service_categories").select("id").eq("name","Ресницы").limit(1);lashId=data?.[0]?.id}const {error}=await supabase.from("services").insert(defaults.map(d=>({...d,category_id:lashId??null})));if(!error)changed=true}if(changed)await refresh()})()},[]);
 const finish=async(error:{message:string}|null,id?:string)=>{if(error){toast.error("Не удалось сохранить изменения");return false}toast.success(id?"Изменения сохранены":"Запись добавлена");await refresh();return true};
 const mutateClient=async(value:Partial<Client>&{full_name:string;phone:string},id?:string)=>{const {error}=id?await supabase.from("clients").update(value).eq("id",id):await supabase.from("clients").insert(value);return finish(error,id)};
 const mutateService=async(value:Partial<Service>&{name:string;duration_minutes:number;price:number},id?:string)=>{const {error}=id?await supabase.from("services").update(value).eq("id",id):await supabase.from("services").insert(value);return finish(error,id)};
 const mutateAppointment=async(value:Partial<Appointment>&{client_id:string;service_id:string;appointment_date:string;start_time:string;end_time:string;price:number},id?:string)=>{const {error}=id?await supabase.from("appointments").update(value).eq("id",id):await supabase.from("appointments").insert(value);return finish(error,id)};
 const value=useMemo<CRMContextValue>(()=>({clients,services,categories,appointments,breaks,loading,refresh,
   saveBreak:async(value,id)=>{const {error}=id?await supabase.from("breaks").update(value).eq("id",id):await supabase.from("breaks").insert(value);if(error){toast.error("Не удалось сохранить перерыв");return false}toast.success(id?"Перерыв обновлён":"Перерыв добавлен");await refresh();return true},
   removeBreak:async id=>{const {error}=await supabase.from("breaks").delete().eq("id",id);if(error){toast.error("Не удалось удалить перерыв");return false}toast.success("Перерыв удалён");await refresh();return true},
  saveClient:mutateClient,removeClient:async id=>{const {error}=await supabase.from("clients").delete().eq("id",id);if(error){toast.error("Не удалось удалить клиента");return false}toast.success("Клиент удалён");await refresh();return true},
  saveService:mutateService,removeService:async id=>{const {error}=await supabase.from("services").delete().eq("id",id);if(error){toast.error("Нельзя удалить услугу с записями");return false}toast.success("Услуга удалена");await refresh();return true},
  saveAppointment:mutateAppointment,removeAppointment:async id=>{const {error}=await supabase.from("appointments").delete().eq("id",id);if(error){toast.error("Не удалось удалить запись");return false}toast.success("Запись удалена");await refresh();return true},
  setStatus:async(id,status)=>{const {error}=await supabase.from("appointments").update({status}).eq("id",id);await finish(error,id)},
  saveCategory:async(name,id)=>{const {error}=id?await supabase.from("service_categories").update({name}).eq("id",id):await supabase.from("service_categories").insert({name});if(error){toast.error("Не удалось сохранить категорию");return false}toast.success(id?"Категория переименована":"Категория добавлена");await refresh();return true},
  removeCategory:async id=>{const {error}=await supabase.from("service_categories").delete().eq("id",id);if(error){toast.error("Не удалось удалить категорию");return false}toast.success("Категория удалена");await refresh();return true}
 }),[clients,services,categories,appointments,breaks,loading]);
 return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>
}
export function useCRM(){const value=useContext(CRMContext);if(!value)throw new Error("Данные CRM недоступны");return value}
export const statusLabels={scheduled:"Запланировано",completed:"Выполнено",cancelled:"Отменено"} as const;
export const money=(v:number)=>new Intl.NumberFormat("ru-RU",{style:"currency",currency:"RUB",maximumFractionDigits:0}).format(v);
export const shortDate=(v:string)=>new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"short"}).format(new Date(`${v}T12:00:00`));
export const cancelReasonLabels={master:"Отменено мастером",client:"Отменено клиентом"} as const;
export const toMin=(t:string)=>{const [h,m]=t.split(":").map(Number);return h*60+m};
export function hasConflict(appointments:Appointment[],breaks:Break[],date:string,start:string,end:string,ignoreId?:string){const s=toMin(start),e=toMin(end);return appointments.some(a=>a.id!==ignoreId&&a.status!=="cancelled"&&a.appointment_date===date&&toMin(a.start_time)<e&&toMin(a.end_time)>s)||breaks.some(b=>b.break_date===date&&toMin(b.start_time)<e&&toMin(b.end_time)>s)}
