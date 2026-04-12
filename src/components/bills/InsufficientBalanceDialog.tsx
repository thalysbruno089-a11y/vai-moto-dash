import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

interface InsufficientBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billName: string;
  billValue: number;
  currentBalance: number;
  onConfirm: (source: string) => void;
}

export function InsufficientBalanceDialog({
  open,
  onOpenChange,
  billName,
  billValue,
  currentBalance,
  onConfirm,
}: InsufficientBalanceDialogProps) {
  const [step, setStep] = useState<'warning' | 'source'>('warning');
  const [source, setSource] = useState('');

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const handleContinue = () => {
    setStep('source');
  };

  const handleConfirm = () => {
    onConfirm(source);
    setStep('warning');
    setSource('');
  };

  const handleClose = (value: boolean) => {
    if (!value) {
      setStep('warning');
      setSource('');
    }
    onOpenChange(value);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        {step === 'warning' ? (
          <>
            <AlertDialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <AlertDialogTitle>Saldo Insuficiente</AlertDialogTitle>
                  <AlertDialogDescription className="mt-1">
                    O saldo da semana ({formatCurrency(currentBalance)}) é menor que o valor da conta "{billName}" ({formatCurrency(billValue)}).
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <Button onClick={handleContinue}>Continuar</Button>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>De onde veio esse valor?</AlertDialogTitle>
              <AlertDialogDescription>
                Informe a origem do valor para pagar "{billName}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="source">Origem do valor</Label>
              <Input
                id="source"
                placeholder="Ex: Dinheiro pessoal, empréstimo, etc."
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="mt-2"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setStep('warning')}>Voltar</AlertDialogCancel>
              <Button onClick={handleConfirm} disabled={!source.trim()}>
                Confirmar Pagamento
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
