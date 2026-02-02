import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useCreateBill, useUpdateBill, Bill } from '@/hooks/useBills';
import { format } from 'date-fns';

interface BillFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill?: Bill | null;
  parentBill?: Bill | null;
  installmentNumber?: number;
}

export function BillFormDialog({ open, onOpenChange, bill, parentBill, installmentNumber }: BillFormDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [dueDate, setDueDate] = useState('');

  const createBill = useCreateBill();
  const updateBill = useUpdateBill();
  const isLoading = createBill.isPending || updateBill.isPending;
  const isEditing = !!bill;
  const isInstallment = !!parentBill;

  useEffect(() => {
    if (open) {
      if (bill) {
        setName(bill.name);
        setDescription(bill.description || '');
        setValue(bill.value.toString());
        setDueDate(bill.due_date);
      } else if (parentBill) {
        // Creating installment from parent
        setName(`${parentBill.name} - Parcela ${installmentNumber}`);
        setDescription(parentBill.description || '');
        setValue(parentBill.value.toString());
        // Default to next month
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        setDueDate(format(nextMonth, 'yyyy-MM-dd'));
      } else {
        setName('');
        setDescription('');
        setValue('');
        setDueDate(format(new Date(), 'yyyy-MM-dd'));
      }
    }
  }, [open, bill, parentBill, installmentNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name,
      description: description || null,
      value: parseFloat(value) || 0,
      due_date: dueDate,
      status: 'pending' as const,
      parent_bill_id: parentBill?.id || null,
      installment_number: installmentNumber || null,
    };
    
    try {
      if (isEditing && bill) {
        await updateBill.mutateAsync({ id: bill.id, ...data });
      } else {
        await createBill.mutateAsync(data);
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const dialogTitle = isEditing 
    ? 'Editar Conta' 
    : isInstallment 
      ? `Adicionar Parcela ${installmentNumber}` 
      : 'Nova Conta a Pagar';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {isInstallment 
              ? 'Adicione uma nova parcela para esta conta.' 
              : 'Cadastre uma conta para receber lembretes no dia do vencimento.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Conta *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Aluguel, Energia, Internet..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes adicionais..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Valor (R$) *</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                min="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Data de Vencimento *</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !name || !value || !dueDate}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
