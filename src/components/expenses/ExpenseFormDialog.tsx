import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useCreateMotorcycleExpense, ExpenseCategory, categoryLabels } from "@/hooks/useMotorcycleExpenses";

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: ExpenseCategory;
  plate?: string;
}

export function ExpenseFormDialog({ open, onOpenChange, category, plate: defaultPlate }: ExpenseFormDialogProps) {
  const createExpense = useCreateMotorcycleExpense();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [value, setValue] = useState("");
  const [mileage, setMileage] = useState("");
  const [description, setDescription] = useState("");
  const [serviceDate, setServiceDate] = useState(todayStr);
  const [plate, setPlate] = useState(defaultPlate || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || !serviceDate || !plate.trim()) return;

    await createExpense.mutateAsync({
      category,
      value: parseFloat(value),
      mileage: mileage ? parseFloat(mileage) : null,
      description: description || null,
      service_date: serviceDate,
      plate: plate.trim().toUpperCase(),
    });

    setValue("");
    setMileage("");
    setDescription("");
    setServiceDate(todayStr);
    if (!defaultPlate) setPlate("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Despesa - {categoryLabels[category]}</DialogTitle>
          <DialogDescription>Registre uma despesa de {categoryLabels[category].toLowerCase()}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plate">Placa da Moto *</Label>
            <Input
              id="plate"
              placeholder="ABC-1234"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              required
              maxLength={10}
              disabled={!!defaultPlate}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="value">Valor (R$) *</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mileage">Quilometragem (km)</Label>
            <Input
              id="mileage"
              type="number"
              step="1"
              min="0"
              placeholder="Ex: 15000"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Detalhes do serviço..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="serviceDate">Data do Serviço *</Label>
            <Input
              id="serviceDate"
              type="date"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createExpense.isPending}>
              {createExpense.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
