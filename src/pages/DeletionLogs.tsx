import { useState, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const TABLE_LABELS: Record<string, string> = {
  motoboys: "Motoboy",
  clients: "Cliente",
  bills: "Conta",
  cash_flow: "Fluxo de Caixa",
  rides: "Corrida",
  carlos_bank_transactions: "Banco do Carlos",
  client_pix_requests: "Solicitação PIX",
  motorcycle_expenses: "Despesa de Moto",
  categories: "Categoria",
  orders: "Pedido",
  payments: "Pagamento",
  motoboy_payment_history: "Pagamento de Motoboy",
};

interface DeletionLog {
  id: string;
  table_name: string;
  record_id: string | null;
  record_label: string | null;
  record_data: any;
  deleted_by: string | null;
  deleted_by_name: string | null;
  deleted_at: string;
}

const DeletionLogs = () => {
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState("all");
  const [selected, setSelected] = useState<DeletionLog | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["deletion-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deletion_logs")
        .select("*")
        .order("deleted_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as DeletionLog[];
    },
  });

  const filtered = useMemo(() => {
    return (data || []).filter((d) => {
      if (tableFilter !== "all" && d.table_name !== tableFilter) return false;
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        (d.record_label || "").toLowerCase().includes(s) ||
        (d.deleted_by_name || "").toLowerCase().includes(s) ||
        (TABLE_LABELS[d.table_name] || d.table_name).toLowerCase().includes(s)
      );
    });
  }, [data, search, tableFilter]);

  return (
    <MainLayout title="Histórico de Exclusões" subtitle="Tudo que foi apagado e por quem">
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou usuário..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={tableFilter} onValueChange={setTableFilter}>
          <SelectTrigger className="sm:w-[220px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(TABLE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="data-table">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nada apagado ainda.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Quando</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Apagado por</TableHead>
                <TableHead className="w-[80px]">Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log) => (
                <TableRow key={log.id} className="border-border">
                  <TableCell className="whitespace-nowrap text-sm">
                    {format(new Date(log.deleted_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {TABLE_LABELS[log.table_name] || log.table_name}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{log.record_label || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{log.deleted_by_name || "Desconhecido"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(log)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dados apagados</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">Tipo:</span> {TABLE_LABELS[selected.table_name] || selected.table_name}</div>
              <div><span className="text-muted-foreground">Item:</span> {selected.record_label || "—"}</div>
              <div><span className="text-muted-foreground">Apagado por:</span> {selected.deleted_by_name || "Desconhecido"}</div>
              <div><span className="text-muted-foreground">Quando:</span> {format(new Date(selected.deleted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>
              <div className="mt-3">
                <p className="text-muted-foreground mb-1">Conteúdo completo:</p>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{JSON.stringify(selected.record_data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default DeletionLogs;
