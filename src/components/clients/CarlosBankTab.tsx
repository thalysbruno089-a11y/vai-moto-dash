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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export const CarlosBankTab = () => {
  const { data: txs, isLoading } = useCarlosBank();
  const createDeposit = useCreateBankDeposit();
  const deleteTx = useDeleteBankTx();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [clientFilter, setClientFilter] = useState<string>("all");

  const clientOptions = useMemo(() => {
    const map = new Map<string, string>();
    (txs || []).forEach(t => {
      if (t.client_id && t.client_name) map.set(t.client_id, t.client_name);
    });
    return Array.from(map, ([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [txs]);

  const filteredTxs = useMemo(() => {
    if (clientFilter === "all") return txs || [];
    return (txs || []).filter(t => t.client_id === clientFilter);
  }, [txs, clientFilter]);

  const perClient = useMemo(() => {
    const map = new Map<string, { id: string; name: string; total: number; count: number }>();
    (txs || []).forEach(t => {
      if (t.type !== "debit" || !t.client_id) return;
      const key = t.client_id;
      const cur = map.get(key) || { id: key, name: t.client_name || "—", total: 0, count: 0 };
      cur.total += Number(t.amount);
      cur.count += 1;
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [txs]);

  const totals = useMemo(() => {
    const list = filteredTxs;
    const deposits = list.filter(t => t.type === "deposit").reduce((s, t) => s + Number(t.amount), 0);
    const debits = list.filter(t => t.type === "debit").reduce((s, t) => s + Number(t.amount), 0);
    return { deposits, debits, balance: deposits - debits };
  }, [filteredTxs]);

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

      <div className="flex items-center gap-2 sm:max-w-sm">
        <Label className="whitespace-nowrap">Filtrar cliente:</Label>
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os clientes</SelectItem>
            {clientOptions.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {clientFilter !== "all" && (
          <Button variant="ghost" size="sm" onClick={() => setClientFilter("all")}>
            Limpar
          </Button>
        )}
      </div>

      {perClient.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold">Total pago por cliente</p>
            <div className="data-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Lançamentos</TableHead>
                    <TableHead className="text-right">Total Pago</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perClient.map(c => (
                    <TableRow key={c.id} className={clientFilter === c.id ? "bg-accent/30" : ""}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-right">{c.count}</TableCell>
                      <TableCell className="text-right font-semibold text-destructive">{fmt(c.total)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm"
                          onClick={() => setClientFilter(clientFilter === c.id ? "all" : c.id)}>
                          {clientFilter === c.id ? "Limpar" : "Ver"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="data-table">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTxs.length === 0 ? (
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
              {filteredTxs.map((t) => {
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
                      <Button variant="ghost" size="icon" className="h-8 w-8"
                              onClick={() => setToDelete(t.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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