import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Power, Loader2, DollarSign, CheckCircle, XCircle } from "lucide-react";
import { useMotoboys, useDeleteMotoboy, useUpdateMotoboy, Motoboy } from "@/hooks/useMotoboys";
import { MotoboyFormDialog } from "@/components/motoboys/MotoboyFormDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { Database } from "@/integrations/supabase/types";

type ShiftType = Database['public']['Enums']['shift_type'];

const shiftLabels: Record<ShiftType, string> = {
  day: 'Diurno',
  night: 'Noturno',
  weekend: 'Final de Semana',
  star: 'Estrelinha',
  free: 'Free',
};

const shiftColors: Record<ShiftType, string> = {
  day: "bg-orange-500/10 text-orange-600",
  night: "bg-gray-900/10 text-gray-900 dark:bg-gray-100/10 dark:text-gray-100",
  weekend: "bg-blue-500/10 text-blue-600",
  star: "bg-green-500/10 text-green-600",
  free: "bg-purple-500/10 text-purple-600",
};

const Motorcyclists = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [shiftFilter, setShiftFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedMotoboy, setSelectedMotoboy] = useState<Motoboy | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [motoboyToDelete, setMotoboyToDelete] = useState<string | null>(null);

  const { data: motoboys, isLoading } = useMotoboys();
  const deleteMotoboy = useDeleteMotoboy();
  const updateMotoboy = useUpdateMotoboy();

  const filteredMotoboys = (motoboys || [])
    .filter((m) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = m.name.toLowerCase().includes(searchLower) || 
        (m.number && m.number.toLowerCase().includes(searchLower));
      const matchesShift = shiftFilter === "all" || m.shift === shiftFilter;
      const matchesStatus = statusFilter === "all" || m.status === statusFilter;
      return matchesSearch && matchesShift && matchesStatus;
    })
    .sort((a, b) => {
      const numA = parseInt(a.number || '999999', 10);
      const numB = parseInt(b.number || '999999', 10);
      return numA - numB;
    });

  // Calculate totals by shift for active motoboys
  const shiftTotals = Object.keys(shiftLabels).reduce((acc, shift) => {
    const activeMotoboysInShift = (motoboys || []).filter(
      m => m.shift === shift && m.status === 'active'
    );
    const total = activeMotoboysInShift.reduce(
      (sum, m) => sum + (Number((m as any).weekly_payment) || 0), 
      0
    );
    acc[shift as ShiftType] = { count: activeMotoboysInShift.length, total };
    return acc;
  }, {} as Record<ShiftType, { count: number; total: number }>);

  // Calculate filtered totals
  const filteredTotal = filteredMotoboys
    .filter(m => m.status === 'active')
    .reduce((sum, m) => sum + (Number((m as any).weekly_payment) || 0), 0);

  const handleEdit = (motoboy: Motoboy) => {
    setSelectedMotoboy(motoboy);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedMotoboy(null);
    setFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setMotoboyToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (motoboyToDelete) {
      await deleteMotoboy.mutateAsync(motoboyToDelete);
      setDeleteDialogOpen(false);
      setMotoboyToDelete(null);
    }
  };

  const handleToggleStatus = async (motoboy: Motoboy) => {
    await updateMotoboy.mutateAsync({
      id: motoboy.id,
      status: motoboy.status === 'active' ? 'inactive' : 'active',
    });
  };

  const handleTogglePaymentStatus = async (motoboy: Motoboy) => {
    const currentStatus = (motoboy as any).payment_status || 'pending';
    await updateMotoboy.mutateAsync({
      id: motoboy.id,
      payment_status: currentStatus === 'paid' ? 'pending' : 'paid',
    });
  };

  return (
    <MainLayout title="Motoboys" subtitle="Gerencie sua equipe de entregadores">
      {/* Filters */}
      <div className="filter-bar">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou número..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={shiftFilter} onValueChange={setShiftFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Turno" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os turnos</SelectItem>
            {Object.entries(shiftLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Motoboy
        </Button>
      </div>

      {/* Shift Totals Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {Object.entries(shiftLabels).map(([shift, label]) => {
          const data = shiftTotals[shift as ShiftType] || { count: 0, total: 0 };
          const isSelected = shiftFilter === shift;
          return (
            <button
              key={shift}
              onClick={() => setShiftFilter(isSelected ? "all" : shift)}
              className={`p-3 rounded-lg border text-left transition-all ${
                isSelected 
                  ? 'border-primary bg-primary/10 ring-2 ring-primary' 
                  : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
              </div>
              <div className="text-lg font-bold">
                {data.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <div className="text-xs text-muted-foreground">
                {data.count} motoboy{data.count !== 1 ? 's' : ''} ativo{data.count !== 1 ? 's' : ''}
              </div>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="data-table">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredMotoboys.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {motoboys?.length === 0 
              ? "Nenhum motoboy cadastrado. Clique em 'Novo Motoboy' para começar."
              : "Nenhum motoboy encontrado com os filtros aplicados."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Nº</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Valor Semanal</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="w-[70px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMotoboys.map((motoboy) => (
                <TableRow key={motoboy.id} className="border-border">
                  <TableCell className="font-medium">
                    {(motoboy as any).number || "-"}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-sm font-medium text-primary">
                          {motoboy.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </span>
                      </div>
                      {motoboy.name}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-primary">
                    {Number((motoboy as any).weekly_payment || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${shiftColors[motoboy.shift]}`}>
                      {shiftLabels[motoboy.shift]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <BadgeStatus status={motoboy.status === "active" ? "active" : "inactive"}>
                      {motoboy.status === "active" ? "Ativo" : "Inativo"}
                    </BadgeStatus>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      (motoboy as any).payment_status === 'paid' 
                        ? 'bg-success/10 text-success' 
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      {(motoboy as any).payment_status === 'paid' ? (
                        <><CheckCircle className="h-3 w-3" /> Pago</>
                      ) : (
                        <><XCircle className="h-3 w-3" /> Não Pago</>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(motoboy)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTogglePaymentStatus(motoboy)}>
                          {(motoboy as any).payment_status === 'paid' ? (
                            <><XCircle className="mr-2 h-4 w-4" /> Marcar Não Pago</>
                          ) : (
                            <><CheckCircle className="mr-2 h-4 w-4" /> Marcar Pago</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(motoboy)}>
                          <Power className="mr-2 h-4 w-4" />
                          {motoboy.status === "active" ? "Desativar" : "Ativar"}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteClick(motoboy.id)}
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
      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>Mostrando {filteredMotoboys.length} de {motoboys?.length || 0} motoboys</span>
        <span className="font-medium text-foreground">
          Total semanal (ativos filtrados): {filteredTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      </div>

      {/* Form Dialog */}
      <MotoboyFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        motoboy={selectedMotoboy}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Excluir Motoboy"
        description="Tem certeza que deseja excluir este motoboy? Esta ação não pode ser desfeita."
        isLoading={deleteMotoboy.isPending}
      />
    </MainLayout>
  );
};

export default Motorcyclists;
