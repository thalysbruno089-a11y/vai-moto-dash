import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
    } else {
      setName("");
      setValue("");
      setDescription("");
      setIsFixed(false);
      const today = new Date();
      setDueDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`);
    }
  }, [entry, open]);

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
            <Switch id="entry-fixed" checked={isFixed} onCheckedChange={setIsFixed} />
            <Label htmlFor="entry-fixed">Conta Fixa (repete todo mês)</Label>
          </div>
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
