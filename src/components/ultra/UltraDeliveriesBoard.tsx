import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Trash2, Calendar as CalendarIcon, Receipt, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  useUltraDeliveries,
  useCreateUltraDelivery,
  useUpdateUltraDelivery,
  useDeleteUltraDelivery,
  type UltraDelivery,
} from "@/hooks/useUltraDeliveries";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";

const fmtMoney = (v: number | null) =>
  v == null ? "-" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface Props {
  /** Se true mostra data selecionável (admin). Se false só data de hoje (ULTRA). */
  allowDateChange?: boolean;
}

export const UltraDeliveriesBoard = ({ allowDateChange = false }: Props) => {
  const today = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(today);
  const { data: deliveries = [], isLoading } = useUltraDeliveries(selectedDate);
  const createMut = useCreateUltraDelivery();
  const updateMut = useUpdateUltraDelivery();
  const deleteMut = useDeleteUltraDelivery();
  const [toDelete, setToDelete] = useState<string | null>(null);

  const nextPos = useMemo(
    () => (deliveries.length ? Math.max(...deliveries.map((d) => d.position)) + 1 : 1),
    [deliveries]
  );

  const totals = useMemo(() => {
    return deliveries.reduce(
      (acc, d) => {
        acc.pagamento += Number(d.pagamento || 0);
        acc.taxa += Number(d.taxa || 0);
        if (d.ok) acc.entregues += 1;
        if (d.tem_receita) acc.receitas += 1;
        return acc;
      },
      { pagamento: 0, taxa: 0, entregues: 0, receitas: 0 }
    );
  }, [deliveries]);

  const addRow = () => {
    const now = new Date();
    createMut.mutate({
      delivery_date: selectedDate,
      position: nextPos,
      horario: format(now, "HH:mm"),
    });
  };

  const patch = (id: string, p: Partial<UltraDelivery>) =>
    updateMut.mutate({ id, patch: p });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <CalendarIcon className="h-4 w-4 text-primary" />
          {allowDateChange ? (
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          ) : (
            <span className="font-medium">
              {format(new Date(selectedDate + "T12:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          )}
        </div>
        <Button onClick={addRow} disabled={createMut.isPending} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Nova entrega
        </Button>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Card><CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Entregas</p>
          <p className="text-xl font-bold">{deliveries.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Entregues (OK)</p>
          <p className="text-xl font-bold text-success">{totals.entregues}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Pagamento</p>
          <p className="text-lg font-bold">{fmtMoney(totals.pagamento)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Taxa</p>
          <p className="text-lg font-bold">{fmtMoney(totals.taxa)}</p>
        </CardContent></Card>
      </div>

      {/* Rows */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : deliveries.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          Nenhuma entrega registrada. Toque em <span className="font-medium">Nova entrega</span>.
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {deliveries.map((d) => (
            <Card key={d.id} className={d.ok ? "border-success/40" : ""}>
              <CardContent className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="h-6 min-w-6 justify-center px-2">
                      #{d.position}
                    </Badge>
                    <Input
                      type="time"
                      value={d.horario ?? ""}
                      onChange={(e) => patch(d.id, { horario: e.target.value })}
                      className="h-8 w-24"
                    />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => setToDelete(d.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Entregador</Label>
                    <Input
                      value={d.entregador ?? ""}
                      onChange={(e) => patch(d.id, { entregador: e.target.value })}
                      placeholder="Nome"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Endereço</Label>
                    <Input
                      value={d.endereco ?? ""}
                      onChange={(e) => patch(d.id, { endereco: e.target.value })}
                      placeholder="Rua, número, bairro"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Pagamento (R$)</Label>
                    <Input
                      type="number" step="0.01" inputMode="decimal"
                      value={d.pagamento ?? ""}
                      onChange={(e) => patch(d.id, { pagamento: e.target.value === "" ? null : Number(e.target.value) })}
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Taxa (R$)</Label>
                    <Input
                      type="number" step="0.01" inputMode="decimal"
                      value={d.taxa ?? ""}
                      onChange={(e) => patch(d.id, { taxa: e.target.value === "" ? null : Number(e.target.value) })}
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-1 border-t">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={d.ok}
                      onCheckedChange={(v) => patch(d.id, { ok: !!v })}
                    />
                    <CheckCircle2 className="h-4 w-4 text-success" /> Entregue (OK)
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={d.tem_receita}
                      onCheckedChange={(v) => patch(d.id, { tem_receita: !!v, ...(v ? {} : { receita_ok: false }) })}
                    />
                    <Receipt className="h-4 w-4 text-primary" /> Tem receita
                  </label>
                  {d.tem_receita && (
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={d.receita_ok}
                        onCheckedChange={(v) => patch(d.id, { receita_ok: !!v })}
                      />
                      Receita entregue
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DeleteConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        onConfirm={async () => { if (toDelete) { await deleteMut.mutateAsync(toDelete); setToDelete(null); } }}
        title="Remover entrega"
        description="Tem certeza que deseja remover esta entrega?"
        isLoading={deleteMut.isPending}
      />
    </div>
  );
};