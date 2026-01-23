import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useCreatePayment } from '@/hooks/usePayments';
import { useMotoboys } from '@/hooks/useMotoboys';
import { getPaymentWeeksForMonths, PaymentWeek } from '@/lib/weekUtils';
import { format } from 'date-fns';

interface PaymentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentFormDialog({ open, onOpenChange }: PaymentFormDialogProps) {
  const [motoboyId, setMotoboyId] = useState('');
  const [value, setValue] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');

  const createPayment = useCreatePayment();
  const { data: motoboys } = useMotoboys();
  const isLoading = createPayment.isPending;

  const activeMotoboys = (motoboys || []).filter(m => m.status === 'active');

  // Gerar semanas disponíveis
  const monthsWithWeeks = useMemo(() => getPaymentWeeksForMonths(3), []);
  
  // Flat list of all weeks for lookup
  const allWeeks = useMemo(() => {
    const weeks: PaymentWeek[] = [];
    monthsWithWeeks.forEach(m => weeks.push(...m.weeks));
    return weeks;
  }, [monthsWithWeeks]);

  useEffect(() => {
    if (open) {
      setMotoboyId('');
      setValue('');
      // Selecionar a semana atual por padrão
      if (allWeeks.length > 0) {
        const today = new Date();
        const currentWeek = allWeeks.find(w => 
          today >= w.startDate && today <= w.endDate
        );
        setSelectedWeek(currentWeek?.id || allWeeks[0]?.id || '');
      }
    }
  }, [open, allWeeks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const week = allWeeks.find(w => w.id === selectedWeek);
    if (!week) return;
    
    const data = { 
      motoboy_id: motoboyId || null,
      value: parseFloat(value) || 0,
      period_start: format(week.startDate, 'yyyy-MM-dd'),
      period_end: format(week.endDate, 'yyyy-MM-dd'),
      status: 'pending' as const,
    };
    
    try {
      await createPayment.mutateAsync(data);
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation's onError callback
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
          <DialogDescription>
            Registre um novo pagamento semanal para um motoboy. As semanas vão de quinta a quarta-feira.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="motoboy">Motoboy *</Label>
            <Select value={motoboyId} onValueChange={setMotoboyId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motoboy" />
              </SelectTrigger>
              <SelectContent>
                {activeMotoboys.map((motoboy) => (
                  <SelectItem key={motoboy.id} value={motoboy.id}>
                    {motoboy.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="week">Semana de Pagamento *</Label>
            <Select value={selectedWeek} onValueChange={setSelectedWeek} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a semana" />
              </SelectTrigger>
              <SelectContent>
                {monthsWithWeeks.map((month) => (
                  <div key={month.month}>
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50 capitalize">
                      {month.month}
                    </div>
                    {month.weeks.map((week) => (
                      <SelectItem key={week.id} value={week.id}>
                        {week.label}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !motoboyId || !selectedWeek}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
