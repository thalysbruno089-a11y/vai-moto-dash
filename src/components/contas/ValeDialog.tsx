import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2, Plus } from "lucide-react";
import { Bill } from "@/hooks/useBills";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

interface ValeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: Bill | null;
}

interface ValeRow {
  id: string;
  amount: number;
  taken_at: string;
  notes: string | null;
  cash_flow_id: string | null;
  created_at: string;
}

export function ValeDialog({ open, onOpenChange, entry }: ValeDialogProps) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAmount("");
      setDate(format(new Date(), "yyyy-MM-dd"));
      setNotes("");
    }
  }, [open]);

  const { data: vales = [], refetch } = useQuery({
    queryKey: ["bill_vales", entry?.id],
    enabled: !!entry?.id && open,
    queryFn: async () => {
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const { data, error } = await supabase
        .from("bill_vales" as any)
        .select("*")
        .eq("bill_id", entry!.id)
        .gte("taken_at", monthStart)
        .order("taken_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ValeRow[];
    },
  });

  const total = vales.reduce((s, v) => s + Number(v.amount), 0);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const syncBillVale = async (newTotal: number) => {
    await supabase.from("bills").update({ vale_amount: newTotal } as any).eq("id", entry!.id);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry) return;
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }
    const newTotal = total + val;
    if (newTotal > entry.value) {
      toast.error(`A soma dos vales (${formatCurrency(newTotal)}) excede o salário (${formatCurrency(entry.value)}).`);
      return;
    }

    setSaving(true);
    try {
      // create cash_flow expense so it shows up in dashboard right away
      const { data: cf, error: cfErr } = await supabase
        .from("cash_flow")
        .insert({
          company_id: entry.company_id,
          description: `Vale - ${entry.name}`,
          value: val,
          type: "expense" as const,
          flow_date: date,
          category_id: entry.category_id,
        })
        .select()
        .single();
      if (cfErr) throw cfErr;

      const { error } = await supabase.from("bill_vales" as any).insert({
        company_id: entry.company_id,
        bill_id: entry.id,
        amount: val,
        taken_at: date,
        notes: notes || null,
        cash_flow_id: cf?.id,
      });
      if (error) throw error;

      await syncBillVale(newTotal);
      await refetch();
      qc.invalidateQueries({ queryKey: ["bills"] });
      qc.invalidateQueries({ queryKey: ["cash_flow"] });
      qc.invalidateQueries({ queryKey: ["bill_vales", "current_month"] });
      toast.success("Vale registrado!");
      setAmount("");
      setNotes("");
    } catch (err: any) {
      toast.error("Erro ao registrar vale", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (v: ValeRow) => {
    if (!entry) return;
    setDeletingId(v.id);
    try {
      if (v.cash_flow_id) {
        await supabase.from("cash_flow").delete().eq("id", v.cash_flow_id);
      }
      const { error } = await supabase.from("bill_vales" as any).delete().eq("id", v.id);
      if (error) throw error;
      const newTotal = total - Number(v.amount);
      await syncBillVale(newTotal);
      await refetch();
      qc.invalidateQueries({ queryKey: ["bills"] });
      qc.invalidateQueries({ queryKey: ["cash_flow"] });
      qc.invalidateQueries({ queryKey: ["bill_vales", "current_month"] });
      toast.success("Vale excluído.");
    } catch (err: any) {
      toast.error("Erro ao excluir vale", { description: err.message });
    } finally {
      setDeletingId(null);
    }
  };

  const liquido = entry ? entry.value - total : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vales de {entry?.name}</DialogTitle>
          <DialogDescription>
            {entry && `Salário: ${formatCurrency(entry.value)} · Vales: ${formatCurrency(total)} · Líquido: ${formatCurrency(liquido)}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAdd} className="space-y-3 border-b pb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="vale-amount">Valor (R$)</Label>
              <Input id="vale-amount" type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vale-date">Data</Label>
              <Input id="vale-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vale-notes">Observação (opcional)</Label>
            <Input id="vale-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: adiantamento combustível" />
          </div>
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Adicionar Vale
          </Button>
        </form>

        <div className="space-y-2">
          <p className="text-sm font-medium">Histórico de vales</p>
          {vales.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum vale registrado ainda.</p>
          ) : (
            <div className="space-y-2">
              {vales.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 p-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-600">{formatCurrency(Number(v.amount))}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(v.taken_at + "T12:00:00"), "dd/MM/yyyy")}
                      {v.notes && ` · ${v.notes}`}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    disabled={deletingId === v.id}
                    onClick={() => handleDelete(v)}
                  >
                    {deletingId === v.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
