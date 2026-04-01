import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Bill, useCreateBill, useUpdateBill } from "@/hooks/useBills";

interface ContaEntryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: Bill | null;
  categoryId?: string | null;
}

export function ContaEntryFormDialog({ open, onOpenChange, entry, categoryId }: ContaEntryFormDialogProps) {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [isFixed, setIsFixed] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentCount, setInstallmentCount] = useState("2");
  const [installmentInterval, setInstallmentInterval] = useState<"monthly" | "weekly">("monthly");
  const [splitValue, setSplitValue] = useState(false);

  const createBill = useCreateBill();
  const updateBill = useUpdateBill();
  const isLoading = createBill.isPending || updateBill.isPending;
  const isEditing = !!entry;

  useEffect(() => {
    if (entry) {
      setName(entry.name);
      setValue(String(entry.value));
      setDescription(entry.description || "");
      setIsFixed(entry.is_fixed);
      setDueDate(entry.due_date);
      setIsInstallment(false);
      setInstallmentCount("2");
      setInstallmentInterval("monthly");
      setSplitValue(false);
    } else {
      setName("");
      setValue("");
      setDescription("");
      setIsFixed(false);
      setIsInstallment(false);
      setInstallmentCount("2");
      setInstallmentInterval("monthly");
      setSplitValue(false);
      const today = new Date();
      setDueDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`);
    }
  }, [entry, open]);

  const parsedValue = parseFloat(value) || 0;
  const count = parseInt(installmentCount) || 2;
  const perInstallment = splitValue ? parsedValue / count : parsedValue;
  const totalAmount = splitValue ? parsedValue : parsedValue * count;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && entry) {
        await updateBill.mutateAsync({
          id: entry.id,
          name,
          value: parseFloat(value),
          description: description || null,
          is_fixed: isFixed,
          due_date: dueDate,
        });
      } else if (isInstallment && !isFixed) {
        const baseDate = new Date(`${dueDate}T12:00:00`);

        for (let i = 0; i < count; i++) {
          const installDate = new Date(baseDate);
          if (installmentInterval === "monthly") {
            installDate.setMonth(installDate.getMonth() + i);
          } else {
            installDate.setDate(installDate.getDate() + i * 7);
          }
          const dateStr = `${installDate.getFullYear()}-${String(installDate.getMonth() + 1).padStart(2, "0")}-${String(installDate.getDate()).padStart(2, "0")}`;

          await createBill.mutateAsync({
            name: `${name} (${i + 1}/${count})`,
            value: perInstallment,
            description: description || null,
            is_fixed: false,
            due_date: dateStr,
            status: "pending",
            category_id: categoryId || null,
            parent_bill_id: null,
            installment_number: i + 1,
            total_installments: count,
          });
        }
      } else {
        await createBill.mutateAsync({
          name,
          value: parseFloat(value),
          description: description || null,
          is_fixed: isFixed,
          due_date: dueDate,
          status: "pending",
          category_id: categoryId || null,
          parent_bill_id: null,
          installment_number: null,
        });
      }
      onOpenChange(false);
    } catch {
      // handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Item" : "Novo Item"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Edite os dados do item." : "Adicione um novo item à categoria."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="entry-name">Nome *</Label>
            <Input id="entry-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Energia, João..." required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="entry-value">Valor (R$) *</Label>
            <Input id="entry-value" type="number" step="0.01" min="0.01" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0,00" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="entry-date">Data de Vencimento</Label>
            <Input id="entry-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="entry-desc">Descrição</Label>
            <Input id="entry-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" />
          </div>

          <div className="flex items-center gap-3">
            <Switch id="entry-fixed" checked={isFixed} onCheckedChange={(checked) => { setIsFixed(checked); if (checked) setIsInstallment(false); }} />
            <Label htmlFor="entry-fixed">Conta Fixa (recorrente todo mês)</Label>
          </div>

          {!isEditing && !isFixed && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Switch id="entry-installment" checked={isInstallment} onCheckedChange={setIsInstallment} />
                <Label htmlFor="entry-installment">Parcelar</Label>
              </div>
              {isInstallment && (
                <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
                  <div className="space-y-2">
                    <Label htmlFor="entry-installment-count">Número de parcelas</Label>
                    <Input
                      id="entry-installment-count"
                      type="number"
                      min="2"
                      max="60"
                      value={installmentCount}
                      onChange={(e) => setInstallmentCount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Intervalo</Label>
                    <Select value={installmentInterval} onValueChange={(v) => setInstallmentInterval(v as "monthly" | "weekly")}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch id="entry-split" checked={splitValue} onCheckedChange={setSplitValue} />
                    <Label htmlFor="entry-split" className="text-xs">Dividir valor total entre parcelas</Label>
                  </div>
                  {parsedValue > 0 && count >= 2 && (
                    <div className="rounded-md bg-primary/5 border border-primary/10 p-2.5 text-xs space-y-1">
                      <p className="font-medium text-foreground">
                        {count}x de R$ {perInstallment.toFixed(2)}
                        {installmentInterval === "weekly" ? " (semanal)" : " (mensal)"}
                      </p>
                      <p className="text-muted-foreground">
                        Total: R$ {totalAmount.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading || !name || !value}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
