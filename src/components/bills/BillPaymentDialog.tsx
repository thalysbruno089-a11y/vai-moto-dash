import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface BillPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billName: string;
  /** Valor líquido total (já descontado o vale) */
  totalValue: number;
  /** Quanto já foi pago parcialmente neste mês */
  alreadyPaid: number;
  isLoading?: boolean;
  onPayFull: () => void;
  onPayPartial: (amount: number) => void;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export function BillPaymentDialog({
  open,
  onOpenChange,
  billName,
  totalValue,
  alreadyPaid,
  isLoading,
  onPayFull,
  onPayPartial,
}: BillPaymentDialogProps) {
  const [mode, setMode] = useState<"full" | "partial">("full");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (open) {
      setMode("full");
      setAmount("");
    }
  }, [open]);

  const remainingBefore = Math.max(0, totalValue - alreadyPaid);
  const parsed = Number(amount.replace(",", ".")) || 0;
  const remainingAfter = Math.max(0, remainingBefore - parsed);
  const partialInvalid = mode === "partial" && (parsed <= 0 || parsed > remainingBefore);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Marcar pago — {billName}</DialogTitle>
          <DialogDescription>
            Escolha se vai pagar tudo ou apenas uma parte do valor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor da conta</span>
              <span className="font-semibold">{formatCurrency(totalValue)}</span>
            </div>
            {alreadyPaid > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Já pago</span>
                <span className="font-semibold text-emerald-600">{formatCurrency(alreadyPaid)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Falta pagar</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{formatCurrency(remainingBefore)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("full")}
              className={cn(
                "rounded-lg border p-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors",
                mode === "full" ? "border-emerald-500 bg-emerald-500/10 text-emerald-600" : "border-border"
              )}
            >
              <CheckCircle2 className="h-4 w-4" /> Pagar tudo
            </button>
            <button
              type="button"
              onClick={() => setMode("partial")}
              className={cn(
                "rounded-lg border p-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors",
                mode === "partial" ? "border-amber-500 bg-amber-500/10 text-amber-600" : "border-border"
              )}
            >
              <Wallet className="h-4 w-4" /> Pagar uma parte
            </button>
          </div>

          {mode === "partial" && (
            <div className="space-y-2">
              <Label htmlFor="partial-amount">Valor pago</Label>
              <Input
                id="partial-amount"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
              <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                Falta a pagar: {formatCurrency(remainingAfter)}
              </p>
              {parsed > remainingBefore && (
                <p className="text-xs text-destructive">O valor não pode ser maior que o restante.</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            disabled={isLoading || partialInvalid}
            onClick={() => (mode === "full" ? onPayFull() : onPayPartial(parsed))}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
