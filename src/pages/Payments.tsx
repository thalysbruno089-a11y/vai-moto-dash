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
import { CreditCard, CheckCircle2, Clock, Plus, Search, MoreHorizontal, Check, Eye } from "lucide-react";

interface Payment {
  id: string;
  motorcyclist: string;
  period: string;
  deliveries: number;
  amount: string;
  status: "paid" | "pending";
  paidAt?: string;
}

const mockPayments: Payment[] = [
  { id: "1", motorcyclist: "João Silva", period: "13/01 - 19/01/2025", deliveries: 45, amount: "R$ 1.350,00", status: "paid", paidAt: "19/01/2025" },
  { id: "2", motorcyclist: "Carlos Santos", period: "13/01 - 19/01/2025", deliveries: 38, amount: "R$ 1.140,00", status: "pending" },
  { id: "3", motorcyclist: "Pedro Lima", period: "13/01 - 19/01/2025", deliveries: 52, amount: "R$ 1.560,00", status: "pending" },
  { id: "4", motorcyclist: "Ana Costa", period: "13/01 - 19/01/2025", deliveries: 61, amount: "R$ 1.830,00", status: "paid", paidAt: "19/01/2025" },
  { id: "5", motorcyclist: "Lucas Oliveira", period: "13/01 - 19/01/2025", deliveries: 29, amount: "R$ 870,00", status: "pending" },
  { id: "6", motorcyclist: "Maria Souza", period: "06/01 - 12/01/2025", deliveries: 41, amount: "R$ 1.230,00", status: "paid", paidAt: "12/01/2025" },
  { id: "7", motorcyclist: "Bruno Almeida", period: "06/01 - 12/01/2025", deliveries: 35, amount: "R$ 1.050,00", status: "paid", paidAt: "12/01/2025" },
];

const Payments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredPayments = mockPayments.filter((p) => {
    const matchesSearch = p.motorcyclist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paidPayments = mockPayments.filter(p => p.status === "paid");
  const pendingPayments = mockPayments.filter(p => p.status === "pending");
  const totalPaid = paidPayments.reduce((acc, p) => acc + parseFloat(p.amount.replace(/[^\d,]/g, '').replace(',', '.')), 0);
  const totalPending = pendingPayments.reduce((acc, p) => acc + parseFloat(p.amount.replace(/[^\d,]/g, '').replace(',', '.')), 0);

  return (
    <MainLayout title="Pagamentos" subtitle="Controle de pagamentos semanais">
      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <StatCard
          title="Total de Pagamentos"
          value={`R$ ${(totalPaid + totalPending).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<CreditCard className="h-6 w-6 text-primary" />}
        />
        <StatCard
          title="Pagamentos Realizados"
          value={`R$ ${totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<CheckCircle2 className="h-6 w-6 text-success" />}
          variant="success"
        />
        <StatCard
          title="Pagamentos em Aberto"
          value={`R$ ${totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
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

        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os períodos</SelectItem>
            <SelectItem value="current">Semana atual</SelectItem>
            <SelectItem value="last">Semana passada</SelectItem>
          </SelectContent>
        </Select>

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

        <div className="flex-1" />

        <Button variant="outline">
          Gerar Pagamentos Semanais
        </Button>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Registrar Pagamento
        </Button>
      </div>

      {/* Table */}
      <div className="data-table">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Motoboy</TableHead>
              <TableHead>Período</TableHead>
              <TableHead className="text-right">Entregas</TableHead>
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
                        {payment.motorcyclist.split(" ").map(n => n[0]).join("")}
                      </span>
                    </div>
                    {payment.motorcyclist}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{payment.period}</TableCell>
                <TableCell className="text-right">{payment.deliveries}</TableCell>
                <TableCell className="text-right font-semibold">{payment.amount}</TableCell>
                <TableCell>
                  <BadgeStatus status={payment.status === "paid" ? "success" : "warning"}>
                    {payment.status === "paid" ? "Pago" : "Em aberto"}
                  </BadgeStatus>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {payment.paidAt || "-"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalhes
                      </DropdownMenuItem>
                      {payment.status === "pending" && (
                        <DropdownMenuItem>
                          <Check className="mr-2 h-4 w-4" />
                          Marcar como pago
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="mt-4 text-sm text-muted-foreground">
        Mostrando {filteredPayments.length} de {mockPayments.length} pagamentos
      </div>
    </MainLayout>
  );
};

export default Payments;
