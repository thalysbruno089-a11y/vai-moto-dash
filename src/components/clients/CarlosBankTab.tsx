import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import {
  useCarlosBank, useCreateBankDeposit, useDeleteBankTx,
} from "@/hooks/useCarlosBank";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export const CarlosBankTab = () => {
  const { data: txs, isLoading } = useCarlosBank();
  const createDeposit = useCreateBankDeposit();
  const deleteTx = useDeleteBankTx();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [toDelete, setToDelete] = useState<string | null>(null);

  const totals = useMemo(() => {
    const list = txs || [];
    const deposits = list.filter(t => t.type === "deposit").reduce((s, t) => s + Number(t.amount), 0);
    const debits = list.filter(t => t.type === "debit").reduce((s, t) => s + Number(t.amount), 0);
    return { deposits, debits, balance: deposits - debits };
  }, [txs]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = Number(amount);
    if (!v || v <= 0) return;
    await createDeposit.mutateAsync({ amount: v, description });
    setAmount("");
    setDescription("");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Depositado</p>
            <p className="text-2xl font-bold text-success">{fmt(totals.deposits)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Pago (Corridas)</p>
            <p className="text-2xl font-bold text-destructive">{fmt(totals.debits)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Saldo Atual</p>
            <p className={`text-2xl font-bold ${totals.balance < 0 ? "text-destructive" : "text-foreground"}`}>
              {fmt(totals.balance)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[160px_1fr_auto] items-end">
            <div>
              <Label>Valor depositado</Label>
              <Input
                type="number" step="0.01" min="0"
                value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00" required
              />
            </div>
            <div>
              <Label>Descrição (opcional)</Label>
              <Input
                value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Depósito de R$ 500,00"
              />
            </div>
            <Button type="submit" disabled={createDeposit.isPending}>
              <Plus className="mr-2 h-4 w-4" /> Depositar
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="data-table">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !txs || txs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhuma movimentação ainda.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txs.map((t) => {
                const isDep = t.type === "deposit";
                return (
                  <TableRow key={t.id} className={isDep ? "bg-success/5" : "bg-destructive/5"}>
                    <TableCell>
                      <Badge variant={isDep ? "default" : "destructive"} className="gap-1">
                        {isDep ? <ArrowUpCircle className="h-3 w-3" /> : <ArrowDownCircle className="h-3 w-3" />}
                        {isDep ? "Depósito" : "Pago"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {t.client_name ? (
                        <span><span className="font-medium">{t.client_name}</span> — {t.description}</span>
                      ) : (t.description || "-")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(t.transaction_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${isDep ? "text-success" : "text-destructive"}`}>
                      {isDep ? "+" : "-"} {fmt(Number(t.amount))}
                    </TableCell>
                    <TableCell>
                      {isDep && (
                        <Button variant="ghost" size="icon" className="h-8 w-8"
                                onClick={() => setToDelete(t.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <DeleteConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        onConfirm={async () => { if (toDelete) { await deleteTx.mutateAsync(toDelete); setToDelete(null); } }}
        title="Remover depósito"
        description="Tem certeza que deseja remover este depósito? Esta ação não pode ser desfeita."
        isLoading={deleteTx.isPending}
      />
    </div>
  );
};