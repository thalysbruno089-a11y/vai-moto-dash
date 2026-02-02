import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, X, Plus, Loader2, AlertCircle } from 'lucide-react';
import { Bill, useMarkBillAsPaid, useUpdateBill } from '@/hooks/useBills';
import { BillFormDialog } from './BillFormDialog';

interface BillsDueTodayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bills: Bill[];
}

export function BillsDueTodayDialog({ open, onOpenChange, bills }: BillsDueTodayDialogProps) {
  const [installmentDialogOpen, setInstallmentDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [processingBillId, setProcessingBillId] = useState<string | null>(null);

  const markAsPaid = useMarkBillAsPaid();
  const updateBill = useUpdateBill();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleMarkAsPaid = async (bill: Bill) => {
    setProcessingBillId(bill.id);
    try {
      await markAsPaid.mutateAsync(bill);
    } finally {
      setProcessingBillId(null);
    }
  };

  const handleMarkAsNotPaid = async (bill: Bill) => {
    setProcessingBillId(bill.id);
    try {
      await updateBill.mutateAsync({ id: bill.id, status: 'overdue' });
    } finally {
      setProcessingBillId(null);
    }
  };

  const handleAddInstallment = (bill: Bill) => {
    setSelectedBill(bill);
    setInstallmentDialogOpen(true);
  };

  const getNextInstallmentNumber = (bill: Bill) => {
    // Simple increment - in real scenario you'd check existing installments
    return (bill.installment_number || 0) + 1;
  };

  const totalDue = bills.reduce((acc, bill) => acc + Number(bill.value), 0);
  const pendingBills = bills.filter(b => b.status === 'pending');

  if (pendingBills.length === 0 && open) {
    return null;
  }

  return (
    <>
      <Dialog open={open && pendingBills.length > 0} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                <Bell className="h-5 w-5 text-warning" />
              </div>
              <div>
                <DialogTitle>Contas a Pagar Hoje</DialogTitle>
                <DialogDescription>
                  Você tem {pendingBills.length} conta{pendingBills.length > 1 ? 's' : ''} vencendo hoje
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {pendingBills.map((bill) => (
              <div
                key={bill.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground truncate">{bill.name}</h4>
                    {bill.installment_number && (
                      <Badge variant="secondary" className="text-xs">
                        Parcela {bill.installment_number}
                      </Badge>
                    )}
                  </div>
                  {bill.description && (
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {bill.description}
                    </p>
                  )}
                  <p className="text-lg font-semibold text-foreground mt-1">
                    {formatCurrency(Number(bill.value))}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {processingBillId === bill.id ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddInstallment(bill)}
                        title="Adicionar parcela"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleMarkAsNotPaid(bill)}
                        title="Não pago"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-success hover:bg-success/90"
                        onClick={() => handleMarkAsPaid(bill)}
                        title="Marcar como pago"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Pago
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>Total a pagar hoje:</span>
            </div>
            <span className="text-lg font-bold text-foreground">
              {formatCurrency(totalDue)}
            </span>
          </div>
        </DialogContent>
      </Dialog>

      <BillFormDialog
        open={installmentDialogOpen}
        onOpenChange={setInstallmentDialogOpen}
        parentBill={selectedBill}
        installmentNumber={selectedBill ? getNextInstallmentNumber(selectedBill) : 1}
      />
    </>
  );
}
