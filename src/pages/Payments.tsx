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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreditCard, CheckCircle2, Clock, Search, MoreHorizontal, Check, Trash2, Loader2, Plus } from "lucide-react";
import { usePayments, useMarkPaymentAsPaid, useDeletePayment } from "@/hooks/usePayments";
import { PaymentFormDialog } from "@/components/payments/PaymentFormDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Payments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const { data: payments, isLoading } = usePayments();
  const markAsPaid = useMarkPaymentAsPaid();
  const deletePayment = useDeletePayment();

  const filteredPayments = (payments || []).filter((p) => {
    const motoboyName = p.motoboys?.name || '';
    const matchesSearch = motoboyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paidPayments = (payments || []).filter(p => p.status === "paid");
  const pendingPayments = (payments || []).filter(p => p.status === "pending");
  const totalPaid = paidPayments.reduce((acc, p) => acc + Number(p.value), 0);
  const totalPending = pendingPayments.reduce((acc, p) => acc + Number(p.value), 0);

  const handleMarkAsPaid = async (id: string) => {
    await markAsPaid.mutateAsync(id);
  };

  const handleDeleteClick = (id: string) => {
    setPaymentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (paymentToDelete) {
      await deletePayment.mutateAsync(paymentToDelete);
      setDeleteDialogOpen(false);
      setPaymentToDelete(null);
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

  const formatPeriod = (start: string, end: string) => {
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  return (
    <MainLayout title="Pagamentos" subtitle="Controle de pagamentos semanais">
      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <StatCard
          title="Total de Pagamentos"
          value={formatCurrency(totalPaid + totalPending)}
          icon={<CreditCard className="h-6 w-6 text-primary" />}
        />
        <StatCard
          title="Pagamentos Realizados"
          value={formatCurrency(totalPaid)}
          icon={<CheckCircle2 className="h-6 w-6 text-success" />}
          variant="success"
        />
        <StatCard
          title="Pagamentos em Aberto"
          value={formatCurrency(totalPending)}
          icon={<Clock className="h-6 w-6 text-warning" />}
          variant="warning"
        />
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar motoboy..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="pending">Em aberto</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Registrar Pagamento
        </Button>
      </div>

      {/* Table */}
      <div className="data-table">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {payments?.length === 0 
              ? "Nenhum pagamento registrado."
              : "Nenhum pagamento encontrado com os filtros aplicados."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Motoboy</TableHead>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pago em</TableHead>
                <TableHead className="w-[70px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id} className="border-border">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-sm font-medium text-primary">
                          {payment.motoboys?.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                        </span>
                      </div>
                      {payment.motoboys?.name || "Motoboy não encontrado"}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatPeriod(payment.period_start, payment.period_end)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(Number(payment.value))}
                  </TableCell>
                  <TableCell>
                    <BadgeStatus status={payment.status === "paid" ? "success" : "warning"}>
                      {payment.status === "paid" ? "Pago" : "Em aberto"}
                    </BadgeStatus>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.paid_at ? formatDate(payment.paid_at) : "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {payment.status === "pending" && (
                          <DropdownMenuItem onClick={() => handleMarkAsPaid(payment.id)}>
                            <Check className="mr-2 h-4 w-4" />
                            Marcar como pago
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteClick(payment.id)}
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
        Mostrando {filteredPayments.length} de {payments?.length || 0} pagamentos
      </div>

      {/* Payment Form Dialog */}
      <PaymentFormDialog open={formOpen} onOpenChange={setFormOpen} />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Excluir Pagamento"
        description="Tem certeza que deseja excluir este pagamento? Esta ação não pode ser desfeita."
        isLoading={deletePayment.isPending}
      />
    </MainLayout>
  );
};

export default Payments;
