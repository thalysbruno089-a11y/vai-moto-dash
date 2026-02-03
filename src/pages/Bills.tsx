import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import StatCard from "@/components/dashboard/StatCard";
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
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  MoreHorizontal, 
  Check, 
  X, 
  Plus, 
  Trash2, 
  Loader2, 
  Edit 
} from "lucide-react";
import { useBills, useMarkBillAsPaid, useUpdateBill, useDeleteBill, Bill } from "@/hooks/useBills";
import { BillFormDialog } from "@/components/bills/BillFormDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Bills = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [installmentParent, setInstallmentParent] = useState<Bill | null>(null);

  const { data: bills, isLoading } = useBills();
  const markAsPaid = useMarkBillAsPaid();
  const updateBill = useUpdateBill();
  const deleteBill = useDeleteBill();

  const filteredBills = (bills || []).filter((b) => {
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paidBills = (bills || []).filter(b => b.status === "paid");
  const pendingBills = (bills || []).filter(b => b.status === "pending");
  const overdueBills = (bills || []).filter(b => b.status === "overdue");
  
  const totalPaid = paidBills.reduce((acc, b) => acc + Number(b.value), 0);
  const totalPending = pendingBills.reduce((acc, b) => acc + Number(b.value), 0);
  const totalOverdue = overdueBills.reduce((acc, b) => acc + Number(b.value), 0);

  const handleMarkAsPaid = async (bill: Bill) => {
    await markAsPaid.mutateAsync(bill);
  };

  const handleMarkAsNotPaid = async (bill: Bill) => {
    // Check if due date is in the past to determine correct status
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(bill.due_date + 'T00:00:00');
    const newStatus = dueDate < today ? 'overdue' : 'pending';
    await updateBill.mutateAsync({ id: bill.id, status: newStatus });
  };

  const handleEditClick = (bill: Bill) => {
    setEditingBill(bill);
    setInstallmentParent(null);
    setFormOpen(true);
  };

  const handleAddInstallment = (bill: Bill) => {
    setEditingBill(null);
    setInstallmentParent(bill);
    setFormOpen(true);
  };

  const handleNewBill = () => {
    setEditingBill(null);
    setInstallmentParent(null);
    setFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setBillToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (billToDelete) {
      await deleteBill.mutateAsync(billToDelete);
      setDeleteDialogOpen(false);
      setBillToDelete(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    // Handle both YYYY-MM-DD and ISO timestamp formats
    const datePart = dateStr.split('T')[0].split(' ')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return "-";
    const localDate = new Date(year, month - 1, day);
    return format(localDate, "dd/MM/yyyy", { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <BadgeStatus status="success">Pago</BadgeStatus>;
      case 'pending':
        return <BadgeStatus status="warning">Pendente</BadgeStatus>;
      case 'overdue':
        return <BadgeStatus status="error">Atrasado</BadgeStatus>;
      default:
        return null;
    }
  };

  const getNextInstallmentNumber = (bill: Bill) => {
    const relatedBills = (bills || []).filter(
      b => b.parent_bill_id === bill.id || b.id === bill.parent_bill_id || b.parent_bill_id === bill.parent_bill_id
    );
    return relatedBills.length + 2;
  };

  return (
    <MainLayout title="Contas a Pagar" subtitle="Gerencie suas contas e receba lembretes">
      {/* Stats */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3 mb-6 sm:mb-8">
        <StatCard
          title="Total Pendente"
          value={formatCurrency(totalPending)}
          icon={<Clock className="h-6 w-6 text-warning" />}
          variant="warning"
        />
        <StatCard
          title="Total Pago"
          value={formatCurrency(totalPaid)}
          icon={<CheckCircle2 className="h-6 w-6 text-success" />}
          variant="success"
        />
        <StatCard
          title="Total Atrasado"
          value={formatCurrency(totalOverdue)}
          icon={<AlertTriangle className="h-6 w-6 text-destructive" />}
          variant="destructive"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative flex-1 min-w-0 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar conta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="overdue">Atrasado</SelectItem>
          </SelectContent>
        </Select>

        <div className="hidden sm:flex sm:flex-1" />

        <Button onClick={handleNewBill} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      {/* Table */}
      <div className="data-table">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {bills?.length === 0 
              ? "Nenhuma conta cadastrada."
              : "Nenhuma conta encontrada com os filtros aplicados."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Nome</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pago em</TableHead>
                <TableHead className="w-[70px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBills.map((bill) => (
                <TableRow key={bill.id} className="border-border">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                        <Bell className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <span>{bill.name}</span>
                        {bill.installment_number && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Parcela {bill.installment_number}
                          </Badge>
                        )}
                        {bill.is_fixed && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Fixa
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(bill.due_date)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(Number(bill.value))}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(bill.status)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {bill.paid_at ? formatDate(bill.paid_at) : "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {(bill.status === "pending" || bill.status === "overdue") && (
                          <DropdownMenuItem onClick={() => handleMarkAsPaid(bill)}>
                            <Check className="mr-2 h-4 w-4" />
                            Marcar como pago
                          </DropdownMenuItem>
                        )}
                        {bill.status === "pending" && (
                          <DropdownMenuItem onClick={() => handleMarkAsNotPaid(bill)}>
                            <X className="mr-2 h-4 w-4" />
                            Não pago
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleAddInstallment(bill)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar parcela
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditClick(bill)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteClick(bill.id)}
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
        Mostrando {filteredBills.length} de {bills?.length || 0} contas
      </div>

      {/* Bill Form Dialog */}
      <BillFormDialog 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        bill={editingBill}
        parentBill={installmentParent}
        installmentNumber={installmentParent ? getNextInstallmentNumber(installmentParent) : undefined}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Excluir Conta"
        description="Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita."
        isLoading={deleteBill.isPending}
      />
    </MainLayout>
  );
};

export default Bills;
