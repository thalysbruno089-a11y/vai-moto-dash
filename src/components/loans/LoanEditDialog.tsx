import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loan } from "@/hooks/useLoans";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  loan: Loan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LoanEditDialog = ({ loan, open, onOpenChange }: Props) => {
  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("10");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open && loan) {
      setPersonName(loan.person_name);
      setAmount(String(loan.principal_amount));
      setRate(String(loan.interest_rate));
      setDueDate(loan.due_date || "");
      setNotes(loan.notes || "");
    }
  }, [open, loan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim() || !amount) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('loans')
        .update({
          person_name: personName.trim(),
          principal_amount: Number(amount),
          interest_rate: Number(rate),
          due_date: dueDate || null,
          notes: notes.trim() || null,
        })
        .eq('id', loan.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Empréstimo atualizado!');
      onOpenChange(false);
    } catch (err: any) {
      toast.error('Erro ao atualizar', { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Empréstimo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da Pessoa</Label>
            <Input value={personName} onChange={e => setPersonName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Juros ao Mês</Label>
              <Select value={rate} onValueChange={setRate}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
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
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoanEditDialog;
