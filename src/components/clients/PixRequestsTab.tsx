import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Trash2, Lock } from "lucide-react";
import { useClients } from "@/hooks/useClients";
import {
  useClientPixRequests,
  useCreatePixRequest,
  useMarkPixRequestPaid,
  useDeletePixRequest,
} from "@/hooks/useClientPixRequests";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export const PixRequestsTab = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const { data: clients = [] } = useClients();
  const { data: requests = [], isLoading } = useClientPixRequests();
  const createRequest = useCreatePixRequest();
  const markPaid = useMarkPixRequestPaid();
  const deleteRequest = useDeletePixRequest();

  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [toDelete, setToDelete] = useState<string | null>(null);

  const totals = useMemo(() => {
    const pending = requests.filter(r => r.status === "pending").reduce((s, r) => s + Number(r.amount), 0);
    const paid = requests.filter(r => r.status === "paid").reduce((s, r) => s + Number(r.amount), 0);
    return { pending, paid, total: pending + paid };
  }, [requests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createRequest.mutateAsync({
      client_id: clientId,
      amount: parseFloat(amount),
      notes: notes || null,
    });
    setClientId(""); setAmount(""); setNotes("");
  };

  return (
    <div className="space-y-6">
      {/* Totals */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pendente</p>
            <p className="text-2xl font-bold text-warning">{formatCurrency(totals.pending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pago</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(totals.paid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Solicitado</p>
            <p className="text-2xl font-bold">{formatCurrency(totals.total)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
            <div className="grid gap-1.5">
              <Label>Cliente</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Valor solicitado (PIX)</Label>
              <Input
                type="number" step="0.01" min="0" value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00" required
              />
            </div>
            <Button type="submit" disabled={createRequest.isPending || !clientId || !amount}>
              {createRequest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar"}
            </Button>
            <div className="grid gap-1.5 sm:col-span-3">
              <Label>Observações (opcional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="data-table">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma solicitação de PIX registrada.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Solicitado em</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-[160px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => {
                const isPaid = r.status === "paid";
                return (
                  <TableRow
                    key={r.id}
                    className={isPaid ? "bg-success/5" : "bg-warning/5"}
                  >
                    <TableCell className="font-medium">{r.client?.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(r.requested_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[260px] truncate">
                      {r.notes || "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(Number(r.amount))}
                    </TableCell>
                    <TableCell className="text-center">
                      {isPaid ? (
                        <Badge className="bg-success/15 text-success hover:bg-success/15">
                          Pago{r.paid_at ? ` • ${format(new Date(r.paid_at), "dd/MM HH:mm", { locale: ptBR })}` : ""}
                        </Badge>
                      ) : (
                        <Badge className="bg-warning/15 text-warning hover:bg-warning/15">Pendente</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!isPaid && (
                          isAdmin ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markPaid.mutate(r.id)}
                              disabled={markPaid.isPending}
                            >
                              <Check className="h-4 w-4 mr-1" /> Pago
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" disabled title="Somente Carlos pode marcar como pago">
                              <Lock className="h-4 w-4 mr-1" /> Pago
                            </Button>
                          )
                        )}
                        <Button
                          size="icon" variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setToDelete(r.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {!isAdmin && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Lock className="h-3 w-3" /> Apenas o administrador (Carlos) pode marcar solicitações como pagas, mediante comprovante.
        </p>
      )}

      <DeleteConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) await deleteRequest.mutateAsync(toDelete);
          setToDelete(null);
        }}
        title="Remover solicitação"
        description="Tem certeza que deseja remover esta solicitação de PIX?"
        isLoading={deleteRequest.isPending}
      />
    </div>
  );
};
