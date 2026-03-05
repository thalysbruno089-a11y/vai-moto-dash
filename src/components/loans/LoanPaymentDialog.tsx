import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateLoanPayment } from "@/hooks/useLoans";
import { DollarSign } from "lucide-react";

interface Props {
  loanId: string;
  maxAmount?: number;
  monthlyInterest?: number;
}

const LoanPaymentDialog = ({ loanId, maxAmount, monthlyInterest = 0 }: Props) => {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState<"interest" | "principal">("interest");
  const [date, setDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [notes, setNotes] = useState("");
  const createPayment = useCreateLoanPayment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    createPayment.mutate(
      { loan_id: loanId, amount: Number(amount), payment_date: date, notes: notes.trim() || undefined, payment_type: paymentType },
      { onSuccess: () => { setOpen(false); setAmount(""); setNotes(""); setPaymentType("interest"); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><DollarSign className="h-4 w-4 mr-1" />Registrar Pagamento</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Pagamento</Label>
            <Tabs value={paymentType} onValueChange={(v) => setPaymentType(v as "interest" | "principal")}>
              <TabsList className="w-full">
                <TabsTrigger value="interest" className="flex-1">💰 Juros</TabsTrigger>
                <TabsTrigger value="principal" className="flex-1">📉 Abater Saldo</TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-xs text-muted-foreground">
              {paymentType === "interest"
                ? "O valor será registrado como juros pagos. Não reduz o saldo devedor."
                : "O valor será descontado diretamente do saldo devedor."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" required />
              {paymentType === "interest" && monthlyInterest > 0 && (
                <p className="text-xs text-muted-foreground">
                  Juros do mês: R$ {monthlyInterest.toFixed(2)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas..." />
          </div>
          <Button type="submit" className="w-full" disabled={createPayment.isPending}>
            {createPayment.isPending ? "Salvando..." : "Registrar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoanPaymentDialog;
