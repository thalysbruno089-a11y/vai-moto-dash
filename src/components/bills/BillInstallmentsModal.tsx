import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BadgeStatus } from '@/components/ui/badge-status';
import { Progress } from '@/components/ui/progress';
import { Check, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { Bill, useMarkBillAsPaid } from '@/hooks/useBills';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BillInstallmentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: Bill | null;
}

export function BillInstallmentsModal({ open, onOpenChange, bill }: BillInstallmentsModalProps) {
  const markAsPaid = useMarkBillAsPaid();

  if (!bill) return null;

  const totalInstallments = bill.total_installments || 1;
  const paidInstallments = bill.paid_installments || 0;
  const remainingInstallments = totalInstallments - paidInstallments;
  const progressPercent = (paidInstallments / totalInstallments) * 100;
  const isFullyPaid = paidInstallments >= totalInstallments;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const datePart = dateStr.split('T')[0].split(' ')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return "-";
    const localDate = new Date(year, month - 1, day);
    return format(localDate, "dd/MM/yyyy", { locale: ptBR });
  };

  const handlePayNextInstallment = async () => {
    if (bill && !isFullyPaid) {
      await markAsPaid.mutateAsync(bill);
    }
  };

  // Generate installment list for display
  const installmentsList = Array.from({ length: totalInstallments }, (_, i) => {
    const installmentNumber = i + 1;
    const isPaid = installmentNumber <= paidInstallments;
    const isCurrent = installmentNumber === paidInstallments + 1;
    
    return {
      number: installmentNumber,
      isPaid,
      isCurrent,
      value: bill.value,
    };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {bill.name}
            {bill.is_fixed && (
              <Badge variant="outline" className="text-xs">Fixa</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Acompanhe o pagamento das parcelas desta conta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto">
          {/* Progress Summary */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Progresso</span>
              <span className="font-semibold">
                {paidInstallments} de {totalInstallments} parcelas
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <div className="grid grid-cols-3 gap-4 text-center pt-2">
              <div>
                <p className="text-2xl font-bold text-success">{paidInstallments}</p>
                <p className="text-xs text-muted-foreground">Pagas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">{remainingInstallments}</p>
                <p className="text-xs text-muted-foreground">Restantes</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{totalInstallments}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </div>

          {/* Value Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-sm text-muted-foreground">Valor por Parcela</p>
              <p className="text-lg font-semibold">{formatCurrency(bill.value)}</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-lg font-semibold">{formatCurrency(bill.value * totalInstallments)}</p>
            </div>
          </div>

          {/* Due Date Info */}
          <div className="rounded-lg border border-border p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Próximo Vencimento</span>
              <span className="font-medium">{formatDate(bill.due_date)}</span>
            </div>
          </div>

          {/* Installments List */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Lista de Parcelas</p>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {installmentsList.map((installment) => (
                <div
                  key={installment.number}
                  className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                    installment.isPaid 
                      ? 'bg-success/10 border-success/30' 
                      : installment.isCurrent 
                        ? 'bg-warning/10 border-warning/30' 
                        : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {installment.isPaid ? (
                      <div className="h-6 w-6 rounded-full bg-success/20 flex items-center justify-center">
                        <Check className="h-4 w-4 text-success" />
                      </div>
                    ) : installment.isCurrent ? (
                      <div className="h-6 w-6 rounded-full bg-warning/20 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-warning" />
                      </div>
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">{installment.number}</span>
                      </div>
                    )}
                    <span className={`font-medium ${installment.isPaid ? 'text-success' : ''}`}>
                      Parcela {installment.number}/{totalInstallments}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{formatCurrency(installment.value)}</span>
                    {installment.isPaid && (
                      <BadgeStatus status="success">Pago</BadgeStatus>
                    )}
                    {installment.isCurrent && (
                      <BadgeStatus status="warning">Atual</BadgeStatus>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-border">
          {isFullyPaid ? (
            <div className="flex items-center justify-center gap-2 text-success py-2">
              <Check className="h-5 w-5" />
              <span className="font-medium">Todas as parcelas foram pagas!</span>
            </div>
          ) : (
            <Button 
              className="w-full" 
              onClick={handlePayNextInstallment}
              disabled={markAsPaid.isPending}
            >
              {markAsPaid.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Pagar Parcela {paidInstallments + 1}/{totalInstallments}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
