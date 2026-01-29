import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import StatCard from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BadgeStatus } from "@/components/ui/badge-status";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { useCashFlow, useDeleteCashFlow, CashFlowWithCategory } from "@/hooks/useCashFlow";
import { CashFlowFormDialog } from "@/components/cashflow/CashFlowFormDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type FlowType = Database['public']['Enums']['flow_type'];

const CashFlow = () => {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CashFlowWithCategory | null>(null);
  const [defaultType, setDefaultType] = useState<FlowType>('revenue');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  const { data: entries, isLoading } = useCashFlow();
  const deleteCashFlow = useDeleteCashFlow();

  const filteredEntries = (entries || []).filter((t) => {
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    return matchesType;
  });

  const incomeTotal = (entries || [])
    .filter(t => t.type === "revenue")
    .reduce((acc, t) => acc + Number(t.value), 0);
  
  const expenseTotal = (entries || [])
    .filter(t => t.type === "expense")
    .reduce((acc, t) => acc + Number(t.value), 0);

  const balance = incomeTotal - expenseTotal;

  const handleEdit = (entry: CashFlowWithCategory) => {
    setSelectedEntry(entry);
    setFormOpen(true);
  };

  const handleCreate = (type: FlowType) => {
    setSelectedEntry(null);
    setDefaultType(type);
    setFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setEntryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (entryToDelete) {
      await deleteCashFlow.mutateAsync(entryToDelete);
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <MainLayout title="Fluxo de Caixa" subtitle="Controle financeiro completo">
      {/* Stats */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
        <StatCard
          title="Saldo Atual"
          value={formatCurrency(balance)}
          icon={<Wallet className="h-6 w-6 text-primary-foreground" />}
          variant="primary"
        />
        <StatCard
          title="Total de Entradas"
          value={formatCurrency(incomeTotal)}
          icon={<TrendingUp className="h-6 w-6 text-success-foreground" />}
          variant="success"
        />
        <StatCard
          title="Total de Saídas"
          value={formatCurrency(expenseTotal)}
          icon={<TrendingDown className="h-6 w-6 text-destructive-foreground" />}
          variant="destructive"
        />
        <StatCard
          title="Balanço"
          value={formatCurrency(balance)}
          icon={<PiggyBank className="h-6 w-6 text-primary" />}
          trend={{ value: "12%", positive: balance > 0 }}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:flex-wrap">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="revenue">Entradas</SelectItem>
            <SelectItem value="expense">Saídas</SelectItem>
          </SelectContent>
        </Select>

        <div className="hidden sm:flex sm:flex-1" />

        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => handleCreate('expense')} className="flex-1 sm:flex-initial">
            <TrendingDown className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Nova Saída</span>
            <span className="sm:hidden">Saída</span>
          </Button>
          <Button onClick={() => handleCreate('revenue')} className="flex-1 sm:flex-initial">
            <TrendingUp className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Nova Entrada</span>
            <span className="sm:hidden">Entrada</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="data-table">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {entries?.length === 0 
              ? "Nenhum lançamento cadastrado. Clique em 'Nova Entrada' ou 'Nova Saída' para começar."
              : "Nenhum lançamento encontrado com os filtros aplicados."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Recorrente</TableHead>
                <TableHead className="w-[70px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id} className="border-border">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        entry.type === "revenue" ? "bg-success/10" : "bg-destructive/10"
                      }`}>
                        {entry.type === "revenue" ? (
                          <ArrowUpRight className="h-5 w-5 text-success" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                      {entry.description || "Sem descrição"}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.categories?.name || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(entry.flow_date)}
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${
                    entry.type === "revenue" ? "text-success" : "text-destructive"
                  }`}>
                    {entry.type === "revenue" ? "+" : "-"} {formatCurrency(Number(entry.value))}
                  </TableCell>
                  <TableCell>
                    {entry.is_recurring ? (
                      <BadgeStatus status="active">Sim</BadgeStatus>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(entry)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteClick(entry.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Summary */}
      <div className="mt-4 text-sm text-muted-foreground">
        Mostrando {filteredEntries.length} lançamentos
      </div>

      {/* Form Dialog */}
      <CashFlowFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        entry={selectedEntry}
        defaultType={defaultType}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Excluir Lançamento"
        description="Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita."
        isLoading={deleteCashFlow.isPending}
      />
    </MainLayout>
  );
};

export default CashFlow;
