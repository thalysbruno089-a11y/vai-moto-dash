import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { Motoboy } from "@/hooks/useMotoboys";

export interface PaymentBreakdown {
  pixAmount: number;
  cashAmount: number;
  otherAmount: number;
  notes: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  motoboy: Motoboy | null;
  onConfirm: (data: PaymentBreakdown) => void;
}

const parseNum = (v: string) => {
  const n = Number(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
};

export function MotoboyPaymentDialog({ open, onOpenChange, motoboy, onConfirm }: Props) {
  const expected = Number((motoboy as any)?.weekly_payment || 0);
  const [usePix, setUsePix] = useState(false);
  const [useCash, setUseCash] = useState(false);
  const [useOther, setUseOther] = useState(false);
  const [pix, setPix] = useState("");
  const [cash, setCash] = useState("");
  const [other, setOther] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setUsePix(false); setUseCash(false); setUseOther(false);
      setPix(""); setCash(""); setOther(""); setNotes("");
    }
  }, [open, expected]);

  const pixVal = usePix ? parseNum(pix) : 0;
  const cashVal = useCash ? parseNum(cash) : 0;
  const otherVal = useOther ? parseNum(other) : 0;
  const total = pixVal + cashVal + otherVal;

  const handleConfirm = () => {
    onConfirm({ pixAmount: pixVal, cashAmount: cashVal, otherAmount: otherVal, notes });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento - {motoboy?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Valor da diária: <span className="font-semibold text-foreground">
              {expected.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox id="m-pix" checked={usePix} onCheckedChange={(v) => setUsePix(!!v)} />
              <Label htmlFor="m-pix" className="w-20">PIX</Label>
              <Input type="number" step="0.01" placeholder="0,00" value={pix} onChange={(e) => setPix(e.target.value)} disabled={!usePix} />
            </div>
            <div className="flex items-center gap-3">
              <Checkbox id="m-cash" checked={useCash} onCheckedChange={(v) => setUseCash(!!v)} />
              <Label htmlFor="m-cash" className="w-20">Dinheiro</Label>
              <Input type="number" step="0.01" placeholder="0,00" value={cash} onChange={(e) => setCash(e.target.value)} disabled={!useCash} />
            </div>
            <div className="flex items-center gap-3">
              <Checkbox id="m-other" checked={useOther} onCheckedChange={(v) => setUseOther(!!v)} />
              <Label htmlFor="m-other" className="w-20">Outro</Label>
              <Input type="number" step="0.01" placeholder="0,00" value={other} onChange={(e) => setOther(e.target.value)} disabled={!useOther} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="m-notes">Observação</Label>
            <Textarea id="m-notes" placeholder="Ex: parcial, desconto, etc." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
            <span>Total informado</span>
            <span className="font-bold">
              {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={total <= 0 && !notes.trim()}>
            Confirmar e Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}