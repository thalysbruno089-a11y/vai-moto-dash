import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Receipt,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Send,
  Printer,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useUltraDeliveries,
  useCreateUltraDelivery,
  useUpdateUltraDelivery,
  useDeleteUltraDelivery,
  useSendUltraDayToCentral,
  type UltraDelivery,
} from "@/hooks/useUltraDeliveries";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { toast } from "sonner";
import ultraLogo from "@/assets/ultra-logo.png.asset.json";

const fmtMoney = (v: number | null) =>
  v == null
    ? "-"
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const PAYMENT_LABELS: Record<string, string> = {
  credito: "Crédito",
  debito: "Débito",
  dinheiro: "Dinheiro",
  pix: "Pix",
};

interface Props {
  /** Editing (ULTRA user). If false: read-only report view for Carlos/Secretaria. */
  editable?: boolean;
  /** Show date picker (admin/read-only history). */
  allowDateChange?: boolean;
  /** When true (read-only), only show rows that were sent to central. */
  sentOnly?: boolean;
}

/* ---------------- Row (isolated local state to eliminate typing lag) ---------------- */

function DeliveryRow({
  delivery,
  editable,
  onPatch,
  onDelete,
}: {
  delivery: UltraDelivery;
  editable: boolean;
  onPatch: (id: string, patch: Partial<UltraDelivery>) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    horario: delivery.horario ?? "",
    entregador: delivery.entregador ?? "",
    endereco: delivery.endereco ?? "",
    pagamento: delivery.pagamento?.toString() ?? "",
    taxa: delivery.taxa?.toString() ?? "",
  });

  // Keep draft in sync when server data changes and this field is not being edited
  const focusedRef = useRef<string | null>(null);
  useEffect(() => {
    setDraft((prev) => ({
      horario: focusedRef.current === "horario" ? prev.horario : delivery.horario ?? "",
      entregador: focusedRef.current === "entregador" ? prev.entregador : delivery.entregador ?? "",
      endereco: focusedRef.current === "endereco" ? prev.endereco : delivery.endereco ?? "",
      pagamento: focusedRef.current === "pagamento" ? prev.pagamento : delivery.pagamento?.toString() ?? "",
      taxa: focusedRef.current === "taxa" ? prev.taxa : delivery.taxa?.toString() ?? "",
    }));
  }, [delivery]);

  const commit = (field: keyof typeof draft) => {
    focusedRef.current = null;
    const val = draft[field];
    if (field === "pagamento" || field === "taxa") {
      const num = val === "" ? null : Number(val);
      if (num !== (delivery[field] ?? null)) onPatch(delivery.id, { [field]: num } as any);
    } else {
      if (val !== (delivery[field] ?? "")) onPatch(delivery.id, { [field]: val || null } as any);
    }
  };

  const summary = [
    delivery.horario,
    delivery.entregador,
    delivery.endereco,
  ]
    .filter(Boolean)
    .join(" • ") || "Toque para preencher";

  const locked = delivery.sent_to_central;

  return (
    <Card className={delivery.ok ? "border-success/50" : locked ? "border-primary/40" : ""}>
      {/* Header (always visible, click to toggle) */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left p-3 flex items-center gap-2"
      >
        <Badge variant="outline" className="h-6 min-w-6 justify-center px-2 shrink-0">
          #{delivery.position}
        </Badge>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{summary}</p>
          <div className="flex flex-wrap items-center gap-1 mt-0.5">
            {delivery.ok && (
              <Badge variant="secondary" className="h-5 text-[10px] gap-0.5">
                <CheckCircle2 className="h-3 w-3 text-success" /> OK
              </Badge>
            )}
            {delivery.payment_method && (
              <Badge variant="outline" className="h-5 text-[10px]">
                {PAYMENT_LABELS[delivery.payment_method] ?? delivery.payment_method}
              </Badge>
            )}
            {delivery.pagamento != null && (
              <span className="text-xs text-muted-foreground">{fmtMoney(delivery.pagamento)}</span>
            )}
            {delivery.tem_receita && (
              <Badge variant="outline" className="h-5 text-[10px] gap-0.5">
                <Receipt className="h-3 w-3" /> Receita{delivery.receita_ok ? " ✓" : ""}
              </Badge>
            )}
            {locked && (
              <Badge variant="outline" className="h-5 text-[10px] gap-0.5 border-primary/50 text-primary">
                <Lock className="h-3 w-3" /> Enviado
              </Badge>
            )}
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
      </button>

      {open && (
        <CardContent className="pt-0 pb-3 space-y-3">
          <div className="flex items-center justify-between">
            <Input
              type="time"
              value={draft.horario}
              disabled={!editable || locked}
              onFocus={() => (focusedRef.current = "horario")}
              onChange={(e) => setDraft((d) => ({ ...d, horario: e.target.value }))}
              onBlur={() => commit("horario")}
              className="h-8 w-28"
            />
            {editable && !locked && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onDelete(delivery.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Entregador</Label>
              <Input
                value={draft.entregador}
                disabled={!editable || locked}
                onFocus={() => (focusedRef.current = "entregador")}
                onChange={(e) => setDraft((d) => ({ ...d, entregador: e.target.value }))}
                onBlur={() => commit("entregador")}
                placeholder="Nome"
              />
            </div>
            <div>
              <Label className="text-xs">Endereço</Label>
              <Input
                value={draft.endereco}
                disabled={!editable || locked}
                onFocus={() => (focusedRef.current = "endereco")}
                onChange={(e) => setDraft((d) => ({ ...d, endereco: e.target.value }))}
                onBlur={() => commit("endereco")}
                placeholder="Rua, número, bairro"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Pagamento (R$)</Label>
              <Input
                type="number"
                step="0.01"
                inputMode="decimal"
                value={draft.pagamento}
                disabled={!editable || locked}
                onFocus={() => (focusedRef.current = "pagamento")}
                onChange={(e) => setDraft((d) => ({ ...d, pagamento: e.target.value }))}
                onBlur={() => commit("pagamento")}
                placeholder="0,00"
              />
            </div>
            <div>
              <Label className="text-xs">Taxa (R$)</Label>
              <Input
                type="number"
                step="0.01"
                inputMode="decimal"
                value={draft.taxa}
                disabled={!editable || locked}
                onFocus={() => (focusedRef.current = "taxa")}
                onChange={(e) => setDraft((d) => ({ ...d, taxa: e.target.value }))}
                onBlur={() => commit("taxa")}
                placeholder="0,00"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Forma de pagamento</Label>
            <Select
              value={delivery.payment_method ?? ""}
              disabled={!editable || locked}
              onValueChange={(v) => onPatch(delivery.id, { payment_method: v } as any)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credito">Crédito</SelectItem>
                <SelectItem value="debito">Débito</SelectItem>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="pix">Pix</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-3 pt-1 border-t">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={delivery.tem_receita}
                disabled={!editable || locked}
                onCheckedChange={(v) =>
                  onPatch(delivery.id, {
                    tem_receita: !!v,
                    ...(v ? {} : { receita_ok: false }),
                  } as any)
                }
              />
              <Receipt className="h-4 w-4 text-primary" /> Tem receita
            </label>
            {delivery.tem_receita && (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={delivery.receita_ok}
                  disabled={!editable || locked}
                  onCheckedChange={(v) => onPatch(delivery.id, { receita_ok: !!v } as any)}
                />
                Receita entregue
              </label>
            )}
          </div>

          {editable && !locked && (
            <Button
              className="w-full"
              variant={delivery.ok ? "outline" : "default"}
              onClick={() => {
                onPatch(delivery.id, { ok: !delivery.ok } as any);
                if (!delivery.ok) setOpen(false);
              }}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {delivery.ok ? "Desmarcar OK" : "Confirmar pedido (OK)"}
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}

/* ---------------- Board ---------------- */

export const UltraDeliveriesBoard = ({
  editable = true,
  allowDateChange = false,
  sentOnly = false,
}: Props) => {
  const today = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(today);
  const { data: deliveries = [], isLoading } = useUltraDeliveries(selectedDate, { sentOnly });
  const createMut = useCreateUltraDelivery();
  const updateMut = useUpdateUltraDelivery();
  const deleteMut = useDeleteUltraDelivery();
  const sendMut = useSendUltraDayToCentral();
  const [toDelete, setToDelete] = useState<string | null>(null);

  const nextPos = useMemo(
    () => (deliveries.length ? Math.max(...deliveries.map((d) => d.position)) + 1 : 1),
    [deliveries]
  );

  const totals = useMemo(() => {
    const t = { pagamento: 0, taxa: 0, entregues: 0, receitas: 0 };
    for (const d of deliveries) {
      t.pagamento += Number(d.pagamento || 0);
      t.taxa += Number(d.taxa || 0);
      if (d.ok) t.entregues += 1;
      if (d.tem_receita) t.receitas += 1;
    }
    return t;
  }, [deliveries]);

  const alreadySent = deliveries.length > 0 && deliveries.every((d) => d.sent_to_central);
  const canSend = editable && deliveries.length > 0 && !alreadySent;

  const addRow = () => {
    const now = new Date();
    createMut.mutate({
      delivery_date: selectedDate,
      position: nextPos,
      horario: format(now, "HH:mm"),
    });
  };

  const patch = (id: string, p: Partial<UltraDelivery>) => updateMut.mutate({ id, patch: p });

  const sendToCentral = () => {
    const missingOk = deliveries.filter((d) => !d.ok).length;
    if (missingOk > 0) {
      toast.warning(`${missingOk} pedido(s) sem OK`, {
        description: "Confirme todos os pedidos antes de enviar.",
      });
      return;
    }
    sendMut.mutate(selectedDate);
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-4 print:space-y-2">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
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
              {format(new Date(selectedDate + "T12:00:00"), "dd 'de' MMMM 'de' yyyy", {
                locale: ptBR,
              })}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {editable && !alreadySent && (
            <Button onClick={addRow} disabled={createMut.isPending} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Nova entrega
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handlePrint} disabled={!deliveries.length}>
            <Printer className="h-4 w-4 mr-1" /> Imprimir
          </Button>
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:flex print:flex-col print:items-center print:gap-2 print:mb-3">
        <img src={ultraLogo.url} alt="ULTRA" className="h-16 w-auto" />
        <h2 className="text-xl font-bold">
          Relatório ULTRA — {format(new Date(selectedDate + "T12:00:00"), "dd/MM/yyyy")}
        </h2>
      </div>

      {/* On-screen small centered logo */}
      <div className="flex justify-center print:hidden">
        <img
          src={ultraLogo.url}
          alt="ULTRA"
          className="h-14 w-14 rounded-lg shadow-sm object-cover"
        />
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Card><CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Corridas</p>
          <p className="text-xl font-bold">{deliveries.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Entregues (OK)</p>
          <p className="text-xl font-bold text-success">{totals.entregues}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Total pagamento</p>
          <p className="text-lg font-bold">{fmtMoney(totals.pagamento)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Total taxa</p>
          <p className="text-lg font-bold">{fmtMoney(totals.taxa)}</p>
        </CardContent></Card>
      </div>

      {alreadySent && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="p-3 flex items-center gap-2 text-sm">
            <Lock className="h-4 w-4 text-primary" />
            <span>Relatório do dia já foi enviado para a central. Registros bloqueados.</span>
          </CardContent>
        </Card>
      )}

      {/* Rows */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : deliveries.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          {editable
            ? <>Nenhuma entrega registrada. Toque em <span className="font-medium">Nova entrega</span>.</>
            : "Nenhum relatório recebido para esta data."}
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {deliveries.map((d) => (
            <DeliveryRow
              key={d.id}
              delivery={d}
              editable={editable}
              onPatch={patch}
              onDelete={(id) => setToDelete(id)}
            />
          ))}
        </div>
      )}

      {/* Send to central */}
      {editable && (
        <div className="print:hidden pt-2">
          <Button
            className="w-full"
            size="lg"
            onClick={sendToCentral}
            disabled={!canSend || sendMut.isPending}
          >
            <Send className="h-5 w-5 mr-2" />
            {alreadySent ? "Já enviado" : "Enviar para a central"}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Após o envio, o relatório fica disponível para Carlos e Secretaria.
          </p>
        </div>
      )}

      <DeleteConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) {
            await deleteMut.mutateAsync(toDelete);
            setToDelete(null);
          }
        }}
        title="Remover entrega"
        description="Tem certeza que deseja remover esta entrega?"
        isLoading={deleteMut.isPending}
      />
    </div>
  );
};