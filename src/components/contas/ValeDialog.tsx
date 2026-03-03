import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Bill, useUpdateBill } from "@/hooks/useBills";
import { toast } from "sonner";

interface ValeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: Bill | null;
}

export function ValeDialog({ open, onOpenChange, entry }: ValeDialogProps) {
  const [valeAmount, setValeAmount] = useState("");
  const updateBill = useUpdateBill();

  useEffect(() => {
    if (entry) {
      setValeAmount(String(entry.vale_amount || 0));
    }
  }, [entry, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry) return;

    const amount = parseFloat(valeAmount) || 0;
    if (amount > entry.value) {
      toast.error("O vale não pode ser maior que o salário!");
      return;
    }

    try {
      await updateBill.mutateAsync({
        id: entry.id,
        vale_amount: amount,
      } as any);
      toast.success(`Vale de ${entry.name} atualizado!`);
      onOpenChange(false);
    } catch {
      // handled by mutation
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Registrar Vale</DialogTitle>
          <DialogDescription>
            {entry && `Registre o vale de ${entry.name}. Salário: ${formatCurrency(entry.value)}`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vale-amount">Valor do Vale (R$)</Label>
            <Input
              id="vale-amount"
              type="number"
              step="0.01"
              min="0"
              value={valeAmount}
              onChange={(e) => setValeAmount(e.target.value)}
              placeholder="0,00"
            />
            <p className="text-xs text-muted-foreground">
              Coloque 0 para remover o vale.
            </p>
          </div>
          {entry && parseFloat(valeAmount) > 0 && (
            <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              <p className="font-medium">Valor líquido a pagar:</p>
              <p className="text-lg font-bold">
                {formatCurrency(entry.value - (parseFloat(valeAmount) || 0))}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={updateBill.isPending}>
              {updateBill.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Vale
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
