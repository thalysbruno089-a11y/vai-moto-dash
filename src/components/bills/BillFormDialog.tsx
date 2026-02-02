import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useCreateBill, useUpdateBill, Bill } from '@/hooks/useBills';
import { format, addWeeks, addMonths } from 'date-fns';

interface BillFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill?: Bill | null;
  parentBill?: Bill | null;
  installmentNumber?: number;
}

type InstallmentInterval = 'weekly' | 'biweekly' | 'monthly';
type InstallmentMode = 'auto' | 'manual';

// Helper to parse YYYY-MM-DD string to local Date (avoids timezone issues)
const parseDateString = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Helper to format Date to YYYY-MM-DD string using local components
const formatDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function BillFormDialog({ open, onOpenChange, bill, parentBill, installmentNumber }: BillFormDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentMode, setInstallmentMode] = useState<InstallmentMode>('auto');
  const [totalInstallments, setTotalInstallments] = useState('2');
  const [installmentInterval, setInstallmentInterval] = useState<InstallmentInterval>('monthly');
  const [manualDates, setManualDates] = useState<string[]>(['', '']);

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
        setName(`${parentBill.name}`);
        setDescription(parentBill.description || '');
        setValue(parentBill.value.toString());
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        setDueDate(formatDateString(nextMonth));
        setIsInstallment(false);
      } else {
        setName('');
        setDescription('');
        setValue('');
        setDueDate(formatDateString(new Date()));
        setIsInstallment(false);
        setInstallmentMode('auto');
        setTotalInstallments('2');
        setInstallmentInterval('monthly');
        setManualDates(['', '']);
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

  const addManualDate = () => {
    setManualDates([...manualDates, '']);
  };

  const removeManualDate = (index: number) => {
    if (manualDates.length > 2) {
      setManualDates(manualDates.filter((_, i) => i !== index));
    }
  };

  const updateManualDate = (index: number, value: string) => {
    const updated = [...manualDates];
    updated[index] = value;
    setManualDates(updated);
  };

  // Ensure date string is in correct YYYY-MM-DD format without any timezone conversion
  const normalizeDateForSubmit = (dateStr: string): string => {
    // If it's already in YYYY-MM-DD format from the input, just validate and return
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    // If somehow it's a Date object or ISO string, parse and format locally
    const parsed = parseDateString(dateStr);
    return formatDateString(parsed);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Normalize the date to ensure consistent YYYY-MM-DD format
      const normalizedDueDate = normalizeDateForSubmit(dueDate);
      
      if (isEditing && bill) {
        await updateBill.mutateAsync({
          id: bill.id,
          name,
          description: description || null,
          value: parseFloat(value) || 0,
          due_date: normalizedDueDate,
        });
      } else if (isAddingToParent && parentBill) {
        await createBill.mutateAsync({
          name: `${name} - Parcela ${installmentNumber}`,
          description: description || null,
          value: parseFloat(value) || 0,
          due_date: normalizedDueDate,
          status: 'pending' as const,
          parent_bill_id: parentBill.id,
          installment_number: installmentNumber || null,
        });
      } else if (isInstallment) {
        const installmentValue = parseFloat(value) || 0;
        
        if (installmentMode === 'manual') {
          // Manual mode: use user-defined dates (normalize each one)
          const validDates = manualDates.filter(d => d.trim() !== '').map(d => normalizeDateForSubmit(d));
          for (let i = 0; i < validDates.length; i++) {
            await createBill.mutateAsync({
              name: `${name} - Parcela ${i + 1}/${validDates.length}`,
              description: description || null,
              value: installmentValue,
              due_date: validDates[i],
              status: 'pending' as const,
              parent_bill_id: null,
              installment_number: i + 1,
            });
          }
        } else {
          // Auto mode: calculate dates automatically
          const numInstallments = parseInt(totalInstallments) || 2;
          const baseDate = parseDateString(normalizedDueDate);
          
          for (let i = 1; i <= numInstallments; i++) {
            const installmentDate = i === 1 ? baseDate : getNextDate(baseDate, installmentInterval, i - 1);
            
            await createBill.mutateAsync({
              name: `${name} - Parcela ${i}/${numInstallments}`,
              description: description || null,
              value: installmentValue,
              due_date: formatDateString(installmentDate),
              status: 'pending' as const,
              parent_bill_id: null,
              installment_number: i,
            });
          }
        }
      } else {
        await createBill.mutateAsync({
          name,
          description: description || null,
          value: parseFloat(value) || 0,
          due_date: normalizedDueDate,
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

  // Calculate preview of installment dates (auto mode only)
  const getInstallmentPreview = () => {
    if (!isInstallment || installmentMode === 'manual' || !dueDate || !totalInstallments) return [];
    
    const numInstallments = parseInt(totalInstallments) || 2;
    const baseDate = parseDateString(dueDate);
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

  const getManualTotal = () => {
    const validDates = manualDates.filter(d => d.trim() !== '');
    return validDates.length;
  };

  const canSubmitManual = () => {
    const validDates = manualDates.filter(d => d.trim() !== '');
    return validDates.length >= 2;
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
              {/* Mode Selection */}
              <div className="space-y-2">
                <Label>Modo de Parcelamento</Label>
                <Select value={installmentMode} onValueChange={(v) => setInstallmentMode(v as InstallmentMode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automático (calcular datas)</SelectItem>
                    <SelectItem value="manual">Manual (escolher cada data)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {installmentMode === 'auto' ? (
                <>
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
                </>
              ) : (
                /* Manual Mode */
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground">
                    Defina as datas de cada parcela:
                  </Label>
                  
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {manualDates.map((date, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground w-20">
                          Parcela {index + 1}:
                        </span>
                        <Input
                          type="date"
                          value={date}
                          onChange={(e) => updateManualDate(index, e.target.value)}
                          className="flex-1"
                        />
                        {manualDates.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeManualDate(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addManualDate}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Parcela
                  </Button>

                  {getManualTotal() > 0 && (
                    <div className="text-sm text-muted-foreground border-t border-border pt-2 mt-2">
                      Total: <span className="font-semibold text-foreground">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                          (parseFloat(value) || 0) * getManualTotal()
                        )}
                      </span>
                      {' '}em {getManualTotal()}x de{' '}
                      <span className="font-semibold text-foreground">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(value) || 0)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={
                isLoading || 
                !name || 
                !value || 
                (!isInstallment && !dueDate) ||
                (isInstallment && installmentMode === 'auto' && !dueDate) ||
                (isInstallment && installmentMode === 'manual' && !canSubmitManual())
              }
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar' : isInstallment ? 'Criar Parcelas' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
