import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cancelReasonLabels, useCRM } from "./data";

export function CancelDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { cancelAppointment } = useCRM();
  const [reason, setReason] = useState<"master" | "client" | null>(null);
  useEffect(() => { if (id) setReason(null); }, [id]);
  return <Dialog open={!!id} onOpenChange={v => { if (!v) onClose(); }}>
    <DialogContent>
      <DialogHeader><DialogTitle className="font-display text-2xl">Отменить запись?</DialogTitle><DialogDescription>Выберите, по чьей инициативе отменяется визит. Запись попадёт в журнал отмен.</DialogDescription></DialogHeader>
      <div className="grid gap-2" role="radiogroup">
        {(["master", "client"] as const).map(r => <Button key={r} type="button" role="radio" aria-checked={reason === r} variant={reason === r ? "default" : "outline"} className="justify-start" onClick={() => setReason(r)}>{cancelReasonLabels[r]}</Button>)}
      </div>
      <DialogFooter className="pt-3">
        <Button variant="outline" onClick={onClose}>Не отменять</Button>
        <Button disabled={!reason} onClick={async () => { if (id && reason && await cancelAppointment(id, reason)) onClose(); }}>Подтвердить отмену</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
