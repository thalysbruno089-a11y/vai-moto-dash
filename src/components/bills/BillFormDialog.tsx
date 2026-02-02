import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useCreateBill, useUpdateBill, Bill } from '@/hooks/useBills';
import { format, addDays, addWeeks, addMonths } from 'date-fns';

interface BillFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill?: Bill | null;
  parentBill?: Bill | null;
  installmentNumber?: number;
}

type InstallmentInterval = 'weekly' | 'biweekly' | 'monthly';

export function BillFormDialog({ open, onOpenChange, bill, parentBill, installmentNumber }: BillFormDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState('2');
  const [installmentInterval, setInstallmentInterval] = useState<InstallmentInterval>('monthly');

  const createBill = useCreateBill();
  const updateBill = useUpdateBill();
  const isLoading = createBill.isPending || updateBill.isPending;
  const isEditing = !!bill;
  const isAddingToParent = !!parentBill;

  useEffect(() => {
    if (open) {
      if (bill) {
        setName(bill.name);
        setDescription(bill.description || '');
        setValue(bill.value.toString());
        setDueDate(bill.due_date);
        setIsInstallment(false);
      } else if (parentBill) {
        // Creating installment from parent
        setName(`${parentBill.name}`);
        setDescription(parentBill.description || '');
        setValue(parentBill.value.toString());
        // Default to next month
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        setDueDate(format(nextMonth, 'yyyy-MM-dd'));
        setIsInstallment(false);
      } else {
        setName('');
        setDescription('');
        setValue('');
        setDueDate(format(new Date(), 'yyyy-MM-dd'));
        setIsInstallment(false);
        setTotalInstallments('2');
        setInstallmentInterval('monthly');
      }
    }
  }, [open, bill, parentBill, installmentNumber]);

  const getNextDate = (baseDate: Date, interval: InstallmentInterval, multiplier: number): Date => {
    switch (interval) {
      case 'weekly':
        return addWeeks(baseDate, multiplier);
      case 'biweekly':
        return addWeeks(baseDate, multiplier * 2);
      case 'monthly':
        return addMonths(baseDate, multiplier);
      default:
        return addMonths(baseDate, multiplier);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing && bill) {
        // Updating existing bill
        await updateBill.mutateAsync({
          id: bill.id,
          name,
          description: description || null,
          value: parseFloat(value) || 0,
          due_date: dueDate,
        });
      } else if (isAddingToParent && parentBill) {
        // Adding single installment to existing bill
        await createBill.mutateAsync({
          name: `${name} - Parcela ${installmentNumber}`,
          description: description || null,
          value: parseFloat(value) || 0,
          due_date: dueDate,
          status: 'pending' as const,
          parent_bill_id: parentBill.id,
          installment_number: installmentNumber || null,
        });
      } else if (isInstallment) {
        // Creating new bill with multiple installments
        const numInstallments = parseInt(totalInstallments) || 2;
        const installmentValue = parseFloat(value) || 0;
        const baseDate = new Date(dueDate);
        
        // Create all installments
        for (let i = 1; i <= numInstallments; i++) {
          const installmentDate = i === 1 ? baseDate : getNextDate(baseDate, installmentInterval, i - 1);
          
          await createBill.mutateAsync({
            name: `${name} - Parcela ${i}/${numInstallments}`,
            description: description || null,
            value: installmentValue,
            due_date: format(installmentDate, 'yyyy-MM-dd'),
            status: 'pending' as const,
            parent_bill_id: null,
            installment_number: i,
          });
        }
      } else {
        // Creating single bill
        await createBill.mutateAsync({
          name,
          description: description || null,
          value: parseFloat(value) || 0,
          due_date: dueDate,
          status: 'pending' as const,
          parent_bill_id: null,
          installment_number: null,
        });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const dialogTitle = isEditing 
    ? 'Editar Conta' 
    : isAddingToParent 
      ? `Adicionar Parcela ${installmentNumber}` 
      : 'Nova Conta a Pagar';

  const getIntervalLabel = (interval: InstallmentInterval) => {
    switch (interval) {
      case 'weekly': return 'Semanal';
      case 'biweekly': return 'Quinzenal';
      case 'monthly': return 'Mensal';
    }
  };

  // Calculate preview of installment dates
  const getInstallmentPreview = () => {
    if (!isInstallment || !dueDate || !totalInstallments) return [];
    
    const numInstallments = parseInt(totalInstallments) || 2;
    const baseDate = new Date(dueDate);
    const preview: { number: number; date: string }[] = [];
    
    for (let i = 1; i <= Math.min(numInstallments, 6); i++) {
      const installmentDate = i === 1 ? baseDate : getNextDate(baseDate, installmentInterval, i - 1);
      preview.push({
        number: i,
        date: format(installmentDate, 'dd/MM/yyyy'),
      });
    }
    
    return preview;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {isAddingToParent 
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
              placeholder="Ex: Celular, Aluguel, Internet..."
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
              <Label htmlFor="value">
                {isInstallment ? 'Valor da Parcela (R$) *' : 'Valor (R$) *'}
              </Label>
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
              <Label htmlFor="dueDate">
                {isInstallment ? 'Data da 1ª Parcela *' : 'Data de Vencimento *'}
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Installment Toggle - only show for new bills */}
          {!isEditing && !isAddingToParent && (
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="installment-toggle" className="text-base">
                  Parcelar esta conta
                </Label>
                <p className="text-sm text-muted-foreground">
                  Dividir o pagamento em várias parcelas
                </p>
              </div>
              <Switch
                id="installment-toggle"
                checked={isInstallment}
                onCheckedChange={setIsInstallment}
              />
            </div>
          )}

          {/* Installment Options */}
          {isInstallment && !isEditing && !isAddingToParent && (
            <div className="space-y-4 rounded-lg border border-border p-4 bg-muted/30">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalInstallments">Número de Parcelas</Label>
                  <Input
                    id="totalInstallments"
                    type="number"
                    min="2"
                    max="48"
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interval">Intervalo</Label>
                  <Select value={installmentInterval} onValueChange={(v) => setInstallmentInterval(v as InstallmentInterval)}>
                    <SelectTrigger id="interval">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="biweekly">Quinzenal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Preview */}
              {dueDate && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Prévia das parcelas:</Label>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {getInstallmentPreview().map((p) => (
                      <div key={p.number} className="flex justify-between bg-background rounded px-2 py-1">
                        <span className="text-muted-foreground">Parcela {p.number}:</span>
                        <span className="font-medium">{p.date}</span>
                      </div>
                    ))}
                    {parseInt(totalInstallments) > 6 && (
                      <div className="col-span-2 text-center text-muted-foreground text-xs">
                        ... e mais {parseInt(totalInstallments) - 6} parcelas
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground border-t border-border pt-2 mt-2">
                    Total: <span className="font-semibold text-foreground">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        (parseFloat(value) || 0) * (parseInt(totalInstallments) || 0)
                      )}
                    </span>
                    {' '}em {totalInstallments}x de{' '}
                    <span className="font-semibold text-foreground">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(value) || 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !name || !value || !dueDate}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar' : isInstallment ? 'Criar Parcelas' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
