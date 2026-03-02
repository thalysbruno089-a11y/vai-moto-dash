import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateLoan } from "@/hooks/useLoans";
import { Plus } from "lucide-react";

interface Props {
  type: 'lent' | 'borrowed';
}

const LoanFormDialog = ({ type }: Props) => {
  const [open, setOpen] = useState(false);
  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("10");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const createLoan = useCreateLoan();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim() || !amount) return;
    createLoan.mutate(
      { type, person_name: personName.trim(), principal_amount: Number(amount), interest_rate: Number(rate), due_date: dueDate || undefined, notes: notes.trim() || undefined },
      { onSuccess: () => { setOpen(false); setPersonName(""); setAmount(""); setRate("10"); setDueDate(""); setNotes(""); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />Novo Empréstimo</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{type === 'lent' ? 'Novo Empréstimo (Emprestei)' : 'Novo Empréstimo (Peguei)'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da Pessoa</Label>
            <Input value={personName} onChange={e => setPersonName(e.target.value)} placeholder="Nome" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" required />
            </div>
            <div className="space-y-2">
              <Label>Juros ao Mês</Label>
              <Select value={rate} onValueChange={setRate}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="10">10%</SelectItem>
                  <SelectItem value="20">20%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Data de Vencimento</Label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas..." />
          </div>
          <Button type="submit" className="w-full" disabled={createLoan.isPending}>
            {createLoan.isPending ? "Salvando..." : "Cadastrar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoanFormDialog;
